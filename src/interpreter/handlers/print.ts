import type { StatementHandler } from "../basic";

export const handlePrint: StatementHandler = function (ctx, stmt) {
  const expr = stmt.replace(/^PRINT\b/i, "").trim();
  if (!expr) {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
    return;
  }
  const out = ctx.evaluateExpression(expr);
  ctx.onOutput(String(out));
  ctx.instructionPointer += 1;
};
