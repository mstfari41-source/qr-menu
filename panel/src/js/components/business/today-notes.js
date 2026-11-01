import { loadNotes, saveNotes, toDateStr } from "./notes-store";

// Dashboard card: today's calendar notes, refreshed when notes change.
export default function todayNotes() {
  return {
    notes: [],
    tomorrowCount: 0,

    init() {
      this.refresh();
      window.addEventListener("notes-changed", () => this.refresh());
      window.addEventListener("storage", (e) => e.key === "panel-notes" && this.refresh());
      setInterval(() => this.refresh(), 60000);
    },
    refresh() {
      const all = loadNotes();
      const today = toDateStr(new Date());
      const tomorrow = toDateStr(new Date(Date.now() + 24 * 60 * 60 * 1000));
      this.notes = all
        .filter((n) => n.date === today)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
      this.tomorrowCount = all.filter((n) => n.date === tomorrow).length;
    },
    isPast(note) {
      return note.time && new Date(`${note.date}T${note.time}`) < new Date();
    },
    toggleDone(note) {
      const all = loadNotes();
      const n = all.find((x) => x.id === note.id);
      if (!n) return;
      n.done = !n.done;
      saveNotes(all);
    },
  };
}
