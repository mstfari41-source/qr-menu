// Delete confirmation in the panel's modal style (replaces the browser's confirm()).
// Usage: if (await confirmDialog({ title, item: "Menemen", message: "ürünü menüden kaldırılacak." })) { ... }
const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function confirmDialog({
  title = "Silmek istediğinize emin misiniz?",
  item = "",
  message = "",
  warning = "Bu işlem geri alınamaz, kayıt tamamen silinir.",
  confirmText = "Evet, sil",
  cancelText = "Vazgeç",
  icon = "trash", // "trash" or "power"
} = {}) {
  const iconPath =
    icon === "power"
      ? '<path d="M12 3v8" /><path d="M6.4 6.4a8 8 0 1 0 11.2 0" />'
      : '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />';
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const sentence = [item ? `<strong class="font-semibold text-gray-900 dark:text-white">${escape(item)}</strong>` : "", escape(message)]
      .filter(Boolean)
      .join(" ");

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[100002] flex items-center justify-center p-4 transition-opacity duration-100";
    overlay.style.opacity = "0";
    overlay.innerHTML = `
      <div data-backdrop class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] dark:bg-black/60"></div>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"
        class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-theme-lg dark:bg-gray-900">
        <div class="flex items-center gap-4 p-6">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPath}</svg>
          </span>
          <div class="min-w-0 flex-1">
            <h3 id="confirm-title" class="text-base font-semibold text-gray-800 dark:text-white/90">${escape(title)}</h3>
            <p id="confirm-message" class="mt-1.5 text-sm leading-6 text-gray-600 dark:text-gray-400">${sentence}</p>
            ${
              warning
                ? `<p class="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true"><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17v.01" /></svg>
                    ${escape(warning)}
                  </p>`
                : ""
            }
          </div>
        </div>
        <div class="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/3">
          <button type="button" data-act="cancel"
            class="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">${escape(cancelText)}</button>
          <button type="button" data-act="confirm"
            class="inline-flex h-10 items-center justify-center rounded-lg bg-red-500 px-4 text-sm font-medium text-white shadow-theme-xs hover:bg-red-600">${escape(confirmText)}</button>
        </div>
      </div>`;

    const close = (result) => {
      document.removeEventListener("keydown", onKey, true);
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 100);
      previousFocus?.focus?.();
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(false);
      }
    };

    overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-act=confirm]")) close(true);
      else if (e.target.closest("[data-act=cancel]") || e.target.hasAttribute("data-backdrop")) close(false);
    });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.style.opacity = "1";
      overlay.querySelector("[data-act=cancel]").focus();
    }, 0);
  });
}
