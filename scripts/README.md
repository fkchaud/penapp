# `scripts/` — Project Reset Utility

## Overview

Ships the Expo template's one-shot project resetter, unmodified. `reset-project.js` moves the
existing `app/` directory to `app-example/` and recreates a minimal `app/` with a single screen
and root layout. It is not imported, bundled, or executed by the application at runtime; it is
reachable only through the `reset-project` npm script.

| File | Responsibility |
| --- | --- |
| `reset-project.js` | Destructive Node CLI that renames `app/` and scaffolds a blank Expo Router app. |

## Interface

Executable Node script (`#!/usr/bin/env node`), no exports, no CLI arguments, no flags.

```bash
# via package.json script  →  "reset-project": "node ./scripts/reset-project.js"
npm run reset-project

# direct
node ./scripts/reset-project.js
```

Behavior, in order:

1. `root = process.cwd()`; derives `app`, `app-example`, and `app` paths.
2. `fs.rename(<root>/app, <root>/app-example)`.
3. On success, `fs.mkdir(<root>/app, { recursive: true })`.
4. Writes `app/index.tsx` (a centered `<Text>` placeholder).
5. Writes `app/_layout.tsx` (an Expo Router `<Stack>` with `index`).

The two file bodies are inline template literals (`indexContent`, `layoutContent`).

## Invariants

1. **Working directory is the project root.** Paths are resolved from `process.cwd()`, not from
   `__dirname`. Running it from any other directory targets that directory's `app/`.
2. **Destination must not exist.** `fs.rename` fails if `app-example/` is already present; the
   script then logs and aborts before creating anything. Re-running after a successful reset
   can succeed only if `app-example/` was removed or renamed.
3. **No confirmation prompt and no dry-run.** A single invocation immediately relocates `app/`;
   this is the destructive step.
4. **Failure is logged, not signalled.** Every error path is `console.error(...)` followed by
   `return`; the process still exits with code `0`, so shell `&&` chains and CI cannot detect
   a failed reset. Errors are string-formatted (`Error renaming directory: ${error}`), not
   stack traces.
5. **Operations are asynchronous and nested.** Callbacks nest rename → mkdir → write
   `index.tsx` → write `_layout.tsx`; there is no `await`, no sequencing guard beyond nesting,
   and no cleanup on partial failure (e.g. `app/` moved but scaffold not written).
6. **`{ recursive: true }` only affects `mkdir`.** Existing files inside a re-created `app/`
   are not removed; `fs.writeFile` overwrites `index.tsx` / `_layout.tsx` if present.
7. **The generated screen and layout are fixed strings.** They are not templates of the
   current app and contain no project-specific imports beyond `react-native` and
   `expo-router`.
8. **No relation to runtime code.** Nothing in `app/`, `components/`, `hooks/`, `utils/`, or
   `types/` imports this script, and it is not part of `expo start`, `expo run:*`, or the
   bundler graph.

## Side Effects

- Filesystem: one directory rename (`app` → `app-example`), one directory creation (`app`), two
  file writes (`app/index.tsx`, `app/_layout.tsx`).
- Console: `stdout` progress lines (`/app moved to /app-example.`, `New /app directory created.`,
  `app/index.tsx created.`, `app/_layout.tsx created.`) and `stderr`-bound `console.error` on
  failure.
- No network, no environment variables, no package or config edits (the header comment merely
  suggests the developer may delete the script and its `package.json` entry afterwards).

## Verification

```bash
# type/static checks for the repo (the script is plain CommonJS, not type-checked as TS)
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```

Do **not** run the script to verify it: `node ./scripts/reset-project.js` is destructive
(relocates `app/` and overwrites the router entry files) and is not exercised by builds or
tests. To sanity-check without side effects, review the `fs` call order and the two inline
template literals.
