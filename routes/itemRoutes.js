const itemController = require('../controllers/itemController');

module.exports = [
    {
        method: 'POST',
        path: '/items',
        handler: itemController.addItem
    },
    {
        method: 'GET',
        path: '/items',
        handler: itemController.getItems
    },
];