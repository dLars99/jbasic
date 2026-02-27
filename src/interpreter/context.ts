import { getStatementsWithLineNumbers } from "./utils/getStatementsWithLineNumbers";
import { safeEvalExpr } from "./utils/safeEvalExpr";

export type Environment = Record<string, string | number | undefined>;
export type Statement = { lineno: number | null; text: string };
export type LineNumberIndexMap = Record<number, number>;
export type StackFrame = {
  name: string;
  end: number;
  step: number;
  loopInstruction: number;
};

export class RunnerCtx {
  environment: Environment;
  instructionPointer: number;
  loopStack: StackFrame[];
  readonly lineNumberToIndex: LineNumberIndexMap;
  readonly statements: Statement[];
  readonly onOutput: (output: string) => void;
  readonly onInput: (prompt: string) => Promise<string>;
  readonly evaluateExpression: (expr: string) => any;

  constructor(
    code: string,
    onOutput: (output: string) => void,
    onInput: (prompt: string) => Promise<string>,
  ) {
    const { statements, lineNumberToIndex } =
      getStatementsWithLineNumbers(code);
    this.environment = Object.create(null);
    this.instructionPointer = 0;
    this.lineNumberToIndex = lineNumberToIndex;
    this.loopStack = [];
    this.statements = statements;
    this.onOutput = onOutput;
    this.onInput = onInput;
    this.evaluateExpression = (expr: string) =>
      safeEvalExpr(expr, this.environment);
  }
}
