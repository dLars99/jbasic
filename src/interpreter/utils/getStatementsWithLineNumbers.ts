export type Statement = { lineno: number | null; text: string };
export type LineNumberIndexMap = Record<number, number>;

export const getStatementsWithLineNumbers = (
  code: string,
): { statements: Statement[]; lineNumberToIndex: LineNumberIndexMap } => {
  const rawLines = code.split(/\r?\n/).map((raw) => raw.replace(/\r/g, ""));

  const statements: Statement[] = [];
  const lineNumberToIndex: LineNumberIndexMap = Object.create(null);

  rawLines.forEach((rawLine) => {
    const text = rawLine.trim();
    if (!text) return;
    const match = text.match(/^\s*([0-9]+)\s+(.*)$/); // Functionalize: get statements
    if (match) {
      const lineno = Number(match[1]);
      const body = match[2].trim();
      lineNumberToIndex[lineno] = statements.length;
      statements.push({ lineno, text: body });
    } else {
      statements.push({ lineno: null, text });
    }
  });
  return { statements, lineNumberToIndex };
};
