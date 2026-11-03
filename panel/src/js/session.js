// Who is signed in, what they may open, and the business they work for.
//
// Business panel and super panel pages need a sign-in: without one the page goes to
// its sign-in screen. When the server is not running at all the panels keep working
// on demo data (offline), as before the server existed.
import { api, ApiError } from "./server";
import { businessUrl, currentBusiness, superUrl } from "./routes";

// Panel page (body x-data page key) -> permission section on the Yetkilendirme page.
const PAGE_SECTIONS = {
  ecommerce: "dashboard",
  live: "live",
  waiter: "waiter",
  menu: "menu",
  story: "story",
  menuSettings: "menuSettings",
  aiSettings: "ai",
  qr: "qr",
  sales: "sales",
  staff: "staff",
  calendar: "calendar",
  permissions: "owner",
};

export function registerSession(Alpine, area) {
  Alpine.store("session", {
    user: null,
    // "loading" | "signed-in" | "offline"
    state: "loading",
    business: null, // public profile: name, logo …

    get offline() {
      return this.state === "offline";
    },
    get name() {
      return this.user?.name ?? "Ahmet Yılmaz";
    },
    get email() {
      return this.user?.email ?? "ahmet@beecafe.com.tr";
    },
    get role() {
      return this.user?.role ?? "owner";
    },
    get isOwner() {
      return this.offline || ["owner", "super"].includes(this.user?.role);
    },
    // May open a panel section ("menu", "live" …) at least to look at it.
    can(section, level = "view") {
      if (this.offline || this.state === "loading") return true;
      if (["owner", "super"].includes(this.user?.role)) return true;
      if (section === "owner") return false;
      const have = this.user?.perms?.[section] ?? "none";
      return level === "view" ? have !== "none" : have === "edit";
    },
    // Special permissions such as cancelOrder or changePrice.
    may(action) {
      if (this.offline || ["owner", "super"].includes(this.user?.role)) return true;
      return this.user?.actions?.[action] === true;
    },
    async logout() {
      await api("/api/auth/logout", { method: "POST" }).catch(() => {});
      location.href = area === "super" ? superUrl("giris") : businessUrl("giris");
    },
  });
  const store = Alpine.store("session");

  // Sign-in screens and waiters' personal links do not need a session.
  if (area === "auth" || area === "waiter") {
    loadProfile(store);
    return;
  }
  api("/api/auth/me")
    .then((user) => {
      const wrongPlace =
        (area === "super" && user.role !== "super") || (area !== "super" && user.role !== "super" && user.business !== currentBusiness());
      if (wrongPlace) throw new ApiError(401, "");
      store.user = user;
      store.state = "signed-in";
      if (area !== "super") {
        loadProfile(store);
        guardPage(store);
      }
    })
    .catch((err) => {
      if (err.status === 0) {
        store.state = "offline";
        if (area !== "super") loadProfile(store);
        return;
      }
      const back = encodeURIComponent(location.pathname);
      location.replace(area === "super" ? superUrl("giris") : `${businessUrl("giris")}?geri=${back}`);
    });
}

function loadProfile(store) {
  api(`/api/${currentBusiness()}/profile`)
    .then((p) => (store.business = p))
    .catch(() => {});
}

// A staff member who opens a page they have no access to sees a short note instead.
function guardPage(store) {
  const page = window.Alpine?.$data(document.body)?.page;
  const section = PAGE_SECTIONS[page];
  if (!section || store.can(section)) return;
  const main = document.getElementById("main-content");
  if (!main) return;
  main.innerHTML = `
    <div class="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/3">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Bu sayfa için yetkiniz yok</h2>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Erişim için işletme sahibine başvurun.</p>
      </div>
    </div>`;
}
