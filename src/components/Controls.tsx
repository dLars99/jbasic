import React from "react";

type Props = {
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  instructionLimit: number | null;
  setInstructionLimit: (n: number | null) => void;
};

export default function Controls({
  onRun,
  onStop,
  onSave,
  onLoadClick,
  instructionLimit,
  setInstructionLimit,
}: Props): JSX.Element {
  return (
    <div className="controls">
      <div className="button-group">
        <button onClick={onRun}>Run</button>
        <button onClick={onStop}>Stop</button>
      </div>

      <div className="button-group">
        <button onClick={onSave}>Save</button>
        <button onClick={onLoadClick}>Load</button>
      </div>

      <label>
        Instruction limit:
        <input
          type="number"
          value={instructionLimit == null ? "" : instructionLimit}
          onChange={(e) => {
            const v = e.target.value;
            const num = v === "" ? null : Number(v);
            setInstructionLimit(num);
          }}
          placeholder="unlimited"
          style={{ width: 100, marginLeft: 6 }}
        />
      </label>
    </div>
  );
}
