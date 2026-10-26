/* Rendering, screen navigation, input handling and wiring. Persistence lives in storage.js,
   splash/modals/win screens in overlays.js. */

let currentLang = getStoredLang();
let game = null;
let timerInterval = null;
let cellEls = [];

let selectedDifficulty = getStoredDifficulty();
let lastMovesShown = null;

function applyDifficultyUI() {
  document.querySelectorAll('.difficulty-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.difficulty === selectedDifficulty);
  });
}

const el = (id) => document.getElementById(id);

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ---------------------------------------------------------------------
   i18n
   --------------------------------------------------------------------- */

function applyLang() {
  const dict = I18N[currentLang];
  document.documentElement.lang = currentLang === 'pt' ? 'pt-PT' : 'en';
  document.title = dict.metaTitle;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (dict[key] !== undefined) node.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-label]').forEach((node) => {
    const key = node.getAttribute('data-i18n-label');
    if (dict[key] !== undefined) node.setAttribute('aria-label', dict[key]);
  });
  document.querySelectorAll('[data-tip-i18n]').forEach((node) => {
    const key = node.getAttribute('data-tip-i18n');
    if (dict[key] !== undefined) node.setAttribute('title', dict[key]);
  });

  const toggle = el('lang-toggle');
  toggle.setAttribute('data-lang', currentLang);
  toggle.querySelectorAll('.lang-opt').forEach((opt) => {
    opt.classList.toggle('active', opt.getAttribute('data-lang-opt') === currentLang);
  });

  if (game) { updateStats(); refreshBoard(); }
  if (!el('levels-screen').classList.contains('hidden')) renderLevels(startChallenge);
}

function setLang(lang) {
  currentLang = lang;
  setStoredLang(lang);
  applyLang();
}

/* ---------------------------------------------------------------------
   Screen navigation
   --------------------------------------------------------------------- */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  el(id).classList.remove('hidden');
  el(id).querySelector('button:not(.hidden)')?.focus();
}

function goToMenu() {
  stopTimer();
  showScreen('menu-screen');
  el('btn-continue').classList.toggle('hidden', !hasSavedGame());
}

function goToLevels() {
  stopTimer();
  resetLevelWindow(loadChallengeProgress());
  showScreen('levels-screen');
  renderLevels(startChallenge);
}

/* ---------------------------------------------------------------------
   Board rendering
   --------------------------------------------------------------------- */

function renderBoard() {
  const board = el('board');
  board.innerHTML = '';
  cellEls = [];
  for (let idx = 0; idx < 81; idx++) {
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'cell';
    if (col === 2 || col === 5) div.classList.add('thick-right');
    if (row === 2 || row === 5) div.classList.add('thick-bottom');
    div.addEventListener('click', () => handleResult(game.selectCell(idx)));
    board.appendChild(div);
    cellEls.push(div);
  }
}

function updateCellContent(div, cellData) {
  div.innerHTML = '';
  if (cellData.value) {
    const span = document.createElement('span');
    span.className = 'cell-value';
    span.textContent = String(cellData.value);
    div.appendChild(span);
  } else if (cellData.notes.size > 0) {
    const notesWrap = document.createElement('div');
    notesWrap.className = 'cell-notes';
    for (let d = 1; d <= 9; d++) {
      const s = document.createElement('span');
      s.textContent = cellData.notes.has(d) ? String(d) : '';
      notesWrap.appendChild(s);
    }
    div.appendChild(notesWrap);
  }
}

