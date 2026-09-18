require("dotenv").config();
const { query, pool } = require("../database");
const { getAllTools } = require("../config/tool-registry");

async function seed() {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  await query(`
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      client_side BOOLEAN NOT NULL DEFAULT TRUE,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (const tool of getAllTools()) {
    await query(`
      INSERT INTO tools (id, name, category, client_side, enabled)
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        client_side = EXCLUDED.client_side,
        enabled = TRUE,
        updated_at = NOW()
    `, [tool.id, tool.name, tool.category, tool.clientSide]);
  }
  console.log(`Seeded ${getAllTools().length} tools.`);
  await pool.end();
}
seed().catch(async error => { console.error(error.message); if (pool) await pool.end(); process.exit(1); });