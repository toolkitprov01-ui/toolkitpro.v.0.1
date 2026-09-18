const { createClient } = require("redis");

const client = process.env.REDIS_URL ? createClient({ url: process.env.REDIS_URL }) : null;

if (client) client.on("error", error => console.error("Redis error:", error.message));

async function connectRedis() {
  if (client && !client.isOpen) await client.connect();
  return client;
}

async function healthCheck() {
  if (!client) return { configured: false };
  await connectRedis();
  return { configured: true, connected: client.isReady };
}

module.exports = { client, connectRedis, healthCheck };