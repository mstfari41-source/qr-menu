import { businessUrl, currentBusiness, superUrl } from "../../routes";
import { api } from "../../server";
import { demoBusinesses, initials, tintFor } from "./businesses";

// Sign-in screens. "business": the business logo next to ARI Medya's, picked by the
// address (/beecafe/giris; each business gets its own). "super": ARI Medya only.
// The server checks the password; without a server the demo signs in with anything.
const EMAIL = /^\S+@\S+\.\S+$/;

export default function login(kind = "business") {
  const slug = new URLSearchParams(location.search).get("isletme") ?? currentBusiness();
  const demo = demoBusinesses.find((b) => b.slug === slug) ?? demoBusinesses[0];

  return {
    kind,
    // name and logo come from the server; the demo list fills in until then
    business: { slug, name: demo.name, logo: demo.logo, id: demo.id },
    initials,
    tint: tintFor(demo.id),
    mode: "login", // login | forgot
    email: "",
    password: "",
    showPassword: false,
    error: "",
    loading: false,

    init() {
      if (kind !== "business") return;
      api(`/api/${slug}/profile`)
        .then((p) => Object.assign(this.business, p))
        .catch(() => {});
    },
    get title() {
      if (this.mode !== "login") return "Parolanızı mı unuttunuz?";
      return kind === "super" ? "Süper Panel Girişi" : "İşletme Paneline Giriş";
    },
    get subtitle() {
      if (this.mode === "forgot")
        return kind === "super"
          ? "Süper panel parolası yalnızca sunucudan sıfırlanabilir."
          : "İşletme sahibiyseniz ARI Medya'dan, personelseniz işletme sahibinden yeni parola isteyin.";
      return kind === "super" ? "Yalnızca platform yöneticileri içindir." : `${this.business.name} hesabınızla giriş yapın.`;
    },
    // Where to go after signing in: back to the page that sent here, if it is ours.
    get next() {
      if (kind === "super") return superUrl("isletmeler");
      const back = new URLSearchParams(location.search).get("geri");
      return back && back.startsWith(`/${slug}`) ? back : businessUrl("", slug);
    },
    async submit() {
      this.error = "";
      if (!EMAIL.test(this.email)) return (this.error = "Geçerli bir e-posta adresi girin.");
      if (!this.password) return (this.error = "Parolanızı girin.");
      this.loading = true;
      try {
        await api("/api/auth/login", {
          method: "POST",
          body: { email: this.email, password: this.password, scope: kind, business: slug },
        });
        location.href = this.next;
      } catch (err) {
        this.loading = false;
        if (err.status === 0) {
          // No server: the demo panel opens with any password.
          location.href = this.next;
          return;
        }
        this.error = err.message;
        this.password = "";
      }
    },
    forgot() {
      this.mode = "forgot";
      this.error = "";
    },
    back() {
      this.mode = "login";
      this.error = "";
    },
  };
}
