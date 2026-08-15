/* Generates uniquely-solvable puzzles: fill an empty grid completely via randomized backtracking,
   then dig holes in shuffled cell order, keeping each removal only while the puzzle still has
   exactly one solution (checked via countSolutions capped at 2). */

const DIFFICULTIES = {
  easy: { minClues: 40, maxClues: 45, maxHints: 3 },
  medium: { minClues: 32, maxClues: 36, maxHints: 4 },
  hard: { minClues: 26, maxClues: 30, maxHints: 5 },
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

/* Digs a full solution down to (at most) targetClues cells while preserving a unique solution.
   Returns { given: Array(81), solution: Array(81) }. */
function digPuzzle(targetClues) {
  const solution = new Array(81).fill(0);
  fillGrid(solution, 0);

  const puzzle = solution.slice();
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;

  for (const idx of order) {
    if (clues <= targetClues) break;
    const backup = puzzle[idx];
    if (backup === 0) continue;
    puzzle[idx] = 0;

    const trial = puzzle.slice();
    const solutions = countSolutions(trial, 2);
    if (solutions === 1) {
      clues--;
    } else {
      puzzle[idx] = backup;
    }
  }

  return { given: puzzle, solution };
}

/* Returns a puzzle for the requested difficulty key ('easy' | 'medium' | 'hard'). */
function generatePuzzle(difficultyKey) {
  return digPuzzle(DIFFICULTIES[difficultyKey].minClues);
}

/* Returns a puzzle for the challenge ladder — clue count comes straight from the level ramp. */
function generatePuzzleForLevel(level) {
  return digPuzzle(cluesForLevel(level));
}
