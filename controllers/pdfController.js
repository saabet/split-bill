const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { db } = require('../services/db');

const generatePDF = async (request, h) => {
  const { billId } = request.params;

  const items = await new Promise((resolve, reject) => {
    const query = `SELECT id, belongsTo, name, quantity, price, discount FROM items WHERE billId = ? ORDER BY belongsTo`;
    db.all(query, [billId], (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });

  const billInfo = await new Promise((resolve, reject) => {
    const query = `SELECT storeName, purchaseDate FROM bills WHERE id = ?`;
    db.get(query, [billId], (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });

  const grouped = {};
  for (const item of items) {
    if (item.quantity === 0) continue;

    const owner = item.belongsTo || 'Unassigned';
    const total = item.quantity * item.price - item.discount;

    if (!grouped[owner]) grouped[owner] = { items: [], total: 0 };

    grouped[owner].items.push(item);
    grouped[owner].total += total;
  }

  const exportPath = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath);

  const filePath = path.join(exportPath, `bill-${billId}.pdf`);
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const baseHeight = 100;
  const rowHeight = 17;

  let paperWidth = 57 * 3.7795275591;
  let titleWidth = paperWidth - 2 * 14.17;
  let padStart = 0;
  let padEnd = 31;

  const useId = false;
  if (useId) {
    paperWidth = 330;
    titleWidth = 300;
    padStart = 10;
    padEnd = 35;
  }

  for (const [owner, data] of Object.entries(grouped)) {
    const discountLines = data.items.filter((i) => i.discount > 0).length;
    const qtyLines = data.items.filter((i) => (i.quantity != 0 && i.quantity != 1) || (i.discount > 0 && i.quantity == 1)).length;
    const totalLines = data.items.length + discountLines + qtyLines + 6;
    console.log(totalLines-4);
    const height = baseHeight + totalLines * rowHeight;
    const formatedDate = new Date(billInfo.purchaseDate).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace('.', ':');

    const date = formatedDate.slice(0, 10);
    const time = formatedDate.slice(-5)

    doc.addPage({
      size: [paperWidth, height],
      margins: { top: 2 * 14.17, bottom: 14.17, left: 14.17, right: 14.17 },
    });

    doc
      .font('Courier')
      .fontSize(10)
      .text(`Split Bill - ${billId}`, {
        width: titleWidth,
        align: 'center',
      })
      .moveDown(1);
    doc
      .text(`${billInfo.storeName}`.padEnd(padEnd - date.length) + date)
      .moveDown(0.5);
    doc.text(time.padStart(padEnd)).moveDown(1);
    doc.text(`${`-`.repeat(padEnd)}\nBelongs to: ${owner}\n${`-`.repeat(padEnd)}`).moveDown(0.5);

    let totalQty = 0;
    let totalDisc = 0;
    data.items.forEach((item) => {
      // const id = String(item.id).padEnd(5);
      const name = item.name.padEnd(23);
      const totalPrice = (item.quantity * item.price - item.discount)
        .toLocaleString('id-ID')
        .padStart(8);
      const quantity = String(item.quantity).padStart(13).padEnd(14);
      const unitPrice = item.price.toLocaleString('id-ID').padStart(7);
      totalQty += item.quantity;
      totalDisc += item.discount;

      doc.text(`${name}${totalPrice}`).moveDown(0.5);
      if (item.quantity != 0 && item.quantity != 1) {
        doc.text(`${quantity} @ ${unitPrice}`).moveDown(0.5);
      }
      if (item.discount > 0) {
        const discount = `-${item.discount.toLocaleString('id-ID')}`.padStart(7);
        const qtyOfDisc = String(item.quantity).padStart(3);
        if (item.quantity == 1) doc.text(`${quantity} @ ${unitPrice}`).moveDown(0.5);
        doc.text(`Hemat`.padStart(7).padEnd(9) + `(-)(${qtyOfDisc})` + discount).moveDown(0.5);
      }
    });

    //totalQty = String(totalQty);
    doc.text(
      `${`-`.repeat(padEnd)}\n${String(totalQty).padStart(5) + ` ITEMS`}${`TOTAL:`
        .padStart(10)}${data.total.toLocaleString('id-ID').padStart(10)}\n\n Anda Hemat\n${totalDisc.toLocaleString('id-ID').padStart(11)}`
    );
  }

  doc.end();

  return h.response({ message: `PDF saved to ${filePath}` }).code(200);
};

module.exports = { generatePDF };
