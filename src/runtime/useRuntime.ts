import { useCallback, useEffect, useRef, useState } from "react";

import { createRunner } from "../interpreter/basic";

type Runner = {
  start: () => void;
  stop: () => void;
};

export const useRuntime = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [promptText, setPromptText] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isAwaitingInput, setIsAwaitingInput] = useState<boolean>(false);

  const runnerRef = useRef<Runner | null>(null);
  const inputResolveRef = useRef<((value: string) => void) | null>(null);
  const promptTextRef = useRef<string>("");

  const finishInput = useCallback((value: string): void => {
    const resolver = inputResolveRef.current;
    if (!resolver) return;

    const displayPrompt = promptTextRef.current
      ? `${promptTextRef.current} `
      : "";
    setLines((prev) => [...prev, `${displayPrompt}${String(value ?? "")}`]);
    setPromptText("");
    setInputValue("");
    promptTextRef.current = "";
    setIsAwaitingInput(false);
    inputResolveRef.current = null;
    resolver(value ?? "");
  }, []);

  useEffect(() => {
    const append = (message: string): void => {
      setLines((prev) => [...prev, String(message)]);
    };

    function requestInput(nextPromptText: string): Promise<string> {
      return new Promise((resolve) => {
        const safePrompt = nextPromptText ?? "";
        promptTextRef.current = safePrompt;
        setPromptText(safePrompt);
        setInputValue("");
        setIsAwaitingInput(true);
        inputResolveRef.current = resolve;

        if (window.opener) {
          window.opener.postMessage(
            { type: "inputRequest", prompt: nextPromptText },
            "*",
          );
        }

        window.setTimeout(() => {
          if (inputResolveRef.current === resolve) {
            finishInput("");
          }
        }, 120000);
      });
    }

    function onMessage(event: MessageEvent): void {
      const message = event.data;
      if (!message || !message.type) return;

      if (message.type === "run") {
        setLines([]);
        setPromptText("");
        setInputValue("");
        setIsAwaitingInput(false);

        const runner = createRunner(
          message.code,
          (output) => {
            append(output);
            if (window.opener) {
              window.opener.postMessage(
                { type: "output", payload: output },
                "*",
              );
            }
          },
          async (nextPromptText) => {
            return requestInput(nextPromptText);
          },
          message.instructionLimit ?? null,
        );

        runnerRef.current = runner;
        runner.start();
      } else if (message.type === "stop") {
        runnerRef.current?.stop();
        append("[Stopped]");
      } else if (message.type === "input") {
        if (inputResolveRef.current) {
          const nextValue = message.value == null ? "" : String(message.value);
          setInputValue(nextValue);
          finishInput(nextValue);
        } else {
          append(String(message.value));
        }
      }
    }

    window.addEventListener("message", onMessage);

    if (window.opener) {
      window.opener.postMessage({ type: "ready" }, "*");
    }

    return () => {
      window.removeEventListener("message", onMessage);
      runnerRef.current?.stop();
      runnerRef.current = null;
      inputResolveRef.current = null;
    };
  }, [finishInput]);

  return {
    lines,
    promptText,
    inputValue,
    isAwaitingInput,
    setInputValue,
    inputResolveRef,
    finishInput,
  };
};
