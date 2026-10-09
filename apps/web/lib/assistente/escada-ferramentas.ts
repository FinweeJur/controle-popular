/**
 * @file escada-ferramentas.ts
 * @description Degrau 4 da escada determinística — Central e Ferramentas do
 * portal. Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece perguntas por busca, editais, biblioteca, imprensa, índice,
 * documentação, fontes dos 27 estados, sobre, governo e ComunicaBR.
 * Devolve o cartão com os atalhos oficiais de cada seção.
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular (rotas do App Router).
 * Nenhum texto é gerado por máquina — os cartões são os mesmos que estavam
 * nos `if`s originais.
 *
 * Decisões técnicas:
 * - Antes isto era uma sequência de 10 `if`s com complexidade ciclomática 54
 *   e 216 linhas dentro de `escada-determinista.ts`: era o pior método do
 *   projeto inteiro (hotspot vermelho do CodeScene, medido 09/10/2026).
 *   Virou tabela de dados: quem decide passa a ser `primeiroCartao()`.
 * - A ORDEM das 10 entradas reproduz a dos `if`s originais. A primeira que
 *   casa responde — trocar a ordem muda a resposta em perguntas ambíguas.
 * - Prova de equivalência: `escada-determinista.test.ts` (cartões de
 *   ferramenta) e a comparação de termos extraídos do diff.
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Tabela do degrau 4 — Central e Ferramentas.
 * `exatos` casa com a pergunta inteira; `contem` casa por substring.
 */
