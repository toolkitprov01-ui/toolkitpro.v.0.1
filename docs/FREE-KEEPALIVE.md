# Free Render Keepalive

Toolkit Pro uses a GitHub Actions workflow to periodically request the production health endpoint.

## Workflow

File:

`.github/workflows/free-keepalive-12s.yml`

Behavior:

- GitHub starts the workflow every 5 minutes.
- Each run sends a health request every 12 seconds.
- Each run performs 24 requests.
- A run lasts about 4 minutes 48 seconds.
- The workflow is manually runnable with `workflow_dispatch`.
- The workflow uses no paid service.

## Important limitation

GitHub Actions cron does not support a true 12-second schedule. The 12-second interval is implemented inside each workflow run.

Therefore this is a best-effort free keepalive, not a guaranteed always-on service. GitHub may delay scheduled workflows, and Render Free can still sleep or impose platform limits.

The workflow must never be treated as a substitute for a paid always-on worker.

## Endpoint

The workflow checks:

`https://toolkitpro-v-0-1.onrender.com/api/health`

The request is read-only and does not create application jobs.

## Why this design

The goal is to reduce unnecessary Render sleep caused by inactivity while keeping the infrastructure free. It does not attempt to bypass provider limits or guarantees.
