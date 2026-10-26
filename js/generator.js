/* Generates uniquely-solvable puzzles: fill an empty grid completely via randomized backtracking,
   then dig holes in shuffled cell order, keeping each removal only while the puzzle still has
   exactly one solution (checked via countSolutions capped at 2). Puzzles are also graded by
   the human techniques they need (see techniques.js), so they never require guessing:
   - SINGLES_ONLY_MIN_CLUES+ clues (Easy, Medium and matching challenge levels): singles only;
   - TECHNIQUES_MIN_CLUES+ clues (Hard and matching levels): singles plus pointing, claiming
     and naked pairs;
   - below that (expert challenge levels): all of those plus X-Wing. */

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

/* Technique band for a clue target: the hardest technique allowed and the dig budget spent
   looking for a puzzle that really needs it. X-Wing puzzles are rare (a few per hundred digs),
   so after `settleAfter` attempts an expert search accepts one that needs the basic
   eliminations, which almost every expert level reaches. */
function techniqueBand(targetClues) {
  if (targetClues >= SINGLES_ONLY_MIN_CLUES) return { level: TECHNIQUE.SINGLES, attempts: 12, settleAfter: 12 };
  if (targetClues >= TECHNIQUES_MIN_CLUES) return { level: TECHNIQUE.BASIC, attempts: 40, settleAfter: 40 };
  return { level: TECHNIQUE.XWING, attempts: 60, settleAfter: 20 };
}

function digOnce(targetClues, level) {
  const solution = new Array(81).fill(0);
  fillGrid(solution, 0);

  const puzzle = solution.slice();
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;

  for (const idx of order) {
    if (clues <= targetClues) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;

    if (solvesLogically(puzzle, level)) {
      clues--;
    } else {
      puzzle[idx] = backup;
    }
  }

  return { given: puzzle, solution, clues };
}

/* A single dig can get stuck above the target on low clue counts, so retry and keep the best
   puzzle: first one that reaches the target, then one the simpler technique levels cannot
   finish, so Hard asks for eliminations and expert levels for X-Wing when one turns up. */
function digPuzzle(targetClues) {
  const { level, attempts, settleAfter } = techniqueBand(targetClues);
  // Lower is better: reaching the target clue count matters most, then needing every technique
  // level the band allows (each simpler level that still finishes the puzzle costs a point).
  const score = dug => {
    let points = dug.clues > targetClues ? level + 1 : 0;
    for (let simpler = TECHNIQUE.SINGLES; simpler < level; simpler++) if (solvesLogically(dug.given, simpler)) points++;
    return points;
  };
  let best = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const dug = digOnce(targetClues, level);
    dug.score = score(dug);
    if (!best || dug.score < best.score || (dug.score === best.score && dug.clues < best.clues)) best = dug;
    if (best.score === 0 || (attempt + 1 >= settleAfter && best.score <= 1)) break;
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
