// Prominent pop-up messages for save / edit / delete actions.
// Usage: toast("Ürün kaydedildi") or toast("Silindi", "danger").
const DURATION = 3500;

const styles = {
  success: {
    card: "border-green-200 dark:border-green-500/30",
    badge: "bg-green-500",
    title: "Kaydedildi",
    icon: '<path d="M5 12l5 5L20 7" />',
  },
  danger: {
    card: "border-red-200 dark:border-red-500/30",
    badge: "bg-red-500",
    title: "Silindi",
    icon: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />',
  },
  error: {
    card: "border-red-200 dark:border-red-500/30",
    badge: "bg-red-500",
    title: "Kaydedilemedi",
    icon: '<path d="M12 8v5M12 16.5v.01" /><circle cx="12" cy="12" r="9" />',
  },
  off: {
    card: "border-gray-300 dark:border-gray-600",
    badge: "bg-gray-500",
    title: "Kapatıldı",
    icon: '<path d="M12 3v8" /><path d="M6.4 6.4a8 8 0 1 0 11.2 0" />',
  },
  order: {
    card: "border-green-200 dark:border-green-500/30",
    badge: "bg-green-500",
    title: "Yeni sipariş",
    icon: '<path d="M6 3.75h12v16.5l-2-1.25-2 1.25-2-1.25-2 1.25-2-1.25-2 1.25z" /><path d="M9 8.25h6M9 11.75h6M9 15.25h3.5" />',
  },
  call: {
    card: "border-red-200 dark:border-red-500/30",
    badge: "bg-red-500",
    title: "Garson çağırıyor",
    icon: '<path d="M3 18h18" /><path d="M5 18a7 7 0 0 1 14 0" /><path d="M12 11V8" /><path d="M10 8h4" />',
  },
};

let container;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.setAttribute("aria-live", "polite");
    container.className =
      "pointer-events-none fixed top-20 left-1/2 z-[100001] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2";
    document.body.appendChild(container);
  }
  return container;
}

const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function toast(message, type = "success", title) {
  const s = styles[type] ?? styles.success;
  const card = document.createElement("div");
  card.setAttribute("role", type === "error" ? "alert" : "status");
  card.className = `pointer-events-auto flex items-center gap-3 rounded-2xl border-2 bg-white p-4 shadow-theme-lg transition-all duration-300 dark:bg-gray-900 ${s.card}`;
  card.style.opacity = "0";
  card.style.transform = "translateY(-8px)";
  card.innerHTML = `
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${s.badge}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-gray-800 dark:text-white/90">${escape(title ?? s.title)}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">${escape(message)}</p>
    </div>
    <button type="button" aria-label="Kapat" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
    </button>`;

  const close = () => {
    card.style.opacity = "0";
    card.style.transform = "translateY(-8px)";
    setTimeout(() => card.remove(), 300);
  };
  card.querySelector("button").addEventListener("click", close);
  getContainer().appendChild(card);
  setTimeout(() => {
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, 20);
  setTimeout(close, DURATION);
}
