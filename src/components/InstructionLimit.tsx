type InstructionLimitProps = {
  instructionLimit: number | null;
  setInstructionLimit: (newLimit: number | null) => void;
};

export const InstructionLimit = ({
  instructionLimit,
  setInstructionLimit,
}: InstructionLimitProps) => {
  return (
    <label>
      Instruction limit:
      <input
        className="instruction-limit-input"
        type="number"
        value={instructionLimit == null ? "" : instructionLimit}
        onChange={(e) => {
          const value = e.target.value;
          const newLimit = value === "" ? null : Number(value);
          setInstructionLimit(newLimit);
        }}
        placeholder="unlimited"
        // style={{ width: 80, marginLeft: 6 }}
      />
    </label>
  );
};