function refreshBoard() {
  if (!game) return;
  const cells = game.cells();
  const selectedIndex = game.selectedIndex;
  const selectedCell = (selectedIndex !== null && selectedIndex !== undefined) ? cells[selectedIndex] : null;
  const dict = I18N[currentLang];
  const hint = game.lastHint;
  const hintUnit = new Set(hint?.unit ? unitIndices(hint.unit.type, hint.unit.index) : []);

  cells.forEach((cellData, idx) => {
    const div = cellEls[idx];
    if (!div) return;
    updateCellContent(div, cellData);
    div.classList.toggle('given', cellData.isGiven);
    div.classList.toggle('conflict', cellData.isConflict);
    div.classList.toggle('selected', idx === selectedIndex);
    div.tabIndex = idx === (selectedIndex ?? 0) ? 0 : -1;
    div.setAttribute('aria-label', `${dict.row} ${cellData.row + 1}, ${dict.column} ${cellData.col + 1}, ${cellData.value ?? dict.emptyCell}${cellData.isGiven ? ', ' + dict.fixedCell : ''}${cellData.isConflict ? ', ' + dict.conflictCell : ''}${cellData.notes.size ? ', ' + dict.notes + ': ' + [...cellData.notes].sort().join(', ') : ''}`);
    div.setAttribute('aria-pressed', String(idx === selectedIndex));

    let isPeer = false;
    let isSameNumber = false;
    if (selectedCell && idx !== selectedIndex) {
      isPeer = cellData.row === selectedCell.row || cellData.col === selectedCell.col || cellData.boxIndex === selectedCell.boxIndex;
      isSameNumber = selectedCell.value !== null && cellData.value === selectedCell.value;
    }
    div.classList.toggle('peer', isPeer);
    div.classList.toggle('same-number', isSameNumber);
    div.classList.toggle('hint-unit', hintUnit.has(idx));
  });

  refreshNumberPad(cells);
  const explain = el('hint-explain');
  explain.textContent = hint ? hintText(hint, dict) : '';
  explain.classList.toggle('hidden', !hint);
}

function hintText(hint, dict) {
  const key = hint.technique === 'hidden'
    ? { box: 'hintHiddenBox', row: 'hintHiddenRow', col: 'hintHiddenCol' }[hint.unit.type]
    : { naked: 'hintNaked', wrong: 'hintWrong', reveal: 'hintReveal' }[hint.technique];
  const values = { r: Math.floor(hint.index / 9) + 1, c: (hint.index % 9) + 1, d: hint.digit };
  return dict[key].replace(/\{(\w)\}/g, (_, k) => values[k]);
}

function pulse(index, className) {
  const div = cellEls[index];
  if (!div) return;
  div.classList.remove(className);
  void div.offsetWidth;
  div.classList.add(className);
}

/* ---------------------------------------------------------------------
   Number pad
   --------------------------------------------------------------------- */

function renderNumberPad() {
  const pad = el('number-pad');
  pad.innerHTML = '';
  for (let d = 1; d <= 9; d++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.dataset.digit = String(d);
    btn.textContent = String(d);
    btn.addEventListener('click', () => handleDigitPad(d));
    pad.appendChild(btn);
  }
}

function refreshNumberPad(cells) {
  const counts = new Array(10).fill(0);
  cells.forEach((c) => { if (c.value) counts[c.value]++; });
  document.querySelectorAll('.num-btn').forEach((btn) => {
    const d = Number(btn.dataset.digit);
    btn.disabled = !game.notesMode && counts[d] >= 9;
  });
}

/* ---------------------------------------------------------------------
   Gameplay
   --------------------------------------------------------------------- */

function startNewGame(difficultyKey) {
  game = SudokuGame.newGame(difficultyKey);
  clearSavedGame();
  showScreen('game-screen');
  renderBoard();
  refreshBoard();
  updateStats();
  el('btn-notes').classList.remove('active');
  el('btn-notes').setAttribute('aria-pressed', 'false');
  el('number-pad').classList.remove('notes-mode');
  startTimer();
  saveGame();
}

function startChallenge(level) {
  game = SudokuGame.newChallenge(level);
  clearSavedGame();
  showScreen('game-screen');
  renderBoard();
  refreshBoard();
  updateStats();
  el('btn-notes').classList.remove('active');
  el('btn-notes').setAttribute('aria-pressed', 'false');
  el('number-pad').classList.remove('notes-mode');
  startTimer();
  saveGame();
}

