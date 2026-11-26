# Spec: transformador em prancha

Vocabulário em [../GLOSSARY.md](../GLOSSARY.md): **Peça**, **Sistema**, **Estágio**, **Prancha**, **Balão**, **Lista de materiais**, **Carimbo**.

## Objetivo

Substituir `transformador.html` e `transformador-desmontavel.html` por uma figura única de transformador de potência a óleo (25 MVA, 69/13,8 kV), didática, o mais próxima possível de um projeto real. Público: estudante e curioso. A precisão que importa é a de proporções e nomenclatura (ABNT/IEEE), não a de dimensões de fabricação.

## Fontes de verdade

- Forma: `transformador-tfmp.glb` como referência visual. Não precisa copiar a quantidade de peças.
- Números elétricos e nominais: `transformador/model.mjs`.
- Estilo e comportamento de estágios: `relogio/build-grande.mjs` (relógio grande).

## Estágios

1. **Montado**: isométrico sólido, mais detalhado que o atual.
2. **Desmontado**: sequência por **Sistema**. Ordem proposta: terminais e proteção, contenção (tampa), parte ativa sobe para fora da cuba, refrigeração por último. Dentro de cada Sistema as Peças saem juntas.
3. **Prancha**: Peças espalhadas, uma ao lado da outra, em estilo de projeto técnico (linhas finas, papel técnico), com Balões, cotas principais, vistas ortogonais, Lista de materiais e Carimbo. Painel de informação escondido.

Ângulo isométrico fixo; sem rotação livre. Botão cicla os três estágios (Desmontar, Desmontar mais, Montar), como no relógio grande.

## Sistemas

1. Parte ativa: núcleo, bobinas AT/BT, comutador de taps.
2. Contenção e isolação: cuba, tampa, óleo.
3. Passagem de terminais: buchas AT e BT.
4. Refrigeração: radiadores, ventiladores.
5. Proteção e comando: conservador, relé Buchholz, termômetro (OTI), armário de comando.

## Detalhe da parte ativa

- Núcleo de três pernas com lâminas em degraus (seção em cruz) e grampos de aperto.
- Enrolamentos concêntricos: BT por dentro, AT por fora, cilindro isolante e canais de óleo entre eles.
- Calços de apoio e anéis de pressão no topo e na base.
- Comutador sem carga com os 9 taps e ligações até a bobina AT.
- Saídas das bobinas até as buchas.

Nada além disso. A contagem total de Peças fica entre 30 e 40.

## Lista de materiais

Uma linha por Peça, agrupada por Sistema: número, nome, função em uma linha e dado nominal quando houver (ex.: "Bucha AT, 69 kV"). Todas as Peças aparecem na Prancha com Balão.

## Prancha

- Centro e esquerda: isométrico espalhado. Cada Sistema forma um cacho de Peças, em fila na ordem de desmontagem.
- Direita: quatro vistas ortogonais em grade 2×2 (frontal, lateral, planta, corte A-A da cuba mostrando óleo, parte ativa e radiadores).
- Lista de materiais em faixa à direita ou abaixo.
- Carimbo no canto inferior direito: título "Transformador de potência 25 MVA", dados nominais (69/13,8 kV, 60 Hz, ligação, refrigeração ONAN/ONAF), escala gráfica, "Rev. A", nome do projeto. Sem nome de empresa nem número de desenho. Dados vindos de `model.mjs`.
- Largura de celular: coluna única (isométrico, vistas, lista).

## Interação

- Hover e clique numa Peça: descrição e destaque.
- Clicar na Peça ou na linha da lista destaca as duas, mais o Balão e a vista ortogonal correspondente.
- Liga/desliga por Sistema (ex.: esconder a cuba para ver a parte ativa).
- Setas do teclado escolhem um Sistema; Espaço avança o estágio; Escape limpa a seleção.
- Corte da cuba mostrando óleo e enrolamentos.
- Mantidos: controle de carga e tap, temperatura do óleo, ventiladores com histerese (`fansWanted`).

## Entrega

- HTML único gerado por `transformador/build.mjs`, em claro (`--light`) e escuro, no padrão do kit isométrico.
- Substitui os dois HTMLs atuais; `build-desmontavel.mjs` e os dois arquivos desmontáveis deixam de ser necessários.

## Critério de pronto

1. Os três estágios funcionam em claro e escuro.
2. `lines.mjs` reporta `line ends: 0`.
3. `audit.mjs` passa, sem peças atravessando outras.
4. Toda Peça da lista aparece na Prancha com Balão; clicar na Peça ou na linha destaca as duas.
5. Captura de cada estágio conferida a olho, nos dois temas e em largura de celular.
6. Nada é commitado; alterações ficam no diretório para revisão.

## Fenômenos

Mostrar o que acontece por dentro em operação: fluxo magnético, corrente, circulação do óleo, temperaturas, dilatação do óleo e gás. Vocabulário no glossário (**Fluxo magnético**, **Corrente**, **Circulação do óleo**, **Topo do óleo**, **Ponto quente**, **Sobrecarga**).

### Onde aparece

Só no estágio montado e no corte. Desmontado e prancha ficam estáticos.

### Modelo (`model.mjs`, fonte única, aproximado)

