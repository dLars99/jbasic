export const getExpressionBetweenQuotes = (
  str: string,
  fromIndex: number,
): { foundExp: string; nextIndex: number } => {
  let nextIndex = fromIndex + 1;
  while (nextIndex < str.length) {
    if (str[nextIndex] === '"') {
      nextIndex++;
      break;
    }
    nextIndex++;
  }
  const expr = str.slice(fromIndex, nextIndex);
  return { foundExp: expr, nextIndex };
};

export const goToNextQuoteIndex = (str: string, fromIndex: number): number => {
  let nextQuoteIndex = fromIndex;
  while (nextQuoteIndex < str.length && str[nextQuoteIndex] !== '"')
    nextQuoteIndex++;
  return nextQuoteIndex;
};

export const escapeQuotes = (str: string): string => {
  return `"${String(str).replace(/"/g, '\\"')}"`;
};

export const parseVariables = (
  expr: string,
  startIndex: number,
  environment: Record<string, any>,
): { parsed: string; nextIndex: number } => {
  const endIndex = goToNextQuoteIndex(expr, startIndex);
  const codePart = expr.slice(startIndex, endIndex);
  const parsed = codePart.replace(
    // replacing codePart to handle variable substitution, only for valid identifiers
    /[A-Za-z][A-Za-z0-9_]*/g,
    (name) => {
      const val = environment[name];
      if (typeof val === "string") return escapeQuotes(val);
      if (val == null) return "0";
      return String(val);
    },
  );
  return { parsed, nextIndex: endIndex };
};
