# Spec: relógio "grande" (alta complicação)

## Alvo
- Arquivo: `relogio/build-grande.mjs` (gera `relogio-grande.html` e `relogio-grande-light.html`).
- Tema principal: claro. O escuro deve continuar legível.
- Tamanho: Hero. Só acrescentar ou refinar peças; não refazer a estrutura.

## Conceito e dados que precisam continuar verdadeiros
- Balanço a 28.800 alt/h (4 Hz, 8 batidas/s). Roda de escape de 15 dentes, 16 rpm.
- Rodagem 80/10, 80/10, 75/10, 96/6: central 1 volta/h, segundos 1 volta/min.
- Hora, dia, data, lua e reserva vêm do aparelho ou do modelo; nada fixo.
- Texto da marca de terceiros fica de fora. Usar só "ANATOMY".

## Prioridade 0: proporção da caixa e da pulseira (fazer primeiro)
Problema observado: a parte circular (caixa) está muito alta, e a parte que abraça o braço (hastes e pulseira) está pequena perto dela.

### 0.1 Caixa mais fina
- Onde: carrure e lunete (`Z_CASE0`, `Z_CASE1`, altura da lunete).
- Fazer: reduzir a altura total da caixa para cerca de 0,15 a 0,18 do diâmetro (hoje é cerca de 0,23). Para isso, comprimir a pilha vertical do movimento (dial, ponteiros, pontes) em vez de só cortar a parede, para nada atravessar a caixa.
- Alternativa aceita: subir um pouco a elevação da câmera (de 50° para 55°) se a compressão não bastar.
- Decisão: a elevação é variável. Montado fica em 50° (ou 55° se a caixa mais fina não bastar); só ao desmontar sobe para 55 a 60° (ver "Tela e interação"), e volta ao montar.
- Pronto quando: a lateral da caixa mostra no máximo cerca de metade da altura atual, sem peça saindo pelo topo e com o movimento ainda visível ao desmontar.

### 0.2 Pulseira e hastes proporcionais
- Onde: `lug()` e `strap()` em `build-grande.mjs`.
- Fazer: largura da pulseira na haste de cerca de 0,45 a 0,5 do diâmetro da caixa (hoje 0,23), afinando até cerca de 75% na ponta. Hastes mais largas e mais longas, com o vão entre elas igual à largura da pulseira. Pulseira superior e inferior mais compridas, com passadores e fecho proporcionais à nova largura.
- Pronto quando: ao olhar a figura inteira, a pulseira e a caixa parecem de um relógio real de pulso, com a pulseira ocupando uma área comparável à da caixa.
- Atualizar junto: o enquadramento (`BOXES`) para a figura não cortar, e a escala dos furos, costuras e escamas.

### Observação
Uma tentativa de ajuste da pulseira foi interrompida antes de ser verificada. Antes de começar, conferir o estado atual de `build-grande.mjs` (lugs e pulseira) e refazer a partir dele, sem confiar nesse trecho.

## Melhorias (uma por vez, depois da prioridade 0)

### 1. Lua colorida
- Onde: janela da fase da lua, embaixo do mostrador.
- Fazer: fundo azul-noite e disco da lua em laranja suave; estrelas pequenas claras.
- Pronto quando: lê bem nos dois temas e continua seguindo a fase real.

### 2. Mostrador mais rico
- Onde: guilloché e trilha externa.
- Fazer: trilha de minutos em dois anéis ("railroad") e pontos nos algarismos romanos; ondas do guilloché variando levemente de amplitude do centro para a borda.
- Pronto quando: nenhuma linha termina solta (`lines.mjs` em 0).

### 3. Ponteiros
- Onde: horas e minutos.
- Fazer: ponteiros mais finos, com a lâmina do minutos alongada e a ponta de lua do das horas vazada; ponteiro de segundos com contrapeso arredondado.
- Pronto quando: o ponteiro das horas não cobre o mostrador de 24 h por mais de 1 s por passada.

### 4. Caixa
- Onde: lugs, coroa, pushers, laterais da carrure.
- Fazer: lugs mais finos com 3 sulcos canelados; coroa canelada com anel de base; um parafuso decorativo na lateral esquerda ao lado do bloco do repetidor.
- Pronto quando: a coroa e os pushers continuam clicáveis e legíveis.

