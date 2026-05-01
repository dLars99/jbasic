import type { StatementHandler } from "../basic";

export const handleGoto: StatementHandler = function (ctx, stmt) {
  const rest = stmt.replace(/^GOTO\b/i, "").trim();
  const target = Number(rest) || null;
  if (target != null && target >= 0 && ctx.lineNumberToIndex[target] != null) {
    ctx.instructionPointer = ctx.lineNumberToIndex[target];
  } else if (target != null && target >= 0) {
    ctx.onOutput("UNDEF'D LINE NUMBER " + target);
    ctx.hasError = true;
  } else if (target != null && target < 0) {
    ctx.onOutput("ILLEGAL QUANTITY");
    ctx.hasError = true;
  } else {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
  }
};
