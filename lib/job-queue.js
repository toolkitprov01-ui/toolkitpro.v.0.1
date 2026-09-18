const { randomUUID } = require("crypto");
const { createClient } = require("redis");

const QUEUE_KEY = process.env.QUEUE_REDIS_KEY || "toolkitpro:jobs";
const JOB_PREFIX = process.env.QUEUE_JOB_PREFIX || "toolkitpro:job:";
const REDIS_URL = process.env.REDIS_URL || process.env.QUEUE_REDIS_URL || "";
const handlers = new Map();
const memoryJobs = new Map();
const memoryQueue = [];
let redisClient = null;
let redisPromise = null;

async function getRedis() {
  if (!REDIS_URL) return null;
  if (redisClient?.isReady) return redisClient;
  if (!redisPromise) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on("error", error => console.error("Redis queue error", error.message));
    redisPromise = redisClient.connect().then(() => redisClient).catch(error => {
      redisPromise = null;
      redisClient = null;
      throw error;
    });
  }
  return redisPromise;
}

function registerHandler(type, handler) {
  if (!type || typeof handler !== "function") throw new Error("Invalid job handler");
  handlers.set(type, handler);
}

async function enqueue(type, payload = {}) {
  if (!type) throw new Error("Invalid job type");
  const id = randomUUID();
  const now = new Date().toISOString();
  const job = { id, type, payload, status:"queued", createdAt:now, updatedAt:now, attempts:0 };
  const redis = await getRedis();
  if (redis) {
    await redis.set(JOB_PREFIX + id, JSON.stringify(job));
    await redis.rPush(QUEUE_KEY, id);
  } else {
    memoryJobs.set(id, job);
    memoryQueue.push(id);
  }
  return job;
}

async function getJob(id) {
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get(JOB_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryJobs.get(id) || null;
}

async function processNext() {
  const redis = await getRedis();
  let job;
  if (redis) {
    const id = await redis.lPop(QUEUE_KEY);
    if (!id) return null;
    const raw = await redis.get(JOB_PREFIX + id);
    if (!raw) return null;
    job = JSON.parse(raw);
  } else {
    const id = memoryQueue.shift();
    if (!id) return null;
    job = memoryJobs.get(id);
    if (!job) return null;
  }

  const handler = handlers.get(job.type);
  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.updatedAt = job.startedAt;
  job.attempts = (job.attempts || 0) + 1;

  try {
    if (!handler) throw new Error("No worker registered for job type: " + job.type);
    job.result = await handler(job.payload);
    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
  }

  job.finishedAt = new Date().toISOString();
  job.updatedAt = job.finishedAt;

  if (redis) await redis.set(JOB_PREFIX + job.id, JSON.stringify(job));
  else memoryJobs.set(job.id, job);
  return job;
}

function startWorker(intervalMs = 250) {
  return setInterval(() => processNext().catch(error => console.error("Worker error", error.message)), intervalMs);
}

function getQueueInfo() {
  return {
    type: REDIS_URL ? "redis" : "memory",
    configured: Boolean(REDIS_URL),
    enabled: true,
    key: QUEUE_KEY
  };
}

module.exports = { registerHandler, enqueue, getJob, processNext, startWorker, getQueueInfo };
