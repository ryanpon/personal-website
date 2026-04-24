import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import TerminalInput from "./TerminalInput";
import { commandNames, dispatch } from "../terminal/commands";
import { useAutocomplete } from "../terminal/hooks/useAutocomplete";
import { useCommandHistory } from "../terminal/hooks/useCommandHistory";
import { useTerminalFocus } from "../terminal/hooks/useTerminalFocus";

// History
//   Ctrl+R — incremental backward search through history
//   !! — repeat last command
//   !$ — last argument of previous command
//   !^ — first argument of previous command
//   !:n — nth argument of previous command
//   !string — run last command starting with "string"
//
// Editing
//   Ctrl+A / Ctrl+E — jump to start/end of line
//   Ctrl+W — delete word backward
//   Alt+D — delete word forward
//   Ctrl+K — kill to end of line
//   Ctrl+U — kill to beginning of line
//   Ctrl+Y — yank (paste) killed text
//   Alt+. — insert last argument of previous command (repeatable!)
//
// Autocomplete
//   Ctrl+X Ctrl+H — show all completion helpers for current context
export default function Terminal() {
  const [lines, setLines] = useState<ReactNode[]>([]);
  const [inputVal, setInput] = useState("");
  const history = useCommandHistory();
  const { match, suggestion } = useAutocomplete(
    inputVal,
    lines.length === 0 ? "help" : null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useTerminalFocus(inputRef);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLines([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      const prev = history.previous();
      if (prev !== null) {
        e.preventDefault();
        setInput(prev);
      }
    }
    if (e.key === "ArrowDown") {
      const nxt = history.next();
      if (nxt !== null) {
        e.preventDefault();
        setInput(nxt);
      }
    }
    if ((e.key === "Tab" || e.key === "ArrowRight") && match && suggestion) {
      e.preventDefault();
      setInput(match);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const commandLine = `% ${inputVal}`;
      const output = dispatch(inputVal);
      setLines(prev => [...prev, commandLine, ...output]);
      history.push(inputVal);
      setInput("");

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }

  return (
    <div>
      {lines.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
      <TerminalInput
        value={inputVal}
        suggestion={suggestion}
        inputRef={inputRef}
        onChange={setInput}
        onKeyDown={handleKeyDown}
      />
      <div ref={bottomRef} />
    </div>
  );
}
