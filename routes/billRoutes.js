const billController = require('../controllers/billController');

module.exports = [
  {
    method: 'POST',
    path: '/bills/start',
    handler: billController.startBill,
  },
  {
    method: 'POST',
    path: '/bills/{billId}/split',
    handler: billController.splitBill,
  },
  {
    method: 'POST',
    path: '/bills/finish',
    handler: billController.finishBill,
  },
  {
    method: 'GET',
    path: '/bills/{id}/items',
    handler: billController.getItemsByBill,
  },
];
