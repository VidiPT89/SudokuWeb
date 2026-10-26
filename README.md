# 🔢 SudokuWeb — Sudoku in the Browser

> A modern, animated Sudoku built with vanilla HTML, CSS and JavaScript — uniquely-solvable puzzles, pencil-mark notes, limited hints and a local leaderboard, bilingual PT/EN.

**🎮 [Live Demo](https://vidipt89.github.io/SudokuWeb/)**

"SudokuWeb" is a from-scratch browser implementation — no frameworks, no build step, no backend — built around a single guarantee: **every generated puzzle has exactly one solution**. There's no puzzle database — each game is freshly generated in the browser by filling a full grid and carving it back down while checking uniqueness at every step.

The interface opens with a short animated intro, and is fully bilingual, switching instantly between European Portuguese and English.

## 📦 What's Inside

- 🎚️ Three difficulty levels — **Easy** (target: 40 clues), **Medium** (target: 32) and **Hard** (target: 26)
- ✅ Uniquely-solvable puzzles — clues are removed one at a time, keeping each removal only if the puzzle still solves to exactly one grid
- ✏️ Pencil-mark notes mode — jot down candidate digits in a cell instead of committing a final value
- 🚫 Live conflict detection — placing a digit that already exists in the same row, column or 3x3 box highlights every conflicting cell
- 💡 Two-step teaching hints: the first tap gives a free **clue** — where to look, without filling anything; the second tap (**Reveal**, 3/4/5 per game by difficulty) fills the cell and explains the deduction. A wrong digit is fixed first; otherwise the hint uses the simplest technique that works — a single (only one cell for a digit in a box/row/column, or only one digit for a cell), exposed when needed by **pointing** or **claiming** candidates, a **naked pair** or, the hardest, an **X-Wing** — and shows only the elimination steps that single actually needs
- 🧠 Difficulty graded by human technique, never by guessing: Easy and Medium are solvable with singles alone; Hard always needs pointing/claiming candidates or naked pairs, and those are always enough; expert challenge levels are always solvable by logic up to X-Wing
- ↩️ Undo for the last 200 moves, including after resuming a saved game
- 🔊 Short synthesized sounds (Web Audio, no audio files) with an on/off toggle in the game header, remembered between visits
- 🎬 Smooth animations — pop-in on digit entry and hints, shake on conflicts, a confetti burst on winning
- ⌨️ Full keyboard support — digits 1-9 to fill, Backspace/Delete to erase, arrow keys to move the selection, N to toggle notes, Ctrl/⌘+Z to undo
- 💾 Autosaves mid-game to `localStorage`, with a "Continue Game" option from the main menu
- 🏆 A local best-time / fewest-hints leaderboard per difficulty, shown after a win
- 📖 An in-app "How to Play" guide covering the rule, given cells, conflicts, notes and the hint/undo tools
- 🇵🇹 🇬🇧 One-click language toggle between European Portuguese and English, remembered between visits
- 📱 Fully responsive — layout rescales from desktop down to mobile

## 🛠️ Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## 🏗️ Project Structure

```
SudokuWeb/
├── index.html         # Splash, menu, how-to-play, game screen, modals
├── css/
│   ├── style.css       # Theme tokens, base, splash, menu, how-to-play, game header
│   └── board.css       # Grid, controls, modals, challenges, responsive (loaded after style.css)
├── js/
│   ├── i18n.js         # PT/EN strings and language persistence
│   ├── solver.js       # Bitmask MRV solution counter and conflict scan
│   ├── techniques.js   # Human techniques: singles, pointing/claiming, naked pairs, X-Wing, grading
│   ├── challenge.js    # Endless challenge ladder, stars and level picker
│   ├── generator.js    # Randomized full-grid fill + hole digging with uniqueness checks
│   ├── engine.js       # Board state, dispatch results, undo stack, teaching hints, snapshots
│   ├── sound.js        # Web Audio UI sounds and the on/off preference
│   ├── storage.js      # Saved game, menu difficulty and leaderboard persistence
│   ├── overlays.js     # Splash, modals, toast, win screens and confetti
│   └── ui.js           # Rendering, screen navigation, keyboard input, wiring
├── tests/              # Node regression suites (node tests/game.test.js)
├── LICENSE
└── README.md
```

## ⚙️ Game Mechanics

### Generating a uniquely-solvable puzzle
```
1. Fill an empty 9x9 grid completely via randomized backtracking
   (shuffled digit order at each cell, row/col/box legality check)

2. Dig holes: shuffle cell order, then for each cell —
     - tentatively clear it
     - re-solve the puzzle with a capped counter (stop early at 2 solutions)
     - keep the removal only if the count is still exactly 1
     - otherwise put the digit back
   stop once the difficulty's target clue count is reached; a dig that
   gets stuck above the target is retried (up to 12 times) and the
   sparsest puzzle is kept. Removals must also keep the puzzle solvable by
   human techniques: singles only at 32+ clues (Easy, Medium), singles +
   pointing/claiming/naked pairs at 26-31 (Hard — which is retried until
   singles alone are not enough), and all of those plus X-Wing below 26
   (expert levels — retried for a puzzle that needs eliminations, and for
   one that needs X-Wing within a bounded budget, since those are rare)

3. The uniqueness check is a bitmask MRV (minimum-remaining-values)
   backtracker: row/column/box digits live in 9-bit masks and the search
   always branches on the emptiest cell first, so even expert grids are
   generated in a few milliseconds. Hints never re-solve — they read the
   cached solution grid
```

### Hints & conflicts
```
Hint: plans the selected cell (if empty or wrong), else any wrong
      entry, else the easiest single on the board (box, then row,
      column, then naked single), applying eliminations only when no
      single exists and pruning the chain to the steps it needs —
      reasoning only from correct digits. First tap: free clue. Second
      tap: reveal + explanation, capped per game (Easy 3 / Medium 4 /
      Hard 5).

Conflicts: recomputed from scratch after every move — for each row,
      column and 3x3 box, any digit appearing more than once flags
      every cell holding it. Win = grid full AND zero conflicts.
```

## 🚀 How to Run

```bash
# 1. Clone the repository
git clone https://github.com/VidiPT89/SudokuWeb.git
cd SudokuWeb

# 2. Open it in your browser — no build step, no dependencies
open index.html
```

The page is entirely static and can also be served with any static file server (e.g. `python3 -m http.server`).

## 📝 Notes

- Given (fixed) cells are set once at generation time and can never be edited or cleared, only the cells you fill in yourself
- Correcting a wrong entry counts as a valid hint target, not just filling in a blank cell
- Undo restores the previous value and all affected notes. Used hints are never refunded, and mistakes remain counted
- Language, in-progress games and the local leaderboard are all stored in `localStorage`, so they persist between visits
- All game logic (generation, solving, the game engine) is pure, DOM-free code kept separate from rendering in `ui.js`
- This is an independent JavaScript codebase, part of a pair of from-scratch Sudoku implementations for iOS/macOS and the web — no code is shared between the native and web apps

---

Developed by **David Arsénio Martins** — *"Vidi"*

## Verification and behaviour (2026-10-26)

- Challenge mode progressively reduces the target to 23 clues and awards 1–3 stars based on mistakes and hints. A generator may retain more clues to preserve a unique solution; clue count alone is not a human difficulty rating.
- The ↻ button starts a new puzzle at the same difficulty (or the same challenge level) after confirmation. Time pauses outside active play, during that confirmation and after victory.
- Invalid saved games are rejected safely; completed games are not offered as resumable games.
- Undo history is saved for up to 200 moves and restored with the game. Older saves without history remain compatible.
- The Android implementation was retired at the owner's request.

Run all regression checks: `node tests/challenge.test.js && node tests/game.test.js`. No dependencies or build step are needed.

### Gameplay review (2026-10-26, second pass)

Placing a digit automatically removes that candidate from peer notes. Undo restores all affected notes, including after a save/reload. Completed boards cannot be edited after a result is recorded.

Challenge mistakes are visible during play. Stars use mistakes plus hints: 0 = 3 stars, 1–3 = 2 stars, 4+ = 1 star. Undo does not erase mistakes or refund hints. The guide explains this in Portuguese and English.
