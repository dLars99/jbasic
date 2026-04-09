import { useEffect, useRef } from "react";
import { useRuntime } from "./useRuntime";

export default function RuntimePage(): JSX.Element {
  const {
    lines,
    promptText,
    inputValue,
    isAwaitingInput,
    setInputValue,
    inputResolveRef,
    finishInput,
  } = useRuntime();

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAwaitingInput) {
      inputRef.current?.focus();
    }
  }, [isAwaitingInput]);

  const handleInputSubmit = (submittedValue?: string): void => {
    if (!inputResolveRef.current) return;
    finishInput(submittedValue ?? inputValue);
  };

  return (
    <main className="runtime-page">
      <h3 className="runtime-heading">jBASIC Runtime</h3>
      <section className="runtime-output" aria-live="polite">
        {lines.map((line, index) => (
          <div key={`output-${index}`}>{line}</div>
        ))}

        {isAwaitingInput ? (
          <div className="runtime-input-row">
            <span>{promptText ? `${promptText} ` : ""}</span>
            <input
              ref={inputRef}
              type="text"
              className="runtime-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleInputSubmit();
                } else if (event.key === "Escape") {
                  handleInputSubmit("");
                }
              }}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
