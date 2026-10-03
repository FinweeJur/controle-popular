/**
 * Complementos indígenas da memória — revoltas e resistências dos povos
 * originários do Brasil e da América Latina (Quechua, Maia, Inka, Aimara,
 * Mapuche, Taíno, Lenca...).
 *
 * POR QUE EXISTE: o `lib/memoria/calendario.ts` é GERADO (MST 2009 + Blog Aos
 * que Virão) e não se edita à mão. Este arquivo é uma fonte versionada a MAIS,
 * somada ao calendário em `correcoes.ts`. Pedido do dono (03/10/2026):
 * "mais das revoltas indígenas e da América Latina dos povos quechua, maia,
 * inka"; e "não limite a 10".
 *
 * FONTE: verbetes da Wikipédia (fonte TERCIÁRIA, permitida pelo
 * PLANO-MEMORIA-RESISTENCIAS como último recurso) — cada item guarda a URL do
 * verbete. Onde o dia é conhecido (execução, levante, massacre), usa-se o dia;
 * o fato de período longo fica com `semData: true` e a tela avisa.
 */

import type { EntradaCalendario } from "./tipos";

const WIKI = {
  autor: "WIKIPÉDIA",
  orgao: "Wikipédia, a enciclopédia livre",
  fonteData: "2024",
} as const;

/** Atalho: verbete da Wikipédia com URL. */
function wiki(url: string, fonteCurta: string) {
  return { ...WIKI, url, fonteCurta };
}

