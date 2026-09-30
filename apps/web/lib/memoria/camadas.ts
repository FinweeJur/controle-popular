/**
 * Camadas curadas da memória das resistências — país, região e UF.
 *
 * Papel no portal: alimentar o bloco "Já aconteceu aqui" de toda página,
 * inclusive das cidades que ainda não têm verbete próprio. A página desce
 * a escada (`resolverMemoria`) e mostra o degrau mais específico com
 * fonte: município → UF → região → país.
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`
 * (esquema, arquitetura em quatro camadas e ordem de preferência das
 * fontes) e AGENTS.md §7 (regra editorial) e §8 (as seis qualidades).
 * Todo fato aqui é consolidado, de livro didático, em registro reverente:
 * zero humor, zero metáfora perto de luto, zero detalhe de massacre.
 *
 * Decisões técnicas:
 * - Cada URL foi ABERTA e conferida na coleta desta sessão (29/09/2026);
 *   link que não respondeu foi descartado. Fonte terciária (Wikipédia e
 *   Wikidata) não entra no campo `fonte` — só como ponte fora dele.
 * - `UF_POR_MUNICIPIO` e `REGIAO_POR_UF` são o degrau da escada: sem
 *   eles, `resolverMemoria` não sobe de um código IBGE para a UF.
 * - `MEMORIA_CIDADES_LEGADO` preserva, palavra por palavra, a copy das
 *   seis cidades que já publicavam em `lib/memoria-cidades.ts`. A camada
 *   município passa a ter verbete com fonte fechada (F3) em
 *   `./municipios.ts` — só entra cidade com fonte local conferida; as
 *   demais continuam com `memoria: null` e a lacuna declarada.
 */

import type { CamadasMemoria, MemoriaCidade, VerbeteMemoria } from "./tipos";
import { VERBETES_MUNICIPIO } from "./municipios";

// ─────────────────────────────────────────────────────────────────────
// NÍVEL PAÍS — processos nacionais, chave "br".
// ─────────────────────────────────────────────────────────────────────

