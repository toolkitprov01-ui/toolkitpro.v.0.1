const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { getAllTools, getToolById } = require("./config/tool-registry");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { etag: true }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "Toolkit Pro", status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

app.get("/api/tools", (req, res) => {
  const tools = getAllTools();
  res.json({ success: true, count: tools.length, tools });
});

app.get("/api/tools/:id", (req, res) => {
  const tool = getToolById(req.params.id);
  if (!tool) return res.status(404).json({ success: false, error: "Tool not found" });
  res.json({ success: true, tool });
});

app.get("/tools", (req, res) => res.sendFile(path.join(__dirname, "public", "tools.html")));
app.get("/{*splat}", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Toolkit Pro v2 running on port ${PORT}`));
