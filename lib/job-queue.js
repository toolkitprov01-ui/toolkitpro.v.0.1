const { randomUUID } = require("crypto");

const jobs = new Map();
const handlers = new Map();

function registerHandler(type, handler) {
  if (!type || typeof handler !== "function") throw new Error("Invalid job handler");
  handlers.set(type, handler);
}

function enqueue(type, payload = {}) {
  if (!handlers.has(type)) throw new Error("No worker registered for job type: " + type);
  const id = randomUUID();
  const now = new Date().toISOString();
  jobs.set(id, { id, type, payload, status: "queued", createdAt: now, updatedAt: now });
  return jobs.get(id);
}

function getJob(id) {
  return jobs.get(id) || null;
}

async function processNext() {
  const job = [...jobs.values()].find(item => item.status === "queued");
  if (!job) return null;

  const handler = handlers.get(job.type);
  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.updatedAt = job.startedAt;

  try {
    job.result = await handler(job.payload);
    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
  }

  job.finishedAt = new Date().toISOString();
  job.updatedAt = job.finishedAt;
  return job;
}

function startWorker(intervalMs = 250) {
  return setInterval(() => {
    processNext().catch(() => {});
  }, intervalMs);
}

module.exports = { registerHandler, enqueue, getJob, processNext, startWorker };
