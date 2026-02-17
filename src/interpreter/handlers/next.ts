import type { RunnerCtx } from "../basic";
export function handleNext(ctx: RunnerCtx, stmt: string) {
  const m = stmt.match(/^NEXT(?:\s+([A-Za-z][A-Za-z0-9_]*))?/i);
  const varName = m && m[1] ? m[1] : null;
  if (ctx.forStack.length === 0) {
    ctx.ip += 1;
    return;
  }
  const top = ctx.forStack[ctx.forStack.length - 1];
  if (varName && varName !== top.name) {
    ctx.ip += 1;
    return;
  }
  ctx.env[top.name] = (ctx.env[top.name] as number) + top.step;
  const reached =
    top.step >= 0
      ? (ctx.env[top.name] as number) <= top.end
      : (ctx.env[top.name] as number) >= top.end;
  if (reached) {
    ctx.ip = top.loopIp + 1;
  } else {
    ctx.forStack.pop();
    ctx.ip += 1;
  }
}
