/* Overlays: splash sequence, modal focus handling, toast and the win modal (classic
   leaderboard or challenge stars, plus the confetti burst). */

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
   Modals
   --------------------------------------------------------------------- */

let modalPreviousFocus = null;
function openModal(id) {
  stopTimer();
  modalPreviousFocus = document.activeElement;
  document.querySelectorAll('.screen').forEach(s => { s.inert = true; });
  el('modal-overlay').classList.remove('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  el(id).classList.remove('hidden');
  el(id).querySelector('button:not(.hidden)')?.focus();
}
function closeAllModals() {
  document.querySelectorAll('.screen').forEach(s => { s.inert = false; });
  modalPreviousFocus?.focus();
  if (game && !game.isWon && !el('game-screen').classList.contains('hidden')) startTimer();
  el('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
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

let lastChallengeLevel = null;

function animateWinStars(count) {
  const wrap = el('win-stars');
  wrap.classList.remove('hidden');
  wrap.querySelectorAll('.win-star').forEach((star, i) => {
    const earned = i < count;
    star.classList.remove('earned', 'pop');
    star.classList.toggle('earned', earned);
    if (earned) {
      setTimeout(() => star.classList.add('pop'), 220 + i * 260);
    }
  });
}

function onWinChallenge() {
  const level = game.challengeLevel;
  lastChallengeLevel = level;
  const elapsedSeconds = game.elapsedSeconds;
  const stars = starsFor(game.wrongMoves, game.hintsUsed);
  const outcome = recordChallengeWin(level, elapsedSeconds, stars);
  const dict = I18N[currentLang];

  el('win-title').textContent = `${dict.level} ${level} ${dict.levelCompleteSuffix}`;
  el('win-subtitle').textContent = dict.winSubtitle;
  el('win-time').textContent = formatTime(elapsedSeconds);
  el('win-hints').textContent = game.hintsUsed;

  el('win-leaderboard').classList.add('hidden');
  el('win-record-time').classList.toggle('hidden', !outcome.isNewBestTime);
  el('win-record-hints').classList.add('hidden');
  el('win-unlocked').classList.toggle('hidden', !outcome.unlockedNext);
  el('win-records').classList.toggle('hidden', !outcome.isNewBestTime && !outcome.unlockedNext);

  el('btn-win-next').classList.remove('hidden');
  el('btn-win-levels').classList.remove('hidden');
  el('btn-win-again').classList.add('hidden');
  el('btn-win-menu').classList.add('hidden');

  openModal('modal-win');
  animateWinStars(stars);
  launchConfetti();
}

function onWinClassic() {
  const elapsedSeconds = game.elapsedSeconds;
  const hintsUsed = game.hintsUsed;
  const outcome = recordCompletion(game.difficulty, elapsedSeconds, hintsUsed);
  const lb = getLeaderboardEntry(game.difficulty);

  el('win-title').textContent = I18N[currentLang].winTitle;
  el('win-subtitle').textContent = I18N[currentLang].winSubtitle;
  el('win-stars').classList.add('hidden');
  el('win-time').textContent = formatTime(elapsedSeconds);
  el('win-hints').textContent = hintsUsed;
  el('win-leaderboard').classList.remove('hidden');
  el('lb-best-time').textContent = lb.bestTime !== null ? formatTime(lb.bestTime) : '–';
  el('lb-best-hints').textContent = lb.bestHints !== null ? lb.bestHints : '–';
  el('win-record-time').classList.toggle('hidden', !outcome.isNewBestTime);
  el('win-record-hints').classList.toggle('hidden', !outcome.isNewBestHints);
  el('win-unlocked').classList.add('hidden');
  el('win-records').classList.toggle('hidden', !outcome.isNewBestTime && !outcome.isNewBestHints);

  el('btn-win-next').classList.add('hidden');
  el('btn-win-levels').classList.add('hidden');
  el('btn-win-again').classList.remove('hidden');
  el('btn-win-menu').classList.remove('hidden');

  openModal('modal-win');
  launchConfetti();
}

function onWin() {
  stopTimer();
  clearSavedGame();
  if (game.isChallenge) onWinChallenge(); else onWinClassic();
}

/* ---------------------------------------------------------------------
   Confetti (win modal)
   --------------------------------------------------------------------- */

function launchConfetti() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
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
