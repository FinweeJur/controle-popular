/**
 * Complementos da memória — fatos acrescentados pela curadoria.
 *
 * POR QUE EXISTE: o `lib/memoria/calendario.ts` é GERADO das duas fontes
 * originais (Calendário Histórico dos Trabalhadores, MST 2009; Blog Aos que
 * Virão, 2020) e não se edita à mão. Este arquivo é a TERCEIRA fonte
 * versionada: a luta dos atingidos por barragens, transcrita do acervo do MAB.
 * A lista é somada ao calendário em `correcoes.ts` (`CALENDARIO`).
 *
 * FONTE: MAB — Movimento dos Atingidos por Barragens, "Quem somos"
 * (https://mab.org.br/quem-somos/ e a Linha do Tempo em /linha-do-tempo/).
 * Cada item guarda a URL específica do fato. Os fatos que a fonte datou só por
 * mês ficam com `semData: true` — a tela avisa que o dia é aproximado; o fato
 * não se perde (mesma regra dos outros calendários).
 *
 * ESTILO: narrativo e inspirador, como o texto do próprio MAB (dono,
 * 03/10/2026), sem sair do fato.
 */

import type { EntradaCalendario } from "./tipos";

/** Fonte comum dos verbetes do MAB (autor e veículo). */
const FONTE = {
  autor: "MAB",
  orgao: "MAB — Movimento dos Atingidos por Barragens",
  fonteData: "2025",
  fonteCurta: "MAB — Movimento dos Atingidos por Barragens",
} as const;

