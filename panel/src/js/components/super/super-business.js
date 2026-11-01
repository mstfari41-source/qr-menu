import { confirmDialog } from "../business/confirm-dialog";
import { toast } from "../business/toast";
import {
  categories,
  daysLeft,
  demoBusinesses,
  emptyBusiness,
  formatDate,
  initials,
  MENU_HOST,
  packages,
  statuses,
  tintFor,
} from "./businesses";

// Super panel: one business's identity, owner, billing and subscription.
// These are the fields the business itself can only see, never change.
// Opens read-only; "Düzenle" unlocks the form so nothing changes by accident.
const clone = (b) => JSON.parse(JSON.stringify(b));
const EMAIL = /^\S+@\S+\.\S+$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// "Lavanta Pastanesi" -> "lavanta-pastanesi"
const slugify = (text) =>
  text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function superBusiness() {
  const id = new URLSearchParams(location.search).get("id");
  const found = demoBusinesses.find((b) => String(b.id) === id);
  const start = found ? clone(found) : emptyBusiness();

  return {
    isNew: !found,
    editing: !found,
    form: start,
    saved: JSON.stringify(start),
    slugTouched: !!found,
    errors: {},
    categories,
    packages,
    statuses,
    MENU_HOST,
    initials,
    formatDate,

    init() {
      // Leaving the page with unsaved edits asks first.
      window.addEventListener("beforeunload", (e) => {
        if (this.editing && this.dirty) e.preventDefault();
      });
    },
    get dirty() {
      return JSON.stringify(this.form) !== this.saved;
    },
    startEdit() {
      this.editing = true;
      this.$nextTick(() => document.getElementById("b-name")?.focus());
    },
    async cancelEdit() {
      if (this.dirty) {
        const ok = await confirmDialog({
          title: "Değişiklikler silinsin mi?",
          message: "Kaydetmediğiniz değişiklikler geri alınacak.",
          warning: "",
          confirmText: "Evet, vazgeç",
          cancelText: "Düzenlemeye dön",
        });
        if (!ok) return;
      }
      if (this.isNew) return (location.href = "super-isletmeler.html");
      this.reset();
      this.editing = false;
    },
    get tint() {
      return tintFor(this.form.id ?? demoBusinesses.length + 1);
    },
    get status() {
      return statuses.find((s) => s.id === this.form.status);
    },
    get pkg() {
      return packages.find((p) => p.id === this.form.package);
    },
    get daysLeft() {
      return daysLeft(this.form);
    },

    // The menu address follows the name until it is edited by hand.
    nameChanged() {
      if (!this.slugTouched) this.form.slug = slugify(this.form.name);
    },
    slugChanged() {
      this.slugTouched = true;
      this.form.slug = slugify(this.form.slug);
    },
    packageChanged() {
      this.form.tables = Math.min(this.form.tables, this.pkg.tables ?? Infinity);
    },

    pickLogo(event) {
      const file = event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast("Lütfen bir görsel dosyası seçin.", "error", "Geçersiz dosya");
      if (file.size > 2 * 1024 * 1024) return toast("Logo en fazla 2 MB olabilir.", "error", "Dosya çok büyük");
      const reader = new FileReader();
      reader.onload = () => (this.form.logo = reader.result);
      reader.readAsDataURL(file);
    },
    removeLogo() {
      this.form.logo = "";
    },

    validate() {
      const f = this.form;
      const e = {};
      if (!f.name.trim()) e.name = "İşletme adı gerekli.";
      if (!SLUG.test(f.slug)) e.slug = "Sadece küçük harf, rakam ve tire kullanılabilir.";
      else if (demoBusinesses.some((b) => b.slug === f.slug && b.id !== f.id)) e.slug = "Bu adres başka bir işletmede kullanılıyor.";
      if (f.email && !EMAIL.test(f.email)) e.email = "Geçerli bir e-posta girin.";
      if (!f.owner.name.trim()) e.ownerName = "Yetkili adı gerekli.";
      if (!EMAIL.test(f.owner.email)) e.ownerEmail = "Panel girişi için geçerli bir e-posta gerekli.";
      if (f.billing.taxNo && !/^\d{10,11}$/.test(f.billing.taxNo)) e.taxNo = "Vergi no 10, T.C. kimlik no 11 haneli olmalı.";
      if (!f.billing.sameAddress && !f.billing.address.trim()) e.billingAddress = "Fatura adresi gerekli.";
      this.errors = e;
      return !Object.keys(e).length;
    },
    save() {
      if (!this.editing) return;
      if (!this.validate()) {
        this.$nextTick(() => this.$root.querySelector("[aria-invalid=true]")?.focus());
        return toast("İşaretli alanları kontrol edin.", "error", "Kaydedilemedi");
      }
      if (this.isNew) {
        this.form.id = Math.max(...demoBusinesses.map((b) => b.id)) + 1;
        demoBusinesses.push(clone(this.form));
        this.isNew = false;
        history.replaceState(null, "", `?id=${this.form.id}`);
        toast(`${this.form.name} platforma eklendi.`, "success", "İşletme oluşturuldu");
      } else {
        Object.assign(
          demoBusinesses.find((b) => b.id === this.form.id),
          clone(this.form),
        );
        toast(`${this.form.name} bilgileri güncellendi.`, "success", "Kaydedildi");
      }
      this.saved = JSON.stringify(this.form);
      this.editing = false;
    },
    reset() {
      this.form = JSON.parse(this.saved);
      this.errors = {};
    },
    sendReset() {
      if (!EMAIL.test(this.form.owner.email)) return toast("Önce geçerli bir e-posta girin.", "error", "E-posta eksik");
      toast(`${this.form.owner.email} adresine parola sıfırlama bağlantısı gönderildi.`, "success", "Bağlantı gönderildi");
    },
  };
}
