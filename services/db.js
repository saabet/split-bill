const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

async function initDB() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT,
                quantity INTEGER,
                price REAL,
                discount REAL,
                belongsTo REAL,
                billId TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS bills (
                id TEXT PRIMARY KEY,
                status TEXT DEFAULT 'in_progress',
                createdAt TEXT
            ) 
        `);
    });
}

module.exports = { db, initDB };