function resumeGame() {
  const snap = loadGame();
  if (!snap) { startNewGame(selectedDifficulty); return; }
  game = SudokuGame.fromSnapshot(snap);
  showScreen('game-screen');
  renderBoard();
  refreshBoard();
  updateStats();
  el('btn-notes').classList.toggle('active', game.notesMode);
  el('btn-notes').setAttribute('aria-pressed', String(game.notesMode));
  el('number-pad').classList.toggle('notes-mode', game.notesMode);
  startTimer();
}

function handleResult(result) {
  if (!result || result.type === 'ignored') return;

  switch (result.type) {
    case 'cellSelected':
      refreshBoard();
      break;

    case 'digitEntered': {
      refreshBoard();
      pulse(result.index, 'pop-in');
      if (game.cells()[result.index].isConflict) { pulse(result.index, 'shake'); Sound.conflict(); } else Sound.digit();
      updateStats();
      saveGame();
      break;
    }

    case 'noteToggled':
      Sound.digit();
      refreshBoard();
      updateStats();
      saveGame();
      break;

    case 'cellCleared':
    case 'undone':
      refreshBoard();
      updateStats();
      saveGame();
      break;

    case 'hintRevealed':
      Sound.hint();
      refreshBoard();
      pulse(result.index, 'pop-in');
      updateStats();
      saveGame();
      break;

    case 'hintExhausted':
      showToast(I18N[currentLang].noHintsLeft);
      break;

    case 'won':
      Sound.win();
      refreshBoard();
      updateStats();
      onWin();
      break;
  }
}

function handleDigitPad(digit) {
  if (!game) return;
  handleResult(game.enterDigit(digit));
}

function handleErase() {
  if (!game) return;
  handleResult(game.clearCell());
}

function handleUndo() {
  if (!game) return;
  if (!game.canUndo) { showToast(I18N[currentLang].nothingToUndo); return; }
  handleResult(game.undo());
}

function handleHint() {
  if (!game) return;
  handleResult(game.hint());
}

function handleNotesToggle() {
  if (!game) return;
  game.toggleNotesMode();
  el('btn-notes').classList.toggle('active', game.notesMode);
  el('btn-notes').setAttribute('aria-pressed', String(game.notesMode));
  el('number-pad').classList.toggle('notes-mode', game.notesMode);
  refreshBoard();
  saveGame();
}

function applySoundUI() {
  const on = isSoundOn();
  el('btn-sound').setAttribute('aria-pressed', String(on));
  el('btn-sound').classList.toggle('muted', !on);
}

function handleKeydown(e) {
  if (!game || el('game-screen').classList.contains('hidden')) return;
  if (!el('modal-overlay').classList.contains('hidden')) return;
  if (e.target?.matches('input, textarea, select, [contenteditable]')) return;
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    handleUndo();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    handleDigitPad(Number(e.key));
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    e.preventDefault();
    handleErase();
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    moveSelection(e.key);
  } else if (e.key.toLowerCase() === 'n') {
    handleNotesToggle();
  }
}

function moveSelection(key) {
  const idx = game.selectedIndex ?? 0;
  let row = Math.floor(idx / 9);
  let col = idx % 9;
  if (key === 'ArrowUp') row = Math.max(0, row - 1);
  if (key === 'ArrowDown') row = Math.min(8, row + 1);
  if (key === 'ArrowLeft') col = Math.max(0, col - 1);
  if (key === 'ArrowRight') col = Math.min(8, col + 1);
  handleResult(game.selectCell(row * 9 + col));
  cellEls[row * 9 + col]?.focus({ preventScroll: true });
}

function requestRestart() {
  openModal('modal-confirm');
}

