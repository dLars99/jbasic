import { handlePrint } from "./handlers/print";
import { handleLet } from "./handlers/let";
import { handleGoto } from "./handlers/goto";
import { handleIf } from "./handlers/if";
import { handleFor } from "./handlers/for";
import { handleNext } from "./handlers/next";
import { handleInput } from "./handlers/input";
import { handleEnd } from "./handlers/end";

export type Stmt = { lineno: number | null; text: string };

export type RunnerCtx = {
  environment: Record<string, string | number | undefined>;
  statements: Stmt[];
  lineNumberToIndex: Record<number, number>;
  loopStack: Array<{
    name: string;
    end: number;
    step: number;
    loopInstruction: number;
  }>;
  onOutput: (s: string) => void;
  onInput: (prompt: string) => Promise<string>;
  safeEvalExpr: (expr: string) => any;
  instructionPointer: number;
};

export function createRunner(
  code: string,
  onOutput: (s: string) => void = () => {},
  onInput: (prompt: string) => Promise<string> = async () => "",
) {
  const rawLines = code.split(/\r?\n/).map((l) => l.replace(/\r/g, ""));

  const statements: Stmt[] = [];
  const lineNumberToIndex: Record<number, number> = Object.create(null);
  rawLines.forEach((l) => {
    const text = l.trim();
    if (!text) return;
    const match = text.match(/^\s*([0-9]+)\s+(.*)$/);
    if (match) {
      const lineno = Number(match[1]);
      const body = match[2].trim();
      lineNumberToIndex[lineno] = statements.length;
      statements.push({ lineno, text: body });
    } else {
      statements.push({ lineno: null, text });
    }
  });

  const environment: Record<string, string | number | undefined> =
    Object.create(null);
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
        while (j < expr.length && expr[j] !== '"') j++;
        const codePart = expr.slice(i, j);
        const replacedPart = codePart.replace(
          /[A-Za-z][A-Za-z0-9_]*/g,
          (name) => {
            const v = environment[name];
            if (typeof v === "string")
              return `"${String(v).replace(/"/g, '\\"')}"`;
            if (v == null) return "0";
            return String(v);
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
      while (instructionPointer < statements.length && !stopped) {
        const stmt = statements[instructionPointer].text;
        steps += 1;
        if (steps >= maxStepsPerTick) {
          steps = 0;
          await new Promise((r) => setTimeout(r, 0));
          if (stopped) break;
        }

        ctx.instructionPointer = instructionPointer;
        const trimmedStmt = stmt.trim();
        try {
          let res: any;
          if (/^PRINT\b/i.test(trimmedStmt)) {
            res = handlePrint(ctx, stmt);
          } else if (/^LET\b/i.test(trimmedStmt)) {
            res = handleLet(ctx, stmt);
          } else if (/^GOTO\b/i.test(trimmedStmt)) {
            res = handleGoto(ctx, stmt);
          } else if (/^IF\b/i.test(trimmedStmt)) {
            res = handleIf(ctx, stmt);
          } else if (/^FOR\b/i.test(trimmedStmt)) {
            res = handleFor(ctx, stmt);
          } else if (/^NEXT\b/i.test(trimmedStmt)) {
            res = handleNext(ctx, stmt);
          } else if (/^INPUT\b/i.test(trimmedStmt)) {
            res = handleInput(ctx, stmt);
          } else if (/^END\b/i.test(trimmedStmt)) {
            res = handleEnd(ctx, stmt);
          } else {
            onOutput("UNRECOGNIZED: " + stmt);
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
