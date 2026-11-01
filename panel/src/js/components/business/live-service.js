// One screen for everything coming from the QR menu: table overview,
// waiter calls and orders, plus today's history. Data lives in $store.live.
const tableStates = {
  call: { label: "Garson çağırıyor", tile: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-500 animate-pulse" },
  new: { label: "Yeni sipariş", tile: "border-green-300 bg-green-50 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-400", dot: "bg-green-500" },
  preparing: { label: "Hazırlanıyor", tile: "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-400", dot: "bg-brand-500" },
  handling: { label: "Garson masada", tile: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-400", dot: "bg-yellow-400" },
  idle: { label: "Boş / sakin", tile: "border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400", dot: "bg-gray-300 dark:bg-gray-600" },
};

const columnThemes = {
  // Each column's button takes the colour of the stage the order moves to.
  new: { dot: "bg-green-500", head: "text-green-600 dark:text-green-400", button: "bg-brand-50 text-brand-600 ring-brand-200 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:ring-brand-500/30" },
  preparing: { dot: "bg-brand-500", head: "text-brand-600 dark:text-brand-400", button: "bg-gray-100 text-gray-700 ring-gray-300 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/20" },
};

export default function liveService() {
  return {
    tab: "active",
    table: null, // table filter; null = all tables
    tableStates,
    columnThemes,

    get live() {
      return this.$store.live;
    },
    get activeSteps() {
      return this.live.steps.filter((s) => s.id !== "delivered");
    },
    match(item) {
      return this.table === null || item.table === this.table;
    },
    orders(status) {
      return this.live.ordersBy(status).filter((o) => this.match(o));
    },
    get calls() {
      return this.live.activeCalls.filter((c) => this.match(c));
    },
    get deliveredOrders() {
      return this.live.ordersBy("delivered").slice().reverse().filter((o) => this.match(o));
    },
    get doneCalls() {
      return this.live.doneCalls.filter((c) => this.match(c));
    },
    toggleTable(n) {
      this.table = this.table === n ? null : n;
    },
    late(order) {
      return this.live.now - order.createdAt > 10 * 60 * 1000;
    },
    formatPrice: (n) => `${n.toLocaleString("tr-TR")} ₺`,
  };
}
