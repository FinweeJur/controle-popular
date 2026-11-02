/**
 * ═══ CONCURSOS PÚBLICOS E TEMPORÁRIOS — DADOS E AGREGADOS NACIONAIS ═══
 *
 * O que é:
 *   Camada de dados estáticos e agregações estatísticas do radar nacional de
 *   concursos públicos e contratações temporárias (PSS/REDA/ACT) do Controle Popular.
 *
 * Fonte oficial:
 *   Diários Oficiais da União, Estados e Municípios, editais publicados pelas bancas
 *   examinadoras e páginas oficiais de concursos dos órgãos públicos.
 *
 * Por que foi feito assim:
 *   - Regra 5.1: Payload estático sob controle, lido no build e compartilhado.
 *   - Regra 5.9: Cabeçalho explicativo com fonte oficial e propósito cívico.
 *   - 8 Qualidades da Informação: cartões com dados matemáticos derivados do dataset,
 *     exportação CSV com BOM UTF-8 e `;`, sem dados manuais falsos.
 */

import bruto from "@/data/concursos-publicos.json";
import type { AcervoConcursos, ItemConcurso } from "./tipos";

export * from "./tipos";
export * from "./filtros";

export const ACERVO_CONCURSOS = bruto as unknown as AcervoConcursos;
export const ITENS_CONCURSOS: ItemConcurso[] = ACERVO_CONCURSOS.itens;

// ─── MAPAS E DISTRIBUIÇÕES DERIVADAS MATEMATICAMENTE ───────────────────────

const esferasMap = new Map<string, number>();
const poderesMap = new Map<string, number>();
const modalidadesMap = new Map<string, number>();
const statusMap = new Map<string, number>();
const ufsMap = new Map<string, number>();
const escolaridadesMap = new Map<string, number>();

for (const item of ITENS_CONCURSOS) {
  esferasMap.set(item.esfera, (esferasMap.get(item.esfera) ?? 0) + 1);
  poderesMap.set(item.poder, (poderesMap.get(item.poder) ?? 0) + 1);
  modalidadesMap.set(item.modalidade, (modalidadesMap.get(item.modalidade) ?? 0) + 1);
  statusMap.set(item.status, (statusMap.get(item.status) ?? 0) + 1);
  ufsMap.set(item.uf, (ufsMap.get(item.uf) ?? 0) + 1);
  escolaridadesMap.set(item.escolaridade, (escolaridadesMap.get(item.escolaridade) ?? 0) + 1);
}

export const DISTRIBUICAO_ESFERA = [...esferasMap.entries()]
  .map(([chave, total]) => ({ chave, total }))
  .sort((a, b) => b.total - a.total);

export const DISTRIBUICAO_PODER = [...poderesMap.entries()]
  .map(([chave, total]) => ({ chave, total }))
  .sort((a, b) => b.total - a.total);

export const DISTRIBUICAO_MODALIDADE = [...modalidadesMap.entries()]
  .map(([chave, total]) => ({ chave, total }))
  .sort((a, b) => b.total - a.total);

export const DISTRIBUICAO_STATUS = [...statusMap.entries()]
  .map(([chave, total]) => ({ chave, total }))
  .sort((a, b) => b.total - a.total);

export const DISTRIBUICAO_UF = [...ufsMap.entries()]
  .map(([chave, total]) => ({ chave, total }))
  .sort((a, b) => b.total - a.total);

export const METRICAS_CONCURSOS = {
  totalCertames: ITENS_CONCURSOS.length,
  totalVagasImediatas: ITENS_CONCURSOS.reduce((acc, curr) => acc + (curr.vagasImediatas || 0), 0),
  totalVagasCadastroReserva: ITENS_CONCURSOS.reduce((acc, curr) => acc + (curr.vagasCadastroReserva || 0), 0),
  maiorRemuneracao: Math.max(...ITENS_CONCURSOS.map((i) => i.remuneracaoNumMax || 0)),
  totalUfs: ufsMap.size,
  totalPoderes: poderesMap.size,
  atualizadoEm: ACERVO_CONCURSOS.atualizadoEm || "2026-11-02",
};

// ─── LISTAS AUXILIARES PARA SELETORES E FILTROS ────────────────────────────

export function listarEsferas(): string[] {
  return DISTRIBUICAO_ESFERA.map((d) => d.chave);
}

export function listarPoderes(): string[] {
  return DISTRIBUICAO_PODER.map((d) => d.chave);
}

export function listarModalidades(): string[] {
  return DISTRIBUICAO_MODALIDADE.map((d) => d.chave);
}

export function listarStatus(): string[] {
  return DISTRIBUICAO_STATUS.map((d) => d.chave);
}

export function listarEscolaridades(): string[] {
  return [...escolaridadesMap.keys()];
}

export function listarUfs(): string[] {
  return [...ufsMap.keys()].sort((a, b) => {
    if (a === "Nacional") return -1;
    if (b === "Nacional") return 1;
    return a.localeCompare(b);
  });
}

// ─── EXPORTAÇÃO CSV PADRONIZADA (BOM UTF-8 + separador `;`) ────────────────

/**
 * Converte a lista de certames filtrados em arquivo CSV compatível com
 * o Excel brasileiro, contendo BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;).
 */
export function concursosParaCsv(linhas: readonly ItemConcurso[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "id",
    "orgao",
    "nome_completo",
    "esfera",
    "poder",
    "natureza_juridica",
    "modalidade",
    "uf",
    "municipio",
    "cargos",
    "escolaridade",
    "vagas_imediatas",
    "vagas_cr",
    "remuneracao_inicial",
    "remuneracao_num_min",
    "remuneracao_num_max",
    "banca",
    "status",
    "periodo_inscricao",
    "taxa_inscricao",
    "data_prova",
    "link_edital",
    "data_atualizacao",
  ].join(";");

  const corpo = linhas.map((i) =>
    [
      i.id,
      i.orgao,
      i.nomeCompleto,
      i.esfera,
      i.poder,
      i.natureza,
      i.modalidade,
      i.uf,
      i.municipio,
      Array.isArray(i.cargos) ? i.cargos.join(", ") : i.cargos,
      i.escolaridade,
      i.vagasImediatas,
      i.vagasCadastroReserva,
      i.remuneracaoInicial,
      i.remuneracaoNumMin,
      i.remuneracaoNumMax,
      i.banca,
      i.status,
      i.periodoInscricao,
      i.taxaInscricao,
      i.dataProva,
      i.linkEdital,
      i.dataAtualizacao,
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
