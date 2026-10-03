/**
 * Dias importantes dos povos indígenas — dados versionados da home.
 *
 * Papel no portal: alimentar o bloco exibido na home ANTES da frase da
 * Mística do Dia (pedido do dono, 03/10/2026): o leitor vê, no dia, qual é a
 * data significativa para os povos originários — nome, objetivo e contexto de
 * criação, em no máximo duas linhas.
 *
 * FONTE: páginas oficiais (ONU, UNESCO, Planalto) e verbetes de referência
 * (Wikipédia, terciária). Cada item guarda a URL. Só entra data com
 * confirmação histórica e objetivo claro.
 */

export interface DiaImportante {
  /** Dia e mês no formato "MM-DD" (o dia do visitante). */
  diaMes: string;
  /** Nome da data. */
  nome: string;
  /** Objetivo — por que a data existe (uma linha). */
  objetivo: string;
  /** Contexto de criação (quando e por quem). */
  contexto: string;
  /** Abrangência: Brasil, América Latina, Andes, Mundo... */
  abrangencia: string;
  /** Ano de criação/origem. */
  desde: string;
  /** Fonte linkável. */
  url: string;
  /** Fonte curta, para o rodapé do bloco. */
  fonte: string;
}

export const DIAS_IMPORTANTES: DiaImportante[] = [
  {
    diaMes: "02-21",
    nome: "Dia Internacional da Língua Materna",
    objetivo: "Proteger as línguas ameaçadas — entre elas as indígenas.",
    contexto: "Proclamado pela UNESCO em 1999; lembra o Bangladexe de 1952.",
    abrangencia: "Mundo",
    desde: "1999",
    url: "https://www.unesco.org/pt/days/mother-language",
    fonte: "UNESCO",
  },
  {
    diaMes: "04-19",
    nome: "Dia dos Povos Indígenas",
    objetivo: "Valorizar a diversidade dos povos originários e afirmar seus direitos.",
    contexto: "Criado em 1943 como \"Dia do Índio\"; a Lei 14.466/2022 o renomeou.",
    abrangencia: "Brasil",
    desde: "1943",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14466.htm",
    fonte: "Planalto (Lei 14.466/2022)",
  },
  {
    diaMes: "05-18",
    nome: "Morte de Túpac Amaru II",
    objetivo: "Honrar a maior rebelião indígena da América colonial.",
    contexto: "Líder quechua executado em Cusco em 18/05/1781.",
    abrangencia: "Andes (Peru)",
    desde: "1781",
    url: "https://pt.wikipedia.org/wiki/T%C3%BApac_Amaru_II",
    fonte: "Wikipédia, Túpac Amaru II",
  },
  {
    diaMes: "06-24",
    nome: "Inti Raymi",
    objetivo: "Festa do Sol e do começo do ano andino.",
    contexto: "Ritual inca do solstício, retomado em Cusco a partir de 1944.",
    abrangencia: "Andes (Quechua/Inka)",
    desde: "1944 (retomada)",
    url: "https://pt.wikipedia.org/wiki/Inti_Raymi",
    fonte: "Wikipédia, Inti Raymi",
  },
  {
    diaMes: "08-09",
    nome: "Dia Internacional dos Povos Indígenas",
    objetivo: "Chamar o mundo a proteger os direitos dos povos originários.",
    contexto: "Instituído pela ONU em 1994 (Resolução 49/214).",
    abrangencia: "Mundo",
    desde: "1994",
    url: "https://www.un.org/pt/observances/indigenous-day",
    fonte: "ONU",
  },
  {
    diaMes: "09-05",
    nome: "Dia Internacional da Mulher Indígena",
    objetivo: "Celebrar e defender as mulheres dos povos originários.",
    contexto: "Definido no Encontro de Tiahuanaco (1983), em memória de Bartolina Sisa (1782).",
    abrangencia: "Mundo / Andes",
    desde: "1983",
    url: "https://pt.wikipedia.org/wiki/Bartolina_Sisa",
    fonte: "Wikipédia, Bartolina Sisa",
  },
  {
    diaMes: "09-24",
    nome: "Morte de Túpac Amaru I e fim de Vilcabamba",
    objetivo: "Lembrar o último Estado inca independente.",
    contexto: "Último Sapa Inca, executado em Cusco em 24/09/1572.",
    abrangencia: "Andes (Inka)",
    desde: "1572",
    url: "https://pt.wikipedia.org/wiki/T%C3%BApac_Amaru_I",
    fonte: "Wikipédia, Túpac Amaru I",
  },
  {
    diaMes: "10-05",
    nome: "Constituição de 1988",
    objetivo: "Marcar o reconhecimento dos direitos originários no art. 231.",
    contexto: "Promulgada em 05/10/1988; base da luta contra o marco temporal.",
    abrangencia: "Brasil",
    desde: "1988",
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    fonte: "Planalto (CF/1988)",
  },
  {
    diaMes: "10-12",
    nome: "Dia da Resistência Indígena",
    objetivo: "Afirmar os 500 anos de resistência dos povos originários.",
    contexto: "Contraponto ao antigo \"Dia da Raça\"; marca a chegada europeia de 1492.",
    abrangencia: "América Latina",
    desde: "1992 (difusão)",
    url: "https://pt.wikipedia.org/wiki/Dia_da_Resist%C3%AAncia_Ind%C3%ADgena",
    fonte: "Wikipédia, Dia da Resistência Indígena",
  },
  {
    diaMes: "11-15",
    nome: "Morte de Túpac Katari",
    objetivo: "Honrar o líder aimará do cerco a La Paz.",
    contexto: "Executado em 15/11/1781, na rebelião andina de 1780-1781.",
    abrangencia: "Andes (Aymara)",
    desde: "1781",
    url: "https://pt.wikipedia.org/wiki/T%C3%BApac_Katari",
    fonte: "Wikipédia, Túpac Katari",
  },
  {
    diaMes: "12-14",
    nome: "Rebelião de Jacinto Canek",
    objetivo: "Lembrar o levante maia no Yucatán.",
    contexto: "Canek executado em 14/12/1761 por liderar o levante.",
    abrangencia: "México (Maya)",
    desde: "1761",
    url: "https://pt.wikipedia.org/wiki/Jacinto_Canek",
    fonte: "Wikipédia, Jacinto Canek",
  },
  {
    diaMes: "12-22",
    nome: "Massacre de Acteal",
    objetivo: "Não esquecer os 45 maias mortos em Chiapas.",
    contexto: "Ataque paramilitar de 22/12/1997 contra tsotsiles reunidos em oração.",
    abrangencia: "México (Maya)",
    desde: "1997",
    url: "https://pt.wikipedia.org/wiki/Massacre_de_Acteal",
    fonte: "Wikipédia, Massacre de Acteal",
  },
];
