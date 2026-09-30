/**
 * Camada MUNICÍPIO da memória das resistências — a fase F3 do plano.
 *
 * Papel no portal: dar a cada cidade o seu marco local, com ano e lugar,
 * sempre com fonte pública fechada. A página `[municipio]` desce a escada
 * (`resolverMemoria`) e mostra o degrau mais específico com fonte; esta
 * camada é o degrau de baixo — o mais valioso e o mais caro de fechar.
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`
 * (F3 — piloto MG municipal; regra de vinculação e teste da vizinhança) e
 * AGENTS.md §7 (nada de insinuação; luto com registro próprio; lacuna é
 * informação) e §8 (as seis qualidades).
 *
 * Decisões técnicas:
 * - A chave é o CÓDIGO IBGE de 7 dígitos, nunca o nome — a grafia diverge
 *   entre tabelas oficiais (armadilha já paga no repo). O slug da rota é
 *   só chave de renderização.
 * - Entra cidade com fonte LOCAL aberta e conferida na coleta desta sessão
 *   (30/09/2026). Cidade sem fonte fechada continua sem verbete e a tela
 *   declara a lacuna — `memoria: null` nunca vira marco inventado.
 * - Nenhum dado pessoal: os verbetes falam de comunidades e lutas
 *   coletivas, sem nome de pessoa viva. A varredura
 *   `scripts/checar-dado-pessoal-em-dado.py` roda antes do commit.
 * - Registro reverente onde houve morte (Ipatinga, Brumadinho): zero
 *   humor, zero metáfora, sujeito é quem lutou — nunca vítima decorativa.
 */

import type { VerbeteMemoria } from "./tipos";

/**
 * Verbetes municipais indexados por código IBGE de 7 dígitos. Cada lista
 * pode ter mais de um marco; hoje há um por cidade.
 */
