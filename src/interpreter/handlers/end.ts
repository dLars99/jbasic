import type { RunnerCtx } from "../basic";
export function handleEnd(ctx: RunnerCtx, _stmt: string) {
  ctx.ip = ctx.stmts.length;
}
