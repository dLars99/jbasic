import type { RunnerCtx } from "../basic";

export function handleLet(ctx: RunnerCtx, stmt: string) {
  const rhs = stmt.replace(/^LET\b/i, "").trim();
  const match = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (match) {
    const [, name, expr] = match;
    ctx.environment[name] = ctx.safeEvalExpr(expr);
  }
  ctx.instructionPointer += 1;
}
