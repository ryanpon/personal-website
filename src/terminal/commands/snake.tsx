import { useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import { appCommand, type AppExit, type Command } from "./types";
import { pad, chunk, randInt } from "../helpers";
import { Grid } from "../../components/grid";
import {
  type Coord,
  type Direction,
  OPPOSITE,
  dirBetween,
  eq as coordsEq,
  inBounds as coordInBounds,
  step,
} from "../geometry";
import { type Hotkey, useHotkeys } from "../hooks/useHotkeys";
import { useInterval } from "../hooks/useInterval";

const gridSize = 15;
const cellSize = '2ch';
const emptyVal = '·';
const initialInterval = 350;

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

function coordIndex([x, y]: Coord) {
  return x + y * gridSize;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TICK': {
      const next = step(state.head, state.nextDir);
      const nextHasFood = coordsEq(next, state.food);
      const body = state.snake.slice(nextHasFood ? 0 : 1);
      const snake = [...body, next];
      let food: Coord;
      if (nextHasFood) {
        food = snake[0];
        while (snake.some(crd => coordsEq(crd, food))) {
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

      const bodyCollision = body.some(crd => coordsEq(crd, next));
      const outOfBounds = !coordInBounds(next, gridSize);
      if (outOfBounds || bodyCollision) {
        return { ...nextState, hasLost: true };
      }

      return nextState;
    }
    case 'INPUT_DIRECTION': {
      const {dir} = action;
      if (dir === OPPOSITE[state.curDir]) {
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

  const firstDir = dirBetween(pCrd, crd);
  const secondDir = dirBetween(crd, nCrd);
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
    { key: 'r', fn: () => dispatch({ type: 'RESTART' }) },
    { key: 'p', fn: () => dispatch({ type: 'TOGGLE_PAUSE' }) },
    { key: 'arrowdown', fn: () => dispatch({ type: 'INPUT_DIRECTION', dir: 'down' }) },
    { key: 'arrowup', fn: () => dispatch({ type: 'INPUT_DIRECTION', dir: 'up' }) },
    { key: 'arrowleft', fn: () => dispatch({ type: 'INPUT_DIRECTION', dir: 'left' }) },
    { key: 'arrowright', fn: () => dispatch({ type: 'INPUT_DIRECTION', dir: 'right' }) },
  ], [onExit]);

  useHotkeys(hotkeys);

  useInterval(
    () => dispatch({ type: 'TICK' }),
    gameState.isPaused || gameState.hasLost ? null : gameState.tickInterval,
  );

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
        <div style={{flexDirection: 'column'}}>
          <Grid
            rows={
              [
                [`Length: ${len}`, colors.foreground],
                emptyLine,
                gameState.hasLost ? ['You Lost!', colors.yellow] : emptyLine,
              ]
            }
            width={18}
          />
          <Grid
            rows={
              [
                ["Arrow keys to move", colors.foreground],
                ["r to restart", colors.foreground],
                ["p to pause", colors.foreground],
                ["q to quit", colors.foreground],
              ]
            }
            width={18}
          />
        </div>
      </div>
    </>
  );
}

export const snakeCommand: Command = appCommand("snake", "It's snake", SnakeApp);
