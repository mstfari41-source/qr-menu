import { businessUrl } from "../../routes";
// General notifications for the header bell (not orders / waiter calls —
// those live on Canlı Servis). Demo items are seeded; calendar reminders are
// added when they fire. "Read" state is remembered in this browser.
const READ_KEY = "panel-notices-read";
const MIN = 60 * 1000;

export const noticeTypes = {
  reminder: { label: "Hatırlatıcı", badge: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400", icon: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />' },
  stock: { label: "Stok", badge: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400", icon: '<path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" />' },
  report: { label: "Rapor", badge: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400", icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />' },
  ai: { label: "Yapay zekâ", badge: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400", icon: '<path d="M10 3.75l1.6 4.65 4.65 1.6-4.65 1.6L10 16.25l-1.6-4.65L3.75 10l4.65-1.6z" /><path d="M17.5 14.25l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />' },
  system: { label: "Sistem", badge: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400", icon: '<circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />' },
};

function loadRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
}

function demoNotices() {
  const now = Date.now();
  return [
    { id: "n-stock-kunefe", type: "stock", title: "Fıstıklı künefe tükendi", text: "Ürün menüde \"Tükendi\" olarak görünüyor.", time: now - 25 * MIN, link: businessUrl("menu") },
    { id: "n-ai-daily", type: "ai", title: "Günün Önerisi güncellendi", text: "Yapay zekâ akşam saatleri için Latte'yi seçti.", time: now - 70 * MIN, link: businessUrl() },
    { id: "n-report-day", type: "report", title: "Dünün satış raporu hazır", text: "Ciro geçen haftanın aynı gününe göre %12 arttı.", time: now - 3 * 60 * MIN, link: businessUrl("satislar") },
    { id: "n-sub-renew", type: "system", title: "Abonelik yenilemesi yaklaşıyor", text: "Paketinizin yenilenmesine 5 gün kaldı.", time: now - 20 * 60 * MIN, link: businessUrl("profil") },
    { id: "n-system-update", type: "system", title: "Panel güncellendi", text: "Yeni Canlı Servis ekranı kullanıma açıldı.", time: now - 26 * 60 * MIN, link: businessUrl("canli-servis") },
  ];
}

export function registerNoticesStore(Alpine) {
  const read = loadRead();
  const saveRead = () => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...read]));
    } catch {
      // storage unavailable: read state lasts for this page only
    }
  };

  Alpine.store("notices", {
    types: noticeTypes,
    items: demoNotices().map((n) => ({ ...n, read: read.has(n.id) })),

    get sorted() {
      return [...this.items].sort((a, b) => b.time - a.time);
    },
    get unread() {
      return this.items.filter((n) => !n.read).length;
    },
    add(notice) {
      if (this.items.some((n) => n.id === notice.id)) return;
      this.items.push({ time: Date.now(), read: false, ...notice });
    },
    markRead(notice) {
      notice.read = true;
      read.add(notice.id);
      saveRead();
    },
    markAllRead() {
      this.items.forEach((n) => this.markRead(n));
    },
    ago(ts) {
      const m = Math.max(0, Math.round((Date.now() - ts) / MIN));
      if (m < 1) return "az önce";
      if (m < 60) return `${m} dk önce`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} sa önce`;
      return `${Math.floor(h / 24)} gün önce`;
    },
  });
}
