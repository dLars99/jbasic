import { useCallback, useEffect, useRef, useState } from "react";

import {
  createRunner,
  DEFAULT_INSTRUCTION_LIMIT,
  MAX_INSTRUCTION_LIMIT,
  MIN_INSTRUCTION_LIMIT,
} from "../interpreter/basic";
import { isOpenerToRuntimeMessage } from "./messages";

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
    const trustedOrigin = window.location.origin;

    const normalizeLimit = (candidate: unknown): number => {
      if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
        return DEFAULT_INSTRUCTION_LIMIT;
      }
      const rounded = Math.trunc(candidate);
      return Math.max(
        MIN_INSTRUCTION_LIMIT,
        Math.min(MAX_INSTRUCTION_LIMIT, rounded),
      );
    };

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
            trustedOrigin,
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
      if (!window.opener || window.opener.closed) return;
      if (event.source !== window.opener) return;
      if (event.origin !== trustedOrigin) return;

      const message = event.data;
      if (!isOpenerToRuntimeMessage(message)) return;

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
                trustedOrigin,
              );
            }
          },
          async (nextPromptText) => {
            return requestInput(nextPromptText);
          },
          normalizeLimit(message.instructionLimit),
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

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "ready" }, trustedOrigin);
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
