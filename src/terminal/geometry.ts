export type Coord = [number, number];

export type Direction = 'up' | 'down' | 'left' | 'right';

export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const STEP: Record<Direction, Coord> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function eq([x1, y1]: Coord, [x2, y2]: Coord): boolean {
  return x1 === x2 && y1 === y2;
}

export function dist([x1, y1]: Coord, [x2, y2]: Coord): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

export function inBounds([x, y]: Coord, width: number, height: number = width): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

export function step([x, y]: Coord, dir: Direction): Coord {
  const [dx, dy] = STEP[dir];
  return [x + dx, y + dy];
}

export function dirBetween([x1, y1]: Coord, [x2, y2]: Coord): Direction {
  if (x1 < x2) return 'right';
  if (x1 > x2) return 'left';
  if (y1 < y2) return 'down';
  return 'up';
}