### 5. Pulseira e fecho
- Onde: pulseira e fecho no topo.
- Fazer: costura mais visível, extremidade arredondada na ponta com furos, fecho com argola e pino.
- Pronto quando: nenhuma peça atravessa a outra e a ordem de pintura segue correta.

### 6. Fundo com vidro (problema observado: parece estar por cima de algo)
Diagnóstico feito na versão desmontada:
- O fundo é um anel branco/cinza sem a cor da caixa (não recebe o acabamento de ouro rosé), então parece uma peça de outro relógio.
- O furo do anel mostra uma superfície cinza lisa (parede interna sem vidro), que lê como um disco colocado sobre algo.
- Ele é desenhado antes da frente da carrure e sem sombra de contato; por isso parece afundado atrás dela, não abaixo dela.

Fazer:
- Dar ao fundo o mesmo acabamento da caixa (ouro rosé) e uma borda polida.
- Desenhar o vidro de safira como disco com reflexo e gravação circular em volta, no lugar do furo cinza, deixando ver o movimento por baixo.
- Parafusos visíveis em volta e uma sombra de contato sob o anel.
- Conferir a ordem de pintura: o fundo fica abaixo da carrure, sem a frente da carrure cortando o anel.
- Pronto quando: ao desmontar, o fundo lê como peça de baixo da mesma caixa, com vidro, e o movimento aparece através dele.

## Tela e interação (simplificar)
- Mostrar só a tela do relógio. Tirar tudo que fica em volta: título "Fig 1", legenda de cores, texto de rodapé (caption), leitura "28.800 alt/h", barra de botões, mensagem de informação e a lista de peças numeradas embaixo.
- Um clique (ou toque) no relógio monta; outro clique desmonta. Vale para o clique em qualquer ponto da figura. Teclado: Espaço/Enter também alterna.
- Os botões Câmera lenta, Puxar coroa, Agitar o pulso e Zerar saem da tela. O cronógrafo e o ajuste da hora deixam de ter controle visível; os pushers não disparam mais nada, o clique neles também alterna montar/desmontar.
- DECISÃO ATUAL: a ideia da bancada foi abandonada. Desmontar volta ao formato inicial: as camadas se separam na vertical, em pilha, de cima para baixo, com o clique alternando. Tudo que está descrito abaixo sobre bancada, sombras de bancada, ponto de vista do artesão e peças vivas na mesa fica sem efeito.
- (Histórico, sem efeito) Desmontar como bancada: ao desmontar, as peças descem devagar (movimento lento e suave, cerca de 2 a 3 s no total) até uma bancada desenhada sob o relógio e param lado a lado no plano da bancada, cada conjunto separado dos outros, sem se sobrepor. Hoje elas só sobem empilhadas na vertical.
  - Ordem de pousar: de fora para dentro e em sequência (caixa e vidro, ponteiros, mostrador, ponte, balanço, rodagem, barrilete, rotor, fundo), com pequeno atraso entre uma e outra.
  - Disposição: em fileiras com espaço igual (por exemplo 2 fileiras de 6), peças grandes atrás e pequenas à frente, para nenhuma esconder a outra; pulseira e fecho ficam em um canto da bancada.
  - Bancada: uma tampa plana de madeira ou feltro com sombra de contato sob cada peça; enquadrar a figura (`BOXES`) para a bancada inteira caber.
  - Montar volta pelo mesmo caminho, devagar, até o relógio inteiro.
  - Pronto quando: desmontado, dá para ver e contar cada peça separada em cima da bancada, sem sobreposição, nos dois temas e em 390 px; linhas em 0.
  - Decisões: (1) "peça" = os 12 conjuntos atuais, cada um inteiro; (2) mesma câmera isométrica, com elevação subindo para cerca de 55 a 60° ao desmontar (e voltando ao montar), para ver as peças deitadas sem esconder umas às outras; (3) cada peça gira e pousa deitada, com o lado mais interessante para cima (mostrador, mecanismo); (4) nenhum botão: só o clique alterna, pushers, coroa, câmera lenta e agitar saem.
