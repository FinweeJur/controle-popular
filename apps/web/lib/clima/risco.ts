import { readFileSync } from "node:fs";
import path from "node:path";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Risco climático por município (AdaptaBrasil / MCTI), lido no BUILD e,
 * quando publicado, por `env.ASSETS.fetch()` — nunca `readFileSync` de
 * caminho estático em código de Worker, que embutiria os 2,78 MiB de
 * `public/data/risco-climatico.json` no bundle. Mesmo mecanismo de
 * `lib/comunicabr/mg.ts`, e a mesma regra medida lá em 16/08/2026: qualquer
 * falha do lado do binding (inclusive um 404 esperado durante `next build`
 * local, quando `env.ASSETS` existe mas o asset ainda não foi publicado
 * nele) cai para `readFileSync` — nunca relança. Relançar foi o bug que
 * publicou `/dados/comunicabr` vazio em silêncio; ver
 * `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`.
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

const ARQUIVO = "risco-climatico.json";

let cache: LinhaRisco[] | null = null;
let emVoo: Promise<LinhaRisco[]> | null = null;

async function linhas(): Promise<LinhaRisco[]> {
  if (cache) return cache;
  if (emVoo) return emVoo;
  emVoo = (async () => {
    try {
      let bruto: string;
      try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env.ASSETS) throw new Error("sem ASSETS");
        const resp = await env.ASSETS.fetch(new URL(`http://assets.local/data/${ARQUIVO}`));
        if (!resp.ok) throw new Error(`ASSETS.fetch devolveu ${resp.status}`);
        bruto = await resp.text();
      } catch {
        // Cai para o disco — build local, teste, ou 404 de build (ver o
        // comentário grande no topo do arquivo).
        bruto = readFileSync(path.join(process.cwd(), "public", "data", ARQUIVO), "utf-8");
      }
      cache = (JSON.parse(bruto).linhas ?? []) as LinhaRisco[];
    } catch {
      // Arquivo ausente não derruba o build: uma instalação nova, ou um clone
      // antes da primeira coleta, não pode impedir a publicação do site inteiro
      // por causa de uma seção. A tela diz que não há dado.
      cache = [];
    }
    return cache;
  })();
  return emVoo;
}

export async function riscoDoMunicipio(
  idMunicipio: string,
  qual: keyof typeof INDICES
): Promise<RiscoMunicipio | null> {
  const cfg = INDICES[qual];
  const doMunicipio = (await linhas()).filter((l) => String(l.id_municipio) === String(idMunicipio));
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
export async function coberturaRisco(): Promise<{ municipios: number; ano: number | null }> {
  const ls = await linhas();
  return {
    municipios: new Set(ls.map((l) => String(l.id_municipio))).size,
    ano: ls[0]?.ano ?? null,
  };
}
