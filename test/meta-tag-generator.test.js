const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","public","js","tool-modules","meta-tag-generator.js"),"utf8");
(async()=>{
 const mod=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
 assert.equal(mod.MODULE_VERSION,"2026.09.19.6");
 const html=mod.render();
 for(const id of ["mtT","mtD","mtU","mtI","mtR","mtG","mtCopy","mtO"])assert.match(html,new RegExp(id));
 assert.match(source,/validUrl/);
 assert.match(source,/og:image/);
 assert.match(source,/twitter:card/);
 console.log("Meta Tag Generator module smoke tests passed");
})().catch(e=>{console.error(e);process.exit(1)});
