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

// 🔥 SQLite migration: job_candidates
sqlite.run(`
  CREATE TABLE IF NOT EXISTS job_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    stage TEXT CHECK(stage IN ('shared','interviewed','hired','rejected')) DEFAULT 'shared',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id)
  )
`, (err) => {
  if (err) console.error("SQLite migration error", err);
  else console.log("✅ job_candidates table ready (SQLite)");
});


/* ================= POSTGRES ================= */
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");

  pg = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pg.query("SELECT 1")
  .then(async () => {
    isPostgres = true;
    console.log("PostgreSQL connected & ready");

    // 🔥 Postgres migration: job_candidates
    await pg.query(`
      CREATE TABLE IF NOT EXISTS job_candidates (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        stage TEXT CHECK(stage IN ('shared','interviewed','hired','rejected')) DEFAULT 'shared',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, candidate_id)
      )
    `);

    console.log("✅ job_candidates table ready (Postgres)");
  })
  .catch((err) => {
    console.error("PostgreSQL connection failed", err);
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
