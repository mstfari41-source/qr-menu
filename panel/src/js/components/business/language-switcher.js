import { languages } from "./menu-data";

// Panel language picker (in the profile menu), with the same flags as the QR menu.
// The choice is remembered in this browser. Panel texts are Turkish for now.
const KEY = "panel-lang";

const starPoints = (cx, cy, R, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI + (i * Math.PI) / 5;
    const q = i % 2 ? r : R;
    return `${(cx + q * Math.cos(a)).toFixed(2)},${(cy + q * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

const FLAGS = {
  tr: `<rect width="30" height="20" fill="#E30A17"/><circle cx="12.8" cy="10" r="5" fill="#fff"/><circle cx="14.2" cy="10" r="4" fill="#E30A17"/><polygon fill="#fff" points="${starPoints(19.2, 10, 2.5, 1)}"/>`,
  en: `<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6"/><path d="M15 0V20M0 10H30" stroke="#C8102E" stroke-width="3.4"/>`,
  de: `<rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#DD0000"/><rect y="13.33" width="30" height="6.67" fill="#FFCE00"/>`,
  ru: `<rect width="30" height="6.67" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>`,
};

const flagSvg = (id) => `<svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" class="h-full w-full" aria-hidden="true">${FLAGS[id]}</svg>`;

function savedLang() {
  try {
    const l = localStorage.getItem(KEY);
    return languages.some((x) => x.id === l) ? l : "tr";
  } catch {
    return "tr";
  }
}

export default function languageSwitcher() {
  return {
    languages,
    current: savedLang(),

    get currentLang() {
      return languages.find((l) => l.id === this.current);
    },
    flag: flagSvg,
    choose(id) {
      this.current = id;
      try {
        localStorage.setItem(KEY, id);
      } catch {
        // storage unavailable: choice lasts for this page only
      }
      window.dispatchEvent(new CustomEvent("panel-lang-changed", { detail: { lang: id } }));
    },
  };
}
