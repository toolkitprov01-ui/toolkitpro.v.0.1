const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const ROOT = path.resolve(process.env.ARTIFACT_LOCAL_ROOT || path.join(process.cwd(), ".artifacts"));
const MAX_UPLOAD_BYTES = Math.max(Number(process.env.OBJECT_STORAGE_MAX_UPLOAD_BYTES) || 100 * 1024 * 1024, 1);
const SIGNED_URL_TTL_SECONDS = Math.min(Math.max(Number(process.env.OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS) || 600, 60), 3600);

function provider() {
  return String(process.env.ARTIFACT_STORE || "").trim().toLowerCase() || "unconfigured";
}
function isLocal() {
  return provider() === "local" || (provider() === "unconfigured" && process.env.NODE_ENV !== "production");
}
function getS3Config() {
  const required = ["OBJECT_STORAGE_ENDPOINT","OBJECT_STORAGE_REGION","OBJECT_STORAGE_BUCKET","OBJECT_STORAGE_ACCESS_KEY","OBJECT_STORAGE_SECRET_KEY"];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error("Object storage configuration incomplete: " + missing.join(", "));
  return {
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    region: process.env.OBJECT_STORAGE_REGION,
    bucket: process.env.OBJECT_STORAGE_BUCKET,
    accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY
  };
}
let s3Client = null;
function getS3() {
  const c = getS3Config();
  if (!s3Client) s3Client = new S3Client({
    endpoint: c.endpoint,
    region: c.region,
    forcePathStyle: String(process.env.OBJECT_STORAGE_FORCE_PATH_STYLE || "true") === "true",
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey }
  });
  return { client: s3Client, bucket: c.bucket };
}
function assertConfigured() {
  if (isLocal()) return;
  if (provider() === "s3") { getS3Config(); return; }
  throw new Error("Object storage adapter is not configured");
}
function resolveKey(key) {
  if (typeof key !== "string" || !key || key.startsWith("/") || key.split("/").includes("..")) throw new Error("Invalid artifact key");
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
  if (isLocal()) {
    const source = resolveKey(key), target = destination ? path.resolve(destination) : source;
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (source !== target) await fs.copyFile(source, target);
    return target;
  }
  const { client, bucket } = getS3();
  const target = path.resolve(destination || path.join(process.cwd(), "tmp-artifacts", path.basename(key)));
  await fs.mkdir(path.dirname(target), { recursive: true });
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = response.Body;
  if (!body || typeof body.pipe !== "function") throw new Error("Artifact download returned no stream");
  await new Promise((resolve, reject) => {
    const out = require("fs").createWriteStream(target);
    body.pipe(out);
    body.on("error", reject);
    out.on("finish", resolve);
    out.on("error", reject);
  });
  return target;
}
async function putArtifact(key, source, contentType) {
  assertConfigured();
  const stat = await fs.stat(source);
  if (stat.size > MAX_UPLOAD_BYTES) throw new Error("Artifact exceeds configured size limit");
  if (isLocal()) {
    const destination = resolveKey(key);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return { key, size: (await fs.stat(destination)).size };
  }
  const { client, bucket } = getS3();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: require("fs").createReadStream(source), ContentLength: stat.size, ContentType: contentType || "application/octet-stream" }));
  return { key, size: stat.size };
}
async function deleteArtifact(key) {
  assertConfigured();
  if (isLocal()) return fs.rm(resolveKey(key), { force: true });
  const { client, bucket } = getS3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
async function getArtifactMetadata(key) {
  assertConfigured();
  if (isLocal()) {
    const stat = await fs.stat(resolveKey(key));
    return { key, size: stat.size, contentType: "application/octet-stream" };
  }
  const { client, bucket } = getS3();
  const h = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return { key, size: Number(h.ContentLength || 0), contentType: h.ContentType || "application/octet-stream" };
}
async function createUploadUrl(key, contentType) {
  assertConfigured();
  if (isLocal()) return null;
  const { client, bucket } = getS3();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || "application/pdf" }), { expiresIn: SIGNED_URL_TTL_SECONDS });
}
async function createDownloadUrl(key) {
  assertConfigured();
  if (isLocal()) return null;
  const { client, bucket } = getS3();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: SIGNED_URL_TTL_SECONDS });
}
function getArtifactStoreInfo() {
  let configured = isLocal();
  if (provider() === "s3") {
    try { getS3Config(); configured = true; } catch (_) { configured = false; }
  }
  return { provider: provider(), configured, mode: isLocal() ? "local" : provider() === "s3" ? "s3" : "unconfigured", signedUrlTtlSeconds: SIGNED_URL_TTL_SECONDS, maxUploadBytes: MAX_UPLOAD_BYTES };
}
module.exports = { getArtifact, putArtifact, deleteArtifact, getArtifactMetadata, createUploadUrl, createDownloadUrl, resolveKey, createJobKey, getArtifactStoreInfo };
