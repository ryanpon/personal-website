import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import type { AppExit, Command } from "./types";
import { pad } from "../helpers";

const gridSize = 18;
const cellSize = '2ch';
const emptyVal = '·';
const initialInterval = 300;
const pausedInterval = 99999999;

type Coord = [number, number];

type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  snake: Coord[];
  head: Coord;
  tail: Coord;
  food: Coord;
  dir: Direction;
  tickInterval: number,
  hasLost: boolean,
};

type Action =
  | { type: 'TICK' }
  | { type: 'INPUT_DIRECTION', dir: Direction }
  | { type: 'RESTART' }
  | { type: 'LOSE' }
  | { type: 'TOGGLE_PAUSE' }
  ;

type Hotkey = {
  key: string;
  desc: string;
  dispatchAction: Action;
};

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function inBounds([x, y]: Coord): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
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

function cmppair([x1, y1]: Coord, [x2, y2]: Coord): boolean {
  return x1 === x2 && y1 === y2;
}

function linearCoord([x, y]: Coord) {
  return x + y * gridSize;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TICK': {
      const next = nextCell(state.head, state.dir);
      const nextHasFood = cmppair(next, state.food);
      const body = state.snake.slice(nextHasFood ? 0 : 1);
      const food: Coord = nextHasFood ? 
        ([randInt(0, gridSize - 1), randInt(0, gridSize - 1)]) :
        state.food;
      const snake = [...body, next];
      const nextState = {...state, snake, head: next, food};
      if (!inBounds(next) || state.snake.some(crd => cmppair(crd, next))) {
        return reducer(nextState, { type: 'LOSE' });
      }

      return nextState;
    }
    case 'INPUT_DIRECTION': {
      const {dir} = action;
      return {...state, dir};
    }
    case 'RESTART': {
      return initialState();
    }
    case 'LOSE': {
      return { ...state, hasLost: true, tickInterval: pausedInterval };
    }
    case 'TOGGLE_PAUSE': {
      if (state.hasLost) {
        return state;
      }
      return { ...state, tickInterval: state.tickInterval === pausedInterval ? initialInterval : pausedInterval };
    }
  }
}

function initialState(): GameState {
  const head : Coord = [4, 4];
  const mid  : Coord = [3, 4];
  const tail : Coord = [2, 4];

  const food : Coord = [8, 8]

  return {
    snake: [tail, mid, head],
    head,
    tail,
    food,
    dir: 'right',
    tickInterval: initialInterval,
    hasLost: false
  }
}

function GridView({ state }: {
  state: GameState;
}) {
  const cells: Array<string> = new Array(gridSize ** 2).fill('.');

  for (const coord of state.snake) {
    cells[linearCoord(coord)] = 'o';
  }
  cells[linearCoord(state.head)] = '@';
  cells[linearCoord(state.food)] = '*';

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
        gridAutoRows: cellSize,
        lineHeight: cellSize,
        textAlign: "center",
      }}
    >
      {cells.map((cell, idx) => (
        <span key={idx}>{cell}</span>
      ))}
    </div>
  );
}

function SnakeApp({ onExit }: { onExit: AppExit }) {
  const [gameState, dispatch] = useReducer(reducer, undefined, initialState);

  const hotkeys = useMemo<Hotkey[]>(() => [
    {
      key: 'r', 
      desc: 'restart', 
      dispatchAction: { type: 'RESTART' },
    },
    {
      key: 'p', 
      desc: gameState.tickInterval === pausedInterval ? 'pause' : 'unpause', 
      dispatchAction: { type: 'TOGGLE_PAUSE' },
    },
    { 
      key: 'arrowdown', 
      desc: 'move down', 
      dispatchAction: { type: 'INPUT_DIRECTION', dir: 'down' },
    },
    { 
      key: 'arrowup', 
      desc: 'move up', 
      dispatchAction: { type: 'INPUT_DIRECTION', dir: 'up' },
    },
    { 
      key: 'arrowleft', 
      desc: 'move left', 
      dispatchAction: { type: 'INPUT_DIRECTION', dir: 'left' },
    },
    { 
      key: 'arrowright', 
      desc: 'move right', 
      dispatchAction: { type: 'INPUT_DIRECTION', dir: 'right' },
    },
  ], [gameState.tickInterval]);

  useEffect(() => {
    const handlerMap = new Map(hotkeys.map(h => [h.key, h]));
    const onKey = (e: KeyboardEvent) => {
      const handler = handlerMap.get(e.key) ?? handlerMap.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        dispatch(handler.dispatchAction);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), gameState.tickInterval);
    return () => window.clearInterval(id);
  }, [gameState.tickInterval]);

  const len = pad(gameState.snake.length, 3, true);

  return (
    <>
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Snake
      </div>
      <div>&nbsp;</div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <GridView
          state={gameState}
        />
        <div style={{ whiteSpace: 'pre' }}>
          {
            [
              " ┌──────────────┐",
              ` │ Length: ${len}  │`,
              " │              │",
              " │              │",
              " └──────────────┘",
            ].map((cell, idx) => <div key={idx}>{cell}</div>)
          }
        </div>
      </div>

      <div>&nbsp;</div>
      <div>Arrow keys to move, r to restart, p to pause.</div>
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
