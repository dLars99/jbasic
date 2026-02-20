import type { StatementHandler } from "../basic";

export const handleInput: StatementHandler<Promise<void>> = async function (
  ctx,
  stmt,
) {
  let name: string | null = null;
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
      const val = await ctx.onInput(promptText);
      const num = Number(val);
      ctx.environment[name] = isNaN(num) ? String(val) : num;
    } catch (err) {
      ctx.environment[name] = 0;
    }
  }
  ctx.instructionPointer += 1;
};
