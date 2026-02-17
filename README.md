# jBASIC

A small web-based BASIC interpreter prototype.

Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
```

Usage

- Edit code in the left pane.
- Click "Run" to open the runtime window and execute the program.
- Click "Stop" to terminate the runtime window.

Notes

- This is an initial scaffold with a tiny interpreter that supports `PRINT`, `LET`, and `END`.
- The runtime runs in a new window which loads `public/runtime.html` and executes the interpreter inside a module imported from `/src/interpreter/basic.js`.
