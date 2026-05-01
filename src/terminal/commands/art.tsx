import { useReducer } from "react";
import { colors } from "../colors";
import { Grid } from "../../components/grid";
import { appCommand, type AppExit, type Command } from "./types";
import type { Coord } from "../geometry";
import { useInterval } from "../hooks/useInterval";

const gridSize = 20;

type Degree = number;
type State = {
  lineDeg: [Degree, Degree],
};
type Action =
  | { type: 'TICK' }
  ;

function pointToLineDist([px, py]: Coord, [x1, y1]: Coord, [x2, y2]: Coord, infinite = true): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Line is actually a point
    return Math.hypot(px - x1, py - y1);
  }

  // Project point onto the line (infinite), clamp to segment [0, 1]
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  if (!infinite) {
    t = Math.max(0, Math.min(1, t));
  }

  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  return Math.hypot(px - nearestX, py - nearestY);
}

function pointOnCircle([cx, cy]: Coord, radius: number, angleDeg: Degree): Coord {
  const rad = (angleDeg * Math.PI) / 180;
  return [
    cx + radius * Math.cos(rad),
    cy + radius * Math.sin(rad),
  ];
}

function initialState(): State {
  return {
    lineDeg: [0, 180]
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TICK': {
      const [l1, l2] = state.lineDeg;
      return {
        lineDeg: [
          (l1 + 10) % 360,
          (l2 + 10) % 360
        ]
      };
    }
  }
}

function ArtApp({ onExit }: { onExit: AppExit }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const [l1, l2] = state.lineDeg;
  const line1 = pointOnCircle([9.5, 9.5], 1, l1);
  const line2 = pointOnCircle([9.5, 9.5], 1, l2);

  const rows: Array<[string, string]> = [];
  for (let x = 0; x < gridSize; x++) {
    const row = [];
    for (let y = 0; y < gridSize; y++) {
      const point: Coord = [x, y];
      if (pointToLineDist(point, line1, line2) < 1) {
        row.push('@');
      } else if (pointToLineDist(point, line1, line2) < 2) {
        row.push('*');
      } else {
        row.push('.');
      }
    }
    rows.push([row.join(''), colors.foreground]);
  }

  useInterval(() => dispatch({ type: 'TICK' }), 100);

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

export const artCommand: Command = appCommand("art", "Art demo", ArtApp);