export const COMPLEMENTOS: EntradaCalendario[] = [
  {
    ...FONTE,
    diaMes: "04-19",
    ano: "1989",
    titulo: "I Encontro Nacional de Trabalhadores Atingidos por Barragens",
    tituloCurto: "I Encontro Nacional dos Atingidos por Barragens",
    tipo: ["resistencia"],
    lugar: "Goiânia/GO",
    resumo:
      "De 19 a 21 de abril, em Goiânia, o I Encontro Nacional de Trabalhadores Atingidos por Barragens reuniu, em quatro etapas regionais, quem resistia à construção de grandes hidrelétricas. Ali se decidiu constituir uma organização nacional forte para fazer frente aos planos de grandes barragens.",
    url: "https://mab.org.br/timeline/i-encontro-nacional-de-trabalhadores-atingidos-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "03-14",
    ano: "1991",
    titulo: "Fundação do MAB — Movimento dos Atingidos por Barragens",
    tituloCurto: "Fundação do MAB",
    tipo: ["resistencia"],
    lugar: "Brasília/DF",
    resumo:
      "Em março, em Brasília, o I Congresso Nacional dos Atingidos por Barragens fundou o MAB, como movimento nacional, popular e autônomo. O dia da plenária final, 14 de março, ficou consagrado como Dia Nacional de Luta Contra as Barragens.",
    url: "https://mab.org.br/timeline/i-congresso-nacional-dos-atingidos-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "12-01",
    ano: "1993",
    semData: true,
    titulo: "II Congresso Nacional do MAB",
    tituloCurto: "II Congresso Nacional do MAB",
    tipo: ["resistencia"],
    resumo:
      "Em dezembro, o II Congresso Nacional do MAB deliberou organizar um encontro internacional de atingidos por barragens, para reunir as experiências de luta de outros países.",
    url: "https://mab.org.br/timeline/ii-congresso-nacional-do-mab/",
  },
  {
    ...FONTE,
    diaMes: "09-01",
    ano: "1995",
    semData: true,
    titulo: "Preparação do I Encontro Internacional de Atingidos",
    tituloCurto: "Preparação do I Encontro Internacional",
    tipo: ["resistencia"],
    lugar: "Itamonte/MG",
    resumo:
      "Em setembro, em Itamonte (MG), o encontro preparatório criou um comitê com a Rede Internacional de Rios, o Movimento para Salvar o Rio Narmada (Índia), o Grupo de Ação pelo Bio Bio (Chile) e a Rede Europeia de Rios.",
    url: "https://mab.org.br/timeline/preparacao-do-i-encontro-internacional-de-atingidos/",
  },
  {
    ...FONTE,
    diaMes: "12-10",
    ano: "1996",
    titulo: "III Congresso Nacional do MAB",
    tituloCurto: "III Congresso Nacional do MAB",
    tipo: ["resistencia"],
    lugar: "São Paulo/SP",
    resumo:
      "Entre 10 e 13 de dezembro, em São Paulo, o III Congresso Nacional do MAB debateu as linhas gerais de ação, o trabalho de base, a política de alianças e a posição do movimento frente ao setor elétrico.",
    url: "https://mab.org.br/timeline/iii-congresso-nacional-do-mab/",
  },
  {
    ...FONTE,
    diaMes: "03-14",
    ano: "1997",
    titulo: "I Encontro Internacional de Atingidos por Barragens",
    tituloCurto: "Dia Internacional de Luta contra as Barragens",
    tipo: ["resistencia"],
    lugar: "Curitiba/PR",
    resumo:
      "Em Curitiba, o I Encontro Internacional de Atingidos por Barragens reuniu delegações de 20 países e aprovou a declaração de Curitiba, que oficializou o 14 de março como Dia Internacional de Luta contra as Barragens, Pelos Rios, Pela Água e Pela Vida.",
    url: "https://mab.org.br/timeline/i-encontro-internacional-de-atingidos-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "11-01",
    ano: "1999",
    semData: true,
    titulo: "IV Congresso Nacional do MAB",
    tituloCurto: "IV Congresso Nacional do MAB",
    tipo: ["resistencia"],
    lugar: "Belo Horizonte/MG",
    resumo:
      "Em novembro, em Belo Horizonte, o IV Congresso do MAB definiu o combate às políticas neoliberais e à privatização do setor elétrico, e avançou na construção de um Projeto Energético Popular para o Brasil.",
    url: "https://mab.org.br/timeline/iv-congresso-do-mab/",
  },
  {
    ...FONTE,
    diaMes: "06-01",
    ano: "2003",
    semData: true,
    titulo: "5º Encontro Nacional do MAB",
    tituloCurto: "5º Encontro Nacional do MAB",
    tipo: ["resistencia"],
    lugar: "Brasília/DF",
    resumo:
      "Em junho, em Brasília, o 5º Encontro Nacional do MAB reafirmou a luta popular como instrumento de conquista para o povo e denunciou a privatização do setor elétrico nos anos anteriores.",
    url: "https://mab.org.br/timeline/5o-encontro-nacional-e-ii-encontro-internacional-de-atingidos/",
  },
  {
    ...FONTE,
    diaMes: "05-01",
    ano: "2004",
    semData: true,
    titulo: "Marcha Nacional Águas pela Vida",
    tituloCurto: "Marcha Nacional Águas pela Vida",
    tipo: ["resistencia"],
    lugar: "Goiânia a Brasília",
    resumo:
      "Em maio, cerca de 600 militantes de 15 estados marcharam de Goiânia a Brasília na Marcha Nacional Águas pela Vida, exigindo o cumprimento dos direitos dos atingidos e questionando a política energética do governo.",
    url: "https://mab.org.br/timeline/marcha-nacional-aguas-pela-vida/",
  },
  {
    ...FONTE,
    diaMes: "03-01",
    ano: "2006",
    semData: true,
    titulo: "6º Encontro Nacional dos Atingidos por Barragens",
    tituloCurto: "6º Encontro Nacional dos Atingidos por Barragens",
    tipo: ["resistencia"],
    lugar: "Curitiba/PR",
    resumo:
      "Em março, em Curitiba, 1.200 atingidos reafirmaram o caráter nacional e popular do MAB e lançaram a palavra de ordem: \"Água e energia não são mercadorias!\".",
    url: "https://mab.org.br/timeline/6o-encontro-nacional-dos-atingidos-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "01-01",
    ano: "2009",
    semData: true,
    titulo: "O Estado reconhece a dívida com os atingidos por barragens",
    tituloCurto: "Reconhecimento da dívida histórica com os atingidos",
    tipo: ["direitos", "resistencia"],
    resumo:
      "No lançamento do Plano Safra, o então presidente Lula reconheceu que o Estado brasileiro tem uma dívida histórica com os atingidos por barragens. Foi a primeira vez que um presidente os reconheceu.",
    url: "https://mab.org.br/timeline/pela-primeira-vez-fomos-reconhecidos-enquanto-atingidos-por-um-presidente/",
  },
  {
    ...FONTE,
    diaMes: "10-01",
    ano: "2010",
    titulo: "III Encontro Internacional dos Atingidos por Barragens",
    tituloCurto: "III Encontro Internacional (Temacapulín, México)",
    tipo: ["resistencia"],
    lugar: "Temacapulín, México",
    resumo:
      "De 1 a 7 de outubro, em Temacapulín (México), o III Encontro Internacional reuniu 320 delegados de 60 países e fortaleceu a luta contra a barragem de El Zapotillo.",
    url: "https://mab.org.br/timeline/iii-encontro-internacional-dos-atingidos-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "04-07",
    ano: "2011",
    titulo: "I Encontro das Mulheres Atingidas por Barragens",
    tituloCurto: "I Encontro das Mulheres Atingidas por Barragens",
    tipo: ["direitos", "resistencia"],
    lugar: "Brasília/DF",
    resumo:
      "Em abril, 500 mulheres atingidas debateram a violência e as lutas que travam. No dia 7, foram recebidas pela presidenta Dilma Rousseff e cobraram políticas de igualdade de gênero e o fim da violência contra as mulheres.",
    url: "https://mab.org.br/timeline/i-encontro-das-mulheres-atingidas-por-barragens/",
  },
  {
    ...FONTE,
    diaMes: "09-01",
    ano: "2013",
    titulo: "7º Encontro Nacional do MAB",
    tituloCurto: "7º Encontro Nacional do MAB",
    tipo: ["resistencia"],
    lugar: "Cotia/SP",
    resumo:
      "De 1 a 5 de setembro, em Cotia (SP), 2.500 atingidos definiram priorizar a luta contra grandes barragens, principalmente na Amazônia, e avançar na construção do Projeto Energético Popular.",
    url: "https://mab.org.br/timeline/7-encontro-nacional-do-mab/",
  },
  {
    ...FONTE,
    diaMes: "09-19",
    ano: "2016",
    titulo: "Fundação do Movimiento de Afectados por Represas (MAR)",
    tituloCurto: "Fundação do MAR, na América Latina",
    tipo: ["resistencia"],
    lugar: "Chapecó/SC",
    resumo:
      "Entre 19 e 23 de setembro, em Chapecó (SC), foi fundado o Movimiento de Afectados por Represas (MAR), com organizações de 12 países que lutam contra barragens na América Latina.",
    url: "https://mab.org.br/timeline/fundacao-do-mar-movimiento-de-afectados-por-represas/",
  },
  {
    ...FONTE,
    diaMes: "10-01",
    ano: "2017",
    titulo: "8º Encontro Nacional do MAB",
    tituloCurto: "8º Encontro Nacional do MAB",
    tipo: ["resistencia"],
    lugar: "Rio de Janeiro/RJ",
    resumo:
      "De 1 a 5 de outubro, no Rio de Janeiro, mais de 3.500 atingidos e delegações de 19 países definiram os rumos do Projeto Energético Popular; a marcha final reuniu cerca de 20 mil pessoas.",
    url: "https://mab.org.br/timeline/8o-encontro-nacional-do-mab/",
  },
  {
    ...FONTE,
    diaMes: "11-04",
    ano: "2023",
    titulo: "Jornada de Lutas do MAB: É Tempo de Avançar",
    tituloCurto: "Jornada de Lutas do MAB em Brasília",
    tipo: ["resistencia"],
    lugar: "Brasília/DF",
    resumo:
      "De 4 a 7 de novembro, mais de 2.500 atingidos de 20 estados foram a Brasília exigir reparação e políticas de proteção social — e a aprovação da Política Nacional de Direitos das Populações Atingidas por Barragens.",
    url: "https://mab.org.br/timeline/jornada-de-lutas-e-tempo-de-avancar/",
  },
  {
    ...FONTE,
    diaMes: "12-15",
    ano: "2023",
    titulo: "Sanção da PNAB — Política Nacional dos Atingidos por Barragens",
    tituloCurto: "Sanção da PNAB (Lei nº 14.755)",
    tipo: ["direitos", "resistencia"],
    resumo:
      "A Política Nacional de Direitos das Populações Atingidas por Barragens foi aprovada por unanimidade no Senado em novembro e sancionada pelo presidente Lula em 15 de dezembro, após quase 40 anos de lutas. Agora a luta é pela regulamentação.",
    url: "https://mab.org.br/timeline/sancao-da-pnab-lei-no-14-755/",
  },
  {
    ...FONTE,
    diaMes: "11-06",
    ano: "2025",
    titulo: "IV Encontro Internacional de Atingidos por Barragens e Crise Climática",
    tituloCurto: "IV Encontro Internacional e o movimento mundial",
    tipo: ["resistencia"],
    lugar: "Belém/PA",
    resumo:
      "Em Belém (PA), de 6 a 11 de novembro, durante a COP 30, mais de 200 delegados de 45 países fundaram o Movimento Internacional de Atingidos por Barragens, Crimes Socioambientais e Crise Climática.",
    url: "https://mab.org.br/timeline/iv-encontro-internacional-de-atingidos/",
  },
];
