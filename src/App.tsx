import { useState, useRef, useEffect } from "react";
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
    const shadowDownloadLink = document.createElement("a");
    shadowDownloadLink.href = url;
    shadowDownloadLink.download = "program.bas";
    shadowDownloadLink.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".bas,.txt";
      input.addEventListener("change", async (ev) => {
        const fileList = (ev.target as HTMLInputElement).files;
        if (!fileList || fileList.length === 0) return;
        const file = fileList[0];
        const text = await file.text();
        setCode(text);
      });
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };

  return (
    <main className="app">
      <section className="editor-pane">
        <Editor value={code} onChange={setCode} />
      </section>
      <aside className="controls-pane">
        <Controls
          onRun={handleRun}
          onStop={handleStop}
          onSave={handleSave}
          onLoadClick={handleLoadClick}
          instructionLimit={instructionLimit}
          setInstructionLimit={setInstructionLimit}
        />
      </aside>
    </main>
  );
}
