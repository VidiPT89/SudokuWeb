/* Challenge mode: an endless ladder of generated levels.

   Level 1 opens a shade easier than the classic "easy" preset and every level shaves a
   fraction of a clue off the grid, bottoming out at an expert floor that sits below the
   classic "hard" preset. Because the ramp is a pure function of the level number there is
   no level content to author or ship — the ladder simply never ends.

   Stars rate a finished level on mistakes and hints only, never on time: a player who
   thinks slowly is not a worse player.

   The pure helpers at the top stay free of DOM and storage so they can be unit-tested
   under node (see tests/challenge.test.js). */

const CHALLENGE_KEY = 'sudokuweb-challenges';

/* Ramp knobs — tune these, not the formula. Level 1 is welcoming; the floor is a genuine
   expert grid (classic "hard" bottoms out at 26 clues). */
const CHALLENGE_START_CLUES = 42;
const CHALLENGE_MIN_CLUES = 23;
const CHALLENGE_CLUES_PER_LEVEL = 0.55;

/* How much of the ladder the level picker keeps in the DOM at once. */
const LEVELS_BEHIND = 30;
const LEVELS_AHEAD = 5;

/* Target clue count for a level, clamped to [floor, start] so the ladder plateaus at expert. */
function cluesForLevel(level) {
  const n = Math.max(1, Math.floor(level) || 1);
  const target = Math.round(CHALLENGE_START_CLUES - (n - 1) * CHALLENGE_CLUES_PER_LEVEL);
  return Math.min(CHALLENGE_START_CLUES, Math.max(CHALLENGE_MIN_CLUES, target));
}

/* Maps a level onto the classic difficulty vocabulary, for labels and hint budgets. */
function bandForLevel(level) {
  const clues = cluesForLevel(level);
  if (clues >= 38) return 'easy';
  if (clues >= 32) return 'medium';
  if (clues >= 26) return 'hard';
  return 'expert';
}

function maxHintsForLevel(level) {
  switch (bandForLevel(level)) {
    case 'easy': return 3;
    case 'medium': return 4;
    default: return 5;
  }
}

/* 3 = flawless, 2 = a few slips, 1 = finished. A mistake and a hint cost the same. */
function starsFor(wrongMoves, hintsUsed) {
  const penalty = Math.max(0, wrongMoves || 0) + Math.max(0, hintsUsed || 0);
  if (penalty === 0) return 3;
  if (penalty <= 3) return 2;
  return 1;
}

/* ---------------------------------------------------------------------
   Progress persistence
   --------------------------------------------------------------------- */

function emptyProgress() {
  return { highestUnlocked: 1, stars: {}, bestTime: {} };
}

function loadChallengeProgress() {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object') return emptyProgress();
    return {
      highestUnlocked: Math.max(1, Math.floor(Number(data.highestUnlocked)) || 1),
      stars: (data.stars && typeof data.stars === 'object') ? data.stars : {},
      bestTime: (data.bestTime && typeof data.bestTime === 'object') ? data.bestTime : {},
    };
  } catch (e) {
    return emptyProgress();
  }
}

function saveChallengeProgress(progress) {
  try { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(progress)); } catch (e) { /* storage unavailable */ }
}

