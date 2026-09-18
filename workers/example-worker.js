const { registerHandler, startWorker } = require("../lib/job-queue");

registerHandler("example", async payload => ({
  message: "Worker pipeline is ready",
  received: payload
}));

startWorker(Number(process.env.WORKER_INTERVAL_MS) || 250);
console.log("Toolkit Pro worker started");
