/**
 * Síntese temática da auditoria AECOM — os 16 eixos do rompimento da barragem
 * B-I em Brumadinho (2019-2026), com o resumo executivo, a tabela de prazos
 * (prometido × atual), as pendências que atravessam o acervo inteiro e os
 * pontos onde a base de evidência é mais rasa. ARQUIVO GERADO — não editar à
 * mão.
 *
 * ═══ ORIGEM ═══
 *
 * Gerado por `scripts/gerar-sintese-ajri.mts` a partir de
 * `X:\DevCoder\_ajri\SINTESE-TEMATICA.md` (fora do repo, de propósito).
 * O conteúdo foi auditado na fase de conteúdo contra os 337 resumos, contra o
 * texto original e contra `powerbi/indicadores-portal.md` (achados do painel
 * de indicadores do portal) — 64+ códigos de documento citados, todos reais;
 * toda citação ao painel conferida contra a fonte da captura visual. A
 * integração não reaudita: só transpila e confere estrutura. Para regenerar:
 * `npx tsx scripts/gerar-sintese-ajri.mts`.
 *
 * ═══ DUAS FONTES DENTRO DA MESMA SÍNTESE ═══
 *
 * A maioria dos achados cita um código de documento AECOM (`\d{5}-ACM-...`).
 * Alguns citam em vez disso o painel de indicadores do próprio portal
 * (`/indicadores`), que publica percentual de avanço por obra fora do ciclo
 * de relatórios em PDF, às vezes com data mais recente que qualquer PDF do
 * acervo. Esses achados trazem "Painel de indicadores (DD/MM/AAAA)" no texto
 * — a UI não precisa tratar diferente, mas quem lê sabe de onde veio cada
 * número.
 *
 * ═══ AUTORIA ═══
 *
 * A síntese é obra deste portal, como os resumos — o material de origem é da
 * AECOM, publicada sob os termos de uso do portal da auditoria. Cada achado
 * carrega o código do documento ou a data do painel que o sustenta (mesma
 * ponte da ficha).
 */

export interface GraficoDaSintese {
  /** Caminho público, ex. "/paraopeba/auditoria/graficos/01-manejo-rejeitos.png". */
  src: string;
  /** Legenda/alt-text — inclui a fonte e a data de atualização do painel. */
  legenda: string;
}

export interface EixoDaSintese {
  /** Nome do eixo, ex. "Fornecimento e captação de água". */
  titulo: string;
  /** Balanço geral do eixo no conjunto dos 337 relatórios. */
  estadoGeral: string;
  /** Como o tema evoluiu entre 2019 e 2026. */
  evolucao: string;
  /** Achados com o código do documento (ou a data do painel) que os sustenta. */
  achados: string[];
  /** Números-chave do eixo, com unidade, em texto corrido. */
  numerosChave: string;
  /** Gráficos do painel de indicadores relacionados a este eixo, se houver. */
  graficos: GraficoDaSintese[];
}

export interface ItemDaSintese {
  titulo: string;
  texto: string;
}

/** Uma linha da tabela de prazos: o que foi prometido × o que está valendo hoje. */
export interface LinhaDePrazoAjri {
  obra: string;
  prazoInicial: string;
  prazoAtual: string;
  atraso: string;
  resumo: string;
}

/**
 * SINTESE_AJRI saiu daqui em 2026-08-25: virou
 * etl/betim/dados/sintese-ajri-bundle.json, lido via sintese-ajri-dados.ts
 * (server-only). Motivo no cabecalho de lib/server-only/json-etl.ts: teto de
 * 3 MiB gzip do Worker Free (erro 10027).
 */
