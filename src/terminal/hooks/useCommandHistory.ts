import { useState } from "react";

export function useCommandHistory() {
  const [commands, setCommands] = useState<string[]>([]);
  const [scrollbackIdx, setScrollbackIdx] = useState<number | null>(null);

  function push(command: string) {
    setCommands(prev => [...prev, command]);
    setScrollbackIdx(null);
  }

  function previous(): string | null {
    if (commands.length === 0) return null;
    const nextIdx = Math.max((scrollbackIdx ?? commands.length) - 1, 0);
    setScrollbackIdx(nextIdx);
    return commands[nextIdx];
  }

  function next(): string | null {
    if (scrollbackIdx === null) return null;
    const nextIdx = Math.min(scrollbackIdx + 1, commands.length - 1);
    setScrollbackIdx(nextIdx);
    return commands[nextIdx];
  }

  return { push, previous, next };
}
