import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Risco climático por município (AdaptaBrasil / MCTI), lido no BUILD.
 *
 * ## Por que arquivo, e não banco
 *
 * O coletor sabe gravar nos dois (`etl.apis.adaptabrasil_risco`, com `--json`).
 * Aqui é arquivo porque o banco é o gargalo, não a coleta: a Neon está em
 * HTTP 402 até 2026-09-01, e sem esse caminho a tela ficaria bloqueada por uma
 * cota de transferência. 853 municípios × 8 indicadores é dado pequeno, sem
 * junção, e versionado dá diff legível quando o índice de uma cidade muda.
 *
 * ## ⚠️ O índice de manchete NÃO pode ir sozinho para a tela
 *
 * É a razão de este arquivo expor as COMPONENTES, e não só o resultado.
 *
 * Belo Horizonte pontua **0,00 — "Muito baixo"** nos dois índices de manchete
 * (deslizamento e inundação). As componentes dizem outra coisa: Ameaça 0,86,
 * Exposição 0,91 e domicílios em área de risco 1,00. É a Vulnerabilidade 0,00
 * que zera o produto — e só BH e Funilândia zeram entre os 853.
 *
 * Publicar o índice sozinho diria a uma cidade com 389.218 pessoas em área de
 * risco que o risco dela é muito baixo. Quem lê o mapa não tem como suspeitar
 * de um zero; ele parece medição, não artefato de fórmula.
 *
 * Por isso `indicePorMunicipio` devolve sempre o índice **com** as três
 * componentes, e `zeroPorVulnerabilidade` marca o caso em que o produto zerou
 * com componente alta — para a tela avisar em vez de repetir o número.
 */

export interface LinhaRisco {
  id_municipio: string;
  indicador_id: number;
  indicador_nome: string;
  indicador_pai_id: number | null;
  nivel: number;
  ano: number;
  valor: number | null;
  faixa: string | null;
}

/** Os dois índices de manchete e as componentes de cada um. */
export const INDICES = {
  deslizamento: { id: 60001, nome: "Deslizamentos", componentes: [60002, 60003, 60004] },
  inundacao: { id: 60041, nome: "Inundações, enxurradas e alagamentos", componentes: [60042, 60043, 60044] },
} as const;

export interface RiscoMunicipio {
  indice: number | null;
  faixa: string | null;
  componentes: { id: number; nome: string; valor: number | null }[];
  /**
   * O índice deu ~zero mas alguma componente é alta.
   *
   * O limiar de 0,5 não é arbitrário: componente acima disso significa que
   * metade ou mais do fenômeno está presente, e um produto zerado sobre isso é
   * artefato da fórmula, não ausência de risco.
   */
  zeroPorVulnerabilidade: boolean;
}

let cache: LinhaRisco[] | null = null;

function linhas(): LinhaRisco[] {
  if (cache) return cache;
  try {
    const caminho = path.join(process.cwd(), "data", "risco-climatico.json");
    cache = (JSON.parse(readFileSync(caminho, "utf-8")).linhas ?? []) as LinhaRisco[];
  } catch {
    // Arquivo ausente não derruba o build: uma instalação nova, ou um clone
    // antes da primeira coleta, não pode impedir a publicação do site inteiro
    // por causa de uma seção. A tela diz que não há dado.
    cache = [];
  }
  return cache;
}

export function riscoDoMunicipio(
  idMunicipio: string,
  qual: keyof typeof INDICES
): RiscoMunicipio | null {
  const cfg = INDICES[qual];
  const doMunicipio = linhas().filter((l) => String(l.id_municipio) === String(idMunicipio));
  if (!doMunicipio.length) return null;

  const principal = doMunicipio.find((l) => l.indicador_id === cfg.id);
  const componentes = cfg.componentes
    .map((id) => doMunicipio.find((l) => l.indicador_id === id))
    .filter((l): l is LinhaRisco => Boolean(l))
    .map((l) => ({ id: l.indicador_id, nome: l.indicador_nome, valor: l.valor }));

  const indice = principal?.valor ?? null;
  const algumaAlta = componentes.some((c) => (c.valor ?? 0) >= 0.5);

  return {
    indice,
    faixa: principal?.faixa ?? null,
    componentes,
    zeroPorVulnerabilidade: indice !== null && indice < 0.01 && algumaAlta,
  };
}

/** Quantos municípios o arquivo cobre — para a tela dizer a cobertura real. */
export function coberturaRisco(): { municipios: number; ano: number | null } {
  const ls = linhas();
  return {
    municipios: new Set(ls.map((l) => String(l.id_municipio))).size,
    ano: ls[0]?.ano ?? null,
  };
}
