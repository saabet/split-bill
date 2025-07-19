const PDFDocument = require('pdfkit');
const { db } = require('../services/db');
const fs = require('fs');
const path = require('path');

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
    const owner = item.belongsTo || 'Unassigned';
    const total = item.quantity * item.price - item.discount;

    if (!grouped[owner]) grouped[owner] = { items: [], total: 0 };

    grouped[owner].items.push(item);
    grouped[owner].total += total;
  }

  const exportPath = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath);

  const filePath = path.join(exportPath, `bill-${billId}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Bill ID: ${billId}\n\n`);

  for (const [owner, data] of Object.entries(grouped)) {
    doc.fontSize(14).text(`Nama: ${owner}`);
    doc.fontSize(12);

    data.items.forEach((item) => {
      const subtotal = item.quantity * item.price - item.discount;
      doc.text(`- ${item.name} ×${item.quantity} @${item.price} - ${item.discount} = ${subtotal}`);
    });

    doc.text(`Total: ${data.total}\n`, { underline: true });
  }

  doc.end();

  return h
    .response({ message: `PDF saved to ${filePath}` })
    .code(200);
};

module.exports = { generatePDF };
