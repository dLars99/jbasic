type EditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function Editor({ value, onChange }: EditorProps): JSX.Element {
  return (
    <div className="editor-wrap">
      <textarea
        aria-label="Code editor"
        className="editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
