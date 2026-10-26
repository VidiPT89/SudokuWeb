/* Human solving techniques over a candidate grid, used to explain hints and to grade puzzles:
   - singles: a digit with one possible cell in a box/row/column (hidden), or a cell with one
     possible digit (naked);
   - eliminations: pointing (a box's candidates for a digit sit on one line), claiming (a line's
     candidates for a digit sit in one box), naked pairs and, the hardest, X-Wing (in two rows a
     digit fits only in the same two columns, or the transpose).
   Candidates are 9-bit masks (bit d = digit d); filled cells have mask 0.
   Technique levels grade puzzles: SINGLES < BASIC (pointing, claiming, pairs) < XWING. */

const TECHNIQUE = { SINGLES: 0, BASIC: 1, XWING: 2 };

function unitIndices(type, n) {
  if (type === 'row') return Array.from({ length: 9 }, (_, i) => n * 9 + i);
  if (type === 'col') return Array.from({ length: 9 }, (_, i) => i * 9 + n);
  const r0 = Math.floor(n / 3) * 3, c0 = (n % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => (r0 + Math.floor(i / 3)) * 9 + c0 + (i % 3));
}

const UNIT_CELLS = { box: [], row: [], col: [] };
for (const type of ['box', 'row', 'col']) for (let n = 0; n < 9; n++) UNIT_CELLS[type].push(unitIndices(type, n));

const boxOf = idx => Math.floor(Math.floor(idx / 9) / 3) * 3 + Math.floor((idx % 9) / 3);
const ROW_OF = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9));
const COL_OF = Array.from({ length: 81 }, (_, i) => i % 9);
const BOX_OF = Array.from({ length: 81 }, (_, i) => boxOf(i));

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
    rows[ROW_OF[idx]] |= bit; cols[COL_OF[idx]] |= bit; boxes[BOX_OF[idx]] |= bit;
  }
  const masks = new Array(81);
  for (let idx = 0; idx < 81; idx++) {
    masks[idx] = grid[idx] ? 0 : ~(rows[ROW_OF[idx]] | cols[COL_OF[idx]] | boxes[BOX_OF[idx]]) & 0x3fe;
  }
  return masks;
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

/* First elimination up to `level` that removes at least one candidate, simplest first, or null.
   Returns { kind: 'pointing' | 'claiming' | 'pair' | 'xwing', digits, source, target, cells,
   removals } where source/target are units ({ type, index }), cells are the cells that justify
   it and removals are [index, mask] pairs to clear. An X-Wing also carries `base` and `cover`:
   the two lines (of source.type) holding the digit and the two crossing lines (of target.type). */
