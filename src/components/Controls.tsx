import { FaFolderOpen, FaPlay, FaSave, FaStop } from "react-icons/fa";
import { InstructionLimit } from "./InstructionLimit";
import { Button } from "./Button";

type ControlsProps = {
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  instructionLimit: number;
  setInstructionLimit: (newLimit: number) => void;
  popupBlocked?: boolean;
};

export default function Controls({
  onRun,
  onStop,
  onSave,
  onLoadClick,
  instructionLimit,
  setInstructionLimit,
  popupBlocked,
}: ControlsProps): JSX.Element {
  return (
    <div aria-labelledby="controls-heading" className="controls">
      <h3 id="controls-heading">Controls</h3>

      <div aria-labelledby="execution-heading" className="execution-controls">
        <h4 className="inset-heading" id="execution-heading">
          Execution
        </h4>

        <Button className="run" icon={FaPlay} onClick={onRun} type="button">
          Run
        </Button>

        <Button className="stop" icon={FaStop} onClick={onStop} type="button">
          Stop
        </Button>

        {popupBlocked && (
          <p className="popup-blocked-warning">
            Popup blocked — allow popups for this site and click Run again.
          </p>
        )}
      </div>

      <InstructionLimit
        instructionLimit={instructionLimit}
        setInstructionLimit={setInstructionLimit}
      />

      <div className="button-group">
        <Button
          className="secondary-button"
          icon={FaSave}
          onClick={onSave}
          type="button"
        >
          Save
        </Button>

        <Button
          className="secondary-button"
          icon={FaFolderOpen}
          onClick={onLoadClick}
          type="button"
        >
          Load
        </Button>
      </div>
    </div>
  );
}
