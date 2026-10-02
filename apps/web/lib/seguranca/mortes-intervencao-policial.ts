/**
 * @file apps/web/lib/seguranca/mortes-intervencao-policial.ts
 * @description Tipos das mortes por intervenção de agente do Estado (letalidade
 * policial) — Sinesp VDE / MJSP. Exibido em
 * `/direitos-em-movimento/seguranca-publica`.
 *
 * ═══ O QUE É (AGENTS §7) ═══
 * Contagem oficial, agregada por UF e mês. A participação é calculada sobre as
 * mortes violentas intencionais (definição do FBSP). O dado não traz nome,
 * CPF nem identificação de vítima ou agente — e não traz recorte racial, que o
 * FBSP publica no Anuário. Número errado é dano: os totais são medidos da base.
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-mortes-intervencao.ts`.
 */

export interface MortesPorUf extends Record<string, unknown> {
  uf: string;
  /** Mortes por intervenção de agente do Estado. */
  mdip: number;
  feminino: number;
  masculino: number;
  nao_informado: number;
  /** Mortes violentas intencionais (homicídio doloso + latrocínio + lesão + MDIP). */
  mvi: number;
  participacao_pct: number | null;
  serie_mensal: Record<string, number>;
}

export interface AcervoMortesIntervencao {
  fonte: string;
  url_fonte: string;
  url_arquivo: string;
  ano: number;
  atualizado_em: string;
  metodologia: string;
  brasil: {
    mdip: number;
    feminino: number;
    masculino: number;
    nao_informado: number;
    mvi: number;
    participacao_pct: number | null;
  };
  total_ufs: number;
  registros: MortesPorUf[];
}
