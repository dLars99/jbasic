import { handlePrint } from "./handlers/print";
import { handleLet } from "./handlers/let";
import { handleGoto } from "./handlers/goto";
import { handleIf } from "./handlers/if";
import { handleFor } from "./handlers/for";
import { handleNext } from "./handlers/next";
import { handleInput } from "./handlers/input";
import { handleEnd } from "./handlers/end";
import { Parser } from "expr-eval";

export type Statement = { lineno: number | null; text: string };

export type RunnerCtx = {
  environment: Record<string, string | number | undefined>;
  statements: Statement[];
  lineNumberToIndex: Record<number, number>;
  loopStack: Array<{
    name: string;
    end: number;
    step: number;
    loopInstruction: number;
  }>;
  onOutput: (output: string) => void;
  onInput: (prompt: string) => Promise<string>;
  safeEvalExpr: (expr: string) => any;
  instructionPointer: number;
};

export function createRunner(
  code: string,
  onOutput: (output: string) => void = () => {},
  onInput: (prompt: string) => Promise<string> = async () => "",
  instructionLimit: number | null = null,
) {
  const rawLines = code.split(/\r?\n/).map((raw) => raw.replace(/\r/g, ""));

  const statements: Statement[] = [];
  const lineNumberToIndex: Record<number, number> = Object.create(null);
  rawLines.forEach((rawLine) => {
    const text = rawLine.trim();
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
    try {
      const parser = new Parser();
      // Normalize double-quoted BASIC strings to single-quoted literals for expr-eval
      // e.g. "Hello" -> 'Hello'
      let norm = "";
      let i = 0;
      while (i < expr.length) {
        const ch = expr[i];
        if (ch === '"') {
          let j = i + 1;
          let content = "";
          while (j < expr.length) {
            if (expr[j] === '"') {
              j++;
              break;
            }
            const c = expr[j];
            if (c === "'") content += "\\'";
            else content += c;
            j++;
          }
          norm += `'${content}'`;
          i = j;
        } else {
          norm += ch;
          i++;
        }
      }

      const parsed = parser.parse(norm);

      // Build variables map from environment, defaulting missing vars to 0
      const vars: Record<string, any> = Object.create(null);
      const usedVars = parsed.variables();
      for (const v of usedVars) {
        if (Object.prototype.hasOwnProperty.call(environment, v)) {
          vars[v] = environment[v];
        } else {
          vars[v] = 0;
        }
      }

      const value = parsed.evaluate(vars);

      // If evaluation produced NaN (commonly when adding strings using '+'),
      // fall back to BASIC-style concatenation: split on top-level '+' and
      // concatenate stringified segment values.
      if (
        typeof value === "number" &&
        isNaN(value) &&
        norm.indexOf("+") !== -1
      ) {
        // split on top-level plus signs (not inside quotes or parentheses)
        const parts: string[] = [];
        let depth = 0;
        let inQuote = false;
        let buffer = "";
        for (let i = 0; i < norm.length; i++) {
          const ch = norm[i];
          if (ch === "'") {
            inQuote = !inQuote;
            buffer += ch;
            continue;
          }
          if (!inQuote) {
            if (ch === "(") {
              depth++;
            } else if (ch === ")") {
              if (depth > 0) depth--;
            } else if (ch === "+" && depth === 0) {
              parts.push(buffer);
              buffer = "";
              continue;
            }
          }
          buffer += ch;
        }
        if (buffer.length) parts.push(buffer);

        const evaluatedParts = parts.map((p) => {
          const s = p.trim();
          if (!s) return "";
          try {
            const subParsed = parser.parse(s);
            const subVars: Record<string, any> = Object.create(null);
            for (const v of subParsed.variables()) {
              subVars[v] = Object.prototype.hasOwnProperty.call(environment, v)
                ? environment[v]
                : 0;
            }
            const subVal = subParsed.evaluate(subVars);
            return subVal == null ? "" : String(subVal);
          } catch (err) {
            // As a fallback, remove surrounding quotes if present
            if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1);
            return s;
          }
        });
        return evaluatedParts.join("");
      }

      return value;
    } catch (err) {
      try {
        console.error("safeEvalExpr error", err, "expr:", expr);
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
      let executedInstructions = 0;
      while (instructionPointer < statements.length && !stopped) {
        const stmt = statements[instructionPointer].text;
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
