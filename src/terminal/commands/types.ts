import type { FC, ReactNode } from "react";

export type CommandContext = {
  commands: Record<string, Command>;
};

export type AppExit = (trailingLines?: ReactNode[]) => void;

export type ActiveApp = {
  name: string;
  Component: FC<{ onExit: AppExit }>;
};

export type CommandResult =
  | { kind: "output"; lines: ReactNode[] }
  | { kind: "app"; app: ActiveApp };

export type Command = {
  name: string;
  help: string;
  options?: string[];
  run: (args: string[], ctx: CommandContext) => CommandResult;
};
