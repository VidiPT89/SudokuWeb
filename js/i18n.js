/* Bilingual UI copy (European Portuguese / English). */

const I18N = {
  pt: {
    mistakes: 'Erros',
    htpChallengeBody: 'Cada número diferente da solução conta como um erro, mesmo sem conflito visível. Soma erros e dicas: 0 dá 3 estrelas, 1 a 3 dá 2 estrelas, 4 ou mais dá 1 estrela. O tempo não afeta as estrelas. Fica guardado o teu melhor resultado de cada nível.',
    htpChallengeTitle: 'Desafios e estrelas',
    metaTitle: 'SudokuWeb: Puzzle de Lógica',
    row: 'Linha', column: 'Coluna', emptyCell: 'vazia', fixedCell: 'fixa', conflictCell: 'em conflito',
    tapToContinue: 'Toque para continuar',
    developedBy: 'Desenvolvido por',

    menuTag: 'SUDOKU',
    menuSubtitle: 'Preenche a grelha 9x9. Sem repetições em linhas, colunas ou blocos.',
    play: 'Jogar',
    continueGame: 'Continuar',
    howToPlay: 'Como Jogar',

    difficultyLabel: 'Dificuldade',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    expert: 'Expert',

    challenges: 'Desafios',
    challengesTitle: 'Desafios',
    challengesSubtitle: 'Puzzles com menos pistas até ao nível expert. Repete níveis para melhorar as tuas estrelas.',
    level: 'Nível',
    locked: 'Bloqueado',
    levelReached: 'Nível',
    starsLabel: 'Estrelas',
    showEarlier: 'Ver níveis anteriores',
    nextLevel: 'Próximo Nível',
    backToLevels: 'Voltar aos Níveis',
    levelUnlocked: 'Novo nível desbloqueado!',
    levelCompleteSuffix: 'Completo!',

    notes: 'Notas',
    erase: 'Apagar',
    newGame: 'Novo Jogo',
    hint: 'Dica',
    undo: 'Anular',
    time: 'Tempo',
    moves: 'Jogadas',
    hintsLeft: 'Dicas',
    noHintsLeft: 'Sem mais dicas disponíveis.',
    nothingToUndo: 'Nada para anular.',
    sound: 'Som',
    reveal: 'Revelar',
    lineRow: 'linha {n}', lineCol: 'coluna {n}',
    ofRow: 'da linha {n}', ofCol: 'da coluna {n}', ofBox: 'do bloco {n}',
    cellRef: '(linha {r}, coluna {c})', and: ' e ',
    elimPointing: 'No bloco {b}, o {d} só pode ficar na {line}, por isso sai do resto da {line}.',
    elimClaiming: 'Na {line}, o {d} só pode ficar no bloco {b}, por isso sai das outras casas desse bloco.',
    elimPair: 'As casas {cells} só aceitam o {a} e o {e}, por isso esses números saem das outras casas {of}.',
    elimXWingRows: 'X-Wing: nas linhas {a} e {b}, o {d} só pode ficar nas colunas {x} e {y}, por isso sai das outras casas dessas colunas.',
    elimXWingCols: 'X-Wing: nas colunas {a} e {b}, o {d} só pode ficar nas linhas {x} e {y}, por isso sai das outras casas dessas linhas.',
    clueWrong: 'Há um número errado na linha {r}.',
    clueHiddenBox: 'Olha para o bloco destacado: o {d} só tem uma casa possível.',
    clueHiddenRow: 'Olha para a linha {r}: o {d} só tem uma casa possível.',
    clueHiddenCol: 'Olha para a coluna {c}: o {d} só tem uma casa possível.',
    clueNaked: 'Na linha {r} há uma casa onde só cabe um número.',
    clueReveal: 'Não há dedução simples neste momento.',
    clueNext: 'Carrega em Revelar para preencher a casa (gasta uma dica).',
    hintHiddenBox: 'No bloco destacado, o {d} só cabe na linha {r}, coluna {c}.',
    hintHiddenRow: 'Na linha {r}, o {d} só cabe na coluna {c}.',
    hintHiddenCol: 'Na coluna {c}, o {d} só cabe na linha {r}.',
    hintNaked: 'Linha {r}, coluna {c}: só o {d} é possível. Os outros números já estão na mesma linha, coluna ou bloco.',
    hintWrong: 'Linha {r}, coluna {c} estava errada: a resposta é {d}.',
    hintReveal: 'Linha {r}, coluna {c}: não há dedução simples aqui de momento. A resposta é {d}.',

    winTitle: 'Grelha Completa!',
    winSubtitle: 'Resolveste o puzzle com sucesso.',
    playAgain: 'Jogar Novamente',
    backToMenu: 'Voltar ao Menu',
    finalTime: 'Tempo final',
    finalHints: 'Dicas usadas',
    bestTime: 'Melhor Tempo',
    bestHints: 'Menos Dicas',
    newRecordTime: 'Novo recorde!',
    newRecordHints: 'Novo recorde!',

    confirmRestartTitle: 'Começar Novo Jogo?',
    confirmRestartBody: 'Vais perder o progresso atual. O novo puzzle mantém a dificuldade.',
    confirmYes: 'Confirmar',
    confirmNo: 'Cancelar',

    htpTitle: 'Como Jogar',
    htpIntro: 'O objetivo é preencher a grelha 9x9 com os números de 1 a 9.',
    htpRuleTitle: 'A Regra',
    htpRuleBody: 'Cada linha, cada coluna e cada bloco 3x3 tem de conter todos os números de 1 a 9, sem repetições.',
    htpGivenTitle: 'Números Fixos',
    htpGivenBody: 'Os números já preenchidos no início são fixos e não podem ser alterados. Os restantes são preenchidos por ti.',
    htpConflictTitle: 'Conflitos',
    htpConflictBody: 'Se colocares um número que já existe na mesma linha, coluna ou bloco, essas células ficam destacadas a vermelho.',
    htpNotesTitle: 'Notas',
    htpNotesBody: 'Marca candidatos nas casas vazias. Ao colocar um número, essa nota é removida da mesma linha, coluna e bloco. Desfazer também recupera essas notas.',
    htpToolsTitle: 'Ferramentas',
    htpHintTool: 'O primeiro toque dá uma pista grátis: onde olhar, sem preencher. O segundo (Revelar) preenche a casa e explica a dedução: um número errado primeiro; senão sozinhos, candidatos apontados, reclamados, pares ou X-Wing. Há 3, 4 ou 5 revelações por partida e uma usada continua a contar mesmo que desfaças a jogada.',
    htpUndoTool: 'Recupera o valor e as notas anteriores. Os últimos 200 movimentos ficam guardados ao sair e retomar. Erros e dicas usados continuam a contar.',
    htpCloseButton: 'Entendido',
  },

  en: {
    mistakes: 'Mistakes',
    htpChallengeBody: 'Each digit that differs from the solution counts as a mistake, even without a visible conflict. Add mistakes and hints: 0 earns 3 stars, 1 to 3 earns 2 stars, 4 or more earns 1 star. Time does not affect stars. Your best result for each level is kept.',
    htpChallengeTitle: 'Challenges and stars',
    row: 'Row', column: 'Column', emptyCell: 'empty', fixedCell: 'given', conflictCell: 'conflicting',
    metaTitle: 'SudokuWeb: Logic Puzzle',
    tapToContinue: 'Tap to continue',
    developedBy: 'Developed by',

    menuTag: 'SUDOKU',
    menuSubtitle: 'Fill the 9x9 grid. No repeats in any row, column or box.',
    play: 'Play',
    continueGame: 'Continue',
    howToPlay: 'How to Play',

    difficultyLabel: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',

    challenges: 'Challenges',
    challengesTitle: 'Challenges',
    challengesSubtitle: 'Puzzles with fewer clues up to expert level. Replay levels to improve your stars.',
    level: 'Level',
    locked: 'Locked',
    levelReached: 'Level',
    starsLabel: 'Stars',
    showEarlier: 'Show earlier levels',
    nextLevel: 'Next Level',
    backToLevels: 'Back to Levels',
    levelUnlocked: 'New level unlocked!',
    levelCompleteSuffix: 'Complete!',

    notes: 'Notes',
    erase: 'Erase',
    newGame: 'New Game',
    hint: 'Hint',
    undo: 'Undo',
    time: 'Time',
    moves: 'Moves',
    hintsLeft: 'Hints',
    noHintsLeft: 'No more hints available.',
    nothingToUndo: 'Nothing to undo.',
    sound: 'Sound',
    reveal: 'Reveal',
    lineRow: 'row {n}', lineCol: 'column {n}',
    ofRow: 'row {n}', ofCol: 'column {n}', ofBox: 'box {n}',
    cellRef: '(row {r}, column {c})', and: ' and ',
    elimPointing: 'In box {b}, {d} can only go in {line}, so it leaves the rest of {line}.',
    elimClaiming: 'In {line}, {d} can only go in box {b}, so it leaves the other cells of that box.',
    elimPair: 'Cells {cells} only take {a} and {e}, so those digits leave the other cells of {of}.',
    elimXWingRows: 'X-Wing: in rows {a} and {b}, {d} can only go in columns {x} and {y}, so it leaves the other cells of those columns.',
    elimXWingCols: 'X-Wing: in columns {a} and {b}, {d} can only go in rows {x} and {y}, so it leaves the other cells of those rows.',
    clueWrong: 'There is a wrong digit in row {r}.',
    clueHiddenBox: 'Look at the highlighted box: {d} has only one possible cell.',
    clueHiddenRow: 'Look at row {r}: {d} has only one possible cell.',
    clueHiddenCol: 'Look at column {c}: {d} has only one possible cell.',
    clueNaked: 'Row {r} has a cell where only one digit fits.',
    clueReveal: 'No simple deduction applies right now.',
    clueNext: 'Press Reveal to fill the cell in (uses a hint).',
    hintHiddenBox: 'In the highlighted box, {d} only fits in row {r}, column {c}.',
    hintHiddenRow: 'In row {r}, {d} only fits in column {c}.',
    hintHiddenCol: 'In column {c}, {d} only fits in row {r}.',
    hintNaked: 'Row {r}, column {c}: only {d} is possible. Every other digit is already in its row, column or box.',
    hintWrong: 'Row {r}, column {c} was wrong: the answer is {d}.',
    hintReveal: 'Row {r}, column {c}: no simple deduction applies here right now. The answer is {d}.',

    winTitle: 'Grid Complete!',
    winSubtitle: 'You solved the puzzle.',
    playAgain: 'Play Again',
    backToMenu: 'Back to Menu',
    finalTime: 'Final time',
    finalHints: 'Hints used',
    bestTime: 'Best Time',
    bestHints: 'Fewest Hints',
    newRecordTime: 'New record!',
    newRecordHints: 'New record!',

    confirmRestartTitle: 'Start a New Game?',
    confirmRestartBody: "You'll lose your current progress. The new puzzle keeps the same difficulty.",
    confirmYes: 'Confirm',
    confirmNo: 'Cancel',

    htpTitle: 'How to Play',
    htpIntro: 'The goal is to fill the 9x9 grid with the digits 1 through 9.',
    htpRuleTitle: 'The Rule',
    htpRuleBody: 'Every row, every column and every 3x3 box must contain each digit from 1 to 9 exactly once.',
    htpGivenTitle: 'Given Numbers',
    htpGivenBody: 'Numbers already filled in at the start are fixed and cannot be changed. The rest are yours to fill.',
    htpConflictTitle: 'Conflicts',
    htpConflictBody: 'If you place a number that already exists in the same row, column or box, those cells are highlighted in red.',
    htpNotesTitle: 'Notes',
    htpNotesBody: 'Mark candidates in empty cells. Placing a digit removes that note from its row, column and box. Undo also restores those notes.',
    htpToolsTitle: 'Tools',
    htpHintTool: 'The first tap gives a free clue: where to look, without filling anything. The second (Reveal) fills the cell and explains the deduction: a wrong digit first; otherwise singles, pointing or claiming candidates, pairs or X-Wing. Each game has 3, 4 or 5 reveals and a used one still counts even if you undo the move.',
    htpUndoTool: 'Restores the previous value and notes. The last 200 moves are saved when you leave and resume. Mistakes and used hints still count.',
    htpCloseButton: 'Got It',
  },
};

