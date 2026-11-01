// Businesses on the platform, as the super panel manages them.
// Name, logo, owner and billing details live here and only the super panel edits them;
// the business panel shows them read-only. Demo only: nothing is saved yet.
export const MENU_HOST = "menu.arimedya.com/";

export const packages = [
  { id: "starter", name: "Başlangıç", price: 499, tables: 10 },
  { id: "pro", name: "Pro", price: 999, tables: 30 },
  { id: "enterprise", name: "Kurumsal", price: 1999, tables: null },
];

export const statuses = [
  { id: "active", name: "Aktif", badge: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/30" },
  { id: "trial", name: "Deneme", badge: "bg-brand-50 text-brand-600 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:ring-brand-500/30" },
  { id: "suspended", name: "Askıda", badge: "bg-red-50 text-red-600 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30" },
];

export const categories = ["Kafe", "Restoran", "Pastane", "Bar", "Otel", "Fast food"];

// Colors for businesses without an uploaded logo (initials badge).
const tints = ["bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500", "bg-violet-500", "bg-teal-500"];
export const tintFor = (id) => tints[(id - 1) % tints.length];
export const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("tr-TR"))
    .join("");

const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);

export const demoBusinesses = [
  {
    id: 1,
    name: "BeeCafe",
    slug: "beecafe",
    logo: "images/logo/beecafe-mark.svg",
    category: "Kafe",
    phone: "+90 216 000 00 00",
    email: "info@beecafe.com.tr",
    address: "Bağdat Cad. No: 12",
    city: "Kadıköy / İstanbul",
    owner: { name: "Ahmet Yılmaz", phone: "+90 532 000 00 00", email: "ahmet@beecafe.com.tr" },
    billing: { title: "BeeCafe Gıda Ltd. Şti.", taxOffice: "Kadıköy", taxNo: "1234567890", sameAddress: true, address: "" },
    package: "pro",
    status: "active",
    startedAt: iso(-210),
    renewsAt: iso(155),
    tables: 12,
    note: "Pro pakete geçişte 2 ay indirim tanındı. Menü fotoğraflarını biz çektik.",
  },
  {
    id: 2,
    name: "Lavanta Pastanesi",
    slug: "lavanta",
    logo: "",
    category: "Pastane",
    phone: "+90 232 111 22 33",
    email: "merhaba@lavantapastane.com",
    address: "Kıbrıs Şehitleri Cad. No: 41",
    city: "Alsancak / İzmir",
    owner: { name: "Selin Aydın", phone: "+90 533 111 22 33", email: "selin@lavantapastane.com" },
    billing: { title: "Selin Aydın", taxOffice: "Konak", taxNo: "23456789012", sameAddress: true, address: "" },
    package: "starter",
    status: "active",
    startedAt: iso(-95),
    renewsAt: iso(9),
    tables: 8,
    note: "Yenileme için 3 Kasım'da aranacak; Pro paketi düşünüyor.",
  },
  {
    id: 3,
    name: "Köşe Burger",
    slug: "koseburger",
    logo: "",
    category: "Fast food",
    phone: "+90 312 444 55 66",
    email: "iletisim@koseburger.com",
    address: "Tunalı Hilmi Cad. No: 88",
    city: "Çankaya / Ankara",
    owner: { name: "Emre Koç", phone: "+90 535 444 55 66", email: "emre@koseburger.com" },
    billing: { title: "Köşe Gıda San. Tic. A.Ş.", taxOffice: "Kavaklıdere", taxNo: "3456789012", sameAddress: false, address: "OSTİM OSB 1234. Sok. No: 5, Yenimahalle / Ankara" },
    package: "enterprise",
    status: "active",
    startedAt: iso(-400),
    renewsAt: iso(330),
    tables: 34,
    note: "",
  },
  {
    id: 4,
    name: "Mavi Liman Restoran",
    slug: "maviliman",
    logo: "",
    category: "Restoran",
    phone: "+90 252 777 88 99",
    email: "rezervasyon@maviliman.com",
    address: "Kordon Boyu No: 3",
    city: "Bodrum / Muğla",
    owner: { name: "Deniz Şahin", phone: "+90 536 777 88 99", email: "deniz@maviliman.com" },
    billing: { title: "Mavi Liman Turizm Ltd. Şti.", taxOffice: "Bodrum", taxNo: "4567890123", sameAddress: true, address: "" },
    package: "pro",
    status: "trial",
    startedAt: iso(-6),
    renewsAt: iso(8),
    tables: 20,
    note: "Deneme bitince yaz sezonu için 6 aylık teklif verilecek.",
  },
  {
    id: 5,
    name: "Gece Kuşu Bar",
    slug: "gecekusu",
    logo: "",
    category: "Bar",
    phone: "+90 212 222 33 44",
    email: "info@gecekusu.com",
    address: "İstiklal Cad. No: 150",
    city: "Beyoğlu / İstanbul",
    owner: { name: "Kaan Erdem", phone: "+90 537 222 33 44", email: "kaan@gecekusu.com" },
    billing: { title: "Gece Kuşu Eğlence Ltd. Şti.", taxOffice: "Beyoğlu", taxNo: "5678901234", sameAddress: true, address: "" },
    package: "starter",
    status: "suspended",
    startedAt: iso(-160),
    renewsAt: iso(-12),
    tables: 10,
    note: "Ödeme gecikti, 2 kez arandı ulaşılamadı.",
  },
];

export const emptyBusiness = () => ({
  id: null,
  name: "",
  slug: "",
  logo: "",
  category: "Kafe",
  phone: "",
  email: "",
  address: "",
  city: "",
  owner: { name: "", phone: "", email: "" },
  billing: { title: "", taxOffice: "", taxNo: "", sameAddress: true, address: "" },
  package: "starter",
  status: "trial",
  startedAt: iso(0),
  renewsAt: iso(14),
  tables: 10,
  note: "",
});

// Days left until renewal (negative when overdue).
export const daysLeft = (b) => Math.ceil((new Date(b.renewsAt) - new Date(new Date().toISOString().slice(0, 10))) / day);

export const formatDate = (isoDate) =>
  isoDate ? new Date(isoDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";
