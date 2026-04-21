import { describe, it, expect } from "vitest";
import { isRuntimeToOpenerMessage, isOpenerToRuntimeMessage } from "./messages";

describe("isRuntimeToOpenerMessage", () => {
  it("should accept valid ready message", () => {
    expect(isRuntimeToOpenerMessage({ type: "ready" })).toBe(true);
  });

  it("should accept valid output message", () => {
    expect(isRuntimeToOpenerMessage({ type: "output", payload: "test" })).toBe(
      true,
    );
  });

  it("should accept valid inputRequest message", () => {
    expect(
      isRuntimeToOpenerMessage({ type: "inputRequest", prompt: "Enter:" }),
    ).toBe(true);
  });

  it("should reject invalid types", () => {
    expect(isRuntimeToOpenerMessage({ type: "invalid" })).toBe(false);
    expect(isRuntimeToOpenerMessage({ type: 123 })).toBe(false);
  });

  it("should reject non-objects", () => {
    expect(isRuntimeToOpenerMessage(null)).toBe(false);
    expect(isRuntimeToOpenerMessage("string")).toBe(false);
    expect(isRuntimeToOpenerMessage(123)).toBe(false);
  });

  it("should reject output without string payload", () => {
    expect(isRuntimeToOpenerMessage({ type: "output", payload: 123 })).toBe(
      false,
    );
  });

  it("should reject inputRequest without string prompt", () => {
    expect(
      isRuntimeToOpenerMessage({ type: "inputRequest", prompt: 123 }),
    ).toBe(false);
  });
});

describe("isOpenerToRuntimeMessage", () => {
  it("should accept valid run message", () => {
    expect(isOpenerToRuntimeMessage({ type: "run", code: "PRINT 1" })).toBe(
      true,
    );
  });

  it("should accept valid stop message", () => {
    expect(isOpenerToRuntimeMessage({ type: "stop" })).toBe(true);
  });

  it("should accept valid input message", () => {
    expect(isOpenerToRuntimeMessage({ type: "input", value: "test" })).toBe(
      true,
    );
  });

  it("should reject invalid types", () => {
    expect(isOpenerToRuntimeMessage({ type: "invalid" })).toBe(false);
  });

  it("should reject run without string code", () => {
    expect(isOpenerToRuntimeMessage({ type: "run", code: 123 })).toBe(false);
  });

  it("should reject non-objects", () => {
    expect(isOpenerToRuntimeMessage(null)).toBe(false);
    expect(isOpenerToRuntimeMessage("string")).toBe(false);
  });
});
