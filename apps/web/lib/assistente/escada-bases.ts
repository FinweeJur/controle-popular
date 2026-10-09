/**
 * @file escada-bases.ts
 * @description Degrau 4.5 da escada determinística — novas bases e hubs da
 * rodada de 29/09/2026. Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece perguntas por imóveis da União (SPU), concessões e PPPs,
 * os 853 municípios do IBGE, cavas de mineração por satélite, as 27
 * Assembleias Legislativas e o hub multilateral (ONU, G20, IDH, Gini).
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular (rotas do App Router),
 * cadastro de imóveis da União em MG, Portal da Transparência MG e a API
 * do IBGE. Nenhum texto é gerado por máquina — os cartões são os mesmos
 * que estavam nos `if`s originais.
 *
 * Decisões técnicas:
 * - Antes isto era uma sequência de 6 `if`s com complexidade ciclomática 26
 *   e 125 linhas dentro de `escada-determinista.ts` (o pior que sobrava
 *   depois de 09/10/2026). Virou tabela de dados: quem decide passa a ser
 *   `primeiroCartao()`.
 * - O último bloco usa REGEX de palavra inteira (`\b`) e é o primeiro da
 *   escada a fazê-lo: `onu` tem de casar como palavra, e não dentro de
 *   "nenhum" nem de "nenhuma". Sem `\b`, a pergunta errada responderia
 *   errado.
 * - A ORDEM das 6 entradas reproduz a dos `if`s originais. A primeira que
 *   casa responde.
 * - Prova de equivalência: `escada-determinista.test.ts` e a comparação de
 *   termos extraídos do diff (inclusive a fonte da regex).
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Tabela do degrau 4.5 — novas bases e hubs.
 * `exatos` casa com a pergunta inteira; `contem` casa por substring;
 * `regex` cobre o caso de palavra inteira.
 */
const BASES: EntradaCartao[] = [
  {
    exatos: ["spu"],
    contem: ["imoveis da uniao", "patrimonio da uniao", "destinacoes de imoveis", "autorizacoes"],
    cartao: {
      tipo: "pagina",
      titulo: "Destinações de Imóveis da União em Minas Gerais",
      subtitulo: "553 Imóveis · SPU / Transparência Ativa",
      texto:
        "Cadastro público dos imóveis da União em Minas Gerais: destinação, classe, proprietário e área, com busca, filtros, ordenação e exportação CSV.",
      categoria: "Território",
      atalhos: [
        { rotulo: "Imóveis da União em MG", href: "/ambiental/autorizacoes", principal: true },
        { rotulo: "Globo 3D das Terras", href: "/funcaosocialterra/mapa" },
        { rotulo: "Função Social da Terra", href: "/funcaosocialterra" },
      ],
    },
  },
  {
    exatos: ["ppp", "ppps"],
    contem: [
      "concessoes",
      "concessao",
      "parceria publico-privada",
      "parcerias publico-privadas",
    ],
    cartao: {
      tipo: "pagina",
      titulo: "Concessões e Parcerias Público-Privadas de Minas",
      subtitulo: "20 Contratos · 6 Concessões · Portal da Transparência MG",
      texto:
        "Os contratos mineiros cujo objeto cita concessão ou PPP: só seis são a concessão em si; os outros são apoio, supervisão ou estudo.",
      categoria: "Contratações Públicas",
      atalhos: [
        { rotulo: "Painel de Concessões e PPPs", href: "/ambiental/ppp", principal: true },
        { rotulo: "Compras Públicas (PNCP)", href: "/estado-e-economia/compras" },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
      ],
    },
  },
  {
    exatos: [],
    contem: [
      "municipios de mg",
      "municipios de minas",
      "cidades de mg",
      "lista de municipios",
      "853 municipios",
    ],
    cartao: {
      tipo: "pagina",
      titulo: "Municípios de Minas Gerais (IBGE)",
      subtitulo: "853 Municípios · 10 Polos do Censo 2022",
      texto:
        "Lista completa dos 853 municípios de Minas Gerais com busca em tempo real, microrregiões e mesorregiões, a partir da API oficial do IBGE.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Municípios de Minas Gerais", href: "/cidades/mg", principal: true },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
        { rotulo: "ComunicaBR — 853 Municípios", href: "/dados/comunicabr" },
      ],
    },
  },
  {
    exatos: [],
    contem: [
      "cavas",
      "cava de mineracao",
      "mineracao por satelite",
      "onde a mineracao cresceu",
    ],
    cartao: {
      tipo: "pagina",
      titulo: "Cavas de Mineração em Minas Gerais",
      subtitulo: "Série Anual por Satélite · Cruzamento com a ANM",
      texto:
        "A série anual da mineração mapeada por satélite em MG e o cruzamento de uma amostra de cavas com os polígonos da ANM, com camadas no globo 3D.",
      categoria: "Mineração",
      atalhos: [
        { rotulo: "Painel das Cavas", href: "/mineracao/cavas", principal: true },
        { rotulo: "Painel de Barragens SIGBM", href: "/ambiental/barragens" },
        { rotulo: "Abrir Globo 3D", href: "/funcaosocialterra/mapa" },
      ],
    },
  },
  {
    exatos: ["assembleia"],
    contem: ["assembleias", "assembleia legislativa", "deputados estaduais"],
    cartao: {
      tipo: "pagina",
      titulo: "Assembleias Legislativas dos Estados",
      subtitulo: "27 Casas Legislativas · Deputados Estaduais",
      texto:
        "Monitoramento cidadão das 27 Assembleias estaduais e distrital: proposições de lei, comissões temáticas, mesa diretora e ranking de atuação.",
      categoria: "Poder Legislativo",
      atalhos: [
        { rotulo: "Hub das Assembleias", href: "/assembleias", principal: true },
        { rotulo: "Congresso Nacional", href: "/congresso" },
        { rotulo: "Fontes dos 27 Estados", href: "/fontes-estados" },
      ],
    },
  },
  {
    exatos: [],
    contem: [],
    // Palavra inteira de propósito: sem as bordas `\b`, a letra "n" de
    // "nenhum" casaria com "onu" e a pergunta de casa própria responderia
    // o hub internacional. Mesma fonte da regex que existia no `if`.
    regex: [/\b(internacional|multilateral|onu|pnud|unesco|oms|omc|idh|gini|g20|g8)\b/i],
    cartao: {
      tipo: "pagina",
      titulo: "Transparência Multilateral & Internacional",
      subtitulo: "ONU · UNESCO · OMS · OMC · G8 e G20",
      texto:
        "Comparação cívica do Brasil com potências do G8 e G20: IDH, desigualdade de renda, gastos em saúde e educação, comércio de minérios e direitos territoriais.",
      categoria: "Internacional",
      atalhos: [
        { rotulo: "Hub Multilateral", href: "/internacional", principal: true },
        { rotulo: "Observatório dos EUA", href: "/eua" },
        { rotulo: "Observatório do Canadá", href: "/canada" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
      ],
    },
  },
];

/**
 * Degrau 4.5 — novas bases e hubs.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da base, ou `null` para o degrau seguinte.
 */
export function degrau45Bases(normalizada: string): ResultadoEscada | null {
  return primeiroCartao(normalizada, BASES);
}
