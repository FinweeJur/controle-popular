/**
 * @file apps/web/lib/europa-litigios/dados.ts
 * @description Dados verificáveis da subfrente de litígios transnacionais de
 * Mariana/Brumadinho na Europa.
 *
 * Fontes oficiais usadas e conferidas nesta coleta (30/10/2026):
 * - Find Case Law / The National Archives: [2025] EWHC 3001 (TCC),
 *   Município de Mariana v BHP Group (UK) Limited & Anor, julgamento de
 *   14/11/2025 pela Mrs Justice O'Farrell DBE (High Court, TCC).
 * - Suprema Corte do Reino Unido: Vedanta v Lungowe [2019] UKSC 20 e
 *   Okpabi v Royal Dutch Shell [2021] UKSC 3.
 * - Agência Brasil, Reuters, SBS, Mining.com, Mining Journal, Law Society
 *   Gazette, RFI, NDTV e Mongabay para os fatos jornalísticos datados.
 *
 * Decisões de honestidade:
 * - O número do processo inglês confere com a sentença oficial:
 *   HT-2022-000304 (e HT-2023-000058). O acervo antigo de /europa trazia
 *   HT-2022-000291; aqui vale o número da fonte oficial.
 * - O caso Braskem/Maceió é uma conexão holandesa, NÃO um litígio de
 *   Brumadinho. Por isso ele mora em `CONEXOES`, não em `LITIGIOS`.
 * - O caso Rio Doce Claims consta do acervo /europa, mas o portal
 *   Rechtspraak recusou a consulta nesta coleta (HTTP 403). Número e fase
 *   ficam marcados como pendentes.
 * - A ADPF NÃO é afirmada como 1318. O número está "a confirmar" até a
 *   consulta oficial no STF.
 * - Clipping traz metadado e link; nenhuma matéria é reproduzida.
 */

import type {
  Adpf,
  ConexaoTransnacional,
  FonteLitigio,
  ItemClipping,
  ItemLinhaDoTempo,
  Litigio,
  Posicionamento,
} from "./tipos";

/** Data única desta coleta, usada em todo o acervo. */
export const DATA_ACESSO = "2026-10-30";

const URL_SENTENCA_UK =
  "https://caselaw.nationalarchives.gov.uk/ewhc/tcc/2025/3001";
const URL_VEDANTA = "https://www.supremecourt.uk/cases/uksc-2017-0185.html";
const URL_OKPABI = "https://www.supremecourt.uk/cases/uksc-2018-0068.html";
const URL_RECHTSPRAAK = "https://uitspraken.rechtspraak.nl/";
const URL_STF_PROCESSOS = "https://portal.stf.jus.br/processos/";

const FONTE_SENTENCA_UK: FonteLitigio = {
  titulo:
    "High Court of Justice (TCC). Município de Mariana v BHP Group (UK) Limited & Anor, [2025] EWHC 3001 (TCC), 14/11/2025.",
  url: URL_SENTENCA_UK,
  tipo: "tribunal",
  dataAcesso: DATA_ACESSO,
};

const FONTE_VEDANTA: FonteLitigio = {
  titulo:
    "Supreme Court of the United Kingdom. Vedanta Resources PLC v Lungowe, [2019] UKSC 20, 10/04/2019.",
  url: URL_VEDANTA,
  tipo: "tribunal",
  dataAcesso: DATA_ACESSO,
};

const FONTE_OKPABI: FonteLitigio = {
  titulo:
    "Supreme Court of the United Kingdom. Okpabi v Royal Dutch Shell Plc, [2021] UKSC 3, 12/02/2021.",
  url: URL_OKPABI,
  tipo: "tribunal",
  dataAcesso: DATA_ACESSO,
};

const FONTE_RECHTSPRAAK: FonteLitigio = {
  titulo:
    "Rechtspraak.nl. Portal oficial de jurisprudência dos Países Baixos (consulta recusada com HTTP 403 nesta coleta).",
  url: URL_RECHTSPRAAK,
  tipo: "tribunal",
  dataAcesso: DATA_ACESSO,
};

