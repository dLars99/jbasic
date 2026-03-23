type InstructionLimitProps = {
  instructionLimit: number | null;
  setInstructionLimit: (newLimit: number | null) => void;
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
            min={1}
            onChange={(e) => {
              const value = e.target.value;
              const newLimit = value === "" ? null : Number(value);
              setInstructionLimit(newLimit);
            }}
            placeholder="unlimited"
            type="number"
            value={instructionLimit === null ? "" : instructionLimit}
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
