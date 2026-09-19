const PDF_JOB_TYPES = new Set([
  "jpg-to-pdf","png-to-pdf","pdf-to-jpg","pdf-to-png","pdf-compressor",
  "merge-pdf","split-pdf","extract-pdf-pages","delete-pdf-pages","rotate-pdf"
]);

const PDF_WORKER_JOB_TYPES = new Set([\n  "merge-pdf","split-pdf","extract-pdf-pages","delete-pdf-pages","rotate-pdf"\n]);\n\nconst MAX_PAYLOAD_BYTES = Math.max(Number(process.env.QUEUE_MAX_PAYLOAD_BYTES) || 64 * 1024, 8 * 1024);
const MAX_INPUTS = 20;
const MAX_INPUT_BYTES = 100 * 1024 * 1024;

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function isSafeKey(key) {
  return typeof key === "string" &&
    key.length > 0 &&
    key.length <= 512 &&
    !key.startsWith("/") &&
    !key.includes("\\") &&
    !key.split("/").some(part => part === "..");
}

function validateArtifact(artifact, label) {
  if (!artifact || typeof artifact !== "object") throw new Error(label + " artifact is required");
  if (!isSafeKey(artifact.key)) throw new Error(label + " artifact key is invalid");
  const size = Number(artifact.size);
  if (!Number.isFinite(size) || size < 0 || size > MAX_INPUT_BYTES) {
    throw new Error(label + " artifact size is invalid");
  }
  return { key: artifact.key, size };
}

function validatePdfJobPayload(type, payload, jobId) {
  if (!PDF_JOB_TYPES.has(type)) throw new Error("Unsupported PDF job type");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("PDF job payload must be an object");
  }
  if (byteLength(payload) > MAX_PAYLOAD_BYTES) throw new Error("Job payload is too large");

  if (jobId !== undefined && !/^[a-f0-9-]{20,64}$/i.test(String(jobId))) throw new Error("Invalid job id");

  const inputs = Array.isArray(payload.input) ? payload.input : [];
  if (!inputs.length || inputs.length > MAX_INPUTS) throw new Error("Invalid PDF input count");

  const normalizedInputs = inputs.map((item, index) => validateArtifact(item, "input[" + index + "]"));
  if (jobId !== undefined) {
    const prefix = "uploads/" + jobId + "/";
    if (normalizedInputs.some(item => !item.key.startsWith(prefix))) throw new Error("Input artifact is not scoped to this job");
  }
  const totalBytes = normalizedInputs.reduce((sum, item) => sum + item.size, 0);
  if (totalBytes > MAX_INPUT_BYTES) throw new Error("Total PDF input size exceeds limit");

  const output = validateArtifact(payload.output, "output");
  if (jobId !== undefined && output.key !== "outputs/" + jobId + "/result.pdf") throw new Error("Output artifact is not scoped to this job");
  if (output.size !== 0) throw new Error("Output artifact size must be 0 before processing");

  return {
    input: normalizedInputs,
    output: { key: output.key, size: 0 },
    options: payload.options && typeof payload.options === "object" && !Array.isArray(payload.options) ? payload.options : {}
  };
}

function validateJobPayload(type, payload, jobId) {
  if (PDF_JOB_TYPES.has(type)) return validatePdfJobPayload(type, payload, jobId);
  return payload;
}

module.exports = {
  PDF_JOB_TYPES,
  MAX_PAYLOAD_BYTES,
  MAX_INPUTS,
  MAX_INPUT_BYTES,
  validateJobPayload,
  validatePdfJobPayload,
  isSafeKey
};