/**
 * Litígios que pertencem aos dois rompimentos da frente.
 * Mariana tem dois: Inglaterra (confirmado) e Holanda (pendente).
 * Brumadinho não teve caso europeu confirmado nesta coleta.
 */
export const LITIGIOS: readonly Litigio[] = [
  {
    id: "mariana-bhp-inglaterra",
    caso: "mariana",
    titulo: "Mariana contra a BHP no High Court de Londres",
    jurisdicao: "Inglaterra e País de Gales",
    tribunal:
      "High Court of Justice — Business and Property Courts, Technology and Construction Court (TCC)",
    numeroProcesso: "HT-2022-000304 (e HT-2023-000058)",
    citacaoNeutra: "[2025] EWHC 3001 (TCC)",
    partes: {
      autores: [
        "Município de Mariana e outros autores (municípios, empresas e pessoas atingidas)",
      ],
      reus: ["BHP Group (UK) Limited", "BHP Group Limited"],
    },
    objeto:
      "Responsabilidade civil da BHP pelos danos do rompimento da barragem de Fundão, em Mariana (MG), em 05/11/2015.",
    faseProcessual:
      "Primeira etapa (responsabilidade) julgada em 14/11/2025. A sentença responsabiliza a BHP, mas não fixa o valor final da indenização; a segunda etapa e os temas consequentes seguem pendentes.",
    status: "em-andamento",
    fatos: [
      {
        descricao:
          "O rompimento da barragem de Fundão, em Mariana (MG), ocorreu em 05/11/2015 e atingiu a bacia do Rio Doce.",
        data: "2015-11-05",
        fonteUrl:
          "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "A ação inglesa foi movida pelo Município de Mariana e outros autores contra a BHP Group (UK) Limited e a BHP Group Limited.",
        fonteUrl: URL_SENTENCA_UK,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 14/11/2025, a High Court concluiu que a BHP é responsável objetivamente como poluidora (arts. 3º, IV, e 14, §1º, da Lei 6.938/1981) e também por culpa (art. 186 do Código Civil), afastando a responsabilidade societária dos arts. 116 e 117.",
        data: "2025-11-14",
        fonteUrl: URL_SENTENCA_UK,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "A sentença de responsabilidade não arbitrou a indenização; o tribunal marcou audiência consequente e segunda etapa para os demais temas.",
        data: "2025-11-14",
        fonteUrl: URL_SENTENCA_UK,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "A imprensa especializada noticiou que a ação é avaliada em até £36 bilhões. Esse valor é estimativa das partes, não indenização fixada na sentença.",
        fonteUrl:
          "https://www.mining.com/web/bhp-liable-for-2015-brazil-dam-collapse-uk-court-rules-in-mammoth-lawsuit/",
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Valor noticiado pela imprensa; não foi arbitrado na decisão de responsabilidade.",
      },
    ],
    atos: [
      {
        data: "2015-11-05",
        titulo: "Rompimento da barragem de Fundão",
        descricao:
          "O desastre de Mariana deu origem às ações de reparação no Brasil e no exterior.",
        fonteUrl:
          "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2019-04-10",
        titulo: "Precedente Vedanta na Suprema Corte do Reino Unido",
        descricao:
          "A Corte admitiu que a matriz britânica pode dever dever de cuidado por danos causados por subsidiária no exterior.",
        fonteUrl: URL_VEDANTA,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2021-02-12",
        titulo: "Precedente Okpabi na Suprema Corte do Reino Unido",
        descricao:
          "A Corte reafirmou a possibilidade de responsabilizar a matriz que exerce controle sobre a subsidiária.",
        fonteUrl: URL_OKPABI,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2024-10-21",
        titulo: "Início do julgamento em Londres",
        descricao:
          "Começou o julgamento britânico sobre a responsabilidade da BHP pelo desastre de Mariana.",
        fonteUrl:
          "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2025-03-05",
        titulo: "Retomada do julgamento",
        descricao:
          "A fase final do julgamento foi retomada em Londres, conforme a Agência Brasil.",
        fonteUrl:
          "https://agenciabrasil.ebc.com.br/en/justica/noticia/2025-03/tragedy-mariana-uk-trial-enters-its-final-phase",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2025-11-14",
        titulo: "Sentença de responsabilidade",
        descricao:
          "A High Court responsabilizou a BHP como poluidora e por culpa; não fixou indenização.",
        fonteUrl: URL_SENTENCA_UK,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-05-05",
        titulo: "Corte de Apelação nega recurso da BHP",
        descricao:
          "Segundo a imprensa especializada, a Corte de Apelação negou pedido da BHP para apelar da decisão de responsabilidade.",
        fonteUrl:
          "https://www.mining-journal.com/latin-america/news-analysis/4531003/british-court-denies-bhps-appeal-mariana-judgment",
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Fato noticiado pela imprensa; o inteiro teor da decisão de apelação não foi conferido nesta coleta.",
      },
      {
        data: "2026-10-19",
        titulo: "BHP perde discussão sobre custas",
        descricao:
          "Segundo o Law Society Gazette, a Corte de Apelação rejeitou a contestação da BHP sobre parte de uma ordem de custas.",
        fonteUrl:
          "https://www.lawgazette.co.uk/news/bhp-fails-to-challenge-interest-payment-order-in-brazil-dam-case/5128261.article",
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Fato noticiado pela imprensa; a decisão oficial não foi conferida nesta coleta.",
      },
    ],
    proximosPassos: [
      {
        descricao:
          "Segunda etapa para definir indenização e demais temas, em data a ser fixada pelo tribunal.",
        fonteUrl: URL_SENTENCA_UK,
      },
      {
        descricao:
          "Acompanhar eventual recurso e o cumprimento da decisão de responsabilidade.",
        pendente: true,
        observacaoPendencia: "Sem decisão oficial de recurso conferida nesta coleta.",
      },
      {
        descricao:
          "Conferir no STF a eventual ADPF relacionada ao acordo de reparação (número ainda não confirmado).",
        fonteUrl: URL_STF_PROCESSOS,
        pendente: true,
        observacaoPendencia: "O número 1318 não foi confirmado nesta coleta.",
      },
    ],
    fontes: [
      FONTE_SENTENCA_UK,
      FONTE_VEDANTA,
      FONTE_OKPABI,
      {
        titulo:
          "Agência Brasil. Tragedy in Mariana: companies' missteps listed before UK court, 22/10/2024.",
        url: "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
        tipo: "imprensa",
        dataAcesso: DATA_ACESSO,
      },
    ],
    dataAcesso: DATA_ACESSO,
    pendente: false,
  },
  {
    id: "mariana-rio-doce-claims-holanda",
    caso: "mariana",
    titulo: "Rio Doce Claims no Tribunal de Roterdã",
    jurisdicao: "Países Baixos",
    tribunal: "Rechtbank Rotterdam",
    numeroProcesso:
      "C/10/654890 / HA ZA 23-412 (conforme acervo /europa; não reconferido no portal oficial)",
    partes: {
      autores: ["Stichting Rio Doce Claims e atingidos representados"],
      reus: [
        "Samarco Iron Ore Europe B.V.",
        "Vale S.A.",
        "Samarco Mineração S.A.",
      ],
    },
    objeto:
      "Ação coletiva por indenizações suplementares e medidas patrimoniais relacionadas ao rompimento da barragem de Fundão.",
    faseProcessual:
      "Em instrução/julgamento, conforme o acervo /europa. O portal Rechtspraak recusou a consulta nesta coleta (HTTP 403); número e fase precisam de reconferência oficial.",
    status: "pendente",
    fatos: [
      {
        descricao:
          "A fundação holandesa Stichting Rio Doce Claims representa atingidos da bacia do Rio Doce em ação no Tribunal de Roterdã.",
        fonteUrl: URL_RECHTSPRAAK,
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Informação do acervo /europa; o inteiro teor não abriu nesta coleta (HTTP 403).",
      },
      {
        descricao:
          "A ação tem como rés a subsidiária holandesa da Samarco e a Vale S.A., conforme o acervo /europa.",
        fonteUrl: URL_RECHTSPRAAK,
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Partes e número do processo constam do acervo /europa, mas não foram conferidos no portal oficial nesta coleta.",
      },
    ],
    atos: [],
    proximosPassos: [
      {
        descricao:
          "Reconferir número, partes e fase no portal Rechtspraak antes de publicar como confirmado.",
        fonteUrl: URL_RECHTSPRAAK,
        pendente: true,
      },
    ],
    fontes: [FONTE_RECHTSPRAAK],
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia:
      "Caso citado no acervo /europa. O portal oficial recusou a consulta (HTTP 403) e o número/fase não foram confirmados nesta coleta.",
  },
];

