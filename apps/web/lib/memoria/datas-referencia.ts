/**
 * Datas de referência dos movimentos sociais e dos direitos humanos.
 *
 * Papel no portal: a página `/memoria` (linha do tempo das lutas) também
 * mostra o calendário de luta — os dias fixos que os movimentos e o campo
 * socioambiental marcam todo ano, como o 14 de março (Dia Internacional de
 * Luta contra as Barragens, Pelos Rios, Pela Água e Pela Vida, do MAB) e os
 * dias do Cerrado, da Amazônia e da Caatinga.
 *
 * A HOME TAMBÉM LÊ ESTA LISTA (dono, 04/10/2026): o título do cartão
 * "Mística do Dia" passa a trazer a data local e, quando a data casa com um
 * dia de referência, acrescenta " - <nome do dia>" (ex.: "Mística do Dia 7 de
 * setembro - Dia da Independência do Brasil"). Fonte ÚNICA: o mapa de
 * efemérides não é duplicado em outro arquivo — quem acrescenta um dia o faz
 * aqui. As funções `referenciaDoDia` e `tituloMisticaDoDia`, no fim do
 * arquivo, fazem a consulta e a montagem do texto.
 *
 * GENERALIZAÇÃO (dono, 04/10/2026): a lista deixou de ser só os quatro
 * exemplos citados e passou a cobrir os eixos do recorte cívico do portal —
 * meio ambiente/clima/água; direitos humanos; povos originários e consciência
 * negra; saúde/SUS; mulheres e pessoas LGBTQIA+; trabalho; educação;
 * criança/adolescente/pessoa idosa; combate à violência; memória e democracia.
 * Quando duas efemérides caem no MESMO mês-dia, entra a mais alinhada ao
 * portal e a decisão fica registrada abaixo, para não parecer esquecimento.
 *
 * FONTES OFICIAIS (regra dura do dono): cada data precisa de URL de
 * instituição pública — ONU/UNESCO/OMS/FAO/OMM (dias internacionais) ou
 * Planalto (leis brasileiras). A lista-mestra da ONU foi aberta e conferida
 * em `https://www.un.org/en/observances/list-days-weeks` (consulta em
 * 04/10/2026); as páginas do Planalto foram abertas uma a uma. Data ou nome
 * sem respaldo oficial NÃO entra — na dúvida, fica de fora (AGENTS.md §7).
 *
 * CONFLITOS DE DATA E A ESCOLHA FEITA (04/10/2026):
 *  - 03-21: entra "Eliminação da Discriminação Racial" (ONU); fica de fora o
 *    "Dia Internacional das Florestas" (FAO), mesmo eixo ambiental que já tem
 *    o 21/09 e o 05/06. A luta antirracista pesa mais no recorte do portal;
 *  - 03-24: entra "Direito à Verdade" (ONU, memória da ditadura); fica de
 *    fora o "Dia Mundial da Tuberculose" (OMS), coberto pelos demais dias de
 *    saúde da lista;
 *  - 11-20: mantido o "Dia da Consciência Negra — Zumbi dos Palmares" (dono);
 *    fica de fora o "Dia Mundial da Criança" (ONU), que divide o mesmo dia;
 *  - 03-21 (segunda colisão) e 09-21: a lista tem vários dias no mesmo mês-dia;
 *    consulte sempre `referenciaDoDia`, que casa a chave exata "MM-DD".
 *
 * FORA POR FALTA DE FONTE VERIFICADA (04/10/2026): "Dia Internacional contra a
 * Homofobia, a Transfobia e a Bifobia" (17/05) e "Dia Nacional da Visibilidade
 * Trans" (29/01) — não são dias oficiais da ONU nem têm lei federal com página
 * oficial aberta; entram quando o dono indicar a fonte. "Dia da Árvore"
 * (21/09) fica de fora porque o dia já é o "Dia Internacional da Paz" (ONU).
 *
 * Decisão técnica: isto é uma lista CURADA, escrita à mão com fonte — não
 * vem do gerador do calendário (que transcreve as duas fontes históricas).
 * Datas comemorativas têm data fixa e um significado, não um fato datado.
 * Em `fonte.ano`, quando a página não traz a data de publicação, vale o
 * ANO DA CONSULTA — por isso o rótulo "consultado em" fica visível na tela.
 */

import type { Fonte, TipoLuta } from "./tipos";