function totalStarsEarned(progress) {
  return Object.values(progress.stars).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

/* Records a finished level, keeping the player's best result. Returns what improved so the
   win modal can celebrate the right thing. */
function recordChallengeWin(level, elapsedSeconds, stars) {
  const progress = loadChallengeProgress();
  const key = String(level);
  const prevStars = Number(progress.stars[key]) || 0;
  const prevBest = progress.bestTime[key] !== undefined ? Number(progress.bestTime[key]) : null;

  const improvedStars = stars > prevStars;
  const isNewBestTime = prevBest === null || elapsedSeconds < prevBest;
  const unlockedNext = level >= progress.highestUnlocked;

  if (improvedStars) progress.stars[key] = stars;
  if (isNewBestTime) progress.bestTime[key] = elapsedSeconds;
  if (unlockedNext) progress.highestUnlocked = level + 1;

  saveChallengeProgress(progress);

  return {
    improvedStars,
    isNewBestTime,
    unlockedNext,
    bestStars: Math.max(stars, prevStars),
    bestTime: progress.bestTime[key],
  };
}

/* ---------------------------------------------------------------------
   Level picker screen
   --------------------------------------------------------------------- */

/* Oldest level currently kept in the DOM. Null until the picker is first opened, then only
   ever walked backwards by the "show earlier" button. */
let levelWindowStart = null;

function resetLevelWindow(progress) {
  levelWindowStart = Math.max(1, progress.highestUnlocked - LEVELS_BEHIND + 1);
}

function starsMarkup(count) {
  const wrap = document.createElement('span');
  wrap.className = 'tile-stars';
  for (let i = 1; i <= 3; i++) {
    const star = document.createElement('span');
    star.className = i <= count ? 'tile-star earned' : 'tile-star';
    star.textContent = '★';
    wrap.appendChild(star);
  }
  return wrap;
}

function buildLevelTile(level, progress, dict) {
  const unlocked = level <= progress.highestUnlocked;
  const stars = Number(progress.stars[String(level)]) || 0;
  const isCurrent = level === progress.highestUnlocked;

  const tile = document.createElement('button');
  tile.className = 'level-tile';
  tile.classList.toggle('locked', !unlocked);
  tile.classList.toggle('current', isCurrent);
  tile.classList.toggle('done', stars > 0);
  tile.dataset.level = String(level);
  tile.dataset.band = bandForLevel(level);
  tile.disabled = !unlocked;
  tile.setAttribute('aria-label', `${dict.level} ${level}${unlocked ? '' : ` — ${dict.locked}`}`);

  const num = document.createElement('span');
  num.className = 'tile-number';
  num.textContent = unlocked ? String(level) : '🔒';
  tile.appendChild(num);

  if (unlocked) tile.appendChild(starsMarkup(stars));

  return tile;
}

/* Renders the window of levels around the player's position. Called on every open so it
   always reflects freshly-earned stars. */
function renderLevels(onPick) {
  const progress = loadChallengeProgress();
  const dict = I18N[currentLang];
  if (levelWindowStart === null) resetLevelWindow(progress);

  const start = Math.max(1, levelWindowStart);
  const end = progress.highestUnlocked + LEVELS_AHEAD;

  document.getElementById('levels-reached').textContent = String(progress.highestUnlocked);
  document.getElementById('levels-stars').textContent = String(totalStarsEarned(progress));

  const earlierBtn = document.getElementById('btn-levels-earlier');
  earlierBtn.classList.toggle('hidden', start <= 1);

  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '';
  let currentTile = null;
  for (let level = start; level <= end; level++) {
    const tile = buildLevelTile(level, progress, dict);
    tile.style.setProperty('--i', String(Math.min(level - start, 40)));
    if (!tile.disabled) tile.addEventListener('click', () => onPick(level));
    if (level === progress.highestUnlocked) currentTile = tile;
    grid.appendChild(tile);
  }

  if (currentTile) {
    requestAnimationFrame(() => currentTile.scrollIntoView({ block: 'center' }));
  }
}

function showEarlierLevels(onPick) {
  levelWindowStart = Math.max(1, (levelWindowStart ?? 1) - LEVELS_BEHIND);
  renderLevels(onPick);
}

/* Node-only export so the pure helpers above can be unit-tested; harmless in the browser. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cluesForLevel,
    bandForLevel,
    maxHintsForLevel,
    starsFor,
    loadChallengeProgress,
    saveChallengeProgress,
    recordChallengeWin,
    totalStarsEarned,
    CHALLENGE_START_CLUES,
    CHALLENGE_MIN_CLUES,
  };
}
