# jBASIC

A small web-based BASIC interpreter prototype.

🤖 Made with clankers 🤖

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Usage

- Edit code in the left pane.
- Click "Run" to open the runtime window and execute the program.
- Click "Stop" to terminate the runtime window.

## Expression Evaluator Compatibility

The expression evaluator has been hardened to use a safe, non-dynamic parser. It supports:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparisons: `=`, `<>`, `<`, `<=`, `>`, `>=`
- Logical: `AND`, `OR`, `NOT`
- Unary: `-`, `+`, `NOT`
- Literals: numbers, strings (in quotes), `TRUE`/`FALSE`
- Variables: undefined variables return 0

Unsupported syntax (e.g., functions like `SIN()`, invalid operators) returns 0. This may differ from dynamic evaluation in edge cases, but preserves BASIC semantics for valid expressions.

- This is an initial scaffold with a tiny interpreter that supports `PRINT`, `LET`, and `END`.
- The runtime runs in a new window which loads `public/runtime.html` and executes the interpreter inside a module imported from `/src/interpreter/basic.js`.
