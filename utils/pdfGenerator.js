const PDFDocument = require('pdfkit');
const fs = require('fs');

function generatePDF(billItems, filename = 'receipt.pdf') {
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filename));

    doc.fontSize(20).text('Struk Belanja', { align: 'center' });
    doc.moveDown();

    billItems.forEach((item, i) => {
        doc.fontSize(12).text(`${i + 1}. ${item.name} x${item.quantity} - Rp${item.price} (Diskon: ${item.discount}%)`);
    });

    doc.end();
}

module.exports = generatePDF;