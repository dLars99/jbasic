import type { StatementHandler } from "../basic";

export const handleLet: StatementHandler = function (ctx, stmt) {
  const rhs = stmt.replace(/^LET\b/i, "").trim();
  const match = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (match) {
    const [, name, expr] = match;
    ctx.environment[name] = ctx.safeEvalExpr(expr);
  }
  ctx.instructionPointer += 1;
};
