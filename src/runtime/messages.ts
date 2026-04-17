export type RuntimeToOpenerMessage =
  | { type: "ready" }
  | { type: "output"; payload: string }
  | { type: "inputRequest"; prompt: string };

export type OpenerToRuntimeMessage =
  | { type: "run"; code: string; instructionLimit?: number }
  | { type: "stop" }
  | { type: "input"; value: unknown };

export const isRuntimeToOpenerMessage = (
  value: unknown,
): value is RuntimeToOpenerMessage => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.type !== "string") return false;
  if (data.type === "ready") return true;
  if (data.type === "output") return typeof data.payload === "string";
  if (data.type === "inputRequest") return typeof data.prompt === "string";
  return false;
};

export const isOpenerToRuntimeMessage = (
  value: unknown,
): value is OpenerToRuntimeMessage => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.type !== "string") return false;
  if (data.type === "run") return typeof data.code === "string";
  if (data.type === "stop") return true;
  if (data.type === "input") return true;
  return false;
};
