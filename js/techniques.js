/* Human solving techniques over a candidate grid, used to explain hints and to grade puzzles:
   - singles: a digit with one possible cell in a box/row/column (hidden), or a cell with one
     possible digit (naked);
   - eliminations: pointing (a box's candidates for a digit sit on one line), claiming (a line's
     candidates for a digit sit in one box) and naked pairs.
   Candidates are 9-bit masks (bit d = digit d); filled cells have mask 0. */

function unitIndices(type, n) {
  if (type === 'row') return Array.from({ length: 9 }, (_, i) => n * 9 + i);
  if (type === 'col') return Array.from({ length: 9 }, (_, i) => i * 9 + n);
  const r0 = Math.floor(n / 3) * 3, c0 = (n % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => (r0 + Math.floor(i / 3)) * 9 + c0 + (i % 3));
}

const UNIT_CELLS = { box: [], row: [], col: [] };
for (const type of ['box', 'row', 'col']) for (let n = 0; n < 9; n++) UNIT_CELLS[type].push(unitIndices(type, n));

const boxOf = idx => Math.floor(Math.floor(idx / 9) / 3) * 3 + Math.floor((idx % 9) / 3);

const PEERS = Array.from({ length: 81 }, (_, idx) => {
  const peers = new Set([...UNIT_CELLS.row[Math.floor(idx / 9)], ...UNIT_CELLS.col[idx % 9], ...UNIT_CELLS.box[boxOf(idx)]]);
  peers.delete(idx);
  return [...peers];
});

/* Box first: a digit with only one home in its 3x3 box is the easiest deduction to spot. */
const UNIT_ORDER = ['box', 'row', 'col'];

function candidateMasks(grid) {
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  for (let idx = 0; idx < 81; idx++) {
    if (!grid[idx]) continue;
    const bit = 1 << grid[idx];
    rows[Math.floor(idx / 9)] |= bit; cols[idx % 9] |= bit; boxes[boxOf(idx)] |= bit;
  }
  return grid.map((v, idx) => (v ? 0 : ~(rows[Math.floor(idx / 9)] | cols[idx % 9] | boxes[boxOf(idx)]) & 0x3fe));
}

