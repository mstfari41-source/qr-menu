import { formatPrice } from "./menu-data";
import { sales, loadSales } from "./sales-data";
import { statKinds, statIcon } from "./stat-styles";

const HOUR = 60 * 60 * 1000;

export default function salesTable() {
  return {
    sales,
    search: "",
    range: "720", // hours: 1, 24, 168 (7 days), 720 (30 days) or "all"
    table: "",
    payment: "",
    page: 1,
    perPage: 10,

    get filtered() {
      const q = this.search.trim().toLocaleLowerCase("tr");
      const since = this.range === "all" ? 0 : Date.now() - Number(this.range) * HOUR;
      return this.sales.filter(
        (s) =>
          s.date.getTime() >= since &&
          (!this.table || s.table === Number(this.table)) &&
          (!this.payment || s.payment === this.payment) &&
          (!q ||
            String(s.no).includes(q) ||
            s.lines.some((l) => l.name.toLocaleLowerCase("tr").includes(q))),
      );
    },
    get completed() {
      return this.filtered.filter((s) => s.status === "Tamamlandı");
    },
    get revenue() {
      return this.completed.reduce((sum, s) => sum + s.total, 0);
    },
    get average() {
      return this.completed.length ? Math.round(this.revenue / this.completed.length) : 0;
    },
    get stats() {
      return [
        { label: "Toplam ciro", value: formatPrice(this.revenue), kind: "revenue" },
        { label: "Tamamlanan sipariş", value: this.completed.length, kind: "orders" },
        { label: "Ortalama sepet", value: formatPrice(this.average), kind: "basket" },
      ];
    },
    statKinds,
    statIcon,
    get pageCount() {
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage));
    },
    get rows() {
      const start = (this.page - 1) * this.perPage;
      return this.filtered.slice(start, start + this.perPage);
    },

    // Real orders from the server replace the demo sales (when the server is running).
    realData: false,
    async init() {
      ["search", "range", "table", "payment"].forEach((key) =>
        this.$watch(key, () => (this.page = 1)),
      );
      if (await loadSales()) {
        this.sales = [...sales];
        this.realData = true;
      }
    },
    formatPrice,
    formatDate(d) {
      return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    },
    summary(lines) {
      return lines.map((l) => `${l.qty}× ${l.name}`).join(", ");
    },
    itemCount(lines) {
      return lines.reduce((n, l) => n + l.qty, 0);
    },
  };
}
