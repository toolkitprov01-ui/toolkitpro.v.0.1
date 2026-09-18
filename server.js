const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const { getAllTools, getToolById, REGISTRY_VERSION } = require("./config/tool-registry");
const { listTools, getTool, getDatabaseInfo } = require("./lib/tool-registry-db");
const { enqueue, getJob, getQueueInfo } = require("./lib/job-queue");

const APP_VERSION = "2.2.0";
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
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
    urls.map(url => "  <url><loc>" + SITE_URL + url + "</loc></url>").join("\\n") + "\\n</urlset>\\n";
  cacheSet("sitemap", xml, 3_600_000);
  res.type("application/xml").set("Cache-Control","public, max-age=3600").send(xml);
});
