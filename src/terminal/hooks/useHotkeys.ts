import { useEffect } from "react";

export type Hotkey = {
  key: string;
  fn: () => void;
  desc?: string;
  visible?: boolean;
};

export function useHotkeys(hotkeys: Hotkey[]): void {
  useEffect(() => {
    const handlerMap = new Map(hotkeys.map(h => [h.key, h]));
    const onKey = (e: KeyboardEvent) => {
      const handler = handlerMap.get(e.key) ?? handlerMap.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        handler.fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);
}
