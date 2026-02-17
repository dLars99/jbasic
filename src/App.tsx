import React, { useState, useRef, useEffect } from "react";
import Editor from "./components/Editor";
import Controls from "./components/Controls";
import { defaultProgram } from "./examples";

export default function App(): JSX.Element {
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem("jbasic:code") || defaultProgram;
  });
  const [instructionLimit, setInstructionLimit] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runtimeWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    localStorage.setItem("jbasic:code", code);
  }, [code]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = event.data;
      if (!message || !message.type) return;
      if (message.type === "output") {
        console.log("Runtime:", message.payload);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleRun = () => {
    const runtimeWindow = window.open(
      "/runtime.html",
      "jbasic-runtime",
      "width=600,height=400",
    );
    runtimeWindowRef.current = runtimeWindow;
    const onReady = (event: MessageEvent) => {
      if (
        event.source === runtimeWindow &&
        event.data &&
        event.data.type === "ready"
      ) {
        runtimeWindow!.postMessage(
          { type: "run", code, instructionLimit },
          "*",
        );
        window.removeEventListener("message", onReady as EventListener);
      }
    };
    window.addEventListener("message", onReady as EventListener);
  };

  const handleStop = () => {
    const runtimeWindow = runtimeWindowRef.current;
    if (runtimeWindow && !runtimeWindow.closed) {
      runtimeWindow.postMessage({ type: "stop" }, "*");
      runtimeWindow.close();
      runtimeWindowRef.current = null;
    }
  };

  const handleSave = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "program.bas";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".bas,.txt";
      input.addEventListener("change", async (ev) => {
        const fi = (ev.target as HTMLInputElement).files;
        if (!fi || fi.length === 0) return;
        const file = fi[0];
        const text = await file.text();
        setCode(text);
      });
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };

  function sendInputResponse(value: string) {
    const targetWindow = runtimeWindowRef.current;
    if (targetWindow && !targetWindow.closed)
      targetWindow.postMessage({ type: "input", value }, "*");
  }

  return (
    <div className="app">
      <div className="editor-pane">
        <Editor value={code} onChange={setCode} />
      </div>
      <div className="controls-pane">
        <Controls
          onRun={handleRun}
          onStop={handleStop}
          onSave={handleSave}
          onLoadClick={handleLoadClick}
          instructionLimit={instructionLimit}
          setInstructionLimit={setInstructionLimit}
        />
      </div>
    </div>
  );
}
