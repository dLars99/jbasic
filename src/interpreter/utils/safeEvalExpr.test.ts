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
  });

  it("should return 0 for invalid expressions", () => {
    expect(safeEvalExpr("", emptyEnv)).toBe(0);
    expect(safeEvalExpr("invalid syntax +++", emptyEnv)).toBe(0);
  });
});
