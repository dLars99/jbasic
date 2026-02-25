import type { StatementHandler } from "../basic";

export const handleIf: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(/^IF\s+(.+)\s+THEN\s+(?:GOTO\s+)?([0-9]+)$/i);
  if (match) {
    const [, condition, targetStr] = match;
    const cond = ctx.safeEvalExpr(condition, ctx.environment);
    if (cond) {
      const targetLineNumber = Number(targetStr);
      if (ctx.lineNumberToIndex[targetLineNumber] != null)
        ctx.instructionPointer = ctx.lineNumberToIndex[targetLineNumber];
      else ctx.instructionPointer = ctx.statements.length;
    } else {
      ctx.instructionPointer += 1;
    }
  } else {
    ctx.instructionPointer += 1;
  }
};
