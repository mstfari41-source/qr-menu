import { categories, products, languages, formatPrice } from "./menu-data";
import { CT, PT, ING, DETAIL } from "./menu-translations";
import { toast } from "./toast";
import { confirmDialog } from "./confirm-dialog";
import { currentBusiness } from "../../routes";
import { bizApi, upload } from "../../server";
import { demoBusinesses } from "../super/businesses";

// The menu lives on the server (server/index.mjs) and the QR menu reads it from there.
// Every change is saved shortly after it is made. Without the server the editor still
// works on demo data, but nothing is saved.
const SAVE_DELAY = 700;
const LANG_INDEX = { tr: 0, en: 1, de: 2, ru: 3 };
const otherLangs = languages.filter((l) => l.id !== "tr");
const clone = (o) => JSON.parse(JSON.stringify(o));

const slug = (text) =>
  text
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "oge";

const emptyI18n = (fields) => Object.fromEntries(otherLangs.map((l) => [l.id, Object.fromEntries(fields.map((f) => [f, ""]))]));

function initialCategories() {
  return categories.map((c) => {
    const i18n = emptyI18n(["name", "subtitle"]);
    for (const l of otherLangs) {
      const t = CT[l.id]?.[c.id];
      if (t) i18n[l.id] = { name: t[0], subtitle: t[1] };
    }
    return { ...c, i18n };
  });
}

function initialProducts() {
  return products.map((p) => {
    const i18n = emptyI18n(["name", "description"]);
    for (const l of otherLangs) {
      const t = PT[l.id]?.[p.id];
      if (t) i18n[l.id] = { name: t[0], description: t[1] };
    }
    const d = DETAIL[p.id];
    return {
      active: true,
      popular: false,
      ...p,
      i18n,
      // The QR menu only has Turkish and English detail texts.
      detail: { tr: d?.[0] ?? "", en: d?.[1] ?? "", de: "", ru: "" },
      ingredients: d ? d[2].split(" ") : [],
    };
  });
}

const emptyProduct = (category) => ({
  id: null,
  name: "",
  description: "",
  category,
  price: "",
  rating: 0,
  image: "",
  popular: false,
  active: true,
  i18n: emptyI18n(["name", "description"]),
  detail: { tr: "", en: "", de: "", ru: "" },
  ingredients: [],
});

const emptyCategory = () => ({ id: null, name: "", subtitle: "", image: "", i18n: emptyI18n(["name", "subtitle"]) });

