const { v4: uuidv4 } = require('uuid');
const { db } = require('../services/db');

const startBill = async (request, h) => {
  const billId = uuidv4();
  const createdAt = new Date().toISOString();
  const { storeName, purchaseDate } = request.payload;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO bills (id, storeName, purchaseDate, createdAt) VALUES (?, ?, ?, ?)`,
      [billId, storeName, purchaseDate, createdAt],
      (err) => {
        if (err) reject(h.response({ error: 'Failed to start bill' }).code(500));
        else resolve(h.response({ billId }).code(201));
      }
    );
  });
};

const splitBill = async (request, h) => {
  const { billId } = request.params;
  const splitData = request.payload;

  for (const owner of splitData) {
    const { name, items } = owner;

    for (const item of items) {
      const { id, quantity } = item;

      const originalItem = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM items WHERE id = ? AND billId = ?`, [id, billId], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

      if (!originalItem) {
        return h.response({ error: `Item with id ${id} not found in this bill.` }).code(404);
      }

      if (quantity === originalItem.quantity && originalItem.belongsTo === null) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE items SET belongsTo = ? WHERE id = ? AND billId = ?`,
            [name, id, billId],
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      } else {
        const originalQty = parseFloat(originalItem.quantity);
        const requestedQty = parseFloat(quantity);
        const remaining = parseFloat(originalQty - requestedQty).toFixed(2);
        const unitDiscount = parseFloat((originalItem.discount / originalQty).toFixed(2));
        const remainingDiscount = parseFloat((unitDiscount * remaining).toFixed(2));
        const subtotalDiscount = parseFloat((unitDiscount * requestedQty).toFixed(2));

        if (remaining < 0) {
          return h
            .response({ error: `Quantity for item ${id} exceeds original quantity.` })
            .code(400);
        }

        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE items SET quantity = ?, discount = ? WHERE id = ? AND billId = ?`,
            [remaining, remainingDiscount, id, billId],
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });

        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO items (name, quantity, price, discount, belongsTo, billId) VALUES (?, ?, ?, ?, ?, ?)`,
            [originalItem.name, quantity, originalItem.price, subtotalDiscount, name, billId],
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
      }
    }
  }

  return h.response({ message: 'Split bill successful' }).code(200);
};

const finishBill = async (request, h) => {
  const { billId } = request.params;

  return new Promise((resolve, reject) => {
    db.run(`UPDATE bills SET status = 'done' WHERE id = ?`, [billId], function (err) {
      if (err || this.changes === 0) {
        reject(h.response({ error: 'Bill not found or update failed' }).code(404));
      } else {
        resolve(h.response({ message: 'Bill finished' }).code(200));
      }
    });
  });
};

const updateBillInfo = async (request, h) => {
  const { billId } = request.params;
  const { storeName, purchaseDate } = request.payload;

  const fields = [];
  const values = [];

  if (storeName) {
    fields.push('storeName = ?');
    values.push(storeName);
  }
  if (purchaseDate) {
    fields.push('purchaseDate = ?');
    values.push(purchaseDate);
  }

  if (fields.length === 0) return h.response({ error: 'No data sent to be changed.' }).code(400);

  const query = `UPDATE bills SET ${fields.join(', ')} WHERE billId = ?`;
  values.push(billId);

  return new Promise((resolve, reject) => {
    db.run(query, values, (err) => {
      if (err) return reject(h.response({ error: 'Failed to update bill' }).code(500));
      else if (this.changes === 0) return reject(h.response({ error: 'Bill not found' }).code(404));
      else resolve(h.response({ message: `Bill ${billId} updated successfully` }).code(200));
    });
  });
};

module.exports = { startBill, splitBill, finishBill, updateBillInfo };
