const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pg.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pg.on("error", (err) => {
  console.error("❌ PostgreSQL error", err);
  process.exit(1);
});

module.exports = { pg };
