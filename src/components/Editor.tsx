import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function Editor({ value, onChange }: Props): JSX.Element {
  return (
    <div className="editor-wrap">
      <textarea
        className="editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
