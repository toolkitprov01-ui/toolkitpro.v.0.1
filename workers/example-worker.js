const { registerHandler, startWorker } = require("../lib/job-queue");

registerHandler("example", async payload => ({
  message: "Worker pipeline is ready",
  received: payload
}));

const interval = Number(process.env.WORKER_INTERVAL_MS) || 250;
startWorker(interval);
console.log("Toolkit Pro worker started", { interval, queue: process.env.REDIS_URL ? "redis" : "memory" });