const FERRAMENTAS: EntradaCartao[] = [
  {
    exatos: ["busca", "pesquisa", "procurar"],
    contem: ["buscar atos", "pesquisar no site"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Busca Geral & Atos Oficiais",
      subtitulo: "Mecanismo Unificado de Busca do Controle Popular",
      texto:
        "Pesquise termos em atos oficiais, contratos, diários municipais, páginas estruturais, notícias e decisões com filtros em tempo real.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Busca Geral", href: "/busca", principal: true },
        { rotulo: "Radar de Editais", href: "/editais" },
        { rotulo: "Índice Geral do Site", href: "/indice" },
      ],
    },
  },
  {
    exatos: ["editais", "edital", "licitacoes", "pregao"],
    contem: ["radar de editais", "diario oficial mg"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Radar de Editais & Licitações DO-MG",
      subtitulo: "Monitoramento Diário do Diário Oficial de MG",
      texto:
        "Acompanhe editais de chamamento público, licitações, credenciamentos em saúde/educação e certames publicados no Diário Oficial de Minas Gerais.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Radar de Editais", href: "/editais", principal: true },
        { rotulo: "Contratos Públicos PNCP", href: "/estado-e-economia/compras-publicas" },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
      ],
    },
  },
  {
    exatos: ["biblioteca", "estudos", "pesquisas", "teses"],
    contem: ["biblioteca socioambiental", "artigos cientificos"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Biblioteca Socioambiental & Estudos Rurais",
      subtitulo: "Repositório Acadêmico e Cívico",
      texto:
        "Consulte artigos científicos, teses da UFVJM, relatórios de perícia independente da UFMG e pareceres técnicos sobre conflitos territoriais e mineração.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Biblioteca", href: "/biblioteca", principal: true },
        { rotulo: "Estudos Rurais do Jequitinhonha", href: "/estudos-rurais" },
        { rotulo: "Biblioteca Brumadinho (ATIs/UFMG)", href: "/paraopeba/biblioteca" },
      ],
    },
  },
  {
    exatos: ["imprensa", "jornalistas", "sala de imprensa"],
    contem: ["dados para imprensa", "contato imprensa"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Sala de Imprensa & Dados Consolidados",
      subtitulo: "Recursos para Redações, Repórteres e Pesquisadores",
      texto:
        "Consulte os dados consolidados do portal (R$ 251 bilhões em recursos públicos auditados, 199 cidades e 963 documentos) e orientações de pauta cívica.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Acessar Sala de Imprensa", href: "/imprensa", principal: true },
        { rotulo: "Central de Notícias ONSA", href: "/noticias" },
        { rotulo: "Documentação Técnica", href: "/documentacao" },
      ],
    },
  },
  {
    exatos: ["indice", "mapa do site", "todas as paginas", "sumario"],
    contem: ["indice geral"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Índice Geral do Portal Controle Popular",
      subtitulo: "Mapa Completo de Navegação e Acervos",
      texto:
        "Acesse o mapa completo com todos os eixos temáticos, 18 subfrentes, 199 cidades, tribunais, órgãos de justiça e acervos catalogados.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Índice Geral", href: "/indice", principal: true },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
        { rotulo: "Fontes dos 27 Estados", href: "/fontes-estados" },
      ],
    },
  },
  {
    exatos: ["documentacao", "api", "arquitetura", "metodologia"],
    contem: [
      "documentacao tecnica",
      "como funciona o portal",
      "como funciona o site",
      "como funciona a api",
    ],
    cartao: {
      tipo: "ferramenta",
      titulo: "Documentação Técnica & API Pública",
      subtitulo: "Transparência Metodológica e Código Aberto",
      texto:
        "Conheça a arquitetura técnica do portal, catálogo de APIs públicas, fontes governamentais integradas, pipelines de ETL e princípios de auditoria de dados.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Documentação Técnica", href: "/documentacao", principal: true },
        { rotulo: "Tecnologia & IA Livre", href: "/tecnologia" },
        { rotulo: "Sobre o Portal & ONSA", href: "/sobre" },
      ],
    },
  },
  {
    exatos: ["fontes", "27 estados", "fontes estados"],
    contem: ["fontes de dados", "portais de transparencia"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Fontes de Dados dos 27 Estados",
      subtitulo: "Catálogo Nacional de Portais de Transparência e Controle",
      texto:
        "Guia completo de portais oficiais de transparência, Tribunais de Contas (TCEs), Ministérios Públicos (MPEs) e Diários Oficiais dos 27 estados do Brasil.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Fontes dos 27 Estados", href: "/fontes-estados", principal: true },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
        { rotulo: "Documentação de Fontes", href: "/documentacao" },
      ],
    },
  },
  {
    exatos: ["sobre", "onsa", "quem somos"],
    contem: ["sobre o portal", "observatorio nacional socioambiental"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Sobre o Controle Popular e o ONSA",
      subtitulo: "Observatório Nacional Socioambiental",
      texto:
        "O Controle Popular é uma plataforma cívica pública, independente e auditável, mantida para empoderar comunidades, movimentos sociais e pesquisadores com dados abertos.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Conhecer o Projeto e Equipe", href: "/sobre", principal: true },
        { rotulo: "Sala de Imprensa", href: "/imprensa", principal: false },
        { rotulo: "Termos e Política Cívica", href: "/termos" },
      ],
    },
  },
  {
    exatos: ["governo", "prometeu cumpriu"],
    contem: ["metas de governo", "plano de governo"],
    cartao: {
      tipo: "ferramenta",
      titulo: "Governo: Prometeu? Cumpriu?",
      subtitulo: "Monitoramento de Promessas e Metas Públicas",
      texto:
        "Acompanhe o status de execução das metas oficiais de governos e prefeituras com base em relatórios fiscais e prestação de contas.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Painel Prometeu? Cumpriu?", href: "/governo", principal: true },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
        { rotulo: "Compras e Obras Paralisadas", href: "/estado-e-economia/obras-paralisadas" },
      ],
    },
  },
  {
    exatos: ["comunicabr"],
    contem: ["repasses federais", "governo federal em mg", "bolsa familia mg"],
    cartao: {
      tipo: "ferramenta",
      titulo: "ComunicaBR — Repasses Federais em Minas Gerais",
      subtitulo: "R$ 139 Bilhões nos 853 Municípios Mineiros",
      texto:
        "Consulte repasses do Governo Federal em saúde, educação (Fundeb), Bolsa Família, BPC e programas sociais para cada município de Minas Gerais.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Painel ComunicaBR", href: "/dados/comunicabr", principal: true },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
        { rotulo: "Saúde Pública e SUS", href: "/direitos-em-movimento/saude-publica" },
      ],
    },
  },
];

/**
 * Degrau 4 — Central e Ferramentas do portal.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da ferramenta, ou `null` para o degrau seguinte.
 */
export function degrau4Ferramentas(normalizada: string): ResultadoEscada | null {
  return primeiroCartao(normalizada, FERRAMENTAS);
}
