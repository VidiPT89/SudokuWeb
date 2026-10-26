# Segunda revisão: jogabilidade (2026-10-26)

Esta revisão atualiza o estado descrito em 2026-10-26-audit.md.

## Melhorias implementadas

- Desfazer persiste com o jogo, até 200 movimentos. Gravações anteriores continuam a carregar sem histórico.
- Colocar um número limpa essa nota nas casas da mesma linha, coluna e bloco. Desfazer recupera todas as notas afetadas, incluindo depois de guardar/retomar.
- Dicas gastas não são reembolsadas por Desfazer. Corrige o acesso ilimitado à solução e a pontuação artificialmente perfeita.
- Erros são visíveis durante desafios. O guia PT/EN explica a limpeza das notas, o histórico e as estrelas.
- Partidas concluídas rejeitam alterações, dicas e Desfazer depois de registado o resultado.
- Web mostra as estrelas da partida acabada, em vez de mostrar indevidamente o melhor resultado anterior.
- Web e macOS/iOS ajustam o tabuleiro à altura disponível. Corrigido depois de observar a segunda fila de números fora da janela inicial.
- Removidos campos de resultado sem consumidores, capacidades de modelo desnecessárias, uma condição inalcançável no guia, ramos impossíveis e cópias redundantes no gerador. Seleção Swift passa a ter setter privado.

## Validação

- Web: 142 verificações do motor/UI simulada e suite de desafios passaram.
- Swift: 131 verificações do motor e suite de desafios passaram.
- Builds macOS e iOS Simulator passaram sem assinatura. Logs: /tmp/sudoku-macOS-review2.log e /tmp/sudoku-iOS-review2.log.
- Testes interativos na aplicação macOS via CUA: guia, entrada de dígitos, conflito, ativação de Desfazer, menu/retoma com histórico, dica seguida de Desfazer sem reembolso, cancelamento do reinício, notas, limpeza de nota de uma casa do mesmo bloco e respetiva recuperação por Desfazer.
- Safari local: entrada por teclado, abertura/cancelamento por Escape da confirmação, recarga, Continuar e Desfazer com histórico recuperado foram testados pela interface real. As capturas inicialmente vazias passaram a renderizar após a ativação da janela.
- Inspeção visual macOS confirmou tabuleiro e as duas filas de números visíveis em simultâneo na janela testada.

## Limites

Não foi testada uma partida completa interativamente, nem iPhone/iPad físico, rotação iOS ou leitor VoiceOver ligado. O motor tem testes de vitória. Assinatura, distribuição e resultado da CI remota não estão confirmados nesta revisão.

A dificuldade continua a usar uma meta de pistas. Uma futura classificação por técnicas humanas e dicas que expliquem o raciocínio seriam melhorias úteis, mas não foram implementadas nem anunciadas como existentes. Sem backend, contas ou sincronização acrescentados.

A captura final do Safari voltou a mostrar apenas o fundo, apesar de a árvore de acessibilidade apresentar a partida e todos os comandos. A alteração final de altura do layout Web requer confirmação visual adicional; os testes funcionais acima não equivalem a essa confirmação.
