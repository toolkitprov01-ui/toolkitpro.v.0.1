const { getAllTools, REGISTRY_VERSION } = require("../config/tool-registry");
const { upsertTools, ensureSchema, getDatabaseInfo } = require("../lib/tool-registry-db");

async function main() {
  const info = getDatabaseInfo();
  if (!info.configured) throw new Error("DATABASE_URL is not configured");
  await ensureSchema();
  const tools = getAllTools();
  await upsertTools(tools);
  console.log(`Seeded ${tools.length} tools into ${info.table} (registry ${REGISTRY_VERSION})`);
  process.exitCode = 0;
}

main().catch(error => {
  console.error("Registry seed failed:", error.message);
  process.exitCode = 1;
});
