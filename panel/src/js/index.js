import "dropzone/dist/dropzone.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.min.css";
import "../css/style.css";

import collapse from "@alpinejs/collapse";
import persist from "@alpinejs/persist";
import Alpine from "alpinejs";
import Dropzone from "dropzone";
import flatpickr from "flatpickr";
import { setupI18n } from "./i18n";

import "./components/calendar/calendar-init.js";
import chart01 from "./components/charts/chart-01";
import chart02 from "./components/charts/chart-02";
import chart03 from "./components/charts/chart-03";
import barChart01 from "./components/charts/bar-chart/bar-chart-01";
import barChart02 from "./components/charts/bar-chart/bar-chart-02";
import lineChart01 from "./components/charts/line-chart/line-chart-01";
import lineChart02 from "./components/charts/line-chart/line-chart-02";
import monthlySalesChart from "./components/ecommerce/monthly-sales-chart";
import monthlyTargetChart from "./components/ecommerce/monthly-target-chart";
import statisticsChart from "./components/ecommerce/statistics-chart";
import "./components/image-resize";
import map01 from "./components/map-01";
import customerPinPointMap from "./components/maps/vector/customer-pin-point-map";
import basicTableFive from "./components/tables/basic-table-five";
import basicTableFour from "./components/tables/basic-table-four";
import basicTableOne from "./components/tables/basic-table-one";
import basicTableThree from "./components/tables/basic-table-three";
import basicTableTwo from "./components/tables/basic-table-two";
import aiSettings from "./components/business/ai-settings";
import businessProfile from "./components/business/business-profile";
import dailyPick from "./components/business/daily-pick";
import dashboard from "./components/business/dashboard";
import { startImageZoom } from "./components/business/image-zoom";
import languageSwitcher from "./components/business/language-switcher";
import liveService from "./components/business/live-service";
import permissions from "./components/business/permissions";
import qrFeatures from "./components/business/qr-features";
import waiterScreen from "./components/business/waiter-screen";
import { registerLiveStore } from "./components/business/live-store";
import { registerNoticesStore } from "./components/business/notices-store";
import { MENU_URL } from "./components/business/menu-data";
import menuEditor from "./components/business/menu-editor";
import menuSettings from "./components/business/menu-settings";
import qrCodes from "./components/business/qr-codes";
import { startReminders } from "./components/business/reminders";
import salesTable from "./components/business/sales-table";
import socialLinks from "./components/business/social-links";
import staff from "./components/business/staff";
import todayNotes from "./components/business/today-notes";
import storyEditor from "./components/business/story-editor";
import login from "./components/super/login";
import { businessUrl, currentBusiness } from "./routes";
import { registerSession } from "./session";
import { qrMenuUrl } from "./server";
import { initNotes } from "./components/business/notes-store";
import { registerPanelStores } from "./stores";
import { toast } from "./components/business/toast";
import superBusiness from "./components/super/super-business";
import superBusinesses from "./components/super/super-businesses";
import { applyThemeScheduleEarly, registerThemeStore, startThemeSchedule } from "./components/business/theme-schedule";
import dropdown from "./components/ui/dropdown";
import popover from "./components/ui/popover";
import tooltip from "./components/ui/tooltip";

// Automatic dark mode decides the theme first, by the clock.
applyThemeScheduleEarly();

// TailAdmin Theme Manager: reads from localStorage, falls back to dark
(function () {
  var stored = localStorage.getItem("darkMode");
  var isDark = stored !== null ? JSON.parse(stored) : false;

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-color-scheme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-color-scheme", "light");
  }
})();

Alpine.plugin(persist);
Alpine.plugin(collapse);
window.Alpine = Alpine;

// Setup i18next & Alpine reactive integration
setupI18n(Alpine);

// Register UI component models
Alpine.data("dropdown", dropdown);
Alpine.data("tooltip", tooltip);
Alpine.data("popover", popover);

// Register Table components
Alpine.data("basicTableOne", basicTableOne);
Alpine.data("basicTableTwo", basicTableTwo);
Alpine.data("basicTableThree", basicTableThree);
Alpine.data("basicTableFour", basicTableFour);
Alpine.data("basicTableFive", basicTableFive);