/**
 * Conexões europeias que não são Mariana nem Brumadinho.
 * Braskem/Maceió entra aqui para não ser rotulada como Brumadinho.
 */
export const CONEXOES: readonly ConexaoTransnacional[] = [
  {
    id: "braskem-maceio-roterda",
    titulo:
      "Braskem em Roterdã — afundamento de Maceió (caso distinto de Brumadinho)",
    jurisdicao: "Países Baixos",
    tribunal: "Rechtbank Rotterdam",
    numeroProcesso:
      "C/10/606412 / HA ZA 20-1014 (ECLI:NL:RBROT:2024:6281), conforme acervo /europa",
    objeto:
      "Responsabilidade civil por danos do afundamento de bairros de Maceió (AL) provocado pela extração de sal-gema.",
    faseProcessual:
      "Sentença de responsabilidade noticiada para 17/07/2024, conforme o acervo /europa. O portal Rechtspraak recusou a consulta nesta coleta (HTTP 403); número, ECLI e fase precisam de reconferência oficial.",
    resumo:
      "Este é o caso holandês da Braskem sobre Maceió. Ele NÃO é um litígio de Brumadinho: entra nesta página como conexão transnacional citada pelo hub /europa, com a ressalva de que o inteiro teor não foi conferido nesta coleta.",
    fontes: [
      FONTE_RECHTSPRAAK,
      {
        titulo:
          "RFI. Brazil quake city families seek justice in Dutch court, 15/02/2024.",
        url: "https://www.rfi.fr/en/international-news/20240215-brazil-quake-city-families-seek-justice-in-dutch-court",
        tipo: "imprensa",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo:
          "NDTV. 'Still suffering': Brazil earthquake-hit families seek justice in Dutch court, 15/02/2024.",
        url: "https://www.ndtv.com/world-news/brazilian-earthquake-victims-seek-justice-in-dutch-court-5062852",
        tipo: "imprensa",
        dataAcesso: DATA_ACESSO,
      },
    ],
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia:
      "Número, ECLI e fase vêm do acervo /europa; a consulta ao portal oficial foi recusada (HTTP 403) nesta coleta.",
  },
];

