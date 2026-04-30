import { useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import { Grid } from "../../components/grid";
import type { AppExit, Command } from "./types";
import { pad } from "../helpers";

function LayoutApp({ onExit }: { onExit: AppExit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start'}}>
      <Grid
        rows={[
          ['hello world', colors.lightPurple],
          ['*', colors.lightPurple],
          ['*', colors.lightPurple],
          ['*', colors.lightPurple],
          ['*', colors.lightPurple],
          ['*', colors.lightPurple],
          ['*', colors.lightPurple],
          ['bye world', colors.lightPurple],
        ]}
        width={20}
      />
      <div style={{flexDirection: 'column'}}>
        <Grid
          rows={[
            ['Customize', colors.lightPurple],
            ['border', colors.yellow],
            ['styles', colors.lightPurple],
          ]}
          width={10}
        />
        <Grid
          rows={[
            ['Flex', colors.lightPurple],
            ['layouts', colors.lightPurple],
            ['', colors.lightPurple],
          ]}
          width={10}
        />
      </div>
      <div style={{flexDirection: 'column'}}>
        <Grid
          rows={[
            ['double', colors.lightPurple],
          ]}
          width={10}
          borderColor={colors.lightPurple}
          borderStyle={'double'}
        />
        <Grid
          rows={[
            ['single', colors.lightPurple],
          ]}
          width={10}
          borderColor={colors.foreground}
          borderStyle={'single'}
        />
        <Grid
          rows={[
            ['none', colors.lightPurple],
          ]}
          width={10}
          borderStyle={'none'}
        />
      </div>
    </div>
  );
}

export const layoutCommand: Command = {
  name: "layout",
  help: "Grid layout demo",
  run: () => ({
    kind: "app",
    app: { name: "layout", Component: LayoutApp },
  }),
};
