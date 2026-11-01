import { toast } from "./toast";

// Defaults mirror the current QR menu. Demo only: nothing is saved yet.
export default function menuSettings() {
  return {
    accent: "#f08a24",
    // Waiter button and cart share $store.features with the Canlı Servis switches.
    get waiter() {
      return this.$store.features.waiter;
    },
    set waiter(value) {
      this.$store.features.waiter = value;
    },
    get cart() {
      return this.$store.features.cart;
    },
    set cart(value) {
      this.$store.features.cart = value;
    },
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
    // Hour choices for the panel's automatic dark mode ($store.theme).
    hours: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),

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
      toast("Menü ayarları kaydedildi (demo).");
    },
  };
}
