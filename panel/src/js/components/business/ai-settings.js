import { categories, products, margin, dayParts, slots, formatPrice } from "./menu-data";
import { toast } from "./toast";

// Rules and weights the automatic (AI) picks follow. Demo only: nothing is saved yet.
const clone = (o) => JSON.parse(JSON.stringify(o));

const factorList = [
  { id: "time", name: "Saat", hint: "Günün saatine uygun kategoriler öne çıkar." },
  { id: "weather", name: "Hava durumu", hint: "Sıcak, soğuk veya yağmurlu havaya uygun ürünler." },
  { id: "crowd", name: "Kafe yoğunluğu", hint: "Yoğunlukta hızlı hazırlanan ürünler önerilir." },
  { id: "preference", name: "Müşteri tercihleri", hint: "Popüler ve sık sipariş edilen ürünler." },
  { id: "age", name: "Yaş kitlesi", hint: "Müşterinin seçtiği yaş aralığına uygun ürünler." },
  { id: "margin", name: "Kâr marjı", hint: "Kârı yüksek ürünler daha çok önerilir." },
];

const strategies = {
  profit: { name: "Kâr odaklı", weights: { time: 50, weather: 40, crowd: 40, preference: 40, age: 30, margin: 90 } },
  balanced: { name: "Dengeli", weights: { time: 70, weather: 60, crowd: 60, preference: 60, age: 50, margin: 50 } },
  customer: { name: "Müşteri odaklı", weights: { time: 70, weather: 70, crowd: 50, preference: 90, age: 70, margin: 20 } },
};

const prepLevels = [
  { id: "fast", name: "Hızlı", score: 1 },
  { id: "medium", name: "Orta", score: 0.5 },
  { id: "slow", name: "Yavaş", score: 0 },
];

export default function aiSettings() {
  return {
    categories,
    products,
    factorList,
    strategies,
    prepLevels,

    enabled: true,
    strategy: "balanced",
    factors: Object.fromEntries(
      factorList.map((f) => [f.id, { on: true, weight: strategies.balanced.weights[f.id] }]),
    ),

    weather: {
      city: "İstanbul",
      hotAbove: 25,
      coldBelow: 12,
      rules: { hot: ["icecek", "tatli"], cold: ["kahve", "kahvalti"], rainy: ["kahve", "tatli"] },
    },
    crowd: {
      source: "tables",
      busyAbove: 70,
      fastWhenBusy: true,
      marginWhenQuiet: true,
      prep: { kahvalti: "slow", kahve: "fast", burger: "medium", pizza: "slow", tatli: "fast", icecek: "fast" },
    },
    age: {
      askCustomer: true,
      segments: [
        { id: "18-24", name: "18-24", on: true, cats: ["burger", "icecek", "pizza"] },
        { id: "25-34", name: "25-34", on: true, cats: ["kahve", "burger", "tatli"] },
        { id: "35-49", name: "35-49", on: true, cats: ["kahvalti", "kahve", "pizza"] },
        { id: "50+", name: "50 ve üzeri", on: true, cats: ["kahvalti", "kahve", "tatli"] },
      ],
    },
    preference: { personalize: true, popular: true, diet: true, window: "30" },
    parts: clone(dayParts),
    slots: clone(slots),
    limits: { maxPicks: 3, excluded: [] },

    // Simulated conditions for the preview card.
    sim: { hour: new Date().getHours(), temp: 18, rain: false, crowd: 45, age: "25-34" },

    // --- helpers ---
    toggleIn(list, id) {
      const i = list.indexOf(id);
      if (i === -1) list.push(id);
      else list.splice(i, 1);
    },
    categoryName(id) {
      return categories.find((c) => c.id === id)?.name ?? id;
    },
    applyStrategy(key) {
      this.strategy = key;
      for (const f of factorList) this.factors[f.id].weight = strategies[key].weights[f.id];
    },
    changeWeight() {
      this.strategy = "custom";
    },
    toggleSlot(categoryId, partId) {
      this.toggleIn(this.slots[categoryId], partId);
    },
    partFor(hour) {
      const sorted = [...this.parts].sort((a, b) => a.from - b.from);
      return ([...sorted].reverse().find((p) => hour >= p.from) ?? sorted.at(-1)).id;
    },
    save() {
      toast("Yapay zekâ ayarları kaydedildi (demo).");
    },

    // --- simulation ---
    get simPart() {
      return this.partFor(Number(this.sim.hour));
    },
    get simPartName() {
      return this.parts.find((p) => p.id === this.simPart).name;
    },
    get simWeather() {
      if (this.sim.rain) return { id: "rainy", name: "Yağmurlu" };
      if (this.sim.temp >= this.weather.hotAbove) return { id: "hot", name: "Sıcak" };
      if (this.sim.temp <= this.weather.coldBelow) return { id: "cold", name: "Soğuk" };
      return { id: null, name: "Ilıman" };
    },
    get simBusy() {
      return this.sim.crowd >= this.crowd.busyAbove;
    },
    signals(p) {
      const cat = p.category;
      const segment = this.age.segments.find((s) => s.id === this.sim.age && s.on);
      const weatherCats = this.simWeather.id ? this.weather.rules[this.simWeather.id] : [];
      const prep = prepLevels.find((l) => l.id === this.crowd.prep[cat]).score;
      const m = (margin[p.id] ?? 3) / 5;
      let crowd = 0.5;
      if (this.simBusy && this.crowd.fastWhenBusy) crowd = prep;
      else if (!this.simBusy && this.crowd.marginWhenQuiet) crowd = m;
      return {
        time: this.slots[cat].includes(this.simPart) ? 1 : 0,
        weather: weatherCats.includes(cat) ? 1 : 0,
        crowd,
        preference: this.preference.popular && p.popular ? 1 : 0.3,
        age: segment && this.age.askCustomer && segment.cats.includes(cat) ? 1 : 0,
        margin: m,
      };
    },
    get picks() {
      if (!this.enabled) return [];
      return products
        .filter((p) => !this.limits.excluded.includes(p.id))
        .map((p) => {
          const s = this.signals(p);
          const parts = factorList
            .filter((f) => this.factors[f.id].on)
            .map((f) => ({ name: f.name, value: (this.factors[f.id].weight / 100) * s[f.id] }));
          const score = parts.reduce((sum, x) => sum + x.value, 0);
          const reasons = parts.filter((x) => x.value > 0.3).sort((a, b) => b.value - a.value).slice(0, 3).map((x) => x.name);
          return { ...p, score, reasons };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, this.limits.maxPicks);
    },
    formatPrice,
  };
}
