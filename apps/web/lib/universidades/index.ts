/**
 * @file apps/web/lib/universidades/index.ts
 * @description Consultas e agregados do índice universitário.
 *
 * Papel no portal: ser a única porta entre o dado versionado das instituições
 * e as páginas. A página de servidor importa o AGREGADO (`resumirUniversidades`)
 * e a lista já filtrada — nunca monta total à mão.
 *
 * Regras que este módulo garante:
 * - busca tolerante a acento, reusando `semAcento`/`separarPalavras` da busca
 *   global (`lib/busca/normalizar.ts`);
 * - todo filtro devolve resultado ou lista vazia honesta, nunca erro;
 * - ordenação em pt-BR, com desempate estável por nome;
 * - agregação sempre calculada do array, para o cartão de topo bater com a
 *   lista (QUALIDADES-DA-INFORMACAO.md, itens 2 e 4).
 */

import { semAcento, separarPalavras } from "@/lib/busca/normalizar";
import { INSTITUICOES_MG } from "./dados-mg";
import { GRUPOS_UFOP } from "./dados-ufop";
import {
  GRUPOS_UFVJM,
  INSTITUICAO_UFVJM,
  PROJETOS_UFVJM,
  UNIDADES_UFVJM,
} from "./dados-ufvjm";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "./tipos";

export const INSTITUICOES: Instituicao[] = [
  INSTITUICAO_UFVJM,
  ...INSTITUICOES_MG,
];
export const UNIDADES: Unidade[] = [...UNIDADES_UFVJM];
export const GRUPOS: GrupoPesquisa[] = [...GRUPOS_UFVJM, ...GRUPOS_UFOP];
export const PROJETOS: ProjetoExtensao[] = [...PROJETOS_UFVJM];

/** Filtro comum aos catálogos. Texto vazio não filtra. */
export interface Filtro {
  instituicao?: string;
  area?: string;
  busca?: string;
}

/** Cartões de topo: tudo calculado do dado, com a data mais recente de acesso. */
export interface ResumoUniversidades {
  instituicoes: number;
  unidades: number;
  grupos: number;
  projetos: number;
  areas: number;
  ufs: number;
  verificadoEm: string;
}

/** Devolve a instituição pela sigla, sem diferenciar maiúscula/minúscula. */
export function obterInstituicao(sigla: string): Instituicao | undefined {
  const alvo = sigla.trim().toUpperCase();
  return INSTITUICOES.find((i) => i.sigla.toUpperCase() === alvo);
}

/** Lista as instituições em ordem alfabética de sigla. */
export function listarInstituicoes(): Instituicao[] {
  return [...INSTITUICOES].sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"));
}

/** Unidades de uma instituição, em ordem alfabética de nome. */
export function listarUnidades(sigla: string): Unidade[] {
  const alvo = sigla.trim().toUpperCase();
  return UNIDADES.filter((u) => u.instituicao.toUpperCase() === alvo).sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/**
 * Casa a busca contra nome, área e líder.
 *
 * Todos os termos digitados precisam aparecer (E, não OU): "agro campesinato"
 * acha o NAC; "agro" sozinho acha todos os de agronomia.
 */
function casaBusca(texto: string, termos: string[]): boolean {
  if (termos.length === 0) return true;
  const alvo = semAcento(texto);
  return termos.every((t) => alvo.includes(t));
}

function termosDe(busca?: string): string[] {
  if (!busca || !busca.trim()) return [];
  return separarPalavras(busca);
}

/** Grupos de pesquisa, com filtro opcional e ordenação por nome. */
export function listarGrupos(filtro: Filtro = {}): GrupoPesquisa[] {
  const termos = termosDe(filtro.busca);
  const area = filtro.area ? semAcento(filtro.area) : null;
  const instituicao = filtro.instituicao?.toUpperCase();

  return GRUPOS.filter((g) => {
    if (instituicao && g.instituicao.toUpperCase() !== instituicao) return false;
    if (area && semAcento(g.area) !== area) return false;
    return casaBusca(`${g.nome} ${g.area} ${g.lider}`, termos);
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Projetos de extensão, com filtro opcional e ordenação por nome. */
export function listarProjetos(filtro: Filtro = {}): ProjetoExtensao[] {
  const termos = termosDe(filtro.busca);
  const area = filtro.area ? semAcento(filtro.area) : null;
  const instituicao = filtro.instituicao?.toUpperCase();

  return PROJETOS.filter((p) => {
    if (instituicao && p.instituicao.toUpperCase() !== instituicao) return false;
    if (area && (!p.area || semAcento(p.area) !== area)) return false;
    return casaBusca(`${p.nome} ${p.area ?? ""}`, termos);
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Áreas predominantes presentes nos grupos, em ordem alfabética. */
export function areasDisponiveis(): string[] {
  return [...new Set(GRUPOS.map((g) => g.area))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Agrupa os grupos por área predominante, na ordem alfabética da área. */
export function agruparGruposPorArea(
  grupos: GrupoPesquisa[] = GRUPOS,
): { area: string; grupos: GrupoPesquisa[] }[] {
  const mapa = new Map<string, GrupoPesquisa[]>();
  for (const g of grupos) {
    const lista = mapa.get(g.area) ?? [];
    lista.push(g);
    mapa.set(g.area, lista);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([area, lista]) => ({
      area,
      grupos: [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    }));
}

/** Data mais recente de acesso entre todos os registros (AAAA-MM-DD). */
export function dataMaisRecente(): string {
  const datas = [
    ...INSTITUICOES.map((i) => i.dataAcesso),
    ...GRUPOS.map((g) => g.dataAcesso),
    ...PROJETOS.map((p) => p.dataAcesso),
  ].sort();
  return datas[datas.length - 1] ?? "";
}

/** Agregado dos cartões de topo. Nunca digite total à mão. */
export function resumirUniversidades(): ResumoUniversidades {
  return {
    instituicoes: INSTITUICOES.length,
    unidades: UNIDADES.length,
    grupos: GRUPOS.length,
    projetos: PROJETOS.length,
    areas: areasDisponiveis().length,
    ufs: new Set(INSTITUICOES.map((i) => i.uf)).size,
    verificadoEm: dataMaisRecente(),
  };
}
