import type { ReactNode } from "react";

export type CommandContext = {
  commands: Record<string, Command>;
};

export type Command = {
  name: string;
  help: string;
  options: Optional[string[]];
  run: (args: string[], ctx: CommandContext) => ReactNode[];
};