export const COMPLEMENTOS_INDIGENAS: EntradaCalendario[] = [
  // ═══════════════════════ BRASIL ═══════════════════════
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Confedera%C3%A7%C3%A3o_dos_Tamoios",
      "Wikipédia, Confederação dos Tamoios",
    ),
    diaMes: "06-01",
    ano: "1567",
    semData: true,
    titulo: "Confederação dos Tamoios — a guerra dos povos tupis contra a colonização",
    tituloCurto: "Confederação dos Tamoios",
    tipo: ["indigena", "resistencia"],
    lugar: "Litoral do Rio de Janeiro e São Paulo",
    resumo:
      "Povos tupis do litoral se uniram contra a escravização portuguesa e o domínio de suas terras. Liderada por Cunhambebe, a Confederação dos Tamoios resistiu por mais de uma década, até 1567.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Potiguaras", "Wikipédia, Potiguaras"),
    diaMes: "08-01",
    ano: "1580",
    semData: true,
    titulo: "Resistência dos Potiguara contra os portugueses no Nordeste",
    tituloCurto: "Resistência dos Potiguara",
    tipo: ["indigena", "resistencia"],
    lugar: "Paraíba e Rio Grande do Norte",
    resumo:
      "Os Potiguara foram um dos povos que mais resistiram à colonização do Nordeste, aliando-se aos franceses e enfrentando os portugueses por décadas no fim do século XVI.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Guerra_dos_B%C3%A1rbaros",
      "Wikipédia, Guerra dos Bárbaros",
    ),
    diaMes: "09-01",
    ano: "1683",
    semData: true,
    titulo: "Confederação dos Cariris — a Guerra dos Bárbaros no sertão",
    tituloCurto: "Guerra dos Bárbaros (Cariris)",
    tipo: ["indigena", "resistencia"],
    lugar: "Sertão do Rio Grande do Norte e Ceará",
    resumo:
      "Por cerca de 30 anos, povos cariris e outros do sertão resistiram à expansão da pecuária e à escravização. A chamada Guerra dos Bárbaros (1683-1713) foi uma das maiores revoltas indígenas do período colonial.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Ajuricaba", "Wikipédia, Ajuricaba"),
    diaMes: "07-01",
    ano: "1723",
    semData: true,
    titulo: "Ajuricaba e a resistência dos Manaó no rio Negro",
    tituloCurto: "Resistência de Ajuricaba",
    tipo: ["indigena", "resistencia"],
    lugar: "Rio Negro, Amazonas",
    resumo:
      "O líder manaó Ajuricaba comandou a resistência dos povos do rio Negro contra a escravização e os descimentos portugueses entre 1723 e 1728. Preferiu a morte a se entregar, tornando-se símbolo da luta amazônica.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Guerra_Guaran%C3%ADtica",
      "Wikipédia, Guerra Guaranítica",
    ),
    diaMes: "02-01",
    ano: "1756",
    semData: true,
    titulo: "Guerra Guaranítica — os Guarani contra o Tratado de Madri",
    tituloCurto: "Guerra Guaranítica",
    tipo: ["indigena", "resistencia"],
    lugar: "Missões (RS) e América do Sul",
    resumo:
      "Os Guarani das missões se levantaram contra o Tratado de Madri (1750), que trocava suas terras entre Portugal e Espanha sem consultá-los. A resistência foi vencida em 1756, mas ficou como símbolo da luta pelo território.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Revolta_de_Mandu_Ladino", "Wikipédia, Mandu Ladino"),
    diaMes: "08-01",
    ano: "1712",
    semData: true,
    titulo: "Revolta de Mandu Ladino — índios e negros contra a colonização no Piauí",
    tituloCurto: "Revolta de Mandu Ladino",
    tipo: ["indigena", "resistencia"],
    lugar: "Piauí e Maranhão",
    resumo:
      "Entre 1712 e 1719, o líder indígena Mandu Ladino (Ambrósio) reuniu povos indígenas e negros numa revolta contra a expulsão de suas terras e os abusos dos colonos no sertão do Piauí.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Cabanagem", "Wikipédia, Cabanagem"),
    diaMes: "01-07",
    ano: "1835",
    titulo: "Cabanagem — a revolta em que os povos do Pará tomaram o poder",
    tituloCurto: "Cabanagem",
    tipo: ["indigena", "revolta", "resistencia"],
    lugar: "Belém e interior do Pará",
    resumo:
      "Em 7 de janeiro de 1835, indígenas, negros e ribeirinhos tomaram Belém e proclamaram um governo popular no Pará. A Cabanagem, com forte presença indígena, foi uma das maiores revoltas do Brasil e foi reprimida com violência extrema.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Balaiada", "Wikipédia, Balaiada"),
    diaMes: "12-13",
    ano: "1838",
    titulo: "Balaiada — a revolta do Maranhão e o papel dos povos originários",
    tituloCurto: "Balaiada",
    tipo: ["indigena", "revolta"],
    lugar: "Maranhão",
    resumo:
      "Na Balaiada (1838-1841), vaqueiros, negros e indígenas se levantaram contra as elites do Maranhão. Lideranças indígenas tiveram papel central no movimento, duramente reprimido pelo Império.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Massacre_de_Haximu",
      "Wikipédia, Massacre de Haximu",
    ),
    diaMes: "08-01",
    ano: "1993",
    semData: true,
    titulo: "Massacre de Haximu — garimpeiros contra os Yanomami",
    tituloCurto: "Massacre de Haximu",
    tipo: ["indigena", "resistencia"],
    lugar: "Roraima",
    resumo:
      "Em 1993, garimpeiros invadiram terras yanomami em Roraima e mataram cerca de 16 pessoas na aldeia de Haximu. O crime foi reconhecido pela Justiça como genocídio, num marco da luta pela terra indígena.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Mar%C3%A7al_de_Souza",
      "Wikipédia, Marçal de Souza",
    ),
    diaMes: "11-25",
    ano: "1983",
    titulo: "Assassinato de Marçal de Souza, liderança Guarani",
    tituloCurto: "Assassinato de Marçal de Souza",
    tipo: ["indigena", "resistencia"],
    lugar: "Campo Grande/MS",
    resumo:
      "Marçal de Souza, liderança do povo Guarani-Nhandeva, foi assassinado em 25 de novembro de 1983 por defender a demarcação das terras indígenas. Foi o primeiro indígena a discursar na ONU, em 1980.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Morte_de_Galdino_Jesus_dos_Santos",
      "Wikipédia, Morte de Galdino dos Santos",
    ),
    diaMes: "04-19",
    ano: "1997",
    titulo: "Morto um Pataxó em Brasília no Dia do Índio",
    tituloCurto: "Assassinato de Galdino (Pataxó)",
    tipo: ["indigena", "resistencia"],
    lugar: "Brasília/DF",
    resumo:
      "Na noite de 19 de abril de 1997, o indígena pataxó Galdino Jesus dos Santos foi queimado vivo enquanto dormia em uma parada de ônibus em Brasília. O crime chocou o país e marcou a luta pela dignidade dos povos indígenas.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Acampamento_Terra_Livre",
      "Wikipédia, Acampamento Terra Livre",
    ),
    diaMes: "04-01",
    ano: "2004",
    semData: true,
    titulo: "Primeiro Acampamento Terra Livre, em Brasília",
    tituloCurto: "Primeiro Acampamento Terra Livre",
    tipo: ["indigena", "direitos"],
    lugar: "Brasília/DF",
    resumo:
      "Em abril de 2004, povos indígenas de todo o país ocuparam a Esplanada dos Ministérios e o Congresso no primeiro Acampamento Terra Livre, a maior mobilização indígena do Brasil. Dela nasceu a Articulação dos Povos Indígenas do Brasil (APIB), em 2005.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Articula%C3%A7%C3%A3o_dos_Povos_Ind%C3%ADgenas_do_Brasil",
      "Wikipédia, APIB",
    ),
    diaMes: "11-01",
    ano: "2005",
    semData: true,
    titulo: "Criação da APIB — Articulação dos Povos Indígenas do Brasil",
    tituloCurto: "Criação da APIB",
    tipo: ["indigena", "direitos"],
    lugar: "Brasil",
    resumo:
      "Em novembro de 2005, por deliberação do Acampamento Terra Livre, foi criada a Articulação dos Povos Indígenas do Brasil (APIB), que reúne as organizações indígenas regionais de todo o país.",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/Crise_humanit%C3%A1ria_ianom%C3%A2mi",
      "Wikipédia, crise ianomâmi",
    ),
    diaMes: "01-20",
    ano: "2023",
    semData: true,
    titulo: "Emergência de saúde no território Yanomami",
    tituloCurto: "Crise humanitária Yanomami",
    tipo: ["indigena", "direitos"],
    lugar: "Território Yanomami (RR e AM)",
    resumo:
      "Em janeiro de 2023, o governo decretou emergência de saúde no território Yanomami, diante da desnutrição e das mortes causadas pelo garimpo ilegal e pela contaminação por mercúrio.",
  },
  // ═══════════════════════ AMÉRICA LATINA ═══════════════════════
  {
    ...wiki("https://pt.wikipedia.org/wiki/Hatuey", "Wikipédia, Hatuey"),
    diaMes: "02-02",
    ano: "1512",
    titulo: "Hatuey, o primeiro grande levante contra os espanhóis no Caribe",
    tituloCurto: "Resistência de Hatuey",
    tipo: ["indigena", "resistencia"],
    lugar: "Cuba e Hispaniola",
    resumo:
      "O cacique taíno Hatuey liderou a resistência dos povos do Caribe à invasão espanhola. Capturado e queimado vivo em 1512, tornou-se símbolo da luta indígena contra a colônia.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Enriquillo", "Wikipédia, Enriquillo"),
    diaMes: "09-01",
    ano: "1519",
    semData: true,
    titulo: "Rebelião de Enriquillo — os taínos cercam os espanhóis",
    tituloCurto: "Rebelião de Enriquillo",
    tipo: ["indigena", "resistencia"],
    lugar: "Ilha de Hispaniola",
    resumo:
      "Entre 1519 e 1533, o cacique taíno Enriquillo comandou uma longa rebelião contra os abusos espanhóis na ilha de Hispaniola e chegou a um acordo de paz inédito com a Coroa.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Lautaro", "Wikipédia, Lautaro"),
    diaMes: "04-29",
    ano: "1557",
    titulo: "Lautaro e a resistência Mapuche contra os conquistadores",
    tituloCurto: "Lautaro e a resistência Mapuche",
    tipo: ["indigena", "resistencia"],
    lugar: "Chile (Arauco)",
    resumo:
      "O jovem mapuche Lautaro aprendeu as táticas espanholas e as virou contra eles, liderando a resistência que matou o conquistador Pedro de Valdivia em 1553. Lautaro caiu em combate em 1557.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Caupolic%C3%A1n", "Wikipédia, Caupolicán"),
    diaMes: "10-01",
    ano: "1558",
    semData: true,
    titulo: "Caupolicán, toqui mapuche executado pelos espanhóis",
    tituloCurto: "Caupolicán e o Arauco",
    tipo: ["indigena", "resistencia"],
    lugar: "Chile (Arauco)",
    resumo:
      "Caupolicán dirigiu a resistência mapuche na Guerra de Arauco e foi capturado e executado pelos espanhóis em 1558. É uma das figuras centrais da epopeia \"La Araucana\".",
  },
  {
    ...wiki(
      "https://pt.wikipedia.org/wiki/T%C3%BApac_Amaru_I",
      "Wikipédia, Túpac Amaru I",
    ),
    diaMes: "09-24",
    ano: "1572",
    titulo: "Morte de Túpac Amaru I e o fim da resistência inca de Vilcabamba",
    tituloCurto: "Túpac Amaru I e Vilcabamba",
    tipo: ["indigena", "resistencia"],
    lugar: "Vilcabamba, Peru",
    resumo:
      "Último Sapa Inca de Vilcabamba, Túpac Amaru I resistiu à conquista espanhola até ser capturado e executado em Cusco, em 1572 — o fim do Estado inca independente.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Jacinto_Canek", "Wikipédia, Jacinto Canek"),
    diaMes: "12-14",
    ano: "1761",
    titulo: "Rebelião de Jacinto Canek, no Yucatán maia",
    tituloCurto: "Rebelião de Jacinto Canek",
    tipo: ["indigena", "resistencia"],
    lugar: "Yucatán, México",
    resumo:
      "O líder maia Jacinto Canek levantou os povos do Yucatán contra o trabalho forçado e os tributos da Coroa espanhola. Derrotado, foi executado em 14 de dezembro de 1761; a rebelião marcou a memória maia.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/T%C3%BApac_Amaru_II", "Wikipédia, Túpac Amaru II"),
    diaMes: "05-18",
    ano: "1781",
    titulo: "Morte de Túpac Amaru II e a maior rebelião andina",
    tituloCurto: "Túpac Amaru II, a rebelião dos Andes",
    tipo: ["indigena", "resistencia"],
    lugar: "Cusco, Peru",
    resumo:
      "Túpac Amaru II liderou a maior insurreição indígena da América colonial, reunindo quechuas e aimarás contra o domínio espanhol. Foi executado em 18 de maio de 1781, em Cusco; sua luta inspira os povos andinos até hoje.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/T%C3%BApac_Katari", "Wikipédia, Túpac Katari"),
    diaMes: "11-15",
    ano: "1781",
    titulo: "Morte de Túpac Katari e o cerco aimará a La Paz",
    tituloCurto: "Túpac Katari e o cerco aimará",
    tipo: ["indigena", "resistencia"],
    lugar: "Alto Peru (Bolívia)",
    resumo:
      "O líder aimará Túpac Katari cercou a cidade de La Paz em 1781 com milhares de indígenas, na onda da rebelião de Túpac Amaru II. Foi executado em 15 de novembro de 1781, mas seu nome segue na luta dos povos andinos.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Bartolina_Sisa", "Wikipédia, Bartolina Sisa"),
    diaMes: "09-05",
    ano: "1782",
    titulo: "Morte de Bartolina Sisa, liderança aimará",
    tituloCurto: "Bartolina Sisa, mulher aimará",
    tipo: ["indigena", "resistencia"],
    lugar: "La Paz, Alto Peru (Bolívia)",
    resumo:
      "Bartolina Sisa, esposa e comandante ao lado de Túpac Katari, liderou o cerco aimará a La Paz. Foi executada em 5 de setembro de 1782; a data é hoje o Dia Internacional da Mulher Indígena.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Guerra_de_Castas", "Wikipédia, Guerra de Castas"),
    diaMes: "07-30",
    ano: "1847",
    titulo: "Guerra de Castas — a grande revolta maia no Yucatán",
    tituloCurto: "Guerra de Castas",
    tipo: ["indigena", "revolta"],
    lugar: "Yucatán, México",
    resumo:
      "Iniciada em julho de 1847, a Guerra de Castas foi a maior revolta maia contra a opressão dos descendentes de espanhóis no Yucatán, durando mais de 50 anos.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Massacre_de_Acteal", "Wikipédia, Massacre de Acteal"),
    diaMes: "12-22",
    ano: "1997",
    titulo: "Massacre de Acteal — 45 indígenas maias mortos no México",
    tituloCurto: "Massacre de Acteal",
    tipo: ["indigena", "resistencia"],
    lugar: "Chiapas, México",
    resumo:
      "Em 22 de dezembro de 1997, paramilitares mataram 45 indígenas tsotsiles, entre mulheres e crianças, na igreja de Acteal, em Chiapas. O massacre marcou a luta zapatista pela autonomia dos povos maias.",
  },
  {
    ...wiki("https://pt.wikipedia.org/wiki/Lempira", "Wikipédia, Lempira"),
    diaMes: "07-01",
    ano: "1537",
    semData: true,
    titulo: "Resistência de Lempira contra os espanhóis em Honduras",
    tituloCurto: "Resistência de Lempira",
    tipo: ["indigena", "resistencia"],
    lugar: "Honduras",
    resumo:
      "O líder lenca Lempira comandou cerca de 30 mil indígenas contra a invasão espanhola em Honduras e caiu em combate em 1537. É hoje símbolo nacional da resistência indígena na América Central.",
  },
];
