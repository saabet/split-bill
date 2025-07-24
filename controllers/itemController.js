const Joi = require('joi');
const { db } = require('../services/db');

const itemSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  price: Joi.number().positive().required(),
  discount: Joi.number().min(0).default(0),
  belongsTo: Joi.string().allow('', null),
});

const addItem = async (request, h) => {
  try {
    const { billId } = request.params;
    const { error, value } = itemSchema.validate(request.payload);
    if (error) return h.response({ error: error.details[0].message }).code(400);

    const { name, quantity, price, discount, belongsTo } = value;
    const truncatedName = name.substring(0,17);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO items (name, quantity, price, discount, belongsTo, billId) VALUES (?, ?, ?, ?, ?, ?)`,
        [truncatedName, quantity, price, discount, belongsTo || null, billId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return h.response({ message: 'Item added' }).code(201);
  } catch (err) {
    return h.response({ error: 'Internal Server Error' }).code(500);
  }
};

const getItems = async (_request, h) => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM items`, (err, rows) => {
      if (err) resolve(h.response({ error: 'Failed to retrieve items' }).code(500));
      else resolve(h.response(rows));
    });
  });
};

const getBills = async (_request, h) => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM bills`, (err, rows) => {
            if (err) resolve(h.response({ message: 'Failed to retrieve bills'}).code(500));
            else resolve(h.response(rows).code(200));
        });
    });
};
  const { billId } = request.params;

  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM items WHERE billId = ?`, [billId], (err) => {
      if (err) return reject(err);
      resolve(
        h.response({ message: `Deleted: ${this.changes} items from bill ${billId}` }).code(200)
      );
    });
  });
};

module.exports = { addItem, getItems, deleteItemsbyBillId };
