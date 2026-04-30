import { useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import type { AppExit, Command } from "./types";
import { pad, chunk } from "../helpers";
import { Grid } from "../../components/grid";

const gridSize = 15;
const cellSize = '2ch';
const emptyVal = '·';
const initialInterval = 350;

type Coord = [number, number];

type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  snake: Coord[];
  head: Coord;
  food: Coord;
  nextDir: Direction;
  curDir: Direction;
  tickInterval: number;
  isPaused: boolean;
  hasLost: boolean;
};

type Action =
  | { type: 'TICK' }
  | { type: 'INPUT_DIRECTION', dir: Direction }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_PAUSE' }
  ;

type Hotkey = {
  key: string;
  dispatch?: Action;
  fn?: () => void;
};

const dirOpposites: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function inBounds([x, y]: Coord): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

function speedOffset(growth: number): number {
  let intervalOffset: number = 0;
  for (let i = 1; i < growth; i++) {
    if (i <= 5) {
      intervalOffset += 10;
    } else if (i <= 15) {
      intervalOffset += 5;
    } else {
      intervalOffset += 2;
    }
  }
  return intervalOffset;
}

function dir([x1, y1]: Coord, [x2, y2]: Coord): Direction {
  if (x1 < x2) {
    return 'right';
  }
  if (x1 > x2) {
    return 'left';
  }
  if (y1 < y2) {
    return 'down';
  }
  return 'up';
}

function nextCell([x, y]: Coord, dir: Direction): Coord {
  switch (dir) {
    case 'up': {
      return [x, y - 1];
    }
    case 'down': {
      return [x, y + 1];
    }
    case 'left': {
      return [x - 1, y];
    }
    case 'right': {
      return [x + 1, y];
    }
  }
}

function coordsEqual([x1, y1]: Coord, [x2, y2]: Coord): boolean {
  return x1 === x2 && y1 === y2;
}

function coordIndex([x, y]: Coord) {
  return x + y * gridSize;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TICK': {
      const next = nextCell(state.head, state.nextDir);
      const nextHasFood = coordsEqual(next, state.food);
      const body = state.snake.slice(nextHasFood ? 0 : 1);
      const snake = [...body, next];
      let food: Coord;
      if (nextHasFood) {
        food = snake[0];
        while (snake.some(crd => coordsEqual(crd, food))) {
          food = [randInt(0, gridSize - 1), randInt(0, gridSize - 1)]
        }
      } else {
        food = state.food;
      }

      const tickInterval = initialInterval - speedOffset(state.snake.length - 3);
      const nextState = {
        ...state,
        snake,
        head: next,
        food,
        tickInterval,
        curDir: state.nextDir,
      };

      const bodyCollision = state.snake.some(crd => coordsEqual(crd, next));
      const outOfBounds = !inBounds(next);
      if (outOfBounds || bodyCollision) {
        return { ...nextState, hasLost: true };
      }

      return nextState;
    }
    case 'INPUT_DIRECTION': {
      const {dir} = action;
      if (dir === dirOpposites[state.curDir]) {
        // prevents losing by u-turning into the body
        return {...state, nextDir: state.curDir};
      }
      return {...state, nextDir: dir};
    }
    case 'RESTART': {
      return initialState();
    }
    case 'TOGGLE_PAUSE': {
      if (state.hasLost) {
        return state;
      }
      return { ...state, isPaused: !state.isPaused };
    }
  }
}

function initialState(): GameState {
  const head : Coord = [4, 4];

  return {
    snake: [[2, 4], [3, 4], head],
    head: head,
    food: [8, 8],
    curDir: 'right',
    nextDir: 'right',
    tickInterval: initialInterval,
    isPaused: false,
    hasLost: false,
  }
}