- Problema observado: na bancada as peças ficam paradas. O movimento só funciona montado.
  - Fazer: desmontado, as peças continuam vivas, cada uma na sua posição, sem precisar do conjunto montado.
  - Ponteiros: horas, minutos, segundos e cronógrafo seguem a hora real, girando em torno do próprio eixo.
  - Mostrador: os mostradores auxiliares (24 h, dia, data, reserva) e a lua seguem o aparelho.
  - Rodagem, escape e barrilete: as engrenagens giram em suas próprias posições com as razões reais, a mola do barrilete e o espiral do balanço se movem.
  - Balanço e âncora: o balanço oscila a 4 Hz e a âncora bate, cada um na sua posição na bancada.
  - Massa oscilante: gira devagar sobre o próprio eixo, em loop contínuo.
  - Engrenamento: como as peças estão separadas, os dentes não precisam se tocar, mas a velocidade de cada uma segue a razão real, para o movimento continuar verdadeiro.
  - Pronto quando: desmontado, cada peça mexe sozinha em tempo real, sem pular quando se monta ou desmonta, e sem perder o desempenho.
- Qualidade na bancada: as peças não podem perder textura nem proporção ao pousar. Hoje elas encolhem para cerca de 40% (33% a caixa) e ficam pequenas, com detalhes ilegíveis.
  - Escala: pousar o mais grande possível, perto do tamanho original (pelo menos 70 a 80%), mantendo a mesma proporção entre as peças que no relógio montado. Peças pequenas não podem ficar desproporcionais às grandes.
  - Espaço: ampliar a bancada e enquadrar a figura para caber. Se preciso, a bancada pode ser mais larga e a tela rolar ou dar zoom, mas nunca reduzir as peças para caber.
  - Textura: guilloché, ticks, algarismos, dentes, parafusos, costuras e escamas continuam nítidos e legíveis em 1× e em 4×, iguais ao montado; nada some nem vira mancha ao reduzir.
  - Proporção: altura e largura de cada peça mantêm a relação real (a escala é uniforme, sem achatar), e a pulseira e a caixa continuam proporcionais entre si.
  - Pronto quando: lado a lado com o relógio montado, cada peça na bancada tem o mesmo detalhe e a mesma proporção, e dá para ler os textos e ver os dentes sem zoom.
- Sombras na bancada: sem sombras desnecessárias. Hoje cada peça tem um disco cinza sob ela, e nas peças vazadas (lunete, caixa, platina, fundo) o disco aparece pelo furo como uma mancha.
  - Fazer: tirar os discos de sombra. Se ficar sombra, é só um contato fino e suave rente à borda da peça, no contorno real dela, nunca um círculo cheio nem sob o furo.
  - Peças vazadas mostram a madeira da bancada pelo furo, sem mancha.
  - Nada de halo ou sombra espalhada em volta da bancada, a não ser uma sombra leve no chão sob a bancada.
  - Pronto quando: na bancada não há mancha escura que não pertença a uma peça, e os furos mostram a madeira limpa, nos dois temas.
- Ponto de vista do artesão (referência: `conserto-de-relogio-bancada-800.jpg`): ao desmontar, a vista é a de quem trabalha sentado à bancada de relojoeiro, olhando as peças de cima e um pouco de frente, não um mapa de longe.
  - O que a referência mostra: bancada com tampo plano e claro, peças pequenas espalhadas à mão diante de quem trabalha, uma bandeja redonda de peças (verde) com o movimento, caixa e vidro soltos ao lado, ferramentas (pinça, lupa, chaves de fenda) em volta, e luz quente vinda de cima.
  - Câmera: elevação alta (cerca de 60 a 70°, quase de cima, mas ainda com volume), com a bancada ocupando a tela inteira e a borda de perto da pessoa embaixo. Sem a bancada flutuando no vazio com bordas distantes.
  - Composição: peças em desordem organizada, como largadas por um relojoeiro, mas sem se sobrepor, com a caixa e o movimento no centro, mais perto de quem olha, e as pequenas em volta. Uma bandeja redonda para as peças miúdas (balanço, âncora, barrilete, engrenagens, parafusos) como na referência.
  - Ambientação: acrescentar poucos objetos de bancada que contam a cena e não atrapalham: lupa de relojoeiro, pinça, chave de fenda, tapete ou papel sob as peças. Detalhes discretos, nada de decoração em excesso.
  - Luz: tom quente e luz vinda de cima, sombra leve só junto às peças (ver a regra de sombras acima).
  - Pronto quando: ao desmontar, a cena lê como uma bancada de relojoeiro vista pelo artesão, com as peças ao alcance da mão, nos dois temas.
