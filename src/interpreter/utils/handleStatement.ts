import { RunnerCtx } from "../context";
import {
  handleEnd,
  handleFor,
  handleGoto,
  handleIf,
  handleInput,
  handleLet,
  handleNext,
  handlePrint,
} from "../handlers";

export const handleStatement = async (ctx: RunnerCtx, statement: string) => {
  const trimmedStmt = statement.trim(); // Functionalize: map statement to handler
  try {
    let res: any;
    if (/^PRINT\b/i.test(trimmedStmt)) {
      res = handlePrint(ctx, statement);
    } else if (/^LET\b/i.test(trimmedStmt)) {
      res = handleLet(ctx, statement);
    } else if (/^GOTO\b/i.test(trimmedStmt)) {
      res = handleGoto(ctx, statement);
    } else if (/^IF\b/i.test(trimmedStmt)) {
      res = handleIf(ctx, statement);
    } else if (/^FOR\b/i.test(trimmedStmt)) {
      res = handleFor(ctx, statement);
    } else if (/^NEXT\b/i.test(trimmedStmt)) {
      res = handleNext(ctx, statement);
    } else if (/^INPUT\b/i.test(trimmedStmt)) {
      res = handleInput(ctx, statement);
    } else if (/^END\b/i.test(trimmedStmt)) {
      res = handleEnd(ctx, statement);
    } else {
      ctx.onOutput("UNRECOGNIZED: " + statement);
      ctx.instructionPointer += 1;
    }

    if (res && typeof res.then === "function") await res;
  } catch (err) {
    console.error("runtime handler error", err);
    ctx.instructionPointer += 1;
  }
};
