// GERADO a partir de `painel-paraopeba.html` (`docs/PLANO-INGESTAO-PARAOPEBA.md`
// mede a estrutura da fonte). Dado histórico/institucional — não recalculado
// pelo portal, atualiza por commit quando a fonte mudar.
//
// `MILESTONES` do painel — os marcos do processo de reparação, do rompimento
// (25/01/2019) à confirmação do pagamento de agosto/2026.
//
// ═══ 15/08/2026: OS 6 MARCOS ANTERIORES A 2025, VINDOS DE `EDU_TIMELINE` ═══
//
// Até aqui esta lista começava em 14/03/2025, na ACP. Um acervo sobre a
// reparação de Brumadinho que não continha o ROMPIMENTO tinha um buraco no
// meio: quem abria a linha do tempo via o processo começar pela ação judicial
// contra o corte do auxílio, sem o fato que originou tudo.
//
// A fonte é a `EDU_TIMELINE` do painel-fonte (16 itens), estrutura DIFERENTE da
// `MILESTONES` — as duas convivem no mesmo arquivo do painel. A fusão foi item
// a item, e não por script, porque o painel em disco é MAIS VELHO que o portal:
// dos 16 itens dele, 10 já existiam aqui com dado melhor. O painel traz
// "Mai/2026 · STF analisa — decisão pendente" e o portal já registra os eventos
// de junho e julho; o painel junta num item só o que o portal separa em 07/05
// (AGU defende o NAE) e 14/05 (divergência dentro da AGU). Importar por cima
// teria rebaixado esses dez. Entraram só os 6 que faltavam, todos pré-2025.
//
// ═══ PRECISÃO DE DATA: `YYYY-MM` É PROPOSITAL, NÃO DADO PELA METADE ═══
//
// Três dos seis marcos novos vêm do painel com mês, sem dia ("Jan/2020",
// "Nov/2021", "Nov/2024"). Gravar `2020-01-01` para caber no formato daria a
// um dia inventado a mesma cara de fato que 25/01/2019 tem. Por isso `data`
// aceita as duas formas, e `formatarDataMarco` imprime "janeiro de 2020" em
// vez de uma data cheia. Ordenar segue funcionando: "2020-01" < "2020-01-15"
// na comparação de string, então mês sem dia cai no começo do próprio mês.
//
// Um quarto foi PROMOVIDO a dia, com fonte: o Termo de Compromisso da DPMG,
// que o painel data como "Abr/2019", é de 05/04/2019 segundo o item `d01` de
// `clipping-ij.ts` ("Em 5 de abril de 2019, a DPMG celebrou com a Vale o Termo
// de Compromisso"), que traz link para a matéria. Data melhor, com origem
// dentro do próprio portal — não é chute nosso.

export interface MarcoParaopeba {
  /**
   * `YYYY-MM-DD` quando o dia é conhecido, `YYYY-MM` quando a fonte só dá o
   * mês. Nunca preencher o dia para "completar o formato" — ver o cabeçalho.
   * Renderizar SEMPRE por `formatarDataMarco`, nunca por `formatDateBR`, que
   * devolve "—" para o formato de mês.
   */
  data: string;
  titulo: string;
  descricao: string;
  /** Cor do painel-fonte — verde (favorável aos atingidos), vermelho
   *  (desfavorável) ou azul (neutro/procedimental). Mantida como veio: é
   *  leitura editorial de quem montou o painel, não recalculada aqui. */
  cor: string;
}

/**
 * Leitura editorial de uma cor do painel-fonte, em três tipos:
 * `favoravel` (verde — favorável aos atingidos), `desfavoravel` (vermelho)
 * e `neutro` (azul e demais — procedimental/neutro). A régua vive aqui, num
 * lugar só, para o filtro e o gráfico da página nunca discordarem da
 * legenda. Cor é o veio original do painel; o tipo é só a régua que agrupa
 * o veio para quem precisa de uma contagem (cartões, gráfico, CSV).
 */
export type TipoMarco = "favoravel" | "desfavoravel" | "neutro";

const CORE_FAVORAVEL = new Set(["#2D6A4F", "#3A6B10"]);
const CORE_DESFAVORAVEL = new Set(["#9B1C1C"]);

