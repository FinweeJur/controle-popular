import bruto from "@/data/estudos-rurais/estudos-rurais.json";

/**
 * ═══ ESTUDOS RURAIS — LÓGICA PURA DA PÁGINA ═══
 *
 * Padrão do repositório: `<mod>.ts` + `<mod>.test.ts` ao lado, sem React.
 * O JSON vem de `scripts/coletar-estudos-rurais.mts` (fontes, pausas e as
 * decisões de bloqueio documentadas no cabeçalho daquele script).
 *
 * ═══ LACUNA É INFORMAÇÃO ═══
 *
 * A primeira rodada coletou apenas `noticia` (radar de Google News + feed do
 * ICA/UFVJM). Dissertações do PPGER ficaram de fora porque a API REST do
 * repositório institucional responde HTML da SPA em toda rota testada
 * (08/09/2026) — a lacuna viaja DENTRO do JSON (`lacunas`), e esta página a
 * declara em vez de escondê-la. Os números abaixo são MEDIDOS do arquivo,
 * nunca digitados à mão.
 */

export type TipoItem = "noticia" | "artigo" | "evento" | "publicacao";

export interface ItemEstudoRural {
  id: string;
  titulo: string;
  tipo: TipoItem | string;
  fonte: string;
  fonte_url: string;
  /** ISO (AAAA-MM-DD). Nulo = a fonte não trouxe data; aparece como "—". */
  data: string | null;
  /** Texto da própria fonte, truncado em 300 caracteres na coleta. */
  resumo: string;
  url: string;
}

export interface FonteColetada {
  id: string;
  titulo: string;
  url: string;
  metodo: string;
  itens: number;
  observacao?: string;
}

export interface AcervoEstudosRurais {
  schema: number;
  coletadoEm: string;
  maquina: string;
  /** `true` = dados de exemplo, não coletados. Esta página nunca deve vê-lo true. */
  exemplo: boolean;
  contagens: { itens: number; porTipo: Record<string, number> };
  fontes: FonteColetada[];
  lacunas: string[];
  itens: ItemEstudoRural[];
}

export const ACERVO = bruto as unknown as AcervoEstudosRurais;

export const ITENS: ItemEstudoRural[] = ACERVO.itens;

export const COBERTURA = {
  itens: ITENS.length,
  coletadoEm: ACERVO.coletadoEm,
  exemplo: ACERVO.exemplo,
  fontes: ACERVO.fontes.length,
  lacunas: ACERVO.lacunas.length,
  semData: ITENS.filter((i) => !i.data).length,
};

// ─── agregados ────────────────────────────────────────────────────────────

/** Totais por tipo, na ordem fixa do menu — tipos sem item aparecem com 0. */
export const POR_TIPO: { tipo: TipoItem; rotulo: string; total: number }[] = (
  [
    ["noticia", "Notícias"],
    ["artigo", "Artigos"],
    ["evento", "Eventos"],
    ["publicacao", "Publicações"],
  ] as const
).map(([tipo, rotulo]) => ({
  tipo,
  rotulo,
  total: ITENS.filter((i) => i.tipo === tipo).length,
}));

/** Distribuição por ano (dos itens datados) — alimenta o gráfico. */
export const POR_ANO: { ano: number; total: number }[] = (() => {
  const contagem = new Map<number, number>();
  for (const i of ITENS) {
    if (!i.data) continue;
    const ano = Number(i.data.slice(0, 4));
    if (!Number.isFinite(ano)) continue;
    contagem.set(ano, (contagem.get(ano) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => a[0] - b[0]).map(([ano, total]) => ({ ano, total }));
})();

/** Últimos anos a exibir no gráfico (os demais somam "anterior a", se houver). */
export const ANOS_GRAFICO = 8;

/** Série do gráfico: últimos `ANOS_GRAFICO` anos + linha "anterior a", se existir. */
export const SERIE_GRAFICO: { rotulo: string; total: number; ano: number | null }[] = (() => {
  if (POR_ANO.length === 0) return [];
  const anoMax = POR_ANO[POR_ANO.length - 1].ano;
  const anoMin = Math.max(POR_ANO[0].ano, anoMax - ANOS_GRAFICO + 1);
  const serie: { rotulo: string; total: number; ano: number | null }[] = POR_ANO.filter(
    (a) => a.ano >= anoMin,
  ).map((a) => ({ rotulo: String(a.ano), total: a.total, ano: a.ano }));
  const anteriores = POR_ANO.filter((a) => a.ano < anoMin).reduce((t, a) => t + a.total, 0);
  if (anteriores > 0) {
    serie.unshift({ rotulo: `até ${anoMin - 1}`, total: anteriores, ano: null });
  }
  return serie;
})();

/** Distintas fontes que aparecem nos itens (para o seletor de filtro). */
export function listarFontes(): string[] {
  return [...new Set(ITENS.map((i) => i.fonte))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Distintos tipos presentes (para o seletor; exclui tipo sem item). */
export function listarTipos(): { tipo: string; rotulo: string }[] {
  return POR_TIPO.filter((t) => t.total > 0).map((t) => ({ tipo: t.tipo, rotulo: t.rotulo }));
}

/** Anos presentes (para o seletor), do mais recente ao mais antigo. */
export function listarAnos(): number[] {
  return [...new Set(ITENS.map((i) => (i.data ? Number(i.data.slice(0, 4)) : 0)).filter(Boolean))].sort(
    (a, b) => b - a,
  );
}

// ─── CSV ──────────────────────────────────────────────────────────────────

/**
 * CSV do recorte FILTRADO na tela. BOM UTF-8 + separador `;` (regra do dono,
 * AGENTS.md: Excel brasileiro abre tudo numa coluna e com acento quebrado
 * sem os dois). Valores com `;`, `"` ou quebra de linha são aspas duplas.
 */
export function itensParaCsv(linhas: readonly ItemEstudoRural[]): string {
  const BOM = "\uFEFF";
  const cabecalho = ["titulo", "tipo", "data", "fonte", "url", "resumo"].join(";");
  const corpo = linhas.map((i) =>
    [i.titulo, i.tipo, i.data ?? "", i.fonte, i.url, i.resumo]
      .map((v) => {
        const s = String(v);
        return s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(";"),
  );
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}
