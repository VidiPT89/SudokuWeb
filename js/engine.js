/* Owns the full mutable game state for one puzzle: cells, selection, notes-mode, move/hint
   counters and elapsed time. Every public mutator returns a result object describing what
   happened so the UI layer can react (sound, toast, save, modal) without re-deriving state. */

class SudokuGame {
  constructor(opts) {
    this.difficulty = opts.difficulty; // 'easy' | 'medium' | 'hard'
    this.givenMask = opts.givenMask.slice(); // Array(81) boolean
    this.solution = opts.solution.slice(); // Array(81) 1-9
    this.values = opts.values.slice(); // Array(81) 0-9
    this.notes = opts.notes.map((s) => new Set(s)); // Array(81) Set<number>
    this.selectedIndex = opts.selectedIndex ?? null;
    this.notesMode = opts.notesMode ?? false;
    this.moves = opts.moves ?? 0;
    this.hintsUsed = opts.hintsUsed ?? 0;
    this.wrongMoves = opts.wrongMoves ?? 0;
    this.challengeLevel = opts.challengeLevel ?? null; // null = classic mode
    this.elapsedMilliseconds = (opts.elapsedSeconds ?? 0) * 1000;
    this.runningSince = performance.now();
    this.lastHint = null; // explanation of the latest hint, until the board changes again
    this.undoStack = (opts.undoStack ?? []).map(entry => ({
      index: entry.index,
      prevValue: entry.prevValue,
      prevNotes: new Set(entry.prevNotes),
      peerNotes: entry.peerNotes.map(peer => ({ index: peer.index, notes: new Set(peer.notes) })),
    }));
  }

  static newGame(difficultyKey) {
    const generated = generatePuzzle(difficultyKey);
    const givenMask = generated.given.map((v) => v !== 0);
    return new SudokuGame({
      difficulty: difficultyKey,
      givenMask,
      solution: generated.solution,
      values: generated.given,
      notes: Array.from({ length: 81 }, () => []),
    });
  }

  static newChallenge(level) {
    const generated = generatePuzzleForLevel(level);
    const givenMask = generated.given.map((v) => v !== 0);
    return new SudokuGame({
      difficulty: bandForLevel(level),
      challengeLevel: level,
      givenMask,
      solution: generated.solution,
      values: generated.given,
      notes: Array.from({ length: 81 }, () => []),
    });
  }

  get isChallenge() { return this.challengeLevel !== null; }

