const { createClient } = require("redis");

const DATABASE_URL = process.env.DATABASE_URL || "";
const TABLE_NAME = process.env.TOOL_REGISTRY_TABLE || "tool_registry";

let client = null;
let connectPromise = null;

function getDatabaseInfo() {
  return { type: DATABASE_URL ? "postgres" : "config", configured: Boolean(DATABASE_URL), table: TABLE_NAME };
}

async function getClient() {
  if (!DATABASE_URL) return null;
  if (client) return client;
  if (!connectPromise) {
    client = createClient({ url: DATABASE_URL });
    client.on("error", error => console.error("Registry database error", error.message));
    connectPromise = client.connect().then(() => client).catch(error => {
      client = null;
      connectPromise = null;
      throw error;
    });
  }
  return connectPromise;
}

async function ensureSchema() {
  const db = await getClient();
  if (!db) return false;
  await db.query(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      data JSONB NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
  return true;
}

module.exports = { getClient, ensureSchema, getDatabaseInfo, TABLE_NAME };
