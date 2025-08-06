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
    method: 'PUT',
    path: '/bills/{billId}/undo-split',
    handler: billController.undoSplit,
  },
  {
    method: 'POST',
    path: '/bills/{billId}/finish',
    handler: billController.finishBill,
  },
  {
    method: 'GET',
    path: '/bills',
    handler: billController.getBills,
  },
  {
    method: 'PUT',
    path: '/bills/{billId}',
    handler: billController.updateBillInfo,
  },
];
