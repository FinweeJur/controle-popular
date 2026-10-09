/**
 * @file escada-justica.ts
 * @description Degrau 3.5 da escada determinística — instituições de Justiça
 * e órgãos de controle. Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece perguntas por TJMG, MPMG, DPMG, TCEMG e pelo painel "Quem
 * Fiscaliza a Justiça", e devolve o cartão com os atalhos oficiais.
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular e as fichas
 * institucionais do portal. Nenhum texto é gerado por máquina.
 *
 * Decisões técnicas:
 * - **O comparativo vem ANTES das fichas**, e não é detalhe: o cartão da
 *   home pergunta pelo orçamento do TJMG, MPMG e DPMG JUNTOS
 *   ("…e a disparidade entre eles"). Sem esta regra, a pergunta atravessava
 *   a escada e caía no degrau de notícias, devolvendo uma reportagem sobre
 *   IPCA/Selic (medido em 06/10/2026). Duas ou mais siglas juntas = pergunta
 *   comparativa. Por isso `comparativoSiglas` roda fora da tabela: casar
 *   "tjmg" sozinho já responderia a ficha errada.
 * - Antes isto era uma sequência de 6 `if`s com complexidade ciclomática 18
 *   e 119 linhas dentro de `escada-determinista.ts`. Virou tabela de dados
 *   + guarda própria, cada um bem abaixo do aviso do CodeScene (cc 9).
 * - Prova de equivalência: `escada-determinista.test.ts` e a comparação de
 *   termos extraídos do diff.
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/** Siglas que, sozinhas, mudam a resposta de ficha individual para comparativa. */
const SIGLAS_JUSTICA = ["tjmg", "mpmg", "dpmg"];

/** Cartão do comparativo — o mesmo que existia no primeiro `if` do degrau. */
const CARTAO_COMPARATIVO: ResultadoEscada = {
  tipo: "ferramenta",
  titulo: "Instituições de Justiça de Minas Gerais",
  subtitulo: "TJMG · MPMG · DPMG — orçamento, folha e penduricalhos",
  texto:
    "Painel comparativo das instituições de justiça de Minas Gerais: orçamento anual de cada uma, folha de pagamento, auxílios e verbas indenizatórias, com limite constitucional e fonte oficial em cada ficha.",
  categoria: "Poder Judiciário",
  atalhos: [
    { rotulo: "Ver as Instituições de Justiça", href: "/judiciario/instituicoes", principal: true },
    { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg" },
    { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg" },
    { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg" },
  ],
};

/**
 * Detecta a pergunta COMPARATIVA: duas ou mais siglas citadas juntas.
 *
 * Roda antes da tabela de propósito — ver o cabeçalho do arquivo.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido.
 * @returns O cartão comparativo, ou `null` quando só uma sigla (ou nenhuma).
 */
function comparativoSiglas(normalizada: string): ResultadoEscada | null {
  const citadas = SIGLAS_JUSTICA.filter((sigla) => normalizada.includes(sigla));
  if (citadas.length < 2) return null;
  return CARTAO_COMPARATIVO;
}

/** Tabela do degrau 3.5 — fichas individuais, na ordem dos `if`s originais. */
const JUSTICA: EntradaCartao[] = [
  {
    exatos: [],
    contem: ["tjmg", "tribunal de justica de minas", "desembargadores tjmg"],
    cartao: {
      tipo: "pagina",
      titulo: "TJMG — Tribunal de Justiça de Minas Gerais",
      subtitulo: "Orçamento de R$ 14,96 Bi · Despesas e Folha de Pagamento",
      texto:
        "Ficha analítica do TJMG: orçamento anual, auxílio-alimentação (R$ 380 mi), diárias (R$ 48 mi), estrutura de comarcas e produtividade judiciária.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg", principal: true },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
        { rotulo: "Balcão Virtual e Varas", href: "/judiciario/contatos" },
        { rotulo: "Recomendações CNJ", href: "/noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica" },
      ],
    },
  },
  {
    exatos: [],
    contem: ["mpmg", "ministerio publico de minas", "promotores mpmg"],
    cartao: {
      tipo: "pagina",
      titulo: "MPMG — Ministério Público de Minas Gerais",
      subtitulo: "Orçamento de R$ 4,09 Bi · CAOMA e Verbas Indenizatórias",
      texto:
        "Ficha institucional do MPMG: promotorias especializadas, verbas indenizatórias (R$ 684 mi), ouvidoria pública e atuação ambiental.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg", principal: true },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
        { rotulo: "Canal de Denúncias", href: "/direitos-em-movimento/denuncia" },
      ],
    },
  },
  {
    exatos: [],
    contem: ["dpmg", "defensoria publica de minas", "defensores publicos"],
    cartao: {
      tipo: "pagina",
      titulo: "DPMG — Defensoria Pública de Minas Gerais",
      subtitulo: "Orçamento de R$ 1,10 Bi · Assistência Jurídica Gratuita",
      texto:
        "Ficha da DPMG: mapa de comarcas atendidas, déficit de defensores públicos perante a demanda e canais para atendimento gratuito ao cidadão.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg", principal: true },
        { rotulo: "Onde Buscar Ajuda Jurídica", href: "/direitos-em-movimento/ajuda" },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
      ],
    },
  },
  {
    exatos: ["tcemg", "tce"],
    contem: ["tribunal de contas do estado"],
    cartao: {
      tipo: "pagina",
      titulo: "TCEMG — Tribunal de Contas do Estado de MG",
      subtitulo: "Orçamento de R$ 1,15 Bi · Controle Externo das Contas",
      texto:
        "Ficha do TCEMG: fiscalização de contas dos 853 municípios mineiros, rejeição de contas de prefeitos e auditorias do estado.",
      categoria: "Órgãos de Controle",
      atalhos: [
        { rotulo: "Ficha do TCEMG", href: "/judiciario/instituicoes/tcemg", principal: true },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
        { rotulo: "199 Cidades Monitoradas", href: "/cidades" },
      ],
    },
  },
  {
    exatos: ["judiciario"],
    contem: [
      "poder judiciario",
      "instituicoes de justica",
      "quem fiscaliza a justica",
    ],
    cartao: {
      tipo: "pagina",
      titulo: "Quem Fiscaliza a Justiça — Mapa das Instituições",
      subtitulo: "TJMG, MPMG, DPMG, TRT-3, TRF-6, TCEMG, DPU e Conselhos",
      texto:
        "Painel comparativo das instituições de justiça em Minas Gerais: orçamentos, penduricalhos, folhas de pagamento e limites do controle externo no CNJ e CNMP.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Painel das Instituições de Justiça", href: "/judiciario/instituicoes", principal: true },
        { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg" },
        { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg" },
        { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg" },
        { rotulo: "Balcão Virtual e Varas", href: "/judiciario/contatos" },
      ],
    },
  },
];

/**
 * Degrau 3.5 — instituições de Justiça e órgãos de controle.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da instituição, ou `null` para o degrau seguinte.
 */
export function degrau35Justica(normalizada: string): ResultadoEscada | null {
  return comparativoSiglas(normalizada) ?? primeiroCartao(normalizada, JUSTICA);
}
