# Tool Module Standard

Toolkit Pro tool modules are lazy-loaded browser modules under `public/js/tool-modules/`.

## Required contract

Every registry entry must map to an existing:

`public/js/tool-modules/<module>.js`

Each module must provide:

- `MODULE_VERSION` — module version string.
- `render({ tool })` — returns the tool workspace HTML.
- `mount({ tool, root })` — attaches events and initializes the workspace.

Both `render` and `mount` are required even when a tool needs minimal UI logic. Keep tool-specific state and DOM logic inside the module.

## Runtime rules

- Browser-safe code only for `runtime: "browser"`.
- Do not import server-only Node APIs into browser modules.
- Avoid global mutable state; scope DOM queries to the supplied workspace root where practical.
- Keep expensive work out of initial page load; modules are lazy-loaded by the Tool Engine.
- Use accessible labels, keyboard-friendly controls, and mobile-friendly tap targets.
- Keep user data local to the browser unless the registry explicitly declares a server/worker runtime.

## Validation

Run:

```bash
npm run validate:modules
npm test
```

The validator checks that every registry module exists and contains the required exports/version marker. This gives the 5,000+ tool registry a consistent module contract before expansion.
