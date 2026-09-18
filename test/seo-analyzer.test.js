const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname,"..","public","js","tool-modules","seo-analyzer.js"),"utf8");

(async()=>{
  const mod=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
  assert.equal(mod.MODULE_VERSION,"2026.09.19.5");
  const html=mod.render();
  for(const id of ["seoInput","seoAnalyze","seoResults","seoExample"]) assert.match(html,new RegExp(id));
  assert.match(source,/application\/ld\+json/);
  assert.match(source,/noindex/);
  assert.match(source,/canonicalOk/);
  assert.match(source,/heading hierarchy/i);
  console.log("SEO Analyzer module smoke tests passed");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
