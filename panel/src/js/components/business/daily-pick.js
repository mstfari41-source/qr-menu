import { margin, slots, dayParts, currentDayPart, formatPrice } from "./menu-data";

// Two recommendation spots on the QR menu, mirroring its spotlight logic:
// - featured: the pop-up shown when the QR code is scanned (best match)
// - daily: the "Günün önerisi" box on the menu's home page (next best)
// Each spot has its own colour so the two cards are told apart at a glance.
// Choices live in $store.picks (saved on the server and read by the QR menu).
const kinds = {
  featured: {
    title: "Öne Çıkan Lezzet",
    hint: "QR okutulunca açılan pencere",
    toggleLabel: "Menüde göster",
    rank: 0,
    theme: {
      card: "border-orange-200 bg-orange-50/70 dark:border-orange-500/30 dark:bg-orange-500/5",
      badge: "bg-orange-500 text-white",
      title: "text-orange-700 dark:text-orange-400",
      active: "bg-orange-500 text-white",
      switchOn: "bg-orange-500",
    },
  },
  daily: {
    title: "Günün Önerisi",
    hint: "Menü ana sayfasındaki kutu",
    toggleLabel: "Menüde göster",
    rank: 1,
    theme: {
      card: "border-brand-200 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/5",
      badge: "bg-brand-500 text-white",
      title: "text-brand-600 dark:text-brand-400",
      active: "bg-brand-500 text-white",
      switchOn: "bg-brand-500",
    },
  },
};

function ranked(products, part) {
  const score = (p) => (margin[p.id] ?? 3) + (p.popular ? 2 : 0) + (p.rating - 4) * 2;
  return products.filter((p) => slots[p.category]?.includes(part)).sort((a, b) => score(b) - score(a));
}

export default function dailyPick(kind = "daily") {
  const k = kinds[kind];
  return {
    title: k.title,
    hint: k.hint,
    kind,
    theme: k.theme,
    toggleLabel: k.toggleLabel,
    part: currentDayPart(),

    init() {
      // The QR menu shows exactly the product chosen here, also in automatic mode.
      this.$watch("pick", (p) => p && this.spot.resolved !== p.id && (this.spot.resolved = p.id));
    },
    get spot() {
      return this.$store.picks[kind];
    },
    get products() {
      return this.$store.catalog.products;
    },
    get auto() {
      return this.spot.auto;
    },
    set auto(v) {
      this.spot.auto = v;
    },
    get productId() {
      return this.spot.productId;
    },
    set productId(v) {
      this.spot.productId = v;
    },
    get shown() {
      return this.spot.shown;
    },
    set shown(v) {
      this.spot.shown = v;
    },
    get pick() {
      if (!this.auto) return this.products.find((p) => p.id === this.productId) ?? this.products[0];
      const list = ranked(this.products, this.part);
      return list[k.rank] ?? list[0] ?? this.products[0];
    },
    get partName() {
      return dayParts.find((d) => d.id === this.part).name;
    },
    formatPrice,
  };
}
