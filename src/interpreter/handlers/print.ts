import type { RunnerCtx } from "../basic";
export function handlePrint(ctx: RunnerCtx, stmt: string) {
  const expr = stmt.replace(/^PRINT\b/i, "").trim();
  const out = ctx.safeEvalExpr(expr);
  ctx.onOutput(String(out));
  ctx.ip += 1;
}
