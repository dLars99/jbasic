import { RunnerCtx } from "./context";
import { handleStatement } from "./utils/handleStatement";

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
  let stopped = false;

  return (function runnerFactory() {
    let instructionPointer = 0;
    const maxStepsPerTick = 500;

    const ctx = new RunnerCtx(code, onOutput, onInput);

    async function run() {
      let steps = 0;
      let executedInstructions = 0;
      while (instructionPointer < ctx.statements.length && !stopped) {
        const statement = ctx.statements[instructionPointer].text;
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
        await handleStatement(ctx, statement);
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
