const { randomUUID } = require("crypto");
const { createClient } = require("redis");

const QUEUE_KEY = process.env.QUEUE_REDIS_KEY || "toolkitpro:jobs";
const PROCESSING_KEY = process.env.QUEUE_PROCESSING_KEY || "toolkitpro:processing";
const JOB_PREFIX = process.env.QUEUE_JOB_PREFIX || "toolkitpro:job:";
const REDIS_URL = process.env.REDIS_URL || process.env.QUEUE_REDIS_URL || "";
const MAX_ATTEMPTS = Math.max(Number(process.env.QUEUE_MAX_ATTEMPTS) || 3, 1);
const VISIBILITY_TIMEOUT_MS = Math.max(Number(process.env.QUEUE_VISIBILITY_TIMEOUT_MS) || 300_000, 30_000);
const RETRY_BASE_MS = Math.max(Number(process.env.QUEUE_RETRY_BASE_MS) || 1_000, 100);
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

async function saveJob(redis, job) {
  if (redis) await redis.set(JOB_PREFIX + job.id, JSON.stringify(job));
  else memoryJobs.set(job.id, job);
}

async function enqueue(type, payload = {}, options = {}) {
  if (!type) throw new Error("Invalid job type");
  const id = randomUUID();
  const now = new Date().toISOString();
  const job = {
    id, type, payload, status: "queued", createdAt: now, updatedAt: now,
    attempts: 0, maxAttempts: Math.max(Number(options.maxAttempts) || MAX_ATTEMPTS, 1)
  };
  const redis = await getRedis();
  await saveJob(redis, job);
  if (redis) await redis.rPush(QUEUE_KEY, id);
  else memoryQueue.push(id);
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

function retryDelay(attempt) {
  return Math.min(RETRY_BASE_MS * (2 ** Math.max(attempt - 1, 0)), 60_000);
}

const CLAIM_SCRIPT = `
local id = redis.call("LPOP", KEYS[1])
if not id then return nil end
local raw = redis.call("GET", ARGV[1] .. id)
if not raw then return nil end

local job = cjson.decode(raw)
local now = ARGV[2]
local leaseUntil = ARGV[3]
job.status = "running"
job.startedAt = now
job.updatedAt = now
job.attempts = (job.attempts or 0) + 1
job.leaseUntil = leaseUntil

local encoded = cjson.encode(job)
redis.call("SET", ARGV[1] .. id, encoded)
redis.call("HSET", KEYS[2], id, leaseUntil)
return encoded
`;

async function claimNext(redis) {
  if (!redis) {
    const id = memoryQueue.shift();
    return id ? memoryJobs.get(id) || null : null;
  }

  const now = new Date();
  const leaseUntil = new Date(now.getTime() + VISIBILITY_TIMEOUT_MS).toISOString();
  const raw = await redis.eval(CLAIM_SCRIPT, {
    keys: [QUEUE_KEY, PROCESSING_KEY],
    arguments: [JOB_PREFIX, now.toISOString(), leaseUntil]
  });
  return raw ? JSON.parse(raw) : null;
}

async function processNext() {
  const redis = await getRedis();
  const job = await claimNext(redis);
  if (!job) return null;

  const handler = handlers.get(job.type);
  try {
    if (!handler) throw new Error("No worker registered for job type: " + job.type);
    job.result = await handler(job.payload);
    job.status = "completed";
  } catch (error) {
    job.error = error instanceof Error ? error.message : String(error);
    if (job.attempts < job.maxAttempts) {
      job.status = "retrying";
      job.retryAt = new Date(Date.now() + retryDelay(job.attempts)).toISOString();
      if (redis) {
        await redis.zAdd(QUEUE_KEY + ":retry", [{ score: Date.now() + retryDelay(job.attempts), value: job.id }]);
      } else {
        setTimeout(() => memoryQueue.push(job.id), retryDelay(job.attempts)).unref();
      }
    } else {
      job.status = "failed";
      job.failedAt = new Date().toISOString();
    }
  }

  job.finishedAt = new Date().toISOString();
  job.updatedAt = job.finishedAt;
  delete job.leaseUntil;
  await saveJob(redis, job);
  if (redis) await redis.hDel(PROCESSING_KEY, job.id);
  return job;
}

async function recoverExpiredJobs() {
  const redis = await getRedis();
  if (!redis) return 0;
  const now = Date.now();
  const entries = await redis.hGetAll(PROCESSING_KEY);
  let recovered = 0;
  for (const [id, leaseUntil] of Object.entries(entries)) {
    if (Date.parse(leaseUntil) > now) continue;
    const job = await getJob(id);
    await redis.hDel(PROCESSING_KEY, id);
    if (!job || job.status === "completed" || job.status === "failed") continue;
    job.status = "queued";
    job.updatedAt = new Date().toISOString();
    await saveJob(redis, job);
    await redis.rPush(QUEUE_KEY, id);
    recovered += 1;
  }
  return recovered;
}

async function promoteRetries() {
  const redis = await getRedis();
  if (!redis) return 0;
  const due = await redis.zRangeByScore(QUEUE_KEY + ":retry", 0, Date.now());
  if (!due.length) return 0;
  for (const id of due) await redis.rPush(QUEUE_KEY, id);
  await redis.zRem(QUEUE_KEY + ":retry", due);
  return due.length;
}

function startWorker(intervalMs = 250) {
  const tick = async () => {
    try {
      await promoteRetries();
      await recoverExpiredJobs();
      await processNext();
    } catch (error) {
      console.error("Worker error", error.message);
    }
  };
  tick();
  return setInterval(tick, intervalMs);
}

async function getQueueHealth() {
  if (!REDIS_URL) return { configured: false, connectivity: "fallback" };
  try {
    const redis = await getRedis();
    await redis.ping();
    return { configured: true, connectivity: "ok" };
  } catch (error) {
    return { configured: true, connectivity: "error", error: error.message };
  }
}

function getQueueInfo() {
  return {
    type: REDIS_URL ? "redis" : "memory",
    configured: Boolean(REDIS_URL),
    enabled: true,
    key: QUEUE_KEY,
    maxAttempts: MAX_ATTEMPTS,
    visibilityTimeoutMs: VISIBILITY_TIMEOUT_MS
  };
}

module.exports = {
  registerHandler, enqueue, getJob, processNext, startWorker,
  recoverExpiredJobs, promoteRetries, getQueueInfo, getQueueHealth
};
