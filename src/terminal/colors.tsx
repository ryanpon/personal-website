import type { ReactNode } from "react";


export const colors = {
  background: "#272822",
  foreground: "#f8f8f2",
  gray: "#75715e",
  yellow: "#e6db74",
  purple: "#ae81ff",
  lightPurple: "#d3bdf9",
  pink: "#f92672",
  green: "#a6e22e",
  cyan: "#66d9ef",
} as const;

export function colorSpan(text: ReactNode, color: string, key?: number) {
  return <span style={{ color }} key={key}>{text}</span>;
}
