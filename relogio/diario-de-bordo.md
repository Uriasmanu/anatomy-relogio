# Diário de bordo: figuras isométricas com a skill Anatomy

Data do registro: 24/11/2026. Projeto: `c:\git\Nova pasta (3)`. Objeto final: `relogio/build-grande.mjs` (gera `relogio-grande.html` e `relogio-grande-light.html`).

## Resumo

Em uma única sessão longa, a skill Anatomy foi usada para construir quatro figuras interativas em SVG isométrico: um transformador de potência desmontável, três versões de um relógio mecânico (esqueleto, completo e "grande", de alta complicação) e suas variações. O trabalho foi guiado por uma spec escrita (`relogio/spec.md`) e verificado por capturas, folhas de contato e uma checagem de linhas soltas.

Resultado final: uma figura de cerca de 130 peças, 18 engrenagens com número de dentes real, 0 pontas de linha soltas em 460 verificadas, nos dois temas, com console limpo. A skill se mostrou eficaz para a forma e a ordem de pintura, mas deixou de fora, por falha minha, a auditoria geométrica oficial. Este diário registra o que foi feito, o que deu errado, e o que se aprendeu sobre como a skill funciona.

## 1. Objetivo e hipóteses

**Objetivo.** Explicar um objeto técnico como uma máquina física montada com muitas peças pequenas, com dados verdadeiros e movimento calmo, e depois desmontá-la para ver as peças internas.

**Hipótese H1.** Um modelo escrito em Node, usando o kit da skill (`iso-kit.mjs`, `lathe.mjs`), gera SVG estático com ordem de pintura correta, e um pequeno script de página basta para animar.

**Hipótese H2.** Uma spec em Markdown, escrita pelo usuário e lida pelo assistente, é um bom mecanismo de iteração: cada pedido vira um item testável com um critério de "pronto quando".

**Hipótese H3 (refutada, ver seção 4.5).** Uma bancada de relojoeiro, onde as peças desmontadas pousam lado a lado, comunica melhor as peças internas que a pilha vertical.

## 2. Material e método

**Ferramentas.**
- Skill Anatomy, em `C:\Users\maano\.claude\skills\anatomy`: o kit (`iso-kit.mjs`, `lathe.mjs`, `audit.mjs`, `tube.mjs`, `gl.mjs`), os exemplos e os scripts `capture.mjs`, `drive.mjs`, `lines.mjs`.
- Node 20.20.2 (o `node` da linha de comando era o 14.21.3, sem `--experimental-websocket`, então os scripts de captura precisaram do 20 pelo caminho completo).
- Chrome headless via `drive.mjs`, com ações em JSON: `click`, `wait`, `shot`, `sheet`, `eval`, `lines`.

**Procedimento padrão por mudança.**
1. Editar `build-grande.mjs`.
2. Gerar os dois temas (`node build-grande.mjs` e `--light`).
3. Rodar `lines.mjs` nos dois HTML (critério: `line ends: 0`).
4. Capturar montado e desmontado, olhar a imagem, e só então declarar pronto.

**Regras do usuário que moldaram o método** (do `CLAUDE.md`): não rodar git sem pedido, não publicar nada online, comentários de código com no máximo duas linhas, e deixar as alterações no diretório para revisão. Mais uma regra dita durante a sessão: tudo que o usuário falava deveria ir primeiro para a spec, e o código só mudava quando ele pedisse para implementar.

## 3. Cronologia

### 3.1 Transformador de potência (`transformador/`)
- Pedido inicial: entender a skill e escrever um prompt para explicar um transformador de potência.
- Primeira versão rejeitada pela forma; refeita para seguir `transformador-tfmp.glb`, com o objetivo de desmontar e ver as peças grandes.
- O GLB estava comprimido (Draco e meshopt), então foi decodificado em Node para extrair a forma.
- Resultado: figura desmontável com 9 conjuntos, molas com escalonamento, reordenação de camadas por quadro, e modelo físico em `model.mjs` (relações de tensão, corrente, perdas, temperatura do óleo).
- Erros corrigidos: pás dos ventiladores indexadas errado, braço do comutador com transformação absoluta, linhas flutuando, buchas atravessando a tampa.

