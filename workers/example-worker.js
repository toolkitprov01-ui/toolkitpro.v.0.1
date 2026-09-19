const { registerHandler, startWorker } = require("../lib/job-queue");

if (process.env.REQUIRE_REDIS_WORKER === "true" && !process.env.REDIS_URL && !process.env.QUEUE_REDIS_URL) {
  console.error("Worker startup blocked: Redis is required for the production worker runtime");
  process.exit(1);
}

registerHandler("example", async payload => ({
  message: "Worker pipeline is ready",
  received: payload
}));

const interval = Number(process.env.WORKER_INTERVAL_MS) || 250;
startWorker(interval);
console.log("Toolkit Pro worker started", {
  interval,
  queue: process.env.REDIS_URL || process.env.QUEUE_REDIS_URL ? "redis" : "memory"
});
