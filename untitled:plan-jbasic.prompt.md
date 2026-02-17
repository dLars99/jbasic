## Plan: Preserve Popup Runtime in Production

TL;DR — Keep the current popup UX (opening `/runtime.html`) by making `runtime.html` a Vite build input so it is processed and gets correct built asset links. Update `vite.config.js` to include a `runtime` HTML entry, move or copy `public/runtime.html` to the project root as `runtime.html` (so Vite can process it), add a dedicated runtime entry module `src/runtime-entry.tsx` that imports the interpreter, and harden messaging and evaluator code to avoid `unsafe-eval` and message spoofing. This preserves exact popup behavior in dev and production while fixing post-build import breakage and reducing security liability.

**Steps**

1. Add a runtime build entry
   - Create `runtime.html` at repo root (move or copy from `public/runtime.html`) and ensure its script uses a module entry you control (e.g., `<script type="module" src="/src/runtime-entry.tsx"></script>`). See `public/runtime.html` for current content.
   - Update Vite config to include the runtime HTML as a second input so Vite processes and outputs a production-ready `runtime.html` with correct asset links:
     - Edit `vite.config.js` and add `build.rollupOptions.input` mapping `main` → `index.html` and `runtime` → `runtime.html`.
2. Create a runtime entry module
   - Add `src/runtime-entry.tsx` that mounts the runtime UI (the code currently executed by `public/runtime.html`) and imports `src/interpreter/basic.ts` (or the interpreter bootstrap).
   - Ensure this module only includes runtime-specific UI and logic so its bundle is minimal.
3. Preserve popup UX
   - Keep the popup opener in `src/App.tsx` opening `/runtime.html` (no route change needed).
   - Confirm that after `vite build` the published `runtime.html` lives at `/runtime.html` and loads the runtime bundle emitted by Vite.
4. Harden messaging and origin checks
   - In `runtime.html`/`src/runtime-entry.tsx`, validate `event.origin === window.location.origin` before processing incoming messages.
   - In `src/App.tsx`, post messages to the popup using `popupWindow.postMessage(msg, window.location.origin)` rather than `"*"`, and implement a small handshake token on open to authenticate the connection.
5. Replace unsafe evaluator
   - Replace `Function(...)` evaluation in `src/interpreter/basic.ts` with a safe expression evaluator (recommended `expr-eval`) to avoid requiring `unsafe-eval`.
   - Limit allowed identifiers and operations, wrap evaluation in `try/catch`, and return sanitized errors.
6. Build/site config
   - Keep `public/` for static assets; ensure any other static assets `runtime.html` needs are accessible.
   - Add `public/_redirects` (Netlify) with `/* /index.html 200` to support SPA routing; `runtime.html` is an HTML file and will be served as `/runtime.html` by the static host.
   - If deploying under a subpath, set `base` in `vite.config.js`.
7. Testing & verification
   - Locally:
     - `npm ci`
     - `npm run build`
     - `npm run preview`
     - Open app and click “Open Runtime” — popup should open `/runtime.html` and run programs identically to dev.
   - Verify:
     - No console errors about missing `/src/...` imports.
     - PostMessage handshake succeeds and origin checks pass.
     - BASIC programs execute as expected with safe evaluator.
8. CI & deploy
   - Use Netlify (or chosen host) with build command `npm run build` and publish dir `dist`.
   - CI should run `npm ci`, `npm run build`, and fail on build errors.

**Verification**

- After build, confirm `dist/runtime.html` exists and includes proper script tags pointing to the built runtime JS.
- Open production site and trigger popup; confirm feature parity with dev.
- Run unit tests for evaluator to verify correctness and injection safety.

**Critical files to change**

- `vite.config.js` — add `rollupOptions.input` entries.
- `public/runtime.html` → move/copy to `runtime.html` at project root.
- `src/runtime-entry.tsx` (new) — runtime bootstrap and mount.
- `src/App.tsx` — ensure popup opener still points to `/runtime.html` and tighten postMessage usage.
- `src/interpreter/basic.ts` — replace `Function` usage with safe evaluator.

**Decisions**

- Keep popup behavior exactly as-is (open `/runtime.html`) in production.
- Use Vite multi-input build (HTML input) so production `runtime.html` is processed and asset links are correct.
- Replace `Function` with `expr-eval` (or similar) to avoid `unsafe-eval` and improve security.

**Liabilities & Mitigations (delta vs previous plan)**

- Production import breakage: mitigated by making `runtime.html` a built HTML input (Vite rewrites module imports).
- Code injection: still mitigated by replacing `Function` with safe evaluator.
- Message spoofing: mitigated by handshake and strict `origin` checks.
- CSP: no `unsafe-eval` required after evaluator replacement.

If you approve, I will produce a detailed patch plan (concrete edits to `vite.config.js`, new `src/runtime-entry.tsx`, and the evaluator replacement) and then implement the changes. Which do you want next — I should (A) generate the exact code edits and apply them, or (B) show the patch diff first for review?
