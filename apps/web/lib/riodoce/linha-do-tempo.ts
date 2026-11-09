/**
 * Linha do tempo do Rio Doce — os marcos do rompimento da barragem de Fundão
 * ao balanço do Programa Indenizatório Definitivo (PID).
 *
 * ═══ O QUE ESTE ARQUIVO É ═══
 *
 * Dado histórico/institucional, não recalculado pelo portal. Cada marco traz
 * a data que a fonte oficial registra, uma descrição curta e o link do órgão
 * ou da empresa que publicou o fato. Atualiza por commit quando a fonte mudar.
 *
 * A régua editorial é a mesma de `lib/paraopeba/linha-do-tempo.ts`: data
 * incompleta NÃO é completada com dia inventado. `data` aceita `YYYY-MM-DD`,
 * `YYYY-MM` e `YYYY` — a forma longa só aparece quando a fonte a sustenta.
 *
 * ═══ POR QUE NÃO USAR `formatDateBR` ═══
 *
 * `formatDateBR` (`lib/betim/format.ts`) devolve "—" para `YYYY-MM` e para ano
 * puro. Aqui isso apagaria três marcos (a instalação da Renova) e daria a
 * impressão de dado ausente. `formatarDataMarco` cobre as três formas e é a
 * única função que a tela e o CSV usam.
 *
 * ═══ FONTES ═══
 *
 * Os links vêm das páginas oficiais já citadas em
 * `docs/pesquisa/rio-doce/VIAS-INDENIZACAO-INDIVIDUAL.md`,
 * `apps/web/data/analises/rio-doce.json` e `lib/direitos-globais/dispositivos.ts`
 * (Lei 14.755/2023). Onde não há página específica daquele dia, o link é a
 * página institucional do órgão — nunca uma URL inventada.
 */

/** Tipo do marco — a mesma lista que o filtro da tela oferece. */
export type TipoMarcoRioDoce =
  | "rompimento"
  | "acordo"
  | "decisao"
  | "norma"
  | "indenizacao"
  | "audiencia";

/**
 * Intervalo de leitura da linha do tempo. Os três recortes respondem à
 * pergunta "em que fase do caso este marco caiu?" e não substituem o ano:
 * o filtro por ano continua disponível na tela.
 */
export type PeriodoMarcoRioDoce = "2015-2019" | "2020-2023" | "2024-2026";

export interface FonteMarcoRioDoce {
  rotulo: string;
  url: string;
}

export interface MarcoRioDoce {
  /** `YYYY-MM-DD`, `YYYY-MM` ou `YYYY`, conforme a precisão da fonte. */
  data: string;
  titulo: string;
  descricao: string;
  tipo: TipoMarcoRioDoce;
  /** Link oficial do fato — externo, aberto em nova aba. */
  fontes: FonteMarcoRioDoce[];
}

export const ROTULO_TIPO_RIO_DOCE: Record<TipoMarcoRioDoce, string> = {
  rompimento: "Rompimento",
  acordo: "Acordo",
  decisao: "Decisão",
  norma: "Norma",
  indenizacao: "Indenização",
  audiencia: "Audiência",
};

/** Cor do selo por tipo. Serve ao olho; o texto do selo é o canal principal. */
export const COR_TIPO_RIO_DOCE: Record<TipoMarcoRioDoce, string> = {
  rompimento: "#9B1C1C",
  acordo: "#2D6A4F",
  decisao: "#1A5FA8",
  norma: "#5B3FA8",
  indenizacao: "#8B5E00",
  audiencia: "#0F766E",
};

export const PERIODOS_RIO_DOCE: { id: PeriodoMarcoRioDoce; rotulo: string }[] = [
  { id: "2015-2019", rotulo: "2015–2019" },
  { id: "2020-2023", rotulo: "2020–2023" },
  { id: "2024-2026", rotulo: "2024–2026" },
];

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
 * Escreve a data respeitando a precisão guardada.
 *
 * `2015-11-05` → "05/11/2015"; `2016-03` → "março de 2016"; `2016` → "2016".
 * A forma muda de propósito: quem lê percebe que o dia não existe na fonte,
 * sem precisar de nota de rodapé.
 */
