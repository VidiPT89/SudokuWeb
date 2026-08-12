/* Rendering, screen navigation, animation and persistence glue. */

const SAVE_KEY = 'sudokuweb-save';
const DIFFICULTY_KEY = 'sudokuweb-difficulty';
const LEADERBOARD_KEY = 'sudokuweb-leaderboard';

let currentLang = getStoredLang();
let game = null;
let timerInterval = null;
let cellEls = [];

function getStoredDifficulty() {
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored && DIFFICULTIES[stored]) return stored;
  } catch (e) { /* localStorage unavailable */ }
  return 'easy';
}
function setStoredDifficulty(difficulty) {
  try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (e) { /* ignore */ }
}
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

  if (game) refreshHintBadge();
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
}

function goToMenu() {
  stopTimer();
  showScreen('menu-screen');
  el('btn-continue').classList.toggle('hidden', !hasSavedGame());
}

/* ---------------------------------------------------------------------
   Splash sequence
   --------------------------------------------------------------------- */

function initSplash() {
  let left = false;
  const leave = () => {
    if (left) return;
    left = true;
    el('splash-screen').classList.add('leaving');
    setTimeout(() => { goToMenu(); }, 550);
  };
  el('splash-skip').addEventListener('click', leave);
  el('splash-screen').addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    leave();
  });
  setTimeout(leave, 2600);
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
    const div = document.createElement('div');
    div.className = 'cell';
    div.style.setProperty('--i', String(row + col));
    div.classList.add('enter');
    div.addEventListener('animationend', () => div.classList.remove('enter'), { once: true });
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

  cells.forEach((cellData, idx) => {
    const div = cellEls[idx];
    if (!div) return;
    updateCellContent(div, cellData);
    div.classList.toggle('given', cellData.isGiven);
    div.classList.toggle('conflict', cellData.isConflict);
    div.classList.toggle('selected', idx === selectedIndex);

    let isPeer = false;
    let isSameNumber = false;
    if (selectedCell && idx !== selectedIndex) {
      isPeer = cellData.row === selectedCell.row || cellData.col === selectedCell.col || cellData.boxIndex === selectedCell.boxIndex;
      isSameNumber = selectedCell.value !== null && cellData.value === selectedCell.value;
    }
    div.classList.toggle('peer', isPeer);
    div.classList.toggle('same-number', isSameNumber);
  });

  refreshNumberPad(cells);
}

function pulse(index, className) {
  const div = cellEls[index];
  if (!div) return;
  div.classList.remove(className);
  void div.offsetWidth;
  div.classList.add(className);
  div.addEventListener('animationend', () => div.classList.remove(className), { once: true });
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
    btn.disabled = counts[d] >= 9;
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
  refreshHintBadge();
  el('btn-notes').classList.remove('active');
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
  refreshHintBadge();
  el('btn-notes').classList.toggle('active', game.notesMode);
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
      if (game.cells()[result.index].isConflict) pulse(result.index, 'shake');
      updateStats();
      saveGame();
      break;
    }

    case 'noteToggled':
    case 'cellCleared':
    case 'undone':
      refreshBoard();
      updateStats();
      refreshHintBadge();
      saveGame();
      break;

    case 'hintRevealed':
      refreshBoard();
      pulse(result.index, 'pop-in');
      updateStats();
      refreshHintBadge();
      saveGame();
      break;

    case 'hintExhausted':
      showToast(I18N[currentLang].noHintsLeft);
      break;

    case 'won':
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
  saveGame();
}

function handleKeydown(e) {
  if (!game || el('game-screen').classList.contains('hidden')) return;
  if (!el('modal-overlay').classList.contains('hidden')) return;

  if (e.key >= '1' && e.key <= '9') {
    handleDigitPad(Number(e.key));
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
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
}

function requestRestart() {
  openModal('modal-confirm');
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    el('stat-time').textContent = formatTime(game.elapsedSeconds);
  }, 500);
}
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

function updateStats() {
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
}

function refreshHintBadge() {
  if (!game) return;
  el('hint-count').textContent = game.hintsRemaining;
  el('btn-hint').disabled = game.hintsRemaining <= 0;
  el('btn-undo').disabled = !game.canUndo;
}

