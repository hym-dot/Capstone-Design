const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blacklist.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the blacklist database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  )`);
});

module.exports = db;