- Manter por baixo: relógio andando com a hora real e movimento interno vivo.
- Pronto quando: a página tem apenas o relógio, e cada clique alterna entre montado e desmontado, nos dois temas.

## Decisões recentes (valem sobre o que está acima)
- Bancada abandonada: desmontar é a pilha vertical inicial. Tudo sobre bancada, sombras de bancada e peças vivas na mesa fica sem efeito.
- Expandir bem mais: as camadas sobem com grande folga (lunete cerca de 665, mostrador 545, platina 70, fundo −290) e as peças internas saem alternadas para a esquerda e a direita (minuteria, ponte do balanço, balanço, pontes, escape, rodagem, barrilete), para dar para ver cada uma sem ficar atrás do mostrador.
- A platina sobe para cima da borda da caixa, para não parecer enfiada nela. Pronto quando nenhuma peça atravessa a caixa em nenhum momento do movimento.
- Ordem de pintura ao desmontar: por altura (de baixo para cima), com a ordem original quando montado; a parede da frente da caixa nunca cobre peças que estão acima dela.
- Lunete: um anel único e inteiro, sem metades nem corte nas laterais (corrigido o degrau perto da coroa e da haste direita).
- Descartados (não fazer): movimento interno mais denso como na imagem de referência, cronógrafo ligado a controle, elevação variável, botão "Voltar à hora real" e as verificações extras (390 px, zoom 4× completo, quadros intermediários, tema escuro desmontado).

## Novos pedidos (a fazer)
### Pinos
- Acrescentar os pinos reais: o pino de mola (barra de mola) que prende cada ponta da pulseira entre as hastes, com as pontas dentro de furos nas hastes. Também pinos de fixação visíveis nas hastes e na carrure, e o pino da coroa/pushers.
- Ao desmontar, os pinos saem junto com a pulseira (ou logo antes dela) e ficam visíveis como peças pequenas.
- Pronto quando: cada ponta da pulseira mostra o pino atravessando-a e entrando nas duas hastes, sem sobrar linha solta.

### Peça de baixo atravessando outras peças
- Problema: ao desmontar, a peça de baixo (fundo com vidro, e a massa oscilante) ainda passa por dentro ou por cima de outras peças (caixa, hastes, pulseira).
- Fazer: separar mais a peça de baixo na vertical e para o lado, para ela não se sobrepor à caixa nem à pulseira na tela; conferir a ordem de pintura entre ela, a caixa, as hastes e a pulseira inferior.
- Pronto quando: em nenhum quadro do movimento, montando ou desmontando, a peça de baixo cruza outra peça.

### Pulseiras mal encaixadas
- Problema: as pulseiras não estão bem encaixadas nas hastes; ficam soltas ou desalinhadas, com vão ou sobreposição errada.
- Fazer: a ponta da pulseira entra entre as hastes, com a largura igual ao vão entre elas, alinhada ao pino e sem vão visível; a pulseira superior e a inferior simétricas em relação à caixa; o passador e o fecho alinhados com a pulseira.
- Pronto quando: montado, cada pulseira encosta nas duas hastes de forma contínua, sem espaço nem atravessar a haste, vista de cima e de lado.

