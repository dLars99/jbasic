import type { StatementHandler } from "../basic";

export const handleEnd: StatementHandler = function (ctx, _stmt) {
  ctx.instructionPointer = ctx.statements.length;
};
