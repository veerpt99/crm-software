const sqlite3 = require("sqlite3").verbose();
const path = require("path");

let sqlite = null;
let pg = null;
let isPostgres = false;

/* ================= SQLITE ================= */
const sqlitePath = path.join(__dirname, "crm.db");
sqlite = new sqlite3.Database(sqlitePath, (err) => {
  if (err) console.error("SQLite error", err);
  else console.log("SQLite Connected");
});

/* ================= POSTGRES ================= */
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");

  pg = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pg.query("SELECT 1")
    .then(() => {
      isPostgres = true;
      console.log("PostgreSQL connected & ready");
    })
    .catch((err) => {
      console.error("PostgreSQL connection failed", err);
    });
}

module.exports = {
  sqlite,
  pg,
  isPostgres,
};

// PostgreSQL is primary in production.
// SQLite kept temporarily for safety & local fallback.
