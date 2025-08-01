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
    path: '/bills/{billId}/items',
    handler: itemController.getItemsByBill,
  },
  {
    method: 'GET',
    path: '/bills',
    handler: itemController.getBills,
  },
  {
    method: 'GET',
    path: '/bills/{billId}/export',
    handler: generatePDF,
  },
  {
    method: 'PUT',
    path: '/bills/{billId}/items',
    handler: itemController.updateItem,
  },
  {
    method: 'DELETE',
    path: '/bills/{billId}/items',
    handler: itemController.deleteItems,
  },
  {
    method: 'DELETE',
    path: '/bills/{billId}',
    handler: itemController.deleteBill,
  },
];