/** Um dia fixo do calendário de luta e direitos humanos. */
export interface DataReferencia {
  /** Dia e mês no formato "MM-DD" (ex.: "03-14"). */
  diaMes: string;
  /** Nome da data, como o movimento a chama. */
  titulo: string;
  /** Uma frase curta do porquê da data. */
  descricao: string;
  /** Ao menos um tipo de luta, no vocabulário do plano. */
  tipo: TipoLuta[];
  /** Instituição que sustenta a data, com link verificado. */
  fonte: Fonte;
}

/**
 * Citação curta no estilo do dev `(Autor, Data)` — ex.: "MAB, 2026",
 * "ONU Brasil, 2026", "MMA, 2026". O "autor" aqui é a FONTE (a
 * instituição), nunca a pessoa, como na fonte curta da Mística.
 */
export function citacaoCurtaData(f: Fonte): string {
  return `${f.orgao}, ${f.ano}`;
}

/**
 * Fonte da ONU para os dias internacionais. A URL aponta para a página
 * própria do dia (não a home), conforme a lista-mestra da organização.
 */
function onu(titulo: string, url: string): Fonte {
  return {
    autor: "Organização das Nações Unidas",
    titulo,
    ano: "2026",
    url,
    orgao: "ONU",
  };
}

/** Fonte da UNESCO (dias da educação, cultura e memória). */
function unesco(titulo: string, url: string): Fonte {
  return {
    autor: "Organização das Nações Unidas para a Educação, a Ciência e a Cultura",
    titulo,
    ano: "2026",
    url,
    orgao: "UNESCO",
  };
}

/** Fonte da OMS (dias de saúde pública). */
function oms(titulo: string, url: string): Fonte {
  return {
    autor: "Organização Mundial da Saúde",
    titulo,
    ano: "2026",
    url,
    orgao: "OMS",
  };
}

/**
 * As datas de referência, na ordem do ano (mês, dia).
 * `fonte.ano` = ano de consulta quando a página é viva (ver nota do topo).
 */