- Referência do encaixe (foto de uma pulseira de couro marrom em relógio de ouro rosé): a pulseira entra entre as duas hastes e a ponta fica escondida por baixo da caixa, só a faixa de couro aparece saindo de lá.
  - A largura da pulseira na ponta é igual ao vão entre as hastes, com folga mínima (fio de luz) de cada lado; não há degrau entre haste e pulseira.
  - O topo da pulseira fica rente à parte de baixo da caixa, encostando entre as hastes, sem vão aberto por onde se veja o fundo.
  - A pulseira sai da caixa reta e depois se curva para baixo, seguindo o pulso; a superfície tem relevo (textura de couro com costuras nas bordas) e borda com espessura visível.
  - As hastes são largas e planas nas laterais, com a face interna lisa e alinhada com a borda da pulseira; o pino fica no meio, atrás da face, quase invisível.
  - Fazer: na `lug()` e na `strap()`, alinhar a borda da pulseira com a face interna das hastes (hoje há vão e a pulseira parece solta), encostar a ponta na carrure e curvar a pulseira para baixo a partir da caixa.
  - Pronto quando: na junção haste, pulseira e caixa, a pulseira parece entrar na caixa por baixo, sem vão e sem atravessar nenhuma peça.

### Proporção da pulseira (referência: foto de pulseira de couro marrom de 22 mm, vista aberta)
A foto mostra a pulseira em duas peças. Usar a largura de 22 mm como unidade (a pulseira de 166 do modelo = 22 mm; 1 mm ≈ 7,5).
- Peça longa (a de furos): comprimento cerca de 5,3 vezes a largura (cerca de 120 mm, ou 880 no modelo), reta e com leve afinamento até a ponta, que termina arredondada. Tem uma fileira de 9 furos alinhados no meio, espaçados cerca de 0,25 da largura (6 mm), começando a cerca de 0,6 do comprimento. Costura contínua pelas duas bordas, com a borda levemente mais escura.
- Peça curta (a da fivela): comprimento cerca de 3,9 vezes a largura (cerca de 85 mm, ou 640), com a fivela quadrada na ponta (altura da fivela cerca de 1,15 da largura), dois passadores (laços) de couro logo abaixo da fivela, e a mesma costura.
- Espessura: cerca de 0,13 da largura (3 a 4 mm, ou cerca de 22 no modelo), com a borda visível mais escura; hoje está bem mais fina.
- Fivela: moldura preta fosca, retangular, com o pino no meio atravessando a pulseira; os passadores ficam colados à pulseira, com um pouco de folga.
- Gravação: "Genuine Leather" na face da peça longa, em itálico pequeno ao longo da pulseira (texto próprio, sem marca).
- Etiqueta: nenhuma (não copiar a etiqueta de loja da foto).
- Fazer: ajustar `strap()` para usar essas razões (largura 166, comprimentos 880 e 640, espessura 22), com 9 furos, fivela e passadores desenhados; atualizar o enquadramento (`BOXES`) e os valores de elevação da pulseira ao desmontar.
- Aviso: com essas proporções a figura fica bem mais alta; se não couber, reduzir toda a figura de forma uniforme (nunca achatar só a pulseira).
- Pronto quando: ao lado da caixa, a pulseira tem largura, comprimento, número de furos e espessura que batem com a foto, e a fivela e os passadores parecem de pulseira real.

### Pulseiras também desmontam
- Hoje a pulseira fica parada junto da caixa ao desmontar. Ela deve se afastar do relógio como as outras peças.
- Fazer: a pulseira superior sobe e se afasta para cima e para trás, a inferior desce e se afasta para a frente, cada uma como conjunto próprio (pulseira, passador e fecho), com os pinos soltando-se antes. Elas voltam ao lugar ao montar.
- Ordem: os pinos saem primeiro, depois as pulseiras, em sequência com as outras camadas.
- Pronto quando: desmontado, as duas pulseiras ficam afastadas da caixa, sem cruzar nenhuma peça, e ao montar voltam encaixadas nas hastes.

## Decisões finais (valem sobre tudo acima)
- A animação de desmontar volta a ser a primeira: pilha vertical original (lunete 254, ponteiros 228, mostrador 204, minuteria 178, ponte do balanço 156, balanço 134, pontes 112, escape 88, rodagem 64, barrilete 40, platina 0, massa -50, fundo -96), sem peças saindo para os lados.
- Montado, o relógio mostra a pulseira fechada, em laço, curvando para baixo a partir das hastes; ao desmontar, o laço some e as duas pulseiras retas aparecem e se afastam (superior para cima e para trás, inferior para baixo e para a frente), junto com os pinos.
- A câmera aproxima do relógio montado e afasta ao desmontar, para caber as pulseiras retas.

