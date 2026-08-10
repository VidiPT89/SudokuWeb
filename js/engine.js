/* Owns the full mutable game state for one puzzle: cells, selection, notes-mode, move/hint
   counters and elapsed time. Every public mutator returns a result object describing what
   happened so the UI layer can react (sound, toast, save, modal) without re-deriving state. */

class SudokuGame {
  constructor(opts) {
    this.difficulty = opts.difficulty; // 'easy' | 'medium' | 'hard'
    this.givenMask = opts.givenMask; // Array(81) boolean
    this.solution = opts.solution; // Array(81) 1-9
    this.values = opts.values.slice(); // Array(81) 0-9
    this.notes = opts.notes.map((s) => new Set(s)); // Array(81) Set<number>
    this.selectedIndex = opts.selectedIndex ?? null;
    this.notesMode = opts.notesMode ?? false;
    this.moves = opts.moves ?? 0;
    this.hintsUsed = opts.hintsUsed ?? 0;
    this.startedAt = Date.now() - (opts.elapsedSeconds ?? 0) * 1000;
    this.undoStack = [];
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

  static fromSnapshot(snap) {
    const givenMask = snap.given.map((v) => v !== 0);
    const game = new SudokuGame({
      difficulty: snap.difficulty,
      givenMask,
      solution: snap.solution,
      values: snap.values,
      notes: snap.notes,
      selectedIndex: snap.selectedIndex,
      notesMode: snap.notesMode,
      moves: snap.moves,
      hintsUsed: snap.hintsUsed,
      elapsedSeconds: snap.elapsedSeconds,
    });
    return game;
  }

  get maxHints() { return DIFFICULTIES[this.difficulty].maxHints; }
  get hintsRemaining() { return this.maxHints - this.hintsUsed; }
  get canUndo() { return this.undoStack.length > 0; }
  get elapsedSeconds() { return Math.floor((Date.now() - this.startedAt) / 1000); }

  cells() {
    const conflicts = findConflictIndices(this.values);
    const out = [];
    for (let idx = 0; idx < 81; idx++) {
      out.push({
        index: idx,
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
    if (index < 0 || index > 80) return { type: 'ignored' };
    this.selectedIndex = index;
    return { type: 'cellSelected', index };
  }

  enterDigit(digit) {
    const index = this.selectedIndex;
    if (index === null || index === undefined) return { type: 'ignored' };
    if (this.givenMask[index]) return { type: 'ignored' };
    if (digit < 1 || digit > 9) return { type: 'ignored' };

    if (this.notesMode) {
      const had = this.notes[index].has(digit);
      this.pushUndo(index);
      if (had) this.notes[index].delete(digit); else this.notes[index].add(digit);
      this.moves++;
      return { type: 'noteToggled', index, digit };
    }

    if (this.values[index] === digit) return { type: 'ignored' };
    this.pushUndo(index);
    this.values[index] = digit;
    this.notes[index].clear();
    this.moves++;
    return this.isWon ? { type: 'won' } : { type: 'digitEntered', index, digit };
  }

  clearCell() {
    const index = this.selectedIndex;
    if (index === null || index === undefined) return { type: 'ignored' };
    if (this.givenMask[index]) return { type: 'ignored' };
    if (this.values[index] === 0 && this.notes[index].size === 0) return { type: 'ignored' };
    this.pushUndo(index);
    this.values[index] = 0;
    this.notes[index].clear();
    this.moves++;
    return { type: 'cellCleared', index };
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return { type: 'ignored' };
    this.values[entry.index] = entry.prevValue ?? 0;
    this.notes[entry.index] = new Set(entry.prevNotes);
    this.selectedIndex = entry.index;
    if (entry.wasHint && this.hintsUsed > 0) this.hintsUsed--;
    return { type: 'undone' };
  }

  toggleNotesMode() {
    this.notesMode = !this.notesMode;
  }

  hint() {
    if (this.hintsUsed >= this.maxHints) return { type: 'hintExhausted' };

    const selected = this.selectedIndex;
    let target;
    if (selected !== null && selected !== undefined && !this.givenMask[selected] && this.values[selected] !== this.solution[selected]) {
      target = selected;
    } else {
      const candidates = [];
      for (let i = 0; i < 81; i++) {
        if (!this.givenMask[i] && this.values[i] !== this.solution[i]) candidates.push(i);
      }
      if (candidates.length === 0) return { type: 'hintExhausted' };
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }

    this.pushUndo(target, true);
    this.values[target] = this.solution[target];
    this.notes[target].clear();
    this.hintsUsed++;
    this.moves++;
    this.selectedIndex = target;
    return this.isWon ? { type: 'won' } : { type: 'hintRevealed', index: target, digit: this.solution[target] };
  }

  pushUndo(index, wasHint = false) {
    this.undoStack.push({
      index,
      prevValue: this.values[index] || null,
      prevNotes: new Set(this.notes[index]),
      wasHint,
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
      elapsedSeconds: this.elapsedSeconds,
    };
  }
}
