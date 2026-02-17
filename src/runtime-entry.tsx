import { createRunner } from "./interpreter/basic";

const outputElement = document.getElementById("output");
function append(msg: any) {
  const lineEl = document.createElement("div");
  lineEl.textContent = String(msg);
  outputElement?.appendChild(lineEl);
}

let pendingInputElement: HTMLInputElement | null = null;
function requestInput(promptText: string) {
  return new Promise<string>((resolve) => {
    const lineEl = document.createElement("div");
    lineEl.style.fontFamily = "monospace";
    lineEl.style.display = "flex";
    lineEl.style.alignItems = "center";
    const promptSpanEl = document.createElement("span");
    if (promptText) promptSpanEl.textContent = promptText + " ";
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.className = "jbasic-runtime-input";
    inputElement.style.background = "transparent";
    inputElement.style.color = "inherit";
    inputElement.style.border = "none";
    inputElement.style.outline = "none";
    inputElement.style.font = "inherit";
    inputElement.style.width = "40%";
    inputElement.style.caretColor = "white";

    lineEl.appendChild(promptSpanEl);
    lineEl.appendChild(inputElement);
    outputElement?.appendChild(lineEl);
    inputElement.focus();
    pendingInputElement = inputElement;

    function finish(val: any) {
      try {
        inputElement.remove();
      } catch (err) {}
      const valueSpan = document.createElement("span");
      valueSpan.textContent = String(val == null ? "" : val);
      promptSpanEl.appendChild(valueSpan);
      pendingInputElement = null;
      resolve(val == null ? "" : val);
    }

    inputElement.addEventListener("keydown", (event) => {
      if ((event as KeyboardEvent).key === "Enter") {
        finish(inputElement.value);
      } else if ((event as KeyboardEvent).key === "Escape") {
        finish("");
      }
    });

    // notify opener (for compatibility), but primary input happens here
    if (window.opener)
      window.opener.postMessage(
        { type: "inputRequest", prompt: promptText },
        window.location.origin,
      );

    // safety timeout: resolve empty after 2 minutes
    setTimeout(() => {
      if (pendingInputElement === inputElement) finish("");
    }, 120000);
  });
}

window.addEventListener("message", (event) => {
  // Only accept messages from same origin to avoid spoofing
  if (event.origin !== window.location.origin) return;
  const message = event.data;
  if (!message || !message.type) return;
  if (message.type === "run") {
    if (outputElement) outputElement.innerHTML = "";
    const runner = createRunner(
      message.code,
      (o: string) => {
        append(o);
        try {
          window.opener &&
            window.opener.postMessage(
              { type: "output", payload: o },
              window.location.origin,
            );
        } catch (_) {}
      },
      async (promptName: string) => {
        const v = await requestInput(promptName);
        return v;
      },
      message.instructionLimit ?? null,
    );
    (window as any)._jbasic_runner = runner;
    runner.start();
  } else if (message.type === "stop") {
    if ((window as any)._jbasic_runner) (window as any)._jbasic_runner.stop();
    append("[Stopped]");
  } else if (message.type === "input") {
    if (pendingInputElement) {
      pendingInputElement.value = message.value == null ? "" : message.value;
      const keyboardEvent = new KeyboardEvent("keydown", { key: "Enter" });
      pendingInputElement.dispatchEvent(keyboardEvent);
    } else {
      append(String(message.value));
    }
  }
});

// notify opener we're ready (use origin target)
try {
  window.opener &&
    window.opener.postMessage({ type: "ready" }, window.location.origin);
} catch (_) {}
