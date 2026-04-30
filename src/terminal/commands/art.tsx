import { useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import { Grid } from "../../components/grid";
import type { AppExit, Command } from "./types";
import { pad } from "../helpers";

const gridSize = 20;

type Coord = [number, number];
type State = {
  line: [Coord, Coord],
};
type Action =
  | { type: 'TICK' }
  ;

function pointToLineDist([px, py]: Coord, [x1, y1]: Coord, [x2, y2]: Coord): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Line is actually a point
    return Math.hypot(px - x1, py - y1);
  }

  // Project point onto the line (infinite), clamp to segment [0, 1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));

  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  return Math.hypot(px - nearestX, py - nearestY);
}

function initialState(): State {
  return {
    line: [[0, 0], [20, 20]]
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TICK': {
      const [[lx1, ly1], [lx2, ly2]] = state.line;

      return {
        line: [
          [lx1, ly1],
          [(lx2 + 1) % gridSize, (ly2 + 1) % gridSize]
        ]
      }
    }
  }
}

function ArtApp({ onExit }: { onExit: AppExit }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const [line1, line2] = state.line;
  const rows: Array<[string, string]> = [];
  for (let x = 0; x < gridSize; x++) {
    const row = [];
    for (let y = 0; y < gridSize; y++) {
      const point: Coord = [x, y];
      if (pointToLineDist(point, line1, line2) < 1) {
        row.push('*');
      } else {
        row.push('.');
      }
    }
    rows.push([row.join(''), colors.foreground]);
  }

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start'}}>
      <Grid
        rows={rows}
        width={gridSize}
        borderStyle={"double"}
        letterSpacing={"1ch"}
        lrPad={0}
      />
    </div>
  );
}

export const artCommand: Command = {
  name: "art",
  help: "Art demo",
  run: () => ({
    kind: "app",
    app: { name: "art", Component: ArtApp },
  }),
};
