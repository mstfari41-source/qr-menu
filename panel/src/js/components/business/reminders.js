import { loadNotes, saveNotes, remindAt } from "./notes-store";

// Checks calendar notes on every panel page and shows a pop-up when a
// reminder is due. Reminders missed while the panel was closed are shown
// on the next visit if they are less than 12 hours old.
const CHECK_EVERY = 15000;
const MAX_LATE = 12 * 60 * 60 * 1000;

let container;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.setAttribute("aria-live", "polite");
    container.className = "fixed top-20 right-4 z-[100000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3";
    document.body.appendChild(container);
  }
  return container;
}

const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function showReminder(note) {
  const when = note.time ? `${new Date(`${note.date}T00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} · ${note.time}` : "";
  const card = document.createElement("div");
  card.setAttribute("role", "alert");
  card.className = "rounded-2xl border border-orange-200 bg-white p-4 shadow-theme-lg dark:border-orange-500/30 dark:bg-gray-900";
  card.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium text-orange-600 dark:text-orange-400">Hatırlatıcı · ${escape(when)}</p>
        <p class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">${escape(note.title)}</p>
        ${note.note ? `<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${escape(note.note)}</p>` : ""}
        <div class="mt-3 flex gap-2">
          <button type="button" data-act="done" class="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600">Tamamlandı</button>
          <button type="button" data-act="close" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Kapat</button>
          <a href="calendar.html" class="ms-auto self-center text-xs font-medium text-brand-500 hover:underline">Takvimde aç</a>
        </div>
      </div>
    </div>`;
  card.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "done") {
      const notes = loadNotes();
      const n = notes.find((x) => x.id === note.id);
      if (n) n.done = true;
      saveNotes(notes);
    }
    card.remove();
  });
  getContainer().appendChild(card);

  // Keep it in the header bell too, so a closed pop-up is not lost.
  window.Alpine?.store("notices")?.add({
    id: `n-reminder-${note.id}`,
    type: "reminder",
    title: note.title,
    text: [when, note.note].filter(Boolean).join(" · "),
    link: "calendar.html",
  });

  // Also show a system notification when the browser allows it (works in a background tab).
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(`Hatırlatıcı: ${note.title}`, { body: [when, note.note].filter(Boolean).join(" · ") });
    } catch {
      // some browsers only allow notifications from a service worker
    }
  }
}

function check() {
  const notes = loadNotes();
  const now = Date.now();
  let changed = false;
  for (const note of notes) {
    if (!note.remind || note.notified || note.done) continue;
    const at = remindAt(note);
    if (!at || at.getTime() > now) continue;
    note.notified = true;
    changed = true;
    if (now - at.getTime() <= MAX_LATE) showReminder(note);
  }
  if (changed) saveNotes(notes);
}

export function startReminders() {
  check();
  setInterval(check, CHECK_EVERY);
}
