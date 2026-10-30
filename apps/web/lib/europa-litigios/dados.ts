/**
 * @file apps/web/lib/europa-litigios/dados.ts
 * @description Dados da subfrente "Litígios transnacionais de Mariana e
 * Brumadinho na Europa".
 *
 * Fonte primária: sentença da High Court [2025] EWHC 3001 (TCC) e decisões
 * posteriores publicadas em caselaw.nationalarchives.gov.uk e judiciary.uk;
 * decisões holandesas em rechtspraak.nl; decisões do STF na ADPF 1178.
 * Data de acesso: 2026-10-30.
 *
 * Regra: fato sem fonte oficial ou sem data conferida fica com `pendente` e
 * o motivo visível. O número do processo holandês do Rio Doce ainda não foi
 * localizado; não é inventado.
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
  "https://www.judiciary.uk/judgments/municipio-de-mariana-v-bhp-group-2/";
const URL_EWHC_3001 =
  "https://caselaw.nationalarchives.gov.uk/ewhc/tcc/2025/3001";
const URL_COA_502 =
  "https://caselaw.nationalarchives.gov.uk/ewca/civ/2026/502";
const URL_COA_294 =
  "https://caselaw.nationalarchives.gov.uk/ewca/civ/2026/294";
const URL_EWHC_73 = "https://caselaw.nationalarchives.gov.uk/ewhc/tcc/2026/73";
const URL_COA_1319 =
  "https://caselaw.nationalarchives.gov.uk/ewca/civ/2026/1319";
const URL_UKSC_0048 = "https://www.supremecourt.uk/cases/uksc-2026-0048";
const URL_VEDANTA = "https://www.supremecourt.uk/cases/uksc-2017-0185.html";
const URL_OKPABI = "https://www.supremecourt.uk/cases/uksc-2018-0068.html";
const URL_BRASKEM_ECLI =
  "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBROT:2024:6662";
const URL_BRASKEM_NOTICIA =
  "https://www.rechtspraak.nl/organisatie-en-contact/organisatie/rechtbanken/rechtbank-rotterdam/nieuws/2024/07/aansprakelijkheid-voor-schade-in-brazilie";
const URL_RIO_DOCE_HOLANDA = "https://acoesdoriodoce.com/";
const URL_ADPF_1178 =
  "https://noticias.stf.jus.br/postsnoticias/stf-invalida-efeitos-de-decisao-da-justica-inglesa-sobre-desastres-ambientais-no-brasil/";
const URL_ADPF_ACORDO =
  "https://noticias.stf.jus.br/postsnoticias/stf-esclarece-que-acordos-do-caso-mariana-mg-dispensam-aprovacao-da-justica-britanica/";

const FONTE_SENTENCA_UK: FonteLitigio = {
  titulo:
    "High Court of Justice (TCC). Municipio de Mariana v BHP Group, [2025] EWHC 3001 (TCC), 14/11/2025.",
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

/** Litígios dos dois rompimentos. Brumadinho não teve caso europeu confirmado. */
export const LITIGIOS: readonly Litigio[] = [
  {
    id: "mariana-bhp-inglaterra",
    caso: "mariana",
    titulo: "Mariana contra a BHP no High Court de Londres",
    jurisdicao: "Inglaterra e País de Gales",
    tribunal:
      "High Court of Justice — Business and Property Courts, Technology and Construction Court (TCC)",
    numeroProcesso:
      "HT-2022-000304 e HT-2023-000058 (apelação CA-2025-001750; UKSC/2026/0048)",
    citacaoNeutra: "[2025] EWHC 3001 (TCC)",
    partes: {
      autores: [
        "Município de Mariana e demais autores identificados nos anexos das petições iniciais",
      ],
      reus: ["BHP Group (UK) Limited", "BHP Group Limited"],
    },
    objeto:
      "Responsabilidade civil da BHP pelos danos do rompimento da barragem de Fundão, em Mariana (MG), em 05/11/2015.",
    faseProcessual:
      "Responsabilidade decidida em 14/11/2025. A High Court negou permissão de recurso em 19/01/2026 e a Court of Appeal em 06/05/2026. A segunda fase (quantum) está marcada para abril de 2027. Em outubro de 2026, a Justiça confirmou o PGMBM como advogado dos autores.",
    status: "em-andamento",
    fatos: [
      {
        descricao:
          "O rompimento da barragem de Fundão, em Mariana (MG), ocorreu em 05/11/2015 e atingiu a bacia do Rio Doce.",
        data: "2015-11-05",
        fonteUrl: URL_EWHC_3001,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 2018, o Município de Mariana e outros autores ajuizaram a ação contra a BHP na Inglaterra.",
        fonteUrl: "https://pogustgoodhead.com/cases/mariana-dam-disaster/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em junho de 2023, a Supreme Court do Reino Unido recusou o recurso da BHP, encerrando a disputa sobre a jurisdição inglesa.",
        fonteUrl: "https://pogustgoodhead.com/cases/mariana-dam-disaster/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 08/07/2022, a Court of Appeal reverteu a extinção e restabeleceu a ação coletiva contra a BHP na Inglaterra.",
        data: "2022-07-08",
        fonteUrl: "https://caselaw.nationalarchives.gov.uk/ewca/civ/2022/951",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 14/11/2025, a High Court responsabilizou a BHP objetivamente como poluidora e subjetivamente pelo art. 186 do Código Civil, afastando a prescrição.",
        data: "2025-11-14",
        fonteUrl: URL_SENTENCA_UK,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "A sentença de responsabilidade não fixou indenização; a quantificação ficou para a segunda fase, prevista para 2027.",
        data: "2025-11-14",
        fonteUrl: URL_EWHC_3001,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 06/05/2026, a Court of Appeal negou permissão para a BHP recorrer das conclusões de responsabilidade.",
        data: "2026-05-06",
        fonteUrl: URL_COA_502,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 29/06/2026, a Supreme Court do Reino Unido negou permissão no caso de contempt ligado à anti-suit injunction (UKSC/2026/0048).",
        data: "2026-06-29",
        fonteUrl: URL_UKSC_0048,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 16/10/2026, a Court of Appeal negou o recurso da BHP sobre juros de custas.",
        data: "2026-10-16",
        fonteUrl: URL_COA_1319,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 26/06/2025, a High Court reconheceu indícios suficientes para a acusação de contempt criminal contra a BHP por descumprimento de ordem judicial.",
        data: "2025-06-26",
        fonteUrl:
          "https://pogustgoodhead.com/high-court-judge-determines-there-are-to-be-reasonable-grounds-to-allege-that-bhp-is-guilty-of-criminal-contempt/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 02 e 03/07/2025, a High Court realizou audiência para organizar a segunda fase, de quantificação dos danos.",
        data: "2025-07-02",
        fonteUrl:
          "https://pogustgoodhead.com/important-update-on-the-mariana-case-in-england-hearing-held-on-2-and-3-july-2025/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 04/12/2025, a High Court rejeitou pedido de anti-suit injunction da BHP para impedir depoimento do ex-presidente da Renova.",
        data: "2025-12-04",
        fonteUrl:
          "https://pogustgoodhead.com/pogust-goodhead-defeats-bhp-bid-to-block-deposition-of-former-renova-chief/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 12/10/2026, o juiz Waksman confirmou o PGMBM como advogado dos autores e invalidou a tentativa de transferência para outro escritório; a ordem selada saiu em 16/10/2026, com custas interinas de £300 mil.",
        data: "2026-10-12",
        fonteUrl:
          "https://pogustgoodhead.com/high-court-confirms-pgmbm-remains-solicitor/",
        dataAcesso: DATA_ACESSO,
      },
    ],
    atos: [
      {
        data: "2019-04-10",
        titulo: "Precedente Vedanta na Supreme Court",
        descricao:
          "A Corte admitiu que a matriz britânica pode dever dever de cuidado por danos causados por subsidiária no exterior.",
        fonteUrl: URL_VEDANTA,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2021-02-12",
        titulo: "Precedente Okpabi na Supreme Court",
        descricao:
          "A Corte reafirmou a possibilidade de responsabilizar a matriz que exerce controle sobre a subsidiária.",
        fonteUrl: URL_OKPABI,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2022-07-08",
        titulo: "Court of Appeal restabelece a ação coletiva",
        descricao:
          "A apelação reverteu a decisão que extinguia o caso e permitiu o prosseguimento contra a BHP.",
        fonteUrl: "https://caselaw.nationalarchives.gov.uk/ewca/civ/2022/951",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2024-10-21",
        titulo: "Início do julgamento de responsabilidade",
        descricao:
          "Começou em Londres a primeira fase do julgamento sobre a responsabilidade da BHP.",
        fonteUrl: URL_EWHC_3001,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2025-03-13",
        titulo: "Fim das audiências da primeira fase",
        descricao:
          "Encerraram as audiências de responsabilidade; a sentença foi proferida em novembro.",
        fonteUrl: URL_EWHC_3001,
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
        data: "2026-01-19",
        titulo: "High Court nega permissão de recurso",
        descricao:
          "A decisão sobre consequências e custos negou permissão para recorrer das conclusões de mérito.",
        fonteUrl: URL_EWHC_73,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-03-16",
        titulo: "Court of Appeal extingue acusação de contempt",
        descricao:
          "A Corte acolheu o recurso da BHP e extinguiu a acusação de contempt ligada à anti-suit injunction.",
        fonteUrl: URL_COA_294,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-05-06",
        titulo: "Court of Appeal nega recurso de responsabilidade",
        descricao:
          "A Corte negou permissão para a BHP recorrer das conclusões de responsabilidade.",
        fonteUrl: URL_COA_502,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-06-29",
        titulo: "Supreme Court nega permissão no contempt",
        descricao:
          "A Supreme Court negou permissão para recorrer no caso UKSC/2026/0048.",
        fonteUrl: URL_UKSC_0048,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-10-16",
        titulo: "Court of Appeal nega recurso sobre custas",
        descricao:
          "A Corte negou o recurso da BHP sobre juros de custas.",
        fonteUrl: URL_COA_1319,
        dataAcesso: DATA_ACESSO,
      },
    ],
    proximosPassos: [
      {
        descricao:
          "Segunda fase (quantum) marcada para abril de 2027; a conferência de gestão do caso ocorreu em 23/10/2026.",
        fonteUrl:
          "https://pogustgoodhead.com/high-court-confirms-pgmbm-remains-solicitor-for-mariana-case-claimants/",
      },
      {
        descricao:
          "Acompanhar a execução e os efeitos da ADPF 1178 sobre acordos e decisões estrangeiras.",
        fonteUrl: URL_ADPF_1178,
      },
    ],
    fontes: [
      FONTE_SENTENCA_UK,
      {
        titulo: "High Court. [2025] EWHC 3001 (TCC), texto integral.",
        url: URL_EWHC_3001,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Court of Appeal. [2026] EWCA Civ 502, 06/05/2026.",
        url: URL_COA_502,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Court of Appeal. [2026] EWCA Civ 294, 16/03/2026.",
        url: URL_COA_294,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "High Court. [2026] EWHC 73 (TCC), 19/01/2026.",
        url: URL_EWHC_73,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Court of Appeal. [2026] EWCA Civ 1319, 16/10/2026.",
        url: URL_COA_1319,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Supreme Court. UKSC/2026/0048.",
        url: URL_UKSC_0048,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo:
          "Find Case Law (National Archives). 85 decisões do caso Município de Mariana v BHP.",
        url: "https://caselaw.nationalarchives.gov.uk/search?query=Municipio+de+Mariana",
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      FONTE_VEDANTA,
      FONTE_OKPABI,
    ],
    dataAcesso: DATA_ACESSO,
    pendente: false,
  },
  {
    id: "mariana-rio-doce-claims-holanda",
    caso: "mariana",
    titulo: "Rio Doce Claims na Justiça holandesa",
    jurisdicao: "Países Baixos",
    tribunal: "Rechtbank Amsterdam",
    numeroProcesso: "não localizado nas fontes consultadas",
    partes: {
      autores: [
        "Stichting Ações do Rio Doce / Stichting Rio Doce Claims e atingidos representados",
      ],
      reus: ["Vale S.A.", "Samarco Iron Ore Europe B.V."],
    },
    objeto:
      "Ação coletiva por indenizações e medidas patrimoniais relacionadas ao rompimento da barragem de Fundão.",
    faseProcessual:
      "Ajuizada em 18/03/2024. Teve audiência de gestão em 14/07/2025 e audiência sobre competência em 09/07/2026; a decisão de jurisdição era esperada em cerca de quatro meses. Sem julgamento de mérito até 30/10/2026.",
    status: "em-andamento",
    fatos: [
      {
        descricao:
          "A ação coletiva foi ajuizada na Holanda em 18/03/2024 por fundação que representa atingidos do Rio Doce.",
        data: "2024-03-18",
        fonteUrl: URL_RIO_DOCE_HOLANDA,
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 14/07/2025 houve audiência de gestão do processo na Justiça holandesa.",
        data: "2025-07-14",
        fonteUrl:
          "https://pogustgoodhead.com/cases/mariana-dam-disaster-netherlands/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 09/07/2026 a Justiça holandesa realizou audiência sobre sua competência para julgar a ação contra Vale e Samarco.",
        data: "2026-07-09",
        fonteUrl:
          "https://www.otempo.com.br/politica/2026/7/9/justica-da-holanda-analisa-nesta-quinta-feira-se-julga-acao-de-vitimas-de-mariana-contra-samarco",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "O número do processo não foi localizado nas fontes consultadas; o dado do acervo /europa não foi corroborado.",
        fonteUrl: URL_RIO_DOCE_HOLANDA,
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia:
          "Número não confirmado. Não publicamos número antigo sem conferência.",
      },
    ],
    atos: [
      {
        data: "2024-03-18",
        titulo: "Ajuizamento na Holanda",
        descricao:
          "Ação coletiva de atingidos do Rio Doce é proposta contra Vale e Samarco Iron Ore Europe.",
        fonteUrl: URL_RIO_DOCE_HOLANDA,
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2025-07-14",
        titulo: "Audiência de gestão",
        descricao: "Audiência de case management na Justiça holandesa.",
        fonteUrl:
          "https://pogustgoodhead.com/cases/mariana-dam-disaster-netherlands/",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-07-09",
        titulo: "Audiência sobre competência",
        descricao:
          "Discussão sobre se a Justiça holandesa julga a ação de Mariana contra Samarco.",
        fonteUrl:
          "https://www.otempo.com.br/politica/2026/7/9/justica-da-holanda-analisa-nesta-quinta-feira-se-julga-acao-de-vitimas-de-mariana-contra-samarco",
        dataAcesso: DATA_ACESSO,
      },
    ],
    proximosPassos: [
      {
        descricao:
          "Aguardar a decisão de competência e, depois, o calendário de mérito.",
        fonteUrl:
          "https://diariodocomercio.com.br/legislacao/vale-samarco-audiencia-holanda-mariana/",
      },
      {
        descricao: "Localizar o número oficial do processo no portal da Justiça holandesa.",
        pendente: true,
        observacaoPendencia: "Número ainda não localizado.",
      },
    ],
    fontes: [
      {
        titulo: "Ações do Rio Doce. Site oficial da ação coletiva.",
        url: URL_RIO_DOCE_HOLANDA,
        tipo: "documento",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Pogust Goodhead. Mariana dam disaster — Netherlands.",
        url: "https://pogustgoodhead.com/cases/mariana-dam-disaster-netherlands/",
        tipo: "documento",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "O Tempo. Justiça da Holanda analisa ação de vítimas de Mariana, 09/07/2026.",
        url: "https://www.otempo.com.br/politica/2026/7/9/justica-da-holanda-analisa-nesta-quinta-feira-se-julga-acao-de-vitimas-de-mariana-contra-samarco",
        tipo: "imprensa",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo: "Diário do Comércio. Vale e Samarco: audiência na Holanda, 10/07/2026.",
        url: "https://diariodocomercio.com.br/legislacao/vale-samarco-audiencia-holanda-mariana/",
        tipo: "imprensa",
        dataAcesso: DATA_ACESSO,
      },
    ],
    dataAcesso: DATA_ACESSO,
    pendente: true,
    observacaoPendencia:
      "Número do processo não localizado. Partes, datas e fase têm fonte; o número não.",
  },
  {
    id: "brumadinho-tuv-sud-alemanha",
    caso: "brumadinho",
    titulo: "Brumadinho contra a TÜV SÜD no Tribunal de Munique",
    jurisdicao: "Alemanha",
    tribunal: "Landgericht München I (Tribunal Regional de Munique)",
    numeroProcesso: "não localizado nas fontes consultadas",
    partes: {
      autores: [
        "Mais de 1.400 atingidos, além dos municípios de Brumadinho e Mário Campos",
      ],
      reus: ["TÜV SÜD"],
    },
    objeto:
      "Responsabilidade da certificadora TÜV SÜD por atestar a estabilidade da barragem da mina Córrego do Feijão antes do rompimento de 25/01/2019.",
    faseProcessual:
      "Ação em curso desde 2019, na fase de definição de responsabilidade. Em maio de 2026 o tribunal ouviu perito em barragens e especialista em direito brasileiro. A lei material aplicada é a brasileira; o rito é alemão.",
    status: "em-andamento",
    fatos: [
      {
        descricao:
          "O rompimento da barragem da mina Córrego do Feijão, em Brumadinho (MG), ocorreu em 25/01/2019 e matou 272 pessoas; duas vítimas nunca foram encontradas.",
        data: "2019-01-25",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Desde 2019, mais de 1.400 autores movem ações contra a TÜV SÜD, com pedidos que somam R$ 3,2 bilhões (cerca de € 600 milhões).",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Em 2023, a Justiça alemã nomeou um especialista em direito brasileiro; em dezembro de 2025, designou um segundo perito, especializado em geotecnia.",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "Os autores alegam que a TÜV SÜD usava padrões inferiores aos internacionais e que comunicações internas de maio de 2018 alertavam para o risco de perder contratos da Vale.",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
      },
      {
        descricao:
          "O número do processo no Tribunal de Munique não foi localizado nas fontes consultadas.",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
        pendente: true,
        observacaoPendencia: "Número não localizado; não é inventado.",
      },
    ],
    atos: [
      {
        data: "2026-05-26",
        titulo: "Audiências em Munique começam",
        descricao:
          "O Tribunal Regional de Munique inicia nova etapa de audiências com perito em barragens e especialista em direito brasileiro.",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        dataAcesso: DATA_ACESSO,
      },
      {
        data: "2026-05-28",
        titulo: "Fim das audiências de maio",
        descricao:
          "As sessões seguem até 28/05/2026; a próxima fase deve incluir prova testemunhal.",
        fonteUrl:
          "https://pogustgoodhead.com/brumadinho-dam-collapse-claim-progresses-following-three-days-hearing-in-munich/",
        dataAcesso: DATA_ACESSO,
      },
    ],
    proximosPassos: [
      {
        descricao:
          "Produção de prova testemunhal, incluindo depoimentos de executivos da TÜV SÜD.",
        fonteUrl:
          "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
      },
    ],
    fontes: [
      {
        titulo:
          "Pogust Goodhead. Caso Brumadinho avança na Alemanha com início de audiências em Munique, 26/05/2026.",
        url: "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
        tipo: "documento",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo:
          "Pogust Goodhead. Brumadinho dam collapse claim progresses following three days hearing in Munich, 29/05/2026.",
        url: "https://pogustgoodhead.com/brumadinho-dam-collapse-claim-progresses-following-three-days-hearing-in-munich/",
        tipo: "documento",
        dataAcesso: DATA_ACESSO,
      },
    ],
    dataAcesso: DATA_ACESSO,
    pendente: false,
    observacaoPendencia:
      "Caso confirmado; o número do processo em Munique não foi localizado.",
  },
];

/**
 * Conexão europeia que não é Mariana nem Brumadinho.
 * Braskem/Maceió entra aqui para não ser rotulada como Brumadinho.
 */
export const CONEXOES: readonly ConexaoTransnacional[] = [
  {
    id: "braskem-maceio-roterda",
    titulo:
      "Braskem em Roterdã — afundamento de Maceió (caso distinto de Brumadinho)",
    jurisdicao: "Países Baixos",
    tribunal: "Rechtbank Rotterdam",
    numeroProcesso: "C/10/618313 (ECLI:NL:RBROT:2024:6662)",
    objeto:
      "Responsabilidade civil por danos do afundamento de bairros de Maceió (AL) provocado pela extração de sal-gema.",
    faseProcessual:
      "Sentença de 24/07/2024: a Braskem S.A. foi responsabilizada e os pedidos contra as subsidiárias holandesas foram rejeitados; o quantum foi remetido à schadestaatprocedure. Apelação apresentada em 24/06/2025, sem decisão localizada até 30/10/2026.",
    resumo:
      "Este é o caso holandês da Braskem sobre Maceió. Ele NÃO é um litígio de Brumadinho: entra como conexão transnacional, com ECLI e link oficial da sentença.",
    fontes: [
      {
        titulo: "Rechtspraak.nl. ECLI:NL:RBROT:2024:6662, 24/07/2024.",
        url: URL_BRASKEM_ECLI,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo:
          "Rechtbank Rotterdam. Aansprakelijkheid voor schade in Brazilië, 24/07/2024.",
        url: URL_BRASKEM_NOTICIA,
        tipo: "tribunal",
        dataAcesso: DATA_ACESSO,
      },
      {
        titulo:
          "Business & Human Rights Resource Centre. Vitimas de Maceió apelam, 24/06/2025.",
        url: "https://www.business-humanrights.org/en/latest-news/netherlands-brazilian-victims-of-macei%C3%B3-sinking-appeal-ruling-that-found-liable-but-cleared-its-european-subsidiaries/",
        tipo: "documento",
        dataAcesso: DATA_ACESSO,
      },
    ],
    dataAcesso: DATA_ACESSO,
    pendente: false,
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
    fonteUrl: URL_EWHC_3001,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "vedanta-2019",
    data: "2019-04-10",
    titulo: "Vedanta: dever de cuidado da matriz",
    descricao:
      "A Supreme Court do Reino Unido admite que a matriz pode responder por danos de subsidiária no exterior.",
    tipo: "decisao",
    fonteUrl: URL_VEDANTA,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "okpabi-2021",
    data: "2021-02-12",
    titulo: "Okpabi: controle da matriz importa",
    descricao:
      "A Supreme Court reafirma que a matriz pode ser processada quando exerce controle sobre a subsidiária.",
    tipo: "decisao",
    fonteUrl: URL_OKPABI,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "coa-2022",
    data: "2022-07-08",
    titulo: "Court of Appeal restabelece a ação coletiva",
    descricao:
      "A Corte de Apelação reverte a extinção e mantém a ação de Mariana contra a BHP.",
    tipo: "decisao",
    fonteUrl: "https://caselaw.nationalarchives.gov.uk/ewca/civ/2022/951",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "rio-doce-holanda-2024",
    data: "2024-03-18",
    titulo: "Ação do Rio Doce é ajuizada na Holanda",
    descricao:
      "Ação coletiva contra Vale e Samarco Iron Ore Europe é proposta na Justiça holandesa.",
    tipo: "acao",
    fonteUrl: URL_RIO_DOCE_HOLANDA,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "braskem-2024",
    data: "2024-07-24",
    titulo: "Braskem responsabilizada em Roterdã",
    descricao:
      "Sentença responsabiliza a Braskem S.A. pelo afundamento de Maceió e rejeita pedidos contra subsidiárias holandesas.",
    tipo: "decisao",
    fonteUrl: URL_BRASKEM_ECLI,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "adpf-liminar-2024",
    data: "2024-10-14",
    titulo: "Dino concede liminar na ADPF 1178",
    descricao:
      "O STF manda municípios apresentarem contratos com escritórios estrangeiros e discute a soberania.",
    tipo: "decisao",
    fonteUrl:
      "https://noticias.stf.jus.br/postsnoticias/stf-determina-que-municipios-apresentem-contratos-com-escritorios-de-advocacia-em-outros-paises/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "londres-inicio-2024",
    data: "2024-10-21",
    titulo: "Começa o julgamento em Londres",
    descricao:
      "A High Court inicia o julgamento sobre a responsabilidade da BHP pelo desastre de Mariana.",
    tipo: "julgamento",
    fonteUrl: URL_EWHC_3001,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "londres-fim-2025",
    data: "2025-03-13",
    titulo: "Fim das audiências em Londres",
    descricao: "Encerra a primeira fase do julgamento de responsabilidade.",
    tipo: "audiencia",
    fonteUrl: URL_EWHC_3001,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "contempt-2025",
    data: "2025-06-26",
    titulo: "High Court vê indícios de contempt da BHP",
    descricao:
      "O juiz Constable rejeitou o pedido da BHP para extinguir a acusação de contempt criminal por descumprimento de ordem judicial.",
    tipo: "decisao",
    fonteUrl:
      "https://pogustgoodhead.com/high-court-judge-determines-there-are-to-be-reasonable-grounds-to-allege-that-bhp-is-guilty-of-criminal-contempt/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "fase2-2025",
    data: "2025-07-02",
    titulo: "Audiência da fase de danos",
    descricao:
      "A High Court realiza audiência de dois dias para organizar a segunda fase, de quantificação dos danos.",
    tipo: "audiencia",
    fonteUrl:
      "https://pogustgoodhead.com/important-update-on-the-mariana-case-in-england-hearing-held-on-2-and-3-july-2025/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "holanda-gestao-2025",
    data: "2025-07-14",
    titulo: "Audiência de gestão na Holanda",
    descricao: "A Justiça holandesa realiza audiência de gestão da ação do Rio Doce.",
    tipo: "audiencia",
    fonteUrl:
      "https://pogustgoodhead.com/cases/mariana-dam-disaster-netherlands/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "adpf-eficacia-2025",
    data: "2025-08-18",
    titulo: "STF afasta eficácia automática de decisão estrangeira",
    descricao:
      "Na ADPF 1178, o STF suspende a eficácia de decisões e leis estrangeiras não incorporadas pelo Brasil.",
    tipo: "decisao",
    fonteUrl: URL_ADPF_1178,
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
    id: "asi-2025",
    data: "2025-12-04",
    titulo: "High Court rejeita anti-suit injunction da BHP",
    descricao:
      "A Corte rejeitou pedido da BHP para impedir a colheita de depoimento do ex-presidente da Renova.",
    tipo: "decisao",
    fonteUrl:
      "https://pogustgoodhead.com/pogust-goodhead-defeats-bhp-bid-to-block-deposition-of-former-renova-chief/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "recusa-high-court-2026",
    data: "2026-01-19",
    titulo: "High Court nega permissão de recurso",
    descricao:
      "A juíza O'Farrell manteve a responsabilidade da BHP e negou permissão para recorrer do mérito.",
    tipo: "decisao",
    fonteUrl:
      "https://pogustgoodhead.com/high-court-refuses-bhp-permission-to-appeal/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "contempt-coa-2026",
    data: "2026-03-16",
    titulo: "Court of Appeal extingue acusação de contempt",
    descricao:
      "A Corte acolheu o recurso da BHP e extinguiu a acusação de contempt ligada à anti-suit injunction.",
    tipo: "decisao",
    fonteUrl: URL_COA_294,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "adpf-acordo-2026",
    data: "2026-04-15",
    titulo: "STF: acordo de Mariana não depende da Justiça inglesa",
    descricao:
      "Dino esclarece que acordos firmados no Brasil dispensam aprovação britânica e que sentença estrangeira só produz efeito após homologação.",
    tipo: "decisao",
    fonteUrl: URL_ADPF_ACORDO,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "recusa-recurso-2026",
    data: "2026-05-06",
    titulo: "Court of Appeal nega recurso da BHP",
    descricao:
      "A Corte nega permissão para a BHP recorrer das conclusões de responsabilidade.",
    tipo: "decisao",
    fonteUrl: URL_COA_502,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "uksc-contempt-2026",
    data: "2026-06-29",
    titulo: "Supreme Court nega permissão no contempt",
    descricao: "A Corte nega permissão no caso UKSC/2026/0048.",
    tipo: "decisao",
    fonteUrl: URL_UKSC_0048,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "holanda-competencia-2026",
    data: "2026-07-09",
    titulo: "Holanda julga sua competência",
    descricao:
      "Audiência decide se a Justiça holandesa julga a ação de Mariana contra Samarco.",
    tipo: "audiencia",
    fonteUrl:
      "https://www.otempo.com.br/politica/2026/7/9/justica-da-holanda-analisa-nesta-quinta-feira-se-julga-acao-de-vitimas-de-mariana-contra-samarco",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "representacao-2026",
    data: "2026-10-12",
    titulo: "Justiça confirma PGMBM como advogado dos autores",
    descricao:
      "O juiz Waksman decidiu que o Comitê de Clientes não podia trocar o escritório nem transferir os autores para outro escritório.",
    tipo: "decisao",
    fonteUrl:
      "https://pogustgoodhead.com/high-court-confirms-pgmbm-remains-solicitor/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "custas-2026",
    data: "2026-10-16",
    titulo: "Court of Appeal nega recurso sobre custas",
    descricao: "A Corte nega o recurso da BHP sobre juros de custas.",
    tipo: "decisao",
    fonteUrl: URL_COA_1319,
    dataAcesso: DATA_ACESSO,
  },
];

/** Clipping: metadado e link, sem reprodução da matéria. */
export const CLIPPING: readonly ItemClipping[] = [
  {
    id: "g1-2025-11",
    veiculo: "G1",
    data: "2025-11-14",
    titulo: "BHP é condenada na Inglaterra por rompimento em Mariana",
    url: "https://g1.globo.com/mg/minas-gerais/noticia/2025/11/14/bhp-acionista-da-samarco-e-parcialmente-condenada-pela-justica-inglesa-em-processo-sobre-rompimento-de-barragem-em-mariana.ghtml",
    arquivoUrl:
      "https://web.archive.org/web/20260416000832/https://g1.globo.com/mg/minas-gerais/noticia/2025/11/14/bhp-acionista-da-samarco-e-parcialmente-condenada-pela-justica-inglesa-em-processo-sobre-rompimento-de-barragem-em-mariana.ghtml",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "bbc-2025-11",
    veiculo: "BBC",
    data: "2025-11-14",
    titulo: "UK court finds mining firm liable for Brazil's worst environmental disaster",
    url: "https://www.bbc.com/news/articles/c8034v2e3l3o",
    arquivoUrl:
      "https://web.archive.org/web/20260926033549/https://www.bbc.com/news/articles/c8034v2e3l3o",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "dw-2025-11",
    veiculo: "DW",
    data: "2025-11-14",
    titulo: "UK court finds mining firm liable for Brazil dam collapse",
    url: "https://www.dw.com/en/uk-court-rules-bhp-responsible-for-2015-mariana-dam-collapse/a-74748147",
    arquivoUrl:
      "https://web.archive.org/web/20260416034445/https://www.dw.com/en/uk-court-rules-bhp-responsible-for-2015-mariana-dam-collapse/a-74748147",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "revista-mineracao-2025-11",
    veiculo: "Revista Mineração",
    data: "2025-11-14",
    titulo:
      "BHP e Vale se posicionam após decisão do Tribunal de Londres sobre o desastre em Mariana",
    url: "https://revistamineracao.com.br/2025/11/14/bhp-vale-posicionam-decisao-tribunal-de-londres-desastre-mariana-mg/",
    arquivoUrl:
      "https://web.archive.org/web/20260613194119/https://revistamineracao.com.br/2025/11/14/bhp-vale-posicionam-decisao-tribunal-de-londres-desastre-mariana-mg/",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "solicitors-journal-2026-05",
    veiculo: "Solicitors Journal",
    data: "2026-05-06",
    titulo:
      "Municipio de Mariana v BHP: Court of Appeal refuses permission to appeal liability findings",
    url: "https://www.solicitorsjournal.com/sjarticle/municipio-de-mariana-v-bhp-court-of-appeal-refuses-permission-to-appeal-liability-findings",
    idioma: "en",
    paywall: true,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "otempo-2026-07",
    veiculo: "O Tempo",
    data: "2026-07-09",
    titulo:
      "Justiça da Holanda analisa nesta quinta-feira se julga ação de vítimas de Mariana contra Samarco",
    url: "https://www.otempo.com.br/politica/2026/7/9/justica-da-holanda-analisa-nesta-quinta-feira-se-julga-acao-de-vitimas-de-mariana-contra-samarco",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "diario-comercio-2026-07",
    veiculo: "Diário do Comércio",
    data: "2026-07-10",
    titulo: "Vale e Samarco: audiência na Holanda sobre Mariana",
    url: "https://diariodocomercio.com.br/legislacao/vale-samarco-audiencia-holanda-mariana/",
    arquivoUrl:
      "https://web.archive.org/web/20260711170932/https://diariodocomercio.com.br/legislacao/vale-samarco-audiencia-holanda-mariana/",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "g1-braskem-2024-07",
    veiculo: "G1",
    data: "2024-07-26",
    titulo:
      "Justiça da Holanda condena Braskem pelo afundamento do solo em Maceió",
    url: "https://g1.globo.com/al/alagoas/arquivo/noticia/2024/07/26/justica-da-holanda-condena-braskem-pelo-afundamento-do-solo-em-maceio-e-determina-pagamento-de-indenizacao.ghtml",
    arquivoUrl:
      "https://web.archive.org/web/20251215142117/https://g1.globo.com/al/alagoas/arquivo/noticia/2024/07/26/justica-da-holanda-condena-braskem-pelo-afundamento-do-solo-em-maceio-e-determina-pagamento-de-indenizacao.ghtml",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "bhrrc-2025-07",
    veiculo: "Business & Human Rights Resource Centre",
    data: "2025-07-01",
    titulo:
      "Netherlands: Brazilian victims of Maceió sinking appeal ruling that found Braskem liable but cleared its European subsidiaries",
    url: "https://www.business-humanrights.org/en/latest-news/netherlands-brazilian-victims-of-macei%C3%B3-sinking-appeal-ruling-that-found-liable-but-cleared-its-european-subsidiaries/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "bhrrc-2024-03",
    veiculo: "Business & Human Rights Resource Centre",
    data: "2024-03-19",
    titulo:
      "Netherlands: $3.8 billion class action lawsuit filed against Vale and Samarco in Dutch court over Mariana dam collapse",
    url: "https://www.business-humanrights.org/en/latest-news/netherlands-38-billion-class-action-lawsuit-filed-against-vale-and-samarco-in-dutch-court-over-mariana-dam-collapse/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "g1-braskem-2026-06",
    veiculo: "G1",
    data: "2026-06-17",
    titulo: "Justiça aceita denúncia contra Braskem por afundamento em Maceió",
    url: "https://g1.globo.com/al/alagoas/noticia/2026/06/17/justica-aceita-denuncia-contra-braskem-por-afundamento-em-maceio.ghtml",
    arquivoUrl:
      "https://web.archive.org/web/20260617233635/https://g1.globo.com/al/alagoas/noticia/2026/06/17/justica-aceita-denuncia-contra-braskem-por-afundamento-em-maceio.ghtml",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "telegraaf-2024-03",
    veiculo: "De Telegraaf (via Headliner)",
    data: "2024-03-20",
    titulo: "Miljardenclaim na Braziliaanse dambreuk voor Nederlandse rechter",
    url: "https://www.headliner.nl/item/miljardenclaim-na-braziliaanse-dambreuk-voor-nederlandse-rechter-telegraaf-2104026",
    idioma: "nl",
    paywall: true,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-vitoria-2025-11",
    veiculo: "Pogust Goodhead",
    data: "2025-11-14",
    titulo:
      "Vitória histórica: Justiça inglesa declara BHP culpada pelo desastre de Mariana",
    url: "https://pogustgoodhead.com/justica-inglesa-declara-bhp-culpada-pelo-desastre-de-mariana/",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-victory-2025-11",
    veiculo: "Pogust Goodhead",
    data: "2025-11-14",
    titulo: "High Court rules BHP liable for dam disaster in landmark case",
    url: "https://pogustgoodhead.com/high-court-rules-bhp-liable-for-dam-disaster-in-landmark-case/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-dez-anos-2025-11",
    veiculo: "Pogust Goodhead",
    data: "2025-11-04",
    titulo: "10 anos depois: vítimas do rompimento da barragem de Mariana cobram justiça",
    url: "https://pogustgoodhead.com/vitimas-do-rompimento-da-barragem-de-mariana-cobram-justica/",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-fase2-2025-07",
    veiculo: "Pogust Goodhead",
    data: "2025-07-04",
    titulo: "Important update on the Mariana Case in England",
    url: "https://pogustgoodhead.com/important-update-on-the-mariana-case-in-england-hearing-held-on-2-and-3-july-2025/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-contempt-2025-06",
    veiculo: "Pogust Goodhead",
    data: "2025-06-26",
    titulo:
      "High Court judge determines there are to be reasonable grounds to allege that BHP is guilty of criminal contempt",
    url: "https://pogustgoodhead.com/high-court-judge-determines-there-are-to-be-reasonable-grounds-to-allege-that-bhp-is-guilty-of-criminal-contempt/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-asi-2025-12",
    veiculo: "Pogust Goodhead",
    data: "2025-12-04",
    titulo:
      "Pogust Goodhead defeats BHP bid to block deposition of former Renova chief",
    url: "https://pogustgoodhead.com/pogust-goodhead-defeats-bhp-bid-to-block-deposition-of-former-renova-chief/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-recusa-2026-01",
    veiculo: "Pogust Goodhead",
    data: "2026-01-19",
    titulo: "High Court refuses BHP permission to appeal landmark Mariana liability judgment",
    url: "https://pogustgoodhead.com/high-court-refuses-bhp-permission-to-appeal/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-coa-2026-05",
    veiculo: "Pogust Goodhead",
    data: "2026-05-06",
    titulo: "Court of Appeal shuts down BHP's attempt to overturn Mariana liability judgment",
    url: "https://pogustgoodhead.com/court-of-appeal-shuts-down-bhps-attempt-to-overturn-mariana-liability-judgment/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-representacao-2026-10",
    veiculo: "Pogust Goodhead",
    data: "2026-10-16",
    titulo:
      "High Court confirms PGMBM remains solicitor for Mariana case claimants",
    url: "https://pogustgoodhead.com/high-court-confirms-pgmbm-remains-solicitor-for-mariana-case-claimants/",
    idioma: "en",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-brumadinho-2026-05",
    veiculo: "Pogust Goodhead",
    data: "2026-05-26",
    titulo: "Caso Brumadinho avança na Alemanha com início de audiências em Munique",
    url: "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
    idioma: "pt",
    paywall: false,
    dataAcesso: DATA_ACESSO,
  },
];

/** Posicionamentos oficiais/institucionais, sempre com link. */
export const POSICIONAMENTOS: readonly Posicionamento[] = [
  {
    id: "stf-2025-08",
    autor: "STF — ministro Flávio Dino (ADPF 1178)",
    data: "2025-08-18",
    resumo:
      "Suspendeu a eficácia, no Brasil, de decisões e atos estrangeiros não incorporados; estados e municípios ficam impedidos de propor novas demandas no exterior.",
    url: URL_ADPF_1178,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "stf-2026-04",
    autor: "STF — ministro Flávio Dino (ADPF 1178)",
    data: "2026-04-15",
    resumo:
      "Reafirmou que acordos de Mariana firmados no Brasil não dependem de autorização da Justiça inglesa; sentença estrangeira só produz efeito após homologação.",
    url: URL_ADPF_ACORDO,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "tcc-sentenca",
    autor: "High Court of Justice (TCC) — Mrs Justice O'Farrell DBE",
    data: "2025-11-14",
    resumo:
      "A sentença responsabiliza a BHP na primeira etapa, sem fixar indenização, e remete a quantificação para a segunda fase.",
    url: URL_SENTENCA_UK,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "coa-2026-05",
    autor: "Court of Appeal (England and Wales)",
    data: "2026-05-06",
    resumo:
      "Negou permissão para a BHP recorrer das conclusões de responsabilidade da primeira fase.",
    url: URL_COA_502,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "uksc-2026-06",
    autor: "Supreme Court of the United Kingdom",
    data: "2026-06-29",
    resumo:
      "Negou permissão para recorrer da decisão que extinguiu a acusação de contempt contra a BHP.",
    url: URL_UKSC_0048,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "rechtbank-rotterdam",
    autor: "Rechtbank Rotterdam",
    data: "2024-07-24",
    resumo:
      "Condenou a Braskem S.A. a reparar os danos do afundamento em Maceió; rejeitou pedidos contra subsidiárias holandesas e remeteu o quantum à schadestaatprocedure.",
    url: URL_BRASKEM_NOTICIA,
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "bhp-2025-11",
    autor: "BHP",
    data: "2025-11-14",
    resumo:
      "Confirmou a decisão, informou que recorreria e sustentou que a ação britânica é duplicativa; afirmou que 610 mil pessoas já foram indenizadas no Brasil.",
    url: "https://www.bhp.com/news/media-centre/releases/2025/11/update-united-kingdom-group-action",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "vale-2025-11",
    autor: "Vale",
    data: "2025-11-14",
    resumo:
      "Em fato relevante, confirmou a decisão e estimou provisão adicional de cerca de US$ 500 milhões.",
    url: "https://www.moneytimes.com.br/vale-vale3-estima-provisao-de-us-500-milhoes-por-rompimento-em-mariana-apos-decisao-da-justica-inglesa-lmrs/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "samarco-2025-06",
    autor: "Samarco",
    data: "2025-06-12",
    resumo:
      "Afirmou que a audiência na Holanda era preliminar e que a subsidiária europeia atua como representante comercial, sem vínculo com a mineração.",
    url: "https://jornalnortecapixaba.com.br/samarco-se-manifesta-sobre-acao-na-justica-da-holanda-por-desastre-de-mariana/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "braskem-2026-09",
    autor: "Braskem",
    data: "2026-09-21",
    resumo:
      "Sustentou que a recuperação extrajudicial não altera os compromissos de Maceió e que R$ 14,6 bilhões dos R$ 18 bilhões provisionados já foram desembolsados até junho de 2026.",
    url: "https://www.braskem.com.br/detalhe-noticias-alagoas/braskem-reafirma-compromisso-com-maceio-e-destaca-relevancia-estrategica-de-alagoas-para-o-futuro-da-companhia",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "mpf-2026-07",
    autor: "Ministério Público Federal (MPF)",
    data: "2026-07-22",
    resumo:
      "Cobrou transparência, prazos e definição de responsabilidades nas 44 ações do Plano de Ações Sociourbanísticas de Maceió.",
    url: "https://www.mpf.mp.br/o-mpf/unidades/pr-al/noticias/caso-braskem-mpf-e-mp-al-cobram-transparencia-e-avancos-nas-obras-de-reparacao-em-maceio",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pf-2026-06",
    autor: "Polícia Federal (investigação noticiada)",
    data: "2026-06-19",
    resumo:
      "Documentos da PF citados na denúncia do MPF apontam que a Braskem e a antecessora Salgema sabiam do risco de afundamento desde 1988.",
    url: "https://g1.globo.com/al/alagoas/noticia/2026/06/19/investigacao-da-pf-aponta-que-braskem-sabia-de-risco-de-afundamento-em-maceio-desde-1988.ghtml",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-alinia-brumadinho",
    autor: "Pogust Goodhead — Alicia Alinia, CEO",
    data: "2026-05-26",
    resumo:
      "Afirmou que os clientes seguem sofrendo os impactos do rompimento e que o escritório busca justiça, reparação adequada e responsabilização.",
    url: "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
    dataAcesso: DATA_ACESSO,
  },
  {
    id: "pg-representacao-2026",
    autor: "Pogust Goodhead — Alicia Alinia, CEO",
    data: "2026-10-16",
    resumo:
      "Disse que os autores não são mercadorias a serem transferidas entre escritórios e que o cronograma segue para a segunda fase em abril de 2027.",
    url: "https://pogustgoodhead.com/high-court-confirms-pgmbm-remains-solicitor-for-mariana-case-claimants/",
    dataAcesso: DATA_ACESSO,
  },
];

/**
 * ADPF 1178, conferida em notícia oficial do STF em 18/08/2025.
 * A ADPF 1318 é outra ação (dívida rural) e foi arquivada; não é esta.
 */
export const ADPF: Adpf = {
  numero: "1178",
  relator: "Flávio Dino",
  objeto:
    "Arguição do Instituto Brasileiro de Mineração (Ibram) contra a possibilidade de municípios brasileiros ajuizarem ações no exterior para reparar danos ocorridos no Brasil, notadamente Mariana e Brumadinho, por alegada ofensa à soberania nacional e ao pacto federativo; discute também contratos de honorários de êxito com escritórios estrangeiros.",
  status:
    "Em tramitação. Liminar de 14/10/2024 referendada pelo Plenário em 05/11/2024; decisão de 18/08/2025 afastou eficácia automática de decisões estrangeiras; decisão de 15/04/2026 reafirmou que acordos de Mariana em solo brasileiro dispensam aval da Justiça inglesa. Sem julgamento de mérito até 30/10/2026.",
  datas: [
    { rotulo: "Liminar", data: "2024-10-14" },
    { rotulo: "Referendo do Plenário", data: "2024-11-05" },
    { rotulo: "Decisão sobre eficácia", data: "2025-08-18" },
    { rotulo: "Esclarecimento sobre acordo", data: "2026-04-15" },
    { rotulo: "Coleta", data: DATA_ACESSO },
  ],
  links: [
    {
      titulo: "STF — ADPF 1178 (andamento processual)",
      url: "https://portal.stf.jus.br/processos/detalhe.asp?incidente=6952622",
    },
    {
      titulo: "STF — decisão de 18/08/2025",
      url: URL_ADPF_1178,
    },
    {
      titulo: "STF — esclarecimento de 15/04/2026",
      url: URL_ADPF_ACORDO,
    },
    {
      titulo: "STF — liminar de 14/10/2024",
      url: "https://noticias.stf.jus.br/postsnoticias/stf-determina-que-municipios-apresentem-contratos-com-escritorios-de-advocacia-em-outros-paises/",
    },
    {
      titulo: "STF — referendo da liminar em 05/11/2024",
      url: "https://noticias.stf.jus.br/postsnoticias/stf-confirma-que-municipios-devem-apresentar-contratos-com-escritorios-de-advocacia-no-exterior/",
    },
  ],
  relacaoComLitigios:
    "A ADPF não julga o mérito das ações inglesa e holandesa. Ela limita a eficácia, no Brasil, de decisões estrangeiras não incorporadas e impede novos ajuizamentos por estados e municípios. Em 15/04/2026, o relator esclareceu que acordos firmados no Brasil não dependem da Justiça inglesa.",
  dataAcesso: DATA_ACESSO,
  pendente: false,
  observacao:
    "Número e relator conferidos em notícia oficial do STF de 18/08/2025. A ADPF 1318 trata de dívida rural e foi arquivada; não é esta. O andamento no portal do STF não foi lido porque robots.txt bloqueia /processos.",
};

/** Lista as fontes únicas do acervo (litígios, conexões e clipping). */
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
    (a, b) => a.tipo.localeCompare(b.tipo) || a.titulo.localeCompare(b.titulo),
  );
}
