const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const { getAllTools, getToolById, REGISTRY_VERSION } = require("./config/tool-registry");
const { listTools, getTool, getDatabaseInfo } = require("./lib/tool-registry-db");
const { enqueue, getJob, getQueueInfo, getQueueHealth } = require("./lib/job-queue");
const { PDF_JOB_TYPES, PDF_WORKER_JOB_TYPES } = require("./lib/job-contract");
const { getArtifactStoreInfo, createJobKey, createUploadUrl, createDownloadUrl, getArtifactMetadata, deleteArtifact } = require("./lib/artifact-store");
const { randomUUID, randomBytes, createHash, timingSafeEqual } = require("crypto");

const APP_VERSION = "2.2.2";
const SITE_URL = "https://toolkitpro-v-0-1.onrender.com";
const CACHE_TTL_MS = 60_000;
const JOB_TOKEN_BYTES = Math.max(Number(process.env.PDF_JOB_TOKEN_BYTES) || 32, 16);

function issueJobToken() {
  return randomBytes(JOB_TOKEN_BYTES).toString("base64url");
}
function hashJobToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
function getBearerToken(req) {
  const value = String(req.get("authorization") || "");
  return /^Bearer\s+\S+$/i.test(value) ? value.replace(/^Bearer\s+/i, "") : "";
}
function tokenMatches(job, token) {
  if (!job?.ownerTokenHash || !token) return false;
  const expected = Buffer.from(String(job.ownerTokenHash), "hex");
  const actual = Buffer.from(hashJobToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function requireJobToken(req, res, job) {
  if (!tokenMatches(job, getBearerToken(req))) {
    res.status(403).json({success:false,error:"Invalid job token"});
    return false;
  }
  return true;
}

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
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
const rateBuckets = new Map();
const RATE_WINDOW_MS = Math.max(Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000, 10_000);
const PDF_PREPARE_LIMIT = Math.max(Number(process.env.PDF_PREPARE_RATE_LIMIT) || 10, 1);
const PDF_COMPLETE_LIMIT = Math.max(Number(process.env.PDF_COMPLETE_RATE_LIMIT) || 30, 1);
const PDF_DOWNLOAD_LIMIT = Math.max(Number(process.env.PDF_DOWNLOAD_RATE_LIMIT) || 60, 1);
const PDF_CLEANUP_LIMIT = Math.max(Number(process.env.PDF_CLEANUP_RATE_LIMIT) || 20, 1);

function rateLimit(limit, bucket) {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = bucket + ":" + ip;
    let entry = rateBuckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
      rateBuckets.set(key, entry);
    }
    entry.count += 1;
    const remaining = Math.max(limit - entry.count, 0);
    res.set("X-RateLimit-Limit", String(limit));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > limit) {
      res.set("Retry-After", String(Math.max(Math.ceil((entry.resetAt - now) / 1000), 1)));
      return res.status(429).json({success:false,error:"Rate limit exceeded"});
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateBuckets) if (entry.resetAt <= now) rateBuckets.delete(key);
}, RATE_WINDOW_MS).unref();



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
  res.status(degraded ? 503 : 200).json({success:true,service:"Toolkit Pro",status:degraded ? "degraded" : "ok",version:APP_VERSION,registryVersion:REGISTRY_VERSION,cache:{type:"memory",entries:cache.size,ttlMs:CACHE_TTL_MS},database:{...database,status:databaseStatus,connectivity:databaseConnectivity},queue:{...queue,status:queueStatus,connectivity:redisConnectivity},artifactStore,timestamp:new Date().toISOString()});
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
app.post("/api/pdf/jobs/prepare", rateLimit(PDF_PREPARE_LIMIT, "pdf-prepare"), async (req,res) => {
  try {
    const store = getArtifactStoreInfo();
    if (!store.configured || store.mode !== "s3") return res.status(503).json({success:false,error:"Object storage is not configured"});
    const jobId = randomUUID();
    const jobToken = issueJobToken();
    const filename = String(req.body?.filename || "input.pdf");
    const contentType = String(req.body?.contentType || "application/pdf");
    const key = createJobKey(jobId, filename);
    const uploadUrl = await createUploadUrl(key, contentType);
    res.status(201).json({success:true,job:{id:jobId,status:"created",token:jobToken},artifact:{key,uploadUrl,expiresInSeconds:store.signedUrlTtlSeconds,contentType}});
  } catch (error) {
    console.error("PDF upload preparation failed:", error.message);
    res.status(503).json({success:false,error:"Object storage unavailable"});
  }
});

