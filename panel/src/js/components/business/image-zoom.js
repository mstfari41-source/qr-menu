// Click any <img data-zoom> to see it large; click, × or Esc closes it.
export function startImageZoom() {
  document.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-zoom]");
    if (!img || !img.src) return;
    e.preventDefault();
    open(img.currentSrc || img.src, img.alt);
  });
}

function open(src, caption) {
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", caption || "Görsel");
  overlay.className =
    "fixed inset-0 z-[100003] flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-gray-900/80 p-4 backdrop-blur-sm transition-opacity duration-150 sm:p-8";
  overlay.style.opacity = "0";

  const close = () => {
    document.removeEventListener("keydown", onKey, true);
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 150);
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Kapat");
  button.className =
    "absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20";
  button.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>';

  const image = document.createElement("img");
  image.src = src;
  image.alt = caption || "";
  // Small images (e.g. staff photos) are scaled up to at least 24rem wide.
  image.className = "max-h-[80vh] min-w-[min(24rem,90vw)] max-w-full rounded-2xl object-contain shadow-2xl";

  overlay.append(button, image);
  if (caption) {
    const text = document.createElement("p");
    text.className = "text-base font-medium text-white";
    text.textContent = caption;
    overlay.append(text);
  }

  overlay.addEventListener("click", close);
  document.addEventListener("keydown", onKey, true);
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = "1";
    button.focus();
  }, 10);
}
