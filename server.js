require("dotenv").config();

const express = require("express");
const path = require("path");
const { applySecurity } = require("./middleware/security");
const healthRouter = require("./routes/health");
const toolsRouter = require("./routes/tools");

const app = express();
const PORT = process.env.PORT || 3000;

applySecurity(app);
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/tools.html" || req.path.startsWith("/js/") || req.path.startsWith("/css/")) res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/health", healthRouter);
app.use("/api/tools", toolsRouter);

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Toolkit Pro server running on port ${PORT}`));