## Pulseira fechada, sólida (referência: `48983232-xenjpi76ph20v6ogmegb5iht-ExtraLarge.webp`)
Problema: hoje o laço fechado é uma faixa fina e chapada, parecendo papel, e sem a forma de pulseira usada no pulso.
- Posição fechada: como na foto, a pulseira sai das duas hastes, fica rente à caixa por um trecho curto e se curva para baixo e para trás, em arco largo e suave, como se estivesse em volta de um pulso. A caixa fica no alto do arco, e as duas pulseiras descem para os lados dela.
- Sólida: a pulseira é um sólido de couro com espessura visível (cerca de 0,13 da largura), com face de cima, borda lateral grossa e face de baixo; a borda é mais escura que o topo, com a costura clara a poucos milímetros dela (como a costura bege da foto) e o couro com leve textura e vincos.
- Sem transparência: nada da pulseira some nem deixa ver o que está atrás; a parte de baixo da pulseira não aparece através dela.
- Encaixe: a pulseira entra entre as hastes sem vão, a ponta escondida sob a caixa; as hastes são lisas e largas nas laterais, como na foto.
- Curva: o arco usa várias secções inclinadas (pelo menos 12 por pulseira) com o sombreamento mudando de acordo com a inclinação, para a curva ler como couro dobrado, não como degraus.
- Desmontar: ao desmontar, o laço sólido se endireita e vira as duas pulseiras retas (as peças com proporção da foto de 22 mm), afastando-se do relógio.
- Pronto quando: montado, a pulseira parece de couro grosso envolvendo o pulso, com espessura, costura e curva iguais à foto, sem partes finas ou chapadas.

## Estado atual (implementado)
- Desmontar: pilha vertical original (lunete 254 ... fundo -96), clique alterna; câmera aproxima montado e afasta desmontado.
- Montado: pulseira fechada em laço, sólida, com espessura, costura e vincos, saindo por baixo da caixa entre as hastes.
- Desmontado: o laço some e aparecem as duas pulseiras retas na proporção da foto de 22 mm (longa 880 com 9 furos e ponta arredondada, curta 640 com fivela e dois passadores), que se afastam da caixa. Os pinos de mola vão presos a cada pulseira, com só as pontas aparecendo.
- Coroa e os dois pushers se separam para os lados ao desmontar (coroa para a esquerda, pushers para a direita) e saem primeiro, junto com as pulseiras.
- Lunete em anel único; platina acima da borda da caixa; ordem de pintura por altura ao desmontar.
- Fundo com vidro em ouro rosé; lua colorida; mostrador com trilha dupla e pontos; ponteiros mais finos; fivela preta.
- Em aberto: tema escuro com interior do movimento, platina e pulseiras pouco contrastados (clarear); o botão pequeno junto à base da caixa foi tratado como pusher inferior (confirmar); a curva da pulseira fechada só aparece em parte por trás da caixa.

## Estética da pulseira fechada (não aprovada)
Problema: o laço fechado atual parece uma escada ou persiana: cada secção tem contorno e linha de costura própria, formando faixas retas repetidas, sem cara de couro. A foto de referência (`48983232-xenjpi76ph20v6ogmegb5iht-ExtraLarge.webp`) mostra uma superfície lisa e contínua.
- Sem emendas visíveis: nenhuma linha entre secções; o contorno só existe nas bordas externas da pulseira, não em cada faixa.
- Superfície contínua: a curva se lê como uma única peça dobrada, com o sombreamento mudando de forma suave (gradiente) ao longo do arco, não em degraus de tons.
- Couro de verdade: topo com leve variação de tom, brilho fosco mais claro nas partes que pegam luz, vincos finos e curtos e irregulares perto da dobra, e borda lateral arredondada e escura.
- Costura: uma única linha contínua de pontos bege (como na foto), recuada da borda, seguindo a curva; sem pontos duplicados nem linhas retas cruzando a largura.
- Cor e contraste: marrom caramelo como na foto, claro o bastante para ler nos dois temas; no tema escuro o couro não pode sumir no fundo.
- Pronto quando: montado, a pulseira parece um único pedaço de couro grosso curvando para baixo, sem listras, e é parecida com a da foto.

