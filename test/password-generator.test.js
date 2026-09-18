const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "tool-modules", "password-generator.js"),
  "utf8"
);

(async()=>{
  const mod=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
  assert.equal(mod.MODULE_VERSION,"2026.09.19.4");
  const html=mod.render();
  assert.match(html,/pwRange/);
  assert.match(html,/pwUpper/);
  assert.match(html,/pwStrength/);
  assert.match(html,/Web Crypto API/);
  console.log("Password Generator module smoke tests passed");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
