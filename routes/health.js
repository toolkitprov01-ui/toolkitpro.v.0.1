const express = require("express");
const { healthCheck: databaseHealth } = require("../database");
const { healthCheck: redisHealth } = require("../redis");

const router = express.Router();

router.get("/", async (req, res) => {
  const result = {
    success: true,
    service: "Toolkit Pro",
    status: "ok",
    timestamp: new Date().toISOString(),
    database: { configured: false },
    redis: { configured: false }
  };

  try { result.database = await databaseHealth(); }
  catch (error) { result.database = { configured: true, connected: false, error: error.message }; }
  try { result.redis = await redisHealth(); }
  catch (error) { result.redis = { configured: true, connected: false, error: error.message }; }

  res.json(result);
});

module.exports = router;