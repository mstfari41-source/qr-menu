// Readable addresses for every screen, shared by the dev server (webpack.config.js),
// the production rewrites (src/_redirects) and the pages' own links.
//
//   /beecafe                         business home
//   /beecafe/menu                    a business panel page (see BUSINESS_PAGES)
//   /beecafe/giris                   business sign-in
//   /beecafe/garson/elif-kaya-k7m2qa a waiter's own screen (name + private key)
//   /super, /super/giris             super panel home and sign-in
//   /super/isletmeler/beecafe        one business in the super panel ("yeni" for a new one)
//
// Plain CommonJS so webpack.config.js can require it too.

// Address part -> page file (without .html)
const BUSINESS_PAGES = {
  "": "index",
  giris: "signin",
  "canli-servis": "canli-servis",
  "garson-ekrani": "garson",
  menu: "menu",
  story: "story",
  "menu-ayarlari": "menu-ayarlari",
  "yapay-zeka": "yapay-zeka",
  "qr-islemleri": "qr-islemleri",
  satislar: "satislar",
  personeller: "personeller",
  yetkilendirme: "yetkiler",
  takvim: "calendar",
  profil: "profile",
};

const SUPER_PAGES = {
  "": "super-isletmeler",
  giris: "super-giris",
  isletmeler: "super-isletmeler",
};

const DEFAULT_BUSINESS = "beecafe";

// "Elif Kaya" -> "elif-kaya"
const slugify = (text) =>
  String(text)
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Which page file serves an address, or null when it is not one of ours.
// `isPage(name)` says whether a page file of that name exists, so old
// single-word addresses like /calendar keep working.
function resolve(pathname, isPage = () => false) {
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const [first = "", second = "", third = ""] = parts;
  if (!first || parts.length > 3) return null;

  if (first === "super") {
    if (second === "isletmeler" && third && parts.length === 3) return "super-isletme";
    return parts.length <= 2 && second in SUPER_PAGES ? SUPER_PAGES[second] : null;
  }
  if (!/^[a-z0-9-]+$/.test(first)) return null;
  if (parts.length === 1 && isPage(first)) return first;
  if (second === "garson" && third && parts.length === 3) return "garson-ekrani";
  return parts.length <= 2 && second in BUSINESS_PAGES ? BUSINESS_PAGES[second] : null;
}

// --- helpers for the pages (browser only) ---

// Business slug in the current address; old addresses (menu.html) fall back to the demo business.
function currentBusiness() {
  const first = location.pathname.split("/")[1] ?? "";
  if (first === "super" || !/^[a-z0-9-]+$/.test(first) || first.endsWith(".html")) return DEFAULT_BUSINESS;
  return resolve(location.pathname) ? first : DEFAULT_BUSINESS;
}

// "/beecafe/menu"; page is an address part from BUSINESS_PAGES ("" for home).
const businessUrl = (page = "", business = currentBusiness()) => `/${business}${page ? "/" + page : ""}`;
const superUrl = (page = "") => `/super${page ? "/" + page : ""}`;
const superBusinessUrl = (slug) => superUrl(`isletmeler/${slug}`);
const waiterUrl = (person, business = currentBusiness()) =>
  `/${business}/garson/${slugify(person.name)}-${person.key}`;

// The last address part, e.g. the business slug in /super/isletmeler/<slug>.
const lastPart = () => location.pathname.replace(/\/+$/, "").split("/").pop();

module.exports = {
  BUSINESS_PAGES,
  SUPER_PAGES,
  DEFAULT_BUSINESS,
  slugify,
  resolve,
  currentBusiness,
  businessUrl,
  superUrl,
  superBusinessUrl,
  waiterUrl,
  lastPart,
};
