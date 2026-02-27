import { Environment } from "../context";
import { getExpressionBetweenQuotes, parseVariables } from "./safeEvalUtils";

export function safeEvalExpr(expr: string, environment: Environment) {
  expr = String(expr).trim();
  if (/^".*"$/.test(expr)) return expr.slice(1, -1);
  // Replace identifiers only outside quoted literals
  let out = "";
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === '"') {
      const { foundExp, nextIndex } = getExpressionBetweenQuotes(expr, i);
      out += foundExp;
      i = nextIndex;
    } else {
      const { parsed, nextIndex } = parseVariables(expr, i, environment);
      out += parsed;
      i = nextIndex;
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
