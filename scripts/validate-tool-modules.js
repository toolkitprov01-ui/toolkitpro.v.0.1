const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const { getAllTools } = require("../config/tool-registry");

const modulesDir = path.join(__dirname, "..", "public", "js", "tool-modules");
const tools = getAllTools();
const errors = [];
const ids = new Set();
const slugs = new Set();

if (tools.length !== 150) errors.push("registry: expected exactly 150 tools, found " + tools.length);

for (const tool of tools) {
  if (ids.has(tool.id)) errors.push(tool.id + ": duplicate id");
  ids.add(tool.id);
  if (slugs.has(tool.slug)) errors.push(tool.id + ": duplicate slug " + tool.slug);
  slugs.add(tool.slug);

  if (!tool.module) errors.push(tool.id + ": missing module");
  if (!["browser","server","worker"].includes(tool.runtime)) errors.push(tool.id + ": invalid runtime " + tool.runtime);
  if (!["active","draft","disabled"].includes(tool.status)) errors.push(tool.id + ": invalid status " + tool.status);
  if (!Number.isFinite(tool.execution.timeoutMs) || tool.execution.timeoutMs <= 0) errors.push(tool.id + ": invalid execution timeout");
  if (!tool.seo?.title || !tool.seo?.description) errors.push(tool.id + ": incomplete SEO metadata");

  const file = path.join(modulesDir, tool.module + ".js");
  if (!fs.existsSync(file)) {
    errors.push(tool.id + ": missing module " + tool.module + ".js");
    continue;
  }

  try {
    cp.execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch {
    errors.push(tool.id + ": module syntax check failed (" + tool.module + ".js)");
  }

  const source = fs.readFileSync(file, "utf8");
  if (!/export\s+(?:async\s+)?function\s+render\s*\(/.test(source)) errors.push(tool.id + ": missing required render() export");
  if (!/export\s+(?:async\s+)?function\s+mount\s*\(/.test(source)) errors.push(tool.id + ": missing required mount() export");
  if (!/MODULE_VERSION/.test(source)) errors.push(tool.id + ": missing MODULE_VERSION");

  if (tool.module === "utility-tool" && tool.category !== "image") {
    const operationsBlock = source.match(/const operations=\{([\s\S]*?)\};\s*\n\s*export function render/);
    if (!operationsBlock) {
      errors.push(tool.id + ": utility operations block not found");
    } else {
      const supported = new Set([...operationsBlock[1].matchAll(/"([^"]+)":/g)].map(m => m[1]));
      for (const special of ["sha256-hash","text-hash","random-password"]) supported.add(special);
      if (!supported.has(tool.id)) errors.push(tool.id + ": utility operation not implemented");
    }
  }
}

if (errors.length) {
  console.error("Tool registry/module validation failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log("Tool registry/module validation passed:", tools.length, "tools");
