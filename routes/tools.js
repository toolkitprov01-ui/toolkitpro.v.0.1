const express = require("express");
const { getAllTools, getToolById } = require("../config/tool-registry");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, count: getAllTools().length, tools: getAllTools() });
});

router.get("/:id", (req, res) => {
  const tool = getToolById(req.params.id);
  if (!tool) return res.status(404).json({ success: false, error: "Tool not found" });
  res.json({ success: true, tool });
});

module.exports = router;