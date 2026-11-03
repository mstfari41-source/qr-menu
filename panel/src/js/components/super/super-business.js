import { confirmDialog } from "../business/confirm-dialog";
import { toast } from "../business/toast";
import { businessUrl, lastPart, superBusinessUrl, superUrl } from "../../routes";
import { api, qrMenuUrl, upload } from "../../server";
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
  // /super/isletmeler/<slug> ("yeni" for a new one); ?id= still works for old links.
  const id = new URLSearchParams(location.search).get("id");
  const slug = lastPart();
  const isNewPage = slug === "yeni" && !id;
  const start = emptyBusiness();

  return {
    loading: true,
    online: false,
    all: demoBusinesses,
    // An address that is neither "yeni" nor a known business shows a "not found" note.
    notFound: false,
    isNew: isNewPage,
    editing: isNewPage,
    form: start,
    saved: JSON.stringify(start),
    // the address the business is saved under (changes when the menu address changes)
    savedSlug: null,
    slugTouched: !isNewPage,
    errors: {},
    tempPassword: null,
    busy: false,
    categories,
    packages,
    statuses,
    MENU_HOST,
    initials,
    formatDate,

    // Start of the customer menu address; the business's menu address (slug) completes it.
    menuBase: MENU_HOST,
    async init() {
      qrMenuUrl("SLUG").then((u) => (this.menuBase = u.replace("SLUG", "")));
      // Leaving the page with unsaved edits asks first.
      window.addEventListener("beforeunload", (e) => {
        if (this.editing && this.dirty) e.preventDefault();
      });
      try {
        this.all = await api("/api/super/businesses");
        this.online = true;
      } catch (err) {
        if (err.status !== 0) return toast(err.message, "error", "Yüklenemedi");
      }
      if (!isNewPage) {
        const found = this.all.find((b) => (id ? String(b.id) === id : b.slug === slug));
        if (found) {
          this.form = clone(found);
          this.saved = JSON.stringify(this.form);
          this.savedSlug = found.slug;
        } else this.notFound = true;
      }
      this.loading = false;
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
      if (this.isNew) return (location.href = superUrl("isletmeler"));
      this.reset();
      this.editing = false;
    },
    get panelUrl() {
      return businessUrl("giris", JSON.parse(this.saved).slug);
    },
    get listUrl() {
      return superUrl("isletmeler");
    },
    get tint() {
      return tintFor(this.form.id || this.all.length + 1);
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

    // The logo is uploaded under the business's address right away.
    async pickLogo(event) {
      const file = event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (!this.online) {
        if (!file.type.startsWith("image/")) return toast("Lütfen bir görsel dosyası seçin.", "error", "Geçersiz dosya");
        return (this.form.logo = URL.createObjectURL(file));
      }
      const target = this.savedSlug || this.form.slug;
      if (!SLUG.test(target)) return toast("Önce işletme adını ve menü adresini yazın.", "error", "Menü adresi eksik");
      this.busy = true;
      try {
        this.form.logo = await upload(file, target);
      } catch (err) {
        toast(err.message, "error", "Logo yüklenemedi");
      } finally {
        this.busy = false;
      }
    },
    removeLogo() {
      this.form.logo = "";
    },

    validate() {
      const f = this.form;
      const e = {};
      if (!f.name.trim()) e.name = "İşletme adı gerekli.";
      if (!SLUG.test(f.slug)) e.slug = "Sadece küçük harf, rakam ve tire kullanılabilir.";
      else if (this.all.some((b) => b.slug === f.slug && b.slug !== this.savedSlug)) e.slug = "Bu adres başka bir işletmede kullanılıyor.";
      if (f.email && !EMAIL.test(f.email)) e.email = "Geçerli bir e-posta girin.";
      if (!f.owner.name.trim()) e.ownerName = "Yetkili adı gerekli.";
      if (!EMAIL.test(f.owner.email)) e.ownerEmail = "Panel girişi için geçerli bir e-posta gerekli.";
      if (f.billing.taxNo && !/^\d{10,11}$/.test(f.billing.taxNo)) e.taxNo = "Vergi no 10, T.C. kimlik no 11 haneli olmalı.";
      if (!f.billing.sameAddress && !f.billing.address.trim()) e.billingAddress = "Fatura adresi gerekli.";
      this.errors = e;
      return !Object.keys(e).length;
    },
    async save() {
      if (!this.editing || this.busy) return;
      if (!this.validate()) {
        this.$nextTick(() => this.$root.querySelector("[aria-invalid=true]")?.focus());
        return toast("İşaretli alanları kontrol edin.", "error", "Kaydedilemedi");
      }
      const wasNew = this.isNew;
      if (this.online) {
        this.busy = true;
        try {
          const saved = await api(`/api/super/businesses/${this.savedSlug ?? "yeni"}`, { method: "PUT", body: this.form });
          this.form = { ...this.form, ...saved };
          const i = this.all.findIndex((b) => b.slug === this.savedSlug);
          if (i === -1) this.all.push(saved);
          else this.all.splice(i, 1, saved);
        } catch (err) {
          return toast(err.message, "error", "Kaydedilemedi");
        } finally {
          this.busy = false;
        }
      } else if (wasNew) this.form.id = Math.max(...this.all.map((b) => b.id)) + 1;
      this.isNew = false;
      this.savedSlug = this.form.slug;
      this.saved = JSON.stringify(this.form);
      // The address follows the (possibly new or renamed) menu address.
      history.replaceState(null, "", superBusinessUrl(this.form.slug));
      this.editing = false;
      toast(
        wasNew ? `${this.form.name} platforma eklendi. Sahibine giriş için geçici parola oluşturun.` : `${this.form.name} bilgileri güncellendi.`,
        "success",
        wasNew ? "İşletme oluşturuldu" : "Kaydedildi",
      );
    },
    reset() {
      this.form = JSON.parse(this.saved);
      this.errors = {};
    },
    // A one-time password for the owner, shown here once; the owner changes it on Profil.
    async sendReset() {
      if (!this.savedSlug) return toast("Önce işletmeyi kaydedin.", "error", "Kaydedilmedi");
      if (!this.online) return toast("Sunucu kapalı.", "error", "Parola oluşturulamadı");
      const ok = await confirmDialog({
        title: "Geçici parola oluşturulsun mu?",
        item: this.form.owner.email,
        message: "için yeni bir parola oluşturulacak.",
        warning: "Eski parola çalışmaz olur ve açık oturumlar kapanır.",
        confirmText: "Evet, oluştur",
        icon: "power",
      });
      if (!ok) return;
      try {
        this.tempPassword = await api(`/api/super/businesses/${this.savedSlug}/owner-password`, { method: "POST" });
      } catch (err) {
        toast(err.message, "error", "Parola oluşturulamadı");
      }
    },
    async copyTemp() {
      try {
        await navigator.clipboard.writeText(this.tempPassword.password);
        toast("Geçici parola kopyalandı.", "success", "Kopyalandı");
      } catch {
        toast("Kopyalanamadı; parolayı seçip elle kopyalayın.", "error", "Kopyalanamadı");
      }
    },
  };
}