## Fivela e passadores muito retangulares (não aprovado)
Problema: a fivela e os passadores são caixas retas de cantos vivos; parecem blocos, não peças de couro e metal.
- Fivela: moldura com cantos arredondados (raio generoso nos quatro cantos), barras com seção levemente arredondada e não quadrada, e uma curva suave na barra onde a pulseira dobra; o pino tem ponta afinada e curva, e apoio na barra, como numa fivela de pulseira de couro (a da foto de 22 mm tem cantos arredondados).
- Passadores: laços de couro finos e estreitos, com cantos arredondados e bordas biseladas, levemente abaulados no meio e mais baixos que os de hoje; folga pequena sob eles para a pulseira passar, em vez de blocos sólidos largos.
- Pulseira: as pontas e os cantos também sem ângulo reto: ponta da peça curta com os cantos arredondados, e a transição para a fivela dobrada em curva.
- Pronto quando: fivela e passadores parecem peças reais, sem cantos vivos nem aspecto de caixa, nos dois temas.

## Desmontar mais alto (para ver o interior)
Problema: a pilha atual (lunete 254, ponteiros 228, mostrador 204, minuteria 178, ponte do balanço 156, balanço 134, pontes 112, escape 88, rodagem 64, barrilete 40, platina 0) é baixa demais; as camadas ainda se tapam e não dá para ver as peças internas.
- Fazer: aumentar bem a altura de cada camada, com folga uniforme e grande entre elas (por exemplo cerca de 120 a 150 entre cada uma, lunete passando de 700), mantendo a ordem de cima para baixo e o mesmo clique alternando.
- A platina, o barrilete, a rodagem, o escape, o balanço e as pontes precisam aparecer inteiros, sem o mostrador ou a lunete cobrindo, e sem a parede da caixa cortando.
- Sem zigue-zague: as camadas continuam em pilha vertical; a separação é só em altura (a decisão de voltar à animação original vale).
- A câmera continua afastando ao desmontar para a pilha mais alta caber, e a figura pode ficar mais alta.
- Pronto quando: desmontado, dá para distinguir cada camada interna, uma acima da outra, sem uma tapar a seguinte.

## Movimento interno completo (referência: `Watch_Mechanism_1000_0011.jpg`) — reativado
O descarte anterior do movimento denso fica sem efeito: o interior deve ter todos os componentes da referência, vistos desmontados na pilha.
Componentes da referência que devem existir como peças:
1. Platina redonda cheia (não vazada), com borda grossa lateral e furos.
2. Ponte grande do cronógrafo em forma de gancho/ave, curva e orgânica, cobrindo o alto do movimento, com 3 a 4 parafusos de fenda grandes.
3. Ponte em forma de coração (central, com gravações "P3133", "23 JEWELS" e um número de série), assentada sobre a rodagem, com parafuso de fenda.
4. Ponte lateral em formato de pá/folha, embaixo à direita, com os símbolos "+" e "−" e dois parafusos, cobrindo a mola.
5. Roda de coluna / came do cronógrafo e martelo, com alavancas finas curvas (alavanca de reinício, alavanca de freio) em volta, algumas com parafusos de pivô.
6. Engrenagens de vários tamanhos: duas grandes com dentes finos (esquerda e direita), uma central média, roda de escape pequena e rodas do cronógrafo, algumas com raios vazados e outras sólidas, parcialmente cobertas pelas pontes.
7. Barrilete com a mola principal visível por uma janela embaixo à esquerda, com a espiral e o eixo central.
8. Balanço com mola espiral sob uma ponte aberta, no centro, com a raquete.
9. Cerca de 20 a 30 parafusos de fenda de dois tamanhos e furos de rubi, em todas as pontes.
10. Haste de corda com coroa canelada saindo pela lateral direita do movimento, com o encaixe do eixo visível.
11. Alavancas laterais (embreagem, lingueta) na borda direita, com recorte e parafuso.
12. Gravações em texto próprio, sem marca de terceiros (usar "ANATOMY", "17 RUBIS", "+" e "−").
Regras:
- Os dentes e o engrenamento seguem os números reais; as rodas novas do cronógrafo também engrenam de verdade.
- Todo parafuso assenta numa ponte; toda linha termina sobre algo (checagem de linhas em 0, nos dois temas).
- A ordem de pintura entre as camadas e o desempenho continuam corretos.
- O interior fica legível no tema escuro (clarear os tons do movimento).
- Pronto quando: desmontado, o movimento mostra cada um desses componentes, na densidade da referência, sem peças atravessadas.

