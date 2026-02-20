import { handlePrint } from "./handlers/print";
import { handleLet } from "./handlers/let";
import { handleGoto } from "./handlers/goto";
import { handleIf } from "./handlers/if";
import { handleFor } from "./handlers/for";
import { handleNext } from "./handlers/next";
import { handleInput } from "./handlers/input";
import { handleEnd } from "./handlers/end";

type Environment = Record<string, string | number | undefined>;
export type Statement = { lineno: number | null; text: string };
type LineNumberIndexMap = Record<number, number>;
type StackFrame = {
  name: string;
  end: number;
  step: number;
  loopInstruction: number;
};

export type RunnerCtx = {
  environment: Environment;
  statements: Statement[];
  lineNumberToIndex: LineNumberIndexMap;
  loopStack: StackFrame[];
  onOutput: (output: string) => void;
  onInput: (prompt: string) => Promise<string>;
  safeEvalExpr: (expr: string) => any;
  instructionPointer: number;
};

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
  const rawLines = code.split(/\r?\n/).map((raw) => raw.replace(/\r/g, ""));

  const statements: Statement[] = [];
  const lineNumberToIndex: LineNumberIndexMap = Object.create(null);
  rawLines.forEach((rawLine) => {
    const text = rawLine.trim();
    if (!text) return;
    const match = text.match(/^\s*([0-9]+)\s+(.*)$/); // Functionalize: get statements
    if (match) {
      const lineno = Number(match[1]);
      const body = match[2].trim();
      lineNumberToIndex[lineno] = statements.length;
      statements.push({ lineno, text: body });
    } else {
      statements.push({ lineno: null, text });
    }
  });

  const environment: Environment = Object.create(null);
  let stopped = false;

  function safeEvalExpr(expr: string) {
    expr = String(expr).trim();
    if (/^".*"$/.test(expr)) return expr.slice(1, -1);
    // Replace identifiers only outside quoted literals
    let out = "";
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch === '"') {
        let j = i + 1;
        while (j < expr.length) {
          if (expr[j] === '"') {
            j++;
            break;
          }
          j++;
        }
        out += expr.slice(i, j);
        i = j;
      } else {
        let j = i;
        while (j < expr.length && expr[j] !== '"') j++; // Abstract: find next quote index or end of string
        const codePart = expr.slice(i, j);
        const replacedPart = codePart.replace(
          // replacing codePart to handle variable substitution, only for valid identifiers
          /[A-Za-z][A-Za-z0-9_]*/g,
          (name) => {
            const val = environment[name];
            if (typeof val === "string")
              return `"${String(val).replace(/"/g, '\\"')}"`; // Abstract: escape quotes in string values
            if (val == null) return "0";
            return String(val);
          },
        );
        out += replacedPart;
        i = j;
      }
    }
    try {
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${out})`)();
    } catch (err) {
      try {
        console.error("safeEvalExpr error", err, "expr:", expr, "eval->", out);
      } catch (_) {}
      return 0;
    }
  }

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

    return {
      // preassign start and stop for readability?
      start() {
        stopped = false;
        instructionPointer = 0;
        run();
      },
      stop() {
        stopped = true;
      },
    };
  })();
}
