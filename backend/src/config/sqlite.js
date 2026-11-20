const path = require("path");
const Database = require("better-sqlite3");

const databasePath = process.env.SQLITE_DATABASE_PATH || path.join(__dirname, "..", "..", "data", "agrisim.sqlite");

function openReadOnlyDatabase() {
    return new Database(databasePath, { readonly: true, fileMustExist: true });
}

module.exports = {
    openReadOnlyDatabase
};
