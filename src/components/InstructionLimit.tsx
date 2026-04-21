import {
  MAX_INSTRUCTION_LIMIT,
  MIN_INSTRUCTION_LIMIT,
} from "../interpreter/basic";

type InstructionLimitProps = {
  instructionLimit: number;
  setInstructionLimit: (newLimit: number) => void;
};

export const InstructionLimit = ({
  instructionLimit,
  setInstructionLimit,
}: InstructionLimitProps) => {
  return (
    <div className="instruction-limit">
      <label>
        Instruction limit:
        <div className="instruction-limit-content">
          <input
            aria-describedby="instruction-limit-description"
            className="instruction-limit-input"
            inputMode="numeric"
            max={MAX_INSTRUCTION_LIMIT}
            min={MIN_INSTRUCTION_LIMIT}
            onChange={(e) => {
              const rawValue = Number(e.target.value);
              if (!Number.isFinite(rawValue)) {
                setInstructionLimit(MIN_INSTRUCTION_LIMIT);
                return;
              }
              const boundedValue = Math.max(
                MIN_INSTRUCTION_LIMIT,
                Math.min(MAX_INSTRUCTION_LIMIT, Math.trunc(rawValue)),
              );
              setInstructionLimit(boundedValue);
            }}
            type="number"
            value={instructionLimit}
          />
          <p id="instruction-limit-description">
            Enforced during code execution. The program will halt if it reaches
            this limit.
          </p>
        </div>
      </label>
    </div>
  );
};
