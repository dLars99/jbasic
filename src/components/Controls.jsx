import React from "react";

export default function Controls({ onRun, onStop }) {
  return (
    <div className="controls">
      <button onClick={onRun}>Run</button>
      <button onClick={onStop}>Stop</button>
    </div>
  );
}
