import type { StatementHandler } from "../basic";

export const handleLet: StatementHandler = function (ctx, stmt) {
  const rhs = stmt.replace(/^LET\b/i, "").trim();
  const match = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (match) {
    const [, name, expr] = match;
    ctx.environment[name] = ctx.evaluateExpression(expr);
    ctx.instructionPointer += 1;
  } else {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
  }
};
