import { demoBusinesses, initials, tintFor } from "./businesses";

// Sign-in screens. "business": the business logo next to ARI Medya's, picked by ?isletme=<slug>
// (each business gets its own link). "super": ARI Medya only.
// Demo: any e-mail and password signs in; there is no real account check yet.
const EMAIL = /^\S+@\S+\.\S+$/;

export default function login(kind = "business") {
  const slug = new URLSearchParams(location.search).get("isletme");
  const business = demoBusinesses.find((b) => b.slug === slug) ?? demoBusinesses[0];

  return {
    kind,
    business,
    initials,
    tint: tintFor(business.id),
    mode: "login", // login | forgot | sent
    email: "",
    password: "",
    showPassword: false,
    remember: true,
    error: "",
    loading: false,

    get title() {
      if (this.mode !== "login") return "Parolanızı mı unuttunuz?";
      return kind === "super" ? "Süper Panel Girişi" : "İşletme Paneline Giriş";
    },
    get subtitle() {
      if (this.mode === "forgot") return "E-posta adresinizi yazın, parola sıfırlama bağlantısı gönderelim.";
      if (this.mode === "sent") return "";
      return kind === "super" ? "Yalnızca platform yöneticileri içindir." : `${business.name} hesabınızla giriş yapın.`;
    },
    submit() {
      this.error = "";
      if (!EMAIL.test(this.email)) return (this.error = "Geçerli bir e-posta adresi girin.");
      if (this.mode === "forgot") return (this.mode = "sent");
      if (!this.password) return (this.error = "Parolanızı girin.");
      this.loading = true;
      setTimeout(() => (location.href = kind === "super" ? "super-isletmeler.html" : "index.html"), 600);
    },
    forgot() {
      this.mode = "forgot";
      this.error = "";
      this.$nextTick(() => this.$refs.email.focus());
    },
    back() {
      this.mode = "login";
      this.error = "";
    },
  };
}
