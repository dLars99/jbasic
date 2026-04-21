import { describe, it, expect } from "vitest";
import { safeEvalExpr } from "./safeEvalExpr";

describe("safeEvalExpr", () => {
  const emptyEnv = {};

  it("should evaluate simple arithmetic", () => {
    expect(safeEvalExpr("1 + 2", emptyEnv)).toBe(3);
  });

  it("should handle arithmetic precedence", () => {
    expect(safeEvalExpr("1 + 2 * 3", emptyEnv)).toBe(7);
  });

  it("should handle string concatenation", () => {
    expect(safeEvalExpr('"a" + "b"', emptyEnv)).toBe("ab");
  });

  it("should handle comparison operators", () => {
    expect(safeEvalExpr("1 = 1", emptyEnv)).toBe(1); // true -> 1
    expect(safeEvalExpr("1 <> 2", emptyEnv)).toBe(1); // true -> 1
    expect(safeEvalExpr("1 < 2", emptyEnv)).toBe(1);
    expect(safeEvalExpr("2 <= 2", emptyEnv)).toBe(1);
    expect(safeEvalExpr("3 > 2", emptyEnv)).toBe(1);
    expect(safeEvalExpr("3 >= 3", emptyEnv)).toBe(1);
  });

  it("should handle logical operators", () => {
    expect(safeEvalExpr("TRUE AND TRUE", emptyEnv)).toBe(1);
    expect(safeEvalExpr("TRUE OR FALSE", emptyEnv)).toBe(1);
    expect(safeEvalExpr("NOT FALSE", emptyEnv)).toBe(1);
  });

  it("should handle boolean literals", () => {
    expect(safeEvalExpr("TRUE", emptyEnv)).toBe(1);
    expect(safeEvalExpr("FALSE", emptyEnv)).toBe(0);
  });

  it("should handle identifier lookup", () => {
    const env = { x: 5, y: "hello" };
    expect(safeEvalExpr("x", env)).toBe(5);
    expect(safeEvalExpr("y", env)).toBe("hello");
  });

  it("should return 0 for undefined variables", () => {
    expect(safeEvalExpr("undefinedVar", emptyEnv)).toBe(0);
  });

  it("should return 0 for unsupported syntax", () => {
    expect(safeEvalExpr("SIN(1)", emptyEnv)).toBe(0);
    expect(safeEvalExpr("1 + * 2", emptyEnv)).toBe(0);
    expect(safeEvalExpr("1 ** 2", emptyEnv)).toBe(0); // unsupported operator
    expect(safeEvalExpr("1 & 2", emptyEnv)).toBe(0); // unsupported operator
  });

  it("should handle complex expressions", () => {
    expect(safeEvalExpr("1 + 2 * 3 - 4 / 2", emptyEnv)).toBe(5);
    expect(safeEvalExpr("(1 + 2) * (3 - 4)", emptyEnv)).toBe(-3);
  });

  it("should handle unary operators", () => {
    expect(safeEvalExpr("-5", emptyEnv)).toBe(-5);
    expect(safeEvalExpr("+5", emptyEnv)).toBe(5);
    expect(safeEvalExpr("NOT TRUE", emptyEnv)).toBe(0);
    expect(safeEvalExpr("NOT FALSE", emptyEnv)).toBe(1);
  });

  it("should handle string comparisons", () => {
    expect(safeEvalExpr('"a" = "a"', emptyEnv)).toBe(1);
    expect(safeEvalExpr('"a" <> "b"', emptyEnv)).toBe(1);
  });

  it("should handle mixed types in comparisons", () => {
    expect(safeEvalExpr("1 = 1", emptyEnv)).toBe(1);
    expect(safeEvalExpr("1 = '1'", emptyEnv)).toBe(1); // string comparison
  });

  it("should handle logical short-circuit like behavior", () => {
    expect(safeEvalExpr("FALSE AND (1/0)", emptyEnv)).toBe(0); // but since no short-circuit, but in this impl, it evaluates both, but 1/0 is inf, but toNumber handles
    // actually, since it evaluates both, but for safety, perhaps ok
  });

  it("should return 0 for empty or whitespace", () => {
    expect(safeEvalExpr("", emptyEnv)).toBe(0);
    expect(safeEvalExpr("   ", emptyEnv)).toBe(0);
  });

  it("should handle large numbers", () => {
    expect(safeEvalExpr("1000000", emptyEnv)).toBe(1000000);
  });

  it("should handle division by zero", () => {
    expect(safeEvalExpr("1 / 0", emptyEnv)).toBe(0);
  });
});
