import { confirmDialog } from "./confirm-dialog";
import { toast } from "./toast";

// Quick switches for QR menu features ($store.features), asking before turning one off.
const features = {
  waiter: {
    name: "Garson çağır butonu",
    offMessage: "Müşteriler masadan garson çağıramayacak.",
    onText: "Müşteriler artık garson çağırabilir.",
    offText: "Garson çağır butonu QR menüde gizlendi.",
  },
  cart: {
    name: "Sepet",
    offMessage: "Müşteriler ürün ekleyip sipariş gönderemeyecek.",
    onText: "Müşteriler artık sepete ürün ekleyebilir.",
    offText: "Sepet QR menüde gizlendi.",
  },
};

export default function qrFeatures() {
  return {
    features,

    async toggle(key) {
      const store = this.$store.features;
      const f = features[key];
      if (store[key]) {
        const ok = await confirmDialog({
          title: "Kapatmak istediğinize emin misiniz?",
          item: f.name,
          message: "QR menüde gizlenecek.",
          warning: f.offMessage,
          confirmText: "Evet, kapat",
          icon: "power",
        });
        if (!ok) return;
        store[key] = false;
        toast(f.offText, "off", `${f.name} kapatıldı`);
      } else {
        store[key] = true;
        toast(f.onText, "success", `${f.name} açıldı`);
      }
    },
  };
}
