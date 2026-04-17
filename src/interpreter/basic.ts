import { RunnerCtx } from "./context";
import { handleStatement } from "./utils/handleStatement";

export type Environment = Record<string, string | number | undefined>;

export type StatementHandler<ReturnType = void> = (
  ctx: RunnerCtx,
  stmt: string,
) => ReturnType;

export const DEFAULT_INSTRUCTION_LIMIT = 10000;
export const MIN_INSTRUCTION_LIMIT = 1;
export const MAX_INSTRUCTION_LIMIT = 1000000;

const normalizeInstructionLimit = (value: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_INSTRUCTION_LIMIT;
  const rounded = Math.trunc(numeric);
  if (rounded < MIN_INSTRUCTION_LIMIT) return MIN_INSTRUCTION_LIMIT;
  if (rounded > MAX_INSTRUCTION_LIMIT) return MAX_INSTRUCTION_LIMIT;
  return rounded;
};

export function createRunner(
  code: string,
  onOutput: (output: string) => void = () => {},
  onInput: (prompt: string) => Promise<string> = async () => "",
  instructionLimit: number = DEFAULT_INSTRUCTION_LIMIT,
) {
  let stopped = false;
  const safeInstructionLimit = normalizeInstructionLimit(instructionLimit);

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

        if (executedInstructions > safeInstructionLimit) {
          onOutput("INSTRUCTION LIMIT REACHED");
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
      onOutput("PROGRAM FINISHED");
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
