import type { RunnerCtx } from "../basic";
export function handleGoto(ctx: RunnerCtx, stmt: string) {
  const rest = stmt.replace(/^GOTO\b/i, "").trim();
  const target = Number(rest) || null;
  if (target != null && ctx.lineToIndex[target] != null) {
    ctx.ip = ctx.lineToIndex[target];
  } else {
    ctx.ip = ctx.stmts.length;
  }
}
