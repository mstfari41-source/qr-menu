// Panel server: everything the QR menu, the business panel, the waiters' phones and the
// super panel share. No packages needed: Node's own HTTP server, built-in SQLite
// (server/data/live.db) and Server-Sent Events for live updates.
//
//   node server/index.mjs            (port 3000, or PORT=… )
//
// Public (QR menu, sign-in screens):
//   GET  /api/:biz/profile | /menu | /docs/:key (story, settings, picks, social) | /uploads/:file
//   POST /api/:biz/orders { table, lines:[{id,qty}] }     POST /api/:biz/calls { table }
//   POST /api/auth/login { email, password, scope: "business"|"super", business }
// Signed in (business panel) or a waiter's personal link (?key= / X-Waiter-Key):
//   GET  /api/:biz/live, /live/stream     PATCH /api/:biz/orders/:id, /calls/:id
//   GET  /api/:biz/waiter/me              PATCH /api/:biz/waiter/me { onBreak }
// Signed in, per the owner's permissions:
//   PUT  /api/:biz/menu   PUT /api/:biz/docs/:key   POST /api/:biz/uploads (image body)
//   GET  /api/:biz/sales?days=30          GET|POST /api/:biz/staff-logins (owner)
//   GET  /api/auth/me   POST /api/auth/logout   POST /api/auth/password { current, next }
// Super panel:
//   GET  /api/super/businesses   PUT /api/super/businesses/:slug ("yeni" for a new one)
//   POST /api/super/businesses/:slug/owner-password
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { getBusiness, getDoc, getMenu } from "./db.mjs";
import { HttpError, readBody, readJson, send, text } from "./http.mjs";
import * as auth from "./auth.mjs";
import * as live from "./live.mjs";
import * as content from "./content.mjs";
import { demoBusinesses } from "../src/js/components/super/businesses.js";
import routes from "../src/js/routes.js";

const PORT = Number(process.env.PORT) || 3000;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MENU_DIR = resolve(ROOT, "qr-menu");
// The built panel (npm run build). When it exists this server alone serves everything
// (panel, QR menu, API) from one address, as on a test or real server. Without it
// (development) the panel runs on webpack's dev server and only the menu and API are here.
const BUILD_DIR = resolve(ROOT, "build");
const hasBuild = () => existsSync(resolve(BUILD_DIR, "index.html"));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// A file from `dir` (never outside it), or false.
function sendFile(req, res, dir, rel, status = 200) {
  const file = resolve(dir, rel);
  if (!file.startsWith(dir + sep) || !existsSync(file) || !statSync(file).isFile()) return false;
  const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  // Pages are never cached, so phones always get the current version.
  res.writeHead(status, { "Content-Type": type, "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600" });
  res.end(req.method === "HEAD" ? undefined : readFileSync(file));
  return true;
}

// Everything that is not the API:
//   /m/…            the customer QR menu (qr-menu folder); /m/?isletme=beecafe&masa=5
//   /beecafe/menu … the panel's readable addresses (src/js/routes.js), when it is built
//   anything else   a built panel file (bundle.js, images …) or its 404 page
function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") throw new HttpError(405, "Bu işlem desteklenmiyor.");
  const path = decodeURIComponent(pathname);
  if (path === "/m" || path.startsWith("/m/")) {
    const rel = path.replace(/^\/m\/?/, "") || "index.html";
    if (sendFile(req, res, MENU_DIR, rel)) return;
  } else if (hasBuild()) {
    const page = routes.resolve(path, (name) => existsSync(resolve(BUILD_DIR, `${name}.html`)));
    if (page && sendFile(req, res, BUILD_DIR, `${page}.html`)) return;
    if (path === "/" && sendFile(req, res, BUILD_DIR, "index.html")) return;
    if (sendFile(req, res, BUILD_DIR, path.replace(/^\/+/, ""))) return;
    if (sendFile(req, res, BUILD_DIR, `${path.replace(/^\/+/, "")}.html`)) return;
    if (sendFile(req, res, BUILD_DIR, "error-404.html", 404)) return;
  } else if (sendFile(req, res, MENU_DIR, path === "/" ? "index.html" : path.replace(/^\/+/, ""))) {
    // development: the menu also answers at the root, as before
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Bulunamadı.");
}

// First start: the demo businesses and two accounts (see server/data/ilk-giris.txt).
if (!content.listBusinesses().length) {
  for (const b of demoBusinesses) content.saveBusiness(content.cleanBusiness(b));
}
auth.seedAccounts();
for (const b of content.listBusinesses()) auth.syncOwner(b.slug, b.owner);

// A request may act through any one of these sections (e.g. Canlı Servis or Garson Ekranı).
function needAny(req, business, url, sections, level, opts) {
  let last;
  for (const s of sections) {
    try {
      return auth.need(req, business, url, s, level, opts);
    } catch (err) {
      last = err;
      if (err.status === 401) throw err;
    }
  }
  throw last;
}