function startTimer() {
  stopTimer();
  if (document.hidden) return;
  game?.resume();
  timerInterval = setInterval(() => {
    el('stat-time').textContent = formatTime(game.elapsedSeconds);
  }, 500);
}
function stopTimer() { game?.pause(); if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

function updateStats() {
  const dict = I18N[currentLang];
  el('stat-mode-label').textContent = game.isChallenge ? dict.level : dict.difficultyLabel;
  el('stat-mode').textContent = game.isChallenge ? game.challengeLevel : dict[game.difficulty];
  el('stat-mistakes-wrap').classList.toggle('hidden', !game.isChallenge);
  el('stat-mistakes').textContent = game.wrongMoves;
  el('stat-time').textContent = formatTime(game.elapsedSeconds);
  const moves = game.moves;
  if (moves !== lastMovesShown) {
    const node = el('stat-moves');
    node.classList.remove('pop');
    void node.offsetWidth;
    node.classList.add('pop');
    node.addEventListener('animationend', () => node.classList.remove('pop'), { once: true });
    lastMovesShown = moves;
  }
  el('stat-moves').textContent = moves;
  el('stat-hints').textContent = game.hintsRemaining;
  refreshHintBadge();
}

function refreshHintBadge() {
  if (!game) return;
  el('hint-count').textContent = game.hintsRemaining;
  el('btn-hint').disabled = game.hintsRemaining <= 0;
  el('btn-undo').disabled = !game.canUndo;
}

/* ---------------------------------------------------------------------
   Wiring
   --------------------------------------------------------------------- */

function init() {
  applyLang();
  applyDifficultyUI();
  initSplash();
  renderNumberPad();
  applySoundUI();

  el('lang-toggle').addEventListener('click', () => setLang(currentLang === 'pt' ? 'en' : 'pt'));

  document.querySelectorAll('.difficulty-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDifficulty = btn.dataset.difficulty;
      setStoredDifficulty(selectedDifficulty);
      applyDifficultyUI();
    });
  });

  el('btn-play').addEventListener('click', () => startNewGame(selectedDifficulty));
  el('btn-continue').addEventListener('click', resumeGame);
  el('btn-challenges').addEventListener('click', goToLevels);
  el('btn-levels-back').addEventListener('click', goToMenu);
  el('btn-levels-earlier').addEventListener('click', () => showEarlierLevels(startChallenge));
  el('btn-how-to-play').addEventListener('click', () => showScreen('htp-screen'));
  el('btn-htp-back').addEventListener('click', goToMenu);
  el('btn-htp-close').addEventListener('click', goToMenu);

  el('btn-back-menu').addEventListener('click', () => { saveGame(); goToMenu(); });
  el('btn-notes').addEventListener('click', handleNotesToggle);
  el('btn-undo').addEventListener('click', handleUndo);
  el('btn-hint').addEventListener('click', handleHint);
  el('btn-erase').addEventListener('click', handleErase);
  el('btn-restart').addEventListener('click', requestRestart);
  el('btn-sound').addEventListener('click', () => { setSoundOn(!isSoundOn()); applySoundUI(); });

  el('btn-confirm-yes').addEventListener('click', () => {
    const level = game.challengeLevel;
    const d = game.difficulty;
    closeAllModals();
    if (level !== null) startChallenge(level); else startNewGame(d);
  });
  el('btn-confirm-no').addEventListener('click', closeAllModals);

  el('btn-win-again').addEventListener('click', () => { const d = game.difficulty; closeAllModals(); startNewGame(d); });
  el('btn-win-menu').addEventListener('click', () => { closeAllModals(); goToMenu(); });
  el('btn-win-next').addEventListener('click', () => { closeAllModals(); startChallenge((lastChallengeLevel ?? 0) + 1); });
  el('btn-win-levels').addEventListener('click', () => { closeAllModals(); goToLevels(); });

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', e => {
    if (el('modal-overlay').classList.contains('hidden')) return;
    if (e.key === 'Escape' && !el('modal-confirm').classList.contains('hidden')) closeAllModals();
    if (e.key !== 'Tab') return;
    const buttons = [...el('modal-overlay').querySelectorAll('.modal:not(.hidden) button:not(.hidden):not(:disabled)')];
    const index = buttons.indexOf(document.activeElement);
    e.preventDefault();
    buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopTimer(); saveGame(); }
    else if (game && !game.isWon && !el('game-screen').classList.contains('hidden') && el('modal-overlay').classList.contains('hidden')) startTimer();
  });
  window.addEventListener('pagehide', () => { stopTimer(); saveGame(); });
}

document.addEventListener('DOMContentLoaded', init);
