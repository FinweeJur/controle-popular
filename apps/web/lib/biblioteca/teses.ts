/**
 * lib/biblioteca/teses.ts
 *
 * Slices da tesouraria acadêmica sobre Atingidos por Barragens — dossiê de
 * 420 teses e dissertações de 1991 a 2026, extraídas do levantamento BibELO/
 * Portal de Teses e gravado versionado em `data/biblioteca-teses-atingidos
 * .json` (gerador: `scripts/etl/biblioteca/gerar-teses-atingidos.mjs`).
 *
 * REGRA DO DONO (14/10/2026): nenhuma tese é excluída — cada item recebe um
 * `destino` determinado pelo título e resumo:
 * - `riodoce` — caso Mariana / Fundão (seção em `/ambiental/mariana`);
 * - `brumadinho` — caso B1 / Paraopeba (seção em `/paraopeba/biblioteca`);
 * - `jequitinhonha` — barragens Irapé, Setúbal e Itapebi (seção em
 *   `/terra-e-territorios/vales`);
 * - `unificada` — sem caso nomeado ou os dois casos juntos; fica na
 *   Biblioteca Geral (`/biblioteca`), junto de SciELO, TACs e ESG.
 *
 * TAG `MAB` — gravada no gerador quando o título ou o resumo menciona o
 * Movimento dos Atingidos por Barragens (dono, 14/10/2026). Aqui o Painel
 * também usa a tag para o filtro "Só MAB".
 *
 * Resumos são copiados LITERALMENTE do repositório da instituição (link
 * oficial em cada item); o portal não reescreve nem sintetiza (AGENTS §7 —
 * resumo da máquina nunca vira voz do portal).
 */

import dadosBrutos from "@/data/biblioteca-teses-atingidos.json";

export type DestinoTese = "riodoce" | "brumadinho" | "unificada" | "jequitinhonha";

export interface Tese {
  id: string;
  titulo: string;
  autor: string;
  tipo: string;
  ano: number | null;
  instituicao: string;
  sigla: string | null;
  pais: string | null;
  idioma: string | null;
  acesso: string | null;
  resumo: string | null;
  links: string[];
  /** Quando o link não veio na fonte e foi conferido à mão na página oficial:
      quem conferiu e quando. Veio do CSV → ausente. */
  fonteDoLink?: string;
  /** Por qual levantamento chegou: `geral` (bibelo, 420) ou `ati` (4). */
  levantamento: "geral" | "ati";
  destino: DestinoTese;
  desastre: "mariana" | "brumadinho" | "ambos" | null;
  tags: string[];
  motivo: string;
}

/** Todos os itens do acervo versionado, sem filtro. */
export const TODAS_TESES: readonly Tese[] = dadosBrutos.itens as Tese[];

/** Contagem medida, nunca digitada à mão (AGENTS §8). */
export const COBERTURA_TESES = {
  total: TODAS_TESES.length,
  porDestino: {
    riodoce: TODAS_TESES.filter((t) => t.destino === "riodoce").length,
    brumadinho: TODAS_TESES.filter((t) => t.destino === "brumadinho").length,
    unificada: TODAS_TESES.filter((t) => t.destino === "unificada").length,
    jequitinhonha: TODAS_TESES.filter((t) => t.destino === "jequitinhonha").length,
  },
  comTagMab: TODAS_TESES.filter((t) => t.tags.includes("MAB")).length,
  comResumo: TODAS_TESES.filter((t) => t.resumo).length,
} as const;

/** Fatia por destino: o que a página daquele destino exibe. */
export function tesesPorDestino(destino: DestinoTese): readonly Tese[] {
  return TODAS_TESES.filter((t) => t.destino === destino);
}