### 3.2 Relógio esqueleto, completo e "grande" (`relogio/`)
- `build.mjs`: relógio esqueleto com mecanismo completo (16 engrenagens, balanço, âncora, rotor, mola do barrilete, pontes, coroa), com dados verdadeiros: 28.800 alternâncias por hora, roda de escape de 15 dentes a 16 rpm, rodagem 80/10, 80/10, 75/10, 96/6.
- Pedido: "um relógio inteiro montado", com mostrador de verdade → `build-completo.mjs` (mostrador fechado, mostradores auxiliares, pushers de cronógrafo, pulseira).
- Pedido: versão baseada em uma imagem de ouro, depois melhorada com um SVG de referência → `build-grande.mjs` (algarismos romanos, folhas na lunete, mostradores de 24 h, dia da semana, data, lua e reserva).
- Dúvida do usuário: como se chama o que a skill usa para recriar o relógio. Resposta: um modelo em código que gera SVG isométrico, não um 3D de renderização.

### 3.3 A spec como método (`relogio/spec.md`)
- O usuário perguntou como indicar melhorias; a resposta foi um arquivo `spec.md` com alvo, dados que não mudam, itens com "fazer" e "pronto quando", verificação e entrega.
- A spec cresceu por camadas: proporção da caixa e da pulseira, fundo com vidro, movimento denso, interação simplificada, bancada, pulseiras, pinos, cor, estética da pulseira fechada, fivela, camadas do movimento.
- Houve três reversões de rumo registradas na própria spec: bancada abandonada, descarte e reativação do movimento denso, e troca de paleta quente por paleta neutra.

### 3.4 Proporção da caixa e da pulseira
- Problema: caixa muito alta, pulseira pequena.
- Intervenção no kit: um fator de achatamento vertical `zs` foi acrescentado a `iso`, `depthOf`, `screenRise` e `fitProjection`, para reduzir a altura sem mexer em cada peça. Resultado: caixa com cerca de 0,16 do diâmetro.
- A pulseira passou a 0,5 do diâmetro, depois à proporção de uma pulseira de 22 mm (longa 880, curta 640, espessura 22, 9 furos).

### 3.5 Bancada de relojoeiro (hipótese H3)
- Implementada: bancada de madeira, bandeja, lupa, pinça, chave de fenda, peças a 75% da escala, câmera que aproxima o relógio montado e afasta ao desmontar.
- Resultado: o usuário abandonou a ideia ("vamos voltar no formato de desmontar inicial"). A hipótese H3 foi refutada: a bancada compete com o objetivo de ver as peças internas, e exige muito espaço de tela.
- O que sobrou de útil: o zoom de câmera por `viewBox`, reaproveitado depois.

### 3.6 Voltar à pilha vertical e expandir
- Pilha original restaurada, depois expandida várias vezes. Um zigue-zague lateral foi tentado e depois removido por pedido.
- Descoberta de erro de ordem: peças acima da caixa eram cobertas pela parede da frente da caixa (a "base atravessando").
- Solução: ordenar as camadas por altura de destino durante o desmonte e reordenar o DOM só quando a meta muda.

### 3.7 Pulseira, pinos, coroa e pushers
- Pulseira fechada em laço, sólida, com espessura (secções inclinadas, sombreamento por inclinação, borda e costura), que se endireita ao desmontar, com troca por esmaecimento.
- Pinos de mola presos a cada pulseira, passando por dentro da espessura, com só as pontas aparecendo.
- Coroa e pushers se separam para a direita (a coroa saía para a esquerda, para dentro da caixa, por erro de sinal).

### 3.8 Paleta neutra e movimento completo
- Pedido: seguir o padrão de cor do `transformador.html`. Removidas as classes `.gold`, `.cream`, `.ink`, `.strap`, `.buckle`, `.tray`, `.paper`, `.bench`; o relógio passou a usar só as variáveis `--anatomy-*`.
- Movimento completo da referência: platina cheia, pontes em coração, gancho e pá, roda de coluna, alavancas, janela do barrilete, haste de corda, gravações.
- Pilha com cerca de 20 conjuntos.

### 3.9 Desmonte em duas etapas
- Primeiro clique: a parte de cima (lunete, ponteiros, mostrador, minuteria) sobe montada como um bloco. Segundo clique: tudo se separa. Terceiro: volta a montar. A câmera acompanha com três quadros de `viewBox`.

