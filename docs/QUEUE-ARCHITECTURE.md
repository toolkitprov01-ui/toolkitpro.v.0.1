# Toolkit Pro Queue

The current queue implementation is an in-memory contract used to validate job lifecycle and worker routing before introducing a shared Redis backend.

## Job lifecycle

`queued` → `running` → `completed` / `failed`

## Worker contract

Workers register a handler by job type:

```js
registerHandler("job-type", async payload => result);
```

The HTTP API currently exposes the `example` job only. Tool-specific queue jobs should be enabled through the tool registry's execution contract rather than hard-coded routes.

## Production migration target

```
API instances
    ↓
Redis queue
    ↓
Worker pool
    ↓
Tool execution
```

The API must not depend on process-local job state once multiple application instances are deployed.

## Required production properties

- Durable queue storage
- Retry policy with bounded attempts
- Visibility/lease timeout
- Dead-letter handling
- Idempotency keys
- Job cancellation
- Per-tool timeout/resource limits
- Worker concurrency controls
- Queue metrics and structured logging
