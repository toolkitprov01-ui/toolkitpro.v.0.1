const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10
    })
  : null;

async function query(text, params) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool.query(text, params);
}

async function healthCheck() {
  if (!pool) return { configured: false };
  await pool.query("SELECT 1");
  return { configured: true, connected: true };
}

module.exports = { pool, query, healthCheck };