const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { db } = require('../services/db');

const generatePDF = async (request, h) => {
  const { billId } = request.params;

  const items = await new Promise((resolve, reject) => {
    const query = `SELECT belongsTo, name, quantity, price, discount FROM items WHERE billId = ? ORDER BY belongsTo`;
    db.all(query, [billId], (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
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

  const width = 299;
  const baseHeight = 100;
  const rowHeight = 17;
  // let index = 0;
  for (const [owner, data] of Object.entries(grouped)) {
    const discountLines = data.items.filter(i => i.discount > 0).length;
    const totalLines = data.items.length + discountLines + 2;
    const height = baseHeight + totalLines * rowHeight;

    doc.addPage({
      size: [width, height],
      margins: { top: 40, bottom: 20, left: 14.17, right: 14.17 },
    });

    doc
      .font('Courier')
      .fontSize(10)
      .text(`Struk belanja - ${billId}\n\n`, { width: 270, align: 'center' });
    doc.text(`Nama: ${owner}\n\n${`-`.repeat(45)}`).moveDown(0.5);

    data.items.forEach((item) => {
      const name = item.name.padEnd(17);
      const quantity = String(item.quantity).padStart(7);
      const unitPrice = item.price.toLocaleString('id-ID').padStart(9);
      const totalPrice = (item.quantity * item.price).toLocaleString('id-ID').padStart(12);
      doc.text(`${name}${quantity}${unitPrice}${totalPrice}`).moveDown(0.5);

      if (item.discount > 0) {
        const discount = `-${item.discount.toLocaleString('id-ID')}`;
        doc.text(`Hemat`.padEnd(45 - discount.length) + discount).moveDown(0.5);
      }
    });

    doc.text(
      `${`-`.repeat(45)}\n${`Total`.padEnd(
        45 - data.total.toLocaleString('id-ID').length
      )}${data.total.toLocaleString('id-ID')}`
    );
  }

  doc.end();

  return h.response({ message: `PDF saved to ${filePath}` }).code(200);
};

module.exports = { generatePDF };
