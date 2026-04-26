import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import TerminalInput from "./TerminalInput";
import { dispatch } from "../terminal/commands";
import type { ActiveApp } from "../terminal/commands/types";
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
  const [activeApp, setActiveApp] = useState<ActiveApp | null>(null);
  const history = useCommandHistory();
  const { match, suggestion } = useAutocomplete(
    inputVal,
    lines.length === 0 ? "help" : null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useTerminalFocus(inputRef);

  const exitApp = useCallback((trailingLines?: ReactNode[]) => {
    setActiveApp(null);
    if (trailingLines && trailingLines.length > 0) {
      setLines(prev => [...prev, ...trailingLines]);
    }
  }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLines([]);
        return;
      }
      if (activeApp && e.key === "c" && e.ctrlKey) {
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        exitApp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeApp, exitApp]);

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
      const result = dispatch(inputVal);
      history.push(inputVal);
      setInput("");

      if (result.kind === "app") {
        setActiveApp(result.app);
        return;
      }

      setLines(prev => [...prev, commandLine, ...result.lines]);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }

  const App = activeApp?.Component;

  return (
    <div className="terminal">
      {App ? (
        <App onExit={exitApp} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
