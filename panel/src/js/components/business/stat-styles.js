// Shared colour + icon for summary (stat) cards, so the same figure looks
// the same on the dashboard and the Satışlar page.
const icons = {
  revenue: '<rect x="2.75" y="6" width="18.5" height="12" rx="2" /><circle cx="12" cy="12" r="2.75" /><path d="M6 9.5v5M18 9.5v5" />',
  orders: '<path d="M6 3.75h12v16.5l-2-1.25-2 1.25-2-1.25-2 1.25-2-1.25-2 1.25z" /><path d="M9 8.25h6M9 11.75h6M9 15.25h3.5" />',
  basket: '<path d="M3.5 9.5h17l-1.6 9.1a2 2 0 01-2 1.65H7.1a2 2 0 01-2-1.65z" /><path d="M8.5 9.5L12 3.75l3.5 5.75M9.5 13.5v3M14.5 13.5v3" />',
  month: '<rect x="3.25" y="4.75" width="17.5" height="15.5" rx="2" /><path d="M8 2.75v4M16 2.75v4M3.25 10h17.5M7.5 16.5l3-3 2 2 4-4" />',
};

const themes = {
  green: {
    card: "border-green-200 bg-green-100/70 dark:border-green-500/20 dark:bg-green-500/5",
    badge: "bg-green-500 text-white",
  },
  blue: {
    card: "border-brand-200 bg-brand-100/70 dark:border-brand-500/20 dark:bg-brand-500/5",
    badge: "bg-brand-500 text-white",
  },
  orange: {
    card: "border-orange-200 bg-orange-100/70 dark:border-orange-500/20 dark:bg-orange-500/5",
    badge: "bg-orange-500 text-white",
  },
  purple: {
    card: "border-purple-200 bg-purple-100/70 dark:border-purple-500/20 dark:bg-purple-500/5",
    badge: "bg-purple-500 text-white",
  },
};

export const statKinds = {
  revenue: { theme: themes.green, icon: icons.revenue },
  orders: { theme: themes.blue, icon: icons.orders },
  basket: { theme: themes.orange, icon: icons.basket },
  month: { theme: themes.purple, icon: icons.month },
};

export const statIcon = (kind) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${statKinds[kind].icon}</svg>`;
