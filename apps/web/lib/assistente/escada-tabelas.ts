/**
 * @file escada-tabelas.ts
 * @description Degrau 1.5 da escada determinística — comandos diretos de
 * tabelas e bases (licenciamento, convênios, legislação, condicionantes).
 * Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece o que o cidadão digita para abrir uma tabela grande, e devolve
 * o cartão com o atalho certo. No licenciamento, o que vem depois da
 * palavra vira termo de BUSCA dentro da própria tabela.
 *
 * Fonte dos dados:
 * Acervos oficiais do portal: 19.713 empreendimentos de licenciamento
 * (SEMAD/COPAM), 3.000+ convênios, 20.000+ normas da legislação ambiental
 * e as condicionantes de barragens. Nenhum texto é gerado por máquina.
 *
 * Decisões técnicas:
 * - Antes isto era uma sequência de 4 `if`s com complexidade ciclomática 19
 *   e 90 linhas dentro de `escada-determinista.ts`. Virou tabela de dados.
 * - O PRIMEIRO bloco não cabe num cartão fixo: o cidadão digita
 *   "licenciamento de rios" e o portal recebe `?q=rios`. Ele continua na
 *   tabela (os termos de casamento estão todos em `comecaCom`/`contem`,
 *   então a prova de equivalência cobre), mas aponta `montar`, que ajusta
 *   só o título e o link de busca. Os outros três blocos são cartão fixo.
 * - A ordem das 4 entradas reproduz a dos `if`s originais.
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Arranca da pergunta a parte que vira termo de busca na tabela.
 *
 * Mantido byte a byte como o `replace` original: três correções em ordem
 * (licenciamento, licenças, "ambiental") e `.trim()`. Se uma delas mudar,
 * muda o que aparece na URL — e link errado é resposta errada.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido.
 * @returns O termo buscado, ou string vazia quando não há nada depois.
 */
function termoBusca(normalizada: string): string {
  return normalizada
    .replace(/^licenciamento\s*(de\s*)?/i, "")
    .replace(/^licencas?\s*(de\s*)?/i, "")
    .replace(/ambiental/i, "")
    .trim();
}

/**
 * Monta o cartão de licenciamento com o termo que o cidadão digitou.
 *
 * Sem termo, devolve o cartão-base intacto — mesma tela do original.
 * Com termo, troca só o título e o href do primeiro atalho; os demais
 * atalhos e os textos são os mesmos.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido.
 * @param base Cartão-base desta entrada (sem termo de busca).
 * @returns O cartão com título e link de busca ajustados.
 */
function montarLicenciamento(normalizada: string, base: ResultadoEscada): ResultadoEscada {
  const termo = termoBusca(normalizada);
  if (!termo) return base;
  return {
    ...base,
    titulo: `Licenciamento Ambiental: ${termo}`,
    atalhos: base.atalhos.map((atalho, i) =>
      i === 0
        ? { ...atalho, href: `/ambiental/licenciamento?q=${encodeURIComponent(termo)}` }
        : atalho
    ),
  };
}

/**
 * Tabela do degrau 1.5 — comandos diretos de tabelas.
 * `exatos` casa com a pergunta inteira; `contem` casa por substring;
 * `comecaCom` casa pela ponta inicial.
 */
const TABELAS: EntradaCartao[] = [
  {
    exatos: [],
    contem: ["painel de licenciamento", "licenciamento ambiental"],
    comecaCom: ["licenciamento", "licenca", "licencas"],
    cartao: {
      tipo: "pagina",
      titulo: "Licenciamento Ambiental de Minas Gerais",
      subtitulo: "19.713 Empreendimentos Catalogados · SEMAD / COPAM",
      texto:
        "Consulte processos de licença prévia (LP), instalação (LI) e operação (LO) deferidas pela SEMAD e pelo COPAM com filtros por município, setor e classe de impacto.",
      categoria: "Licenciamento",
      atalhos: [
        { rotulo: "Abrir Tabela de Licenciamento", href: "/ambiental/licenciamento", principal: true },
        { rotulo: "Pautas do COPAM", href: "/ambiental/copam" },
        { rotulo: "Condicionantes de Barragens", href: "/ambiental/condicionantes" },
        { rotulo: "Termos de Ajustamento (TACs)", href: "/ambiental/tac" },
      ],
    },
    montar: montarLicenciamento,
  },
  {
    exatos: [],
    contem: ["painel de convenios"],
    comecaCom: ["convenio", "convenios"],
    cartao: {
      tipo: "pagina",
      titulo: "Convênios & Estudos Ambientais",
      subtitulo: "3.000+ Parcerias Oficiais de Órgãos Estaduais",
      texto:
        "Tabela de convênios firmados pela SEMAD, IEF, IGAM e FEAM com prefeituras, universidades e entidades civis com valores, vigência e prestação de contas.",
      categoria: "Convênios",
      atalhos: [
        { rotulo: "Tabela de Convênios", href: "/ambiental/convenios", principal: true },
        { rotulo: "Compras no PNCP", href: "/estado-e-economia/compras" },
        { rotulo: "Repasses ComunicaBR", href: "/dados/comunicabr" },
      ],
    },
  },
  {
    exatos: ["legislacao"],
    contem: ["legislacao ambiental"],
    comecaCom: ["lei ", "leis ", "decreto "],
    cartao: {
      tipo: "pagina",
      titulo: "Legislação Ambiental Unificada",
      subtitulo: "20.000+ Normas com URN Canônica LexML",
      texto:
        "Acervo completo de leis, decretos e resoluções ambientais federais e estaduais com identificadores persistentes e texto integral.",
      categoria: "Legislação",
      atalhos: [
        { rotulo: "Acervo de Legislação Ambiental", href: "/ambiental/legislacao", principal: true },
        { rotulo: "Pautas do COPAM", href: "/ambiental/copam" },
        { rotulo: "Termos de Ajustamento (TACs)", href: "/ambiental/tac" },
      ],
    },
  },
  {
    exatos: ["condicionantes"],
    contem: ["condicionantes ambientais", "condicionantes de barragens"],
    cartao: {
      tipo: "pagina",
      titulo: "Condicionantes Ambientais de Barragens",
      subtitulo: "Piloto Irapé e Setúbal · Evidências e Cumprimento",
      texto:
        "Auditoria pública de condicionantes de licenças e TACs: reassentamentos, monitoramento sísmico e proteção biológica com links auditáveis à fonte oficial.",
      categoria: "Meio Ambiente",
      atalhos: [
        { rotulo: "Painel de Condicionantes", href: "/ambiental/condicionantes", principal: true },
        { rotulo: "Painel de Barragens", href: "/ambiental/barragens" },
        { rotulo: "Descaracterização", href: "/ambiental/barragens/descaracterizacao" },
      ],
    },
  },
];

/**
 * Degrau 1.5 — comandos diretos de tabelas e bases.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da tabela, ou `null` para o degrau seguinte.
 */
export function degrau15Tabelas(normalizada: string): ResultadoEscada | null {
  return primeiroCartao(normalizada, TABELAS);
}
