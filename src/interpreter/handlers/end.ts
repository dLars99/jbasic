import type { RunnerCtx } from "../basic";

export function handleEnd(ctx: RunnerCtx, _stmt: string) {
  ctx.instructionPointer = ctx.statements.length;
}
