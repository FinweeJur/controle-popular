/**
 * @file apps/web/lib/direitos-globais/sentencas.ts
 * @description Sentenças de mérito da Corte IDH contra países da América Latina.
 *
 * Fonte: Corte Interamericana de Direitos Humanos, página "Sentencias"
 * (casos contenciosos), lida em 2026-10-30. O acesso usou Chrome normal com
 * autorização do dono, porque o site bloqueia cliente automatizado com
 * Cloudflare Turnstile. Nenhum CAPTCHA foi resolvido por máquina.
 *
 * O que entra: sentença de mérito (Fondo / Reparaciones y Costas). Ficam
 * fora interpretação de sentença, cumprimento, supervisão e resolução.
 * Cada linha é uma condenação do Estado, não um caso em trâmite.
 */

import type { Sentenca } from "./tipos-sentenca";
import { SENTENCAS_A } from "./sentencas-a";
import { SENTENCAS_B } from "./sentencas-b";
import { SENTENCAS_C } from "./sentencas-c";

export type { Sentenca };

export const SENTENCAS: readonly Sentenca[] = [
  ...SENTENCAS_A,
  ...SENTENCAS_B,
  ...SENTENCAS_C,
];

/** Sentenças de um país, da mais recente para a mais antiga. */
export function sentencasDoPais(pais: string): readonly Sentenca[] {
  return SENTENCAS.filter((s) => s.pais === pais).sort((a, b) =>
    b.dataSentenca.localeCompare(a.dataSentenca),
  );
}

/** Países condenados, em ordem alfabética. */
export function paisesCondenados(): string[] {
  return [...new Set(SENTENCAS.map((s) => s.pais))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}