### 3.10 Auditoria desta rodada e correções
Achados e ações:
1. **Parede da caixa com listras verticais.** O anel era feito de duas metades extrudadas, com tom por faceta, o que cria degraus. Substituído por um anel liso de revolução (`ringSolid`), desenhado duas vezes: inteiro antes do interior, e de novo depois, recortado por um `clipPath` que exclui a abertura. Resultado: uma superfície contínua, sem emendas.
2. **Ponteiro pisca e engrenagens aparecem na primeira animação.** Causa: o nível de ordenação usava a altura instantânea; peças do bloco com a mesma meta tinham valores quase iguais, e o ruído numérico trocava a ordem entre quadros. Correção: o nível passou a vir da altura de destino, arredondada. Medição (mutações de DOM por clique): primeiro clique 118, segundo clique cerca de 2.100 e terceiro cerca de 2.400 antes da correção; 118 em cada um dos três depois.
3. **Faixa de reflexo de vidro solta.** Removida.
4. **Ponta da pulseira visível na fivela.** Pulseira curta encurtada em 12 para ficar sob a barra.

## 4. Resultados e discussão

### 4.1 Números
| Item | Valor |
|---|---|
| Peças desenhadas (itens) | 130 |
| Engrenagens animadas | 18 |
| Conjuntos que se separam | cerca de 22 |
| Linhas verificadas / soltas | 460 / 0, nos dois temas |
| Altura do quadro | 1300 (desmontado) |
| Alturas finais (exemplos) | lunete 980, platina 60, fundo −150 |

### 4.2 O que funcionou
- Ordem de pintura por chaves explícitas, com metades para anéis altos, produziu um relógio legível sem gravador.
- A spec com critério de pronto tornou cada pedido verificável.
- A checagem de linhas (`lines.mjs`) pegou casos reais (uma ponta a 1,01 px).

### 4.3 O que deu errado e por quê
- **Sinal trocado na separação da coroa:** o deslocamento era −120, enviando a coroa para dentro da caixa.
- **Pinos que subiam como conjunto separado:** cruzavam a frente da caixa porque a elevação projetada os jogava sobre a parede. Passaram a ir presos às pulseiras.
- **Limiares de ordenação em escala errada:** as chaves de ordem multiplicam o viés por 0,001, e eu comparei com valores sem essa escala; todas as peças caíram na classe 0, o que passou despercebido por um tempo.
- **Verificar só um estado:** várias vezes conferi só a figura desmontada e perdi defeitos da montada, que o usuário apontou (o degrau da lunete, o laço fino da pulseira).
- **Afirmações fortes cedo demais:** algumas respostas disseram "conferido" antes de olhar o tema escuro ou os quadros intermediários.

### 4.4 O que o usuário ensinou sobre o processo
- Preferiu iterar por spec: ver o texto antes do código.
- Rejeitou o excesso de decoração (bancada, ferramentas) a favor de ver o mecanismo.
- Cobrou consistência visual com o transformador (paleta neutra).
- Cobrou verificação honesta, inclusive do que não foi conferido.

### 4.5 Sobre H3 (bancada)
A bancada exigia escala de 75% e uma figura larga, e a câmera de zoom por `viewBox` resolvia só parte. Para o objetivo "ver as peças internas", a pilha vertical em duas etapas foi mais direta.

## 5. Aprendizados sobre a skill Anatomy

### 5.1 Como ela funciona
- **Ideia central:** o objeto é a explicação. A figura é uma máquina física detalhada, não um diagrama de caixas. Cada número exibido vem do mesmo modelo que move as peças.
- **Build em Node → página estática.** O script do projeto importa o kit, monta strings SVG (`solidSvg`, `lineSvg`, `dotsSvg`, `faceTextSvg`), envolve em `figureSvg` e `plateHtml`, e grava o HTML com `pageHtml({ script: kitScript() + live })`. O script `live` é código de navegador, escrito como string de template; por isso um erro de aspas dentro dele só aparece em execução.
- **Câmera e projeção.** `fitProjection(pontos, largura, altura, { azimuth, elevation })` calcula escala e origem para caber os pontos. `iso` projeta um ponto 3D. `depthOf` dá a profundidade. Com azimute 75°, o eixo x vira o horizontal da tela e y vira o vertical com encurtamento.
- **Sólidos.** `extrude` devolve laterais em quatro tons mais topo; `convex: false` permite polígonos côncavos. `slabOf` faz placas com cantos arredondados. `cylinder` e `ringBand` (via `ringSolid` do projeto) fazem peças redondas com sombreamento suave. `.iso-fill{fill-rule:evenodd}` é necessário para anéis com furo.
- **Ordem de pintura.** Cada peça entra numa lista com uma chave de ordem; as peças são ordenadas e agrupadas. Anéis altos são divididos em metade de trás e metade da frente, desenhadas antes e depois do interior.
- **Movimento.** Molas físicas (`STIFF`, `DRAG`) com escalonamento entre conjuntos; engrenagens giram por matrizes afins calculadas (`planRot`), com razões reais; o balanço oscila a 4 Hz.
- **Tema.** Tokens `--anatomy-*` definem página, cartão, tons e acentos nos dois temas; a figura herda cores por classe CSS ou por variáveis.
- **Verificação oficial.** `lines.mjs` confere pontas de linha; `drive.mjs` simula clique, espera, captura e folhas de contato; `audit.mjs` prova a geometria com o gravador de peças (`recorder`, `settle`, `auditOrExit`).

