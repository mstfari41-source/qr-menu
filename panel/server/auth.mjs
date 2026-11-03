// Accounts, sign-in sessions and who may do what.
//
// Roles: "super" (ARI Medya, every business), "owner" (one business, everything),
// "staff" (one business, only the sections the owner opened on the Yetkilendirme page).
// Waiters on their personal link sign in with the link's key instead of a password.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, DATA_DIR, getBusiness, getDoc } from "./db.mjs";
import { cookies, HttpError, text } from "./http.mjs";

const SESSION_DAYS = 30;
export const COOKIE = "sid";
const EMAIL = /^\S+@\S+\.\S+$/;

const q = {
  byEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  byId: db.prepare("SELECT * FROM users WHERE id = ?"),
  ownerOf: db.prepare("SELECT * FROM users WHERE business = ? AND role = 'owner'"),
  staffUser: db.prepare("SELECT * FROM users WHERE business = ? AND staff_id = ?"),
  count: db.prepare("SELECT COUNT(*) AS n FROM users"),
  add: db.prepare("INSERT INTO users (email, name, role, business, staff_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  update: db.prepare("UPDATE users SET email = ?, name = ? WHERE id = ?"),
  setPassword: db.prepare("UPDATE users SET password_hash = ? WHERE id = ?"),
  remove: db.prepare("DELETE FROM users WHERE id = ?"),
  session: db.prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > ?"),
  addSession: db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"),
  dropSession: db.prepare("DELETE FROM sessions WHERE token = ?"),
  dropUserSessions: db.prepare("DELETE FROM sessions WHERE user_id = ?"),
  purge: db.prepare("DELETE FROM sessions WHERE expires_at < ?"),
};

// --- passwords ---
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function checkPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const given = scryptSync(password, salt, 64);
  return timingSafeEqual(given, Buffer.from(hash, "hex"));
}
export const newPassword = () => randomBytes(9).toString("base64url"); // 12 characters
export function validPassword(p) {
  if (typeof p !== "string" || p.length < 8) throw new HttpError(400, "Parola en az 8 karakter olmalı.");
  return p;
}

// --- sign-in attempts: 8 wrong passwords per address lock it for 10 minutes ---
const attempts = new Map();
function throttle(key) {
  const a = attempts.get(key);
  if (a && a.count >= 8 && Date.now() - a.first < 10 * 60 * 1000)
    throw new HttpError(429, "Çok fazla hatalı deneme. 10 dakika sonra tekrar deneyin.");
}
function failed(key) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > 10 * 60 * 1000) attempts.set(key, { count: 1, first: Date.now() });
  else a.count++;
}

// --- what a staff member may do, from the owner's Yetkilendirme page ---
function staffAccess(user) {
  const people = getDoc(user.business, "permissions")?.people ?? [];
  return people.find((p) => String(p.id) === String(user.staff_id)) ?? null;
}

// The signed-in user as the panel sees it.
export function publicUser(user) {
  const out = { id: user.id, email: user.email, name: user.name, role: user.role, business: user.business };
  if (user.role === "staff") {
    const a = staffAccess(user);
    out.perms = a?.perms ?? {};
    out.actions = a?.actions ?? {};
  }
  return out;
}

// Test sign-in: 12345 / 12345 opens the super panel, or the owner's panel of any business.
// For the test phase only; TEST_LOGIN=0 switches it off (do that before real use).
export const TEST_LOGIN = process.env.TEST_LOGIN !== "0";
const TEST_CODE = "12345";

