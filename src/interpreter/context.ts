export type Environment = Record<string, string | number | undefined>;
export type Statement = { lineno: number | null; text: string };
export type LineNumberIndexMap = Record<number, number>;
export type StackFrame = {
  name: string;
  end: number;
  step: number;
  loopInstruction: number;
};

export interface RunnerCtx {
  environment: Environment;
  statements: Statement[];
  lineNumberToIndex: LineNumberIndexMap;
  loopStack: StackFrame[];
  readonly onOutput: (output: string) => void;
  readonly onInput: (prompt: string) => Promise<string>;
  readonly safeEvalExpr: (expr: string, environment: Environment) => any;
  instructionPointer: number;
}

// create class RunnerCtx to hold the execution context, including environment, statements, line number index map, loop stack, and utility functions
export class RunnerContext implements RunnerCtx {
  environment: Environment;
  statements: Statement[];
  lineNumberToIndex: LineNumberIndexMap;
  loopStack: StackFrame[];
  readonly onOutput: (output: string) => void;
  readonly onInput: (prompt: string) => Promise<string>;
  readonly safeEvalExpr: (expr: string, environment: Environment) => any;
  instructionPointer: number;

  constructor(
    statements: Statement[],
    lineNumberToIndex: LineNumberIndexMap,
    onOutput: (output: string) => void,
    onInput: (prompt: string) => Promise<string>,
    safeEvalExpr: (expr: string, environment: Environment) => any,
  ) {
    this.environment = Object.create(null);
    this.statements = statements;
    this.lineNumberToIndex = lineNumberToIndex;
    this.loopStack = [];
    this.onOutput = onOutput;
    this.onInput = onInput;
    this.safeEvalExpr = safeEvalExpr;
    this.instructionPointer = 0;
  }
}