  static arePeers(a, b) {
    return a !== b && (Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9
      || (Math.floor(a / 27) === Math.floor(b / 27) && Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3)));
  }

  static isValidSnapshot(snap) {
    if (!snap || typeof snap !== 'object') return false;
    const ints = (xs, min, max) => Array.isArray(xs) && xs.length === 81 && xs.every(v => Number.isInteger(v) && v >= min && v <= max);
    const nonnegative = n => Number.isSafeInteger(n) && n >= 0;
    const level = snap.challengeLevel ?? null;
    if (level !== null && (!Number.isSafeInteger(level) || level < 1 || level > Number.MAX_SAFE_INTEGER - 100)) return false;
    if (!['easy', 'medium', 'hard', ...(level !== null ? ['expert'] : [])].includes(snap.difficulty)) return false;
    if (level !== null && snap.difficulty !== bandForLevel(level)) return false;
    if (!ints(snap.given, 0, 1) || !ints(snap.solution, 1, 9) || !ints(snap.values, 0, 9)) return false;
    if (findConflictIndices(snap.solution).size || snap.given.some((v, i) => v && snap.values[i] !== snap.solution[i])) return false;
    if (!Array.isArray(snap.notes) || snap.notes.length !== 81 || !snap.notes.every(xs => Array.isArray(xs) && xs.every(v => Number.isInteger(v) && v >= 1 && v <= 9))) return false;
    if (snap.selectedIndex != null && (!Number.isInteger(snap.selectedIndex) || snap.selectedIndex < 0 || snap.selectedIndex > 80)) return false;
    const validNotes = xs => Array.isArray(xs) && xs.length <= 9 && xs.every(v => Number.isInteger(v) && v >= 1 && v <= 9);
    const editable = i => Number.isInteger(i) && i >= 0 && i < 81 && snap.given[i] === 0;
    if (snap.undoStack != null && (!Array.isArray(snap.undoStack) || snap.undoStack.length > 200 || !snap.undoStack.every(entry =>
      entry && editable(entry.index) && (entry.prevValue === null || (Number.isInteger(entry.prevValue) && entry.prevValue >= 1 && entry.prevValue <= 9))
      && validNotes(entry.prevNotes) && Array.isArray(entry.peerNotes) && entry.peerNotes.length <= 20
      && new Set(entry.peerNotes.map(peer => peer?.index)).size === entry.peerNotes.length
      && entry.peerNotes.every(peer => peer && editable(peer.index) && SudokuGame.arePeers(entry.index, peer.index) && validNotes(peer.notes))))) return false;
    const budget = level === null ? DIFFICULTIES[snap.difficulty].maxHints : maxHintsForLevel(level);
    return typeof snap.notesMode === 'boolean' && nonnegative(snap.moves) && nonnegative(snap.hintsUsed)
      && snap.hintsUsed <= budget && nonnegative(snap.wrongMoves ?? 0)
      && Number.isFinite(snap.elapsedSeconds) && snap.elapsedSeconds >= 0 && snap.elapsedSeconds <= Number.MAX_SAFE_INTEGER / 1000;
  }

  static fromSnapshot(snap) {
    if (!SudokuGame.isValidSnapshot(snap)) throw new Error('Invalid Sudoku save');
    const givenMask = snap.given.map((v) => v !== 0);
    return new SudokuGame({
      difficulty: snap.difficulty,
      givenMask,
      solution: snap.solution,
      values: snap.values,
      notes: snap.notes,
      selectedIndex: snap.selectedIndex,
      notesMode: snap.notesMode,
      moves: snap.moves,
      hintsUsed: snap.hintsUsed,
      wrongMoves: snap.wrongMoves,
      challengeLevel: snap.challengeLevel ?? null,
      elapsedSeconds: snap.elapsedSeconds,
      undoStack: snap.undoStack,
    });
  }

  get maxHints() {
    if (this.isChallenge) return maxHintsForLevel(this.challengeLevel);
    return DIFFICULTIES[this.difficulty].maxHints;
  }
  get hintsRemaining() { return this.maxHints - this.hintsUsed; }
  get canUndo() { return this.undoStack.length > 0; }
  get elapsedSeconds() {
    return Math.floor((this.elapsedMilliseconds + (this.runningSince === null ? 0 : Math.max(0, performance.now() - this.runningSince))) / 1000);
  }

  pause() {
    if (this.runningSince === null) return;
    this.elapsedMilliseconds += Math.max(0, performance.now() - this.runningSince);
    this.runningSince = null;
  }

  resume() {
    if (this.runningSince === null && !this.isWon) this.runningSince = performance.now();
  }

  cells() {
    const conflicts = findConflictIndices(this.values);
    const out = [];
    for (let idx = 0; idx < 81; idx++) {
      out.push({
        row: Math.floor(idx / 9),
        col: idx % 9,
        boxIndex: Math.floor(Math.floor(idx / 9) / 3) * 3 + Math.floor((idx % 9) / 3),
        isGiven: this.givenMask[idx],
        value: this.values[idx] || null,
        notes: this.notes[idx],
        isConflict: conflicts.has(idx),
      });
    }
    return out;
  }

  get isWon() {
    if (this.values.some((v) => v === 0)) return false;
    return findConflictIndices(this.values).size === 0;
  }

  selectCell(index) {
    if (!Number.isInteger(index) || index < 0 || index > 80) return { type: 'ignored' };
    this.selectedIndex = index;
    return { type: 'cellSelected', index };
  }

  enterDigit(digit) {
    if (this.isWon) return { type: 'ignored' };
    const index = this.selectedIndex;
    if (index === null || index === undefined) return { type: 'ignored' };
    if (this.givenMask[index]) return { type: 'ignored' };
    if (!Number.isInteger(digit) || digit < 1 || digit > 9) return { type: 'ignored' };

    if (this.notesMode) {
      if (this.values[index] !== 0) return { type: 'ignored' };
      this.lastHint = null;
      const had = this.notes[index].has(digit);
      this.pushUndo(index);
      if (had) this.notes[index].delete(digit); else this.notes[index].add(digit);
      this.moves++;
      return { type: 'noteToggled', index, digit };
    }

    if (this.values[index] === digit) return { type: 'ignored' };
    this.lastHint = null;
    this.pushUndo(index, digit);
    this.values[index] = digit;
    this.notes[index].clear();
    this.moves++;
    if (digit !== this.solution[index]) this.wrongMoves++;
    if (this.isWon) this.pause();
    return this.isWon ? { type: 'won' } : { type: 'digitEntered', index, digit };
  }

  clearCell() {
    if (this.isWon) return { type: 'ignored' };
    const index = this.selectedIndex;
    if (index === null || index === undefined) return { type: 'ignored' };
    if (this.givenMask[index]) return { type: 'ignored' };
    if (this.values[index] === 0 && this.notes[index].size === 0) return { type: 'ignored' };
    this.lastHint = null;
    this.pushUndo(index);
    this.values[index] = 0;
    this.notes[index].clear();
    this.moves++;
    return { type: 'cellCleared', index };
  }

  undo() {
    if (this.isWon) return { type: 'ignored' };
    const entry = this.undoStack.pop();
    if (!entry) return { type: 'ignored' };
    this.lastHint = null;
    this.values[entry.index] = entry.prevValue ?? 0;
    this.notes[entry.index] = new Set(entry.prevNotes);
    this.selectedIndex = entry.index;
    entry.peerNotes.forEach(peer => { this.notes[peer.index] = new Set(peer.notes); });
    return { type: 'undone' };
  }

  toggleNotesMode() {
    this.notesMode = !this.notesMode;
  }

  /* Plans the next hint without changing the board: a wrong entry first (the selected cell,
     else any); otherwise the simplest deduction — a single, possibly exposed by a short chain
     of eliminations — reasoning only from correct digits; a blind reveal only when nothing
     applies. `highlight` lists the cells the explanation talks about. */
  planHint() {
    const editable = i => !this.givenMask[i] && this.values[i] !== this.solution[i];
    const board = this.values.map((v, i) => (v === this.solution[i] ? v : 0));
    const selected = this.selectedIndex;
    const wrongAt = i => ({ index: i, technique: 'wrong', unit: { type: 'row', index: Math.floor(i / 9) }, eliminations: [] });
    let plan = null;
    if (selected !== null && selected !== undefined && editable(selected)) {
      if (this.values[selected] !== 0) plan = wrongAt(selected);
      else {
        const deduction = planDeduction(board, selected);
        plan = deduction ? { ...deduction.single, eliminations: deduction.eliminations }
          : { index: selected, technique: 'reveal', unit: null, eliminations: [] };
      }
    } else {
      const wrong = [];
      for (let i = 0; i < 81; i++) if (editable(i) && this.values[i] !== 0) wrong.push(i);
      if (wrong.length) plan = wrongAt(wrong[Math.floor(Math.random() * wrong.length)]);
      else {
        const deduction = planDeduction(board);
        if (deduction) plan = { ...deduction.single, eliminations: deduction.eliminations };
        else {
          const candidates = [];
          for (let i = 0; i < 81; i++) if (editable(i)) candidates.push(i);
          if (!candidates.length) return null;
          const index = candidates[Math.floor(Math.random() * candidates.length)];
          plan = { index, technique: 'reveal', unit: null, eliminations: [] };
        }
      }
    }
    const highlight = new Set(plan.unit ? unitIndices(plan.unit.type, plan.unit.index) : []);
    if (plan.technique === 'naked') unitIndices('row', Math.floor(plan.index / 9)).forEach(i => highlight.add(i));
    plan.eliminations.forEach(e => e.cells.forEach(i => highlight.add(i)));
    return { ...plan, digit: this.solution[plan.index], highlight: [...highlight], revealed: false };
  }

  /* First half of a hint: explains where to look without filling anything. Free. */
  clue() {
    if (this.isWon) return { type: 'ignored' };
    const plan = this.planHint();
    if (!plan) return { type: 'hintExhausted' };
    this.lastHint = plan;
    return { type: 'hintClue' };
  }

  /* Fills the planned cell (the pending clue's, if one is showing) and costs a hint. */
  hint() {
    if (this.isWon) return { type: 'ignored' };
    if (this.hintsUsed >= this.maxHints) return { type: 'hintExhausted' };
    const plan = this.lastHint && !this.lastHint.revealed ? this.lastHint : this.planHint();
    if (!plan) return { type: 'hintExhausted' };

    const { index, digit } = plan;
    this.pushUndo(index, digit);
    this.values[index] = digit;
    this.notes[index].clear();
    this.hintsUsed++;
    this.moves++;
    this.selectedIndex = index;
    this.lastHint = { ...plan, revealed: true };
    if (this.isWon) this.pause();
    return this.isWon ? { type: 'won' } : { type: 'hintRevealed', index, digit };
  }

  pushUndo(index, digit = null) {
    const peerNotes = [];
    if (digit !== null) {
      for (let peer = 0; peer < 81; peer++) {
        if (!this.givenMask[peer] && SudokuGame.arePeers(index, peer) && this.notes[peer].has(digit)) {
          peerNotes.push({ index: peer, notes: new Set(this.notes[peer]) });
          this.notes[peer].delete(digit);
        }
      }
    }
    this.undoStack.push({
      index,
      prevValue: this.values[index] || null,
      prevNotes: new Set(this.notes[index]),
      peerNotes,
    });
    if (this.undoStack.length > 200) this.undoStack.shift();
  }

  toSnapshot() {
    return {
      difficulty: this.difficulty,
      given: this.givenMask.map((b) => (b ? 1 : 0)),
      solution: this.solution.slice(),
      values: this.values.slice(),
      notes: this.notes.map((s) => Array.from(s)),
      selectedIndex: this.selectedIndex,
      notesMode: this.notesMode,
      moves: this.moves,
      hintsUsed: this.hintsUsed,
      wrongMoves: this.wrongMoves,
      challengeLevel: this.challengeLevel,
      elapsedSeconds: this.elapsedSeconds,
      undoStack: this.undoStack.map(entry => ({ index: entry.index, prevValue: entry.prevValue,
        prevNotes: [...entry.prevNotes], peerNotes: entry.peerNotes.map(peer => ({ index: peer.index, notes: [...peer.notes] })) })),
    };
  }
}