export function login({ email, password, scope, business }, ip) {
  email = text(email, 120).toLowerCase();
  if (TEST_LOGIN && email === TEST_CODE && String(password ?? "") === TEST_CODE) {
    const user = scope === "super" ? db.prepare("SELECT * FROM users WHERE role = 'super' ORDER BY id LIMIT 1").get() : q.ownerOf.get(business);
    if (!user) throw new HttpError(404, "Bu işletmenin sahibi için hesap yok.");
    return startSession(user);
  }
  const key = `${ip}|${email}`;
  throttle(key);
  const user = EMAIL.test(email) ? q.byEmail.get(email) : null;
  const wrong = () => {
    failed(key);
    return new HttpError(401, "E-posta veya parola hatalı.");
  };
  if (!user || !checkPassword(String(password ?? ""), user.password_hash)) throw wrong();
  if (scope === "super" && user.role !== "super") throw wrong();
  if (scope !== "super") {
    if (user.role === "super") throw new HttpError(403, "Süper panel hesabıyla süper panel girişini kullanın.");
    if (user.business !== business) throw wrong();
    const biz = getBusiness(business);
    if (biz?.status === "suspended") throw new HttpError(403, "Bu işletmenin hesabı askıya alınmış. ARI Medya ile iletişime geçin.");
    if (user.role === "staff" && !staffAccess(user)?.access) throw new HttpError(403, "Panel erişiminiz kapalı. İşletme sahibine başvurun.");
  }
  attempts.delete(key);
  return startSession(user);
}

function startSession(user) {
  const token = randomBytes(32).toString("base64url");
  q.addSession.run(token, user.id, Date.now() + SESSION_DAYS * 86400000);
  q.purge.run(Date.now());
  return { token, user: publicUser(user) };
}

// Behind HTTPS (a test or real server) the cookie is only ever sent encrypted.
export const sessionCookie = (token, maxAge = SESSION_DAYS * 86400, secure = false) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;

export function logout(req) {
  const token = cookies(req)[COOKIE];
  if (token) q.dropSession.run(token);
}

// The signed-in user for a request, or null.
export function currentUser(req) {
  const token = cookies(req)[COOKIE];
  if (!token) return null;
  const s = q.session.get(token, Date.now());
  return s ? q.byId.get(s.user_id) : null;
}

export function changePassword(user, current, next) {
  if (!checkPassword(String(current ?? ""), user.password_hash)) throw new HttpError(400, "Mevcut parola hatalı.");
  if (current === next) throw new HttpError(400, "Yeni parola mevcut paroladan farklı olmalı.");
  q.setPassword.run(hashPassword(validPassword(next)), user.id);
}

// --- authorization ---
// A waiter's personal link key, checked against the saved staff list.
export function waiterByKey(business, key) {
  if (!key) return null;
  const staff = getDoc(business, "staff")?.staff ?? [];
  return staff.find((s) => s.key === key && s.role === "Garson") ?? null;
}

// Who is acting on a business: a signed-in user or a waiter link.
export function actor(req, business, url) {
  const user = currentUser(req);
  if (user && (user.role === "super" || user.business === business)) return { user };
  const waiter = waiterByKey(business, url.searchParams.get("key") || req.headers["x-waiter-key"]);
  if (waiter) return { waiter };
  return null;
}

// Require access to a panel section: level "view" or "edit".
export function need(req, business, url, section, level = "view", { waiterOk = false } = {}) {
  const who = actor(req, business, url);
  if (!who) throw new HttpError(401, "Oturum açmanız gerekiyor.");
  if (who.waiter) {
    if (waiterOk) return who;
    throw new HttpError(403, "Bu işlem için yetkiniz yok.");
  }
  const { user } = who;
  if (user.role === "super" || user.role === "owner") return who;
  if (section === "owner") throw new HttpError(403, "Bu işlemi yalnızca işletme sahibi yapabilir.");
  const a = staffAccess(user);
  const have = a?.access ? a.perms?.[section] ?? "none" : "none";
  const ok = level === "view" ? have !== "none" : have === "edit";
  if (!ok) throw new HttpError(403, "Bu bölüm için yetkiniz yok.");
  return { ...who, actions: a.actions ?? {} };
}
// Special actions (cancelling orders, changing prices …) staff need explicitly.
export const allowed = (who, action) => !who.actions || who.actions[action] === true;

