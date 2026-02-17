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
  env: Record<string, string | number | undefined>;
  stmts: Stmt[];
  lineToIndex: Record<number, number>;
  forStack: Array<{ name: string; end: number; step: number; loopIp: number }>;
  onOutput: (s: string) => void;
  onInput: (prompt: string) => Promise<string>;
  safeEvalExpr: (expr: string) => any;
  ip: number;
};

export function createRunner(
  code: string,
  onOutput: (s: string) => void = () => {},
  onInput: (prompt: string) => Promise<string> = async () => "",
) {
  const rawLines = code.split(/\r?\n/).map((l) => l.replace(/\r/g, ""));

  const stmts: Stmt[] = [];
  const lineToIndex: Record<number, number> = Object.create(null);
  rawLines.forEach((l) => {
    const text = l.trim();
    if (!text) return;
    const m = text.match(/^\s*([0-9]+)\s+(.*)$/);
    if (m) {
      const lineno = Number(m[1]);
      const body = m[2].trim();
      lineToIndex[lineno] = stmts.length;
      stmts.push({ lineno, text: body });
    } else {
      stmts.push({ lineno: null, text });
    }
  });

  const env: Record<string, string | number | undefined> = Object.create(null);
  let stopped = false;

  function safeEvalExpr(expr: string) {
    expr = String(expr).trim();
    if (/^".*"$/.test(expr)) return expr.slice(1, -1);
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
            const v = env[name];
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
    } catch (e) {
      try {
        console.error("safeEvalExpr error", e, "expr:", expr, "eval->", out);
      } catch (_) {}
      return 0;
    }
  }

  return (function runnerFactory() {
    let ip = 0;
    const forStack: RunnerCtx["forStack"] = [];
    const maxStepsPerTick = 500;

    const ctx: RunnerCtx = {
      env,
      stmts,
      lineToIndex,
      forStack,
      onOutput,
      onInput,
      safeEvalExpr,
      ip: 0,
    };

    async function run() {
      let steps = 0;
      while (ip < stmts.length && !stopped) {
        const stmt = stmts[ip].text;
        steps += 1;
        if (steps >= maxStepsPerTick) {
          steps = 0;
          await new Promise((r) => setTimeout(r, 0));
          if (stopped) break;
        }

        ctx.ip = ip;
        const up = stmt.trim();
        try {
          let res: any;
          if (/^PRINT\b/i.test(up)) {
            res = handlePrint(ctx, stmt);
          } else if (/^LET\b/i.test(up)) {
            res = handleLet(ctx, stmt);
          } else if (/^GOTO\b/i.test(up)) {
            res = handleGoto(ctx, stmt);
          } else if (/^IF\b/i.test(up)) {
            res = handleIf(ctx, stmt);
          } else if (/^FOR\b/i.test(up)) {
            res = handleFor(ctx, stmt);
          } else if (/^NEXT\b/i.test(up)) {
            res = handleNext(ctx, stmt);
          } else if (/^INPUT\b/i.test(up)) {
            res = handleInput(ctx, stmt);
          } else if (/^END\b/i.test(up)) {
            res = handleEnd(ctx, stmt);
          } else {
            onOutput("UNRECOGNIZED: " + stmt);
            ctx.ip += 1;
          }

          if (res && typeof res.then === "function") await res;
        } catch (e) {
          try {
            console.error("runtime handler error", e);
          } catch (_) {}
          ctx.ip += 1;
        }

        ip = ctx.ip;
      }
      onOutput("[Program finished]");
    }

    return {
      start() {
        stopped = false;
        ip = 0;
        run();
      },
      stop() {
        stopped = true;
      },
    };
  })();
}
