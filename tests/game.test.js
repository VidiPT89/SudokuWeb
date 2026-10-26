const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let now = 100000;
const storage = new Map();
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, { textContent: '', disabled: false, classList: {
      add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)),
      contains: x => classes.has(x), toggle: (x, enabled) => enabled ? classes.add(x) : classes.delete(x),
    }, addEventListener() {}, querySelectorAll: () => [], setAttribute() {} });
  }
  return nodes.get(id);
}
const context = vm.createContext({
  console, performance: { now: () => now },
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  document: { hidden: false, addEventListener() {}, querySelectorAll: () => [], getElementById: node },
  setInterval: () => 1, clearInterval() {}, setTimeout() {}, clearTimeout() {},
});
for (const file of ['i18n', 'solver', 'techniques', 'challenge', 'generator', 'engine', 'sound', 'storage', 'overlays', 'ui']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', `${file}.js`), 'utf8'), context);
}
const run = code => vm.runInContext(code, context);
let checks = 0;
function check(code, expected = true) { assert.equal(run(code), expected, code); checks++; }
run('game = SudokuGame.newGame("easy"); const original = game.toSnapshot(); const target = game.values.findIndex(v => v === 0);');
check('countSolutions(Array(81).fill(1))', 0);
check('countSolutions([1, 2])', 0);
check('countSolutions(game.solution, 0)', 0);
check('countSolutions(game.solution)', 1);
check('countSolutions(Array(81).fill(0))', 2);
check('countSolutions(Array(81).fill(0), 5)', 5);
// A well-known minimal puzzle with a single solution; the solver must not mutate its input.
run('const inkala = [..."800000000003600000070090200050007000000045700000100030001000068008500010090000400"].map(Number)');
check('countSolutions(inkala)', 1);
check('inkala.join("")', '800000000003600000070090200050007000000045700000100030001000068008500010090000400');
check('SudokuGame.isValidSnapshot(original)');
for (const expression of [
  'null', '{...original, values: []}', '{...original, solution: Array(81).fill(1)}',
  '{...original, given: Array(81).fill(2)}', '{...original, selectedIndex: 81}',
  '{...original, notes: Array(81).fill([10])}', '{...original, difficulty: "__proto__"}',
  '{...original, elapsedSeconds: -1}', '{...original, elapsedSeconds: Infinity}',
  '{...original, hintsUsed: 99}', '{...original, challengeLevel: 0}',
]) check(`SudokuGame.isValidSnapshot(${expression})`, false);
check('game.selectCell(NaN).type', 'ignored');
run('game.selectCell(target)');
check('game.enterDigit(1.5).type', 'ignored');
run('handleResult(game.enterDigit(game.solution[target]))');
assert.equal(node('btn-undo').disabled, false, 'undo must enable after first digit'); checks++;
run('game.toggleNotesMode()');
check('game.enterDigit(2).type', 'ignored');
run('handleUndo()');
check('game.values[target]', 0);
assert.equal(node('btn-undo').disabled, true); checks++;
run('game.toggleNotesMode(); game.hint(); game.undo()');
check('game.hintsUsed', 1);
check('game.values[target]', 0);
now += 2500;
check('game.elapsedSeconds', 2);
run('stopTimer()'); now += 300000;
check('game.elapsedSeconds', 2);
run('startTimer()'); now += 1500;
check('game.elapsedSeconds', 4);
run('saveGame(); game = SudokuGame.fromSnapshot(loadGame())');
check('game.elapsedSeconds', 4);
storage.set('sudokuweb-save', '{"values":[]}');
check('hasSavedGame()', false);
assert.equal(storage.has('sudokuweb-save'), false); checks++;
storage.set('sudokuweb-leaderboard', 'null');
check('recordCompletion("easy", 100, 2).isNewBestTime');
check('getLeaderboardEntry("easy").bestTime', 100);
run('game = SudokuGame.fromSnapshot(original); game.values = game.solution.slice(); clearSavedGame(); saveGame()');
check('hasSavedGame()', false);
for (const difficulty of ['easy', 'medium', 'hard']) {
  for (let i = 0; i < 8; i++) {
    run(`game = SudokuGame.newGame('${difficulty}'); constCopy = game.values.slice()`);
    check('countSolutions(game.values)', 1);
    check('game.values.every((v, i) => v === constCopy[i])');
    check('game.values.every((v, i) => v === 0 || v === game.solution[i])');
    check(`(n => n >= DIFFICULTIES['${difficulty}'].minClues && n <= DIFFICULTIES['${difficulty}'].minClues + 2)(game.values.filter(Boolean).length)`);
  }
}
run('game = SudokuGame.newChallenge(100);');
check('game.difficulty', 'expert');
check('SudokuGame.isValidSnapshot(game.toSnapshot())');
check('countSolutions(game.values)', 1);
check('game.values.filter(Boolean).length <= CHALLENGE_MIN_CLUES + 3');
run('game = SudokuGame.fromSnapshot({...original, values: original.solution.map((v, i) => i === target ? 0 : v)}); game.selectCell(target)');
check('game.enterDigit(game.solution[target]).type', 'won');
const wonTime = run('game.elapsedSeconds'); now += 100000;
check('game.elapsedSeconds', wonTime);
storage.set('sudokuweb-lang', '__proto__');
check('getStoredLang()', 'pt');
storage.set('sudokuweb-difficulty', 'constructor');
check('getStoredDifficulty()', 'easy');
storage.set('sudokuweb-challenges', '{"highestUnlocked":1e999}');
check('loadChallengeProgress().highestUnlocked', 1);
storage.set('sudokuweb-challenges', '{"highestUnlocked":2,"stars":{"1":99},"bestTime":{"1":-1}}');
check('totalStarsEarned(loadChallengeProgress())', 0);
check('Object.keys(loadChallengeProgress().bestTime).length', 0);
// Notes removal is one transaction, including after saving/restoring.
run(`const digit = original.solution[0]; const alternate = digit % 9 + 1;
const blank = {...original, given: Array(81).fill(0), values: Array(81).fill(0), notes: Array.from({length:81}, () => []), undoStack: []};
blank.notes[1] = [digit, alternate]; blank.notes[9] = [digit]; blank.notes[10] = [digit]; blank.notes[40] = [digit];
game = SudokuGame.fromSnapshot(blank); game.selectCell(0); game.enterDigit(digit);`);
check('game.notes[1].has(digit)', false);
check('game.notes[1].has(alternate)');
check('game.notes[9].has(digit)', false);
check('game.notes[10].has(digit)', false);
check('game.notes[40].has(digit)');
run('const savedHistory = JSON.parse(JSON.stringify(game.toSnapshot())); game = SudokuGame.fromSnapshot(savedHistory)');
check('game.canUndo');
run('game.undo()');
check('game.values[0]', 0);
check('[1,9,10,40].every(i => game.notes[i].has(digit))');
check('game.canUndo', false);
run('game.selectCell(0); game.hint(); game = SudokuGame.fromSnapshot(JSON.parse(JSON.stringify(game.toSnapshot()))); game.undo()');
check('game.hintsUsed', 1);
check('game.notes[1].has(digit)');
run('for (let i=1; i<game.maxHints; i++) { game.hint(); game.undo(); }');
check('game.hint().type', 'hintExhausted');
check('game.hintsUsed === game.maxHints');
for (const bad of [
  '[{index:81, prevValue:null, prevNotes:[], peerNotes:[]}]',
  '[{index:0, prevValue:10, prevNotes:[], peerNotes:[]}]',
  '[{index:0, prevValue:null, prevNotes:[0], peerNotes:[]}]',
  '[{index:0, prevValue:null, prevNotes:[], peerNotes:[{index:40, notes:[1]}]}]',
  'Array(201).fill({index:0, prevValue:null, prevNotes:[], peerNotes:[]})',
]) check(`SudokuGame.isValidSnapshot({...blank, undoStack:${bad}})`, false);
run('game = SudokuGame.fromSnapshot({...blank, undoStack:undefined})');
check('game.canUndo', false);
run('game.selectCell(0); game.toggleNotesMode(); for(let i=0;i<205;i++) game.enterDigit(1);');
check('game.toSnapshot().undoStack.length', 200);
run('game = SudokuGame.fromSnapshot(JSON.parse(JSON.stringify(game.toSnapshot()))); for(let i=0;i<200;i++) game.undo()');
check('game.canUndo', false);
check('game.notes[0].has(1)'); // retained state after the five evicted moves
run('game = SudokuGame.fromSnapshot({...blank, values: original.solution.slice()}); game.selectCell(0)');
check('game.enterDigit(alternate).type', 'ignored');
check('game.clearCell().type', 'ignored');
check('game.undo().type', 'ignored');
check('game.hint().type', 'ignored');