function getSegment(pCrd: Coord, crd: Coord, nCrd: Coord): string {
  const segVert = '║';
  const segHori = '═';
  const segDownRight = '╔';
  const segDownLeft = '╗';
  const segUpRight = '╚';
  const segUpLeft = '╝';

  const segments: Record<Direction, Record<Direction, string>> = {
    left: {
      left: segHori,
      right: segHori,
      up: segUpRight,
      down: segDownRight,
    },
    right: {
      left: segHori,
      right: segHori,
      up: segUpLeft,
      down: segDownLeft,
    },
    up: {
      left: segDownLeft,
      right: segDownRight,
      up: segVert,
      down: segVert,
    },
    down: {
      left: segUpLeft,
      right: segUpRight,
      up: segVert,
      down: segVert,
    }
  };

  const firstDir = dir(pCrd, crd);
  const secondDir = dir(crd, nCrd);
  return segments[firstDir][secondDir];
}

function PlayField({ state }: {
  state: GameState;
}) {
  const cells = new Array(gridSize ** 2).fill(emptyVal);
  cells[coordIndex(state.snake[0])] = 'o';

  let prevCoord: Coord | null = state.snake[0];
  let coord: Coord | null = state.snake[1];
  for (const nextCoord of state.snake.slice(2)) {
    cells[coordIndex(coord)] = getSegment(prevCoord, coord, nextCoord);
    prevCoord = coord;
    coord = nextCoord;
  }
  if (!state.hasLost) {
    cells[coordIndex(state.head)] = colorSpan('@', colors.lightPurple);
  }
  cells[coordIndex(state.food)] = colorSpan('*', colors.lightPurple);

  return (
    <Grid
      rows={chunk(cells, gridSize).map(row => [row, colors.foreground])}
      width={gridSize}
      borderStyle={"double"}
      lineHeight={cellSize}
      letterSpacing={"1ch"}
      lrPad={0}
    />
  );
}

function SnakeApp({ onExit }: { onExit: AppExit }) {
  const [gameState, dispatch] = useReducer(reducer, undefined, initialState);

  const hotkeys = useMemo<Hotkey[]>(() => [
    { key: 'q', fn: onExit },
    { key: 'r', dispatch: { type: 'RESTART' } },
    { key: 'p', dispatch: { type: 'TOGGLE_PAUSE' } },
    { key: 'arrowdown', dispatch: { type: 'INPUT_DIRECTION', dir: 'down' } },
    { key: 'arrowup', dispatch: { type: 'INPUT_DIRECTION', dir: 'up' } },
    { key: 'arrowleft', dispatch: { type: 'INPUT_DIRECTION', dir: 'left' } },
    { key: 'arrowright', dispatch: { type: 'INPUT_DIRECTION', dir: 'right' } },
  ], [onExit]);

  useEffect(() => {
    const handlerMap = new Map(hotkeys.map(h => [h.key, h]));
    const onKey = (e: KeyboardEvent) => {
      const handler = handlerMap.get(e.key) ?? handlerMap.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        if (handler.dispatch) { dispatch(handler.dispatch); }
        if (handler.fn) { handler.fn(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  useEffect(() => {
    if (gameState.isPaused || gameState.hasLost) return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), gameState.tickInterval);
    return () => window.clearInterval(id);
  }, [gameState.tickInterval, gameState.isPaused, gameState.hasLost]);

  const len = pad(gameState.snake.length, 3, true);
  const emptyLine: [string, string] = ['', colors.foreground];

  return (
    <>
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Snake
      </div>
      <div>&nbsp;</div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <PlayField state={gameState}/>

        <Grid
          rows={
            [
              [`Length: ${len}`, colors.foreground],
              emptyLine,
              gameState.hasLost ? ['You Lost!', colors.yellow] : emptyLine,
            ]
          }
          width={14}
        />
      </div>

      <div>&nbsp;</div>
      <div>Arrow keys to move, r to restart, p to pause, q to quit.</div>
    </>
  );
}

export const snakeCommand: Command = {
  name: "snake",
  help: "It's snake",
  run: () => ({
    kind: "app",
    app: { name: "routing", Component: SnakeApp },
  }),
};
