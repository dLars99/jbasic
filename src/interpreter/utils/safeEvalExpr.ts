import jsep from "jsep";
import { Environment } from "../context";

type JsepExpression = jsep.Expression;
type JsepBinaryExpression = jsep.BinaryExpression;
type JsepUnaryExpression = jsep.UnaryExpression;
type JsepIdentifier = jsep.Identifier;
type JsepLiteral = jsep.Literal;

const isWordBoundary = (char: string | undefined): boolean => {
  return char === undefined || /[^A-Za-z0-9_]/.test(char);
};

// Normalizes BASIC-style expressions to JavaScript-compatible syntax.
// Handles BASIC operators: <> -> !=, = -> == (in comparisons), AND -> &&, OR -> ||, NOT -> !
// Converts TRUE/FALSE to true/false.
// Preserves string literals (content within quotes).
// Ensures word boundaries for keywords to avoid false matches in identifiers.
export const normalizeExpression = (expr: string): string => {
  let output = "";
  let i = 0;
  let inString = false;

  while (i < expr.length) {
    const ch = expr[i];
    if (ch === '"') {
      inString = !inString;
      output += ch;
      i += 1;
      continue;
    }

    if (inString) {
      output += ch;
      i += 1;
      continue;
    }

    const rest = expr.slice(i);
    if (rest.startsWith("<>")) {
      output += "!=";
      i += 2;
      continue;
    }
    if (
      rest.startsWith("<=") ||
      rest.startsWith(">=") ||
      rest.startsWith("==") ||
      rest.startsWith("!=")
    ) {
      output += rest.slice(0, 2);
      i += 2;
      continue;
    }
    if (ch === "=") {
      output += "==";
      i += 1;
      continue;
    }

    const identMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (identMatch) {
      const token = identMatch[0];
      const nextChar = rest[token.length];
      const upper = token.toUpperCase();
      if (upper === "AND" && isWordBoundary(nextChar)) {
        output += "&&";
        i += token.length;
        continue;
      }
      if (upper === "OR" && isWordBoundary(nextChar)) {
        output += "||";
        i += token.length;
        continue;
      }
      if (upper === "NOT" && isWordBoundary(nextChar)) {
        output += "!";
        i += token.length;
        continue;
      }
      if (upper === "TRUE" && isWordBoundary(nextChar)) {
        output += "true";
        i += token.length;
        continue;
      }
      if (upper === "FALSE" && isWordBoundary(nextChar)) {
        output += "false";
        i += token.length;
        continue;
      }
    }

    output += ch;
    i += 1;
  }

  return output;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  return Boolean(value);
};

const evaluateExpressionTreeNode = (
  node: JsepExpression,
  environment: Environment,
): unknown => {
  switch (node.type) {
    case "BinaryExpression": {
      const binary = node as JsepBinaryExpression;
      const left = evaluateExpressionTreeNode(binary.left, environment);
      const right = evaluateExpressionTreeNode(binary.right, environment);
      switch (binary.operator) {
        case "+":
          return typeof left === "string" || typeof right === "string"
            ? String(left) + String(right)
            : toNumber(left) + toNumber(right);
        case "-":
          return toNumber(left) - toNumber(right);
        case "*":
          return toNumber(left) * toNumber(right);
        case "/": {
          const divisor = toNumber(right);
          return divisor === 0 ? 0 : toNumber(left) / divisor;
        }
        case "%":
          return toNumber(left) % toNumber(right);
        case "<":
          return toNumber(left) < toNumber(right) ? 1 : 0;
        case "<=":
          return toNumber(left) <= toNumber(right) ? 1 : 0;
        case ">":
          return toNumber(left) > toNumber(right) ? 1 : 0;
        case ">=":
          return toNumber(left) >= toNumber(right) ? 1 : 0;
        case "==":
          if (typeof left === "string" || typeof right === "string") {
            return String(left) === String(right) ? 1 : 0;
          }
          return toNumber(left) === toNumber(right) ? 1 : 0;
        case "!=":
          if (typeof left === "string" || typeof right === "string") {
            return String(left) !== String(right) ? 1 : 0;
          }
          return toNumber(left) !== toNumber(right) ? 1 : 0;
        case "&&":
          return toBoolean(left) && toBoolean(right) ? 1 : 0;
        case "||":
          return toBoolean(left) || toBoolean(right) ? 1 : 0;
        default:
          throw new Error(`Unsupported operator: ${node.operator}`);
      }
    }
    case "UnaryExpression": {
      const unary = node as JsepUnaryExpression;
      const value = evaluateExpressionTreeNode(unary.argument, environment);
      switch (unary.operator) {
        case "-":
          return -toNumber(value);
        case "+":
          return toNumber(value);
        case "!":
          return !toBoolean(value) ? 1 : 0;
        default:
          throw new Error(`Unsupported unary operator: ${node.operator}`);
      }
    }
    case "Literal": {
      const literal = node as JsepLiteral;
      if (typeof literal.value === "boolean") {
        return literal.value ? 1 : 0;
      }
      return literal.value;
    }
    case "Identifier": {
      const identifier = node as JsepIdentifier;
      const value = environment[identifier.name];
      return value === undefined || value === null ? 0 : value;
    }
    default:
      throw new Error(`Unsupported expression type: ${node.type}`);
  }
};

export function safeEvalExpr(expr: string, environment: Environment) {
  const normalizedExpr = normalizeExpression(String(expr).trim());
  if (!normalizedExpr) return 0;

  try {
    const expressionTreeRoot = jsep(normalizedExpr);
    // Explicit AST acceptance: only allow safe node types to prevent execution of unsupported expressions
    if (
      ![
        "BinaryExpression",
        "UnaryExpression",
        "Literal",
        "Identifier",
      ].includes(expressionTreeRoot.type)
    ) {
      return 0;
    }
    return evaluateExpressionTreeNode(expressionTreeRoot, environment);
  } catch (err) {
    // Parse/eval failures are intentionally converted to 0 as a safe runtime fallback for the interpreter.
    // This prevents crashes from invalid expressions while maintaining BASIC's permissive evaluation semantics.
    // Optional debug-only logging is available below for development.
    try {
      console.error(
        "safeEvalExpr error",
        err,
        "expr:",
        expr,
        "normalized:",
        normalizedExpr,
      );
    } catch (_) {}
    return 0;
  }
}
