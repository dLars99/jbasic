export function createRunner(
  code,
  onOutput = () => {},
  onInput = async () => "",
) {
  // A small line-number aware interpreter supporting:
  // PRINT, LET, GOTO, IF ... THEN, FOR/NEXT, INPUT, END
  const rawLines = code.split(/\r?\n/).map((l) => l.replace(/\r/g, ""));

  const stmts = [];
  const lineToIndex = Object.create(null);
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

  const env = Object.create(null);
  let stopped = false;

  function safeEvalExpr(expr) {
    expr = String(expr).trim();
    if (/^".*"$/.test(expr)) return expr.slice(1, -1);
    // Replace identifiers only outside of quoted string literals.
    let out = "";
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch === '"') {
        // copy quoted literal unchanged
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
        // gather until next quote
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
    const forStack = [];
    const maxStepsPerTick = 500;

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

        const up = stmt.trim();
        if (/^PRINT\b/i.test(up)) {
          const expr = stmt.replace(/^PRINT\b/i, "").trim();
          const out = safeEvalExpr(expr);
          onOutput(String(out));
          ip += 1;
        } else if (/^LET\b/i.test(up)) {
          const rhs = stmt.replace(/^LET\b/i, "").trim();
          const m = rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
          if (m) {
            const [, name, expr] = m;
            env[name] = safeEvalExpr(expr);
          }
          ip += 1;
        } else if (/^GOTO\b/i.test(up)) {
          const rest = stmt.replace(/^GOTO\b/i, "").trim();
          const target = Number(rest) || null;
          if (target != null && lineToIndex[target] != null) {
            ip = lineToIndex[target];
          } else {
            ip = stmts.length; // end
          }
        } else if (/^IF\b/i.test(up)) {
          // IF <expr> THEN <lineno>  -- also accept THEN GOTO <lineno>
          const m = stmt.match(/^IF\s+(.+)\s+THEN\s+(?:GOTO\s+)?([0-9]+)$/i);
          if (m) {
            const [, condition, targetStr] = m;
            const cond = safeEvalExpr(condition);
            if (cond) {
              const tnum = Number(targetStr);
              if (lineToIndex[tnum] != null) ip = lineToIndex[tnum];
              else ip = stmts.length;
            } else {
              ip += 1;
            }
          } else {
            ip += 1;
          }
        } else if (/^FOR\b/i.test(up)) {
          // FOR var = start TO end [STEP step]
          const m = stmt.match(
            /^FOR\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i,
          );
          if (m) {
            const [, name, startExpr, endExpr, stepExpr] = m;
            const start = safeEvalExpr(startExpr);
            const end = safeEvalExpr(endExpr);
            const step = stepExpr ? safeEvalExpr(stepExpr) : 1;
            env[name] = start;
            forStack.push({ name, end, step, loopIp: ip });
          }
          ip += 1;
        } else if (/^NEXT\b/i.test(up)) {
          // NEXT [var]
          const m = stmt.match(/^NEXT(?:\s+([A-Za-z][A-Za-z0-9_]*))?/i);
          const varName = m && m[1] ? m[1] : null;
          if (forStack.length === 0) {
            ip += 1;
            continue;
          }
          const top = forStack[forStack.length - 1];
          if (varName && varName !== top.name) {
            ip += 1;
            continue;
          }
          env[top.name] = env[top.name] + top.step;
          const reached =
            top.step >= 0 ? env[top.name] <= top.end : env[top.name] >= top.end;
          if (reached) {
            ip = top.loopIp + 1; // continue after FOR
          } else {
            forStack.pop();
            ip += 1;
          }
        } else if (/^INPUT\b/i.test(up)) {
          // INPUT ["prompt"] var
          // match: INPUT "Prompt text" VARNAME  OR  INPUT VARNAME
          let name = null;
          let promptText = "";
          const mQuoted = stmt.match(
            /^INPUT\s+"([^"]*)"\s+([A-Za-z][A-Za-z0-9_]*)\s*$/i,
          );
          const mSimple = stmt.match(/^INPUT\s+([A-Za-z][A-Za-z0-9_]*)\s*$/i);
          if (mQuoted) {
            promptText = mQuoted[1];
            name = mQuoted[2];
          } else if (mSimple) {
            name = mSimple[1];
            promptText = "";
          }
          if (name) {
            try {
              const val = await onInput(promptText);
              const num = Number(val);
              env[name] = isNaN(num) ? String(val) : num;
            } catch (e) {
              env[name] = 0;
            }
          }
          ip += 1;
        } else if (/^END\b/i.test(up)) {
          break;
        } else {
          onOutput("UNRECOGNIZED: " + stmt);
          ip += 1;
        }
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