export function tipoDeMarco(cor: string): TipoMarco {
  const normalizada = cor.trim().toUpperCase();
  if (CORE_FAVORAVEL.has(normalizada)) return "favoravel";
  if (CORE_DESFAVORAVEL.has(normalizada)) return "desfavoravel";
  return "neutro";
}

export const ROTULO_TIPO_MARCO: Record<TipoMarco, string> = {
  favoravel: "Favorável aos atingidos",
  desfavoravel: "Desfavorável aos atingidos",
  neutro: "Neutro / procedimental",
};

const MES_POR_EXTENSO = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * Escreve a data do marco respeitando a precisão que a fonte tinha.
 *
 * `2019-01-25` vira "25/01/2019"; `2020-01` vira "janeiro de 2020". A
 * diferença de forma é o próprio aviso: quem lê por extenso entende que ali
 * não há dia, sem precisar de nota de rodapé.
 */
export function formatarDataMarco(data: string): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`;
  const mes = /^(\d{4})-(\d{2})$/.exec(data);
  if (mes) return `${MES_POR_EXTENSO[Number(mes[2]) - 1]} de ${mes[1]}`;
  return "—";
}

export const MARCOS_PARAOPEBA: MarcoParaopeba[] = [
  // ── Os 6 de `EDU_TIMELINE`, anteriores a 2025 (ver cabeçalho). Título,
  //    descrição e cor vêm palavra por palavra do painel-fonte: o texto é de
  //    quem o montou, não do Controle Popular.
  {
    "data": "2019-01-25",
    "titulo": "Rompimento da barragem B1",
    "descricao": "A barragem B1 da Mina Córrego do Feijão, em Brumadinho/MG, rompe às 12h28. A lama de rejeitos desce pelo vale, destrói o refeitório da Vale e percorre cerca de 9km pelo ribeirão Ferro-Carvão até o Rio Paraopeba. São 272 vidas perdidas — a maioria funcionários da própria Vale.",
    "cor": "#9B1C1C"
  },
  {
    // Painel diz "Abr/2019"; o dia vem de `clipping-ij.ts` (`d01`).
    "data": "2019-04-05",
    "titulo": "DPMG firma Termo de Compromisso com a Vale",
    "descricao": "Em apenas 70 dias após o rompimento, a Defensoria Pública de MG celebra com a Vale um Termo de Compromisso para reparação extrajudicial de danos morais e materiais às vítimas — modelo inédito no Brasil.",
    "cor": "#8B5E00"
  },
  {
    "data": "2020-01",
    "titulo": "MPMG denuncia 16 réus por 270 homicídios",
    "descricao": "O MPMG oferece denúncia criminal contra 11 funcionários da Vale e 5 da Tüv Süd (empresa alemã certificadora de barragens) por 270 homicídios qualificados e crimes ambientais. A ação penal é aceita pela Justiça de Brumadinho.",
    "cor": "#1A5FA8"
  },
  {
    "data": "2021-02-04",
    "titulo": "Acordo Judicial de Reparação — R$ 37,6 bilhões",
    "descricao": "MPMG, MPF, DPMG e Governo de Minas assinam com a Vale o maior acordo de reparação de um desastre ambiental da história brasileira, no valor global de R$ 37,6 bilhões. O acordo cria o Programa de Transferência de Renda (PTR), gerido pela FGV.",
    "cor": "#2D6A4F"
  },
  {
    "data": "2021-11",
    "titulo": "FGV assume a gestão do PTR",
    "descricao": "A FGV é nomeada para operacionalizar o PTR, que passa a atender mais de 130 mil beneficiários na Bacia do Paraopeba e Represa de Três Marias. A gestão independente foi exigida pelos atingidos após críticas ao modelo anterior.",
    "cor": "#2D6A4F"
  },
  {
    "data": "2024-11",
    "titulo": "IJs anunciam corte de 50% do PTR",
    "descricao": "MPMG, MPF e DPMG comunicam que os pagamentos serão reduzidos em 50% a partir de março de 2025 e encerrados em outubro de 2025, alegando esgotamento dos recursos previstos no Acordo. Mais de 160 mil famílias ficam sob risco.",
    "cor": "#9B1C1C"
  },
  // ── A partir daqui, os 17 de `MILESTONES` que já existiam.
  {
    "data": "2025-03-14",
    "titulo": "ACP protocolada",
    "descricao": "Ação Civil Pública proposta pelas associações parceiras do MAB após o corte de 50% do auxílio",
    "cor": "#7C4DBC"
  },
  {
    "data": "2025-03-28",
    "titulo": "1ª liminar (juiz Murilo)",
    "descricao": "Juiz Murilo Abreu concede tutela de urgência determinando à Vale manter o auxílio nos moldes anteriores ao corte",
    "cor": "#1A5FA8"
  },
  {
    "data": "2025-05-21",
    "titulo": "Liminar suspensa",
    "descricao": "Desembargadora convocada Maria Dolores suspende a decisão de 1ª instância. Auxílio voltou ao valor cortado",
    "cor": "#9B1C1C"
  },
  {
    "data": "2025-10-01",
    "titulo": "Encerramento PTR",
    "descricao": "Programa de Transferência de Renda é encerrado. Mais de 160 mil pessoas ficam sem auxílio",
    "cor": "#9B1C1C"
  },
  {
    "data": "2025-11-13",
    "titulo": "TJMG restaura auxílio",
    "descricao": "Desembargador André Leite Praça retoma a decisão de 1ª instância: Vale obrigada a pagar o Novo Auxílio Emergencial",
    "cor": "#3A6B10"
  },
  {
    "data": "2025-12-17",
    "titulo": "1º pagamento Novo AE",
    "descricao": "FGV realiza o primeiro pagamento do Novo Auxílio Emergencial: R$ 123,9 milhões para cerca de 160 mil pessoas",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-03-05",
    "titulo": "TJMG confirma (2ª inst.)",
    "descricao": "19ª Câmara Cível rejeita recurso da Vale por unanimidade e mantém o Novo Auxílio Emergencial na segunda instância",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-04-08",
    "titulo": "ADPF 1314 no STF",
    "descricao": "Ibram protocola no STF ação questionando a constitucionalidade da PNAB. Relatoria do min. Gilmar Mendes",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-04-24",
    "titulo": "Presidente TJMG nega Vale",
    "descricao": "Presidente Corrêa Júnior rejeita dois recursos da Vale, mantendo todas as decisões sobre o Novo Auxílio",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-05-07",
    "titulo": "AGU defende NAE no STF",
    "descricao": "AGU (Contencioso) pede ao STF que rejeite a ação do Ibram e defenda a aplicabilidade da PNAB ao caso Brumadinho",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-05-13",
    "titulo": "TJMG explica ao STF",
    "descricao": "Desembargador Leite Praça presta esclarecimentos ao STF sobre as decisões do TJMG, rebatendo argumento da retroatividade",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-05-14",
    "titulo": "Divergência na AGU",
    "descricao": "AGU, pela sua Consultoria-Geral e em nome da Presidência da República, envia ao STF posição contrária ao NAE, gerando contradição interna no governo",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-06-11",
    "titulo": "IAC 18 no STJ — voto dividido",
    "descricao": "STJ julga se o Termo DPMG-Vale é título executivo para ações individuais. Relator vota contra as vítimas; ministra Nancy Andrighi diverge. Julgamento suspenso",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-06-22",
    "titulo": "MPF encerra 1º semestre de oitivas",
    "descricao": "MPF conclui a primeira etapa da fase de instrução criminal no TRF6. Procuradores reafirmam busca pela punição dos responsáveis pelas 270 mortes",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-07-11",
    "titulo": "PGR pede cassação do NAE",
    "descricao": "Procurador-geral Paulo Gonet opina pela procedência total da ação do Ibram, defendendo a cassação das decisões do TJMG — parecer contrário aos atingidos",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-07-21",
    "titulo": "MAB protesta em BH",
    "descricao": "Centenas de atingidos protestam contra o parecer da PGR e cobram julgamento da ADPF 1314 pelo plenário do STF, não por decisão monocrática",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-07-30",
    "titulo": "Auxílio de agosto confirmado",
    "descricao": "NAE de agosto/2026 é garantido (parcelas de R$ 202,62 a R$ 1.621). Futuro do programa continua dependente da decisão do STF",
    "cor": "#3A6B10"
  }
];
