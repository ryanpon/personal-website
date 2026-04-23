import type { KeyboardEvent, RefObject } from "react";
import { colorSpan, colors } from "../terminal/colors";

type Props = {
  value: string;
  suggestion: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export default function TerminalInput({
  value,
  suggestion,
  inputRef,
  onChange,
  onKeyDown,
}: Props) {
  return (
    <>
      <span style={{ color: colors.lightPurple }}>%&nbsp;</span>
      <div className="autocomplete-wrapper">
        <div className="ghost-text" id="terminal-autocomplete-ghost">
          {value}
          {colorSpan(suggestion, colors.gray)}
        </div>
        <input
          type="text"
          id="terminal-input"
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </div>
    </>
  );
}
