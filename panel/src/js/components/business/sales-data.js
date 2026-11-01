import { products, slots, currentDayPart } from "./menu-data";

// Demo sales for the last year, seeded so every page load shows the same numbers.
export const TABLE_COUNT = 12;
const DAY = 24 * 60 * 60 * 1000;

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Relative order volume per hour (08:00 - 23:00): breakfast, lunch and evening peaks.
const hourWeights = { 8: 4, 9: 7, 10: 7, 11: 5, 12: 6, 13: 8, 14: 6, 15: 5, 16: 5, 17: 6, 18: 7, 19: 9, 20: 9, 21: 7, 22: 4, 23: 2 };

function pickHour(rand) {
  const total = Object.values(hourWeights).reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [h, w] of Object.entries(hourWeights)) {
    if ((r -= w) < 0) return Number(h);
  }
  return 20;
}

function buildSales() {
  const rand = seeded(42);
  const now = new Date();
  const sales = [];

  for (let d = 364; d >= 0; d--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const growth = 1 + (364 - d) / 365 * 0.35;
    const count = Math.round((14 + rand() * 10) * (weekend ? 1.4 : 1) * growth);

    for (let i = 0; i < count; i++) {
      const date = new Date(day);
      date.setHours(pickHour(rand), Math.floor(rand() * 60), 0, 0);
      if (date > now) continue;

      const part = currentDayPart(date.getHours());
      const fitting = products.filter((p) => slots[p.category].includes(part));
      const pool = fitting.length ? fitting : products;
      const lines = [];
      const lineCount = 1 + Math.floor(rand() * 3);
      for (let j = 0; j < lineCount; j++) {
        const p = pool[Math.floor(rand() * pool.length)];
        const existing = lines.find((l) => l.id === p.id);
        if (existing) existing.qty++;
        else lines.push({ id: p.id, name: p.name, qty: 1 + Math.floor(rand() * 2), price: p.price });
      }

      sales.push({
        date,
        table: 1 + Math.floor(rand() * TABLE_COUNT),
        lines,
        total: lines.reduce((s, l) => s + l.qty * l.price, 0),
        payment: rand() < 0.65 ? "Kart" : "Nakit",
        status: rand() < 0.95 ? "Tamamlandı" : "İptal",
      });
    }
  }

  sales.sort((a, b) => b.date - a.date);
  sales.forEach((s, i) => (s.no = 10000 + sales.length - i));
  return sales;
}

export const sales = buildSales();
export const completedSales = sales.filter((s) => s.status === "Tamamlandı");

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysAgo = (n) => new Date(startOfDay(new Date()).getTime() - n * DAY);
export const sum = (list) => list.reduce((s, x) => s + x.total, 0);

export function between(from, to) {
  return completedSales.filter((s) => s.date >= from && s.date < to);
}
