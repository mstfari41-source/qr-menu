import { toast } from "./toast";

// Panel dark mode that switches itself on and off by the clock.
// A per-device preference like the dark mode itself, so it lives in localStorage.
const KEY = "themeSchedule";
const defaults = { auto: true, start: "19:00", end: "07:00" };

function read() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...defaults };
  }
}

const minutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// The range may cross midnight (19:00 → 07:00).
export function isDarkAt(schedule, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  const start = minutes(schedule.start);
  const end = minutes(schedule.end);
  return start <= end ? now >= start && now < end : now >= start || now < end;
}

function setDark(dark) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.setAttribute("data-color-scheme", dark ? "dark" : "light");
  localStorage.setItem("darkMode", JSON.stringify(dark));
  const body = window.Alpine && document.body._x_dataStack ? window.Alpine.$data(document.body) : null;
  if (body && body.darkMode !== dark) body.darkMode = dark;
}

// Before Alpine starts, so the page does not flash in the wrong theme.
export function applyThemeScheduleEarly() {
  const schedule = read();
  if (schedule.auto) localStorage.setItem("darkMode", JSON.stringify(isDarkAt(schedule)));
}

export function registerThemeStore(Alpine) {
  Alpine.store("theme", {
    ...read(),
    get darkNow() {
      return isDarkAt(this);
    },
    save() {
      const { auto, start, end } = this;
      localStorage.setItem(KEY, JSON.stringify({ auto, start, end }));
      this.apply();
    },
    apply() {
      if (this.auto) setDark(isDarkAt(this));
    },
    // The header button means "I want it this way now": automatic mode steps aside.
    manualSwitch() {
      if (!this.auto) return;
      this.auto = false;
      this.save();
      toast("Tema artık elle değişiyor. Menü Ayarları'ndan tekrar açabilirsiniz.", "off", "Otomatik karanlık mod kapandı");
    },
  });
}

export function startThemeSchedule(Alpine) {
  const store = Alpine.store("theme");
  store.apply();
  setInterval(() => store.apply(), 30 * 1000);
}
