import type { StatementHandler } from "../basic";

export const handleEnd: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(/^END$/i);
  if (match) {
    ctx.instructionPointer = ctx.statements.length;
  } else {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
  }
};