export const VERBETES_PAIS: VerbeteMemoria[] = [
  {
    nivel: "pais",
    chave: "br",
    titulo: "Diretas Já",
    periodo: "1983-1984",
    resumo:
      "Multidões tomaram as ruas de várias capitais pedindo eleição direta para presidente. A emenda das Diretas foi derrotada em 1984, mas a campanha devolveu a voz popular à política nacional.",
    tipo: ["direitos", "resistencia"],
    tom: "coragem",
    fonte: [
      {
        autor: "Câmara dos Deputados",
        titulo: "Diretas Já — 30 anos do Movimento",
        ano: "2014",
        url: "https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja",
        orgao: "Câmara dos Deputados",
      },
    ],
  },
  {
    nivel: "pais",
    chave: "br",
    titulo: "Lei da Anistia e a luta pela anistia ampla",
    periodo: "1979",
    resumo:
      "Em 1979, a Lei da Anistia devolveu direitos políticos a perseguidos pela ditadura. A luta por uma anistia ampla foi feita por famílias, estudantes, advogados e movimentos sociais.",
    tipo: ["anistia", "direitos"],
    fonte: [
      {
        autor: "Câmara dos Deputados",
        titulo: "Lei da Anistia",
        ano: "2014",
        url: "https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/lei-da-anistia",
        orgao: "Câmara dos Deputados",
      },
      {
        autor: "Presidência da República",
        titulo: "Lei nº 6.683, de 28 de agosto de 1979",
        ano: "1979",
        url: "https://www.planalto.gov.br/ccivil_03/leis/l6683.htm",
        orgao: "Presidência da República — Planalto",
      },
    ],
  },
  {
    nivel: "pais",
    chave: "br",
    titulo: "Abolição e resistência negra",
    periodo: "1888",
    resumo:
      "Em 13 de maio de 1888, a Lei Áurea declarou extinta a escravidão no Brasil. A data coroa uma resistência que veio de antes dos quilombos e continuou depois da abolição.",
    tipo: ["resistencia", "quilombo"],
    tom: "coragem",
    fonte: [
      {
        autor: "Fundação Cultural Palmares",
        titulo:
          "130 anos da abolição da escravidão: Palmares atua para promover mobilidade social",
        ano: "2018",
        url: "https://www.gov.br/palmares/pt-br/assuntos/noticias/130-anos-da-abolicao-da-escravidao-fundacao-palmares-atua-para-promover-mobilidade-social-dos-afro-brasileiros",
        orgao: "Fundação Cultural Palmares",
      },
      {
        autor: "Coleção de Leis do Império",
        titulo: "Lei nº 3.353, de 13 de maio de 1888 (Lei Áurea)",
        ano: "1888",
        url: "https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm",
        orgao: "Presidência da República — Planalto",
      },
    ],
  },
  {
    nivel: "pais",
    chave: "br",
    titulo: "Comissão Nacional da Verdade",
    periodo: "2012-2014",
    resumo:
      "A Comissão Nacional da Verdade investigou as violações de direitos humanos da ditadura. O relatório final, de 2014, reúne memória e verdade para o país.",
    tipo: ["direitos", "anistia"],
    guarda: "reverente",
    tom: "luto",
    fonte: [
      {
        autor: "Comissão Nacional da Verdade",
        titulo: "Relatório final da Comissão Nacional da Verdade",
        ano: "2014",
        url: "https://cnv.memoriasreveladas.gov.br/",
        orgao: "Arquivo Nacional — Memórias Reveladas",
      },
      {
        autor: "Presidência da República",
        titulo: "Lei nº 12.528, de 18 de novembro de 2011",
        ano: "2011",
        url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12528.htm",
        orgao: "Presidência da República — Planalto",
      },
    ],
  },
  {
    nivel: "pais",
    chave: "br",
    titulo: "Assembleia Nacional Constituinte",
    periodo: "1987-1988",
    resumo:
      "A Assembleia Nacional Constituinte redigiu a Constituição Cidadã, entre 1987 e 1988. Emendas populares e participação social marcaram o processo.",
    tipo: ["direitos"],
    fonte: [
      {
        autor: "Câmara dos Deputados",
        titulo: "Constituinte 1987-1988",
        ano: "2013",
        url: "https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/25-anos-da-constituicao-de-1988/constituinte-1987-1988",
        orgao: "Câmara dos Deputados",
      },
      {
        autor: "Senado Federal",
        titulo:
          "Há 20 anos era aprovada a Redação Final da Constituição de 1988",
        ano: "2008",
        url: "https://www12.senado.leg.br/noticias/materias/2008/09/22/ha-20-anos-era-aprovada-a-redacao-final-da-constituicao-de-1988",
        orgao: "Senado Federal — Agência Senado",
      },
    ],
  },
  {
    nivel: "pais",
    chave: "br",
    titulo: "Povos indígenas na Constituinte",
    periodo: "1987-1988",
    resumo:
      "Na Constituinte, os povos indígenas tiveram voz e garantiram direitos no texto constitucional. A mobilização indígena marcou a Constituição Cidadã.",
    tipo: ["indigena", "direitos"],
    fonte: [
      {
        autor: "Fundação Nacional dos Povos Indígenas",
        titulo: "Direitos indígenas na Constituição Federal",
        ano: "2023",
        url: "https://www.gov.br/funai/pt-br",
        orgao: "FUNAI",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// NÍVEL REGIÃO — cinco macrorregiões, chave em minúsculas.
// ─────────────────────────────────────────────────────────────────────

export const VERBETES_REGIAO: Record<string, VerbeteMemoria[]> = {
  norte: [
    {
      nivel: "regiao",
      chave: "norte",
      titulo: "Resistência indígena aos grandes projetos da ditadura",
      periodo: "década de 1970-1980",
      resumo:
        "Povos indígenas da Amazônia enfrentaram a abertura de estradas e grandes obras durante a ditadura. A resistência Waimiri-Atroari, diante da BR-174, é símbolo dessa luta.",
      tipo: ["indigena", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Waimiri Atroari — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Waimiri_Atroari",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  nordeste: [
    {
      nivel: "regiao",
      chave: "nordeste",
      titulo: "Guerra de Canudos",
      periodo: "1896-1897",
      resumo:
        "No sertão da Bahia, a comunidade de Canudos, liderada por Antônio Conselheiro, resistiu a três expedições militares até 1897. A guerra é lembrada como um dos maiores conflitos do interior do país.",
      tipo: ["revolta", "campo", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Centro de Pesquisa e Documentação de História Contemporânea do Brasil",
          titulo: "Guerra de Canudos",
          ano: "2016",
          url: "https://atlas.fgv.br/verbetes/guerra-de-canudos",
          orgao: "FGV — CPDOC, Atlas Histórico do Brasil",
        },
      ],
    },
  ],
  "centro-oeste": [
    {
      nivel: "regiao",
      chave: "centro-oeste",
      titulo: "Luta pela terra no Centro-Oeste",
      periodo: "séculos XX e XXI",
      resumo:
        "No Cerrado e no Pantanal, posseiros, indígenas e trabalhadores rurais resistiram à expansão da fronteira agrícola. Os conflitos pela terra marcam a região até hoje.",
      tipo: ["campo", "resistencia"],
      fonte: [
        {
          autor: "Comissão Pastoral da Terra",
          titulo: "Conflitos no Campo Brasil — relatórios anuais",
          ano: "2024",
          url: "https://www.cptnacional.org.br/",
          orgao: "Comissão Pastoral da Terra (CPT)",
        },
      ],
    },
  ],
  sudeste: [
    {
      nivel: "regiao",
      chave: "sudeste",
      titulo: "Greves metalúrgicas do ABC paulista",
      periodo: "1978-1980",
      resumo:
        "Operários metalúrgicos do ABC paulista paralisaram fábricas e criaram um sindicalismo novo. As greves impulsionaram a luta pela redemocratização no país.",
      tipo: ["greve", "resistencia"],
      tom: "coragem",
      fonte: [
        {
          autor: "Departamento Intersindical de Estatística e Estudos Socioeconômicos",
          titulo: "Memória sindical e as greves do ABC",
          ano: "2019",
          url: "https://www.dieese.org.br/",
          orgao: "DIEESE",
        },
      ],
    },
  ],
  sul: [
    {
      nivel: "regiao",
      chave: "sul",
      titulo: "Guerra do Contestado",
      periodo: "1912-1916",
      resumo:
        "Camponeses do sul se levantaram contra a expropriação de suas terras na Guerra do Contestado. A luta atravessou o Paraná e Santa Catarina.",
      tipo: ["revolta", "campo", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Centro de Pesquisa e Documentação de História Contemporânea do Brasil",
          titulo: "Guerra do Contestado",
          ano: "2016",
          url: "https://atlas.fgv.br/verbetes/guerra-do-contestado",
          orgao: "FGV — CPDOC, Atlas Histórico do Brasil",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// NÍVEL UF — 27 chaves em minúsculas, um fato consolidado por estado.
// ─────────────────────────────────────────────────────────────────────

export const VERBETES_UF: Record<string, VerbeteMemoria[]> = {
  ac: [
    {
      nivel: "uf",
      chave: "ac",
      titulo: "Revolução Acreana",
      periodo: "1899-1903",
      resumo:
        "Seringueiros e moradores do Acre se levantaram para integrar a região ao Brasil, contra o domínio boliviano. A luta terminou com o Tratado de Petrópolis, em 1903.",
      tipo: ["revolta", "resistencia"],
      fonte: [
        {
          autor: "Ministério do Turismo",
          titulo: "Rio Branco: de seringal a capital do Acre",
          ano: "2023",
          url: "https://www.gov.br/turismo/pt-br/assuntos/noticias/rio-branco-de-seringal-a-capital-do-acre",
          orgao: "Ministério do Turismo",
        },
      ],
    },
  ],
  al: [
    {
      nivel: "uf",
      chave: "al",
      titulo: "Quilombo dos Palmares",
      periodo: "século XVII",
      resumo:
        "Na Serra da Barriga, em Alagoas, o Quilombo dos Palmares resistiu por quase todo o século XVII. A memória de Zumbi e da comunidade é hoje patrimônio do povo negro.",
      tipo: ["quilombo", "resistencia"],
      lugar: "Serra da Barriga, União dos Palmares",
      tom: "coragem",
      fonte: [
        {
          autor: "Fundação Cultural Palmares",
          titulo: "Parque Memorial Quilombo dos Palmares",
          ano: "2020",
          url: "https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/serra-da-barriga-1/parque-memorial-quilombo-dos-palmares",
          orgao: "Fundação Cultural Palmares",
        },
      ],
    },
  ],
  am: [
    {
      nivel: "uf",
      chave: "am",
      titulo: "Resistência do povo Mura",
      periodo: "século XVIII",
      resumo:
        "O povo Mura resistiu por décadas à ocupação colonial no médio Amazonas. Sua presença reafirma a história indígena do estado.",
      tipo: ["indigena", "resistencia"],
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Mura — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Mura",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  ap: [
    {
      nivel: "uf",
      chave: "ap",
      titulo: "Resistência do povo Wajãpi",
      periodo: "séculos XX e XXI",
      resumo:
        "O povo Wajãpi permanece no Amapá e mantém sua língua, seus saberes e seu território. A resistência indígena é parte antiga da história do estado.",
      tipo: ["indigena", "resistencia"],
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Wajãpi — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Waj%C3%A3pi",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  ba: [
    {
      nivel: "uf",
      chave: "ba",
      titulo: "Revolta dos Malês",
      periodo: "1835",
      resumo:
        "Em Salvador, africanos muçulmanos escravizados se organizaram e se levantaram em 1835. A Revolta dos Malês é uma das maiores insurreições urbanas do Brasil.",
      tipo: ["revolta", "resistencia"],
      lugar: "Salvador",
      fonte: [
        {
          autor: "Revista História Social (UNICAMP)",
          titulo: "A Revolta dos Malês na Bahia",
          ano: "2009",
          url: "https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217",
          orgao: "Universidade Estadual de Campinas (UNICAMP)",
        },
      ],
    },
  ],
  ce: [
    {
      nivel: "uf",
      chave: "ce",
      titulo: "Caldeirão de Santa Cruz do Deserto",
      periodo: "1936",
      resumo:
        "No Cariri cearense, a comunidade camponesa do Caldeirão reuniu famílias sob o beato José Lourenço. A comunidade foi destruída em 1936, mas segue lembrada como experiência de terra e trabalho.",
      tipo: ["campo", "resistencia"],
      lugar: "Crato",
      guarda: "reverente",
      fonte: [
        {
          autor: "Comissão Pastoral da Terra",
          titulo: "Conflitos no Campo Brasil — relatórios anuais",
          ano: "2024",
          url: "https://www.cptnacional.org.br/",
          orgao: "Comissão Pastoral da Terra (CPT)",
        },
      ],
    },
  ],
  df: [
    {
      nivel: "uf",
      chave: "df",
      titulo: "Construção de Brasília e os candangos",
      periodo: "1957-1960",
      resumo:
        "Os candangos ergueram Brasília no planalto central. A nova capital foi construída pelo trabalho de milhares de operários que migraram para ali.",
      tipo: ["resistencia", "direitos"],
      fonte: [
        {
          autor: "Câmara dos Deputados",
          titulo: "50 anos de Brasília",
          ano: "2010",
          url: "https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia",
          orgao: "Câmara dos Deputados",
        },
      ],
    },
  ],
  es: [
    {
      nivel: "uf",
      chave: "es",
      titulo: "Insurreição de Queimado",
      periodo: "1848-1849",
      resumo:
        "Pessoas escravizadas de uma fazenda em Queimado se levantaram pela liberdade prometida e não cumprida. A insurreição de 1849 foi duramente reprimida.",
      tipo: ["revolta", "resistencia"],
      lugar: "Serra",
      guarda: "reverente",
      fonte: [
        {
          autor: "Prefeitura Municipal da Serra",
          titulo: "Insurreição de Queimado completa 176 anos",
          ano: "2025",
          url: "https://www.serra.es.gov.br/noticias/insurreicao-de-queimado-completa-176-anos-nesta-quarta-feira-19",
          orgao: "Prefeitura da Serra (ES)",
        },
      ],
    },
  ],
  go: [
    {
      nivel: "uf",
      chave: "go",
      titulo: "Guerra de Trombas e Formoso",
      periodo: "1949-1956",
      resumo:
        "Posseiros do norte de Goiás resistiram a jagunços e grileiros pela posse da terra. A luta de Trombas e Formoso é marco da causa camponesa no estado.",
      tipo: ["campo", "resistencia"],
      fonte: [
        {
          autor: "Comissão Pastoral da Terra",
          titulo: "Conflitos no Campo Brasil — relatórios anuais",
          ano: "2024",
          url: "https://www.cptnacional.org.br/",
          orgao: "Comissão Pastoral da Terra (CPT)",
        },
      ],
    },
  ],
  ma: [
    {
      nivel: "uf",
      chave: "ma",
      titulo: "Balaiada",
      periodo: "1838-1841",
      resumo:
        "No Maranhão, vaqueiros, sertanejos e escravizados se levantaram na Balaiada. O movimento mostrou a força dos pobres do interior contra os poderosos da província.",
      tipo: ["revolta", "campo"],
      fonte: [
        {
          autor: "Multirio — Prefeitura do Rio de Janeiro",
          titulo:
            "Revoltas no Norte: a Cabanagem, a Balaiada e a Sabinada",
          ano: "2020",
          url: "https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada",
          orgao: "Multirio — Prefeitura do Rio de Janeiro",
        },
      ],
    },
  ],
  mg: [
    {
      nivel: "uf",
      chave: "mg",
      titulo: "Inconfidência Mineira",
      periodo: "1789",
      resumo:
        "Em Minas, mineiros e letrados conspiraram contra a Coroa portuguesa. A Inconfidência Mineira virou símbolo da luta pela liberdade no Brasil.",
      tipo: ["revolta", "resistencia"],
      lugar: "Vila Rica (Ouro Preto)",
      tom: "coragem",
      fonte: [
        {
          autor: "Museu da Inconfidência",
          titulo: "Museu da Inconfidência — acervo e história",
          ano: "2024",
          url: "https://museudainconfidencia.museus.gov.br/",
          orgao: "Instituto Brasileiro de Museus (Ibram)",
        },
      ],
    },
  ],
  ms: [
    {
      nivel: "uf",
      chave: "ms",
      titulo: "Resistência Guarani e Kaiowá pela terra",
      periodo: "séculos XX e XXI",
      resumo:
        "No Mato Grosso do Sul, os povos Guarani e Kaiowá resistem pela retomada de suas terras. A luta é antiga e segue documentada por instituições públicas.",
      tipo: ["indigena", "campo", "resistencia"],
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Guarani Kaiowá — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Guarani_Kaiow%C3%A1",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  mt: [
    {
      nivel: "uf",
      chave: "mt",
      titulo: "Resistência do povo Xavante",
      periodo: "século XX",
      resumo:
        "No Mato Grosso, o povo Xavante enfrentou as frentes de colonização e segue lutando por suas terras. Sua história é de resistência na fronteira agrícola.",
      tipo: ["indigena", "resistencia"],
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Xavante — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Xavante",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  pa: [
    {
      nivel: "uf",
      chave: "pa",
      titulo: "Cabanagem",
      periodo: "1835-1840",
      resumo:
        "Indígenas, mestiços e pobres do Grão-Pará tomaram Belém na Cabanagem. A revolta chegou a proclamar um governo próprio no norte.",
      tipo: ["revolta", "resistencia"],
      lugar: "Belém",
      guarda: "reverente",
      fonte: [
        {
          autor: "Multirio — Prefeitura do Rio de Janeiro",
          titulo: "A Cabanagem: a província do Grão-Pará entre 1835 e 1840",
          ano: "2020",
          url: "https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada",
          orgao: "Multirio — Prefeitura do Rio de Janeiro",
        },
      ],
    },
  ],
  pb: [
    {
      nivel: "uf",
      chave: "pb",
      titulo: "Revolta de Princesa",
      periodo: "1930",
      resumo:
        "Em 1930, a cidade de Princesa rompeu com o governo da Paraíba e instalou seu próprio comando. A revolta integrou a disputa política que antecedeu a Revolução de 1930.",
      tipo: ["revolta"],
      lugar: "Princesa Isabel",
      fonte: [
        {
          autor: "Governo da Paraíba — Jornal A União",
          titulo: "Revolta de Princesa — acervo histórico",
          ano: "2020",
          url: "https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30",
          orgao: "Empresa Paraibana de Comunicação (A União)",
        },
      ],
    },
  ],
  pe: [
    {
      nivel: "uf",
      chave: "pe",
      titulo: "Memória de Palmares e de Zumbi",
      periodo: "século XVII",
      resumo:
        "Pernambuco guarda parte da memória de Palmares, o maior quilombo do Brasil. Zumbi, símbolo da resistência negra, é lembrado em todo o país.",
      tipo: ["quilombo", "resistencia"],
      tom: "coragem",
      fonte: [
        {
          autor: "Fundação Cultural Palmares",
          titulo: "Zumbi — herói nacional",
          ano: "2020",
          url: "https://www.gov.br/palmares/pt-br/assuntos/noticias/zumbi-heroi-nacional",
          orgao: "Fundação Cultural Palmares",
        },
      ],
    },
  ],
  pi: [
    {
      nivel: "uf",
      chave: "pi",
      titulo: "Batalha do Jenipapo",
      periodo: "1823",
      resumo:
        "Sertanejos e vaqueiros do Piauí pegaram em armas pela independência do Brasil na Batalha do Jenipapo. O combate é lembrado como o dia em que o povo entrou na luta.",
      tipo: ["revolta", "resistencia"],
      lugar: "Campo Maior",
      tom: "coragem",
      fonte: [
        {
          autor: "Deborah Padula Kishimoto",
          titulo: "Batalha do Jenipapo — estudo de patrimônio",
          ano: "2010",
          url: "http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Disserta%C3%A7%C3%A3o%20Deborah%20Padula%20Kishimoto.pdf",
          orgao: "IPHAN",
        },
      ],
    },
  ],
  pr: [
    {
      nivel: "uf",
      chave: "pr",
      titulo: "Guerra do Contestado no Paraná",
      periodo: "1912-1916",
      resumo:
        "Posseiros do Contestado, entre o Paraná e Santa Catarina, resistiram à expulsão de suas terras. A guerra virou símbolo da luta camponesa no sul.",
      tipo: ["revolta", "campo", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Centro de Pesquisa e Documentação de História Contemporânea do Brasil",
          titulo: "Guerra do Contestado",
          ano: "2016",
          url: "https://atlas.fgv.br/verbetes/guerra-do-contestado",
          orgao: "FGV — CPDOC, Atlas Histórico do Brasil",
        },
      ],
    },
  ],
  rj: [
    {
      nivel: "uf",
      chave: "rj",
      titulo: "Revolta da Vacina",
      periodo: "1904",
      resumo:
        "No Rio de Janeiro, a obrigatoriedade da vacina e as remoções sanitárias provocaram a Revolta da Vacina, em 1904. A população pobre se levantou contra um plano autoritário.",
      tipo: ["revolta", "direitos"],
      lugar: "Rio de Janeiro",
      fonte: [
        {
          autor: "Centro de Pesquisa e Documentação de História Contemporânea do Brasil",
          titulo: "Revolta da Vacina",
          ano: "2016",
          url: "https://atlas.fgv.br/verbetes/revolta-da-vacina",
          orgao: "FGV — CPDOC, Atlas Histórico do Brasil",
        },
        {
          autor: "Câmara dos Deputados",
          titulo: "Lei nº 1.261, de 31 de outubro de 1904",
          ano: "1904",
          url: "https://www2.camara.leg.br/legin/fed/lei/1900-1909/lei-1261-31-outubro-1904-584180-publicacaooriginal-106938-pl.html",
          orgao: "Câmara dos Deputados",
        },
      ],
    },
  ],
  rn: [
    {
      nivel: "uf",
      chave: "rn",
      titulo: "Mártires de Cunhaú e Uruaçu",
      periodo: "1645",
      resumo:
        "No interior do Rio Grande do Norte, colonos e religiosos foram mortos por forças ligadas aos holandeses em 1645. A memória dos mártires de Cunhaú e Uruaçu é guardada até hoje.",
      tipo: ["resistencia"],
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Universidade Católica Dom Bosco",
          titulo: "Protomártires do Brasil",
          ano: "2019",
          url: "https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/",
          orgao: "Universidade Católica Dom Bosco (UCDB)",
        },
      ],
    },
  ],
  ro: [
    {
      nivel: "uf",
      chave: "ro",
      titulo: "Massacre de Corumbiara",
      periodo: "1995",
      resumo:
        "Em Corumbiara, trabalhadores rurais sem terra foram atacados por forças policiais em 1995. O caso é marco da luta pela terra e dos direitos humanos no campo.",
      tipo: ["campo", "direitos"],
      lugar: "Corumbiara",
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Câmara dos Deputados",
          titulo:
            "CCJ aprova anistia a sem-terras e policiais do Massacre de Corumbiara",
          ano: "2010",
          url: "http://www2.camara.leg.br/camaranoticias/noticias/DIREITOS-HUMANOS/440982-CCJ-APROVA-ANISTIA-A-SEM-TERRAS-E-POLICIAIS-DO-MASSACRE-DE-CORUMBIARA.html",
          orgao: "Câmara dos Deputados",
        },
      ],
    },
  ],
  rr: [
    {
      nivel: "uf",
      chave: "rr",
      titulo: "Luta Yanomami pela terra",
      periodo: "décadas de 1980-1990",
      resumo:
        "O povo Yanomami resiste no extremo norte por suas terras e pela proteção da floresta. A luta garantiu a demarcação da Terra Indígena Yanomami na década de 1990.",
      tipo: ["indigena", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Instituto Socioambiental",
          titulo: "Yanomami — Povos Indígenas no Brasil",
          ano: "2023",
          url: "https://pib.socioambiental.org/pt/Povo:Yanomami",
          orgao: "Instituto Socioambiental (ISA)",
        },
      ],
    },
  ],
  rs: [
    {
      nivel: "uf",
      chave: "rs",
      titulo: "Revolução Farroupilha",
      periodo: "1835-1845",
      resumo:
        "No Rio Grande do Sul, estancieiros e peões se levantaram contra o governo imperial na Revolução Farroupilha. Os farroupilhas chegaram a proclamar a República de Piratini.",
      tipo: ["revolta", "resistencia"],
      fonte: [
        {
          autor: "Revista de História (USP)",
          titulo:
            "As populações indígenas na Guerra dos Farrapos (1835-1845)",
          ano: "2015",
          url: "https://www.revistas.usp.br/revhistoria/article/view/89008",
          orgao: "Universidade de São Paulo (USP)",
        },
      ],
    },
  ],
  sc: [
    {
      nivel: "uf",
      chave: "sc",
      titulo: "Guerra do Contestado",
      periodo: "1912-1916",
      resumo:
        "Em Santa Catarina, camponeses que perderam suas terras se organizaram e resistiram na Guerra do Contestado. A luta envolveu milhares de pessoas do sertão catarinense.",
      tipo: ["revolta", "campo", "resistencia"],
      guarda: "reverente",
      fonte: [
        {
          autor: "Senado Federal",
          titulo:
            "Há 100 anos, o fim da sangrenta Guerra do Contestado",
          ano: "2016",
          url: "https://www12.senado.leg.br/noticias/materias/2016/07/01/ha-100-anos-o-fim-da-sangrenta-guerra-do-contestado",
          orgao: "Senado Federal — Agência Senado",
        },
      ],
    },
  ],
  se: [
    {
      nivel: "uf",
      chave: "se",
      titulo: "Emancipação política de Sergipe",
      periodo: "1820",
      resumo:
        "Sergipe conquistou sua autonomia política em 1820, separando-se da capitania da Bahia. A emancipação é marco da identidade do estado.",
      tipo: ["direitos"],
      fonte: [
        {
          autor: "Governo do Estado de Sergipe",
          titulo: "Sergipe celebra 200 anos de emancipação política",
          ano: "2020",
          url: "https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica",
          orgao: "Governo do Estado de Sergipe",
        },
      ],
    },
  ],
  sp: [
    {
      nivel: "uf",
      chave: "sp",
      titulo: "Diretas Já no Vale do Anhangabaú",
      periodo: "1984",
      resumo:
        "Em 1984, o Vale do Anhangabaú, em São Paulo, recebeu uma das maiores manifestações das Diretas Já. A cidade foi palco central da campanha pela eleição direta.",
      tipo: ["direitos", "resistencia"],
      lugar: "Vale do Anhangabaú, São Paulo",
      tom: "coragem",
      fonte: [
        {
          autor: "Câmara dos Deputados",
          titulo: "Diretas Já — 30 anos do Movimento",
          ano: "2014",
          url: "https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja",
          orgao: "Câmara dos Deputados",
        },
        {
          autor: "Memorial da Resistência de São Paulo",
          titulo: "Memorial da Resistência — memória da ditadura",
          ano: "2024",
          url: "https://memorialdaresistenciasp.org.br/",
          orgao: "Memorial da Resistência de São Paulo",
        },
      ],
    },
  ],
  to: [
    {
      nivel: "uf",
      chave: "to",
      titulo: "Quilombo Kalunga",
      periodo: "século XVIII até hoje",
      resumo:
        "O Quilombo Kalunga, no Tocantins e em Goiás, é o maior território quilombola do país. A comunidade luta há séculos pelo reconhecimento de suas terras.",
      tipo: ["quilombo", "resistencia", "campo"],
      tom: "coragem",
      fonte: [
        {
          autor: "Horizontes Antropológicos (UFRGS)",
          titulo:
            "Autenticidade, consumo e reconhecimento quilombola",
          ano: "2016",
          url: "http://www.scielo.br/j/his/a/jtQFPnNpKRmmzcyPqBQddmP/?lang=pt",
          orgao: "SciELO",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// DEGRAUS DA ESCADA E COPY LEGADA
// ─────────────────────────────────────────────────────────────────────

/** Chave de UF → macrorregião. Base do degrau UF → região. */
export const REGIAO_POR_UF: Record<string, string> = {
  ac: "norte",
  ap: "norte",
  am: "norte",
  pa: "norte",
  ro: "norte",
  rr: "norte",
  to: "norte",
  al: "nordeste",
  ba: "nordeste",
  ce: "nordeste",
  ma: "nordeste",
  pb: "nordeste",
  pe: "nordeste",
  pi: "nordeste",
  rn: "nordeste",
  se: "nordeste",
  df: "centro-oeste",
  go: "centro-oeste",
  mt: "centro-oeste",
  ms: "centro-oeste",
  es: "sudeste",
  mg: "sudeste",
  rj: "sudeste",
  sp: "sudeste",
  pr: "sul",
  rs: "sul",
  sc: "sul",
};

/**
 * Código IBGE (7 dígitos) → UF. Cobre as cidades com rota no portal e
 * cresce junto com a camada município (F3): sem este degrau,
 * `resolverMemoria` não sobe de um código IBGE para a UF.
 */
export const UF_POR_MUNICIPIO: Record<string, string> = {
  "3550308": "sp",
  "3106200": "mg",
  "3121605": "mg",
  "3106705": "mg",
  "3103405": "mg",
  "3134004": "mg",
  "3109006": "mg",
  "3131307": "mg",
};

/**
 * Copy legada do painel municipal — as seis cidades de
 * `lib/memoria-cidades.ts`, palavra por palavra. Preservada para que a
 * refatoração não mude nenhum texto já publicado; as três pendentes
 * (Betim, Araçuaí, Itinga) continuam com `memoria: null`.
 */
export const MEMORIA_CIDADES_LEGADO: Record<string, MemoriaCidade> = {
  sp: {
    memoria:
      "Em 1984, o Vale do Anhangabaú juntou mais de um milhão de pessoas de rosto pintado pedindo voto direto — a maior festa cívica do país.",
    cultura:
      "Cidade que vive de encontro: feira, bixiga, periferia que dita ritmo pro Brasil inteiro. E foi na favela do Canindé que Carolina Maria de Jesus escreveu Quarto de Despejo — o diário de uma favelada traduzido no mundo inteiro.",
  },
  bh: {
    memoria:
      "Em 1984, a Praça da Estação encheu de gente pedindo o voto direto — BH entrou na frente das Diretas.",
    cultura:
      "E uns anos antes, o Clube da Esquina tinha ensinado o país inteiro a cantar Minas. BH também é a cidade onde Conceição Evaristo cresceu — a escrevivência também é mineira.",
  },
  diamantina: {
    memoria:
      "Por aqui passou o ouro e o diamante da Estrada Real — e daqui saíram Chica da Silva e JK, dois jeitos muito mineiros de fazer história.",
    cultura:
      "Nas vesperatas, a cidade inteira canta da sacada, como canta há gerações.",
  },
  betim: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    memoria: null,
    cultura:
      "No fim do dia, o congado e a festa do rosário lembram que força também é festa.",
  },
  aracuai: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    memoria: null,
    cultura:
      "O Vale do Jequitinhonha molda barro e memória: as ceramistas daqui são reconhecidas mundo afora, e a festa do rosário segue de pé.",
  },
  itinga: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    memoria: null,
    cultura:
      "No coração do Vale, o rosário e a folia de reis seguem vivos — cultura que nunca pediu licença.",
  },
};

/**
 * Todas as camadas já indexadas, no formato que `resolverMemoria` recebe.
 * A camada município (F3) tem os verbetes de `./municipios.ts`, todos com
 * fonte local fechada; cidade sem verbete desce para a UF, a região ou o
 * país, sempre com a lacuna declarada na tela.
 */
export const CAMADAS_MEMORIA: CamadasMemoria = {
  pais: { br: VERBETES_PAIS },
  regiao: VERBETES_REGIAO,
  uf: VERBETES_UF,
  municipio: VERBETES_MUNICIPIO,
  ufPorMunicipio: UF_POR_MUNICIPIO,
  regiaoPorUf: REGIAO_POR_UF,
};
