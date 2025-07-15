const { v4: uuidv4 } = require('uuid');
const { db } = require('../services/db');

const startBill = async (_request, h) => {
  const billId = uuidv4();
  const createdAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO bills (id, createdAt) VALUES (?, ?)`, [billId, createdAt], (err) => {
      if (err) reject(h.response({ error: 'Failed to start bill' }).code(500));
      else resolve(h.response({ billId }).code(201));
    });
  });
};

const finishBill = async (request, h) => {
  const { billId } = request.payload;

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

const getItemsByBill = async (request, h) => {
  const billId = request.params.id;

  return new Promise((resolve) => {
    db.all(`SELECT * FROM items WHERE billId = ?`, [billId], (err, rows) => {
      if (err) resolve(h.response({ error: 'Failed to get items' }).code(500));
      else resolve(h.response({ items: rows }).code(200));
    });
  });
};

module.exports = { startBill, finishBill, getItemsByBill };
