import type { ReactNode } from "react";
import { helpCommand } from "./help";
import { resumeCommand } from "./resume";
import type { Command } from "./types";

export const commands: Record<string, Command> = {
  [helpCommand.name]: helpCommand,
  [resumeCommand.name]: resumeCommand,
};

export const commandNames = Object.keys(commands);

export function dispatch(inputStr: string): ReactNode[] {
  const [name, ...args] = inputStr.split(" ");
  if (!name) return [""];

  const command = commands[name];
  if (!command) return [`command not found: ${name}`];

  return command.run(args, { commands });
}
