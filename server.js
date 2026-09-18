const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { getAllTools, getToolById, REGISTRY_VERSION } = require("./config/tool-registry");

const APP_VERSION = "2.0.0";
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir, { etag: true, maxAge: 0 }));

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    success: true,
    service: "Toolkit Pro",
    status: "ok",
    version: APP_VERSION,
    registryVersion: REGISTRY_VERSION,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/tools", (req, res) => {
  res.set("Cache-Control", "no-store");
  const tools = getAllTools();
  res.json({ success: true, count: tools.length, tools });
});

app.get("/api/tools/:id", (req, res) => {
  res.set("Cache-Control", "no-store");
  const tool = getToolById(req.params.id);
  if (!tool) return res.status(404).json({ success: false, error: "Tool not found" });
  res.json({ success: true, tool });
});

app.get("/tools", (req, res) => res.sendFile(path.join(publicDir, "tools.html")));
app.get("/{*splat}", (req, res) => res.status(404).sendFile(path.join(publicDir, "404.html")));

app.listen(PORT, () => console.log(`Toolkit Pro v${APP_VERSION} running on port ${PORT}`));
