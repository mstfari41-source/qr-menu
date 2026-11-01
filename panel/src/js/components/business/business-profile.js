import { toast } from "./toast";
import { demoBusinesses } from "../super/businesses";

// Business info is read-only here: it comes from the super panel, which alone changes it.
// The Edit button unlocks the password form. Demo only: nothing is saved.
const emptyPassword = () => ({ current: "", next: "", repeat: "" });
const current = demoBusinesses[0];

export default function businessProfile() {
  return {
    info: {
      logo: current.logo,
      owner: current.owner.name,
      business: current.name,
      phone: current.owner.phone,
      email: current.owner.email,
      address: `${current.address}, ${current.city}`,
    },
    editing: false,
    password: emptyPassword(),
    error: "",
    saved: false,

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
    savePassword() {
      const { current, next, repeat } = this.password;
      if (!current) return (this.error = "Mevcut parolanızı girin.");
      if (next.length < 8) return (this.error = "Yeni parola en az 8 karakter olmalı.");
      if (next === current) return (this.error = "Yeni parola mevcut paroladan farklı olmalı.");
      if (next !== repeat) return (this.error = "Yeni parolalar birbiriyle eşleşmiyor.");
      this.cancel();
      this.saved = true;
      toast("Parolanız başarıyla değiştirildi (demo).", "success", "Parola değiştirildi");
    },
  };
}
