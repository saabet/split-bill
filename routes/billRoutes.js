const billController = require('../controllers/billController');

module.exports = [
  {
    method: 'POST',
    path: '/bills/start',
    handler: billController.startBill,
  },
];
