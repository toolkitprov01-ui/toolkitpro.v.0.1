const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const { getAllTools, getToolById, REGISTRY_VERSION } = require("./config/tool-registry");
const { listTools, getTool, getDatabaseInfo } = require("./lib/tool-registry-db");
const { enqueue, getJob, getQueueInfo, getQueueHealth } = require("./lib/job-queue");

const APP_VERSION = "2.2.2";
const SITE_URL = "https://toolkitpro-v-0-1.onrender.com";
const CACHE_TTL_MS = 60_000;

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");
const toolPageTemplate = fs.readFileSync(path.join(publicDir, "tool.html"), "utf8");

const cache = new Map();
function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) { cache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value, ttl = CACHE_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
}
function sendCachedJson(res, key, value, ttl) {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(cacheGet(key) ?? cacheSet(key, value, ttl));
}
const escHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const escJson = value => JSON.stringify(value).replace(/</g, String.fromCharCode(92) + "u003c");

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));

async function registryTools() {
  if (getDatabaseInfo().configured) {
    try { const tools = await listTools(); if (Array.isArray(tools) && tools.length) return tools; }
    catch (error) { console.error("Registry database read failed:", error.message); }
  }
  return getAllTools();
}

async function registryTool(id) {
  if (getDatabaseInfo().configured) {
    try { const tool = await getTool(id); if (tool) return tool; }
    catch (error) { console.error("Registry database lookup failed:", error.message); }
  }
  return getToolById(id);
}

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const key = "search:" + JSON.stringify({ q, category, limit, offset });
  const cached = cacheGet(key);
  if (cached) return sendCachedJson(res, key, cached);
  const tools = await registryTools();
  const tokens = q.split(/\s+/).filter(Boolean);
  const results = tools.map(tool => {
    if (category && tool.category.toLowerCase() !== category) return null;
    const haystack = [tool.id, tool.name, tool.bn, tool.description, tool.category, tool.categoryBn, ...tool.tags, ...tool.synonyms].join(" ").toLowerCase();
    if (tokens.length && !tokens.every(token => haystack.includes(token))) return null;
    let score = 0;
    const exact = [tool.id, tool.slug, tool.name, tool.bn].map(v => String(v).toLowerCase());
    tokens.forEach(token => {
      if (exact.some(v => v === token)) score += 100;
      if (tool.name.toLowerCase().includes(token)) score += 30;
      if (tool.bn.toLowerCase().includes(token)) score += 30;
      if (tool.tags.some(v => String(v).toLowerCase().includes(token))) score += 15;
      if (tool.description.toLowerCase().includes(token)) score += 5;
    });
    return { tool, score };
  }).filter(Boolean).sort((a,b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).map(x => x.tool);
  return sendCachedJson(res, key, { success:true, count:results.length, offset, limit, results:results.slice(offset, offset+limit) }, 60_000);
});

app.get("/sitemap.xml", async (req,res) => {
  const cached = cacheGet("sitemap");
  if (cached) return res.type("application/xml").set("Cache-Control","public, max-age=3600").send(cached);
  const staticUrls = ["/","/tools.html","/privacy.html","/terms.html","/disclaimer.html"];
  const toolUrls = (await registryTools()).map(tool => "/tool/" + encodeURIComponent(tool.id));
  const urls = [...staticUrls, ...toolUrls];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(url => "  <url><loc>" + SITE_URL + url + "</loc></url>").join("\n") + "\n</urlset>\n";
  cacheSet("sitemap", xml, 3_600_000);
  res.type("application/xml").set("Cache-Control","public, max-age=3600").send(xml);
});

app.use(express.static(publicDir, { etag:true, maxAge:0 }));

