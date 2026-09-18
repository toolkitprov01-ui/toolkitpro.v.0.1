const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "";
const TABLE_NAME = process.env.TOOL_REGISTRY_TABLE || "tool_registry";

let pool = null;

function getDatabaseInfo() {
  return { type: DATABASE_URL ? "postgres" : "config", configured: Boolean(DATABASE_URL), table: TABLE_NAME };
}

function getClient() {
  if (!DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
    pool.on("error", error => console.error("Registry database error", error.message));
  }
  return pool;
}

async function ensureSchema() {
  const db = getClient();
  if (!db) return false;
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      data JSONB NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS tool_registry_status_idx ON ${TABLE_NAME} (status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS tool_registry_category_idx ON ${TABLE_NAME} ((data->>'category'))`);
  return true;
}

async function listTools() {
  const db = getClient();
  if (!db) return null;
  await ensureSchema();
  const { rows } = await db.query(`SELECT data FROM ${TABLE_NAME} WHERE status = 'active' ORDER BY id`);
  return rows.map(row => row.data);
}

async function getTool(id) {
  const db = getClient();
  if (!db) return null;
  await ensureSchema();
  const { rows } = await db.query(`SELECT data FROM ${TABLE_NAME} WHERE id = $1 AND status = 'active' LIMIT 1`, [id]);
  return rows[0]?.data || null;
}

async function upsertTools(tools) {
  const db = getClient();
  if (!db) throw new Error("DATABASE_URL is not configured");
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const tool of tools) {
      await client.query(
        `INSERT INTO ${TABLE_NAME} (id, slug, data, version, status, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, data=EXCLUDED.data, version=EXCLUDED.version, status=EXCLUDED.status, updated_at=NOW()`,
        [tool.id, tool.slug || tool.id, JSON.stringify(tool), tool.version || "1.0.0", tool.status || "active"]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getClient, ensureSchema, listTools, getTool, upsertTools, getDatabaseInfo, TABLE_NAME };
