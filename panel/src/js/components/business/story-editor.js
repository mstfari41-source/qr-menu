import { products, margin } from "./menu-data";
import { toast } from "./toast";

const MAX_STORIES = 10;

// Story order from the QR menu's CONFIG.stories.
const defaultStories = [
  "tatli-kunefe", "burger-smash", "pizza-margherita", "kahve-latte", "kahvalti-serpme",
  "tatli-cheesecake", "kahvalti-menemen", "icecek-limonata", "pizza-sucuklu", "kahve-turk",
];

// Automatic mode: popular and high-margin products first.
function autoStories() {
  const score = (p) => (margin[p.id] ?? 3) + (p.popular ? 2 : 0);
  return [...products]
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_STORIES)
    .map((p) => p.id);
}

export default function storyEditor() {
  return {
    max: MAX_STORIES,
    auto: true,
    manual: [...defaultStories],
    search: "",

    get selected() {
      const ids = this.auto ? autoStories() : this.manual;
      return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
    },
    get available() {
      const q = this.search.trim().toLocaleLowerCase("tr");
      const ids = this.selected.map((p) => p.id);
      return products.filter(
        (p) => !ids.includes(p.id) && (!q || p.name.toLocaleLowerCase("tr").includes(q)),
      );
    },
    get isFull() {
      return this.selected.length >= MAX_STORIES;
    },

    add(id) {
      if (this.auto || this.isFull) return;
      this.manual.push(id);
      toast(`${products.find((p) => p.id === id).name} story'lere eklendi.`, "success", "Story eklendi");
    },
    remove(id) {
      if (this.auto) return;
      this.manual = this.manual.filter((x) => x !== id);
      toast(`${products.find((p) => p.id === id).name} story'lerden çıkarıldı.`, "danger", "Story çıkarıldı");
    },
    move(index, step) {
      const to = index + step;
      if (this.auto || to < 0 || to >= this.manual.length) return;
      const list = [...this.manual];
      [list[index], list[to]] = [list[to], list[index]];
      this.manual = list;
    },
  };
}
