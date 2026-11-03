import { superBusinessUrl } from "../../routes";
import { api } from "../../server";
import { toast } from "../business/toast";
import { daysLeft, demoBusinesses, formatDate, initials, MENU_HOST, packages, statuses, tintFor } from "./businesses";

// Super panel: every business on the platform at a glance.
export default function superBusinesses() {
  return {
    businesses: demoBusinesses,
    async init() {
      try {
        this.businesses = await api("/api/super/businesses");
      } catch (err) {
        // no server: the demo list
        if (err.status !== 0) toast(err.message, "error", "Yüklenemedi");
      }
    },
    statuses,
    packages,
    query: "",
    statusFilter: "",
    MENU_HOST,
    initials,
    tintFor,
    daysLeft,
    formatDate,
    url: (b) => superBusinessUrl(b ? b.slug : "yeni"),

    get filtered() {
      const q = this.query.trim().toLocaleLowerCase("tr-TR");
      // Phone numbers match by digits, so "0535 444" finds "+90 535 444 55 66".
      const digits = q.replace(/\D/g, "").replace(/^0/, "");
      const phoneMatch = (b) =>
        digits.length >= 3 && [b.owner.phone, b.phone].some((p) => p.replace(/\D/g, "").includes(digits));
      return this.businesses.filter(
        (b) =>
          (!this.statusFilter || b.status === this.statusFilter) &&
          (!q ||
            phoneMatch(b) ||
            [b.name, b.owner.name, b.owner.email, b.city].some((v) => v.toLocaleLowerCase("tr-TR").includes(q))),
      );
    },
    count(status) {
      return this.businesses.filter((b) => b.status === status).length;
    },
    // Active or trial businesses whose renewal is within two weeks.
    get renewingSoon() {
      return this.businesses.filter((b) => b.status !== "suspended" && daysLeft(b) <= 14).length;
    },
    status(b) {
      return statuses.find((s) => s.id === b.status);
    },
    packageName(b) {
      return packages.find((p) => p.id === b.package)?.name;
    },
    renewalText(b) {
      const d = daysLeft(b);
      if (d < 0) return `${-d} gün gecikti`;
      if (d === 0) return "Bugün";
      return `${d} gün kaldı`;
    },
    renewalTone(b) {
      const d = daysLeft(b);
      if (d < 0) return "text-red-600 dark:text-red-400";
      if (d <= 14) return "text-amber-600 dark:text-amber-400";
      return "text-gray-500 dark:text-gray-400";
    },
  };
}
