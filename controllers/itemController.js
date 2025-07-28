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
    const truncatedName = name.substring(0, 17);

    await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, quantity, price, discount FROM items WHERE name = ? AND billId = ?`,
        [name, billId],
        (err, row) => {
          if (err) {
            reject(h.response({ error: 'Database error during lookup' }).code(500));
          } else if (row) {
            const newQty = row.quantity + quantity;
            const newDisc = row.discount + discount;

            db.run(
              `UPDATE items SET quantity = ?, price = ?, discount = ? WHERE id = ? AND billId = ?`,
              [newQty, price, newDisc, row.id, billId],
              (err2) => {
                if (err2) reject(h.response({ error: 'Failed to update item' }).code(500));
                resolve();
              }
            );
          } else {
            db.run(
              `INSERT INTO items (name, quantity, price, discount, belongsTo, billId) VALUES (?, ?, ?, ?, ?, ?)`,
              [truncatedName, quantity, price, discount, belongsTo || null, billId],
              function (err) {
                if (err) reject(err);
                resolve();
              }
            );
          }
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
      else resolve(h.response(rows).code(200));
    });
  });
};

const getBills = async (_request, h) => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM bills`, (err, rows) => {
      if (err) resolve(h.response({ message: 'Failed to retrieve bills' }).code(500));
      else resolve(h.response(rows).code(200));
    });
  });
};

const updateItem = async (request, h) => {
  const { billId } = request.params;
  const { id, name, quantity, price, discount } = request.payload;

  const fields = [];
  const values = [];

  if (name) {
    fields.push('name = ?');
    values.push(name);
  }
  if (quantity) {
    fields.push('quantity = ?');
    values.push(quantity);
  }
  if (price) {
    fields.push('price = ?');
    values.push(price);
  }
  if (discount !== undefined) {
    fields.push('discount = ?');
    values.push(discount);
  }

  if (fields.length === 0) return h.response({ error: 'No data sent to be changed.'}).code(400);

  const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ? AND billId = ?`;
  values.push(id, billId);

  return new Promise((resolve, reject) => {
    db.run(query, values, function (err) {
      if (err) reject(h.response({ error: 'Failed to update item' }).code(500));
      else if (this.changes === 0) resolve(h.response({ message: 'Item not found' }).code(404));
      else resolve(h.response({ message: 'Item updated successfully' }).code(200));
    });
  });
};

const deleteBill = async (request, h) => {
  const { billId } = request.params;

  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM items WHERE billId = ?`, [billId], (err) => {
      if (err) return reject(err);
      db.run(`DELETE FROM bills WHERE id = ?`, [billId], (err) => {
        if (err) return reject(err);
        resolve(
          h.response({ message: `bill ${billId} and related item deleted successfully` }).code(200)
        );
      });
    });
  });
};

module.exports = { addItem, getItems, getBills, updateItem, deleteBill };