export const VERBETES_MUNICIPIO: Record<string, VerbeteMemoria[]> = {
  // ───────────────────────────────────────────────────────────────────
  // BETIM (3106705) — Bacia do Paraopeba: as famílias de Santa Izabel.
  // ───────────────────────────────────────────────────────────────────
  "3106705": [
    {
      nivel: "municipio",
      chave: "3106705",
      titulo: "Caminhada em defesa do Rio Paraopeba",
      periodo: "desde 2022",
      resumo:
        "Depois do rompimento da barragem em Brumadinho, moradoras e moradores do distrito de Santa Izabel, às margens do Paraopeba, passaram a se organizar em caminhadas e atos pela água limpa e pela reparação. A comunidade também reivindica o reconhecimento das pessoas atingidas.",
      tipo: ["direitos", "resistencia"],
      lugar: "Colônia Santa Izabel, Betim",
      tom: "coragem",
      fonte: [
        {
          autor: "Brasil de Fato",
          titulo:
            "Moradores de comunidade em Betim (MG) realizam caminhada em defesa do Rio Paraopeba",
          ano: "2022",
          url: "https://www.brasildefato.com.br/2022/01/26/moradores-de-comunidade-em-betim-mg-realizam-caminhada-em-defesa-do-rio-paraopeba/",
          orgao: "Brasil de Fato — imprensa popular",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // IPATINGA (3131307) — o massacre operário da Usiminas, em 1963.
  // ───────────────────────────────────────────────────────────────────
  "3131307": [
    {
      nivel: "municipio",
      chave: "3131307",
      titulo: "Massacre de Ipatinga",
      periodo: "1963",
      resumo:
        "Em 7 de outubro de 1963, trabalhadores da Usiminas, em Ipatinga, foram atacados a tiros pela Polícia Militar e pela vigilância da empresa durante uma greve. O episódio é lembrado como o conflito operário mais sangrento do país.",
      tipo: ["greve", "direitos"],
      lugar: "Ipatinga",
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Arquivo Nacional",
          titulo: "Massacre de Ipatinga",
          ano: "2023",
          url: "http://querepublicaeessa.an.gov.br/index.php/que-republica-e-essa/assuntos/temas/78-secoes-anteriores/67-surpresa/426-massacre-de-ipatinga",
          orgao: "Arquivo Nacional — Que República é Essa",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // ARAÇUAÍ (3103405) — o Quilombo Baú e a luta pelo território no Vale.
  // ───────────────────────────────────────────────────────────────────
  "3103405": [
    {
      nivel: "municipio",
      chave: "3103405",
      titulo: "Quilombo Baú",
      periodo: "certidão em 2008",
      resumo:
        "O Quilombo Baú, em Araçuaí, no Vale do Jequitinhonha, foi certificado pela Fundação Cultural Palmares em 2008 e segue lutando pela titulação do seu território. O relatório que delimita a área saiu em 2023; a luta pelo reconhecimento continua.",
      tipo: ["quilombo", "resistencia", "campo"],
      lugar: "Araçuaí",
      tom: "coragem",
      fonte: [
        {
          autor: "Comissão Pró-Índio de São Paulo",
          titulo: "Terra Quilombola Baú (Araçuaí – MG)",
          ano: "2026",
          url: "https://cpisp.org.br/bau-aracuai-mg/",
          orgao: "Comissão Pró-Índio de São Paulo — Observatório Terras Quilombolas",
        },
        {
          autor: "Fundação Cultural Palmares",
          titulo: "Certificação Quilombola",
          ano: "2026",
          url: "https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/certificacao-quilombola",
          orgao: "Fundação Cultural Palmares",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // BRUMADINHO (3109006) — o Memorial das famílias das 272 vítimas.
  // ───────────────────────────────────────────────────────────────────
  "3109006": [
    {
      nivel: "municipio",
      chave: "3109006",
      titulo: "Memorial Brumadinho",
      periodo: "desde 2019",
      resumo:
        "Depois do rompimento da barragem da Mina Córrego do Feijão, em 25 de janeiro de 2019, as famílias das 272 vítimas se mobilizaram para preservar a memória. O Memorial Brumadinho, no próprio local da tragédia, é uma conquista coletiva delas.",
      tipo: ["direitos", "resistencia"],
      lugar: "Córrego do Feijão, Brumadinho",
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Memorial Brumadinho",
          titulo: "Sobre o Memorial Brumadinho",
          ano: "2025",
          url: "https://memorialbrumadinho.org.br/memorial-brumadinho/sobre/",
          orgao: "Memorial Brumadinho — associação das famílias",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // DIAMANTINA (3121605) — a luta pelo Parque do Biribiri público.
  // ───────────────────────────────────────────────────────────────────
  "3121605": [
    {
      nivel: "municipio",
      chave: "3121605",
      titulo: "Parque do Biribiri público",
      periodo: "desde 2026",
      resumo:
        "Moradoras e moradores de Diamantina se organizam para manter o Parque Estadual do Biribiri sob gestão pública, contra a concessão à iniciativa privada. A mobilização cobra participação da comunidade nas decisões sobre o parque.",
      tipo: ["direitos", "resistencia"],
      lugar: "Parque Estadual do Biribiri, Diamantina",
      tom: "coragem",
      fonte: [
        {
          autor: "Brasil de Fato",
          titulo:
            "Moradores de Diamantina (MG) lutam para manter Parque do Biribiri público",
          ano: "2026",
          url: "https://www.brasildefato.com.br/2026/07/06/moradores-de-diamantina-mg-lutam-para-manter-parque-do-biribiri-publico/",
          orgao: "Brasil de Fato — imprensa popular",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // ITINGA (3134004) — resistência à mineração de lítio no Vale.
  // ───────────────────────────────────────────────────────────────────
  "3134004": [
    {
      nivel: "municipio",
      chave: "3134004",
      titulo: "Resistência à mineração de lítio",
      periodo: "2023-2026",
      resumo:
        "O Complexo Grota do Cirilo, da Sigma Mineração, ocupa a divisa entre Itinga e Araçuaí, no Vale do Jequitinhonha. Comunidades do entorno relatam poeira, casas rachadas e isolamento, e cobram a consulta prévia às populações da região antes da lavra.",
      tipo: ["campo", "direitos", "resistencia"],
      lugar: "Complexo Grota do Cirilo (divisa Itinga–Araçuaí)",
      tom: "coragem",
      fonte: [
        {
          autor: "Brasil de Fato",
          titulo:
            "Sigma segue operando no Jequitinhonha (MG) mesmo após Justiça paralisar lavra, dizem moradores",
          ano: "2026",
          url: "https://www.brasildefato.com.br/2026/09/16/sigma-segue-operando-no-jequitinhonha-mg-mesmo-apos-justica-paralisar-lavra-dizem-moradores/",
          orgao: "Brasil de Fato — imprensa popular",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // GOVERNADOR VALADARES (3127701) — atingidos do Rio Doce.
  // ───────────────────────────────────────────────────────────────────
  "3127701": [
    {
      nivel: "municipio",
      chave: "3127701",
      titulo: "Atingidos do Rio Doce cobram reparação",
      periodo: "desde 2015",
      resumo:
        "Depois do rompimento da barragem de Fundão, moradoras e moradores de Governador Valadares, na Bacia do Rio Doce, se organizaram em atos para cobrar reparação e água limpa. A cidade enfrentou a interrupção do abastecimento.",
      tipo: ["direitos", "resistencia"],
      lugar: "Governador Valadares",
      tom: "coragem",
      fonte: [
        {
          autor: "Brasil de Fato",
          titulo:
            "Ato em Governador Valadares (MG) denuncia descaso da Samarco com atingidos",
          ano: "2016",
          url: "https://www.brasildefato.com.br/2016/04/18/ato-em-governador-valadares-mg-denuncia-descaso-da-samarco-com-atingidos/",
          orgao: "Brasil de Fato — imprensa popular",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // FELISBURGO (3125705) — o massacre de 2003 (conflito no campo).
  // ───────────────────────────────────────────────────────────────────
  "3125705": [
    {
      nivel: "municipio",
      chave: "3125705",
      titulo: "Massacre de Felisburgo",
      periodo: "2003",
      resumo:
        "Em 20 de novembro de 2003, cinco militantes do MST foram assassinados em Felisburgo, no interior de Minas Gerais. O crime é lembrado como um dos episódios mais graves da luta pela terra no estado.",
      tipo: ["campo", "direitos"],
      lugar: "Felisburgo",
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Brasil de Fato",
          titulo:
            "Massacre de Felisburgo, que assassinou cinco militantes do MST, completa 20 anos sem justiça",
          ano: "2024",
          url: "https://www.brasildefato.com.br/2024/11/20/massacre-de-felisburgo-que-assassinou-cinco-militantes-do-mst-completa-20-anos-sem-justica/",
          orgao: "Brasil de Fato — imprensa popular",
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  // MARIANA (3140001) — o rompimento da barragem de Fundão, 2015.
  // ───────────────────────────────────────────────────────────────────
  "3140001": [
    {
      nivel: "municipio",
      chave: "3140001",
      titulo: "Rompimento da barragem de Fundão",
      periodo: "2015",
      resumo:
        "Em 5 de novembro de 2015, o rompimento da barragem de Fundão, da Samarco (Vale e BHP), destruiu o distrito de Bento Rodrigues e matou 19 pessoas. A lama seguiu pelo rio Doce; a luta das pessoas atingidas por reparação continua.",
      tipo: ["direitos", "resistencia"],
      lugar: "Bento Rodrigues, Mariana",
      guarda: "reverente",
      tom: "luto",
      fonte: [
        {
          autor: "Movimento dos Atingidos por Barragens",
          titulo: "Rompimento da barragem de Fundão em Mariana (MG)",
          ano: "2026",
          url: "https://mab.org.br/timeline/rompimento-da-barragem-de-fundao-em-mariana-mg/",
          orgao: "MAB — Movimento dos Atingidos por Barragens",
        },
      ],
    },
  ],
};