/* ---------------------------------------------------------------------
   Win / leaderboard
   --------------------------------------------------------------------- */

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function saveLeaderboard(data) {
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}
function getLeaderboardEntry(difficulty) {
  const entry = loadLeaderboard()[difficulty] || {};
  return { bestTime: entry.bestTime ?? null, bestHints: entry.bestHints ?? null };
}
function recordCompletion(difficulty, elapsedSeconds, hintsUsed) {
  const data = loadLeaderboard();
  const entry = data[difficulty] || { bestTime: null, bestHints: null };
  let isNewBestTime = false;
  let isNewBestHints = false;
  if (entry.bestTime === null || elapsedSeconds < entry.bestTime) { entry.bestTime = elapsedSeconds; isNewBestTime = true; }
  if (entry.bestHints === null || hintsUsed < entry.bestHints) { entry.bestHints = hintsUsed; isNewBestHints = true; }
  data[difficulty] = entry;
  saveLeaderboard(data);
  return { isNewBestTime, isNewBestHints };
}

function onWin() {
  stopTimer();
  clearSavedGame();

  const elapsedSeconds = game.elapsedSeconds;
  const hintsUsed = game.hintsUsed;
  const outcome = recordCompletion(game.difficulty, elapsedSeconds, hintsUsed);
  const lb = getLeaderboardEntry(game.difficulty);

  el('win-time').textContent = formatTime(elapsedSeconds);
  el('win-hints').textContent = hintsUsed;
  el('lb-best-time').textContent = lb.bestTime !== null ? formatTime(lb.bestTime) : '–';
  el('lb-best-hints').textContent = lb.bestHints !== null ? lb.bestHints : '–';
  el('win-record-time').classList.toggle('hidden', !outcome.isNewBestTime);
  el('win-record-hints').classList.toggle('hidden', !outcome.isNewBestHints);
  el('win-records').classList.toggle('hidden', !outcome.isNewBestTime && !outcome.isNewBestHints);

  openModal('modal-win');
  launchConfetti();
}

/* ---------------------------------------------------------------------
   Modals
   --------------------------------------------------------------------- */

function openModal(id) {
  el('modal-overlay').classList.remove('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  el(id).classList.remove('hidden');
}
function closeAllModals() {
  el('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
}

/* ---------------------------------------------------------------------
   Confetti (win modal)
   --------------------------------------------------------------------- */

function launchConfetti() {
  const canvas = el('confetti-canvas');
  const modal = canvas.closest('.modal');
  canvas.width = modal.clientWidth;
  canvas.height = modal.clientHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#f99c00', '#fcbb00', '#ffd236', '#dd7400', '#e2e8f0'];
  const particles = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    r: 3 + Math.random() * 4,
    c: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
  }));
  let frames = 0;
  function tick() {
    frames++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      ctx.restore();
    });
    if (frames < 220) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  tick();
}

/* ---------------------------------------------------------------------
   Toast
   --------------------------------------------------------------------- */

let toastTimeout = null;
function showToast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.add('hidden'), 2200);
}

/* ---------------------------------------------------------------------
   Persistence
   --------------------------------------------------------------------- */

function saveGame() {
  if (!game) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.toSnapshot())); } catch (e) { /* storage unavailable — skip autosave */ }
}
function hasSavedGame() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSavedGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ---------------------------------------------------------------------
   Wiring
   --------------------------------------------------------------------- */

function init() {
  applyLang();
  applyDifficultyUI();
  initSplash();
  renderNumberPad();

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
  el('btn-how-to-play').addEventListener('click', () => showScreen('htp-screen'));
  el('btn-htp-back').addEventListener('click', goToMenu);
  el('btn-htp-close').addEventListener('click', goToMenu);

  el('btn-back-menu').addEventListener('click', () => { saveGame(); goToMenu(); });
  el('btn-notes').addEventListener('click', handleNotesToggle);
  el('btn-undo').addEventListener('click', handleUndo);
  el('btn-hint').addEventListener('click', handleHint);
  el('btn-erase').addEventListener('click', handleErase);
  el('btn-restart').addEventListener('click', requestRestart);

  el('btn-confirm-yes').addEventListener('click', () => { const d = game.difficulty; closeAllModals(); startNewGame(d); });
  el('btn-confirm-no').addEventListener('click', closeAllModals);

  el('btn-win-again').addEventListener('click', () => { closeAllModals(); startNewGame(selectedDifficulty); });
  el('btn-win-menu').addEventListener('click', () => { closeAllModals(); goToMenu(); });

  document.addEventListener('keydown', handleKeydown);
}

document.addEventListener('DOMContentLoaded', init);