// Pedagogical hints: deductions only, wrong entries first, explanation is transient.
check('solvesWithSingles(inkala)', false);
for (const difficulty of ['easy', 'medium']) {
  for (let i = 0; i < 5; i++) {
    run(`game = SudokuGame.newGame('${difficulty}')`);
    check('solvesWithSingles(game.values)');
    check('(s => s !== null && game.solution[s.index] === s.digit)(findSingle(game.values))');
  }
}
run('game = SudokuGame.newGame("easy"); game.selectedIndex = null; game.hint()');
check('["hidden", "naked"].includes(game.lastHint.technique)');
check('game.values[game.lastHint.index] === game.solution[game.lastHint.index]');
check('/\\d/.test(formatHint(game.lastHint, I18N.pt)) && !formatHint(game.lastHint, I18N.en).includes("{")');
run('const empty = game.values.findIndex(v => v === 0); game.selectCell(empty); game.enterDigit(game.solution[empty] % 9 + 1)');
check('game.lastHint', null);
run('game.selectedIndex = null; game.hint()');
check('game.lastHint.technique', 'wrong');
check('game.lastHint.index', run('empty'));
check('game.values[empty] === game.solution[empty]');
run('game.undo()');
check('game.lastHint', null);
check('formatHint({ index: 10, digit: 4, technique: "hidden", unit: { type: "row", index: 1 }, eliminations: [], revealed: true }, I18N.en)', 'In row 2, 4 only fits in column 2.');
// Elimination techniques on hand-made candidate grids.
run('const pointing = Array(81).fill(0); pointing[0] = pointing[1] = 1 << 5; pointing[5] = (1 << 5) | (1 << 3)');
check('JSON.stringify((e => [e.kind, e.removals])(findElimination(pointing)))', '["pointing",[[5,32]]]');
run('const pairGrid = Array(81).fill(0); pairGrid[0] = pairGrid[1] = (1 << 2) | (1 << 7); pairGrid[2] = (1 << 2) | (1 << 4)');
check('JSON.stringify((e => [e.kind, e.digits, e.removals])(findElimination(pairGrid)))', '["pair",[2,7],[[2,4]]]');
check('formatHint({ index: 0, digit: 9, technique: "naked", unit: null, revealed: false, eliminations: [findElimination(pointing)] }, I18N.en)',
  'In box 1, 5 can only go in row 1, so it leaves the rest of row 1.\nRow 1 has a cell where only one digit fits.\nPress Reveal to fill the cell in (uses a hint).');
