import type { RunnerCtx } from "../basic";
export function handleLet(ctx: RunnerCtx, stmt: string) {
  const rhs = stmt.replace(/^LET\b/i, "").trim();
  const m = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (m) {
    const [, name, expr] = m;
    ctx.env[name] = ctx.safeEvalExpr(expr);
  }
  ctx.ip += 1;
}
