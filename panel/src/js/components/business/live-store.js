import { products } from "./menu-data";
import { demoStaff } from "./staff";
import { TABLE_COUNT } from "./sales-data";
import { toast } from "./toast";
import { currentBusiness } from "../../routes";
import { bizApi, withKey } from "../../server";

// Live orders and waiter calls from the QR menu and the waiters, shared through the server.
// Without the server: demo data, with a new order or call simulated now and then.
const MIN = 60 * 1000;
const SIMULATE_EVERY = 45 * 1000;
const ESCALATE_AFTER = 5 * MIN;

// Two working stages keep the board simple: new → preparing → delivered.
export const orderSteps = [
  { id: "new", name: "Yeni", action: "Hazırlamaya Başla", next: "preparing" },
  { id: "preparing", name: "Hazırlanıyor", action: "Teslim Edildi", next: "delivered" },
  { id: "delivered", name: "Teslim Edildi", action: null, next: null },
];

const notes = ["", "", "", "Az şekerli olsun", "Soğan olmasın", "Acele lütfen", "Paket olsun"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const randomTable = () => 1 + Math.floor(Math.random() * TABLE_COUNT);

let orderNo = 2140;
let callNo = 1;

function makeOrder(status, minutesAgo, table = randomTable()) {
  const lines = [];
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const p = pick(products);
    const existing = lines.find((l) => l.id === p.id);
    if (existing) existing.qty++;
    else lines.push({ id: p.id, name: p.name, qty: 1 + Math.floor(Math.random() * 2), price: p.price });
  }
  const createdAt = Date.now() - minutesAgo * MIN;
  return {
    id: `o${++orderNo}`,
    no: orderNo,
    table,
    lines,
    note: pick(notes),
    total: lines.reduce((s, l) => s + l.qty * l.price, 0),
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

function makeCall(status, minutesAgo, table = randomTable()) {
  const createdAt = Date.now() - minutesAgo * MIN;
  const call = { id: `c${callNo++}`, table, status, createdAt, handledBy: null, answeredAt: null, doneAt: null };
  if (status !== "waiting") {
    call.handledBy = ownersFor(table)[0]?.name ?? "Garson";
    call.answeredAt = createdAt + (0.3 + Math.random()) * MIN;
  }
  if (status === "done") call.doneAt = call.answeredAt + (1 + Math.random() * 3) * MIN;
  return call;
}

// Waiters who receive a table's call: its on-shift owner, otherwise every on-shift waiter.
function ownersFor(table) {
  const staff = window.Alpine?.store("team")?.staff ?? demoStaff;
  const waiters = staff.filter((s) => s.role === "Garson" && s.onShift && s.notify && !s.breakSince);
  const owners = waiters.filter((s) => s.tables.includes(table));
  return owners.length ? owners : waiters;
}

function seed() {
  const orders = [
    makeOrder("new", 1, 5),
    makeOrder("new", 4, 9),
    makeOrder("preparing", 7, 2),
    makeOrder("preparing", 11, 11),
    makeOrder("preparing", 14, 7),
    ...[18, 26, 35, 47, 58, 72, 95].map((m) => makeOrder("delivered", m)),
  ];
  orders.forEach((o) => {
    if (o.status !== "new") o.updatedAt = o.createdAt + 2 * MIN;
  });
  const calls = [
    makeCall("waiting", 6, 3),
    makeCall("waiting", 0.4, 10),
    makeCall("handling", 3, 6),
    ...[12, 25, 41, 63, 88].map((m) => makeCall("done", m)),
  ];
  return { orders, calls };
}

// --- live service server (server/index.mjs), reached through the dev server's /api proxy ---
const API = `/api/${currentBusiness()}`;
const api = (path, method = "GET", body) => bizApi(path, { method, body });
const failed = (err) => toast(err.message, "error", "İşlem yapılamadı");

// `simulate: false` keeps live service off, e.g. on sign-in screens and in the super panel.
// Otherwise the store connects to the server; when the server is not running it falls
// back to demo data and simulated traffic, so the panel can still be shown.
export function registerLiveStore(Alpine, { simulate = true } = {}) {
  Alpine.store("live", {
    steps: orderSteps,
    orders: [],
    calls: [],
    now: Date.now(),
    // true while orders and calls come from the server (shared by every screen)
    online: false,

    // Insert or refresh a server order/call; cancelled orders leave the board.
    upsert(list, item) {
      const items = this[list];
      const i = items.findIndex((x) => x.id === item.id);
      if (list === "orders" && item.status === "cancelled") {
        if (i !== -1) items.splice(i, 1);
        return false;
      }
      if (i === -1) items.push(item);
      else Object.assign(items[i], item);
      return i === -1;
    },

    // --- orders ---
    ordersBy(status) {
      return this.orders.filter((o) => o.status === status).sort((a, b) => a.createdAt - b.createdAt);
    },
    get newOrderCount() {
      return this.orders.filter((o) => o.status === "new").length;
    },
    get activeOrderCount() {
      return this.orders.filter((o) => ["new", "preparing"].includes(o.status)).length;
    },
    async advanceOrder(order) {
      const step = orderSteps.find((s) => s.id === order.status);
      if (!step?.next) return;
      const label = orderSteps.find((s) => s.id === step.next).name;
      if (this.online) {
        try {
          this.upsert("orders", await api(`/orders/${order.id}`, "PATCH", { status: step.next }));
        } catch (err) {
          return failed(err);
        }
      } else {
        order.status = step.next;
        order.updatedAt = Date.now();
      }
      toast(`#${order.no} · Masa ${order.table} → ${label}`, "success", "Sipariş güncellendi");
    },
    // Order a waiter takes at the table without a call ("çağrı dışı sipariş").
    // It skips confirmation and goes straight to the kitchen.
    async addWaiterOrder({ table, lines, note, waiter }) {
      if (this.online) {
        try {
          const order = await api("/orders", "POST", { table, lines, note, waiter });
          this.upsert("orders", order);
          toast(`#${order.no} · Masa ${table} mutfağa iletildi.`, "success", "Sipariş alındı");
          return order;
        } catch (err) {
          return failed(err);
        }
      }
      const createdAt = Date.now();
      const order = {
        id: `o${++orderNo}`,
        no: orderNo,
        table,
        lines,
        note,
        total: lines.reduce((s, l) => s + l.qty * l.price, 0),
        status: "preparing",
        byWaiter: waiter,
        createdAt,
        updatedAt: createdAt,
      };
      this.orders.push(order);
      toast(`#${order.no} · Masa ${table} mutfağa iletildi.`, "success", "Sipariş alındı");
      return order;
    },
    async cancelOrder(order) {
      if (this.online) {
        try {
          await api(`/orders/${order.id}`, "PATCH", { status: "cancelled" });
        } catch (err) {
          return failed(err);
        }
      }
      this.orders = this.orders.filter((o) => o.id !== order.id);
      toast(`#${order.no} · Masa ${order.table} siparişi iptal edildi.`, "danger", "Sipariş iptal edildi");
    },

    // --- waiter calls ---
    get waitingCalls() {
      return this.calls.filter((c) => c.status === "waiting").sort((a, b) => a.createdAt - b.createdAt);
    },
    get activeCalls() {
      return this.calls.filter((c) => c.status !== "done").sort((a, b) => a.createdAt - b.createdAt);
    },
    get doneCalls() {
      return this.calls.filter((c) => c.status === "done").sort((a, b) => b.createdAt - a.createdAt);
    },
    get avgResponse() {
      const answered = this.calls.filter((c) => c.answeredAt);
      if (!answered.length) return 0;
      return answered.reduce((s, c) => s + (c.answeredAt - c.createdAt), 0) / answered.length;
    },
    owners(call) {
      return ownersFor(call.table);
    },
    isEscalated(call) {
      return call.status === "waiting" && this.now - call.createdAt > ESCALATE_AFTER;
    },
    async takeCall(call, by) {
      by = by || ownersFor(call.table)[0]?.name || "Garson";
      if (this.online) {
        try {
          this.upsert("calls", await api(`/calls/${call.id}`, "PATCH", { status: "handling", by }));
        } catch (err) {
          return failed(err);
        }
      } else {
        call.status = "handling";
        call.handledBy = by;
        call.answeredAt = Date.now();
      }
      toast(`Masa ${call.table} çağrısıyla ${call.handledBy} ilgileniyor.`, "success", "Çağrı alındı");
    },
    async finishCall(call, by) {
      by = by || ownersFor(call.table)[0]?.name || "Garson";
      if (this.online) {
        try {
          this.upsert("calls", await api(`/calls/${call.id}`, "PATCH", { status: "done", by }));
        } catch (err) {
          return failed(err);
        }
      } else {
        if (!call.answeredAt) call.answeredAt = Date.now();
        if (!call.handledBy) call.handledBy = by;
        call.status = "done";
        call.doneAt = Date.now();
      }
      toast(`Masa ${call.table} çağrısı tamamlandı.`, "success", "Çağrı tamamlandı");
    },

    // --- tables ---
    tableCount: TABLE_COUNT,
    // Most urgent thing happening at a table, for the table overview.
    tableState(n) {
      const has = (status) => this.orders.some((o) => o.table === n && o.status === status);
      if (this.calls.some((c) => c.table === n && c.status === "waiting")) return "call";
      if (has("new")) return "new";
      if (has("preparing")) return "preparing";
      if (this.calls.some((c) => c.table === n && c.status === "handling")) return "handling";
      return "idle";
    },

    // --- helpers ---
    get alertCount() {
      return this.waitingCalls.length + this.newOrderCount;
    },
    ago(ts) {
      const s = Math.max(0, Math.round((this.now - ts) / 1000));
      if (s < 60) return `${s} sn önce`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m} dk önce`;
      return `${Math.floor(m / 60)} sa ${m % 60} dk önce`;
    },
    duration(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      return s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60} sn`;
    },
    clock(ts) {
      return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    },
    staffPhoto(name) {
      return demoStaff.find((s) => s.name === name)?.photo ?? "";
    },
  });

  const store = Alpine.store("live");
  setInterval(() => (store.now = Date.now()), 1000);
  if (!simulate) return;

  // Demo traffic only when the server is not running at all (not when signed out).
  connect(store).catch((err) => err.status === 0 && startDemoTraffic(store));
}

// Load today's orders and calls from the server and follow its live updates.
async function connect(store) {
  const load = async () => {
    const { orders, calls } = await api("/live");
    store.orders = orders;
    store.calls = calls;
  };
  await load();
  store.online = true;

  const stream = new EventSource(withKey(`${API}/live/stream`));
  let dropped = false;
  stream.onerror = () => (dropped = true);
  // After a dropped connection, reload everything missed meanwhile.
  stream.onopen = () => {
    if (dropped) load().catch(() => {});
    dropped = false;
  };
  stream.addEventListener("order", (e) => {
    const order = JSON.parse(e.data);
    const isNew = store.upsert("orders", order);
    if (isNew && order.source === "qr") toast(`#${order.no} · Masa ${order.table} · ${order.lines.length} ürün`, "order");
  });
  stream.addEventListener("call", (e) => {
    const call = JSON.parse(e.data);
    if (store.upsert("calls", call) && call.status === "waiting") toast(`Masa ${call.table} garson çağırıyor.`, "call");
  });
}

// No server: demo data with an order or a waiter call now and then.
function startDemoTraffic(store) {
  const { orders, calls } = seed();
  store.orders = orders;
  store.calls = calls;
  let turn = 0;
  setInterval(() => {
    if (turn++ % 2 === 0) {
      const order = makeOrder("new", 0);
      store.orders.push(order);
      toast(`#${order.no} · Masa ${order.table} · ${order.lines.length} ürün`, "order");
    } else {
      const call = makeCall("waiting", 0);
      store.calls.push(call);
      toast(`Masa ${call.table} garson çağırıyor.`, "call");
    }
  }, SIMULATE_EVERY);
}