check('findElimination(Array(81).fill(0))', null);
run('const xwing = Array(81).fill(0); xwing[1] = xwing[6] = xwing[37] = xwing[42] = 1 << 3; xwing[64] = (1 << 3) | (1 << 5)');
check('JSON.stringify((e => [e.kind, e.base, e.cover, e.removals])(findElimination(xwing)))', '["xwing",[0,4],[1,6],[[64,8]]]');
check('findElimination(xwing, TECHNIQUE.BASIC)', null);
check('formatHint({ index: 64, digit: 5, technique: "naked", unit: null, revealed: true, eliminations: [findElimination(xwing)] }, I18N.en).split("\\n")[0]',
  'X-Wing: in rows 1 and 5, 3 can only go in columns 2 and 7, so it leaves the other cells of those columns.');
check('(m => replayElimination(m, findElimination(xwing)) && m[64])(xwing.slice())', 1 << 5);
run('xwing[40] = 1 << 3'); // a third spot on row 5 breaks the X-Wing
check('(m => replayElimination(m, { kind: "xwing", digits: [3], source: { type: "row", index: 0 }, target: { type: "col", index: 1 }, base: [0, 4], cover: [1, 6], cells: [] }))(xwing.slice())', false);
// Expert levels are always solvable by logic (up to X-Wing), never by guessing.
for (let i = 0; i < 3; i++) {
  run('game = SudokuGame.newChallenge(100)');
  check('solvesLogically(game.values, TECHNIQUE.XWING)');
}
// Hard needs eliminations but no guessing; Easy/Medium never need them.
for (let i = 0; i < 5; i++) {
  run('game = SudokuGame.newGame("hard")');
  check('solvesLogically(game.values, TECHNIQUE.BASIC) && !solvesLogically(game.values, TECHNIQUE.SINGLES)');
}
// Hint deductions are sound and short: solving hard puzzles step by step never contradicts the solution.
for (let i = 0; i < 3; i++) {
  run(`game = SudokuGame.newGame("hard"); var work = game.values.slice(), sound = true, longest = 0;
    for (let plan; (plan = planDeduction(work)); ) { longest = Math.max(longest, plan.eliminations.length);
      if (game.solution[plan.single.index] !== plan.single.digit) sound = false; work[plan.single.index] = plan.single.digit; if (!work.includes(0)) break; }`);
  check('sound && !work.includes(0) && longest <= 30');
}
// Clue first (free, board untouched), then the same cell is revealed.
run('game = SudokuGame.newGame("hard"); game.selectedIndex = null; const before = game.values.join(); game.clue()');
check('game.values.join() === before && game.hintsUsed === 0 && game.lastHint.revealed === false');
check('/Revelar/.test(formatHint(game.lastHint, I18N.pt))');
run('const clued = game.lastHint.index; handleHint()');
check('game.hintsUsed === 1 && game.lastHint.revealed && game.lastHint.index === clued');
check('game.values[clued] === game.solution[clued]');
check('game.lastHint.highlight.length > 0');
run('handleHint()');
check('game.hintsUsed === 1 && game.lastHint.revealed === false');
check('unitIndices("box", 4).join()', '30,31,32,39,40,41,48,49,50');
// Sound preference persists and defaults to on.
check('isSoundOn()');
run('setSoundOn(false)');
check('isSoundOn()', false);
run('setSoundOn(true)');

console.log(`game.test.js: ${checks} checks passed`);
