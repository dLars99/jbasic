import type { StatementHandler } from "../basic";

export const handleGoto: StatementHandler = function (ctx, stmt) {
  const rest = stmt.replace(/^GOTO\b/i, "").trim();
  const target = Number(rest) || null;
  if (target != null && ctx.lineNumberToIndex[target] != null) {
    ctx.instructionPointer = ctx.lineNumberToIndex[target];
  } else {
    ctx.instructionPointer = ctx.statements.length;
  }
};
