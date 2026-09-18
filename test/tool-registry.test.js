const assert = require("node:assert/strict");
const { getAllTools, getToolById } = require("../config/tool-registry");

const tools = getAllTools();

assert.ok(Array.isArray(tools), "Registry must return an array");
assert.ok(tools.length >= 27, "Registry should contain the current tool set");

const ids = tools.map(tool => tool.id);
assert.equal(new Set(ids).size, ids.length, "Tool IDs must be unique");

for (const tool of tools) {
  assert.ok(tool.id && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id), "Invalid tool id: " + tool.id);
  assert.ok(tool.name, "Missing name: " + tool.id);
  assert.ok(tool.bn, "Missing Bengali name: " + tool.id);
  assert.ok(tool.category, "Missing category: " + tool.id);
  assert.ok(tool.module, "Missing module: " + tool.id);
  assert.ok(tool.slug === tool.id, "Slug must match id: " + tool.id);
  assert.ok(Array.isArray(tool.tags), "Tags must be an array: " + tool.id);
  assert.ok(Array.isArray(tool.synonyms), "Synonyms must be an array: " + tool.id);
  assert.ok(["browser","server","worker"].includes(tool.runtime), "Invalid runtime: " + tool.id);
  assert.ok(tool.execution && Number.isFinite(tool.execution.timeoutMs), "Invalid execution config: " + tool.id);
  assert.ok(tool.seo && tool.seo.title && tool.seo.description, "Invalid SEO metadata: " + tool.id);
}

assert.ok(getToolById("word-counter"), "word-counter lookup must work");
assert.equal(getToolById("missing-tool"), null, "Unknown tool must return null");

console.log("Registry tests passed:", tools.length, "tools");
