import type { CSSProperties, ReactNode } from "react";
import { colors } from "../terminal/colors";

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      {title && (
        <>
          <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
            {title}
          </div>
          <div>&nbsp;</div>
        </>
      )}
      {children}
    </>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', ...style }}>
      {children}
    </div>
  );
}
