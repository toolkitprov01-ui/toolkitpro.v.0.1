const { randomUUID } = require("crypto");
const { createClient } = require("redis");
const { validateJobPayload } = require("./job-contract");

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

const ENQUEUE_SCRIPT = `
local jobKey = KEYS[1]
local queueKey = KEYS[2]
local jobJson = ARGV[1]
local jobId = ARGV[2]

if redis.call("EXISTS", jobKey) == 1 then
  return 0
end

redis.call("SET", jobKey, jobJson)
redis.call("RPUSH", queueKey, jobId)
return 1
`;

async function enqueue(type, payload = {}, options = {}) {
  if (!type) throw new Error("Invalid job type");
  const id = options.id || randomUUID();
  if (!/^[a-f0-9-]{20,64}$/i.test(id)) throw new Error("Invalid job id");
  const now = new Date().toISOString();
  const validatedPayload = validateJobPayload(type, payload, id);
  const job = {
    id, type, payload: validatedPayload, status: "queued", createdAt: now, updatedAt: now,
    attempts: 0, maxAttempts: Math.max(Number(options.maxAttempts) || MAX_ATTEMPTS, 1),
    ...(options.ownerTokenHash ? { ownerTokenHash: String(options.ownerTokenHash) } : {})
  };
  const redis = await getRedis();

  if (!redis) {
    await saveJob(null, job);
    memoryQueue.push(id);
    return job;
  }

  const inserted = await redis.eval(ENQUEUE_SCRIPT, {
    keys: [JOB_PREFIX + id, QUEUE_KEY],
    arguments: [JSON.stringify(job), id]
  });

  if (Number(inserted) !== 1) {
    throw new Error("Job id already exists");
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

    if (job.attempts >= job.maxAttempts) {
      const finishedAt = new Date().toISOString();
      job.status = "failed";
      job.failedAt = finishedAt;
      job.finishedAt = finishedAt;
      job.updatedAt = finishedAt;
      job.error = job.error || "Job lease expired after maximum attempts";
      delete job.leaseUntil;
      await saveJob(redis, job);
      recovered += 1;
      continue;
    }

    job.status = "queued";
    job.updatedAt = new Date().toISOString();
    delete job.leaseUntil;
    await saveJob(redis, job);
    await redis.rPush(QUEUE_KEY, id);
    recovered += 1;
  }
  return recovered;
}

const PROMOTE_RETRIES_SCRIPT = `
local retryKey = KEYS[1]
local queueKey = KEYS[2]
local now = tonumber(ARGV[1])
local ids = redis.call("ZRANGEBYSCORE", retryKey, 0, now)
local moved = 0
for _, id in ipairs(ids) do
  redis.call("RPUSH", queueKey, id)
  redis.call("ZREM", retryKey, id)
  moved = moved + 1
end
return moved
`;

async function promoteRetries() {
  const redis = await getRedis();
  if (!redis) return 0;
  return Number(await redis.eval(PROMOTE_RETRIES_SCRIPT, {
    keys: [QUEUE_KEY + ":retry", QUEUE_KEY],
    arguments: [String(Date.now())]
  })) || 0;
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
