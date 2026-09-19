const fs = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(process.env.ARTIFACT_LOCAL_ROOT || path.join(process.cwd(), ".artifacts"));

function assertConfigured() {
  if (process.env.NODE_ENV === "production" && process.env.ARTIFACT_STORE !== "local") {
    throw new Error("Object storage adapter is not configured");
  }
}

function resolveKey(key) {
  if (typeof key !== "string" || !key || key.startsWith("/") || key.split("/").includes("..")) {
    throw new Error("Invalid artifact key");
  }
  const resolved = path.resolve(ROOT, key);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) throw new Error("Artifact path escapes storage root");
  return resolved;
}

async function getArtifact(key, destination) {
  assertConfigured();
  const source = resolveKey(key);
  const target = destination ? path.resolve(destination) : source;
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (source !== target) await fs.copyFile(source, target);
  return target;
}

async function putArtifact(key, source) {
  assertConfigured();
  const destination = resolveKey(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
  const stat = await fs.stat(destination);
  return { key, size: stat.size };
}

async function deleteArtifact(key) {
  assertConfigured();
  await fs.rm(resolveKey(key), { force: true });
}

module.exports = { getArtifact, putArtifact, deleteArtifact, resolveKey };
