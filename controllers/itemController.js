const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { db } = require('../services/db');

const itemSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  price: Joi.number().positive().required(),
  discount: Joi.number().min(0).default(0),
  belongsTo: Joi.string().allow('', null),
  billId: Joi.string().optional(),
});

const addItem = async (request, h) => {
  try {
    const { error, value } = itemSchema.validate(request.payload);
    if (error) return h.response({ error: error.details[0].message }).code(400);

    const { name, quantity, price, discount, billId, belongsTo } = value;
    const id = uuidv4();

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO items (id, name, quantity, price, discount, belongsTo, billId) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, quantity, price, discount, belongsTo || null, billId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return h.response({ message: 'Item added', id }).code(201);
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

module.exports = { addItem, getItems };
