import { TABLE_COUNT } from "./sales-data";
import { toast } from "./toast";
import { confirmDialog } from "./confirm-dialog";

// Staff list and waiter-call routing. Demo only: nothing is saved yet.
const roles = ["Garson", "Barista", "Mutfak", "Kasa", "Müdür"];
const shifts = [
  { id: "sabah", name: "Sabah (08:00 - 16:00)" },
  { id: "aksam", name: "Akşam (16:00 - 24:00)" },
  { id: "tam", name: "Tam gün" },
];
const channels = [
  { id: "app", name: "Panel uygulaması" },
  { id: "sms", name: "SMS" },
  { id: "both", name: "Uygulama + SMS" },
];

const photo = (n) => `images/user/user-${String(n).padStart(2, "0")}.jpg`;

export const demoStaff = [
  { id: 1, name: "Elif Kaya", role: "Garson", phone: "+90 532 111 11 11", photo: photo(17), shift: "sabah", onShift: true, tables: [1, 2, 3, 4], notify: true, channel: "app" },
  { id: 2, name: "Burak Demir", role: "Garson", phone: "+90 532 222 22 22", photo: photo(2), shift: "sabah", onShift: true, tables: [5, 6, 7, 8], notify: true, channel: "both" },
  { id: 3, name: "Zeynep Arslan", role: "Garson", phone: "+90 532 333 33 33", photo: photo(18), shift: "aksam", onShift: false, tables: [9, 10, 11, 12], notify: true, channel: "app" },
  { id: 4, name: "Can Öztürk", role: "Barista", phone: "+90 532 444 44 44", photo: photo(3), shift: "tam", onShift: true, tables: [], notify: false, channel: "app" },
  { id: 5, name: "Mert Yıldız", role: "Mutfak", phone: "+90 532 555 55 55", photo: photo(4), shift: "tam", onShift: true, tables: [], notify: false, channel: "app" },
  { id: 6, name: "Ayşe Çelik", role: "Müdür", phone: "+90 532 666 66 66", photo: photo(19), shift: "tam", onShift: true, tables: [], notify: true, channel: "app" },
];

const emptyForm = () => ({
  id: null,
  name: "",
  role: "Garson",
  phone: "",
  photo: "",
  shift: "sabah",
  onShift: true,
  tables: [],
  notify: true,
  channel: "app",
});

export default function staff() {
  return {
    roles,
    shifts,
    channels,
    tableCount: TABLE_COUNT,
    staff: demoStaff.map((s) => ({ ...s, tables: [...s.tables] })),
    roleFilter: "",

    // Waiter call routing
    routing: { mode: "owner", fallback: true, escalate: true, escalateAfter: 5 },
    testTable: 1,

    isModalOpen: false,
    form: emptyForm(),
    error: "",

    get visible() {
      return this.staff.filter((s) => !this.roleFilter || s.role === this.roleFilter);
    },
    get onShiftCount() {
      return this.staff.filter((s) => s.onShift).length;
    },
    get receivers() {
      return this.staff.filter((s) => s.notify && s.onShift && s.role !== "Müdür");
    },
    get unassignedTables() {
      const owned = new Set(this.staff.filter((s) => s.role === "Garson").flatMap((s) => s.tables));
      return Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).filter((t) => !owned.has(t));
    },
    get managers() {
      return this.staff.filter((s) => s.role === "Müdür" && s.notify && s.onShift);
    },

    // Who gets the notification when the given table presses "Garson çağır".
    recipientsFor(table) {
      const owners = this.receivers.filter((s) => s.tables.includes(table));
      if (this.routing.mode === "all") return this.receivers;
      if (this.routing.mode === "round") {
        const pool = owners.length ? owners : this.receivers;
        return pool.slice(0, 1);
      }
      if (owners.length) return owners;
      return this.routing.fallback ? this.receivers : [];
    },
    get testRecipients() {
      return this.recipientsFor(Number(this.testTable));
    },
    get testNote() {
      const t = Number(this.testTable);
      if (!this.testRecipients.length) return "Bu masanın çağrısı kimseye ulaşmıyor!";
      const owners = this.receivers.filter((s) => s.tables.includes(t));
      if (this.routing.mode === "owner" && !owners.length) return "Sorumlu garson vardiyada değil; vardiyadaki tüm garsonlara gider.";
      return "";
    },

    channelName(id) {
      return channels.find((c) => c.id === id)?.name ?? id;
    },
    shiftName(id) {
      return shifts.find((s) => s.id === id)?.name ?? id;
    },
    toggleTable(list, n) {
      const i = list.indexOf(n);
      if (i === -1) list.push(n);
      else list.splice(i, 1);
      list.sort((a, b) => a - b);
    },

    openNew() {
      this.form = emptyForm();
      this.error = "";
      this.isModalOpen = true;
    },
    openEdit(person) {
      this.form = { ...person, tables: [...person.tables] };
      this.error = "";
      this.isModalOpen = true;
    },
    pickPhoto(event) {
      const file = event.target.files[0];
      if (file) this.form.photo = URL.createObjectURL(file);
    },
    save() {
      if (!this.form.name.trim()) return (this.error = "Ad soyad boş olamaz.");
      const item = { ...this.form, name: this.form.name.trim() };
      if (item.role !== "Garson") item.tables = [];
      if (item.id) {
        const i = this.staff.findIndex((s) => s.id === item.id);
        this.staff.splice(i, 1, item);
        toast(`${item.name} bilgileri güncellendi.`);
      } else {
        item.id = Date.now();
        this.staff.push(item);
        toast(`${item.name} personel listesine eklendi.`, "success", "Personel eklendi");
      }
      this.isModalOpen = false;
    },
    async remove(person) {
      const ok = await confirmDialog({
        title: "Personel silinsin mi?",
        item: person.name,
        message: "personel listesinden çıkarılacak ve garson çağrısı bildirimi almayacak.",
      });
      if (ok) {
        this.staff = this.staff.filter((s) => s.id !== person.id);
        toast(`${person.name} personel listesinden çıkarıldı.`, "danger");
      }
    },
    initials(name) {
      return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toLocaleUpperCase("tr");
    },
  };
}
