const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "tool-modules", "json-formatter.js"),
  "utf8"
);

(async()=>{
  const mod=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
  assert.match(mod.render(), /jsonInput/);
  assert.match(mod.render(), /jsonCopy/);
  assert.equal(mod.MODULE_VERSION,"2026.09.19.3");
  console.log("JSON Formatter module smoke tests passed");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