app.post("/api/pdf/jobs/:id/complete", rateLimit(PDF_COMPLETE_LIMIT, "pdf-complete"), async (req,res) => {
  try {
    const jobId = String(req.params.id || "");
    const type = String(req.body?.type || "").trim();
    const jobToken = getBearerToken(req);
    if (!jobToken) return res.status(401).json({success:false,error:"Job token required"});
    if (!PDF_WORKER_JOB_TYPES.has(type)) return res.status(400).json({success:false,error:"PDF operation is not currently available"});
    const key = String(req.body?.inputKey || "");
    if (!key.startsWith("uploads/" + jobId + "/") || key.includes("..")) return res.status(400).json({success:false,error:"Invalid input artifact"});
    const existing = await getJob(jobId);
    if (existing) return res.status(409).json({success:false,error:"Job already exists"});
    const metadata = await getArtifactMetadata(key);
    if (!Number.isFinite(metadata.size) || metadata.size <= 0) return res.status(400).json({success:false,error:"Uploaded artifact is empty"});
    if (metadata.size > 25 * 1024 * 1024) return res.status(413).json({success:false,error:"PDF exceeds 25 MB"});
    const outputKey = "outputs/" + jobId + "/result.pdf";
    const payload = {input:[{key,size:metadata.size}],output:{key:outputKey,size:0},options:req.body?.options && typeof req.body.options === "object" && !Array.isArray(req.body.options) ? req.body.options : {}};
    const job = await enqueue(type, payload, {id:jobId, ownerTokenHash:hashJobToken(jobToken)});
    res.status(202).json({success:true,job:{id:job.id,type:job.type,status:job.status,createdAt:job.createdAt},output:{key:outputKey}});
  } catch (error) {
    console.error("PDF job enqueue failed:", error.message);
    const status = /Invalid|Unsupported|required|range|exceeds|scoped|artifact/i.test(error.message) ? 400 : 503;
    res.status(status).json({success:false,error:status === 400 ? error.message : "Job queue or object storage unavailable"});
  }
});

app.delete("/api/pdf/jobs/:id/artifacts", rateLimit(PDF_CLEANUP_LIMIT, "pdf-cleanup"), async (req,res) => {
  try {
    const jobId = String(req.params.id || "");
    if (!/^[a-f0-9-]{20,64}$/i.test(jobId)) return res.status(400).json({success:false,error:"Invalid job id"});
    const job = await getJob(jobId);
    if (!job || !PDF_JOB_TYPES.has(job.type)) return res.status(404).json({success:false,error:"PDF job not found"});
    if (!requireJobToken(req,res,job)) return;
    if (!["completed","failed"].includes(job.status)) return res.status(409).json({success:false,error:"Artifacts can only be cleaned after job completion or failure"});

    const keys = [
      ...(Array.isArray(job.payload?.input) ? job.payload.input.map(item => item?.key).filter(Boolean) : []),
      job.payload?.output?.key
    ].filter(Boolean);
    const uniqueKeys = [...new Set(keys)];

    for (const key of uniqueKeys) {
      if (!key.startsWith("uploads/" + jobId + "/") && key !== "outputs/" + jobId + "/result.pdf") {
        return res.status(400).json({success:false,error:"Job contains an invalid artifact key"});
      }
    }

    let deleted = 0;
    for (const key of uniqueKeys) {
      try {
        await deleteArtifact(key);
        deleted += 1;
      } catch (error) {
        if (!/ENOENT|NotFound|NoSuchKey|404/i.test(error.message)) throw error;
      }
    }
    res.json({success:true,jobId,deletedArtifacts:deleted});
  } catch (error) {
    console.error("PDF artifact cleanup failed:", error.message);
    res.status(503).json({success:false,error:"Object storage unavailable"});
  }
});

app.get("/api/pdf/artifacts/download", rateLimit(PDF_DOWNLOAD_LIMIT, "pdf-download"), async (req,res) => {
  try {
    const jobId = String(req.query.jobId || "");
    const key = String(req.query.key || "");
    const expected = "outputs/" + jobId + "/result.pdf";
    if (!/^[a-f0-9-]{20,64}$/i.test(jobId) || key !== expected) return res.status(400).json({success:false,error:"Invalid output artifact"});
    const job = await getJob(jobId);
    if (!job || !PDF_JOB_TYPES.has(job.type) || job.status !== "completed" || job.payload?.output?.key !== key) return res.status(404).json({success:false,error:"Output artifact not available"});
    if (!requireJobToken(req,res,job)) return;
    const url = await createDownloadUrl(key);
    if (!url) return res.status(503).json({success:false,error:"Object storage unavailable"});
    res.json({success:true,url,expiresInSeconds:getArtifactStoreInfo().signedUrlTtlSeconds});
  } catch (error) {
    console.error("PDF download URL failed:", error.message);
    res.status(503).json({success:false,error:"Object storage unavailable"});
  }
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
  if (PDF_JOB_TYPES.has(job.type) && !requireJobToken(req,res,job)) return;
  const safeJob = {...job};
  delete safeJob.ownerTokenHash;
  res.set("Cache-Control","no-store").json({success:true,job:safeJob});
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
