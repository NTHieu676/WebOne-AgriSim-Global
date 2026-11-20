const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const databasePath = process.env.SQLITE_DATABASE_PATH || path.join(__dirname, "..", "data", "agrisim.sqlite");
const schemaPath = path.join(__dirname, "schema.sql");
const seedPath = path.join(__dirname, "seed.sql");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
try {
    db.exec(fs.readFileSync(schemaPath, "utf8"));
    db.exec(fs.readFileSync(seedPath, "utf8"));
    console.log(`SQLite initialized: ${databasePath}`);
} finally {
    db.close();
}
