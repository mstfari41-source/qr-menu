// Orders and waiter calls, with live updates (Server-Sent Events) per business.
import { db, getBusiness, getDoc, getMenu } from "./db.mjs";
import { HttpError, text } from "./http.mjs";

const DAY = 24 * 60 * 60 * 1000;
const CALL_COOLDOWN = 60 * 1000; // a table can call a waiter once a minute

const orderOut = (r) => ({
  id: r.id,
  no: r.no,
  table: r.table_no,
  lines: JSON.parse(r.lines),
  note: r.note,
  total: r.total,
  status: r.status,
  source: r.source,
  byWaiter: r.by_waiter ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const callOut = (r) => ({
  id: r.id,
  table: r.table_no,
  status: r.status,
  handledBy: r.handled_by,
  createdAt: r.created_at,
  answeredAt: r.answered_at,
  doneAt: r.done_at,
});

const q = {
  orders: db.prepare("SELECT * FROM orders WHERE business = ? AND created_at > ? AND status != 'cancelled' ORDER BY created_at"),
  sales: db.prepare("SELECT * FROM orders WHERE business = ? AND created_at > ? AND status IN ('delivered', 'cancelled') ORDER BY created_at DESC"),
  calls: db.prepare("SELECT * FROM calls WHERE business = ? AND created_at > ? ORDER BY created_at"),
  order: db.prepare("SELECT * FROM orders WHERE id = ? AND business = ?"),
  call: db.prepare("SELECT * FROM calls WHERE id = ? AND business = ?"),
  nextNo: db.prepare("SELECT COALESCE(MAX(no), 1000) + 1 AS no FROM orders WHERE business = ?"),
  addOrder: db.prepare(
    "INSERT INTO orders (business, no, table_no, lines, note, total, status, source, by_waiter, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ),
  setOrder: db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?"),
  openCall: db.prepare("SELECT * FROM calls WHERE business = ? AND table_no = ? AND status != 'done' ORDER BY id DESC LIMIT 1"),
  lastCall: db.prepare("SELECT created_at FROM calls WHERE business = ? AND table_no = ? ORDER BY id DESC LIMIT 1"),
  addCall: db.prepare("INSERT INTO calls (business, table_no, status, created_at) VALUES (?, ?, 'waiting', ?)"),
  setCall: db.prepare("UPDATE calls SET status = ?, handled_by = ?, answered_at = ?, done_at = ? WHERE id = ?"),
};

// --- live updates ---
const listeners = new Map(); // business -> Set<res>
export function publish(business, type, data) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of listeners.get(business) ?? []) res.write(msg);
}
setInterval(() => {
  for (const set of listeners.values()) for (const res of set) res.write(": ping\n\n");
}, 25 * 1000);

export function stream(req, res, business) {
  // no-transform keeps compression in the dev-server proxy from buffering the stream
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");
  if (!listeners.has(business)) listeners.set(business, new Set());
  listeners.get(business).add(res);
  req.on("close", () => listeners.get(business).delete(res));
}

export function snapshot(business) {
  const since = Date.now() - DAY;
  return { orders: q.orders.all(business, since).map(orderOut), calls: q.calls.all(business, since).map(callOut) };
}

// Finished and cancelled orders for the Satışlar page and the home page charts.
export function sales(business, days) {
  return q.sales.all(business, Date.now() - Math.min(Math.max(days, 1), 400) * DAY).map(orderOut);
}

const tableNo = (v, business) => {
  const n = Number(v);
  const max = getBusiness(business)?.tables || 999;
  if (!Number.isInteger(n) || n < 1 || n > max) throw new HttpError(400, "Geçersiz masa numarası.");
  return n;
};

// QR menu features the business has switched off (Canlı Servis / Menü Ayarları).
const feature = (business, name) => getDoc(business, "settings")?.features?.[name] !== false;
function open(business) {
  if (getBusiness(business)?.status === "suspended") throw new HttpError(403, "Bu işletme şu an hizmet vermiyor.");
}

// Drink sizes, as on the QR menu: Orta is the menu price, the others add this many ₺.
const SIZES = { k: { name: "Küçük", diff: -10 }, o: { name: "Orta", diff: 0 }, b: { name: "Büyük", diff: 15 } };
const SIZED = ["kahve", "icecek"];
// Offers strip samples on the QR menu (BeeCafe only for now): percent off a product, and combos.
const DEALS = { beecafe: { "tatli-cheesecake": 30 } };
const COMBOS = { beecafe: { "combo-latte-sutlac": { items: ["kahve-latte", "tatli-sutlac"], price: 189 } } };

// `waiter` is the name of the waiter taking the order at the table (signed in), or null for the QR menu.
export function createOrder(business, body, waiter) {
  open(business);
  if (!waiter && !feature(business, "cart")) throw new HttpError(403, "Şu an menüden sipariş alınmıyor; lütfen garsona söyleyin.");
  const table = tableNo(body.table, business);
  const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 50).map((l) => ({
    id: text(l.id, 120),
    name: text(l.name, 120),
    qty: Math.min(Math.max(Math.trunc(Number(l.qty)) || 0, 0), 99),
    price: Math.max(Number(l.price) || 0, 0),
    size: Object.hasOwn(SIZES, l.size) ? l.size : null,
  }));
  let valid = lines.filter((l) => (l.name || l.id) && l.qty > 0);
  // With a saved menu the server decides names and prices (a phone cannot change them).
  const menu = getMenu(business);
  if (menu) {
    const byId = new Map(menu.products.map((p) => [p.id, p]));
    const deals = DEALS[business] || {};
    const combos = COMBOS[business] || {};
    const live = (id) => {
      const p = byId.get(id);
      if (!p || p.active === false) throw new HttpError(409, "Menüde olmayan bir ürün var; menüyü yenileyin.");
      return p;
    };
    valid = valid.map((l) => {
      if (Object.hasOwn(combos, l.id)) {
        const c = combos[l.id];
        return { id: l.id, name: c.items.map((id) => live(id).name).join(" + "), qty: l.qty, price: c.price };
      }
      const p = live(l.id);
      const base = Object.hasOwn(deals, p.id) ? Math.round((Number(p.price) * (100 - deals[p.id])) / 100) : Number(p.price);
      const size = SIZED.includes(p.category) && l.size ? SIZES[l.size] : null;
      if (!size) return { id: p.id, name: p.name, qty: l.qty, price: base };
      return { id: p.id, name: `${p.name} (${size.name})`, qty: l.qty, price: Math.max(base + size.diff, 0) };
    });
  } else valid = valid.filter((l) => l.name);
  if (!valid.length) throw new HttpError(400, "Siparişte ürün yok.");
  // A waiter takes the order at the table: it goes straight to the kitchen.
  const status = waiter ? "preparing" : "new";
  const total = valid.reduce((s, l) => s + l.qty * l.price, 0);
  const now = Date.now();
  const { no } = q.nextNo.get(business);
  const { lastInsertRowid } = q.addOrder.run(business, no, table, JSON.stringify(valid), text(body.note, 200), total, status, waiter ? "waiter" : "qr", waiter || null, now, now);
  const order = orderOut(q.order.get(lastInsertRowid, business));
  publish(business, "order", order);
  return order;
}

