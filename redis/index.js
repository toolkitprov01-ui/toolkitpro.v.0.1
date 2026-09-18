const { createClient } = require("redis");

let client = null;
let connectPromise = null;

function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => {});
  }
  return client;
}

async function healthCheck() {
  const c = getClient();
  if (!c) return { configured: false, connected: false };
  try {
    if (!c.isOpen) {
      connectPromise ||= c.connect();
      await connectPromise;
      connectPromise = null;
    }
    await c.ping();
    return { configured: true, connected: true };
  } catch (error) {
    connectPromise = null;
    return { configured: true, connected: false, error: error.message };
  }
}

module.exports = { getClient, healthCheck };
