// Menu, panel documents, uploaded pictures and the super panel's businesses.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, getBusiness, getDoc, getMenu, putDoc, UPLOAD_DIR } from "./db.mjs";
import { HttpError, text } from "./http.mjs";
import { publish } from "./live.mjs";

// --- menu ---
// Uploaded pictures and site images are kept; anything else (old blob: links) is dropped.
const imagePath = (v) => (/^(images\/|\/api\/[a-z0-9-]+\/uploads\/|https?:\/\/)/.test(String(v ?? "")) ? text(v, 300) : "");
const i18n = (v, fields) =>
  Object.fromEntries(["en", "de", "ru"].map((l) => [l, Object.fromEntries(fields.map((f) => [f, text(v?.[l]?.[f], 400)]))]));

// `canChangePrice` false: staff without the "Fiyat değiştirme" permission.
export function saveMenu(business, body, canChangePrice = true) {
  const categories = (Array.isArray(body.categories) ? body.categories : []).slice(0, 100).map((c) => ({
    id: text(c.id, 80),
    name: text(c.name, 80),
    subtitle: text(c.subtitle, 160),
    image: imagePath(c.image),
    i18n: i18n(c.i18n, ["name", "subtitle"]),
  }));
  const products = (Array.isArray(body.products) ? body.products : []).slice(0, 2000).map((p) => ({
    id: text(p.id, 120),
    category: text(p.category, 80),
    name: text(p.name, 120),
    description: text(p.description, 300),
    price: Math.max(Number(p.price) || 0, 0),
    rating: Math.min(Math.max(Number(p.rating) || 0, 0), 5),
    image: imagePath(p.image),
    popular: !!p.popular,
    active: p.active !== false,
    i18n: i18n(p.i18n, ["name", "description"]),
    detail: Object.fromEntries(["tr", "en", "de", "ru"].map((l) => [l, text(p.detail?.[l], 2000)])),
    ingredients: (Array.isArray(p.ingredients) ? p.ingredients : []).slice(0, 40).map((x) => text(x, 40)),
  }));
  if (categories.some((c) => !c.id || !c.name) || products.some((p) => !p.id || !p.name || !p.category))
    throw new HttpError(400, "Menüde adı veya kodu boş olan kayıt var.");
  if (new Set(products.map((p) => p.id)).size !== products.length) throw new HttpError(400, "Aynı kodla iki ürün var.");
  if (!canChangePrice) {
    const before = new Map((getMenu(business)?.products ?? []).map((p) => [p.id, p.price]));
    if (products.some((p) => before.has(p.id) && before.get(p.id) !== p.price))
      throw new HttpError(403, "Fiyat değiştirme yetkiniz yok.");
  }
  const brand = getBusiness(business);
  const menu = { brand: { name: brand?.name || text(body.brand?.name, 80) }, categories, products };
  const now = Date.now();
  db.prepare(
    "INSERT INTO menus (business, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(business) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
  ).run(business, JSON.stringify(menu), now);
  publish(business, "menu", { updatedAt: now });
  return { ...menu, updatedAt: now };
}

// --- panel documents ---
// key -> panel section that may change it; "public" ones are also read by the QR menu.
export const DOCS = {
  staff: { section: "staff" },
  permissions: { section: "owner" },
  story: { section: "story", public: true },
  settings: { section: "menuSettings", public: true },
  picks: { section: "dashboard", public: true },
  ai: { section: "ai" },
  social: { section: "menuSettings", public: true },
  notes: { section: "calendar" },
  target: { section: "dashboard" },
};
const MAX_DOC = 256 * 1024;

export function checkDoc(business, key, data, who) {
  if (!DOCS[key]) throw new HttpError(404, "Bilinmeyen kayıt.");
  if (JSON.stringify(data).length > MAX_DOC) throw new HttpError(413, "Kayıt çok büyük.");
  const staff = who.actions; // only set for staff users
  if (staff && key === "settings") {
    const before = getDoc(business, "settings")?.features ?? {};
    const after = data?.features ?? {};
    if ((before.waiter ?? true) !== (after.waiter ?? true) || (before.cart ?? true) !== (after.cart ?? true)) {
      if (!staff.qrSwitch) throw new HttpError(403, "Garson çağrısı / sepeti açıp kapatma yetkiniz yok.");
    }
  }
  if (staff && key === "staff") {
    const ids = (d) => (d?.staff ?? []).map((s) => String(s.id)).sort().join(",");
    if (ids(getDoc(business, "staff")) !== ids(data) && !staff.manageStaff)
      throw new HttpError(403, "Personel ekleme / silme yetkiniz yok.");
  }
}
export function saveDoc(business, key, data) {
  putDoc(business, key, data);
  publish(business, "doc", { key });
  return data;
}

