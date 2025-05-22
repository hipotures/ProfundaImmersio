export interface BoardState {
  width: number;
  depth: number;
  height: number;
  cells: boolean[][][];
}

const state: BoardState = {
  width: 0,
  depth: 0,
  height: 0,
  cells: []
};

export function initBoardState(width: number, depth: number, height: number) {
  state.width = width;
  state.depth = depth;
  state.height = height;
  state.cells = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => Array(depth).fill(false))
  );
}

export function lowestEmptyY(x: number, z: number): number {
  for (let y = 0; y < state.height; y++) {
    if (!state.cells[x][y][z]) {
      if (y === 0 || state.cells[x][y - 1][z]) {
        return y;
      }
    }
  }
  return state.height - 1;
}

export function occupyCell(x: number, y: number, z: number) {
  state.cells[x][y][z] = true;
}

export function isOccupied(x: number, y: number, z: number): boolean {
  return state.cells[x][y][z];
}

export default state;
