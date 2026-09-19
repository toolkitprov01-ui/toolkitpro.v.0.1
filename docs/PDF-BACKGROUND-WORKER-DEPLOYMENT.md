# PDF Background Worker Deployment Checklist

This checklist is the production handoff for Toolkit Pro's PDF background-job pipeline.

## Required Render services

1. Existing web service: `toolkitpro.v.0.1`
2. Persistent Docker Worker: `toolkit-pro-worker`
   - Repository: `toolkitprov01-ui/toolkitpro.v.0.1`
   - Branch: `main`
   - Runtime: Docker
   - Dockerfile: `./Dockerfile.worker`
   - Auto deploy: enabled
   - Region: Oregon
   - Plan: free initially

The repository already contains the worker definition in `render.yaml`. If the Render dashboard does not apply the Blueprint automatically, create the Worker manually rather than creating a second public web service.

## Required runtime environment

Set these on both the web service and the Worker where applicable:

### Queue

- `REDIS_URL` — Render Key Value/Redis connection URL
- Optional queue tuning:
  - `QUEUE_MAX_ATTEMPTS`
  - `QUEUE_VISIBILITY_TIMEOUT_MS`
  - `QUEUE_RETRY_BASE_MS`

### Object storage

The PDF pipeline requires an S3-compatible object store shared by the web service and Worker:

- `ARTIFACT_STORE=s3`
- `OBJECT_STORAGE_ENDPOINT`
- `OBJECT_STORAGE_REGION`
- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_ACCESS_KEY`
- `OBJECT_STORAGE_SECRET_KEY`

Optional:

- `OBJECT_STORAGE_FORCE_PATH_STYLE=true`
- `OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS=600`
- `OBJECT_STORAGE_MAX_UPLOAD_BYTES=104857600`

Do not commit credentials to GitHub. Use Render environment variables/secrets.

## Startup requirements

The Worker image uses:

- `Dockerfile.worker`
- `npm run worker`
- `REQUIRE_REDIS_WORKER=true`

Therefore a production Worker without Redis configuration should fail fast instead of silently using the in-memory queue.

## End-to-end flow

1. Browser requests `POST /api/pdf/jobs/prepare`.
2. Web service returns a job ID and signed upload URL.
3. Browser uploads the PDF directly to object storage.
4. Browser calls `POST /api/pdf/jobs/:id/complete` with the input artifact key, PDF operation, and operation options.
5. Server verifies the artifact metadata and queues the job using the server-issued job ID.
6. Worker claims the job from Redis.
7. Worker downloads the input artifact, validates the PDF signature, processes it, and writes the output artifact.
8. Client polls `GET /api/jobs/:id`.
9. After status becomes `completed`, client requests `GET /api/pdf/artifacts/download?jobId=...&key=...`.
10. Server issues a short-lived signed download URL.

## Currently worker-enabled PDF operations

- `merge-pdf`
- `split-pdf`
- `extract-pdf-pages`
- `delete-pdf-pages`
- `rotate-pdf`

The remaining PDF job types in the contract are intentionally not registered in the Worker yet. Do not expose them as completed server-side processors until their implementations exist.

## Security checks already enforced

- Job IDs are validated.
- Input artifacts must be under `uploads/<jobId>/`.
- Output is fixed to `outputs/<jobId>/result.pdf`.
- Queue payloads are validated before persistence.
- Input size is capped at 25 MB by the PDF worker.
- Output download requires a completed matching job.
- Object-storage paths reject traversal patterns.
- Signed URLs are time-limited.

## Production verification

After provisioning the Worker and object storage, verify:

- Web `/api/health` reports Redis connectivity and artifact store configuration.
- Worker starts without the Redis-required startup error.
- A small valid PDF can be uploaded and processed.
- Invalid/non-PDF input fails the job rather than producing an output.
- A page-range operation rejects out-of-range pages.
- A completed job returns a signed download URL.
- A failed job exposes a useful status/error without exposing secrets.

No deployment or test pass should be assumed from this checklist alone; verify the actual Render deploy and runtime logs after configuration.
