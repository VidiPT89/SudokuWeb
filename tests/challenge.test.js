/* Runnable check for the challenge ladder math. No framework: `node tests/challenge.test.js`. */

const assert = require('assert');

// Minimal in-memory localStorage so the persistence path runs under node.
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const {
  cluesForLevel, bandForLevel, maxHintsForLevel, starsFor,
  loadChallengeProgress, recordChallengeWin, totalStarsEarned,
  CHALLENGE_START_CLUES, CHALLENGE_MIN_CLUES,
} = require('../js/challenge.js');

// Ramp is bounded to [floor, start] at every level, including junk input.
for (const lvl of [1, 2, 5, 20, 50, 100, 500, 0, -3, 1.7]) {
  const c = cluesForLevel(lvl);
  assert.ok(c >= CHALLENGE_MIN_CLUES && c <= CHALLENGE_START_CLUES, `clues out of range at level ${lvl}: ${c}`);
}

// Ramp never gets easier as levels rise (monotonic non-increasing).
let prev = Infinity;
for (let lvl = 1; lvl <= 200; lvl++) {
  const c = cluesForLevel(lvl);
  assert.ok(c <= prev, `ramp went easier at level ${lvl}: ${c} > ${prev}`);
  prev = c;
}

// Level 1 opens easy; the ladder eventually reaches the expert floor and plateaus there.
assert.strictEqual(cluesForLevel(1), CHALLENGE_START_CLUES);
assert.strictEqual(cluesForLevel(100000), CHALLENGE_MIN_CLUES);
assert.strictEqual(bandForLevel(1), 'easy');
assert.strictEqual(bandForLevel(100000), 'expert');

// Hint budget grows with difficulty band.
assert.ok(maxHintsForLevel(1) <= maxHintsForLevel(100000));

// Stars: flawless is 3, a few slips is 2, a messy finish is 1.
assert.strictEqual(starsFor(0, 0), 3);
assert.strictEqual(starsFor(1, 0), 2);
assert.strictEqual(starsFor(0, 3), 2);
assert.strictEqual(starsFor(2, 2), 1);
assert.strictEqual(starsFor(10, 5), 1);

// Progression: a fresh player has only level 1 unlocked.
assert.strictEqual(loadChallengeProgress().highestUnlocked, 1);

// Finishing the current top level unlocks the next and banks stars + best time.
let out = recordChallengeWin(1, 120, 3);
assert.strictEqual(out.unlockedNext, true);
assert.strictEqual(loadChallengeProgress().highestUnlocked, 2);
assert.strictEqual(loadChallengeProgress().stars['1'], 3);

// Replaying an earlier level does NOT roll back the frontier or a better result...
out = recordChallengeWin(1, 90, 1);
assert.strictEqual(out.unlockedNext, false);
assert.strictEqual(loadChallengeProgress().highestUnlocked, 2, 'frontier must not regress');
assert.strictEqual(loadChallengeProgress().stars['1'], 3, 'stars must keep the best');
assert.strictEqual(loadChallengeProgress().bestTime['1'], 90, 'best time must improve');

// ...but a better star count on replay is kept.
recordChallengeWin(2, 200, 1);
recordChallengeWin(2, 200, 2);
assert.strictEqual(loadChallengeProgress().stars['2'], 2);

assert.strictEqual(totalStarsEarned(loadChallengeProgress()), 5); // 3 (lvl1) + 2 (lvl2)

console.log('challenge.test.js: all assertions passed');