export default function menuEditor() {
  return {
    languages,
    tab: "products",
    categories: initialCategories(),
    products: initialProducts(),
    ingredients: clone(ING),
    filter: "all",
    search: "",

    saveState: "loading", // loading | saving | saved | offline | error
    saveTimer: null,

    async init() {
      try {
        const menu = await bizApi("/menu");
        this.categories = menu.categories;
        this.products = menu.products;
        this.saveState = "saved";
      } catch (err) {
        if (err.status === 0) return (this.saveState = "offline");
        // First time: the demo menu becomes this business's menu.
        if (err.status === 404) await this.saveNow();
      }
      this.$watch("categories", () => this.scheduleSave());
      this.$watch("products", () => this.scheduleSave());
    },
    // Staff with view-only access may look around; their changes are not saved.
    get readOnly() {
      return !this.$store.session.can("menu", "edit");
    },
    scheduleSave() {
      clearTimeout(this.saveTimer);
      if (this.readOnly) return (this.saveState = "readonly");
      this.saveState = "saving";
      this.saveTimer = setTimeout(() => this.saveNow(), SAVE_DELAY);
    },
    async saveNow() {
      this.saveState = "saving";
      const brand = demoBusinesses.find((b) => b.slug === currentBusiness()) ?? demoBusinesses[0];
      try {
        await bizApi("/menu", {
          method: "PUT",
          body: { brand: { name: brand.name }, categories: this.categories, products: this.products },
        });
        this.saveState = "saved";
      } catch (err) {
        this.saveState = "error";
        toast(err.message, "error", "Menü kaydedilemedi");
        // Permission problems will not fix themselves; only retry when the server was away.
        if (err.status === 0) this.saveTimer = setTimeout(() => this.saveNow(), 5000);
      }
    },
    // Pictures are uploaded to the server right away; the product keeps their address.
    async uploadImage(event, target) {
      const file = event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (this.saveState === "offline") return (target.image = URL.createObjectURL(file));
      this.uploading = true;
      try {
        target.image = await upload(file);
      } catch (err) {
        toast(err.message, "error", "Fotoğraf yüklenemedi");
      } finally {
        this.uploading = false;
      }
    },
    uploading: false,

    // Product modal
    isModalOpen: false,
    form: emptyProduct(categories[0].id),
    formLang: "tr",
    newIngredient: "",
    error: "",

    // Category modal
    isCategoryOpen: false,
    catForm: emptyCategory(),
    catLang: "tr",
    catError: "",

    // --- product list ---
    get visible() {
      const q = this.search.trim().toLocaleLowerCase("tr");
      return this.products.filter(
        (p) =>
          (this.filter === "all" || p.category === this.filter) &&
          (!q || p.name.toLocaleLowerCase("tr").includes(q)),
      );
    },
    count(categoryId) {
      return categoryId === "all"
        ? this.products.length
        : this.products.filter((p) => p.category === categoryId).length;
    },
    categoryName(id) {
      return this.categories.find((c) => c.id === id)?.name ?? "-";
    },
    missingLangs(item, field = "name") {
      return otherLangs.filter((l) => !item.i18n[l.id]?.[field]?.trim()).map((l) => l.short);
    },
    formatPrice,
    stars(rating) {
      return Math.round(rating);
    },

    // --- ingredients ---
    ingredientName(key, lang = this.formLang) {
      const names = this.ingredients[key];
      return names?.[LANG_INDEX[lang]] || names?.[0] || key;
    },
    get availableIngredients() {
      return Object.keys(this.ingredients)
        .filter((k) => !this.form.ingredients.includes(k))
        .sort((a, b) => this.ingredientName(a, "tr").localeCompare(this.ingredientName(b, "tr"), "tr"));
    },
    addIngredient(key) {
      if (key && !this.form.ingredients.includes(key)) this.form.ingredients.push(key);
    },
    addNewIngredient() {
      const name = this.newIngredient.trim();
      if (!name) return;
      let key = slug(name);
      if (!this.ingredients[key]) this.ingredients[key] = [name, "", "", ""];
      else if (this.ingredients[key][0] !== name) key = `${key}-${Date.now()}`, (this.ingredients[key] = [name, "", "", ""]);
      this.addIngredient(key);
      this.newIngredient = "";
    },
    removeIngredient(key) {
      this.form.ingredients = this.form.ingredients.filter((k) => k !== key);
    },

    // --- product modal ---
    openNew() {
      this.form = emptyProduct(this.filter !== "all" ? this.filter : this.categories[0]?.id);
      this.formLang = "tr";
      this.error = "";
      this.isModalOpen = true;
    },
    openEdit(product) {
      this.form = clone(product);
      this.formLang = "tr";
      this.error = "";
      this.isModalOpen = true;
    },
    pickImage(event) {
      return this.uploadImage(event, this.form);
    },
    save() {
      const price = Number(this.form.price);
      const rating = Number(this.form.rating);
      if (!this.form.name.trim()) {
        this.formLang = "tr";
        return (this.error = "Türkçe ürün adı boş olamaz.");
      }
      if (!(price > 0)) return (this.error = "Geçerli bir fiyat girin.");
      if (rating < 0 || rating > 5) return (this.error = "Puan 0 ile 5 arasında olmalı.");

      const item = { ...clone(this.form), name: this.form.name.trim(), price, rating };
      if (item.id) {
        const i = this.products.findIndex((p) => p.id === item.id);
        this.products.splice(i, 1, item);
        toast(`"${item.name}" güncellendi.`);
      } else {
        item.id = `${item.category}-${slug(item.name)}-${Date.now()}`;
        this.products.push(item);
        toast(`"${item.name}" menüye eklendi.`, "success", "Ürün eklendi");
      }
      this.isModalOpen = false;
    },
    async remove(product) {
      const ok = await confirmDialog({
        title: "Ürün silinsin mi?",
        item: product.name,
        message: "ürünü fotoğrafı ve çevirileriyle birlikte menüden kaldırılacak.",
      });
      if (ok) {
        this.products = this.products.filter((p) => p.id !== product.id);
        toast(`"${product.name}" menüden kaldırıldı.`, "danger");
      }
    },

    // --- categories ---
    moveCategory(index, step) {
      const to = index + step;
      if (to < 0 || to >= this.categories.length) return;
      const list = [...this.categories];
      [list[index], list[to]] = [list[to], list[index]];
      this.categories = list;
    },
    openNewCategory() {
      this.catForm = emptyCategory();
      this.catLang = "tr";
      this.catError = "";
      this.isCategoryOpen = true;
    },
    openEditCategory(category) {
      this.catForm = clone(category);
      this.catLang = "tr";
      this.catError = "";
      this.isCategoryOpen = true;
    },
    pickCategoryImage(event) {
      return this.uploadImage(event, this.catForm);
    },
    saveCategory() {
      const name = this.catForm.name.trim();
      if (!name) {
        this.catLang = "tr";
        return (this.catError = "Türkçe kategori adı boş olamaz.");
      }
      const item = { ...clone(this.catForm), name };
      if (item.id) {
        const i = this.categories.findIndex((c) => c.id === item.id);
        this.categories.splice(i, 1, item);
        toast(`"${name}" kategorisi güncellendi.`);
      } else {
        item.id = slug(name);
        if (this.categories.some((c) => c.id === item.id)) item.id += `-${Date.now()}`;
        this.categories.push(item);
        toast(`"${name}" kategorisi eklendi.`, "success", "Kategori eklendi");
      }
      this.isCategoryOpen = false;
    },
    async removeCategory(category) {
      const n = this.count(category.id);
      if (n) return toast(`"${category.name}" kategorisinde ${n} ürün var. Önce ürünleri başka kategoriye taşıyın veya silin.`, "error", "Silinemedi");
      const ok = await confirmDialog({
        title: "Kategori silinsin mi?",
        item: category.name,
        message: "kategorisi menüden kaldırılacak.",
      });
      if (ok) {
        this.categories = this.categories.filter((c) => c.id !== category.id);
        if (this.filter === category.id) this.filter = "all";
        toast(`"${category.name}" kategorisi silindi.`, "danger");
      }
    },
  };
}