- Topo do óleo: o modelo atual (regime + atraso de primeira ordem; ONAN/ONAF).
- Ponto quente: topo do óleo + gradiente × carga^1,6 (estilo IEC 60076-7), cerca de 111 °C a 100 % de carga.
- Nível do conservador (%): proporcional à temperatura média do óleo.
- Respiração: entra ar quando o nível cai, sai quando sobe, parado quando estável.
- Gás: com o ponto quente acima de 140 °C, acumula no Buchholz numa taxa proporcional ao excesso. Acima do limite de volume: alarme do Buchholz.
- Desligamento térmico: ponto quente acima de 150 °C desliga o transformador.
- Tempo acelerado (cerca de 7 s de figura para a constante térmica), com relógio de simulação em horas no painel.

### Desenho (SVG animado, sem WebGL)

- Fluxo magnético: linhas tracejadas animadas sobre pernas e jugos, só no corte; intensidade pela indução e pela fase de cada perna. Some com o transformador desligado.
- Corrente: pulso de brilho nos bornes das buchas AT e BT no montado e pelas barras de ligação até as bobinas no corte; mais rápido com mais corrente, mais forte na BT (cerca de 5×).
- Circulação do óleo: no montado, linhas animadas nos coletores (quente entra em cima, frio sai embaixo) e descendo pela face dos painéis; no corte, setas subindo pelos canais das bobinas e descendo pelas paredes. Velocidade cresce com a temperatura e com os ventiladores.
- Cor: escala azul (frio) → vermelho (quente) só no óleo, nas bobinas e no termômetro. O resto mantém a paleta atual.
- Gás: bolhas subindo da bobina até a tampa e pelo tubo até o Buchholz; o Buchholz mostra o volume acumulado.

### Controles e leituras

- Carga de 5 a 150 %, com a faixa acima de 100 % marcada como sobrecarga.
- Falha só como consequência da carga: não há botão de falha.
- Painel ganha: ponto quente, nível do conservador, respiração e estado do Buchholz (normal, gás acumulado, alarme, desligado), além de "tempo acelerado" e o relógio de simulação.
- Canto da figura: tensão de saída, topo do óleo e ponto quente.

### Desligamento e rearme

- Desligado: corrente zero, fluxo some, óleo esfria aos poucos, ventiladores param abaixo de 65 °C, gás continua no Buchholz.
- Botão "Rearmar" aparece desligado e só fica ativo com o ponto quente abaixo de 110 °C. Rearmar drena o gás, apaga o alarme e reenergiza com carga em 100 %.

### Critério de pronto

1. Cada fenômeno aparece no montado e no corte e some no desmontado e na prancha.
2. Subir a carga acima de cerca de 130 % leva a gás, alarme e, se mantida, desligamento; o rearme só funciona abaixo de 110 °C.
3. `lines.mjs` em 0 nos dois temas, nos poses montado e corte, com e sem animação.
4. Movimento reduzido: um quadro parado, leituras corretas.
5. Nada é commitado.

## Notas da implementação

- Retiradas a pedido: as linhas tracejadas animadas (corrente, fluxo magnético, circulação do óleo, respiração) e as bolhas de gás. Ficam as cores de temperatura no óleo, nas bobinas e no termômetro, o visor de nível do conservador, os ventiladores girando e as leituras do painel; a falha (gás, alarme, desligamento, rearme) segue só no modelo e no painel.

- A lista de materiais foi retirada da página a pedido. Os Balões continuam numerados; apontar ou clicar num Balão ou numa Peça mostra número, nome, função, dado nominal e quantidade na linha de informação. Na Prancha, as vistas ortogonais e o carimbo ocupam a largura toda abaixo do desenho.

- Fenômenos: a 130 % de carga o ponto quente passa de 140 °C, aparece gás e o Buchholz dá alarme sem desligar; a 150 % o alarme vem e, segundos depois, o desligamento térmico. Escala de cor é uma mistura direta azul → vermelho (sem passar por verde).
- O tour automático não volta sozinho enquanto a carga estiver acima de 100 % ou o transformador estiver desligado.

- 33 Peças (dentro dos 30 a 40 previstos). Peças repetidas (4 buchas BT, 3 ventiladores, 4 olhais etc.) aparecem uma vez na Prancha, com a quantidade na lista.
- Na Prancha, o isométrico espalhado ocupa a largura toda; a lista e as vistas ortogonais com o carimbo ficam logo abaixo, lado a lado. Em celular, o isométrico rola na horizontal e o resto vira coluna única.
- Teclado: Espaço avança o estágio, ←/→ escolhem o Sistema, ↑/↓ mudam a carga, Escape limpa a seleção.
- Corte: tira as paredes próximas da cuba e deixa tampa e radiadores do lado direito a 10 % de opacidade.
- Não portado da figura montada anterior: as linhas de fluxo no núcleo, o fluxo de óleo nos coletores e o LED dos ventiladores.
- Verificado: `lines.mjs` em 0 nos quatro poses (montado, corte, desmontado, prancha), nos dois temas. `audit.mjs` não foi usado, porque a cena não usa o gravador de peças.

## Processo

Esta spec é a fonte das decisões. O código só muda quando for pedido para implementar.