### 5.2 Regras da skill (resumo do que importa)
- Sólidos, não fios; tons por face; hierarquia de tons com uma única peça em destaque; cor só quando a cor é a informação.
- Detalhe pequeno e preciso, nunca ruído: parafusos como pontos, chanfros, ticks, escalas.
- Cada linha termina sobre algo; o 4× deve sempre mostrar algo verdadeiro.
- Nunca silenciar a auditoria com uma peça de enfeite.

### 5.3 Armadilhas que encontrei
1. A projeção do kit assume um único ângulo; qualquer mudança de câmera exige reconstruir todas as peças. Isso impediu uma "elevação variável" ao desmontar.
2. Peças redondas com abertura só funcionam com `evenodd`; sem ele, o furo é preenchido.
3. `solidOf` com perfil aberto preenche a silhueta inteira; não serve para "só a parede".
4. Elementos sem classe `iso-line` não entram na checagem de linhas; para linhas decorativas sem ponta apoiada, a skill pede `data-free`.
5. A reordenação de camadas em tempo de execução precisa usar uma chave estável (a meta), nunca a posição instantânea, senão há cintilação.
6. Fade entre duas representações (laço fechado × pulseira reta) é uma solução barata, mas é uma troca, não um morph.
7. O kit exporta `.mjs` e o `.ts` correspondente; ao patchar o kit local, a página inline pega o `.mjs`, então a alteração vale para os dois.

### 5.4 Lacuna relevante
A auditoria oficial (`--audit`) não foi usada: o projeto não registra a forma de cada peça no gravador. Isto significa que "nada atravessa nada" foi verificado por olhos e capturas, não por prova. A recomendação para figuras futuras: registrar cada peça no gravador desde o começo.

## 6. Limitações atuais
- Auditoria geométrica oficial não executada.
- Interior do movimento pouco contrastado no tema escuro.
- A pulseira de cima só aparece em parte no laço fechado, por trás da caixa.
- Celular (390 px) não testado.
- Elevação de câmera fixa (55°).
- Densidade do movimento abaixo da referência (menos engrenagens, sem martelo ligado a controle).

## 7. Próximos passos sugeridos
1. Registrar as peças no gravador (`A.recorder`) e rodar `node build-grande.mjs --audit` até zerar.
2. Capturar quadros em 4× em todo o relógio, nos dois temas, montado, na primeira etapa e desmontado.
3. Clarear os tons do movimento e da pulseira no tema escuro.
4. Testar em 390 px e ajustar a altura do quadro.
5. Documentar a spec final removendo seções contraditórias (cores quentes, bancada).

## 8. Apêndice

**Arquivos principais**
- `relogio/build-grande.mjs`: modelo, peças, ordem e página.
- `relogio/spec.md`: spec com decisões e reversões.
- `relogio/kit/iso-kit.mjs`: kit local, com o fator `zs`.
- `relogio/relogio-grande.html` e `relogio-grande-light.html`: saídas.
- `transformador/`: figura do transformador e seu modelo físico.

**Comandos**
- Gerar: `node build-grande.mjs` e `node build-grande.mjs --light`.
- Linhas: `node <skill>/scripts/lines.mjs <arquivo.html>`.
- Capturas: `node <skill>/scripts/drive.mjs <arquivo.html> --actions <json>`.
- Usar o Node 20.20.2 para os scripts de captura.

Nenhum comando git foi executado e nada foi publicado online.
