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
    htpNotesBody: 'Marca candidatos nas casas vazias. Ao colocar um número, essa nota é removida da mesma linha, coluna e bloco. Desfazer também recupera essas notas.',
    htpToolsTitle: 'Ferramentas',
    htpHintTool: 'Revela a resposta de uma casa. Há 3, 4 ou 5 dicas por partida. Uma dica usada continua a contar mesmo que desfaças a jogada.',
    htpUndoTool: 'Recupera o valor e as notas anteriores. Os últimos 200 movimentos ficam guardados ao sair e retomar. Erros e dicas usados continuam a contar.',
    htpCloseButton: 'Entendido',

    langToggleLabel: 'Idioma',
    footerRights: 'Todos os direitos reservados.',
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
    htpNotesBody: 'Mark candidates in empty cells. Placing a digit removes that note from its row, column and box. Undo also restores those notes.',
    htpToolsTitle: 'Tools',
    htpHintTool: 'Reveals a cell’s answer. Each game has 3, 4 or 5 hints. A used hint still counts even if you undo the move.',
    htpUndoTool: 'Restores the previous value and notes. The last 200 moves are saved when you leave and resume. Mistakes and used hints still count.',
    htpCloseButton: 'Got It',

    langToggleLabel: 'Language',
    footerRights: 'All rights reserved.',
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