const ORDER_NEXT = { new: ["preparing", "cancelled"], preparing: ["delivered", "cancelled"] };
export function updateOrder(business, id, status) {
  const row = q.order.get(id, business);
  if (!row) throw new HttpError(404, "Sipariş bulunamadı.");
  if (!(ORDER_NEXT[row.status] ?? []).includes(status)) throw new HttpError(409, "Sipariş bu duruma geçemez.");
  q.setOrder.run(status, Date.now(), id);
  const order = orderOut(q.order.get(id, business));
  publish(business, "order", order);
  return order;
}

export function createCall(business, body) {
  open(business);
  if (!feature(business, "waiter")) throw new HttpError(403, "Garson çağırma şu an kapalı.");
  const table = tableNo(body.table, business);
  // An open call for the table is reused instead of piling up.
  const existing = q.openCall.get(business, table);
  if (existing) return { call: callOut(existing), repeated: true };
  const last = q.lastCall.get(business, table);
  if (last && Date.now() - last.created_at < CALL_COOLDOWN) throw new HttpError(429, "Garson az önce çağrıldı.");
  const { lastInsertRowid } = q.addCall.run(business, table, Date.now());
  const call = callOut(q.call.get(lastInsertRowid, business));
  publish(business, "call", call);
  return { call };
}

export function updateCall(business, id, status, by) {
  const row = q.call.get(id, business);
  if (!row) throw new HttpError(404, "Çağrı bulunamadı.");
  if (!["handling", "done"].includes(status) || row.status === "done") throw new HttpError(409, "Çağrı bu duruma geçemez.");
  const now = Date.now();
  q.setCall.run(status, row.handled_by ?? (text(by, 80) || "Garson"), row.answered_at ?? now, status === "done" ? now : null, id);
  const call = callOut(q.call.get(id, business));
  publish(business, "call", call);
  return call;
}

export function renameBusiness(from, to) {
  db.prepare("UPDATE orders SET business = ? WHERE business = ?").run(to, from);
  db.prepare("UPDATE calls SET business = ? WHERE business = ?").run(to, from);
}
