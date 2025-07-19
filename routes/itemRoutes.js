const itemController = require('../controllers/itemController');
const { generatePDF } = require('../controllers/pdfController');

module.exports = [
  {
    method: 'POST',
    path: '/bills/{billId}/items',
    handler: itemController.addItem,
  },
  {
    method: 'GET',
    path: '/items',
    handler: itemController.getItems,
  },
  {
    method: 'GET',
    path: '/bills/{billId}/export',
    handler: generatePDF,
  },
];
