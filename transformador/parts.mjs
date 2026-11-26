import { RATED } from "./model.mjs";

export const D = {
  WALL: 5,
  Z_BASE: 38,
  Z_FLOOR: 44,
  Z_WALL: 248,
  Z_LID: 262,
  TX0: -54,
  TX1: 146,
  TY0: -150,
  TY1: 270,
  OIL_Z: 242,
  CORE_X: 46,
  CORE_Y: [-35, 60, 155],
  YOKE_LOW: 62,
  YOKE_HIGH: 228,
  MM: 12,
};

export const HV = [
  { base: [111, -67], phi: -45 },
  { base: [101, 43], phi: 0 },
  { base: [112, 142], phi: 38 },
];
export const LV = [[-17, -21], [-20, 32], [-15, 84], [-15, 148]];
export const HV_LIFT = 255;
export const HV_TILT = (16 * Math.PI) / 180;
export const hvAxis = (phi) => {
  const p = (phi * Math.PI) / 180;
  return [Math.sin(HV_TILT) * Math.cos(p), Math.sin(HV_TILT) * Math.sin(p), Math.cos(HV_TILT)];
};

export const CONS = { x0: -45, len: 192, y: -208, z: 392, r: 32 };
export const RAD = { y0: -98, pitch: 47.3, count: 8, thick: 36, z0: 76, z1: 252, depth: 64 };
export const RAD_R_X = 160;
export const RAD_L_X = -130;
export const CAB = { x: 19, y: 270, w: 97, d: 22, z0: 87, z1: 191 };

export const SYSTEMS = [
  { id: "ativa", n: 1, name: "Parte ativa", short: "Parte ativa", rank: 3 },
  { id: "contencao", n: 2, name: "Contenção e isolação", short: "Contenção", rank: 2 },
  { id: "terminais", n: 3, name: "Passagem de terminais", short: "Terminais", rank: 0 },
  { id: "refrig", n: 4, name: "Refrigeração", short: "Refrigeração", rank: 4 },
  { id: "protecao", n: 5, name: "Proteção e comando", short: "Proteção", rank: 1 },
];

