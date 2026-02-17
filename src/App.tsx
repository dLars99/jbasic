import React, { useState, useRef, useEffect } from "react";
import Editor from "./components/Editor";
import Controls from "./components/Controls";
import { defaultProgram } from "./examples";

export default function App(): JSX.Element {
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem("jbasic:code") || defaultProgram;
  });
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
        runtimeWindow!.postMessage({ type: "run", code }, "*");
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
        <Controls onRun={handleRun} onStop={handleStop} />
      </div>
    </div>
  );
}
