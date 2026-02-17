import React from "react";

type Props = {
  onRun: () => void;
  onStop: () => void;
};

export default function Controls({ onRun, onStop }: Props): JSX.Element {
  return (
    <div className="controls">
      <button onClick={onRun}>Run</button>
      <button onClick={onStop}>Stop</button>
    </div>
  );
}
