// Calendar notes with optional reminders.
// Demo: kept in this browser's localStorage so notes survive page changes;
// a real server will replace this when the panel is connected.
const KEY = "panel-notes";

export const noteColors = [
  { id: "Primary", name: "Mavi", dot: "bg-brand-500" },
  { id: "Danger", name: "Kırmızı", dot: "bg-red-500" },
  { id: "Success", name: "Yeşil", dot: "bg-green-500" },
  { id: "Warning", name: "Turuncu", dot: "bg-orange-500" },
  { id: "Info", name: "Açık mavi", dot: "bg-blue-500" },
];

const pad = (n) => String(n).padStart(2, "0");
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// When the reminder should fire (null for notes without a time).
export function remindAt(note) {
  if (!note.time) return null;
  const at = new Date(`${note.date}T${note.time}`);
  return new Date(at.getTime() - (Number(note.remindBefore) || 0) * 60000);
}

function demoNotes() {
  const now = new Date();
  const inMinutes = (m) => new Date(now.getTime() + m * 60000);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const soon = inMinutes(2);
  const later = inMinutes(90);
  return [
    { id: "demo-1", title: "Kahve çekirdeği siparişi ver", note: "Tedarikçi: 5 kg espresso, 2 kg filtre", date: toDateStr(soon), time: toTimeStr(soon), color: "Warning", remind: true, remindBefore: 0, notified: false, done: false },
    { id: "demo-2", title: "Süt tedarikçisi gelecek", note: "Teslimatı kontrol et, faturayı al", date: toDateStr(later), time: toTimeStr(later), color: "Primary", remind: true, remindBefore: 15, notified: false, done: false },
    { id: "demo-3", title: "Personel toplantısı", note: "Hafta sonu vardiya planı", date: toDateStr(tomorrow), time: "10:00", color: "Success", remind: true, remindBefore: 30, notified: false, done: false },
    { id: "demo-4", title: "Vitrin temizliği", note: "", date: toDateStr(tomorrow), time: "", color: "Info", remind: false, remindBefore: 0, notified: false, done: false },
  ];
}

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage unavailable: fall back to demo notes
  }
  const notes = demoNotes();
  saveNotes(notes, false);
  return notes;
}

export function saveNotes(notes, announce = true) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    // storage unavailable: notes live only for this page
  }
  if (announce) window.dispatchEvent(new CustomEvent("notes-changed"));
}