// --- uploaded pictures ---
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
export const MAX_UPLOAD = 2 * 1024 * 1024;

export function saveUpload(business, type, bytes) {
  const ext = TYPES[String(type).split(";")[0]];
  if (!ext) throw new HttpError(415, "Yalnızca JPG, PNG, WEBP veya GIF yüklenebilir.");
  if (!bytes.length) throw new HttpError(400, "Dosya boş.");
  const dir = join(UPLOAD_DIR, business);
  mkdirSync(dir, { recursive: true });
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  writeFileSync(join(dir, name), bytes);
  return { url: `/api/${business}/uploads/${name}` };
}

export function readUpload(business, name) {
  if (!/^[a-f0-9]{16}\.(jpg|png|webp|gif)$/.test(name)) return null;
  const file = join(UPLOAD_DIR, business, name);
  if (!existsSync(file)) return null;
  const ext = name.split(".").pop();
  return { bytes: readFileSync(file), type: Object.keys(TYPES).find((t) => TYPES[t] === ext) };
}

// --- businesses (super panel) ---
const STATUSES = ["active", "trial", "suspended"];
const PACKAGES = ["starter", "pro", "enterprise"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function listBusinesses() {
  return db.prepare("SELECT data FROM businesses ORDER BY json_extract(data, '$.id')").all().map((r) => JSON.parse(r.data));
}

export function cleanBusiness(b) {
  const slug = text(b.slug, 60);
  if (!SLUG.test(slug)) throw new HttpError(400, "Menü adresi yalnızca küçük harf, rakam ve tire içerebilir.");
  if (!text(b.name, 80)) throw new HttpError(400, "İşletme adı gerekli.");
  return {
    id: Number(b.id) || 0,
    name: text(b.name, 80),
    slug,
    logo: imagePath(b.logo),
    category: text(b.category, 40),
    phone: text(b.phone, 40),
    email: text(b.email, 120),
    address: text(b.address, 200),
    city: text(b.city, 80),
    owner: { name: text(b.owner?.name, 80), phone: text(b.owner?.phone, 40), email: text(b.owner?.email, 120).toLowerCase() },
    billing: {
      title: text(b.billing?.title, 160),
      taxOffice: text(b.billing?.taxOffice, 80),
      taxNo: text(b.billing?.taxNo, 11),
      sameAddress: b.billing?.sameAddress !== false,
      address: text(b.billing?.address, 200),
    },
    package: PACKAGES.includes(b.package) ? b.package : "starter",
    status: STATUSES.includes(b.status) ? b.status : "trial",
    startedAt: text(b.startedAt, 10),
    renewsAt: text(b.renewsAt, 10),
    tables: Math.min(Math.max(Math.trunc(Number(b.tables)) || 1, 1), 999),
    note: text(b.note, 1000),
  };
}

// Save a business; `from` is its current address when it is being renamed.
export function saveBusiness(b, from) {
  const all = listBusinesses();
  if (all.some((x) => x.slug === b.slug && x.slug !== from)) throw new HttpError(409, "Bu menü adresi başka bir işletmede kullanılıyor.");
  if (!b.id) b.id = Math.max(0, ...all.map((x) => x.id)) + 1;
  const upsert = db.prepare(
    "INSERT INTO businesses (slug, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
  );
  if (from && from !== b.slug && getBusiness(from)) {
    // Move everything the business owns to its new address.
    db.prepare("DELETE FROM businesses WHERE slug = ?").run(from);
    for (const t of ["menus", "docs"]) db.prepare(`UPDATE ${t} SET business = ? WHERE business = ?`).run(b.slug, from);
    if (existsSync(join(UPLOAD_DIR, from))) renameSync(join(UPLOAD_DIR, from), join(UPLOAD_DIR, b.slug));
    // Picture addresses carry the business address too.
    const [oldPath, newPath] = [`/api/${from}/uploads/`, `/api/${b.slug}/uploads/`];
    db.prepare("UPDATE menus SET data = replace(data, ?, ?) WHERE business = ?").run(oldPath, newPath, b.slug);
    b.logo = b.logo.replace(oldPath, newPath);
  }
  upsert.run(b.slug, JSON.stringify(b), Date.now());
  return b;
}

// What anyone may know about a business: shown on sign-in screens and the QR menu.
export function profile(slug) {
  const b = getBusiness(slug);
  if (!b) throw new HttpError(404, "İşletme bulunamadı.");
  return { slug: b.slug, name: b.name, logo: b.logo, category: b.category, status: b.status, tables: b.tables };
}
