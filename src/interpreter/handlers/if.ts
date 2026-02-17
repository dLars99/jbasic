import type { RunnerCtx } from "../basic";
export function handleIf(ctx: RunnerCtx, stmt: string) {
  const m = stmt.match(/^IF\s+(.+)\s+THEN\s+(?:GOTO\s+)?([0-9]+)$/i);
  if (m) {
    const [, condition, targetStr] = m;
    const cond = ctx.safeEvalExpr(condition);
    if (cond) {
      const tnum = Number(targetStr);
      if (ctx.lineToIndex[tnum] != null) ctx.ip = ctx.lineToIndex[tnum];
      else ctx.ip = ctx.stmts.length;
    } else {
      ctx.ip += 1;
    }
  } else {
    ctx.ip += 1;
  }
}
