/* Pure backtracking utilities shared by the generator (uniqueness checks) and the engine
   (conflict detection). The board is a flat Array(81) of digits 1-9, with 0 meaning empty. */

function isLegal(grid, row, col, digit) {
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 9; i++) {
    if (grid[row * 9 + i] === digit) return false;
    if (grid[i * 9 + col] === digit) return false;
    const br = boxRow + Math.floor(i / 3);
    const bc = boxCol + (i % 3);
    if (grid[br * 9 + bc] === digit) return false;
  }
  return true;
}

/* Finds the empty cell with the fewest legal candidates (MRV heuristic).
   Returns {index, candidates} or null if the grid is already full. */
function findMrvCell(grid) {
  let bestIndex = -1;
  let bestCandidates = null;
  for (let idx = 0; idx < 81; idx++) {
    if (grid[idx] !== 0) continue;
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const candidates = [];
    for (let d = 1; d <= 9; d++) if (isLegal(grid, row, col, d)) candidates.push(d);
    if (candidates.length === 0) return { index: idx, candidates: [] };
    if (bestCandidates === null || candidates.length < bestCandidates.length) {
      bestIndex = idx;
      bestCandidates = candidates;
      if (candidates.length === 1) break;
    }
  }
  return bestIndex === -1 ? null : { index: bestIndex, candidates: bestCandidates };
}

/* Counts solutions up to `cap`, stopping early once reached. Used to verify a puzzle has
   exactly one solution (cap = 2). Mutates `grid` in place but restores it before returning. */
function countSolutions(grid, cap = 2) {
  const cell = findMrvCell(grid);
  if (!cell) return 1;
  const { index, candidates } = cell;
  if (candidates.length === 0) return 0;
  let found = 0;
  for (const digit of candidates) {
    grid[index] = digit;
    found += countSolutions(grid, cap - found);
    grid[index] = 0;
    if (found >= cap) break;
  }
  return found;
}

/* Recomputes conflict flags for every occupied cell: any digit repeated within its row,
   column, or 3x3 box marks all cells sharing that digit in that unit as conflicting.
   Returns a Set of conflicting indices. */
function findConflictIndices(values) {
  const conflicts = new Set();

  function scanUnit(indices) {
    const seen = new Map();
    for (const idx of indices) {
      const v = values[idx];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(idx);
    }
    for (const idxs of seen.values()) {
      if (idxs.length > 1) idxs.forEach((i) => conflicts.add(i));
    }
  }

  for (let row = 0; row < 9; row++) {
    scanUnit(Array.from({ length: 9 }, (_, i) => row * 9 + i));
  }
  for (let col = 0; col < 9; col++) {
    scanUnit(Array.from({ length: 9 }, (_, i) => i * 9 + col));
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const idxs = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        idxs.push((boxRow * 3 + r) * 9 + (boxCol * 3 + c));
      }
      scanUnit(idxs);
    }
  }
  return conflicts;
}
