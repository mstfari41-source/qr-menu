import { toast } from "./toast";

// Social media links shown on the QR menu. Demo only: nothing is saved.
const networks = [
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/kullaniciadi" },
  { id: "facebook", name: "Facebook", placeholder: "https://facebook.com/sayfaadi" },
  { id: "x", name: "X (Twitter)", placeholder: "https://x.com/kullaniciadi" },
  { id: "tiktok", name: "TikTok", placeholder: "https://tiktok.com/@kullaniciadi" },
  { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@kanal" },
  { id: "maps", name: "Google Haritalar", placeholder: "https://maps.google.com/..." },
  { id: "website", name: "Web sitesi", placeholder: "https://www.ornek.com" },
];

export default function socialLinks() {
  return {
    networks,
    links: {
      instagram: "https://instagram.com/beecafe",
      facebook: "",
      x: "",
      tiktok: "",
      youtube: "",
      maps: "https://maps.google.com/?q=MA+Coffee",
      website: "",
    },
    editing: false,
    form: {},
    errors: {},

    startEdit() {
      this.form = { ...this.links };
      this.errors = {};
      this.editing = true;
    },
    save() {
      this.errors = {};
      for (const n of networks) {
        const url = (this.form[n.id] || "").trim();
        this.form[n.id] = url;
        if (url && !/^https?:\/\/\S+\.\S+/.test(url)) {
          this.errors[n.id] = "Adres http:// veya https:// ile başlamalı.";
        }
      }
      if (Object.keys(this.errors).length) return;
      this.links = { ...this.form };
      this.editing = false;
      toast("Sosyal medya bağlantıları güncellendi.");
    },
  };
}
