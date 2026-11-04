// Shared panel settings kept on the server as documents, used by several screens at once:
//   $store.settings  QR menu features and look (Menü Ayarları, Canlı Servis switches)
//   $store.picks     Öne Çıkan Lezzet / Günün Önerisi cards on the home page
//   $store.team      staff names, roles and tables (no link keys)
import { bizApi } from "./server";
import { demoStaff } from "./components/business/staff";
import { categories as demoCategories, products as demoProducts } from "./components/business/menu-data";

const SAVE_DELAY = 700;

export const settingsDefaults = () => ({
  accent: "#0f7b6c",
  waiterCooldown: 60,
  ratings: true,
  stories: true,
  languages: [
    { id: "tr", name: "Türkçe", on: true },
    { id: "en", name: "English", on: true },
    { id: "de", name: "Deutsch", on: true },
    { id: "ru", name: "Русский", on: true },
  ],
  defaultLang: "tr",
  features: { waiter: true, cart: true },
});

export const picksDefaults = () => ({
  featured: { auto: true, productId: "tatli-kunefe", shown: true, resolved: "tatli-kunefe" },
  daily: { auto: true, productId: "kahve-latte", shown: true, resolved: "kahve-latte" },
});

// Copy saved values into a store without replacing its nested objects
// (other stores and components hold references to them).
function merge(target, source) {
  for (const [k, v] of Object.entries(source ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k]))
      merge(target[k], v);
    else target[k] = v;
  }
}

// Load a document into a store, then save it after every change (when `save` is true).
function syncStore(Alpine, name, key, save) {
  const store = Alpine.store(name);
  store.state = "loading";
  bizApi(`/docs/${key}`)
    .then((doc) => merge(store, doc))
    .catch((err) => {
      if (err.status === 404 && save) return bizApi(`/docs/${key}`, { method: "PUT", body: plain(store) });
      if (err.status === 0) store.state = "offline";
    })
    .finally(() => {
      if (store.state === "offline") return;
      store.state = "saved";
      if (!save) return;
      let timer;
      let first = true;
      Alpine.effect(() => {
        JSON.stringify(plain(store)); // track every field
        if (first) return (first = false);
        clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            await bizApi(`/docs/${key}`, { method: "PUT", body: plain(store) });
          } catch (err) {
            window.dispatchEvent(new CustomEvent("save-failed", { detail: err.message }));
          }
        }, SAVE_DELAY);
      });
    });
}
const plain = (store) => {
  const { state, ...rest } = JSON.parse(JSON.stringify(store));
  return rest;
};

export function registerPanelStores(Alpine, { save }) {
  // The saved menu (public), for the screens that pick products: Story, home page picks …
  Alpine.store("catalog", { categories: demoCategories, products: demoProducts, loaded: false });
  bizApi("/menu")
    .then((m) => {
      const c = Alpine.store("catalog");
      c.categories = m.categories;
      c.products = m.products.filter((p) => p.active !== false);
      c.loaded = true;
    })
    .catch(() => {});

  Alpine.store("settings", settingsDefaults());
  // Older screens use $store.features; it is the same object as $store.settings.features.
  Alpine.store("features", Alpine.store("settings").features);
  Alpine.store("picks", picksDefaults());
  Alpine.store("team", {
    // demo staff until the saved list arrives
    staff: demoStaff.map(({ key, ...s }) => s),
    routing: null,
    get waiters() {
      return this.staff.filter((s) => s.role === "Garson");
    },
  });
  if (!save) return;
  syncStore(Alpine, "settings", "settings", true);
  syncStore(Alpine, "picks", "picks", true);
  bizApi("/team")
    .then((t) => {
      if (t.staff?.length) Alpine.store("team").staff = t.staff;
      Alpine.store("team").routing = t.routing;
    })
    .catch(() => {});
}
