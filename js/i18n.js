/* Bilingual UI copy (European Portuguese / English). */

const I18N = {
  pt: {
    metaTitle: 'SudokuWeb: Puzzle de Lógica',
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

    notes: 'Notas',
    erase: 'Apagar',
    newGame: 'Novo Jogo',
    hint: 'Dica',
    undo: 'Anular',
    restart: 'Reiniciar',
    time: 'Tempo',
    moves: 'Jogadas',
    hintsLeft: 'Dicas',
    noHintsLeft: 'Sem mais dicas disponíveis.',
    nothingToUndo: 'Nada para anular.',

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

    confirmRestartTitle: 'Reiniciar Puzzle?',
    confirmRestartBody: 'Vais perder o progresso atual neste puzzle.',
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
    htpNotesBody: 'Ativa o modo notas para marcar candidatos possíveis numa célula, em vez de preencher um valor definitivo.',
    htpToolsTitle: 'Ferramentas',
    htpHintTool: 'revela o valor correto de uma célula. Limitado por jogo.',
    htpUndoTool: 'desfaz a tua última jogada.',
    htpCloseButton: 'Entendido',

    langToggleLabel: 'Idioma',
    footerRights: 'Todos os direitos reservados.',
  },

  en: {
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

    notes: 'Notes',
    erase: 'Erase',
    newGame: 'New Game',
    hint: 'Hint',
    undo: 'Undo',
    restart: 'Restart',
    time: 'Time',
    moves: 'Moves',
    hintsLeft: 'Hints',
    noHintsLeft: 'No more hints available.',
    nothingToUndo: 'Nothing to undo.',

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

    confirmRestartTitle: 'Restart Puzzle?',
    confirmRestartBody: "You'll lose your current progress on this puzzle.",
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
    htpNotesBody: 'Turn on notes mode to pencil in possible candidates for a cell, instead of committing a final value.',
    htpToolsTitle: 'Tools',
    htpHintTool: 'reveals the correct value for a cell. Limited per game.',
    htpUndoTool: 'reverts your last move.',
    htpCloseButton: 'Got It',

    langToggleLabel: 'Language',
    footerRights: 'All rights reserved.',
  },
};

const DEFAULT_LANG = 'pt';

function getStoredLang() {
  try {
    const stored = localStorage.getItem('sudokuweb-lang');
    if (stored && I18N[stored]) return stored;
  } catch (e) { /* localStorage unavailable */ }
  return DEFAULT_LANG;
}

function setStoredLang(lang) {
  try { localStorage.setItem('sudokuweb-lang', lang); } catch (e) { /* ignore */ }
}