const DEFAULT_LANG = 'pt';

function getStoredLang() {
  try {
    const stored = localStorage.getItem('sudokuweb-lang');
    if (stored && Object.prototype.hasOwnProperty.call(I18N, stored)) return stored;
  } catch (e) { /* localStorage unavailable */ }
  return DEFAULT_LANG;
}

function setStoredLang(lang) {
  try { localStorage.setItem('sudokuweb-lang', lang); } catch (e) { /* ignore */ }
}

/* Builds the hint panel text: the elimination steps, then either the clue (where to look) or,
   once revealed, the deduction that fills the cell. One sentence per line. */
function formatHint(hint, dict) {
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, k) => values[k]);
  const r = Math.floor(hint.index / 9) + 1, c = (hint.index % 9) + 1, d = hint.digit;
  const line = unit => fill(unit.type === 'row' ? dict.lineRow : dict.lineCol, { n: unit.index + 1 });
  const cellRef = i => fill(dict.cellRef, { r: Math.floor(i / 9) + 1, c: (i % 9) + 1 });
  const lines = hint.eliminations.map(e => {
    if (e.kind === 'pointing') return fill(dict.elimPointing, { b: e.source.index + 1, d: e.digits[0], line: line(e.target) });
    if (e.kind === 'claiming') return fill(dict.elimClaiming, { b: e.target.index + 1, d: e.digits[0], line: line(e.source) });
    if (e.kind === 'xwing') {
      return fill(e.source.type === 'row' ? dict.elimXWingRows : dict.elimXWingCols,
        { a: e.base[0] + 1, b: e.base[1] + 1, d: e.digits[0], x: e.cover[0] + 1, y: e.cover[1] + 1 });
    }
    const of = fill({ row: dict.ofRow, col: dict.ofCol, box: dict.ofBox }[e.source.type], { n: e.source.index + 1 });
    return fill(dict.elimPair, { cells: e.cells.map(cellRef).join(dict.and), a: e.digits[0], e: e.digits[1], of });
  });
  if (hint.revealed) {
    const key = hint.technique === 'hidden'
      ? { box: 'hintHiddenBox', row: 'hintHiddenRow', col: 'hintHiddenCol' }[hint.unit.type]
      : { naked: 'hintNaked', wrong: 'hintWrong', reveal: 'hintReveal' }[hint.technique];
    lines.push(fill(dict[key], { r, c, d }));
  } else {
    const key = hint.technique === 'hidden'
      ? { box: 'clueHiddenBox', row: 'clueHiddenRow', col: 'clueHiddenCol' }[hint.unit.type]
      : { naked: 'clueNaked', wrong: 'clueWrong', reveal: 'clueReveal' }[hint.technique];
    lines.push(fill(dict[key], { r, c, d }), dict.clueNext);
  }
  return lines.join('\n');
}
