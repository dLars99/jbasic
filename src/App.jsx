import React, { useState, useRef, useEffect } from "react";
import Editor from "./components/Editor";
import Controls from "./components/Controls";
import { defaultProgram } from "./examples";

export default function App() {
  const [code, setCode] = useState(() => {
    return localStorage.getItem("jbasic:code") || defaultProgram;
  });
  const runtimeWindowRef = useRef(null);
  // runtime now handles INPUT inline; no editor-side prompt required

  useEffect(() => {
    localStorage.setItem("jbasic:code", code);
  }, [code]);

  useEffect(() => {
    function onMessage(ev) {
      const msg = ev.data;
      if (!msg || !msg.type) return;
      if (msg.type === "output") {
        console.log("Runtime:", msg.payload);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleRun = () => {
    const w = window.open(
      "/runtime.html",
      "jbasic-runtime",
      "width=600,height=400",
    );
    runtimeWindowRef.current = w;
    const onReady = (ev) => {
      if (ev.source === w && ev.data && ev.data.type === "ready") {
        w.postMessage({ type: "run", code }, "*");
        window.removeEventListener("message", onReady);
      }
    };
    window.addEventListener("message", onReady);
  };

  const handleStop = () => {
    const w = runtimeWindowRef.current;
    if (w && !w.closed) {
      w.postMessage({ type: "stop" }, "*");
      w.close();
      runtimeWindowRef.current = null;
    }
  };

  function sendInputResponse(value) {
    const target = runtimeWindowRef.current;
    if (target && !target.closed)
      target.postMessage({ type: "input", value }, "*");
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
