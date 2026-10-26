# Revisão de design, 2026-10-26

## Implementado
Paleta partilhada de grafite e âmbar suave, tipografia do sistema sem dependências externas, maior contraste das notas e divisórias, contorno de seleção, sublinhado de números iguais e marcador de conflito além da cor. Modo Notas com contorno, ícone/indicador e teclado diferenciado; estado acessível na Web. Controlos e estatísticas com hierarquia mais discreta. Teclado Web numa fila em espaços largos e duas em espaços estreitos. Menu nativo com scroll, centragem e créditos sem colisão. Rodapé Web passa ao fluxo normal.

Removidas animações de entrada que deixavam menu/grelha invisíveis nas capturas Safari, bem como respetivos handlers e variáveis sem uso. A inspeção visual passou a mostrar todo o tabuleiro e os comandos.

## Verificação
142 verificações Web, 131 Swift e ambas as suites de desafios passaram. Builds macOS e iOS Simulator sem assinatura passaram. Inspeção real via CUA: menu e tabuleiro Safari, modo Notas acessível e visual; menu final macOS centrado, tabuleiro, notas e ambos os níveis do teclado visíveis.

## Limites
Não foi efetuada nesta entrega uma matriz completa de tamanhos, teste em iPhone/iPad físico, rotação, VoiceOver ou todos os tamanhos Dynamic Type. Alterações de tipografia dinâmica abrangem os controlos revistos, não toda a aplicação. Dicas pedagógicas e dificuldade por técnicas humanas continuam propostas futuras.

## Padrão aprendido
Conteúdo essencial não deve depender de animações com estado inicial opacity: 0 para ficar visível. No Safari controlado em segundo plano, a árvore acessível respondia enquanto a animação mantinha o conteúdo invisível. Eliminar essa dependência permitiu validar visualmente a interface.
