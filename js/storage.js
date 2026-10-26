/* localStorage persistence: in-progress game, menu difficulty and the classic leaderboard.
   Every read is validated and every access survives storage being unavailable. */

const SAVE_KEY = 'sudokuweb-save';
const DIFFICULTY_KEY = 'sudokuweb-difficulty';
const LEADERBOARD_KEY = 'sudokuweb-leaderboard';

function getStoredDifficulty() {
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(DIFFICULTIES, stored)) return stored;
  } catch (e) { /* localStorage unavailable */ }
  return 'easy';
}
function setStoredDifficulty(difficulty) {
  try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (e) { /* ignore */ }
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const valid = {};
    for (const key of Object.keys(DIFFICULTIES)) {
      const entry = data[key];
      if (!entry || typeof entry !== 'object') continue;
      valid[key] = {
        bestTime: Number.isFinite(entry.bestTime) && entry.bestTime >= 0 ? entry.bestTime : null,
        bestHints: Number.isInteger(entry.bestHints) && entry.bestHints >= 0 ? entry.bestHints : null,
      };
    }
    return valid;
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

function saveGame() {
  if (!game || game.isWon) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.toSnapshot())); } catch (e) { /* storage unavailable — skip autosave */ }
}
function hasSavedGame() {
  return loadGame() !== null;
}
function clearSavedGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const snap = raw ? JSON.parse(raw) : null;
    if (SudokuGame.isValidSnapshot(snap) && snap.values.some((v, i) => v !== snap.solution[i])) return snap;
    clearSavedGame();
    return null;
  } catch (e) {
    clearSavedGame();
    return null;
  }
}
