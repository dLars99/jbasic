import type { StatementHandler } from "../basic";

export const handleNext: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(/^NEXT(?:\s+([A-Za-z][A-Za-z0-9_]*))?/i);
  const varName = match && match[1] ? match[1] : null;
  if (ctx.loopStack.length === 0) {
    ctx.instructionPointer += 1;
    return;
  }
  const topFrame = ctx.loopStack[ctx.loopStack.length - 1];
  if (varName && varName !== topFrame.name) {
    ctx.instructionPointer += 1;
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
