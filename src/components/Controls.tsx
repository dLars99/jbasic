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
    <div aria-labelledby="controls-heading" className="controls">
      <h3 id="controls-heading">Controls</h3>

      <div aria-labelledby="execution-heading" className="execution-controls">
        <h4 className="inset-heading" id="execution-heading">
          Execution
        </h4>

        <button className="run" onClick={onRun} type="button">
          Run
        </button>

        <button className="stop" onClick={onStop} type="button">
          Stop
        </button>
      </div>

      <InstructionLimit
        instructionLimit={instructionLimit}
        setInstructionLimit={setInstructionLimit}
      />

      <div className="button-group">
        <button className="secondary-button" onClick={onSave} type="button">
          Save
        </button>

        <button
          className="secondary-button"
          onClick={onLoadClick}
          type="button"
        >
          Load
        </button>
      </div>
    </div>
  );
}
