import bruto from "@/data/editais-consolidado.json";

/**
 * ═══ EDITAIS DE MINAS GERAIS — LÓGICA PURA DA PÁGINA ═══
 *
 * Mapeamento e agregação de editais oficiais publicados no Diário Oficial
 * Eletrônico de Minas Gerais (DOMG-e) pelo radar do Controle Popular.
 *
 * Segue estritamente as regras de AGENTS.md:
 * - 5 elementos obrigatórios: gráfico SVG, cartões de topo, CSV com BOM UTF-8,
 *   filtros ativos e ordenação por coluna.
 * - Zero bibliotecas de terceiros para gráficos.
 * - Valores medidos do arquivo JSON consolidado, nunca digitados à mão.
 */

export interface ItemEdital {
  id: string;
  slug?: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  numero: string | null;
  dataPublicacao: string;
  objeto: string;
  condicoesEPrazos: string;
  urlOficial: string;
  score: number;
  pagina?: number | null;
  secao?: string | null;
}

export interface AcervoEditais {
  total: number;
  atualizadoEm: string;
  itens: ItemEdital[];
}

export const ACERVO_EDITAIS = bruto as unknown as AcervoEditais;
export const ITENS_EDITAIS: ItemEdital[] = ACERVO_EDITAIS.itens;

// ─── DISTRIBUIÇÕES E AGREGADOS ─────────────────────────────────────────────

const orgaosMap = new Map<string, number>();
const modalidadesMap = new Map<string, number>();
const datasMap = new Map<string, number>();

for (const item of ITENS_EDITAIS) {
  orgaosMap.set(item.orgao, (orgaosMap.get(item.orgao) ?? 0) + 1);
  modalidadesMap.set(item.modalidade, (modalidadesMap.get(item.modalidade) ?? 0) + 1);
  datasMap.set(item.dataPublicacao, (datasMap.get(item.dataPublicacao) ?? 0) + 1);
}

export const POR_ORGAO = [...orgaosMap.entries()]
  .map(([orgao, total]) => ({ orgao, total }))
  .sort((a, b) => b.total - a.total);

export const POR_MODALIDADE = [...modalidadesMap.entries()]
  .map(([modalidade, total]) => ({ modalidade, total }))
  .sort((a, b) => b.total - a.total);

export const SERIE_DATAS = [...datasMap.entries()]
  .map(([data, total]) => ({ data, total }))
  .sort((a, b) => a.data.localeCompare(b.data));

export const COBERTURA_EDITAIS = {
  total: ITENS_EDITAIS.length,
  orgaosCount: orgaosMap.size,
  modalidadesCount: modalidadesMap.size,
  ultimaData: ITENS_EDITAIS[0]?.dataPublicacao ?? "2026-09-15",
  atualizadoEm: ACERVO_EDITAIS.atualizadoEm,
  topOrgao: POR_ORGAO[0]?.orgao ?? "Governo de MG",
  topModalidade: POR_MODALIDADE[0]?.modalidade ?? "Credenciamento",
};

// ─── LISTAS PARA SELETORES ─────────────────────────────────────────────────

export function listarOrgaos(): string[] {
  return POR_ORGAO.map((o) => o.orgao);
}

export function listarModalidades(): string[] {
  return POR_MODALIDADE.map((m) => m.modalidade);
}

export function listarAnos(): number[] {
  return [
    ...new Set(
      ITENS_EDITAIS.map((i) =>
        i.dataPublicacao ? Number(i.dataPublicacao.slice(0, 4)) : 2026
      ).filter(Boolean)
    ),
  ].sort((a, b) => b - a);
}

// ─── EXPORTAÇÃO CSV (BOM UTF-8 + separador `;`) ───────────────────────────

/**
 * Gera CSV com separador `;` e BOM UTF-8 conforme exigência do AGENTS.md
 * para compatibilidade nativa com Excel brasileiro sem quebra de acentuação.
 */
export function editaisParaCsv(linhas: readonly ItemEdital[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "data_publicacao",
    "orgao",
    "modalidade",
    "numero",
    "titulo",
    "objeto",
    "condicoes_e_prazos",
    "url_oficial",
    "score_relevancia",
  ].join(";");

  const corpo = linhas.map((i) =>
    [
      i.dataPublicacao,
      i.orgao,
      i.modalidade,
      i.numero ?? "",
      i.titulo,
      i.objeto,
      i.condicoesEPrazos,
      i.urlOficial,
      i.score,
    ]
      .map((v) => {
        const s = String(v ?? "");
        return s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(";")
  );

  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}
