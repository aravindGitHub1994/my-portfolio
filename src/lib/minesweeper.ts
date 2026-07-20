// Minesweeper rules (plan-0009 §8.2) — ORIGINAL implementation of the
// classic ruleset, no ported code and no Microsoft assets (ADR-012 §10).
//
// Pure and DOM-free on purpose, the same split that made 7.2's fidelity
// ladder checkable: every rule that can be got subtly wrong (first-click
// safety, flood fill, the win condition) can be exercised by compiling
// this file standalone and playing boards in a loop, which is a far
// stronger check than clicking squares in a browser. The component holds
// no rules of its own — it renders a Board and calls these.

export type CellState = "hidden" | "revealed" | "flagged";
export type GameStatus = "ready" | "playing" | "won" | "lost";

export interface Board {
  size: number;
  mineCount: number;
  /** All false until the first reveal places them (first-click safety). */
  mines: boolean[];
  adjacent: number[];
  cells: CellState[];
  status: GameStatus;
  /** The mine that ended it — the era paints this one differently. */
  detonated: number | null;
}

/** Beginner geometry. Era-authentic beginner is 10 mines; the plan asks
 *  for 16, which is a harder board — one constant, easy to retune. */
export const BOARD_SIZE = 9;
export const MINE_COUNT = 16;

export function createBoard(
  size = BOARD_SIZE,
  mineCount = MINE_COUNT,
): Board {
  const n = size * size;
  return {
    size,
    mineCount: Math.min(mineCount, n - 1),
    mines: Array(n).fill(false),
    adjacent: Array(n).fill(0),
    cells: Array(n).fill("hidden"),
    status: "ready",
    detonated: null,
  };
}

export function neighbors(size: number, index: number): number[] {
  const r = Math.floor(index / size);
  const c = index % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      out.push(nr * size + nc);
    }
  }
  return out;
}

/**
 * Place mines avoiding `safeIndex`, then count adjacencies. Called on the
 * FIRST reveal, never at construction — that is the whole of first-click
 * safety, and it is era-accurate in excluding only the clicked cell (the
 * later convention of clearing its neighbours too came after this era, and
 * makes the opening move give away more than it should).
 *
 * `rand` is injected rather than reached for so a test can play a
 * deterministic board; the component seeds it per game.
 */
export function placeMines(
  board: Board,
  safeIndex: number,
  rand: () => number,
): Board {
  const n = board.size * board.size;
  const mines = Array(n).fill(false);
  let placed = 0;
  while (placed < board.mineCount) {
    const at = Math.floor(rand() * n);
    if (at === safeIndex || mines[at]) continue;
    mines[at] = true;
    placed++;
  }
  const adjacent = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (mines[i]) continue;
    adjacent[i] = neighbors(board.size, i).filter((j) => mines[j]).length;
  }
  return { ...board, mines, adjacent };
}

function copy(board: Board): Board {
  return { ...board, cells: [...board.cells] };
}

/** Every non-mine cell uncovered — flags are irrelevant, as in the era. */
function hasWon(board: Board): boolean {
  const n = board.size * board.size;
  let revealed = 0;
  for (let i = 0; i < n; i++) if (board.cells[i] === "revealed") revealed++;
  return revealed === n - board.mineCount;
}

/**
 * Reveal a cell. Hitting a mine ends the game and uncovers the rest of
 * them; an empty cell floods outward to the first numbered ring, which is
 * iterative rather than recursive so a wide-open board cannot blow the
 * stack.
 */
export function reveal(board: Board, index: number): Board {
  if (board.status === "won" || board.status === "lost") return board;
  if (board.cells[index] !== "hidden") return board;

  const next = copy(board);
  next.status = "playing";

  if (next.mines[index]) {
    next.cells[index] = "revealed";
    next.detonated = index;
    next.status = "lost";
    for (let i = 0; i < next.cells.length; i++) {
      if (next.mines[i] && next.cells[i] !== "flagged") {
        next.cells[i] = "revealed";
      }
    }
    return next;
  }

  const stack = [index];
  while (stack.length > 0) {
    const at = stack.pop()!;
    if (next.cells[at] !== "hidden") continue;
    next.cells[at] = "revealed";
    if (next.adjacent[at] === 0) {
      for (const j of neighbors(next.size, at)) {
        // Flagged neighbours are left alone: the visitor said there is a
        // mine there, and the flood should not overrule them.
        if (next.cells[j] === "hidden") stack.push(j);
      }
    }
  }

  if (hasWon(next)) next.status = "won";
  return next;
}

/** Cycle hidden ↔ flagged. Revealed cells ignore it. */
export function toggleFlag(board: Board, index: number): Board {
  if (board.status === "won" || board.status === "lost") return board;
  if (board.cells[index] === "revealed") return board;
  const next = copy(board);
  next.cells[index] = next.cells[index] === "flagged" ? "hidden" : "flagged";
  return next;
}

/** Mines left to find, by the visitor's own reckoning — can go negative,
 *  exactly as the era's counter did when you over-flagged. */
export function minesRemaining(board: Board): number {
  return (
    board.mineCount - board.cells.filter((c) => c === "flagged").length
  );
}