async function businessRoute(req, res, url, business, rest) {
  const method = req.method;
  const [resource, id, sub] = rest;

  if (resource === "profile" && method === "GET") return send(res, 200, content.profile(business));

  if (resource === "menu") {
    if (method === "GET") {
      const menu = getMenu(business);
      return menu ? send(res, 200, menu) : send(res, 404, { error: "Menü henüz kaydedilmedi." });
    }
    if (method === "PUT") {
      const who = auth.need(req, business, url, "menu", "edit");
      return send(res, 200, content.saveMenu(business, await readJson(req, 1024 * 1024), auth.allowed(who, "changePrice")));
    }
  }

  if (resource === "docs" && id) {
    const spec = content.DOCS[id];
    if (!spec) throw new HttpError(404, "Bilinmeyen kayıt.");
    if (method === "GET") {
      if (!spec.public) auth.need(req, business, url, spec.section, "view");
      const doc = getDoc(business, id);
      return doc ? send(res, 200, doc) : send(res, 404, { error: "Henüz kaydedilmedi." });
    }
    if (method === "PUT") {
      const who = auth.need(req, business, url, spec.section, "edit");
      const data = await readJson(req, 300 * 1024);
      content.checkDoc(business, id, data, who);
      return send(res, 200, content.saveDoc(business, id, data));
    }
  }

  if (resource === "uploads") {
    if (method === "GET" && id) {
      const file = content.readUpload(business, id);
      if (!file) throw new HttpError(404, "Dosya bulunamadı.");
      res.writeHead(200, { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
      return res.end(file.bytes);
    }
    if (method === "POST" && !id) {
      const user = auth.currentUser(req);
      if (user?.role !== "super") auth.need(req, business, url, "menu", "edit");
      const bytes = await readBody(req, content.MAX_UPLOAD);
      return send(res, 201, content.saveUpload(business, req.headers["content-type"], bytes));
    }
  }

  if (resource === "live" && method === "GET") {
    if (id === "stream") {
      needAny(req, business, url, ["live", "waiter"], "view", { waiterOk: true });
      return live.stream(req, res, business);
    }
    needAny(req, business, url, ["live", "waiter"], "view", { waiterOk: true });
    return send(res, 200, live.snapshot(business));
  }

  if (resource === "orders") {
    if (method === "POST" && !id) {
      const body = await readJson(req);
      // An order taken by a waiter at the table needs a waiter (or panel) sign-in.
      if (body.waiter) {
        const who = needAny(req, business, url, ["waiter", "live"], "edit", { waiterOk: true });
        const name = who.waiter?.name ?? (text(body.waiter, 80) || who.user.name);
        return send(res, 201, live.createOrder(business, body, name));
      }
      return send(res, 201, live.createOrder(business, body, null));
    }
    if (method === "PATCH" && id) {
      const who = needAny(req, business, url, ["live", "waiter"], "edit", { waiterOk: true });
      const { status } = await readJson(req);
      if (status === "cancelled" && !who.waiter && !auth.allowed(who, "cancelOrder"))
        throw new HttpError(403, "Sipariş iptal etme yetkiniz yok.");
      return send(res, 200, live.updateOrder(business, Number(id), text(status, 20)));
    }
  }

  if (resource === "calls") {
    if (method === "POST" && !id) return send(res, 201, live.createCall(business, await readJson(req)));
    if (method === "PATCH" && id) {
      const who = needAny(req, business, url, ["live", "waiter"], "edit", { waiterOk: true });
      const { status, by } = await readJson(req);
      return send(res, 200, live.updateCall(business, Number(id), text(status, 20), who.waiter?.name ?? by ?? who.user?.name));
    }
  }

  if (resource === "sales" && method === "GET") {
    needAny(req, business, url, ["sales", "dashboard"], "view");
    return send(res, 200, { orders: live.sales(business, Number(url.searchParams.get("days")) || 30) });
  }

  // The waiter on their personal link: who they are, and their break.
  if (resource === "waiter" && id === "me") {
    const waiter = auth.waiterByKey(business, url.searchParams.get("key") || req.headers["x-waiter-key"]);
    if (!waiter) throw new HttpError(401, "Bağlantı geçersiz.");
    if (method === "GET") return send(res, 200, waiter);
    if (method === "PATCH") {
      const { onBreak } = await readJson(req);
      const doc = getDoc(business, "staff");
      const me = doc.staff.find((s) => s.key === waiter.key);
      me.breakSince = onBreak ? Date.now() : null;
      content.saveDoc(business, "staff", doc);
      return send(res, 200, me);
    }
  }

  // Staff names, roles and tables for every signed-in screen (without the waiters' link keys).
  if (resource === "team" && method === "GET") {
    if (!auth.actor(req, business, url)) throw new HttpError(401, "Oturum açmanız gerekiyor.");
    const doc = getDoc(business, "staff");
    return send(res, 200, {
      staff: (doc?.staff ?? []).map(({ key, ...s }) => s),
      routing: doc?.routing ?? null,
    });
  }

  // The business's own details (Profil page): set by the super panel, read-only here.
  if (resource === "business" && method === "GET") {
    const who = auth.actor(req, business, url);
    if (!who?.user) throw new HttpError(401, "Oturum açmanız gerekiyor.");
    const b = getBusiness(business);
    if (!b) throw new HttpError(404, "İşletme bulunamadı.");
    const { note, billing, ...rest } = b;
    return send(res, 200, rest);
  }

  if (resource === "staff-logins") {
    auth.need(req, business, url, "owner");
    if (method === "GET") return send(res, 200, auth.staffLogins(business));
    if (method === "POST") return send(res, 200, auth.syncStaffUser(business, await readJson(req)));
  }

  throw new HttpError(404, "Bulunamadı.");
}

async function superRoute(req, res, url, rest) {
  auth.requireSuper(req);
  const [resource, slug, action] = rest;
  if (resource !== "businesses") throw new HttpError(404, "Bulunamadı.");
  if (req.method === "GET" && !slug) return send(res, 200, content.listBusinesses());
  if (req.method === "PUT" && slug) {
    const from = slug === "yeni" ? null : slug;
    if (from && !getBusiness(from)) throw new HttpError(404, "İşletme bulunamadı.");
    const b = content.cleanBusiness(await readJson(req, 64 * 1024));
    if (from) b.id = getBusiness(from).id;
    auth.syncOwner(from ?? b.slug, b.owner);
    const saved = content.saveBusiness(b, from);
    if (from && from !== b.slug) {
      live.renameBusiness(from, b.slug);
      auth.renameBusiness(from, b.slug);
    }
    return send(res, 200, saved);
  }
  if (req.method === "POST" && slug && action === "owner-password") {
    if (!getBusiness(slug)) throw new HttpError(404, "İşletme bulunamadı.");
    return send(res, 200, auth.resetOwnerPassword(slug));
  }
  throw new HttpError(404, "Bulunamadı.");
}

// Requests that reached the server over HTTPS (directly or through a proxy such as Codespaces).
const https = (req) => req.headers["x-forwarded-proto"] === "https" || !!req.socket.encrypted;

async function authRoute(req, res, url, rest) {
  const [action] = rest;
  if (action === "login" && req.method === "POST") {
    const { token, user } = auth.login(await readJson(req), req.socket.remoteAddress);
    return send(res, 200, user, { "Set-Cookie": auth.sessionCookie(token, undefined, https(req)) });
  }
  if (action === "logout" && req.method === "POST") {
    auth.logout(req);
    return send(res, 200, { ok: true }, { "Set-Cookie": auth.sessionCookie("", 0, https(req)) });
  }
  const user = auth.currentUser(req);
  if (!user) throw new HttpError(401, "Oturum açmanız gerekiyor.");
  if (action === "me" && req.method === "GET") return send(res, 200, auth.publicUser(user));
  if (action === "password" && req.method === "POST") {
    const { current, next } = await readJson(req);
    auth.changePassword(user, current, next);
    return send(res, 200, { ok: true });
  }
  throw new HttpError(404, "Bulunamadı.");
}

const server = createServer(async (req, res) => {
  // The QR menu runs on another port: it may read public data and send orders and calls.
  // Signed-in requests come through the panel's own address (dev-server proxy), so no
  // credentials are ever allowed cross-origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const url = new URL(req.url, "http://x");
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  try {
    // Everything else: the QR menu and (when built) the panel, from this same address,
    // so every page reaches the API without crossing to another port.
    if (!url.pathname.startsWith("/api/")) return serveStatic(req, res, url.pathname);
    if (parts[0] === "health") return send(res, 200, { ok: true });
    // This computer's addresses on the local network, so QR codes made on the panel
    // (even when it is opened as localhost) lead phones to the right place.
    if (parts[0] === "network") {
      const addresses = Object.values(networkInterfaces())
        .flat()
        .filter((a) => a && a.family === "IPv4" && !a.internal)
        .map((a) => a.address);
      return send(res, 200, { addresses });
    }
    if (parts[0] === "auth") return await authRoute(req, res, url, parts.slice(1));
    if (parts[0] === "super") return await superRoute(req, res, url, parts.slice(1));
    if (!/^[a-z0-9-]{1,60}$/.test(parts[0] ?? "")) throw new HttpError(404, "Bulunamadı.");
    return await businessRoute(req, res, url, parts[0], parts.slice(1));
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: "Sunucu hatası." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Panel sunucusu çalışıyor: http://localhost:${PORT}  (ağdan: http://<bilgisayar-ip>:${PORT})`);
});