/** Linha do tempo única, em ordem crescente de data. */
export const LINHA_DO_TEMPO: readonly ItemLinhaDoTempo[] = [
  {
    id: "fundao-2015",
    data: "2015-11-05",
    titulo: "Rompimento da barragem de Fundão",
    descricao:
      "A barragem de Fundão, em Mariana (MG), rompe e atinge a bacia do Rio Doce.",
    tipo: "desastre",
    fonteUrl:
      "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "vedanta-2019",
    data: "2019-04-10",
    titulo: "Vedanta: dever de cuidado da matriz",
    descricao:
      "A Suprema Corte do Reino Unido admite que a matriz pode responder por danos de subsidiária no exterior.",
    tipo: "decisao",
    fonteUrl: URL_VEDANTA,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "okpabi-2021",
    data: "2021-02-12",
    titulo: "Okpabi: controle da matriz importa",
    descricao:
      "A Suprema Corte reafirma que a matriz pode ser processada quando exerce controle sobre a subsidiária.",
    tipo: "decisao",
    fonteUrl: URL_OKPABI,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "braskem-audiencia-2024",
    data: "2024-02-15",
    titulo: "Famílias de Maceió levam o caso à Holanda",
    descricao:
      "Moradores de Maceió pedem justiça e reparação em corte holandesa, segundo a RFI.",
    tipo: "audiencia",
    fonteUrl:
      "https://www.rfi.fr/en/international-news/20240215-brazil-quake-city-families-seek-justice-in-dutch-court",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "braskem-sentenca-2024",
    data: "2024-07-17",
    titulo: "Sentença da Braskem em Roterdã (a confirmar)",
    descricao:
      "O acervo /europa registra sentença de responsabilidade contra a Braskem. O inteiro teor não foi conferido nesta coleta.",
    tipo: "decisao",
    fonteUrl: URL_RECHTSPRAAK,
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia:
      "Data e resultado constam do acervo /europa; portal Rechtspraak recusou a consulta (HTTP 403).",
  },
  {
    id: "londres-inicio-2024",
    data: "2024-10-21",
    titulo: "Começa o julgamento em Londres",
    descricao:
      "A High Court inicia o julgamento sobre a responsabilidade da BHP pelo desastre de Mariana.",
    tipo: "julgamento",
    fonteUrl:
      "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "londres-final-2025",
    data: "2025-03-05",
    titulo: "Julgamento entra na fase final",
    descricao:
      "A fase final do julgamento britânico é retomada em Londres, segundo a Agência Brasil.",
    tipo: "audiencia",
    fonteUrl:
      "https://agenciabrasil.ebc.com.br/en/justica/noticia/2025-03/tragedy-mariana-uk-trial-enters-its-final-phase",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "londres-sentenca-2025",
    data: "2025-11-14",
    titulo: "BHP responsabilizada na primeira etapa",
    descricao:
      "A High Court conclui que a BHP é responsável objetivamente como poluidora e também por culpa; a indenização não é fixada nesta etapa.",
    tipo: "decisao",
    fonteUrl: URL_SENTENCA_UK,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "apelacao-2026",
    data: "2026-05-05",
    titulo: "Corte de Apelação nega recurso da BHP",
    descricao:
      "Segundo a Mining Journal, a Corte de Apelação nega pedido da BHP para apelar da decisão de responsabilidade.",
    tipo: "decisao",
    fonteUrl:
      "https://www.mining-journal.com/latin-america/news-analysis/4531003/british-court-denies-bhps-appeal-mariana-judgment",
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia: "Fato noticiado pela imprensa; decisão oficial não conferida.",
  },
  {
    id: "cidades-acordo-2026",
    data: "2026-08-20",
    titulo: "Mariana e mais 18 cidades aderem ao acordo",
    descricao:
      "Segundo a Reuters, o acordo assinado e ratificado em outubro de 2024 passou a ter o apoio de 45 dos 49 municípios elegíveis.",
    tipo: "acordo",
    fonteUrl:
      "https://www.reuters.com/business/environment/mariana-18-more-brazil-cities-join-vale-bhp-dam-collapse-compensation-deal-2026-08-20/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "custas-2026",
    data: "2026-10-19",
    titulo: "BHP perde contestação sobre custas",
    descricao:
      "O Law Society Gazette noticia que a Corte de Apelação rejeitou a contestação da BHP sobre parte de uma ordem de custas.",
    tipo: "decisao",
    fonteUrl:
      "https://www.lawgazette.co.uk/news/bhp-fails-to-challenge-interest-payment-order-in-brazil-dam-case/5128261.article",
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia: "Fato noticiado pela imprensa; decisão oficial não conferida.",
  },
];

