Plan: BASIC Interpreter (Web)

TL;DR — Build a small React + Vite web app with a code editing pane (simple `textarea`) and a “Run” button. Running opens a new browser window that loads a sandboxed page which executes the BASIC program inside a sandboxed iframe and communicates over postMessage to display output and capture input. Interpreter core will be a JS module implementing a small BASIC VM (parser → AST → VM with step budget). I’ll scaffold files, wiring, and basic examples after you approve this draft.

Steps

1. Initialize project
   - Add package.json, Vite config, and .gitignore.
2. App shell & dev server
   - Create index.html and entry src/main.jsx with React + Vite.
   - Top-level app component at src/App.jsx with two panes: left textarea editor and right control bar.
3. UI: editor + run control
   - Create textarea editor in src/components/Editor.jsx.
   - Add Run and Stop buttons in src/components/Controls.jsx.
   - Provide example programs in src/examples.js.
4. Interpreter core
   - Implement a minimal JS BASIC interpreter at src/interpreter/basic.js: lexical analysis, simple parser (line numbers optional), runtime supporting PRINT, LET, IF, GOTO, FOR/NEXT, INPUT, END.
   - Expose run(program, options) returning a controllable runner with start(), step(), stop(), and onOutput(cb).
5. Runtime sandbox & new window
   - Add a static runtime page at public/runtime.html which will be opened by window.open.
   - The runtime page hosts a sandboxed iframe (with sandbox attributes) that actually runs the interpreter or receives code to run; runtime page communicates with the main app via postMessage.
   - Implement message protocol: run, stop, output, inputRequest, error, ready.
6. Safety & limits
   - Implement instruction step budget and periodic yields to avoid freezing UI.
   - Allow main app to forcibly close/terminate the runtime window to stop runaway programs.
7. Persistence & UX polish
   - Save last code in localStorage.
   - Add sample programs, minimal help text, and a small README.
8. Tests & verification
   - Unit tests for parser and VM (jest or vitest).
   - Basic end-to-end manual checks.

Verification

- Install and run:

```bash
npm install
npm run dev
# Open http://localhost:5173 (Vite default)
```

- Manual tests:
  - Paste and run a sample BASIC program (e.g., 10 PRINT "HELLO").
  - Verify output appears in the new window and that Stop closes/terminates it.
  - Verify editor content persists after reload.

Decisions

- Stack: React + Vite.
- Editor: textarea.
- Execution: New window that contains a sandboxed iframe for better safety control.

Critical file paths to create

- package.json
- index.html
- src/main.jsx
- src/App.jsx
- src/components/Editor.jsx
- src/components/Controls.jsx
- src/interpreter/basic.js
- src/examples.js
- public/runtime.html
- project-plan.md (existing)

Potential blockers / open choices

- BASIC feature scope: do you want arrays, subroutines, string functions, file I/O? (I assumed a core set: PRINT, LET, IF, GOTO, FOR/NEXT, INPUT.)
- Infinite loops and heavy CPU: plan uses instruction budgets and ability to forcibly close runtime; confirm if you prefer a Web Worker-based runtime instead.
- Editor choice: you chose textarea — if you want syntax highlighting later we can swap to CodeMirror or Monaco.

Next steps

- I created the untitled plan file. If you approve, I can scaffold the repo (package.json + Vite) and implement the minimal app shell next.
