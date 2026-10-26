/* Generates uniquely-solvable puzzles: fill an empty grid completely via randomized backtracking,
   then dig holes in shuffled cell order, keeping each removal only while the puzzle still has
   exactly one solution (checked via countSolutions capped at 2). Puzzles are also graded by
   the human techniques they need (see techniques.js), so they never require guessing:
   - SINGLES_ONLY_MIN_CLUES+ clues (Easy, Medium and matching challenge levels): singles only;
   - TECHNIQUES_MIN_CLUES+ clues (Hard and matching levels): singles plus pointing, claiming
     and naked pairs;
   - below that (expert challenge levels): any unique puzzle. */

const DIFFICULTIES = {
  easy: { minClues: 40, maxHints: 3 },
  medium: { minClues: 32, maxHints: 4 },
  hard: { minClues: 26, maxHints: 5 },
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillGrid(grid, index) {
  if (index === 81) return true;
  if (grid[index] !== 0) return fillGrid(grid, index + 1);

  const row = Math.floor(index / 9);
  const col = index % 9;
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const digit of digits) {
    if (isLegal(grid, row, col, digit)) {
      grid[index] = digit;
      if (fillGrid(grid, index + 1)) return true;
      grid[index] = 0;
    }
  }
  return false;
}

/* Digs a full solution towards targetClues cells (uniqueness may require more) while preserving a unique solution.
   Returns { given: Array(81), solution: Array(81) }. */
const SINGLES_ONLY_MIN_CLUES = 32;
const TECHNIQUES_MIN_CLUES = 26;

function digOnce(targetClues) {
  const keepsUnique = targetClues >= SINGLES_ONLY_MIN_CLUES ? grid => solvesLogically(grid, false)
    : targetClues >= TECHNIQUES_MIN_CLUES ? grid => solvesLogically(grid, true)
    : grid => countSolutions(grid, 2) === 1;
  const solution = new Array(81).fill(0);
  fillGrid(solution, 0);

  const puzzle = solution.slice();
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;

  for (const idx of order) {
    if (clues <= targetClues) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;

    if (keepsUnique(puzzle)) {
      clues--;
    } else {
      puzzle[idx] = backup;
    }
  }

  return { given: puzzle, solution, clues };
}

/* A single dig can get stuck above the target on low clue counts, so retry a few times and
   keep the sparsest puzzle. In the techniques band, prefer a puzzle that singles alone cannot
   finish, so Hard really asks for the elimination techniques. */
const DIG_ATTEMPTS = 12;
const DIG_ATTEMPTS_FOR_ELIMINATIONS = 40;

function digPuzzle(targetClues) {
  const wantsEliminations = targetClues >= TECHNIQUES_MIN_CLUES && targetClues < SINGLES_ONLY_MIN_CLUES;
  const score = dug => (dug.clues > targetClues ? 2 : 0) + (wantsEliminations && solvesLogically(dug.given, false) ? 1 : 0);
  let best = null;
  const attempts = wantsEliminations ? DIG_ATTEMPTS_FOR_ELIMINATIONS : DIG_ATTEMPTS;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const dug = digOnce(targetClues);
    dug.score = score(dug);
    if (!best || dug.score < best.score || (dug.score === best.score && dug.clues < best.clues)) best = dug;
    if (best.score === 0) break;
  }
  return { given: best.given, solution: best.solution };
}

/* Returns a puzzle for the requested difficulty key ('easy' | 'medium' | 'hard'). */
function generatePuzzle(difficultyKey) {
  return digPuzzle(DIFFICULTIES[difficultyKey].minClues);
}

/* Returns a puzzle for the challenge ladder — clue count comes straight from the level ramp. */
function generatePuzzleForLevel(level) {
  return digPuzzle(cluesForLevel(level));
}
