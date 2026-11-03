import QRCode from "qrcode";
import { TABLE_COUNT } from "./sales-data";
import { qrMenuIsLocal, qrMenuUrl } from "../../server";

// One QR code per table, pointing at the customer menu with &masa=<n>.
// View only: the table count is set by the platform admin (Super Panel) and the menu
// address by the platform, so the business cannot change where the codes lead.
export default function qrCodes() {
  return {
    baseUrl: "",
    tableCount: TABLE_COUNT,
    tables: [],
    // The address is this computer's place in the local network (for testing):
    // if the computer or the modem restarts it may change, and codes must be printed again.
    local: qrMenuIsLocal(),

    async init() {
      this.baseUrl = await qrMenuUrl();
      await this.render();
      // The business's own table count, once its profile has loaded.
      this.$watch("$store.session.business", (b) => {
        if (b?.tables && b.tables !== this.tableCount) {
          this.tableCount = b.tables;
          this.render();
        }
      });
      const b = this.$store.session.business;
      if (b?.tables && b.tables !== this.tableCount) {
        this.tableCount = b.tables;
        this.render();
      }
    },
    linkFor(n) {
      return `${this.baseUrl}&masa=${n}`;
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
