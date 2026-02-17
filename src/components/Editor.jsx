import React from "react";

export default function Editor({ value, onChange }) {
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
