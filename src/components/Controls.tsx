import { InstructionLimit } from "./InstructionLimit";

type ControlsProps = {
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  instructionLimit: number | null;
  setInstructionLimit: (newLimit: number | null) => void;
};

export default function Controls({
  onRun,
  onStop,
  onSave,
  onLoadClick,
  instructionLimit,
  setInstructionLimit,
}: ControlsProps): JSX.Element {
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

      <InstructionLimit
        instructionLimit={instructionLimit}
        setInstructionLimit={setInstructionLimit}
      />
    </div>
  );
}
