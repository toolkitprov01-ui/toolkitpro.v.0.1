const fs = require("fs/promises");
const path = require("path");
const { PDFDocument, degrees } = require("pdf-lib");
const { registerHandler, startWorker } = require("../lib/job-queue");
const { getArtifact, putArtifact, deleteArtifact } = require("../lib/artifact-store");

if (process.env.REQUIRE_REDIS_WORKER === "true" && !process.env.REDIS_URL && !process.env.QUEUE_REDIS_URL) {
  console.error("Worker startup blocked: Redis is required for the production worker runtime");
  process.exit(1);
}

const WORK_DIR = path.resolve(process.env.WORKER_TMP_DIR || path.join(process.cwd(), "worker-tmp"));
const MAX_PDF_BYTES = 25 * 1024 * 1024;

async function processPdf(type, payload) {
  const dir = await fs.mkdtemp(path.join(WORK_DIR, "pdf-"));
  const inputs = [];
  const output = path.join(dir, "result.pdf");
  try {
    for (const artifact of payload.input) {
      const local = path.join(dir, "in-" + inputs.length + ".pdf");
      await getArtifact(artifact.key, local);
      const stat = await fs.stat(local);
      if (stat.size > MAX_PDF_BYTES) throw new Error("Input PDF exceeds 25 MB");
      const bytes = await fs.readFile(local);
      if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("Input is not a valid PDF");
      inputs.push(bytes);
    }

    if (type === "merge-pdf") {
      const out = await PDFDocument.create();
      for (const bytes of inputs) {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(page => out.addPage(page));
      }
      await fs.writeFile(output, await out.save());
    } else {
      const src = await PDFDocument.load(inputs[0]);
      const indices = src.getPageIndices();
      let selected = indices;
      if (type === "split-pdf" || type === "extract-pdf-pages" || type === "delete-pdf-pages") {
        const requested = String(payload.options?.pages || "").trim();
        if (!requested) throw new Error("Page range is required");
        const wanted = new Set();
        for (const part of requested.split(",")) {
          const [a,b] = part.split("-").map(v => Number(v.trim()));
          if (!Number.isInteger(a) || a < 1 || a > indices.length) throw new Error("Invalid page range");
          const end = b === undefined ? a : b;
          if (!Number.isInteger(end) || end < 1 || end > indices.length) throw new Error("Invalid page range");
          for (let n = Math.min(a,end); n <= Math.max(a,end); n++) wanted.add(n-1);
        }
        selected = type === "delete-pdf-pages" ? indices.filter(i => !wanted.has(i)) : indices.filter(i => wanted.has(i));
      }
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, selected);
      pages.forEach(page => out.addPage(page));
      if (type === "rotate-pdf") {
        const rotation = Number(payload.options?.degrees);
        if (![90,180,270,-90,-180,-270].includes(rotation)) throw new Error("Rotation must be 90, 180, or 270 degrees");
        out.getPages().forEach(page => page.setRotation(degrees((page.getRotation().angle + rotation + 360) % 360)));
      }
      await fs.writeFile(output, await out.save());
    }
    const result = await putArtifact(payload.output.key, output, "application/pdf");
    return { output: result };
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

registerHandler("merge-pdf", payload => processPdf("merge-pdf", payload));
registerHandler("split-pdf", payload => processPdf("split-pdf", payload));
registerHandler("extract-pdf-pages", payload => processPdf("extract-pdf-pages", payload));
registerHandler("delete-pdf-pages", payload => processPdf("delete-pdf-pages", payload));
registerHandler("rotate-pdf", payload => processPdf("rotate-pdf", payload));

registerHandler("example", async payload => ({ message: "Worker pipeline is ready", received: payload }));

const interval = Number(process.env.WORKER_INTERVAL_MS) || 250;
startWorker(interval);
console.log("Toolkit Pro worker started", {
  interval,
  queue: process.env.REDIS_URL || process.env.QUEUE_REDIS_URL ? "redis" : "memory"
});
