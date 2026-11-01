import QRCode from "qrcode";
import { TABLE_COUNT } from "./sales-data";

// One QR code per table, pointing at the customer menu with ?masa=<n>.
// View only: the menu address and table count are set by the platform
// admin (Super Panel), so the business cannot change where the codes lead.
const MENU_ADDRESS = "https://menu.beecafe.com.tr/";

export default function qrCodes() {
  return {
    baseUrl: MENU_ADDRESS,
    tableCount: TABLE_COUNT,
    tables: [],

    init() {
      this.render();
    },
    linkFor(n) {
      return `${this.baseUrl}${this.baseUrl.includes("?") ? "&" : "?"}masa=${n}`;
    },
    async render() {
      const tables = [];
      for (let n = 1; n <= this.tableCount; n++) {
        const link = this.linkFor(n);
        const image = await QRCode.toDataURL(link, { width: 320, margin: 1 });
        tables.push({ n, link, image });
      }
      this.tables = tables;
    },
    download(table) {
      const a = document.createElement("a");
      a.href = table.image;
      a.download = `masa-${table.n}-qr.png`;
      a.click();
    },
  };
}
