const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 🔥 Force connection test on startup
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL connected & ready");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
