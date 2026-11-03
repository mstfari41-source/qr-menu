// Talking to the panel server (server/index.mjs) through the dev server's /api proxy.
import { currentBusiness } from "./routes";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// A waiter's personal link signs every request with its key instead of a password.
let waiterKey = null;
export const setWaiterKey = (key) => (waiterKey = key);
export const withKey = (url) => (waiterKey ? `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(waiterKey)}` : url);

// status 0 = the server could not be reached at all.
export async function api(path, { method = "GET", body, raw, type } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        ...(body !== undefined && !raw ? { "Content-Type": "application/json" } : {}),
        ...(raw ? { "Content-Type": type } : {}),
        ...(waiterKey ? { "X-Waiter-Key": waiterKey } : {}),
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor.");
  }
  const data = await res.json().catch(() => ({}));
  // The dev server answers with its 404 page when the API server is not running.
  if (res.status === 504 || res.status === 502) throw new ApiError(0, "Sunucuya ulaşılamıyor.");
  if (!res.ok) throw new ApiError(res.status, data.error || "İşlem yapılamadı.");
  return data;
}

// Same, for the current business: bizApi("/menu") -> /api/beecafe/menu
export const bizApi = (path, opts) => api(`/api/${currentBusiness()}${path}`, opts);

// Where the customer QR menu is served for a business: /m/ on the panel server, the same
// address as its API. On a test or real server that is this very address. In development
// (panel on webpack's port 8080) it is port 3000 of this computer; opened as localhost,
// the panel asks the server for the computer's network address, so QR codes made here
// also work on phones in the same Wi-Fi.
const DEV_PORT = "8080";
let originPromise;
function menuOrigin() {
  if (location.port !== DEV_PORT) return Promise.resolve(location.origin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (!local) return Promise.resolve(`http://${location.hostname}:3000`);
  originPromise ??= api("/api/network")
    .then(({ addresses }) => `http://${addresses.find((a) => a.startsWith("192.168.")) ?? addresses[0] ?? location.hostname}:3000`)
    .catch(() => `http://${location.hostname}:3000`);
  return originPromise;
}
export async function qrMenuUrl(business = currentBusiness(), table) {
  return `${await menuOrigin()}/m/?isletme=${business}${table ? `&masa=${table}` : ""}`;
}
// Whether QR codes lead to this computer's Wi-Fi address (development) rather than a real one.
export const qrMenuIsLocal = () => location.port === DEV_PORT;

// Upload a picture; resolves to its address (e.g. /api/beecafe/uploads/ab12….jpg).
export async function upload(file, business = currentBusiness()) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") throw new ApiError(415, "Yalnızca JPG, PNG, WEBP veya GIF yüklenebilir.");
  if (file.size > 2 * 1024 * 1024) throw new ApiError(413, "Fotoğraf en fazla 2 MB olabilir.");
  const { url } = await api(`/api/${business}/uploads`, { method: "POST", raw: file, type: file.type });
  return url;
}

// Keep a component's fields in a saved document: load once, then save shortly after
// every change. Returns "saved" | "offline" (no server: the screen keeps demo data).
//   await syncDoc(this, "story", ["auto", "manual"])
export async function syncDoc(component, key, fields, { delay = 700, extra } = {}) {
  const pick = () => Object.fromEntries(fields.map((f) => [f, component[f]]));
  try {
    const doc = await bizApi(`/docs/${key}`);
    for (const f of fields) if (doc[f] !== undefined) component[f] = doc[f];
  } catch (err) {
    if (err.status === 0) return (component.docState = "offline");
    if (err.status === 404) await bizApi(`/docs/${key}`, { method: "PUT", body: { ...pick(), ...(extra?.() ?? {}) } }).catch(() => {});
    else return (component.docState = "error");
  }
  component.docState = "saved";
  let timer;
  const save = () => {
    clearTimeout(timer);
    component.docState = "saving";
    timer = setTimeout(async () => {
      try {
        await bizApi(`/docs/${key}`, { method: "PUT", body: { ...pick(), ...(extra?.() ?? {}) } });
        component.docState = "saved";
      } catch (err) {
        component.docState = "error";
        window.dispatchEvent(new CustomEvent("save-failed", { detail: err.message }));
      }
    }, delay);
  };
  for (const f of fields) component.$watch(f, save);
  return "saved";
}
