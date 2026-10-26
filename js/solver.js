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

function bitCount(mask) {
  let n = 0;
  for (; mask; n++) mask &= mask - 1;
  return n;
}

/* Counts solutions up to `cap`, stopping early once reached. Used to verify a puzzle has
   exactly one solution (cap = 2). Row/column/box digits are tracked as bitmasks (bit d = digit d)
   and the search always branches on the empty cell with the fewest candidates (MRV heuristic).
   The input grid is never mutated. */
function countSolutions(grid, cap = 2) {
  if (!Array.isArray(grid) || grid.length !== 81 || !grid.every(v => Number.isInteger(v) && v >= 0 && v <= 9)
      || !Number.isInteger(cap) || cap <= 0 || findConflictIndices(grid).size) return 0;

  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  const empties = [];
  for (let idx = 0; idx < 81; idx++) {
    const r = Math.floor(idx / 9), c = idx % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    if (grid[idx] === 0) { empties.push({ r, c, b }); continue; }
    const bit = 1 << grid[idx];
    rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
  }

  function search(remaining) {
    if (remaining === 0) return 1;
    let best = -1, bestMask = 0, bestCount = 10;
    for (let k = 0; k < remaining; k++) {
      const { r, c, b } = empties[k];
      const mask = ~(rows[r] | cols[c] | boxes[b]) & 0x3fe;
      const n = bitCount(mask);
      if (n === 0) return 0;
      if (n < bestCount) { best = k; bestMask = mask; bestCount = n; if (n === 1) break; }
    }
    // Move the chosen cell to the end of the active range so the recursion sees the rest.
    const cell = empties[best];
    empties[best] = empties[remaining - 1];
    empties[remaining - 1] = cell;
    let found = 0;
    for (let mask = bestMask; mask && found < cap; mask &= mask - 1) {
      const bit = mask & -mask;
      rows[cell.r] |= bit; cols[cell.c] |= bit; boxes[cell.b] |= bit;
      found += search(remaining - 1);
      rows[cell.r] &= ~bit; cols[cell.c] &= ~bit; boxes[cell.b] &= ~bit;
    }
    empties[remaining - 1] = empties[best];
    empties[best] = cell;
    return found;
  }

  return Math.min(cap, search(empties.length));
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
