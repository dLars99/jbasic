import type { StatementHandler } from "../basic";

export const handleFor: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(
    /^FOR\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i,
  );
  if (match) {
    const [, name, startExpr, endExpr, stepExpr] = match;
    const start = ctx.safeEvalExpr(startExpr, ctx.environment);
    const end = ctx.safeEvalExpr(endExpr, ctx.environment);
    const step = stepExpr ? ctx.safeEvalExpr(stepExpr, ctx.environment) : 1;
    ctx.environment[name] = start;
    ctx.loopStack.push({
      name,
      end,
      step,
      loopInstruction: ctx.instructionPointer,
    });
  }
  ctx.instructionPointer += 1;
};