/** Clipping: metadado e link, sem reprodução da matéria. */
export const CLIPPING: readonly ItemClipping[] = [
  {
    id: "agencia-brasil-2024-10",
    veiculo: "Agência Brasil",
    data: "2024-10-22",
    titulo: "Tragedy in Mariana: companies' missteps listed before UK court",
    url: "https://agenciabrasil.ebc.com.br/en/justica/noticia/2024-10/tragedy-mariana-companies-missteps-listed-uk-court",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "agencia-brasil-2025-03",
    veiculo: "Agência Brasil",
    data: "2025-03-06",
    titulo: "Tragedy in Mariana: UK trial enters its final phase",
    url: "https://agenciabrasil.ebc.com.br/en/justica/noticia/2025-03/tragedy-mariana-uk-trial-enters-its-final-phase",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "mining-2025-11",
    veiculo: "Mining.com",
    data: "2025-11-13",
    titulo:
      "BHP liable for 2015 Brazil dam collapse, UK court rules in mammoth lawsuit",
    url: "https://www.mining.com/web/bhp-liable-for-2015-brazil-dam-collapse-uk-court-rules-in-mammoth-lawsuit/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "sbs-2025-11",
    veiculo: "SBS News",
    data: "2025-11-14",
    titulo:
      "Mining giant BHP can be held liable over deadly Brazilian dam collapse, UK court rules",
    url: "https://www.sbs.com.au/news/article/mining-giant-bhp-can-be-held-liable-over-deadly-brazilian-dam-collapse-uk-high-court-rules/nwomwtyq0",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "mining-journal-2026-05",
    veiculo: "The Mining Journal",
    data: "2026-05-05",
    titulo: "British court denies BHP's appeal against Mariana judgment",
    url: "https://www.mining-journal.com/latin-america/news-analysis/4531003/british-court-denies-bhps-appeal-mariana-judgment",
    idioma: "en",
    paywall: true,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "law-gazette-2026-10",
    veiculo: "Law Society Gazette",
    data: "2026-10-19",
    titulo: "BHP fails to challenge interest payment order in Brazil dam case",
    url: "https://www.lawgazette.co.uk/news/bhp-fails-to-challenge-interest-payment-order-in-brazil-dam-case/5128261.article",
    idioma: "en",
    paywall: true,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "reuters-2026-08",
    veiculo: "Reuters",
    data: "2026-08-20",
    titulo:
      "Mariana, 18 more Brazil cities join Vale-BHP dam collapse compensation deal",
    url: "https://www.reuters.com/business/environment/mariana-18-more-brazil-cities-join-vale-bhp-dam-collapse-compensation-deal-2026-08-20/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "rfi-2024-02",
    veiculo: "RFI",
    data: "2024-02-15",
    titulo: "Brazil quake city families seek justice in Dutch court",
    url: "https://www.rfi.fr/en/international-news/20240215-brazil-quake-city-families-seek-justice-in-dutch-court",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "ndtv-2024-02",
    veiculo: "NDTV",
    data: "2024-02-15",
    titulo:
      '"Still suffering": Brazil earthquake-hit families seek justice in Dutch court',
    url: "https://www.ndtv.com/world-news/brazilian-earthquake-victims-seek-justice-in-dutch-court-5062852",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "mongabay-2024-05",
    veiculo: "Mongabay",
    data: "2024-05-06",
    titulo:
      "In Brazil, half a century of salt mining sinks a city, displacing thousands",
    url: "https://news.mongabay.com/2024/05/in-brazil-half-a-century-of-salt-mining-sinks-a-city-displacing-thousands/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
];

/** Posicionamentos oficiais/institucionais, sempre com link. */
export const POSICIONAMENTOS: readonly Posicionamento[] = [
  {
    id: "tcc-sentenca",
    autor: "High Court of Justice (TCC) — Mrs Justice O'Farrell DBE",
    data: "2025-11-14",
    resumo:
      "A sentença responsabiliza a BHP na primeira etapa, sem fixar indenização, e marca audiência consequente.",
    url: URL_SENTENCA_UK,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "uksc-vedanta",
    autor: "Supreme Court of the United Kingdom",
    data: "2019-04-10",
    resumo:
      "A Corte admitiu o dever de cuidado da matriz britânica por danos de subsidiária no exterior.",
    url: URL_VEDANTA,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "uksc-okpabi",
    autor: "Supreme Court of the United Kingdom",
    data: "2021-02-12",
    resumo:
      "A Corte reafirmou que a matriz pode responder quando exerce controle sobre a subsidiária.",
    url: URL_OKPABI,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "bhp-canal",
    autor: "BHP",
    data: null,
    resumo:
      "Canal oficial de notícias da BHP. Não localizamos comunicado específico datado sobre a sentença de 14/11/2025 nesta coleta.",
    url: "https://www.bhp.com/news",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "vale-canal",
    autor: "Vale",
    data: null,
    resumo:
      "Página oficial da Vale. Não localizamos comunicado específico datado sobre litígio europeu nesta coleta.",
    url: "https://www.vale.com/",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "samarco-canal",
    autor: "Samarco",
    data: null,
    resumo:
      "Página oficial da Samarco. Não localizamos comunicado específico datado sobre os litígios europeus nesta coleta.",
    url: "https://www.samarco.com/home",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "braskem-canal",
    autor: "Braskem",
    data: null,
    resumo:
      "Página oficial da Braskem. Não localizamos comunicado específico datado sobre o caso de Roterdã nesta coleta.",
    url: "https://www.braskem.com.br/",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "mpf-canal",
    autor: "Ministério Público Federal (MPF)",
    data: null,
    resumo:
      "Portal oficial do MPF. Comunicado específico sobre os litígios europeus não localizado nesta coleta.",
    url: "https://www.mpf.mp.br/",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "pf-canal",
    autor: "Polícia Federal",
    data: null,
    resumo:
      "Portal oficial da Polícia Federal. Comunicado específico sobre os litígios europeus não localizado nesta coleta.",
    url: "https://www.gov.br/pf/pt-br",
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
  {
    id: "rechtspraak-canal",
    autor: "Rechtbank Rotterdam / Rechtspraak",
    data: null,
    resumo:
      "Portal oficial de jurisprudência holandesa. O inteiro teor não abriu nesta coleta (HTTP 403).",
    url: URL_RECHTSPRAAK,
    dataAcesso: DATA_ACESSO,
    pendente: true,
  },
];

/**
 * Bloco da ADPF. O número 1318 NÃO foi confirmado no STF nesta coleta;
 * por isso `numero` fica "a confirmar" e o texto explica a lacuna.
 */
export const ADPF: Adpf = {
  numero: "a confirmar",
  relator: "a confirmar",
  objeto:
    "Ação de descumprimento de preceito fundamental possivelmente relacionada ao acordo de reparação do Rio Doce/Mariana. O número 1318 não foi confirmado na consulta oficial desta coleta.",
  status: "a confirmar",
  datas: [{ rotulo: "Coleta", data: DATA_ACESSO }],
  links: [
    { titulo: "Consulta processual do STF", url: URL_STF_PROCESSOS },
    { titulo: "Portal do STF", url: "https://portal.stf.jus.br/" },
  ],
  relacaoComLitigios:
    "Se existir, a ADPF pode afetar a execução do acordo no Brasil, mas não substitui as ações na Inglaterra e na Holanda.",
  dataAcesso: DATA_ACESSO,
  pendente: true,
  observacao:
    "Não afirmamos que a ADPF é a 1318. O número e o relator só entram quando forem conferidos na consulta oficial do STF.",
};

/**
 * Lista as fontes únicas do acervo (litígios, conexões e clipping).
 * Usada no bloco final "Fontes" da página, sem duplicar URL.
 */
export function listarFontes(): FonteLitigio[] {
  const mapa = new Map<string, FonteLitigio>();
  const adicionar = (fonte: FonteLitigio) => {
    if (!mapa.has(fonte.url)) mapa.set(fonte.url, fonte);
  };

  for (const litigio of LITIGIOS) litigio.fontes.forEach(adicionar);
  for (const conexao of CONEXOES) conexao.fontes.forEach(adicionar);
  for (const item of CLIPPING) {
    adicionar({
      titulo: `${item.veiculo}: ${item.titulo}`,
      url: item.url,
      tipo: "imprensa",
      dataAcesso: item.dataAcesso,
    });
  }

  return [...mapa.values()].sort(
    (a, b) => a.tipo.localeCompare(b.tipo) || a.titulo.localeCompare(b.titulo)
  );
}
