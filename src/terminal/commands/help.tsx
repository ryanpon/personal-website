import { colorSpan, colors } from "../colors";
import type { Command } from "./types";

export const helpCommand: Command = {
  name: "help",
  help: "Get this help text.",
  run: (_args, { commands }) => [
    "Available commands:",
    ...Object.values(commands).map(cmd => (
      <span key={cmd.name}>
        &nbsp;&nbsp;{colorSpan(cmd.name, colors.purple)} – {cmd.help}
      </span>
    )),
  ],
};
