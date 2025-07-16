const itemController = require('../controllers/itemController');

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
];
