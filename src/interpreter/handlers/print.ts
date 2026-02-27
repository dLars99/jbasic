import type { StatementHandler } from "../basic";

export const handlePrint: StatementHandler = function (ctx, stmt) {
  const expr = stmt.replace(/^PRINT\b/i, "").trim();
  const out = ctx.evaluateExpression(expr);
  ctx.onOutput(String(out));
  ctx.instructionPointer += 1;
};
