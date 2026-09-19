# PDF Background Job Architecture

## Goal

Move heavy PDF operations out of the web process without putting file bytes into Redis or PostgreSQL.

## Data flow

Browser
  -> Web API
  -> object storage (input)
  -> Redis job queue (metadata only)
  -> Worker
  -> object storage (output)
  -> job status API
  -> Browser download

## Job payload contract

Redis contains only small metadata:

{
  "id": "uuid",
  "type": "pdf-merge",
  "input": [
    { "key": "uploads/<job-id>/input-1.pdf", "size": 123456 }
  ],
  "output": { "key": "outputs/<job-id>/result.pdf" },
  "options": {}
}

Never place PDF bytes, base64 files, or large binary payloads in Redis.

## Storage contract

The application should use an S3-compatible object-storage abstraction.

Required configuration:

- OBJECT_STORAGE_ENDPOINT
- OBJECT_STORAGE_REGION
- OBJECT_STORAGE_BUCKET
- OBJECT_STORAGE_ACCESS_KEY
- OBJECT_STORAGE_SECRET_KEY
- OBJECT_STORAGE_PUBLIC_BASE_URL (optional)
- OBJECT_STORAGE_MAX_UPLOAD_BYTES (default 100 MiB)

The web service creates short-lived upload/download URLs where supported. The worker reads inputs and writes outputs through the storage abstraction.

## Lifecycle

1. Create job record with status created.
2. Allocate an input object key scoped to the job.
3. Upload directly from browser to object storage.
4. Enqueue only object keys and processing options.
5. Worker claims the job and marks it running.
6. Worker downloads input objects to ephemeral local disk.
7. Worker validates size/type before processing.
8. Worker performs the PDF operation.
9. Worker writes the result to an output object.
10. Worker updates job status to completed and stores output metadata.
11. Browser polls job status and receives a short-lived download URL.
12. A cleanup process removes expired inputs/outputs.

## Security requirements

- Generate unpredictable per-job object keys.
- Never trust a client-provided object key outside its job namespace.
- Enforce upload and total-input limits server-side.
- Validate MIME type and PDF signature before processing.
- Do not expose storage credentials to browsers.
- Use short-lived signed URLs.
- Keep job payloads free of secrets.
- Delete temporary worker files in finally blocks.
- Apply retention limits to uploaded and generated files.

## Failure behavior

- Redis retry/visibility lease handles worker interruption.
- A failed processing attempt records an error without exposing internal stack traces to users.
- Retries must not create unbounded duplicate outputs; output keys should be deterministic per job/attempt or cleaned before retry.
- If an output upload succeeds but the final job update fails, the worker must be able to reconcile the output on retry.
- Expired jobs should transition to a terminal cleanup state.

## Current implementation boundary

The repository currently has Redis queue infrastructure but no object-storage provider configured and no persistent PDF worker service provisioned in Render.

Therefore the next implementation step is to add the storage interface and job contracts without inventing provider credentials. Provider-specific integration should be enabled only after an S3-compatible storage service is selected and its credentials are supplied through Render environment variables.

## First PDF jobs

The worker pipeline should initially support:

- jpg-to-pdf
- png-to-pdf
- pdf-to-jpg
- pdf-to-png
- pdf-compressor
- merge-pdf
- split-pdf
- extract-pdf-pages
- delete-pdf-pages
- rotate-pdf

Each job handler should reuse the validated PDF processing logic and enforce the same file/page limits as the browser tool.