export const DATAS_REFERENCIA: DataReferencia[] = [
  {
    diaMes: "01-24",
    titulo: "Dia Internacional da Educação",
    descricao:
      "Educação como direito humano e bem público. O dia cobra escola pública, gratuita e de qualidade para todas as pessoas.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Internacional da Educação",
      "https://www.un.org/en/observances/education-day",
    ),
  },
  {
    diaMes: "01-27",
    titulo: "Dia Internacional em Memória das Vítimas do Holocausto",
    descricao:
      "Marca a libertação de Auschwitz-Birkenau, em 1945. É o alerta contra o genocídio, o ódio e a barbárie.",
    tipo: ["resistencia", "direitos"],
    fonte: onu(
      "ONU — Memória das vítimas do Holocausto",
      "https://www.un.org/en/observances/commemoration-holocaust-victims-day",
    ),
  },
  {
    diaMes: "02-02",
    titulo: "Dia Mundial das Zonas Úmidas",
    descricao:
      "Lembra a Convenção de Ramsar, de 1971. Pântanos, várzeas e manguezais guardam água e vida e são os primeiros a sofrer com a seca.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Dia Mundial das Zonas Úmidas",
      "https://www.un.org/en/observances/world-wetlands-day",
    ),
  },
  {
    diaMes: "02-06",
    titulo: "Dia Internacional de Tolerância Zero à Mutilação Genital Feminina",
    descricao:
      "Luta pelo fim da mutilação genital feminina, violência contra meninas e mulheres. O dia cobra proteção e cuidado, nunca castigo.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Tolerância zero à mutilação genital feminina",
      "https://www.un.org/en/observances/female-genital-mutilation-day",
    ),
  },
  {
    diaMes: "02-20",
    titulo: "Dia Mundial da Justiça Social",
    descricao:
      "Põe no centro o combate à desigualdade, ao desemprego e à exclusão. Justiça social é o que liga trabalho digno e direitos.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial da Justiça Social",
      "https://www.un.org/en/observances/social-justice-day",
    ),
  },
  {
    diaMes: "03-03",
    titulo: "Dia Mundial da Vida Selvagem",
    descricao:
      "Protege a fauna e a flora silvestres e os ecossistemas. O tráfico de animais e o desmatamento são as maiores ameaças.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Dia Mundial da Vida Selvagem",
      "https://www.un.org/en/observances/world-wildlife-day",
    ),
  },
  {
    diaMes: "03-08",
    titulo: "Dia Internacional da Mulher",
    descricao:
      "Luta histórica das mulheres por igualdade, dignidade e direitos. Os movimentos populares lembram as trabalhadoras e a violência que ainda enfrentam.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Internacional da Mulher",
      "https://www.un.org/en/observances/womens-day",
    ),
  },
  {
    diaMes: "03-14",
    titulo: "Dia Internacional de Luta contra as Barragens, Pelos Rios, Pela Água e Pela Vida",
    descricao:
      "Data do Movimento dos Atingidos por Barragens (MAB), oficializada na Declaração de Curitiba (1997). Honra os mártires e as comunidades atingidas por barragens e defende os rios, a água e a vida.",
    tipo: ["direitos", "resistencia"],
    fonte: {
      autor: "Movimento dos Atingidos por Barragens",
      titulo: "Linha do tempo do MAB",
      ano: "2026",
      url: "https://mab.org.br/linha-do-tempo/",
      orgao: "MAB",
    },
  },
  {
    diaMes: "03-21",
    titulo: "Dia Internacional pela Eliminação da Discriminação Racial",
    descricao:
      "Lembra o Massacre de Sharpeville, em 1960, na África do Sul. É o dia mundial da luta antirracista e da igualdade racial.",
    tipo: ["quilombo", "direitos"],
    fonte: onu(
      "ONU — Eliminação da discriminação racial",
      "https://www.un.org/en/observances/end-racism-day",
    ),
  },
  {
    diaMes: "03-22",
    titulo: "Dia Mundial da Água",
    descricao:
      "A água como bem comum, não mercadoria. As lutas populares ligam a data à defesa de rios, nascentes e do acesso à água.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Dia Mundial da Água",
      "https://www.un.org/en/observances/water-day",
    ),
  },
  {
    diaMes: "03-23",
    titulo: "Dia Meteorológico Mundial",
    descricao:
      "Lembra a criação da Organização Meteorológica Mundial, em 1950. É o dia de olhar o clima e os alertas que salvam vidas.",
    tipo: ["direitos"],
    fonte: {
      autor: "Organização Meteorológica Mundial",
      titulo: "Dia Meteorológico Mundial",
      ano: "2026",
      url: "https://wmo.int/about-wmo/world-meteorological-day",
      orgao: "OMM",
    },
  },
  {
    diaMes: "03-24",
    titulo: "Dia Internacional pelo Direito à Verdade",
    descricao:
      "Marca o assassinato de Dom Óscar Romero, em 1980. É o direito das vítimas e das famílias de saber o que aconteceu e de exigir memória.",
    tipo: ["anistia", "resistencia"],
    fonte: onu(
      "ONU — Direito à verdade",
      "https://www.un.org/en/observances/right-to-truth-day",
    ),
  },
  {
    diaMes: "03-25",
    titulo: "Dia Internacional em Memória das Vítimas da Escravidão e do Tráfico Transatlântico",
    descricao:
      "Honra os milhões de africanos escravizados e sequestrados. O dia liga a memória da escravidão à luta contra o racismo de hoje.",
    tipo: ["quilombo", "resistencia"],
    fonte: onu(
      "ONU — Memória das vítimas da escravidão",
      "https://www.un.org/en/observances/transatlantic-slave-trade",
    ),
  },
  {
    diaMes: "04-07",
    titulo: "Dia Mundial da Saúde",
    descricao:
      "Marca a fundação da Organização Mundial da Saúde, em 1948. Saúde é direito, não mercadoria — e o SUS é a versão brasileira disso.",
    tipo: ["direitos"],
    fonte: oms(
      "OMS — Dia Mundial da Saúde",
      "https://www.who.int/campaigns/world-health-day",
    ),
  },
  {
    diaMes: "04-19",
    titulo: "Dia dos Povos Indígenas",
    descricao:
      "Defesa dos direitos originários, das terras indígenas e dos povos da floresta, na cidade e no campo.",
    tipo: ["indigena", "direitos"],
    fonte: {
      autor: "Fundação Nacional dos Povos Indígenas",
      titulo: "Dia dos Povos Indígenas",
      ano: "2026",
      url: "https://www.gov.br/funai/pt-br",
      orgao: "FUNAI",
    },
  },
  {
    diaMes: "04-22",
    titulo: "Dia Internacional da Mãe Terra",
    descricao:
      "A Terra como casa comum, chamada de Mãe em muitos povos. O dia cobra frear a exploração que aquece o clima e devasta os biomas.",
    tipo: ["campo", "indigena"],
    fonte: onu(
      "ONU — Dia Internacional da Mãe Terra",
      "https://www.un.org/en/observances/earth-day",
    ),
  },
  {
    diaMes: "04-28",
    titulo: "Dia da Caatinga",
    descricao:
      "Único bioma exclusivamente brasileiro. Lembra a defesa do semiárido, dos seus povos, da água e do modo de vida sertanejo.",
    tipo: ["campo", "indigena"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Caatinga",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "05-01",
    titulo: "Dia Internacional do Trabalhador",
    descricao:
      "Memória das lutas operárias de Chicago, em 1886, pela jornada de oito horas. É o dia do trabalho organizado no mundo inteiro.",
    tipo: ["greve", "direitos"],
    fonte: onu(
      "ONU — Trabalho decente",
      "https://brasil.un.org/pt-br",
    ),
  },
  {
    diaMes: "05-03",
    titulo: "Dia Mundial da Liberdade de Imprensa",
    descricao:
      "Defende o jornalismo livre e o direito de informar. Sem imprensa livre não há democracia nem fiscalização do poder.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Liberdade de imprensa",
      "https://www.un.org/en/observances/press-freedom-day",
    ),
  },
  {
    diaMes: "05-06",
    // Fonte: ONU (Conferência de Estocolmo, 1972 — a data foi instituída
    // pela Assembleia Geral e é observada todo 5 de junho).
    titulo: "Dia Mundial do Meio Ambiente",
    descricao:
      "Instituído pela ONU na Conferência de Estocolmo, em 1972. É o dia de defender os biomas, as águas e o clima como bens comuns.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial do Meio Ambiente",
      "https://www.un.org/en/observances/environment-day",
    ),
  },
  {
    diaMes: "05-13",
    titulo: "Dia da Abolição da Escravatura no Brasil",
    descricao:
      "Marca a Lei Áurea, de 13 de maio de 1888, que declarou extinta a escravidão. A data lembra a conquista e a dívida social que ficou.",
    tipo: ["quilombo", "resistencia"],
    fonte: {
      autor: "Presidência da República",
      titulo: "Lei 3.353, de 13 de maio de 1888 (Lei Áurea)",
      ano: "1888",
      url: "https://www.planalto.gov.br/ccivil_03/leis/lim/LIM3353.htm",
      orgao: "Planalto",
    },
  },
  {
    diaMes: "05-20",
    titulo: "Dia Mundial das Abelhas",
    descricao:
      "As abelhas polinizam a comida e sustentam a biodiversidade. O dia alerta para o veneno que as mata e ameaça a lavoura.",
    tipo: ["campo"],
    fonte: {
      autor: "Organização das Nações Unidas para a Alimentação e a Agricultura",
      titulo: "Dia Mundial das Abelhas",
      ano: "2026",
      url: "https://www.fao.org/world-bee-day/en",
      orgao: "FAO",
    },
  },
  {
    diaMes: "05-22",
    titulo: "Dia Internacional da Biodiversidade",
    descricao:
      "Celebra a variedade da vida e cobra sua proteção. Cada espécie perdida é um pedaço do equilíbrio que se desfaz.",
    tipo: ["campo", "indigena"],
    fonte: onu(
      "ONU — Dia Internacional da Biodiversidade",
      "https://www.un.org/en/observances/biological-diversity-day",
    ),
  },
  {
    diaMes: "05-31",
    titulo: "Dia Mundial sem Tabaco",
    descricao:
      "Alerta para as doenças e mortes causadas pelo tabaco. O dia cobra políticas de saúde pública, não o lucro da indústria.",
    tipo: ["direitos"],
    fonte: oms(
      "OMS — Dia Mundial sem Tabaco",
      "https://www.who.int/campaigns/world-no-tobacco-day",
    ),
  },
  {
    diaMes: "06-04",
    titulo: "Dia Internacional das Crianças Vítimas Inocentes de Agressão",
    descricao:
      "Não esquece as crianças atingidas por guerras e violências que não escolheram. O dia cobra proteção integral à infância.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Crianças vítimas de agressão",
      "https://www.un.org/en/observances/child-victim-day",
    ),
  },
  {
    diaMes: "06-08",
    titulo: "Dia Mundial dos Oceanos",
    descricao:
      "Os oceanos regulam o clima e alimentam milhões. O dia cobra o fim da poluição plástica e da pesca predatória.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Dia Mundial dos Oceanos",
      "https://www.un.org/en/observances/oceans-day",
    ),
  },
  {
    diaMes: "06-12",
    titulo: "Dia Mundial contra o Trabalho Infantil",
    descricao:
      "Cobra o fim do trabalho de crianças e adolescentes. Onde há exploração infantil falta escola e sobra desigualdade.",
    tipo: ["greve", "direitos"],
    fonte: onu(
      "ONU — Combate ao trabalho infantil",
      "https://www.un.org/en/observances/world-day-against-child-labour",
    ),
  },
  {
    diaMes: "06-17",
    titulo: "Dia Mundial de Combate à Desertificação e à Seca",
    descricao:
      "Alerta para o avanço da desertificação e a perda de solo fértil. É a data de quem vive do campo e sofre com a seca.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Desertificação e seca",
      "https://www.un.org/en/observances/desertification-day",
    ),
  },
  {
    diaMes: "06-19",
    titulo: "Dia Internacional pela Eliminação da Violência Sexual em Conflitos",
    descricao:
      "Denuncia a violência sexual usada como arma de guerra. O dia cobra justiça e reparação para as vítimas.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Violência sexual em conflitos",
      "https://www.un.org/en/observances/end-sexual-violence-in-conflict-day",
    ),
  },
  {
    diaMes: "06-20",
    titulo: "Dia Mundial do Refugiado",
    descricao:
      "Honra quem foi forçado a deixar a casa por guerra, fome ou perseguição. O dia cobra acolhida e direitos, não muros.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial do Refugiado",
      "https://www.un.org/en/observances/refugee-day",
    ),
  },
  {
    diaMes: "06-26",
    titulo: "Dia Internacional de Apoio às Vítimas de Tortura",
    descricao:
      "Marca a Convenção da ONU contra a Tortura, de 1987. O dia cobra o fim da tortura e memória para quem a sofreu.",
    tipo: ["anistia", "resistencia"],
    fonte: onu(
      "ONU — Vítimas de tortura",
      "https://www.un.org/en/observances/torture-victims-day",
    ),
  },
  {
    diaMes: "07-18",
    titulo: "Dia Internacional Nelson Mandela",
    descricao:
      "Data do nascimento de Mandela, em 1918. Celebra a luta contra o apartheid, pela liberdade e pela paz.",
    tipo: ["quilombo", "direitos", "resistencia"],
    fonte: {
      autor: "Organização das Nações Unidas",
      titulo: "Dia Internacional Nelson Mandela",
      ano: "2026",
      url: "https://www.un.org/en/events/mandeladay/",
      orgao: "ONU",
    },
  },
  {
    diaMes: "07-25",
    titulo: "Dia Internacional das Mulheres e Meninas de Ascendência Africana",
    descricao:
      "Põe no centro as mulheres negras e suas lutas. O dia cobra igualdade e o fim do racismo e do machismo somados.",
    tipo: ["quilombo", "direitos"],
    fonte: onu(
      "ONU — Mulheres e meninas afrodescendentes",
      "https://www.un.org/en/observances/women-girls-african-descent",
    ),
  },
  {
    diaMes: "07-28",
    titulo: "Dia Mundial da Hepatite",
    descricao:
      "Alerta para as hepatites virais e para a importância da vacina e do diagnóstico. Prevenir é mais barato que tratar.",
    tipo: ["direitos"],
    fonte: oms(
      "OMS — Dia Mundial da Hepatite",
      "https://www.who.int/campaigns/world-hepatitis-day",
    ),
  },
  {
    diaMes: "07-30",
    titulo: "Dia Mundial de Combate ao Tráfico de Pessoas",
    descricao:
      "Denuncia o tráfico de seres humanos para exploração. O dia cobra proteção às vítimas e punição aos exploradores.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Tráfico de pessoas",
      "https://www.un.org/en/observances/end-human-trafficking-day",
    ),
  },
  {
    diaMes: "08-05",
    titulo: "Dia Nacional da Saúde",
    descricao:
      "Instituído pela Lei 5.352, de 1967, no dia de Osvaldo Cruz. É o dia de reafirmar a saúde como direito de todos e dever do Estado.",
    tipo: ["direitos"],
    fonte: {
      autor: "Presidência da República",
      titulo: "Lei 5.352, de 8 de novembro de 1967 — Dia Nacional da Saúde",
      ano: "1967",
      url: "https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l5352.htm",
      orgao: "Planalto",
    },
  },
  {
    diaMes: "08-09",
    titulo: "Dia Internacional dos Povos Indígenas",
    descricao:
      "Instituído pela ONU em 1994. O dia cobra o respeito aos direitos originários, às terras e aos modos de vida dos povos indígenas.",
    tipo: ["indigena", "direitos"],
    fonte: onu(
      "ONU — Povos indígenas",
      "https://www.un.org/en/observances/indigenous-day",
    ),
  },
  {
    diaMes: "08-12",
    titulo: "Dia Internacional da Juventude",
    descricao:
      "Reconhece a voz da juventude na transformação do mundo. O dia cobra emprego, escola e participação para quem vem depois.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Internacional da Juventude",
      "https://www.un.org/en/observances/youth-day",
    ),
  },
  {
    diaMes: "08-23",
    titulo: "Dia Internacional em Memória do Tráfico de Escravos e de sua Abolição",
    descricao:
      "Marca a insurreição do Haiti, em 1791. Honra a resistência dos escravizados que conquistaram a própria liberdade.",
    tipo: ["quilombo", "resistencia"],
    fonte: unesco(
      "UNESCO — Memória do tráfico de escravos",
      "https://www.unesco.org/en/days/slave-trade-remembrance",
    ),
  },
  {
    diaMes: "08-30",
    titulo: "Dia Internacional das Vítimas de Desaparecimentos Forçados",
    descricao:
      "Denuncia o desaparecimento forçado como crime e violação de direitos. O dia cobra verdade e memória para as famílias.",
    tipo: ["anistia", "resistencia"],
    fonte: onu(
      "ONU — Vítimas de desaparecimentos forçados",
      "https://www.un.org/en/observances/victims-enforced-disappearance",
    ),
  },
  {
    diaMes: "08-31",
    titulo: "Dia Internacional dos Afrodescendentes",
    descricao:
      "Celebra a herança africana e cobra igualdade racial. O dia fortalece a luta contra o racismo em toda a diáspora.",
    tipo: ["quilombo", "direitos"],
    fonte: onu(
      "ONU — Pessoas de ascendência africana",
      "https://www.un.org/en/observances/african-descent-day",
    ),
  },
  {
    diaMes: "09-05",
    titulo: "Dia da Amazônia",
    descricao:
      "Marca a criação da Província do Amazonas, em 1850. É o dia de defender o maior bioma florestal do Brasil, seus povos e suas águas.",
    tipo: ["indigena", "campo"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Amazônia",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "09-07",
    // Fonte: Lei 662/1949 (Planalto) — declara feriado nacional o 7 de
    // setembro; a proclamação da Independência é de 7 de setembro de 1822.
    titulo: "Dia da Independência do Brasil",
    descricao:
      "Marca a proclamação da Independência, em 7 de setembro de 1822, às margens do rio Ipiranga. Feriado nacional pela Lei 662/1949.",
    tipo: ["direitos"],
    fonte: {
      autor: "Presidência da República",
      titulo: "Lei 662, de 6 de abril de 1949",
      ano: "1949",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l0662.htm",
      orgao: "Planalto",
    },
  },
  {
    diaMes: "09-08",
    titulo: "Dia Internacional da Alfabetização",
    descricao:
      "Cobra o direito de ler e escrever para todas as pessoas. A alfabetização é porta de entrada para todos os outros direitos.",
    tipo: ["direitos"],
    fonte: unesco(
      "UNESCO — Dia Internacional da Alfabetização",
      "https://www.unesco.org/en/days/literacy",
    ),
  },
  {
    diaMes: "09-11",
    titulo: "Dia do Cerrado",
    descricao:
      "A savana mais biodiversa do mundo, berço das águas de grande parte do Brasil. O dia defende o Cerrado em pé, seus povos e suas nascentes.",
    tipo: ["campo", "indigena"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Cerrado",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "09-15",
    titulo: "Dia Internacional da Democracia",
    descricao:
      "Afirma a democracia como direito e como conquista sempre em disputa. O dia cobra participação popular e eleições livres.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Dia Internacional da Democracia",
      "https://www.un.org/en/observances/democracy-day",
    ),
  },
  {
    diaMes: "09-16",
    titulo: "Dia Internacional para a Preservação da Camada de Ozônio",
    descricao:
      "Marca o Protocolo de Montreal, de 1987. Mostra que a cooperação entre países consegue frear um dano ambiental global.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Preservação da camada de ozônio",
      "https://www.un.org/en/observances/ozone-day",
    ),
  },
  {
    diaMes: "09-18",
    titulo: "Dia Internacional da Igualdade Salarial",
    descricao:
      "Cobra o fim da diferença de salário entre homens e mulheres. Trabalho igual merece pagamento igual.",
    tipo: ["greve", "direitos"],
    fonte: onu(
      "ONU — Igualdade salarial",
      "https://www.un.org/en/observances/equal-pay-day",
    ),
  },
  {
    diaMes: "09-21",
    titulo: "Dia Internacional da Paz",
    descricao:
      "Convocado pela ONU em 1981. É o dia de dizer não à guerra e sim ao fim da violência contra os povos.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Dia Internacional da Paz",
      "https://www.un.org/en/observances/international-day-peace",
    ),
  },
  {
    diaMes: "09-28",
    titulo: "Dia Internacional do Acesso Universal à Informação",
    descricao:
      "Defende o direito de buscar e receber informação pública. É o dia da transparência e da Lei de Acesso à Informação.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Acesso universal à informação",
      "https://www.un.org/en/observances/information-access-day",
    ),
  },
  {
    diaMes: "10-01",
    titulo: "Dia Internacional da Pessoa Idosa",
    descricao:
      "Reconhece a contribuição das pessoas idosas e cobra dignidade. O dia denuncia a violência e o abandono que ainda sofrem.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Pessoa idosa",
      "https://www.un.org/en/observances/older-persons-day",
    ),
  },
  {
    diaMes: "10-02",
    titulo: "Dia Internacional da Não-Violência",
    descricao:
      "Data do nascimento de Mahatma Gandhi, em 1869. O dia afirma que a resistência se faz sem violência, pela força da organização.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Dia Internacional da Não-Violência",
      "https://www.un.org/en/observances/non-violence-day",
    ),
  },
  {
    diaMes: "10-05",
    titulo: "Dia Mundial dos Professores",
    descricao:
      "Valoriza quem ensina e cobra plano de carreira e condições de trabalho. Sem professor valorizado não há educação pública.",
    tipo: ["direitos"],
    fonte: unesco(
      "UNESCO — Dia Mundial dos Professores",
      "https://www.unesco.org/en/days/teachers",
    ),
  },
  {
    diaMes: "10-10",
    titulo: "Dia Mundial da Saúde Mental",
    descricao:
      "Combate o estigma que cerca o sofrimento mental. O dia cobra cuidado em liberdade e a rede de atenção psicossocial do SUS.",
    tipo: ["direitos"],
    fonte: oms(
      "OMS — Dia Mundial da Saúde Mental",
      "https://www.who.int/campaigns/world-mental-health-day",
    ),
  },
  {
    diaMes: "10-11",
    titulo: "Dia Internacional da Menina",
    descricao:
      "Cobra igualdade e proteção para as meninas no mundo inteiro. O dia denuncia o casamento infantil e a exclusão escolar.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Internacional da Menina",
      "https://www.un.org/en/observances/girl-child-day",
    ),
  },
  {
    diaMes: "10-13",
    titulo: "Dia Internacional para a Redução do Risco de Desastres",
    descricao:
      "Cobra prevenção e alerta antes que a tragédia aconteça. A data é lembrança viva das vítimas de desastres e de rompimentos.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Redução do risco de desastres",
      "https://www.un.org/en/observances/disaster-reduction-day",
    ),
  },
  {
    diaMes: "10-15",
    titulo: "Dia Internacional das Mulheres Rurais",
    descricao:
      "Reconhece as mulheres do campo, das águas e da floresta. O dia cobra titulação da terra, crédito e fim da violência no campo.",
    tipo: ["campo", "direitos"],
    fonte: onu(
      "ONU — Mulheres rurais",
      "https://www.un.org/en/observances/rural-women-day",
    ),
  },
  {
    diaMes: "10-31",
    titulo: "Dia Mundial das Cidades",
    descricao:
      "Coloca a moradia e o direito à cidade no centro. O dia cobra saneamento, transporte e participação popular no urbano.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial das Cidades",
      "https://www.un.org/en/observances/cities-day",
    ),
  },
  {
    diaMes: "11-02",
    titulo: "Dia Internacional pelo Fim da Impunidade dos Crimes contra Jornalistas",
    descricao:
      "Denuncia que a maioria dos crimes contra jornalistas fica sem punição. O dia cobra justiça e proteção para quem informa.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Impunidade dos crimes contra jornalistas",
      "https://www.un.org/en/observances/end-impunity-crimes-against-journalists",
    ),
  },
  {
    diaMes: "11-19",
    titulo: "Dia Mundial do Banheiro",
    descricao:
      "Cobra saneamento básico e água tratada para todas as casas. O dia liga a saúde pública à dignidade de ter onde cuidar de si.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial do Banheiro",
      "https://www.un.org/en/observances/toilet-day",
    ),
  },
  {
    diaMes: "11-20",
    titulo: "Dia da Consciência Negra — Zumbi dos Palmares",
    descricao:
      "Data da morte de Zumbi dos Palmares, em 1695, símbolo da resistência quilombola. É o dia da luta antirracista no Brasil.",
    tipo: ["quilombo", "direitos"],
    fonte: {
      autor: "Fundação Cultural Palmares",
      titulo: "Zumbi dos Palmares e o 20 de novembro",
      ano: "2026",
      url: "https://www.gov.br/palmares/pt-br",
      orgao: "Palmares",
    },
  },
  {
    diaMes: "11-25",
    titulo: "Dia Internacional pela Eliminação da Violência contra a Mulher",
    descricao:
      "Lembra as irmãs Mirabal, assassinadas em 1960. É o dia de dizer basta à violência contra as mulheres.",
    tipo: ["direitos", "resistencia"],
    fonte: onu(
      "ONU — Eliminação da violência contra a mulher",
      "https://www.un.org/en/observances/ending-violence-against-women-day",
    ),
  },
  {
    diaMes: "12-01",
    titulo: "Dia Mundial de Luta contra a AIDS",
    descricao:
      "Cobra prevenção, diagnóstico e tratamento para todas as pessoas. O dia combate o preconceito que ainda cerca a doença.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Dia Mundial de Luta contra a AIDS",
      "https://www.un.org/en/observances/world-aids-day",
    ),
  },
  {
    diaMes: "12-03",
    titulo: "Dia Internacional das Pessoas com Deficiência",
    descricao:
      "Afirma os direitos das pessoas com deficiência e cobra acessibilidade. O dia denuncia as barreiras que a sociedade impõe.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Pessoas com deficiência",
      "https://www.un.org/en/observances/day-of-persons-with-disabilities",
    ),
  },
  {
    diaMes: "12-05",
    titulo: "Dia Mundial do Solo",
    descricao:
      "Alerta para a degradação do solo que sustenta a comida. O dia cobra manejo que proteja a terra e quem vive dela.",
    tipo: ["campo"],
    fonte: onu(
      "ONU — Dia Mundial do Solo",
      "https://www.un.org/en/observances/world-soil-day",
    ),
  },
  {
    diaMes: "12-09",
    titulo: "Dia Internacional contra a Corrupção",
    descricao:
      "Marca a Convenção da ONU de 2003. O dia cobra transparência, controle social e punição de quem desvia o dinheiro público.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Combate à corrupção",
      "https://www.un.org/en/observances/anti-corruption-day",
    ),
  },
  {
    diaMes: "12-10",
    titulo: "Dia Internacional dos Direitos Humanos",
    descricao:
      "Data da Declaração Universal dos Direitos Humanos, adotada em 1948. É a régua que os movimentos populares usam para cobrar o Estado.",
    tipo: ["direitos", "anistia"],
    fonte: onu(
      "ONU — Declaração Universal dos Direitos Humanos",
      "https://www.un.org/en/observances/human-rights-day",
    ),
  },
  {
    diaMes: "12-11",
    titulo: "Dia Internacional das Montanhas",
    descricao:
      "Chama atenção para os povos e ecossistemas das montanhas. São nasceres de rios e lares de comunidades tradicionais.",
    tipo: ["campo", "indigena"],
    fonte: onu(
      "ONU — Dia Internacional das Montanhas",
      "https://www.un.org/en/observances/mountain-day",
    ),
  },
  {
    diaMes: "12-12",
    titulo: "Dia Internacional da Cobertura Universal de Saúde",
    descricao:
      "Cobra saúde de qualidade para todas as pessoas, sem deixar ninguém fora. É a defesa do SUS e da saúde como direito.",
    tipo: ["direitos"],
    fonte: onu(
      "ONU — Cobertura universal de saúde",
      "https://www.un.org/en/observances/universal-health-coverage-day",
    ),
  },
];

