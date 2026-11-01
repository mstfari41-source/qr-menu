import ApexCharts from "apexcharts";
import { formatPrice } from "./menu-data";
import { completedSales, between, daysAgo, startOfDay, sum } from "./sales-data";
import { statKinds, statIcon } from "./stat-styles";

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const BRAND = "#465FFF";
const BRAND_LIGHT = "#9CB9FF";
const FONT = "Outfit, sans-serif";

const shortPrice = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}B ₺` : `${n} ₺`);
const change = (now, before) => (before ? ((now - before) / before) * 100 : 0);

function monthRange(offset) {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth() + offset, 1), new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)];
}

// Same part of the previous period, so a half-finished day or month is compared fairly.
function samePeriodBefore(from, prevFrom) {
  return new Date(prevFrom.getTime() + (Date.now() - from.getTime()));
}

export default function dashboard() {
  const today = startOfDay(new Date());
  const yesterday = daysAgo(1);
  const todaySales = between(today, new Date(Date.now() + 1));
  const yesterdaySales = between(yesterday, samePeriodBefore(today, yesterday));
  const [monthFrom, monthTo] = monthRange(0);
  const [prevFrom] = monthRange(-1);
  const monthSales = between(monthFrom, monthTo);
  const prevMonthSales = between(prevFrom, samePeriodBefore(monthFrom, prevFrom));
  // Chart instances stay outside Alpine's reactive state.
  const charts = {};
  const avg = (list) => (list.length ? Math.round(sum(list) / list.length) : 0);

  return {
    formatPrice,
    statKinds,
    statIcon,
    // Default target: last month's revenue + 10%, rounded up to 10.000 ₺.
    target: Math.ceil((sum(between(prevFrom, monthFrom)) * 1.1) / 10000) * 10000,
    range: "7",

    metrics: [
      { label: "Bugünkü ciro", value: formatPrice(sum(todaySales)), change: change(sum(todaySales), sum(yesterdaySales)), note: "düne göre", kind: "revenue" },
      { label: "Bugünkü sipariş", value: todaySales.length, change: change(todaySales.length, yesterdaySales.length), note: "düne göre", kind: "orders" },
      { label: "Bu ay ciro", value: formatPrice(sum(monthSales)), change: change(sum(monthSales), sum(prevMonthSales)), note: "geçen aya göre", kind: "month" },
      { label: "Ortalama sepet", value: formatPrice(avg(monthSales)), change: change(avg(monthSales), avg(prevMonthSales)), note: "geçen aya göre", kind: "basket" },
    ],
    monthRevenue: sum(monthSales),
    todayRevenue: sum(todaySales),

    get progress() {
      return this.target > 0 ? Math.min(100, Math.round((this.monthRevenue / this.target) * 1000) / 10) : 0;
    },
    get topProducts() {
      const totals = {};
      for (const s of monthSales) {
        for (const l of s.lines) {
          totals[l.id] ??= { name: l.name, qty: 0, revenue: 0 };
          totals[l.id].qty += l.qty;
          totals[l.id].revenue += l.qty * l.price;
        }
      }
      const list = Object.values(totals).sort((a, b) => b.qty - a.qty).slice(0, 5);
      const max = list[0]?.qty || 1;
      return list.map((p) => ({ ...p, share: Math.round((p.qty / max) * 100) }));
    },

    init() {
      this.$nextTick(() => {
        this.renderMonthly();
        this.renderTarget();
        this.renderStatistics();
        this.renderHourly();
      });
      this.$watch("target", () => charts.target?.updateSeries([this.progress]));
      this.$watch("range", () => this.updateStatistics());
    },

    renderMonthly() {
      const labels = [];
      const data = [];
      for (let i = -11; i <= 0; i++) {
        const [from, to] = monthRange(i);
        labels.push(MONTHS[from.getMonth()]);
        data.push(sum(between(from, to)));
      }
      charts.monthly = new ApexCharts(this.$refs.monthly, {
        chart: { type: "bar", height: 200, fontFamily: FONT, toolbar: { show: false } },
        series: [{ name: "Ciro", data }],
        colors: [BRAND],
        plotOptions: { bar: { columnWidth: "45%", borderRadius: 6, borderRadiusApplication: "end" } },
        dataLabels: { enabled: false },
        xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { formatter: shortPrice } },
        grid: { borderColor: "#F3F4F6", yaxis: { lines: { show: true } } },
        tooltip: { y: { formatter: formatPrice } },
      });
      charts.monthly.render();
    },

    renderTarget() {
      charts.target = new ApexCharts(this.$refs.target, {
        chart: { type: "radialBar", height: 300, fontFamily: FONT, sparkline: { enabled: true } },
        series: [this.progress],
        colors: [BRAND],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            hollow: { size: "78%" },
            track: { background: "#E8EAEE", strokeWidth: "100%", margin: 5 },
            dataLabels: { name: { show: false }, value: { fontSize: "34px", fontWeight: 600, offsetY: -36, color: "#1D2939", formatter: (v) => `%${v}` } },
          },
        },
        fill: { type: "gradient", gradient: { type: "horizontal", colorStops: [{ offset: 0, color: BRAND_LIGHT, opacity: 1 }, { offset: 100, color: BRAND, opacity: 1 }] } },
        stroke: { lineCap: "round" },
      });
      charts.target.render();
    },

    statisticsData() {
      const labels = [];
      const revenue = [];
      const orders = [];
      if (this.range === "12") {
        for (let i = -11; i <= 0; i++) {
          const [from, to] = monthRange(i);
          const list = between(from, to);
          labels.push(MONTHS[from.getMonth()]);
          revenue.push(sum(list));
          orders.push(list.length);
        }
      } else {
        const days = Number(this.range);
        for (let i = days - 1; i >= 0; i--) {
          const from = daysAgo(i);
          const list = between(from, daysAgo(i - 1));
          labels.push(from.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }));
          revenue.push(sum(list));
          orders.push(list.length);
        }
      }
      return { labels, series: [{ name: "Ciro", data: revenue }, { name: "Sipariş", data: orders }] };
    },

    renderStatistics() {
      const { labels, series } = this.statisticsData();
      charts.statistics = new ApexCharts(this.$refs.statistics, {
        chart: { type: "area", height: 310, fontFamily: FONT, toolbar: { show: false } },
        series,
        colors: [BRAND, BRAND_LIGHT],
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.5, opacityTo: 0 } },
        dataLabels: { enabled: false },
        legend: { position: "top", horizontalAlign: "left" },
        xaxis: { categories: labels, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 10 },
        yaxis: [
          { title: { text: "Ciro" }, labels: { formatter: shortPrice } },
          { opposite: true, title: { text: "Sipariş" }, labels: { formatter: (v) => Math.round(v) } },
        ],
        grid: { borderColor: "#F3F4F6" },
        tooltip: { shared: true, y: { formatter: (v, { seriesIndex }) => (seriesIndex === 0 ? formatPrice(v) : `${v} sipariş`) } },
      });
      charts.statistics.render();
    },

    updateStatistics() {
      const { labels, series } = this.statisticsData();
      charts.statistics.updateOptions({ xaxis: { categories: labels } });
      charts.statistics.updateSeries(series);
    },

    renderHourly() {
      const from = daysAgo(30);
      const counts = Array(24).fill(0);
      for (const s of completedSales) {
        if (s.date < from) break;
        counts[s.date.getHours()]++;
      }
      const hours = [];
      const data = [];
      for (let h = 8; h <= 23; h++) {
        hours.push(String(h).padStart(2, "0"));
        data.push(Math.round((counts[h] / 30) * 10) / 10);
      }
      charts.hourly = new ApexCharts(this.$refs.hourly, {
        chart: { type: "bar", height: 260, fontFamily: FONT, toolbar: { show: false } },
        series: [{ name: "Ortalama sipariş", data }],
        colors: [BRAND],
        plotOptions: { bar: { columnWidth: "55%", borderRadius: 4, borderRadiusApplication: "end" } },
        dataLabels: { enabled: false },
        xaxis: { categories: hours, axisBorder: { show: false }, axisTicks: { show: false }, title: { text: "Saat" } },
        grid: { borderColor: "#F3F4F6" },
        tooltip: { x: { formatter: (h) => `${h}:00 - ${h}:59` }, y: { formatter: (v) => `${v} sipariş / gün` } },
      });
      charts.hourly.render();
    },
  };
}
