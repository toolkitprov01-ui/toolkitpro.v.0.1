const express = require("express");
const { getAllTools, getToolById } = require("../config/tool-registry");
const { query } = require("../database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const result = await query('SELECT id, name, category, description, client_side AS "clientSide" FROM tools WHERE enabled = TRUE ORDER BY category, name');
      return res.json({ success: true, count: result.rows.length, tools: result.rows });
    }
    return res.json({ success: true, count: getAllTools().length, tools: getAllTools() });
  } catch (error) {
    res.status(503).json({ success: false, error: "Tool registry unavailable" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const result = await query('SELECT id, name, category, description, client_side AS "clientSide" FROM tools WHERE id = $1 AND enabled = TRUE', [req.params.id]);
      if (result.rows[0]) return res.json({ success: true, tool: result.rows[0] });
    }
    const tool = getToolById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, error: "Tool not found" });
    res.json({ success: true, tool });
  } catch (error) {
    res.status(503).json({ success: false, error: "Tool registry unavailable" });
  }
});

module.exports = router;