const fmt = (v, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
const MVA = fmt(RATED.S / 1e6, 0);
const KVP = fmt(RATED.Vp / 1e3, 0);
const KVS = fmt(RATED.Vs / 1e3, 1);

const M = {
  tampa: [0, 0, 200],
  ativa: [0, 0, 140],
  radA: [125, 0, 0],
  radB: [-125, 0, 0],
  fanA: [215, 0, -22],
  cons: [0, -80, 70],
  arm: [0, 100, 0],
  bt: [0, 0, 235],
  none: [0, 0, 0],
};
const mulv = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const hvMove = (i) => mulv(hvAxis(HV[i].phi), HV_LIFT);

const P = (id, sys, name, does, nominal, qty, move, anchor, cota) => ({ id, sys, name, does, nominal, qty, move, anchor, cota });

export const PARTS = [
  P("pernas", "ativa", "Pernas do núcleo", "Colunas de chapas de aço-silício laminadas e empilhadas em degraus, para aproximar a seção de um círculo. Guiam o fluxo magnético por dentro das bobinas.", `Aço-silício · B = ${fmt(RATED.B)} T`, 3, M.ativa, [46, -35, 84], null),
  P("jugos", "ativa", "Jugos e grampos", "Fecham o circuito magnético por cima e por baixo das pernas. Os grampos de aço comprimem as chapas para o núcleo não vibrar.", `3 pernas · perdas em vazio ${fmt(RATED.P0 / 1e3, 0)} kW`, 2, M.ativa, [46, 60, 228], ["y", -54, 174, 72, 62]),
  P("bt", "ativa", "Enrolamentos de baixa tensão", "Bobinas internas, mais perto da perna: poucas espiras de condutor grosso. Entregam a tensão já reduzida para a rede de distribuição.", `${KVS} kV · ${RATED.Ns} espiras por fase`, 3, M.ativa, [46, -35, 200], null),
  P("at", "ativa", "Enrolamentos de alta tensão", "Bobinas externas, em discos empilhados: muitas espiras de condutor fino. Recebem a tensão da rede e criam o fluxo no núcleo.", `${KVP} kV · ${RATED.Np} espiras por fase`, 3, M.ativa, [84, -35, 160], ["z", 88, 202, 84, -73]),
  P("cilindros", "ativa", "Cilindros isolantes", "Cilindros de papelão prensado entre a perna e a BT e entre a BT e a AT. Isolam e deixam canais por onde o óleo circula e leva o calor.", "Papelão prensado", 6, M.ativa, [75, 60, 150], null),
  P("calcos", "ativa", "Calços e anéis de pressão", "Blocos sob o jugo apoiam a parte ativa no fundo da cuba; anéis no topo das bobinas as comprimem contra os esforços de um curto-circuito.", "Madeira laminada e aço", 9, M.ativa, [46, -35, 44], null),
  P("comutador", "ativa", "Comutador de taps", "Muda a relação de espiras da alta tensão em passos, sem carga, para ajustar a tensão de saída. Um eixo de comando sobe até a tampa.", `${RATED.taps} posições · passo ${fmt(RATED.tapStep * 100, 2)} %`, 1, M.ativa, [46, 232, 170], null),
  P("ligacoes", "ativa", "Ligações das bobinas", "Barras de cobre que levam a corrente das pontas das bobinas até a base de cada bucha, sem encostar na tampa nem no núcleo.", "Cobre eletrolítico", 7, M.ativa, [95, 60, 236], null),

  P("cuba", "contencao", "Cuba", "Caixa de aço soldada que guarda a parte ativa e o óleo. As nervuras externas evitam que as paredes deformem com o vácuo e a pressão.", "Aço-carbono · ≈ 5 m × 2,4 m", 1, M.none, [146, 60, 150], ["y", -150, 270, 146, 44]),
  P("base", "contencao", "Base", "Perfis de aço soldados sob a cuba. Apoiam o peso do transformador no fundamento e deixam o ar passar por baixo.", "Perfis em U", 1, M.none, [-55, 60, 20], ["z", 0, 38, -62, 60]),
  P("tampa", "contencao", "Tampa", "Fecha a cuba com juntas aparafusadas. Sustenta as buchas e o conservador e é retirada para içar a parte ativa.", "Chapa de aço", 1, M.tampa, [50, 60, 262], ["y", -154, 278, 158, 262]),
  P("tampoes", "contencao", "Tampas de inspeção", "Tampões aparafusados sobre aberturas na tampa, por onde uma pessoa chega ao interior sem retirar a tampa.", "Aberturas redondas", 2, M.tampa, [0, -90, 268], null),
  P("olhais", "contencao", "Olhais de içamento", "Orelhas de aço soldadas nos cantos da tampa. É nelas que o guindaste prende os cabos para levantá-la.", "4 pontos de içamento", 4, M.tampa, [-48, -144, 272], null),
  P("corrimao", "contencao", "Corrimão e suportes", "Estrutura de tubos sobre a tampa que protege quem sobe para inspecionar as buchas. Liga-se à escada por um dos lados.", "Tubo de aço", 1, M.tampa, [43, 60, 342], null),
  P("oleo", "contencao", "Óleo isolante", "Óleo mineral que enche a cuba: isola as bobinas, leva o calor até as paredes e aos radiadores e dilata no conservador.", `Elevação máxima ${fmt(RATED.rise, 0)} K`, 1, M.none, [46, 130, 140], null),
  P("dreno", "contencao", "Válvula de drenagem", "Válvula na base da cuba, por onde o óleo é retirado para manutenção ou coletado para análise.", "Registro de gaveta", 1, M.none, [100, 272, 70], null),

  P("buchaA", "terminais", "Bucha AT, fase 1", "Isolador de porcelana por onde a alta tensão da rede atravessa a tampa sem tocar o aço. As saias aumentam o caminho da corrente pela superfície.", `${KVP} kV`, 1, hvMove(0), [111, -67, 330], null),
  P("buchaB", "terminais", "Bucha AT, fase 2", "Mesma função, na fase do meio. Fica na vertical; as outras duas saem inclinadas para afastar as fases.", `${KVP} kV`, 1, hvMove(1), [101, 43, 330], null),
  P("buchaC", "terminais", "Bucha AT, fase 3", "Mesma função, na terceira fase. A inclinação de uma bucha para a outra mantém a distância no ar entre as fases.", `${KVP} kV`, 1, hvMove(2), [112, 142, 330], ["z", 262, 400, 112, 142]),
  P("buchaBT", "terminais", "Buchas de baixa tensão", "Fazem o mesmo no lado de baixa tensão. São menores porque a tensão é menor: três fases e o neutro.", `${KVS} kV · X0 a X3`, 4, M.bt, [-17, -21, 330], null),
  P("flanges", "terminais", "Torres e flanges das buchas", "Pescoços de aço soldados na tampa que recebem a base de cada bucha e a prendem com parafusos.", "7 flanges", 7, M.tampa, [111, -67, 300], null),

  P("radA", "refrig", "Radiadores, lado direito", "Painéis de chapa por onde o óleo quente desce e se resfria. Cada painel tem um coletor em cima e outro embaixo.", `8 painéis · ${fmt(RATED.S / 1e6, 0)} MVA ONAF`, 8, M.radA, [192, 0, 150], ["z", 70, 255, 148, 260]),
  P("radB", "refrig", "Radiadores, lado esquerdo", "Segundo banco de painéis, ligado ao outro lado da cuba. Os dois bancos juntos definem quanto calor o transformador dissipa.", "8 painéis", 8, M.radB, [-98, 0, 150], ["z", 70, 255, -132, 260]),
  P("ventiladores", "refrig", "Ventiladores", "Sopram ar pelos painéis quando o óleo passa do limite. Entram acima de 75 °C e só saem abaixo de 65 °C, para não ligar e desligar o tempo todo.", `Liga ${RATED.onAt} °C · desliga ${RATED.offAt} °C`, 8, M.fanA, [192, -67.5, 62], null),

  P("conservador", "protecao", "Conservador de óleo", "Reservatório de expansão: recebe o óleo quando ele esquenta e dilata. Tem um indicador de nível numa das tampas.", "Tanque cilíndrico", 1, M.cons, [30, CONS.y, CONS.z + CONS.r], ["x", -45, 147, -208, 424]),
  P("suportes", "protecao", "Suportes do conservador", "Escoras de aço inclinadas que apoiam o conservador sobre a tampa, longe das buchas.", "2 suportes", 2, M.cons, [-35, -170, 330], null),
  P("buchholz", "protecao", "Relé Buchholz", "Fica no tubo entre a cuba e o conservador. Se uma falha interna gera gás ou o óleo corre depressa, ele dispara o alarme e desliga o transformador.", "Alarme e desligamento", 1, M.cons, [-20, -150, 310], null),
  P("tubo", "protecao", "Tubo de ligação", "Tubo inclinado que leva o óleo entre a cuba e o conservador. O relé Buchholz é instalado no meio dele.", "Tubo de aço", 1, M.cons, [-20, -150, 310], null),
  P("respirador", "protecao", "Respirador de sílica-gel", "Filtro por onde o conservador respira. A sílica-gel retém a umidade do ar para ela não chegar ao óleo.", "Sílica-gel", 1, M.cons, [130, -245, 380], null),
  P("termometro", "protecao", "Termômetro do óleo", "Mostra a temperatura do óleo no topo da cuba e liga os ventiladores quando ela passa do limite.", `Alarme ${RATED.onAt} °C`, 1, M.none, [80, 272, 170], null),
  P("armario", "protecao", "Armário de comando", "Armário com o controle dos ventiladores, os bornes dos sensores e as proteções. Tem porta com trinco e aberturas de ventilação.", "Ventiladores · alarmes", 1, M.arm, [67, 292, 140], ["z", 87, 191, 19, 292]),
  P("eletrodutos", "protecao", "Eletrodutos", "Tubos de aço que levam os cabos de comando da cuba até o armário, protegendo-os do tempo.", "Tubo de aço", 2, M.none, [34, 280, 20], null),
  P("escada", "protecao", "Escada de acesso", "Escada fixa na lateral do armário e da cuba para chegar à tampa e ao corrimão.", "Degraus de aço", 1, M.arm, [-28, 276, 150], null),
];

PARTS.forEach((p, i) => (p.n = i + 1));
const rank = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.rank]));
PARTS.forEach((p) => (p.rank = rank[p.sys]));
export const partById = Object.fromEntries(PARTS.map((p) => [p.id, p]));

export const BOM_ORDER = SYSTEMS.map((s) => ({ ...s, parts: PARTS.filter((p) => p.sys === s.id) }));
BOM_ORDER.forEach((s) => (s.parts = s.parts));
let n = 0;
for (const s of BOM_ORDER) for (const p of s.parts) p.n = ++n;

export const STAMP = {
  title: `Transformador de potência ${MVA} MVA`,
  rows: [
    ["Tensões", `${KVP} / ${KVS} kV`],
    ["Frequência", `${RATED.Hz} Hz`],
    ["Ligação", "Triângulo / estrela (Dyn)"],
    ["Refrigeração", "ONAN / ONAF"],
    ["Taps", `${RATED.taps} posições, ±${fmt(((RATED.taps - 1) / 2) * RATED.tapStep * 100, 1)} %`],
    ["Perdas", `${fmt(RATED.P0 / 1e3, 0)} kW vazio · ${fmt(RATED.Pk / 1e3, 0)} kW carga`],
  ],
  scale: "Dimensões aproximadas, em metros",
  rev: "Rev. A",
  project: "Anatomia do transformador",
};