app.get("/api/health", async (req,res) => {
  res.set("Cache-Control","no-store");
  let database = getDatabaseInfo();
  let queue = getQueueInfo();
  let databaseConnectivity = "not_configured";
  if (database.configured) {
    try { await require("./lib/tool-registry-db").getClient().query("SELECT 1"); databaseConnectivity = "ok"; }
    catch (error) { databaseConnectivity = "error"; }
  }
  const queueHealth = await getQueueHealth();
  const redisConnectivity = queueHealth.connectivity;
  let databaseStatus = database.configured ? (databaseConnectivity === "ok" ? "configured" : "error") : "fallback";
  let queueStatus = queue.configured ? (redisConnectivity === "ok" ? "configured" : "error") : "fallback";
  const degraded = databaseStatus === "error" || queueStatus === "error";
  res.status(degraded ? 503 : 200).json({success:true,service:"Toolkit Pro",status:degraded ? "degraded" : "ok",version:APP_VERSION,registryVersion:REGISTRY_VERSION,cache:{type:"memory",entries:cache.size,ttlMs:CACHE_TTL_MS},database:{...database,status:databaseStatus,connectivity:databaseConnectivity},queue:{...queue,status:queueStatus,connectivity:redisConnectivity},timestamp:new Date().toISOString()});
});
app.get("/api/tools",async (req,res) => {
  const cached=cacheGet("tools");
  const tools=cached||cacheSet("tools",await registryTools(),300_000);
  res.set("Cache-Control","public, max-age=60, stale-while-revalidate=300");
  res.json({success:true,count:tools.length,tools});
});
app.get("/api/tools/:id",async (req,res) => {
  const key="tool:"+req.params.id;
  const cached=cacheGet(key);
  const tool=cached||cacheSet(key,await registryTool(req.params.id),300_000);
  res.set("Cache-Control","public, max-age=60, stale-while-revalidate=300");
  if(!tool) return res.status(404).json({success:false,error:"Tool not found"});
  res.json({success:true,tool});
});
app.post("/api/jobs",async (req,res) => {
  const type=String(req.body?.type||"").trim();
  const payload=req.body?.payload && typeof req.body.payload==="object" ? req.body.payload : {};
  if(type!=="example") return res.status(400).json({success:false,error:"Unsupported job type"});
  try {
    const job=await enqueue(type,payload);
    res.status(202).json({success:true,job:{id:job.id,type:job.type,status:job.status,createdAt:job.createdAt}});
  } catch(error) {
    res.status(503).json({success:false,error:"Job queue unavailable"});
  }
});
app.get("/api/jobs/:id",async (req,res) => {
  const job=await getJob(req.params.id);
  if(!job) return res.status(404).json({success:false,error:"Job not found"});
  res.set("Cache-Control","no-store").json({success:true,job});
});

app.get("/tools",(req,res)=>res.sendFile(path.join(publicDir,"tools.html")));
app.get("/tool/:id",async (req,res)=>{
  const tool=await registryTool(req.params.id);
  if(!tool) return res.status(404).sendFile(path.join(publicDir,"404.html"));
  const key="tool-page:"+tool.id;
  const cached=cacheGet(key);
  if(cached) return res.set("Cache-Control","public, max-age=300").send(cached);
  const url=SITE_URL+"/tool/"+encodeURIComponent(tool.id);
  const jsonLd={"@context":"https://schema.org","@type":"WebApplication",name:tool.name,alternateName:tool.bn,url,description:tool.description,applicationCategory:"UtilitiesApplication",operatingSystem:"Web",inLanguage:"bn-BD",offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},isAccessibleForFree:true};
  const page=toolPageTemplate
    .replaceAll("__TOOL_TITLE__",escHtml(tool.bn||tool.name))
    .replaceAll("__TOOL_DESCRIPTION__",escHtml(tool.description))
    .replaceAll("__TOOL_URL__",escHtml(url))
    .replace("__TOOL_JSONLD__",escJson(jsonLd))
    .replace("__TOOL_ID__",escJson(tool.id));
  cacheSet(key,page,300_000);
  res.set("Cache-Control","public, max-age=300").send(page);
});

app.get("/{*splat}",(req,res)=>res.status(404).sendFile(path.join(publicDir,"404.html")));

const server = app.listen(PORT,()=>console.log("Toolkit Pro v"+APP_VERSION+" running on port "+PORT));
function shutdown(signal) {
  console.log(signal+" received, shutting down gracefully");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 25_000).unref();
}
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
