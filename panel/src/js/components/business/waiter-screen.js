import { demoStaff } from "./staff";
import { confirmDialog } from "./confirm-dialog";
import { categories, products } from "./menu-data";
import { toast } from "./toast";

// Phone-first screen for a waiter: their tables' waiter calls and orders,
// with big buttons to answer a call, confirm an order and mark it delivered.
// Lives inside the panel for now; it will become a separate app later.
const waiters = demoStaff.filter((s) => s.role === "Garson");

export default function waiterScreen() {
  return {
    waiters,
    meId: waiters[0]?.id,
    allTables: false,

    // "Sipariş Al" sheet
    categories,
    sheetOpen: false,
    orderTable: null,
    orderCategory: categories[0].id,
    cart: {},
    orderNote: "",

    breakAsk: null,

    get me() {
      return waiters.find((w) => w.id === this.meId);
    },
    get live() {
      return this.$store.live;
    },
    // My tables; a waiter without tables (or off shift) sees every table.
    mine(table) {
      if (this.allTables || !this.me?.tables.length) return true;
      return this.me.tables.includes(table);
    },
    get waitingCalls() {
      return this.live.waitingCalls.filter((c) => this.mine(c.table));
    },
    get newOrders() {
      return this.live.ordersBy("new").filter((o) => this.mine(o.table));
    },
    get preparing() {
      return this.live.ordersBy("preparing").filter((o) => this.mine(o.table));
    },
    get pendingCount() {
      return this.waitingCalls.length + this.newOrders.length;
    },

    // On break the waiter's tables are routed to the other on-shift waiters.
    get onBreak() {
      return !!this.me?.breakSince;
    },
    // Asks first in the waiter screen's own bottom sheet ("start" | "end").
    toggleBreak() {
      if (this.me) this.breakAsk = this.onBreak ? "end" : "start";
    },
    confirmBreak() {
      const me = this.me;
      this.breakAsk = null;
      if (!me) return;
      if (me.breakSince) {
        me.breakSince = null;
        toast("Çağrılar yeniden sana geliyor.", "success", "Mola bitti");
      } else {
        me.breakSince = Date.now();
        toast("Masalarının çağrıları diğer garsonlara yönlendiriliyor.", "off", "Moladasın");
      }
    },

    // "Geliyorum" answers and closes the call in one tap.
    answer(call) {
      this.live.finishCall(call, this.me?.name);
    },
    confirmOrder(order) {
      this.live.advanceOrder(order);
    },
    deliver(order) {
      this.live.advanceOrder(order);
    },
    async reject(order) {
      const ok = await confirmDialog({
        title: "Sipariş reddedilsin mi?",
        item: `Masa ${order.table} · #${order.no}`,
        message: "siparişi iptal edilecek.",
        warning: "Müşteriye siparişin alınamadığı bildirilecek.",
        confirmText: "Evet, reddet",
      });
      if (ok) this.live.cancelOrder(order);
    },
    // --- Sipariş Al ---
    get orderTables() {
      const all = Array.from({ length: this.live.tableCount }, (_, i) => i + 1);
      const mine = this.me?.tables ?? [];
      // My tables first, then the rest.
      return [...mine, ...all.filter((n) => !mine.includes(n))];
    },
    get categoryProducts() {
      return products.filter((p) => p.category === this.orderCategory);
    },
    get cartLines() {
      return products
        .filter((p) => this.cart[p.id])
        .map((p) => ({ id: p.id, name: p.name, qty: this.cart[p.id], price: p.price }));
    },
    get cartCount() {
      return this.cartLines.reduce((n, l) => n + l.qty, 0);
    },
    get cartTotal() {
      return this.cartLines.reduce((s, l) => s + l.qty * l.price, 0);
    },
    qty(id) {
      return this.cart[id] || 0;
    },
    inc(id) {
      this.cart = { ...this.cart, [id]: this.qty(id) + 1 };
    },
    dec(id) {
      const n = this.qty(id) - 1;
      const next = { ...this.cart };
      if (n > 0) next[id] = n;
      else delete next[id];
      this.cart = next;
    },
    openOrder() {
      this.orderTable = this.me?.tables[0] ?? null;
      this.orderCategory = categories[0].id;
      this.cart = {};
      this.orderNote = "";
      this.sheetOpen = true;
    },
    sendOrder() {
      if (!this.orderTable) return toast("Önce masa seçin.", "error", "Masa seçilmedi");
      if (!this.cartCount) return toast("Siparişe en az bir ürün ekleyin.", "error", "Ürün eklenmedi");
      this.live.addWaiterOrder({
        table: this.orderTable,
        lines: this.cartLines,
        note: this.orderNote.trim(),
        waiter: this.me?.name ?? "Garson",
      });
      this.sheetOpen = false;
    },

    formatPrice: (n) => `${n.toLocaleString("tr-TR")} ₺`,
  };
}
