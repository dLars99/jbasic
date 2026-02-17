import type { RunnerCtx } from "../basic";
export function handleFor(ctx: RunnerCtx, stmt: string) {
  const m = stmt.match(
    /^FOR\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i,
  );
  if (m) {
    const [, name, startExpr, endExpr, stepExpr] = m;
    const start = ctx.safeEvalExpr(startExpr);
    const end = ctx.safeEvalExpr(endExpr);
    const step = stepExpr ? ctx.safeEvalExpr(stepExpr) : 1;
    ctx.env[name] = start;
    ctx.forStack.push({ name, end, step, loopIp: ctx.ip });
  }
  ctx.ip += 1;
}
