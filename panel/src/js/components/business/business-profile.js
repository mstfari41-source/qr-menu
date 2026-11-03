import { toast } from "./toast";
import { api, bizApi } from "../../server";
import { demoBusinesses } from "../super/businesses";

// Business info is read-only here: it comes from the super panel, which alone changes it.
// The button opens the password form; the new password is checked and saved by the server.
const emptyPassword = () => ({ current: "", next: "", repeat: "" });
const demo = demoBusinesses[0];

export default function businessProfile() {
  return {
    info: {
      logo: demo.logo,
      owner: demo.owner.name,
      business: demo.name,
      phone: demo.owner.phone,
      email: demo.owner.email,
      address: `${demo.address}, ${demo.city}`,
    },
    editing: false,
    password: emptyPassword(),
    error: "",
    saved: false,
    busy: false,

    async init() {
      try {
        const b = await bizApi("/business");
        this.info = {
          logo: b.logo,
          owner: b.owner.name,
          business: b.name,
          phone: b.owner.phone || b.phone,
          email: b.owner.email,
          address: [b.address, b.city].filter(Boolean).join(", "),
        };
      } catch {
        // no server: demo details
      }
      // Staff see their own name and e-mail, not the owner's.
      this.$watch("$store.session.user", (u) => {
        if (u?.role === "staff") Object.assign(this.info, { owner: u.name, email: u.email, phone: "" });
      });
    },
    startEdit() {
      this.editing = true;
      this.saved = false;
      this.$nextTick(() => this.$refs.currentPassword.focus());
    },
    cancel() {
      this.editing = false;
      this.password = emptyPassword();
      this.error = "";
    },
    async savePassword() {
      const { current, next, repeat } = this.password;
      if (!current) return (this.error = "Mevcut parolanızı girin.");
      if (next.length < 8) return (this.error = "Yeni parola en az 8 karakter olmalı.");
      if (next === current) return (this.error = "Yeni parola mevcut paroladan farklı olmalı.");
      if (next !== repeat) return (this.error = "Yeni parolalar birbiriyle eşleşmiyor.");
      this.busy = true;
      try {
        await api("/api/auth/password", { method: "POST", body: { current, next } });
      } catch (err) {
        this.busy = false;
        if (err.status !== 0) return (this.error = err.message);
        // no server: demo
      }
      this.busy = false;
      this.cancel();
      this.saved = true;
      toast("Parolanız başarıyla değiştirildi.", "success", "Parola değiştirildi");
    },
  };
}
