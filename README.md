# 🔢 SudokuWeb — Sudoku in the Browser

> A modern, animated Sudoku built with vanilla HTML, CSS and JavaScript — uniquely-solvable puzzles, pencil-mark notes, limited hints and a local leaderboard, bilingual PT/EN.

**🎮 [Live Demo](https://vidipt89.github.io/SudokuWeb/)**

"SudokuWeb" is a from-scratch browser implementation — no frameworks, no build step, no backend — built around a single guarantee: **every generated puzzle has exactly one solution**. There's no puzzle database — each game is freshly generated in the browser by filling a full grid and carving it back down while checking uniqueness at every step.

The interface opens with a short animated intro, and is fully bilingual, switching instantly between European Portuguese and English.

## 📦 What's Inside

- 🎚️ Three difficulty levels — **Easy** (40–45 clues), **Medium** (32–36 clues) and **Hard** (26–30 clues)
- ✅ Uniquely-solvable puzzles — clues are removed one at a time, keeping each removal only if the puzzle still solves to exactly one grid
- ✏️ Pencil-mark notes mode — jot down candidate digits in a cell instead of committing a final value
- 🚫 Live conflict detection — placing a digit that already exists in the same row, column or 3x3 box highlights every conflicting cell
- 💡 Limited hints per game (3/4/5 by difficulty) that reveal the correct value for the selected cell — or a random incorrect one if nothing's selected — and ↩️ unlimited undo
- 🎬 Smooth animations — pop-in on digit entry and hints, shake on conflicts, a confetti burst on winning
- ⌨️ Full keyboard support — digits 1-9 to fill, Backspace/Delete to erase, arrow keys to move the selection, N to toggle notes
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
│   └── style.css       # Theme tokens, layout, grid/cell styles, animations
├── js/
│   ├── i18n.js          # PT/EN strings and language persistence
│   ├── solver.js         # MRV backtracking solver, capped solution counter, conflict scan
│   ├── generator.js       # Randomized full-grid fill + hole digging with uniqueness checks
│   ├── engine.js           # Board state, dispatch results, undo stack, hints, snapshots
│   └── ui.js                # Rendering, screen navigation, keyboard input, save/leaderboard
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
   stop once the difficulty's minimum clue count is reached

3. The solver used for both digging and hints is a single MRV
   (minimum-remaining-values) backtracker: always branch on the
   emptiest cell first, so contradictions surface almost immediately
```

### Hints & conflicts
```
Hint: reveals solution[selectedCell] if that cell is empty or wrong;
      otherwise picks a random cell that still needs fixing. Capped
      per game by difficulty (Easy 3 / Medium 4 / Hard 5).

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
- Undo restores both the previous value and the previous notes for a cell, and un-spends a hint if the move it's undoing was one
- Language, in-progress games and the local leaderboard are all stored in `localStorage`, so they persist between visits
- All game logic (generation, solving, the game engine) is pure, DOM-free code kept separate from rendering in `ui.js`
- This is an independent JavaScript codebase, part of a small triplet of from-scratch Sudoku implementations across Android, iOS/macOS and the web — no code is shared between them

---

Developed by **David Arsénio Martins** — *"Vidi"*