// Register business panel components
Alpine.data("aiSettings", aiSettings);
Alpine.data("businessProfile", businessProfile);
Alpine.data("dailyPick", dailyPick);
Alpine.store("menu", { url: MENU_URL });
// The customer menu for this business ("Menüyü görüntüle"), reachable from phones too.
qrMenuUrl().then((url) => (Alpine.store("menu").url = url));
// Sign-in screens (data-area="auth") and the super panel (data-area="super") get no
// live orders or calls; the waiter's own screen (data-area="waiter") does.
// Calendar reminders are for the business panel only.
const area = document.body.dataset.area;
const inBusinessPanel = !area;
registerLiveStore(Alpine, { simulate: !area || area === "waiter" });
registerNoticesStore(Alpine);
// Settings, home page picks and staff shared by several screens (saved on the server).
registerPanelStores(Alpine, { save: inBusinessPanel });
registerThemeStore(Alpine);
// Readable addresses for links: :href="$store.nav.to('menu')" -> /beecafe/menu
Alpine.store("nav", {
  business: currentBusiness(),
  to(page = "") {
    return businessUrl(page, this.business);
  },
});
// Signed-in user; panel pages without a sign-in go to their sign-in screen.
registerSession(Alpine, area);
// A save that did not reach the server is always shown.
window.addEventListener("save-failed", (e) => toast(e.detail, "error", "Kaydedilemedi"));
Alpine.data("dashboard", dashboard);
Alpine.data("languageSwitcher", languageSwitcher);
Alpine.data("liveService", liveService);
Alpine.data("permissions", permissions);
Alpine.data("qrFeatures", qrFeatures);
Alpine.data("waiterScreen", waiterScreen);
Alpine.data("menuEditor", menuEditor);
Alpine.data("menuSettings", menuSettings);
Alpine.data("qrCodes", qrCodes);
Alpine.data("salesTable", salesTable);
Alpine.data("socialLinks", socialLinks);
Alpine.data("staff", staff);
Alpine.data("todayNotes", todayNotes);
Alpine.data("storyEditor", storyEditor);

// Super panel (platform owner)
Alpine.data("superBusinesses", superBusinesses);
Alpine.data("superBusiness", superBusiness);
Alpine.data("login", login);

Alpine.start();

// Panel switches to dark mode by itself in the chosen hours.
startThemeSchedule(Alpine);

// Calendar notes come from the server; their reminders pop up on every business panel page.
if (inBusinessPanel) initNotes().finally(startReminders);

// Click a product, category or staff photo to see it large.
startImageZoom();

// Init flatpickr
flatpickr(".datepicker", {
  mode: "range",
  static: true,
  monthSelectorType: "static",
  dateFormat: "M j",
  defaultDate: [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date()],
  prevArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  nextArrow:
    '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  onReady: (selectedDates, dateStr, instance) => {
    instance.element.value = dateStr.replace("to", "-");
    const customClass = instance.element.getAttribute("data-class");
    if (instance.calendarContainer && customClass) {
      instance.calendarContainer.classList.add(customClass);
    }
  },
  onChange: (selectedDates, dateStr, instance) => {
    instance.element.value = dateStr.replace("to", "-");
  },
});

// Init Dropzone
const dropzoneArea = document.querySelectorAll("#demo-upload");

if (dropzoneArea.length) {
  new Dropzone("#demo-upload", { url: "/file/post" });
}

// Document Loaded
document.addEventListener("DOMContentLoaded", () => {
  monthlySalesChart();
  monthlyTargetChart();
  statisticsChart();
  customerPinPointMap();
  chart01();
  chart02();
  chart03();
  map01();
  lineChart01();
  lineChart02();
  barChart01();
  barChart02();
});

// Get the current year
const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// For Copy//
document.addEventListener("DOMContentLoaded", () => {
  const copyInput = document.getElementById("copy-input");
  if (copyInput) {
    const copyButton = document.getElementById("copy-button");
    const copyText = document.getElementById("copy-text");
    const websiteInput = document.getElementById("website-input");

    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(websiteInput.value).then(() => {
        copyText.textContent = "Copied";
        setTimeout(() => {
          copyText.textContent = "Copy";
        }, 2000);
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");

  if (!searchInput || !searchButton) return;

  function focusSearchInput() {
    searchInput.focus();
  }

  searchButton.addEventListener("click", focusSearchInput);

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      event.preventDefault();
      focusSearchInput();
    }
  });
});
