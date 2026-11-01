import { demoStaff } from "./staff";
import { toast } from "./toast";

// Owner-only screen: which staff can sign in to the panel and what they may do there.
// Demo only: changes live until the page is reloaded.
export const levels = [
  { id: "none", name: "Yok" },
  { id: "view", name: "Görüntüle" },
  { id: "edit", name: "Düzenle" },
];

// Panel sections, grouped like the sidebar. `only` limits the levels a section offers.
export const moduleGroups = [
  {
    name: "Servis",
    modules: [
      { id: "dashboard", name: "Ana Sayfa", hint: "Günlük özet ve grafikler", only: ["none", "view"] },
      { id: "live", name: "Canlı Servis", hint: "Siparişler, garson çağrıları, masalar" },
      { id: "waiter", name: "Garson Ekranı", hint: "Çağrı yanıtlama, sipariş alma" },
    ],
  },
  {
    name: "Menü",
    modules: [
      { id: "menu", name: "Menü", hint: "Ürünler, kategoriler, fiyatlar" },
      { id: "story", name: "Story", hint: "Menüdeki story görselleri" },
      { id: "menuSettings", name: "Menü Ayarları", hint: "Renk, öneri saatleri" },
      { id: "ai", name: "Yapay Zekâ Ayarları", hint: "Otomatik öneriler" },
      { id: "qr", name: "QR İşlemleri", hint: "Masa QR kodları", only: ["none", "view"] },
    ],
  },
  {
    name: "İşletme",
    modules: [
      { id: "sales", name: "Satışlar", hint: "Ciro ve satış raporları", only: ["none", "view"] },
      { id: "staff", name: "Personeller", hint: "Personel listesi, vardiyalar" },
      { id: "calendar", name: "Takvim", hint: "Notlar ve hatırlatmalar" },
    ],
  },
];
const modules = moduleGroups.flatMap((g) => g.modules);

// Sensitive actions the owner may want to keep to themself even inside an allowed section.
export const actions = [
  { id: "cancelOrder", name: "Sipariş reddetme / iptal", hint: "Canlı Servis ve Garson Ekranı'nda" },
  { id: "changePrice", name: "Fiyat değiştirme", hint: "Menü düzenleme yetkisi olsa bile" },
  { id: "qrSwitch", name: "Garson çağrısı / sepeti kapatma", hint: "QR menüdeki özellikleri" },
  { id: "seeRevenue", name: "Ciro tutarlarını görme", hint: "Kapalıysa yalnızca adetler görünür" },
  { id: "manageStaff", name: "Personel ekleme / silme", hint: "Personeller sayfasında" },
];

const all = (level) => Object.fromEntries(modules.map((m) => [m.id, level]));
const pick = (level, ids) => ({ ...all("none"), ...Object.fromEntries(ids.map((id) => [id, level])) });
const flags = (ids = []) => Object.fromEntries(actions.map((a) => [a.id, ids.includes(a.id)]));

// One-click starting points; the owner can fine-tune afterwards.
export const presets = [
  {
    id: "manager",
    name: "Müdür",
    perms: { ...all("edit"), dashboard: "view", qr: "view", sales: "view", ai: "view" },
    actions: flags(["cancelOrder", "changePrice", "qrSwitch", "seeRevenue"]),
  },
  {
    id: "cashier",
    name: "Kasa",
    perms: { ...pick("view", ["dashboard", "sales", "menu"]), live: "edit" },
    actions: flags(["cancelOrder", "seeRevenue"]),
  },
  { id: "waiter", name: "Garson", perms: { ...pick("view", ["live", "menu"]), waiter: "edit" }, actions: flags() },
  { id: "kitchen", name: "Mutfak / Bar", perms: pick("view", ["live", "menu"]), actions: flags() },
  { id: "viewer", name: "Sadece görüntüleme", perms: modules.reduce((p, m) => ({ ...p, [m.id]: "view" }), {}), actions: flags() },
];
const presetFor = (role) =>
  presets.find((p) => p.id === { Müdür: "manager", Kasa: "cashier", Garson: "waiter", Mutfak: "kitchen", Barista: "kitchen" }[role]);

const slug = (name) =>
  name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .split(" ")[0];

// Demo: the manager and one waiter already use the panel.
const withAccess = { 6: true, 1: true };

function seed() {
  return demoStaff.map((s) => {
    const preset = presetFor(s.role) ?? presets.at(-1);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      photo: s.photo,
      access: !!withAccess[s.id],
      email: withAccess[s.id] ? `${slug(s.name)}@beecafe.com.tr` : "",
      invited: !!withAccess[s.id],
      perms: { ...preset.perms },
      actions: { ...preset.actions },
    };
  });
}

export default function permissions() {
  const people = seed();
  return {
    levels,
    moduleGroups,
    actions,
    presets,
    people,
    selectedId: people.find((p) => p.access)?.id ?? people[0].id,
    saved: JSON.stringify(people),

    get isOwner() {
      return this.$store.session.isOwner;
    },
    get person() {
      return this.people.find((p) => p.id === this.selectedId);
    },
    get dirty() {
      return JSON.stringify(this.people) !== this.saved;
    },
    get accessCount() {
      return this.people.filter((p) => p.access).length;
    },
    levelsFor(m) {
      return m.only ? levels.filter((l) => m.only.includes(l.id)) : levels;
    },
    // Sidebar items this person would see, for the preview.
    visibleModules(p = this.person) {
      return modules.filter((m) => p.perms[m.id] !== "none");
    },
    summary(p) {
      if (!p.access) return "Panele erişimi yok";
      const n = this.visibleModules(p).length;
      return n === modules.length ? "Tüm bölümler" : `${n} bölüm`;
    },
    activePreset(p = this.person) {
      return presets.find(
        (pr) => JSON.stringify(pr.perms) === JSON.stringify(p.perms) && JSON.stringify(pr.actions) === JSON.stringify(p.actions),
      )?.id;
    },
    applyPreset(preset) {
      this.person.perms = { ...preset.perms };
      this.person.actions = { ...preset.actions };
    },
    setLevel(m, level) {
      this.person.perms[m.id] = level;
    },
    toggleAccess() {
      const p = this.person;
      p.access = !p.access;
      if (p.access && !p.email) p.email = `${slug(p.name)}@beecafe.com.tr`;
    },
    invite() {
      const p = this.person;
      if (!/^\S+@\S+\.\S+$/.test(p.email)) return toast("Geçerli bir e-posta adresi girin.", "error", "E-posta eksik");
      p.invited = true;
      toast(`${p.email} adresine giriş daveti gönderildi.`, "success", "Davet gönderildi");
    },
    save() {
      this.saved = JSON.stringify(this.people);
      toast(`${this.person.name} için yetkiler güncellendi.`, "success", "Yetkiler kaydedildi");
    },
    reset() {
      const before = JSON.parse(this.saved);
      this.people.forEach((p, i) => Object.assign(p, before[i]));
    },
  };
}
