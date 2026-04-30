import { useState, useRef, useEffect } from "react";
import Editor from "./components/Editor";
import Controls from "./components/Controls";
import { defaultProgram } from "./examples";
import { DEFAULT_INSTRUCTION_LIMIT } from "./interpreter/basic";
import { isRuntimeToOpenerMessage } from "./runtime/messages";

export default function App(): JSX.Element {
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem("jbasic:code") || defaultProgram;
  });
  const [instructionLimit, setInstructionLimit] = useState<number>(
    DEFAULT_INSTRUCTION_LIMIT,
  );
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runtimeWindowRef = useRef<Window | null>(null);
  const runtimeOriginRef = useRef<string>(window.location.origin);

  useEffect(() => {
    localStorage.setItem("jbasic:code", code);
  }, [code]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== runtimeWindowRef.current) return;
      if (event.origin !== runtimeOriginRef.current) return;
      const message = event.data;
      if (!isRuntimeToOpenerMessage(message)) return;
      if (message.type === "output") {
        console.log("Runtime:", message.payload);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleRun = () => {
    const runtimeOrigin = window.location.origin;
    const runtimeWindow = window.open(
      `${import.meta.env.BASE_URL}runtime`,
      "jbasic-runtime",
      "width=600,height=400",
    );
    if (!runtimeWindow) {
      setPopupBlocked(true);
      return;
    }
    setPopupBlocked(false);
    runtimeWindowRef.current = runtimeWindow;
    runtimeOriginRef.current = runtimeOrigin;
    const onReady: EventListener = (event: MessageEvent) => {
      const message = event.data;
      if (
        event.source === runtimeWindow &&
        event.origin === runtimeOrigin &&
        isRuntimeToOpenerMessage(message) &&
        message.type === "ready"
      ) {
        runtimeWindow!.postMessage(
          { type: "run", code, instructionLimit },
          runtimeOrigin,
        );
        window.removeEventListener("message", onReady);
      }
    };
    window.addEventListener("message", onReady);
  };

  const handleStop = () => {
    const runtimeWindow = runtimeWindowRef.current;
    if (runtimeWindow && !runtimeWindow.closed) {
      runtimeWindow.postMessage({ type: "stop" }, runtimeOriginRef.current);
      runtimeWindow.close();
      runtimeWindowRef.current = null;
    }
    setPopupBlocked(false);
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
          popupBlocked={popupBlocked}
        />
      </aside>
    </main>
  );
}
