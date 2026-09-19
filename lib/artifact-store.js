const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(process.env.ARTIFACT_LOCAL_ROOT || path.join(process.cwd(), ".artifacts"));
const MAX_UPLOAD_BYTES = Math.max(Number(process.env.OBJECT_STORAGE_MAX_UPLOAD_BYTES) || 100 * 1024 * 1024, 1);

function provider() {
  return String(process.env.ARTIFACT_STORE || "").trim().toLowerCase() || "unconfigured";
}

function isLocal() {
  return provider() === "local" || (provider() === "unconfigured" && process.env.NODE_ENV !== "production");
}

function assertConfigured() {
  if (isLocal()) return;
  if (provider() === "s3") {
    const required = ["OBJECT_STORAGE_ENDPOINT","OBJECT_STORAGE_REGION","OBJECT_STORAGE_BUCKET","OBJECT_STORAGE_ACCESS_KEY","OBJECT_STORAGE_SECRET_KEY"];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length) throw new Error("Object storage configuration incomplete: " + missing.join(", "));
    return;
  }
  throw new Error("Object storage adapter is not configured");
}

function resolveKey(key) {
  if (typeof key !== "string" || !key || key.startsWith("/") || key.split("/").includes("..")) {
    throw new Error("Invalid artifact key");
  }
  const resolved = path.resolve(ROOT, key);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) throw new Error("Artifact path escapes storage root");
  return resolved;
}

function createJobKey(jobId, filename) {
  if (!/^[a-f0-9-]{20,64}$/i.test(String(jobId))) throw new Error("Invalid job id");
  const safe = path.basename(String(filename || "input.bin")).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "input.bin";
  return "uploads/" + jobId + "/" + crypto.randomBytes(12).toString("hex") + "-" + safe;
}

async function getArtifact(key, destination) {
  assertConfigured();
  if (!isLocal()) throw new Error("S3 adapter requires provider implementation before use");
  const source = resolveKey(key);
  const target = destination ? path.resolve(destination) : source;
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (source !== target) await fs.copyFile(source, target);
  return target;
}

async function putArtifact(key, source) {
  assertConfigured();
  if (!isLocal()) throw new Error("S3 adapter requires provider implementation before use");
  const destination = resolveKey(key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const stat = await fs.stat(source);
  if (stat.size > MAX_UPLOAD_BYTES) throw new Error("Artifact exceeds configured size limit");
  await fs.copyFile(source, destination);
  return { key, size: (await fs.stat(destination)).size };
}

async function deleteArtifact(key) {
  assertConfigured();
  if (!isLocal()) throw new Error("S3 adapter requires provider implementation before use");
  await fs.rm(resolveKey(key), { force: true });
}

function getArtifactStoreInfo() {
  return {
    provider: provider(),
    configured: isLocal() || provider() === "s3",
    mode: isLocal() ? "local" : provider() === "s3" ? "s3-pending-adapter" : "unconfigured",
    maxUploadBytes: MAX_UPLOAD_BYTES
  };
}

module.exports = { getArtifact, putArtifact, deleteArtifact, resolveKey, createJobKey, getArtifactStoreInfo };
