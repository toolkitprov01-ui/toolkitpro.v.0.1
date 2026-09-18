const fs = require("node:fs");
const path = require("node:path");
const { getAllTools } = require("../config/tool-registry");

const modulesDir = path.join(__dirname, "..", "public", "js", "tool-modules");
const tools = getAllTools();
const errors = [];

for (const tool of tools) {
  const file = path.join(modulesDir, tool.module + ".js");
  if (!fs.existsSync(file)) {
    errors.push(tool.id + ": missing module " + tool.module + ".js");
    continue;
  }

  const source = fs.readFileSync(file, "utf8");
  if (!/export\s+(?:async\s+)?function\s+render\s*\(/.test(source)) {
    errors.push(tool.id + ": missing required render() export");
  }
  if (!/export\s+(?:async\s+)?function\s+mount\s*\(/.test(source)) {
    errors.push(tool.id + ": missing required mount() export");
  }
  if (!/MODULE_VERSION/.test(source)) {
    errors.push(tool.id + ": missing MODULE_VERSION");
  }
}

if (errors.length) {
  console.error("Tool module contract failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log("Tool module contract passed:", tools.length, "modules");