export function formatarDataMarco(data: string): string {
  const limpa = data.trim();
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpa);
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`;
  const mes = /^(\d{4})-(\d{2})$/.exec(limpa);
  if (mes) return `${MES_POR_EXTENSO[Number(mes[2]) - 1]} de ${mes[1]}`;
  const ano = /^(\d{4})$/.exec(limpa);
  if (ano) return ano[1];
  return "—";
}

/** Ano do marco — imune à precisão, porque as três formas começam por ele. */
export function anoDoMarco(data: string): string {
  return data.slice(0, 4);
}

export function periodoDoMarco(data: string): PeriodoMarcoRioDoce {
  const ano = Number(anoDoMarco(data));
  if (ano <= 2019) return "2015-2019";
  if (ano <= 2023) return "2020-2023";
  return "2024-2026";
}

/**
 * A ordem do array É a ordem editorial: cronológica, com o desempate que a
 * string sozinha erraria. `2016` (instalação da Renova) vem DEPOIS de
 * `2016-03-02` (TTAC), porque a fundação nasceu do termo — mas "2016" <
 * "2016-03-02" na comparação de string. Não reordenar por `data` na tela.
 */
export const MARCOS_RIO_DOCE: MarcoRioDoce[] = [
  {
    data: "2015-11-05",
    titulo: "Rompimento da barragem de Fundão",
    descricao:
      "A barragem de Fundão, da Samarco — joint venture entre Vale e BHP —, rompe em Mariana (MG). A lama de rejeitos desce até o Rio Doce e percorre mais de 600 km até o Atlântico. Dezenove pessoas morreram.",
    tipo: "rompimento",
    fontes: [{ rotulo: "Samarco", url: "https://www.samarco.com/" }],
  },
  {
    data: "2016-03-02",
    titulo: "Assinatura do TTAC",
    descricao:
      "União, Minas Gerais, Espírito Santo, Samarco, Vale e BHP assinam o Termo de Transação e de Ajustamento de Conduta (TTAC), que organiza a reparação e cria a Fundação Renova.",
    tipo: "acordo",
    fontes: [
      { rotulo: "MPMG", url: "https://www.mpmg.mp.br/" },
      { rotulo: "MPF", url: "https://www.mpf.mp.br/" },
    ],
  },
  {
    data: "2016",
    titulo: "Instalação da Fundação Renova",
    descricao:
      "A Fundação Renova é instalada para executar os programas de reparação previstos no TTAC, sob acompanhamento das instituições de justiça e dos comitês de atingidos.",
    tipo: "acordo",
    fontes: [
      {
        rotulo: "Portal da Transparência da Renova",
        url: "https://transparencia.fundacaorenova.org/inicio",
      },
    ],
  },
  {
    data: "2023-02-08",
    titulo: "NOVEL Infraestrutura homologado",
    descricao:
      "A Justiça Federal homologa o acordo do NOVEL Infraestrutura, para quem teve dano na casa: indenização calculada sobre o laudo pericial, com acréscimo de 50% sobre o valor da AECOM, correção monetária e juros de mora desde 11/12/2019.",
    tipo: "decisao",
    fontes: [
      {
        rotulo: "TRF6",
        url: "https://sjmg.trf6.jus.br/caso-samarco-justica-federal-homologa-novel-infraestrutura/",
      },
    ],
  },
  {
    data: "2023-12-15",
    titulo: "PNAB entra em vigor",
    descricao:
      "Entra em vigor a Lei 14.755/2023, que institui a Política Nacional de Direitos das Populações Atingidas por Barragens (PNAB) e fixa direitos e regras de reparação integral.",
    tipo: "norma",
    fontes: [
      {
        rotulo: "Planalto — Lei 14.755/2023",
        url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14755.htm",
      },
    ],
  },
  {
    data: "2024-07-12",
    titulo: "Audiência na CIDH",
    descricao:
      "A Comissão Interamericana de Direitos Humanos realiza audiência sobre o caso do Rio Doce e outros desastres brasileiros, com participação de atingidos e organizações.",
    tipo: "audiencia",
    fontes: [
      { rotulo: "CIDH — audiências", url: "https://www.oas.org/es/cidh/audiencias/" },
    ],
  },
  {
    data: "2024-10-25",
    titulo: "Novo Acordo de Mariana — R$ 170 bilhões",
    descricao:
      "União, Minas Gerais, Espírito Santo, Samarco, Vale e BHP assinam o Novo Acordo de Reparação, de R$ 170 bilhões no total — R$ 100 bilhões em recursos novos ao longo de 20 anos. O acordo cria o Programa Indenizatório Definitivo (PID).",
    tipo: "acordo",
    fontes: [
      {
        rotulo: "Casa Civil — balanço do Novo Acordo",
        url: "https://www.gov.br/casacivil/pt-br/assuntos/noticias/2026/novembro/governo-do-brasil-chega-aos-dois-anos-do-novo-acordo-do-rio-doce-com-55-projetos-aprovados-e-repasse-de-r-3-7-bilhoes",
      },
      { rotulo: "MPMG", url: "https://www.mpmg.mp.br/" },
    ],
  },
  {
    data: "2024-11-06",
    titulo: "STF homologa o Novo Acordo",
    descricao:
      "O Supremo Tribunal Federal homologa o Novo Acordo, que passa a valer como título executivo e base para os repasses e para o Programa Indenizatório Definitivo (PID).",
    tipo: "decisao",
    fontes: [{ rotulo: "STF", url: "https://portal.stf.jus.br/" }],
  },
  {
    data: "2025-02-26",
    titulo: "Abertura da plataforma do PID",
    descricao:
      "Abre a plataforma do Programa Indenizatório Definitivo (PID), que paga R$ 35 mil por pessoa elegível em parcela única e exige quitação e desistência de ações no Brasil e no exterior.",
    tipo: "indenizacao",
    fontes: [{ rotulo: "Samarco", url: "https://www.samarco.com/" }],
  },
  {
    data: "2025-09-14",
    titulo: "Encerramento da primeira janela do PID",
    descricao:
      "Termina a primeira janela de adesão ao PID. Quem não aderiu pode aguardar as reaberturas definidas pelas instituições de justiça.",
    tipo: "indenizacao",
    fontes: [
      { rotulo: "Samarco", url: "https://www.samarco.com/" },
      {
        rotulo: "Portal Reparação Rio Doce",
        url: "https://www.reparacaobaciariodoce.com/reparacao-em-numeros/",
      },
    ],
  },
  {
    data: "2025-11-12",
    titulo: "PID ultrapassa 300 mil acordos",
    descricao:
      "A Samarco informa que o Programa Indenizatório Definitivo supera 300 mil acordos assinados desde o início do programa.",
    tipo: "indenizacao",
    fontes: [
      {
        rotulo: "Samarco",
        url: "https://www.samarco.com/pid-alcanca-mais-de-300-mil-acordos-assinados/",
      },
    ],
  },
  {
    data: "2026-05-18",
    titulo: "Reabertura do PID por 90 dias",
    descricao:
      "O PID reabre por 90 dias, após pedido do MPF, do MPMG e de outras instituições de justiça. A adesão segue voluntária e implica quitação e desistência de ações.",
    tipo: "indenizacao",
    fontes: [
      {
        rotulo: "DPMG — reabertura do PID",
        url: "https://defensoria.mg.def.br/defensoria-publica-realiza-atendimento-para-pessoas-interessadas-em-aderir-a-reabertura-do-pid/",
      },
      {
        rotulo: "MPF",
        url: "https://www.mpf.mp.br/o-mpf/unidades/pr-mg/noticias/acordo-de-mariana-prorrogado-o-prazo-de-adesao-ao-programa-de-indenizacao-para-atingidos-pela-barragem-de-fundao",
      },
    ],
  },
  {
    data: "2026-08-15",
    titulo: "Encerramento do prazo de ingresso no PID",
    descricao:
      "Termina o prazo de ingresso no PID aberto em maio. O balanço do programa é divulgado nos meses seguintes.",
    tipo: "indenizacao",
    fontes: [{ rotulo: "Samarco", url: "https://www.samarco.com/" }],
  },
  {
    data: "2026-10-22",
    titulo: "Balanço: 321 mil indenizações pelo PID",
    descricao:
      "Balanço da Samarco registra mais de 321 mil indenizações pagas pelo PID e 648 mil pessoas indenizadas ou auxiliadas desde 2015.",
    tipo: "indenizacao",
    fontes: [
      {
        rotulo: "Samarco — balanço de 22/10/2026",
        url: "https://www.samarco.com/perto-de-completar-dois-anos-novo-acordo-do-rio-doce-transforma-compromissos-em-entregas-concretas-para-as-pessoas-e-os-territorios/",
      },
    ],
  },
];

/** Contagem global por período — usada nos cartões de topo. */
export function contarPorPeriodo(): Record<PeriodoMarcoRioDoce, number> {
  const contagem: Record<PeriodoMarcoRioDoce, number> = {
    "2015-2019": 0,
    "2020-2023": 0,
    "2024-2026": 0,
  };
  for (const marco of MARCOS_RIO_DOCE) contagem[periodoDoMarco(marco.data)] += 1;
  return contagem;
}

/** Anos presentes, em ordem — as opções do filtro por ano. */
export function anosDaTimeline(): string[] {
  return Array.from(new Set(MARCOS_RIO_DOCE.map((m) => anoDoMarco(m.data)))).sort();
}

/** Primeiro e último ano cobertos, para o cartão de período. */
export function intervaloDeAnos(): { primeiro: string; ultimo: string } {
  const anos = anosDaTimeline();
  return { primeiro: anos[0] ?? "—", ultimo: anos[anos.length - 1] ?? "—" };
}