function findElimination(masks, level = TECHNIQUE.XWING) {
  // Pointing: a box's candidates for a digit all sit on one row or column.
  for (let b = 0; b < 9; b++) {
    const box = UNIT_CELLS.box[b];
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      let rowsSeen = 0, colsSeen = 0, count = 0;
      for (const i of box) if (masks[i] & bit) { rowsSeen |= 1 << ROW_OF[i]; colsSeen |= 1 << COL_OF[i]; count++; }
      if (count < 2) continue;
      for (const [type, seen] of [['row', rowsSeen], ['col', colsSeen]]) {
        if (seen & (seen - 1)) continue; // spread over more than one line
        const line = digitsOf(seen << 1)[0] - 1;
        const removals = [];
        for (const i of UNIT_CELLS[type][line]) if (BOX_OF[i] !== b && (masks[i] & bit)) removals.push([i, bit]);
        if (removals.length) {
          const homes = box.filter(i => masks[i] & bit);
          return { kind: 'pointing', digits: [d], source: { type: 'box', index: b }, target: { type, index: line }, cells: homes, removals };
        }
      }
    }
  }
  // Claiming: a row's or column's candidates for a digit all sit in one box.
  for (const type of ['row', 'col']) {
    const lineOf = type === 'row' ? ROW_OF : COL_OF;
    for (let n = 0; n < 9; n++) {
      const line = UNIT_CELLS[type][n];
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        let boxesSeen = 0, count = 0;
        for (const i of line) if (masks[i] & bit) { boxesSeen |= 1 << BOX_OF[i]; count++; }
        if (count < 2 || (boxesSeen & (boxesSeen - 1))) continue;
        const b = digitsOf(boxesSeen << 1)[0] - 1;
        const removals = [];
        for (const i of UNIT_CELLS.box[b]) if (lineOf[i] !== n && (masks[i] & bit)) removals.push([i, bit]);
        if (removals.length) {
          const homes = line.filter(i => masks[i] & bit);
          return { kind: 'claiming', digits: [d], source: { type, index: n }, target: { type: 'box', index: b }, cells: homes, removals };
        }
      }
    }
  }
  // Naked pair: two cells of a unit with the same two candidates.
  for (const type of UNIT_ORDER) {
    for (let n = 0; n < 9; n++) {
      const cells = UNIT_CELLS[type][n];
      for (let a = 0; a < 9; a++) {
        const pairMask = masks[cells[a]];
        if (bitCount(pairMask) !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          if (masks[cells[b]] !== pairMask) continue;
          const removals = [];
          for (const i of cells) if (i !== cells[a] && i !== cells[b] && (masks[i] & pairMask)) removals.push([i, masks[i] & pairMask]);
          if (removals.length) {
            return { kind: 'pair', digits: digitsOf(pairMask), source: { type, index: n }, target: { type, index: n }, cells: [cells[a], cells[b]], removals };
          }
        }
      }
    }
  }
  return level >= TECHNIQUE.XWING ? findXWing(masks) : null;
}

function findXWing(masks) {
  for (const [baseType, coverType] of [['row', 'col'], ['col', 'row']]) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      // positions[line] = 9-bit mask of the cover lines where the digit can sit on that base line.
      const positions = UNIT_CELLS[baseType].map(cells => cells.reduce((m, i, k) => (masks[i] & bit ? m | (1 << k) : m), 0));
      for (let a = 0; a < 9; a++) {
        if (bitCount(positions[a]) !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          if (positions[b] !== positions[a]) continue;
          const cover = digitsOf(positions[a] << 1).map(k => k - 1);
          const cells = [a, b].flatMap(line => cover.map(k => UNIT_CELLS[baseType][line][k]));
          const removals = cover.flatMap(c => UNIT_CELLS[coverType][c])
            .filter(i => !cells.includes(i) && (masks[i] & bit))
            .map(i => [i, bit]);
          if (removals.length) {
            return { kind: 'xwing', digits: [d], source: { type: baseType, index: a }, target: { type: coverType, index: cover[0] },
              base: [a, b], cover, cells, removals };
          }
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
  if (e.kind === 'xwing') {
    // Each base line must still hold the digit, and only on the cover lines.
    const coverCells = e.cover.flatMap(c => UNIT_CELLS[e.target.type][c]);
    const baseCells = e.base.flatMap(b => UNIT_CELLS[e.source.type][b]);
    if (!e.base.every(b => UNIT_CELLS[e.source.type][b].some(i => masks[i] & bits))) return false;
    if (baseCells.some(i => (masks[i] & bits) && !coverCells.includes(i))) return false;
    coverCells.forEach(i => { if (!baseCells.includes(i)) masks[i] &= ~bits; });
    return true;
  }
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

/* True when the grid can be completed by forced steps only, using techniques up to `level`.
   Every step is forced, so a grid that passes also has exactly one solution. */
function solvesLogically(grid, level = TECHNIQUE.SINGLES) {
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
    const elimination = level > TECHNIQUE.SINGLES ? findElimination(masks, level) : null;
    if (!elimination) return false;
    applyElimination(masks, elimination);
  }
  return findConflictIndices(work).size === 0;
}

function solvesWithSingles(grid) {
  return solvesLogically(grid, TECHNIQUE.SINGLES);
}