## Cor: seguir o padrão do `transformador.html` (valida sobre todas as cores acima)
O transformador usa a paleta neutra do kit, sem cores quentes. O relógio deve adotar o mesmo estilo e as mesmas variáveis.
- Base neutra: nada de ouro rosé, marrom, creme nem madeira. Todas as peças usam só a escala de cinza do kit, nos dois temas:
  - Escuro: página `#0b0b0b`, cartão `#131313`, face `#1b1b1b`, tons laterais `#0f0f0f` a `#181818`, linhas `hi #d4d4d4`, `mid #6a6a6a`, `lo #3e3e3e`, `faint #2a2a2a`, destaque `lit #ffffff`.
  - Claro: página `#f2f2ef`, cartão `#fbfbfa`, face `#ffffff`, tons laterais `#dcdcd9` a `#ededea`, linhas `hi #26262a`, `mid #8a8a8f`, `lo #b4b4b8`, `faint #d4d4d6`, destaque `lit #000000`.
- Hierarquia de tons: base e pés em `lo`, estrutura em `mid`, a peça principal em `hi`, e uma única peça em destaque `lit` (a que o leitor deve olhar, como o cronógrafo ou o balanço).
- Acentos só quando a cor é a informação, e só os do kit: vermelho `#e5484d`/`#ff6b6b` (reserva baixa, ponteiro do cronógrafo, rubis), verde `#30a46c`/`#6be0a0` e azul `#3e63dd`/`#6b9bff` com moderação. Rubis em vermelho do kit; lua com azul do kit, sem laranja.
- Pulseira, fivela, caixa, lunete, mostrador e movimento: tudo na escala de cinza, diferenciado por tom (por exemplo pulseira em `mid`, caixa em `hi`, mostrador em face clara), não por matiz.
- Remover as classes de cor própria do relógio (`.gold`, `.cream`, `.strap`, `.buckle`, `.tray`, `.paper`, `.bench`) e usar as variáveis `--anatomy-*` do tema.
- Pronto quando: ao lado do `transformador.html`, o relógio parece da mesma família visual, nos dois temas, e o interior fica legível no escuro.

## Respostas às dúvidas (decididas)
- Camadas do movimento: cerca de 15, cada uma subindo separada na pilha: platina, barrilete, rodagem, escape, cronógrafo (came, martelo, alavancas), pontes (gancho, coração, pá), balanço e sua ponte, além das camadas de cima (lunete, ponteiros, mostrador, minuteria) e de baixo (rotor, fundo).
- Altura: a página pode rolar na vertical; as peças mantêm o tamanho e a figura cresce ao desmontar.
- O botão pequeno junto à base da caixa é o pusher inferior; já se separa com o superior. Nada a fazer.

## Ajuste feito
- A coroa agora se separa para a direita (3 horas), e não para a esquerda, junto com os pushers.

## Não mudar
- Números de dentes, frequência, tempo de reserva.
- Layout geral do mostrador (24 h no alto, reserva à esquerda, semana à direita, data e lua embaixo).
- Nada publicado online; nenhum comando git.

## Verificação
1. Rodar `node build-grande.mjs` e `node build-grande.mjs --light`.
2. `scripts/lines.mjs` nos dois HTML: `line ends: 0`.
3. Sem erros no console.

## Entrega
- Dizer quais itens foram feitos, quais ficaram de fora e por quê.
- Não commitar; deixar os arquivos no diretório para eu revisar.