/**
 * O dia de referência marcado nesta data, ou `null`.
 *
 * `diaMes` chega no formato "MM-DD" (ex.: "03-14"), normalmente vindo de
 * `chaveDiaMes(new Date())` para usar o fuso local de quem lê. Não achou =
 * dia comum, e o título da home fica só com a data.
 */
export function referenciaDoDia(diaMes: string): DataReferencia | null {
  return DATAS_REFERENCIA.find((d) => d.diaMes === diaMes) ?? null;
}

/**
 * A data por extenso no fuso local de quem lê, em pt-BR — ex.: "4 de
 * outubro", "7 de setembro". O dia sai sem zero à esquerda (padrão do
 * `Intl`), como no exemplo do dono ("7 de setembro").
 */
export function diaMesPorExtenso(data: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(data);
}

/**
 * Título do cartão da home. Sempre traz a data do visitante; quando a data
 * é um dia de referência, acrescenta o nome depois de " - ".
 *
 * Ex.: "Mística do Dia 4 de outubro" e
 * "Mística do Dia 7 de setembro - Dia da Independência do Brasil".
 */
export function tituloMisticaDoDia(
  data: Date,
  referencia: DataReferencia | null,
): string {
  const base = `Mística do Dia ${diaMesPorExtenso(data)}`;
  return referencia ? `${base} - ${referencia.titulo}` : base;
}
