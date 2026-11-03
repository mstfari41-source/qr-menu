// Demo menu data, taken from the QR menu (qr-menu/index.html).
const img = (name) => `images/menu/${name}.jpg`;

export const categories = [
  { id: "kahvalti", name: "Kahvaltı", subtitle: "Güne taze bir başlangıç", image: img("kahvalti") },
  { id: "kahve", name: "Kahve", subtitle: "Sıcak ve soğuk seçenekler", image: img("kahve") },
  { id: "burger", name: "Burger", subtitle: "El yapımı köfteli burgerler", image: img("burger") },
  { id: "pizza", name: "Pizza", subtitle: "Elde açılmış hamur, bol malzeme", image: img("pizza") },
  { id: "tatli", name: "Tatlı", subtitle: "Tatlı bir mola için", image: img("tatli") },
  { id: "icecek", name: "İçecek", subtitle: "Serinleten seçenekler", image: img("icecek") },
];

export const products = [
  { id: "kahvalti-serpme", rating: 4.9, category: "kahvalti", name: "Serpme kahvaltı", description: "2 kişilik, sınırsız çay", price: 650, image: img("kahvalti") },
  { id: "kahvalti-menemen", rating: 4.7, category: "kahvalti", name: "Menemen", description: "Domates, biber, peynir", price: 170, image: img("kahvalti") },
  { id: "kahvalti-sucuklu", rating: 4.6, category: "kahvalti", name: "Sucuklu yumurta", description: "Tereyağında, sıcak servis", price: 185, image: img("kahvalti") },
  { id: "kahve-latte", rating: 4.9, category: "kahve", name: "Latte", description: "Çift shot espresso, sıcak süt", price: 95, image: img("kahve-latte"), popular: true },
  { id: "kahve-americano", rating: 4.5, category: "kahve", name: "Americano", description: "Yumuşak içimli filtre", price: 80, image: img("kahve") },
  { id: "kahve-turk", rating: 4.8, category: "kahve", name: "Türk kahvesi", description: "Közde, lokum ile", price: 70, image: img("kahve") },
  { id: "burger-smash", rating: 4.8, category: "burger", name: "Smash burger", description: "Çift köfte, cheddar, turşu", price: 240, image: img("burger"), popular: true },
  { id: "burger-aci", rating: 4.6, category: "burger", name: "Acılı burger", description: "Jalapeño, acı sos", price: 255, image: img("burger") },
  { id: "burger-tavuk", rating: 4.4, category: "burger", name: "Tavuk burger", description: "Çıtır tavuk, marul, mayonez", price: 215, image: img("burger") },
  { id: "pizza-margherita", rating: 4.7, category: "pizza", name: "Margherita", description: "Domates, mozzarella, fesleğen", price: 210, image: img("pizza"), popular: true },
  { id: "pizza-karisik", rating: 4.5, category: "pizza", name: "Karışık pizza", description: "Mantar, biber, zeytin, sosis", price: 245, image: img("pizza") },
  { id: "pizza-sucuklu", rating: 4.6, category: "pizza", name: "Sucuklu pizza", description: "Sucuk, kaşar, közlenmiş biber", price: 235, image: img("pizza") },
  { id: "tatli-kunefe", rating: 4.9, category: "tatli", name: "Fıstıklı künefe", description: "Sıcak servis, kaymak ile", price: 220, image: img("tatli"), popular: true },
  { id: "tatli-cheesecake", rating: 4.8, category: "tatli", name: "San Sebastian", description: "Yumuşak iç, karamel sos", price: 190, image: img("tatli") },
  { id: "tatli-sutlac", rating: 4.5, category: "tatli", name: "Fırın sütlaç", description: "Üzeri kızarmış, geleneksel", price: 130, image: img("tatli") },
  { id: "icecek-limonata", rating: 4.6, category: "icecek", name: "Ev yapımı limonata", description: "Taze nane, buz", price: 85, image: img("icecek") },
  { id: "icecek-ayran", rating: 4.3, category: "icecek", name: "Ayran", description: "Bakır kasede, köpüklü", price: 35, image: img("icecek") },
  { id: "icecek-soguk-cay", rating: 4.2, category: "icecek", name: "Soğuk çay", description: "Şeftali veya limon", price: 60, image: img("icecek") },
];

// Profit margin 1-5 per product, from the QR menu's CONFIG (missing = 3).
export const margin = {
  "tatli-kunefe": 5,
  "tatli-cheesecake": 5,
  "kahve-latte": 5,
  "icecek-limonata": 5,
  "burger-smash": 4,
};

// Times of day each category suits, from the QR menu's CONFIG.slots.
export const dayParts = [
  { id: "sabah", name: "Sabah", from: 6 },
  { id: "ogle", name: "Öğle", from: 11 },
  { id: "aksam", name: "Akşam", from: 17 },
  { id: "gece", name: "Gece", from: 22 },
];

export const slots = {
  kahvalti: ["sabah"],
  kahve: ["sabah", "ogle", "aksam"],
  burger: ["ogle", "aksam"],
  pizza: ["ogle", "aksam"],
  tatli: ["ogle", "aksam", "gece"],
  icecek: ["ogle", "aksam"],
};

export function currentDayPart(hour = new Date().getHours()) {
  if (hour < 6) return "gece";
  return [...dayParts].reverse().find((d) => hour >= d.from).id;
}

// Languages the QR menu supports; Turkish is the source language.
export const languages = [
  { id: "tr", name: "Türkçe", short: "TR" },
  { id: "en", name: "English", short: "EN" },
  { id: "de", name: "Deutsch", short: "DE" },
  { id: "ru", name: "Русский", short: "RU" },
];

// Customer menu address used by "Menüyü görüntüle" (local demo server).
export const MENU_URL = "http://localhost:3000/m/?isletme=beecafe";

export const formatPrice = (n) =>`${n.toLocaleString("tr-TR")} ₺`;
