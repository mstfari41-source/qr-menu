import { daysLeft, demoBusinesses, formatDate, initials, MENU_HOST, packages, statuses, tintFor } from "./businesses";

// Super panel: every business on the platform at a glance.
export default function superBusinesses() {
  return {
    businesses: demoBusinesses,
    statuses,
    packages,
    query: "",
    statusFilter: "",
    MENU_HOST,
    initials,
    tintFor,
    daysLeft,
    formatDate,

    get filtered() {
      const q = this.query.trim().toLocaleLowerCase("tr-TR");
      return this.businesses.filter(
        (b) =>
          (!this.statusFilter || b.status === this.statusFilter) &&
          (!q || [b.name, b.owner.name, b.owner.email, b.owner.phone, b.phone, b.city].some((v) => v.toLocaleLowerCase("tr-TR").includes(q))),
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
