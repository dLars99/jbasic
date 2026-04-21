import type { StatementHandler } from "../basic";
import { LOOP_ITERATION_LIMIT } from "../context";

export const handleFor: StatementHandler = function (ctx, stmt) {
  const match = stmt.match(
    /^FOR\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i,
  );
  if (!match) {
    const lineNo = ctx.statements[ctx.instructionPointer].lineno;
    ctx.onOutput("SYNTAX ERROR IN LINE " + (lineNo || "???"));
    ctx.hasError = true;
    return;
  }
  if (match) {
    const [, name, startExpr, endExpr, stepExpr] = match;
    const start = Number(ctx.evaluateExpression(startExpr));
    const end = Number(ctx.evaluateExpression(endExpr));
    const step = stepExpr ? Number(ctx.evaluateExpression(stepExpr)) : 1;

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      !Number.isFinite(step)
    ) {
      ctx.onOutput("TYPE MISMATCH");
      ctx.instructionPointer += 1;
      return;
    }
    if (step === 0) {
      ctx.onOutput("ZERO STEP");
      ctx.instructionPointer += 1;
      return;
    }

    const directionInvalid = step > 0 ? start > end : start < end;
    const projectedIterations = directionInvalid
      ? 0
      : Math.floor(Math.abs((end - start) / step)) + 1;
    if (projectedIterations > LOOP_ITERATION_LIMIT) {
      ctx.onOutput("LOOP ITERATION LIMIT EXCEEDED");
      ctx.instructionPointer = ctx.statements.length;
      return;
    }

    ctx.environment[name] = start;
    ctx.loopStack.push({
      name,
      end,
      step,
      loopInstruction: ctx.instructionPointer,
      iterations: 0,
    });
  }
  ctx.instructionPointer += 1;
};
