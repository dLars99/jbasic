import type { StatementHandler } from "../basic";
import { LOOP_ITERATION_LIMIT } from "../context";

export const handleNext: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(/^NEXT(?:\s+([A-Za-z][A-Za-z0-9_]*))?$/i);
  if (!match) {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
    return;
  }
  const varName = match[1] ? match[1] : null;
  if (ctx.loopStack.length === 0) {
    ctx.onOutput("NEXT WITHOUT FOR");
    ctx.hasError = true;
    return;
  }
  const topFrame = ctx.loopStack[ctx.loopStack.length - 1];
  if (varName && varName !== topFrame.name) {
    ctx.instructionPointer += 1;
    return;
  }
  topFrame.iterations += 1;
  if (topFrame.iterations > LOOP_ITERATION_LIMIT) {
    ctx.onOutput("LOOP ITERATION LIMIT EXCEEDED");
    ctx.instructionPointer = ctx.statements.length;
    return;
  }
  ctx.environment[topFrame.name] =
    (ctx.environment[topFrame.name] as number) + topFrame.step;
  const reached =
    topFrame.step >= 0
      ? (ctx.environment[topFrame.name] as number) <= topFrame.end
      : (ctx.environment[topFrame.name] as number) >= topFrame.end;
  if (reached) {
    ctx.instructionPointer = topFrame.loopInstruction + 1;
  } else {
    ctx.loopStack.pop();
    ctx.instructionPointer += 1;
  }
};
