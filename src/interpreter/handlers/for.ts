import type { RunnerCtx } from "../basic";

export function handleFor(ctx: RunnerCtx, stmt: string) {
  const match = stmt.match(
    /^FOR\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i,
  );
  if (match) {
    const [, name, startExpr, endExpr, stepExpr] = match;
    const start = ctx.safeEvalExpr(startExpr);
    const end = ctx.safeEvalExpr(endExpr);
    const step = stepExpr ? ctx.safeEvalExpr(stepExpr) : 1;
    ctx.environment[name] = start;
    ctx.loopStack.push({
      name,
      end,
      step,
      loopInstruction: ctx.instructionPointer,
    });
  }
  ctx.instructionPointer += 1;
}