export function requireSuper(req) {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, "Oturum açmanız gerekiyor.");
  if (user.role !== "super") throw new HttpError(403, "Yalnızca süper panel.");
  return user;
}

// --- accounts kept in step with the panels ---
// The business owner's login follows the owner details in the super panel.
export function syncOwner(business, owner) {
  const email = text(owner?.email, 120).toLowerCase();
  if (!EMAIL.test(email)) return;
  const existing = q.ownerOf.get(business);
  const clash = q.byEmail.get(email);
  if (clash && clash.id !== existing?.id) throw new HttpError(409, "Bu e-posta başka bir hesapta kullanılıyor.");
  if (existing) q.update.run(email, text(owner.name, 80) || existing.name, existing.id);
  else q.add.run(email, text(owner.name, 80) || "İşletme sahibi", "owner", business, null, null, Date.now());
}

export function resetOwnerPassword(business) {
  const owner = q.ownerOf.get(business);
  if (!owner) throw new HttpError(404, "Bu işletmenin sahibi için hesap yok; önce giriş e-postasını kaydedin.");
  const password = newPassword();
  q.setPassword.run(hashPassword(password), owner.id);
  q.dropUserSessions.run(owner.id);
  return { email: owner.email, password };
}

// Staff logins, from the owner's Yetkilendirme page.
export function syncStaffUser(business, { staffId, name, email, password }) {
  email = text(email, 120).toLowerCase();
  if (!EMAIL.test(email)) throw new HttpError(400, "Geçerli bir e-posta girin.");
  const existing = q.staffUser.get(business, String(staffId));
  const clash = q.byEmail.get(email);
  if (clash && clash.id !== existing?.id) throw new HttpError(409, "Bu e-posta başka bir hesapta kullanılıyor.");
  const hash = password ? hashPassword(validPassword(password)) : null;
  if (existing) {
    q.update.run(email, text(name, 80) || existing.name, existing.id);
    if (hash) {
      q.setPassword.run(hash, existing.id);
      q.dropUserSessions.run(existing.id);
    }
  } else q.add.run(email, text(name, 80) || "Personel", "staff", business, String(staffId), hash, Date.now());
  return { email, hasPassword: !!(hash || existing?.password_hash) };
}

export function staffLogins(business) {
  return db
    .prepare("SELECT staff_id, email, password_hash IS NOT NULL AS has_password FROM users WHERE business = ? AND role = 'staff'")
    .all(business)
    .map((r) => ({ staffId: r.staff_id, email: r.email, hasPassword: !!r.has_password }));
}

export function renameBusiness(from, to) {
  db.prepare("UPDATE users SET business = ? WHERE business = ?").run(to, from);
}

// --- first start: one super admin and the demo owner, with generated passwords ---
export function seedAccounts() {
  if (q.count.get().n) return;
  const superPass = newPassword();
  const ownerPass = newPassword();
  q.add.run("admin@arimedya.local", "ARI Medya", "super", null, null, hashPassword(superPass), Date.now());
  q.add.run("ahmet@beecafe.com.tr", "Ahmet Yılmaz", "owner", "beecafe", null, hashPassword(ownerPass), Date.now());
  const file = join(DATA_DIR, "ilk-giris.txt");
  writeFileSync(
    file,
    [
      "İlk giriş bilgileri (sunucu ilk açıldığında oluşturuldu).",
      "Giriş yaptıktan sonra parolaları Profil sayfasından değiştirin ve bu dosyayı silin.",
      "",
      "Süper panel   /super/giris",
      `  E-posta: admin@arimedya.local`,
      `  Parola:  ${superPass}`,
      "",
      "BeeCafe işletme paneli   /beecafe/giris",
      `  E-posta: ahmet@beecafe.com.tr`,
      `  Parola:  ${ownerPass}`,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(`İlk giriş bilgileri yazıldı: ${file}`);
}
