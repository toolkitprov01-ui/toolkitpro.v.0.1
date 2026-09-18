const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." }
});

function applySecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(v => v.trim()) : true
  }));
  app.use(limiter);
}

module.exports = { applySecurity };