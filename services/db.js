const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data.db');

async function initDB() {
  db.serialize(() => {
    db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                quantity REAL,
                price REAL,
                discount REAL,
                belongsTo TEXT,
                billId TEXT
            )
        `);

    db.run(`
            CREATE TABLE IF NOT EXISTS bills (
                id TEXT PRIMARY KEY,
                storeName TEXT NOT NULL,
                purchaseDate TEXT NOT NULL,
                status TEXT DEFAULT 'in_progress',
                createdAt TEXT
            ) 
        `);
  });
}

module.exports = { db, initDB };
