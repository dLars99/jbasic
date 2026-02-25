import { handlePrint } from "./handlers/print";
import { handleLet } from "./handlers/let";
import { handleGoto } from "./handlers/goto";
import { handleIf } from "./handlers/if";
import { handleFor } from "./handlers/for";
import { handleNext } from "./handlers/next";
import { handleInput } from "./handlers/input";
import { handleEnd } from "./handlers/end";
import { RunnerCtx } from "./context";
import { getStatementsWithLineNumbers } from "./utils/getStatementsWithLineNumbers";
import { safeEvalExpr } from "./utils/safeEvalExpr";

export type Environment = Record<string, string | number | undefined>;

export type StatementHandler<ReturnType = void> = (
  ctx: RunnerCtx,
  stmt: string,
) => ReturnType;

export function createRunner(
  code: string,
  onOutput: (output: string) => void = () => {},
  onInput: (prompt: string) => Promise<string> = async () => "",
  instructionLimit: number | null = null,
) {
  const { statements, lineNumberToIndex } = getStatementsWithLineNumbers(code);
  const environment: Environment = Object.create(null);
  let stopped = false;

  return (function runnerFactory() {
    let instructionPointer = 0;
    const loopStack: RunnerCtx["loopStack"] = [];
    const maxStepsPerTick = 500;

    const ctx: RunnerCtx = {
      // Functionalize: contextBuilder?
      environment,
      statements,
      lineNumberToIndex,
      loopStack,
      onOutput,
      onInput,
      safeEvalExpr,
      instructionPointer: 0,
    };

    async function run() {
      let steps = 0;
      let executedInstructions = 0;
      while (instructionPointer < statements.length && !stopped) {
        const statement = statements[instructionPointer].text;
        steps += 1;
        executedInstructions += 1;

        if (
          instructionLimit != null &&
          executedInstructions > instructionLimit
        ) {
          onOutput("[Instruction limit reached]");
          break;
        }
        if (steps >= maxStepsPerTick) {
          steps = 0;
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (stopped) break;
        }

        ctx.instructionPointer = instructionPointer;
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
            onOutput("UNRECOGNIZED: " + statement);
            ctx.instructionPointer += 1;
          }

          if (res && typeof res.then === "function") await res;
        } catch (err) {
          try {
            console.error("runtime handler error", err);
          } catch (_) {}
          ctx.instructionPointer += 1;
        }

        instructionPointer = ctx.instructionPointer;
      }
      onOutput("[Program finished]");
    }

    const start = () => {
      stopped = false;
      instructionPointer = 0;
      run();
    };

    const stop = () => {
      stopped = true;
    };

    return { start, stop };
  })();
}