function digitsOf(mask) {
  const out = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

/* One single on the given candidates, or null. `onlyIndex` restricts it to that cell.
   Returns { index, digit, technique: 'hidden' | 'naked', unit: { type, index } | null }. */
function findSingleIn(masks, onlyIndex = null) {
  for (const type of UNIT_ORDER) {
    for (let n = 0; n < 9; n++) {
      const cells = UNIT_CELLS[type][n];
      if (onlyIndex !== null && !cells.includes(onlyIndex)) continue;
      // Digits seen in exactly one cell of the unit: once & ~twice.
      let once = 0, twice = 0;
      for (const i of cells) { twice |= once & masks[i]; once |= masks[i]; }
      let unique = once & ~twice;
      if (onlyIndex !== null) unique &= masks[onlyIndex];
      if (!unique) continue;
      const digit = digitsOf(unique)[0];
      const index = cells.find(i => masks[i] & (1 << digit));
      return { index, digit, technique: 'hidden', unit: { type, index: n } };
    }
  }
  for (let idx = 0; idx < 81; idx++) {
    if (onlyIndex !== null && idx !== onlyIndex) continue;
    const m = masks[idx];
    if (m && (m & (m - 1)) === 0) return { index: idx, digit: digitsOf(m)[0], technique: 'naked', unit: null };
  }
  return null;
}

function findSingle(grid, onlyIndex = null) {
  return findSingleIn(candidateMasks(grid), onlyIndex);
}

/* First elimination that removes at least one candidate, or null.
   Returns { kind: 'pointing' | 'claiming' | 'pair', digits, source, target, cells, removals }
   where source/target are units ({ type, index }), cells are the cells that justify it and
   removals are [index, mask] pairs to clear. */
function findElimination(masks) {
  const removalsIn = (cells, keep, bits) => cells
    .filter(i => !keep.includes(i) && (masks[i] & bits))
    .map(i => [i, masks[i] & bits]);

  for (let b = 0; b < 9; b++) {
    const box = UNIT_CELLS.box[b];
    for (let d = 1; d <= 9; d++) {
      const homes = box.filter(i => masks[i] & (1 << d));
      if (homes.length < 2) continue;
      for (const type of ['row', 'col']) {
        const line = type === 'row' ? Math.floor(homes[0] / 9) : homes[0] % 9;
        if (!homes.every(i => (type === 'row' ? Math.floor(i / 9) : i % 9) === line)) continue;
        const removals = removalsIn(UNIT_CELLS[type][line], homes, 1 << d);
        if (removals.length) return { kind: 'pointing', digits: [d], source: { type: 'box', index: b }, target: { type, index: line }, cells: homes, removals };
      }
    }
  }
  for (const type of ['row', 'col']) {
    for (let n = 0; n < 9; n++) {
      const line = UNIT_CELLS[type][n];
      for (let d = 1; d <= 9; d++) {
        const homes = line.filter(i => masks[i] & (1 << d));
        if (homes.length < 2 || !homes.every(i => boxOf(i) === boxOf(homes[0]))) continue;
        const removals = removalsIn(UNIT_CELLS.box[boxOf(homes[0])], homes, 1 << d);
        if (removals.length) return { kind: 'claiming', digits: [d], source: { type, index: n }, target: { type: 'box', index: boxOf(homes[0]) }, cells: homes, removals };
      }
    }
  }
  for (const type of UNIT_ORDER) {
    for (let n = 0; n < 9; n++) {
      const cells = UNIT_CELLS[type][n];
      const pairs = cells.filter(i => bitCount(masks[i]) === 2);
      for (let a = 0; a < pairs.length; a++) {
        for (let b = a + 1; b < pairs.length; b++) {
          if (masks[pairs[a]] !== masks[pairs[b]]) continue;
          const pair = [pairs[a], pairs[b]];
          const removals = removalsIn(cells, pair, masks[pair[0]]);
          if (removals.length) return { kind: 'pair', digits: digitsOf(masks[pair[0]]), source: { type, index: n }, target: { type, index: n }, cells: pair, removals };
        }
      }
    }
  }
  return null;
}

function applyElimination(masks, elimination) {
  for (const [i, bits] of elimination.removals) masks[i] &= ~bits;
}

/* Re-checks an elimination's reason on the current candidates and applies it; false if the
   reason no longer holds (it depended on an elimination that was dropped). */
function replayElimination(masks, e) {
  const bits = e.digits.reduce((m, d) => m | (1 << d), 0);
  const source = UNIT_CELLS[e.source.type][e.source.index];
  const target = UNIT_CELLS[e.target.type][e.target.index];
  if (e.kind === 'pair') {
    if (!e.cells.every(i => masks[i] && (masks[i] & ~bits) === 0)) return false;
    target.forEach(i => { if (!e.cells.includes(i)) masks[i] &= ~bits; });
    return true;
  }
  const homes = source.filter(i => masks[i] & bits);
  if (homes.length < 2 || !homes.every(i => target.includes(i))) return false;
  target.forEach(i => { if (!source.includes(i)) masks[i] &= ~bits; });
  return true;
}

function replayChain(grid, chain) {
  const masks = candidateMasks(grid);
  return chain.every(e => replayElimination(masks, e)) ? masks : null;
}

/* A short chain of eliminations (greedy, at most `maxEliminations`) that exposes a single,
   optionally for one cell, pruned to the steps the single actually needs.
   Returns { single, eliminations } or null. */
function planDeduction(grid, onlyIndex = null, maxEliminations = 30) {
  const masks = candidateMasks(grid);
  let eliminations = [];
  let single = findSingleIn(masks, onlyIndex);
  while (!single) {
    if (eliminations.length >= maxEliminations) return null;
    const elimination = findElimination(masks);
    if (!elimination) return null;
    applyElimination(masks, elimination);
    eliminations.push(elimination);
    single = findSingleIn(masks, onlyIndex);
  }
  for (let i = eliminations.length - 1; i >= 0 && eliminations.length > 1; i--) {
    const trial = eliminations.filter((_, k) => k !== i);
    const trialMasks = replayChain(grid, trial);
    const step = trialMasks && findSingleIn(trialMasks, single.index);
    if (step && step.digit === single.digit) eliminations = trial;
  }
  if (eliminations.length) single = findSingleIn(replayChain(grid, eliminations), single.index);
  return { single, eliminations };
}

/* True when the grid can be completed by forced steps only: singles, plus the eliminations
   when `withEliminations` is set. Every step is forced, so a grid that passes also has exactly
   one solution. */
function solvesLogically(grid, withEliminations = false) {
  const work = grid.slice();
  const masks = candidateMasks(work);
  let empty = work.reduce((n, v) => n + (v === 0), 0);
  while (empty > 0) {
    const single = findSingleIn(masks);
    if (single) {
      work[single.index] = single.digit;
      masks[single.index] = 0;
      empty--;
      const clear = ~(1 << single.digit);
      for (const p of PEERS[single.index]) {
        masks[p] &= clear;
        if (work[p] === 0 && masks[p] === 0) return false; // contradiction
      }
      continue;
    }
    const elimination = withEliminations ? findElimination(masks) : null;
    if (!elimination) return false;
    applyElimination(masks, elimination);
  }
  return findConflictIndices(work).size === 0;
}

function solvesWithSingles(grid) {
  return solvesLogically(grid, false);
}
