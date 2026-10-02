/**
 * @file apps/web/lib/judiciario/sisdepen.ts
 * @description Tipos do SISDEPEN (população prisional, capacidade e perfil) por
 * UF — o contexto que enriquece `/judiciario/presidios` (inspeção judicial).
 *
 * ═══ O QUE É (AGENTS §7) ═══
 * Censo agregado por estabelecimento reportado à SENAPPEN. População ÷
 * capacidade = taxa de ocupação; acima de 100% é superlotação declarada pela
 * própria administração. Perfil (cor/raça, faixa etária) é autodeclarado e
 * agregado — nunca individual. O dado é o contexto do que a inspeção encontra.
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-sisdepen.ts`.
 */

export interface SisdepenUf extends Record<string, unknown> {
  uf: string;
  estabelecimentos: number;
  populacao: number;
  capacidade: number;
  /** População ÷ capacidade × 100. Acima de 100 = superlotação. */
  taxa_ocupacao: number | null;
  provisorios: number;
  provisorios_pct: number | null;
  fechado: number;
  semiaberto: number;
  aberto: number;
  faixa_18_24: number;
  pretos_pardos: number;
  pretos_pardos_pct: number | null;
}

export interface AcervoSisdepen {
  fonte: string;
  url_fonte: string;
  url_arquivo: string;
  ciclo: string;
  referencia: string;
  atualizado_em: string;
  metodologia: string;
  total_estabelecimentos: number;
  brasil: SisdepenUf & { uf: "BR" };
  registros: SisdepenUf[];
}
