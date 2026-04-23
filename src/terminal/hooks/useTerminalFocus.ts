import { useEffect, type RefObject } from "react";

export function useTerminalFocus(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const refocus = () => {
      if (window.getSelection()?.toString()) return;
      inputRef.current?.focus();
    };
    document.addEventListener("mouseup", refocus);
    return () => document.removeEventListener("mouseup", refocus);
  }, [inputRef]);
}
