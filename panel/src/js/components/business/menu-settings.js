import { toast } from "./toast";

// QR menu look and features. Everything lives in $store.settings, which is saved on the
// server after each change and read by the QR menu; the Canlı Servis switches share it.
const field = (name) => ({
  get() {
    return this.$store.settings[name];
  },
  set(v) {
    this.$store.settings[name] = v;
  },
});

export default function menuSettings() {
  const component = {
    // Hour choices for the panel's automatic dark mode ($store.theme).
    hours: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),

    get waiter() {
      return this.$store.settings.features.waiter;
    },
    set waiter(value) {
      this.$store.settings.features.waiter = value;
    },
    get cart() {
      return this.$store.settings.features.cart;
    },
    set cart(value) {
      this.$store.settings.features.cart = value;
    },
    get activeLanguages() {
      return this.languages.filter((l) => l.on);
    },
    toggleLanguage(lang) {
      // Turkish stays on and at least one language must remain.
      if (lang.id === "tr" || (lang.on && this.activeLanguages.length === 1)) return;
      lang.on = !lang.on;
      if (!lang.on && this.defaultLang === lang.id) this.defaultLang = "tr";
    },
    save() {
      toast(this.$store.settings.state === "offline" ? "Sunucu kapalı; ayarlar kaydedilmedi." : "Menü ayarları kaydedildi.");
    },
  };
  for (const name of ["accent", "waiterCooldown", "ratings", "stories", "languages", "defaultLang"]) {
    Object.defineProperty(component, name, { ...field(name), enumerable: true, configurable: true });
  }
  return component;
}
