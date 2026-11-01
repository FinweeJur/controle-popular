/**
 * @file apps/web/lib/universidades/index.ts
 * @description Consultas e agregados do índice universitário.
 *
 * Papel no portal: ser a única porta entre o dado versionado das instituições
 * e as páginas. A página de servidor importa o AGREGADO (`resumirUniversidades`)
 * e a lista já filtrada — nunca monta total à mão.
 *
 * Filtros que este módulo sustenta (pedido do dono, 2026-10-30):
 * texto livre (nome, líder, unidade, instituição), instituição, estado (UF),
 * unidade/faculdade, área predominante, grande área do conhecimento e tema
 * transversal. Todos tolerantes a acento e caixa.
 *
 * Regras que este módulo garante:
 * - busca reusa `semAcento`/`separarPalavras` da busca global;
 * - todo filtro devolve resultado ou lista vazia honesta, nunca erro;
 * - ordenação em pt-BR, com desempate estável por nome;
 * - agregação sempre calculada do array, para o cartão de topo bater com a
 *   lista (QUALIDADES-DA-INFORMACAO.md, itens 2 e 4);
 * - grande área e tema são DERIVADOS (ver `temas.ts`) e nunca sobrescrevem a
 *   área oficial declarada pela fonte.
 */

import { semAcento, separarPalavras } from "@/lib/busca/normalizar";
import { GRUPOS_BA, INSTITUICOES_BA } from "./dados-ba";
import { INSTITUICOES_MG } from "./dados-mg";
import { INSTITUICOES_RJ } from "./dados-rj";
import { GRUPOS_RS, INSTITUICOES_RS } from "./dados-rs";
import { INSTITUICOES_SP } from "./dados-sp";
import { GRUPOS_UFOP } from "./dados-ufop";
import {
  GRUPOS_UFVJM,
  INSTITUICAO_UFVJM,
  PROJETOS_UFVJM,
  UNIDADES_UFVJM,
} from "./dados-ufvjm";
import { PROJETOS_EXTENSAO_UFVJM } from "./dados-extensao-ufvjm";
import {
  AREA_NAO_INFORMADA,
  GRANDES_AREAS,
  grandeAreaDe,
  nomeDoTema,
  TEMAS,
  temasDe,
} from "./temas";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "./tipos";

export const INSTITUICOES: Instituicao[] = [
  INSTITUICAO_UFVJM,
  ...INSTITUICOES_MG,
  ...INSTITUICOES_SP,
  ...INSTITUICOES_RJ,
  ...INSTITUICOES_BA,
  ...INSTITUICOES_RS,
];
export const UNIDADES: Unidade[] = [...UNIDADES_UFVJM];
export const GRUPOS: GrupoPesquisa[] = [
  ...GRUPOS_UFVJM,
  ...GRUPOS_UFOP,
  ...GRUPOS_BA,
  ...GRUPOS_RS,
];

/**
 * Projetos de extensão.
 *
 * Duas fontes para a UFVJM: o par de projetos conferido à mão em
 * `dados-ufvjm.ts` e a leva gerada do SIEXC em `dados-extensao-ufvjm.ts`.
 * A deduplicação é por URL, a chave que a própria plataforma garante única.
 */
export const PROJETOS: ProjetoExtensao[] = (() => {
  const porUrl = new Map<string, ProjetoExtensao>();
  // A leva gerada entra primeiro: ela traz coordenador, período e área da
  // ficha completa. O par conferido à mão só sobrevive se a URL for outra.
  for (const p of [...PROJETOS_EXTENSAO_UFVJM, ...PROJETOS_UFVJM]) {
    if (!porUrl.has(p.url)) porUrl.set(p.url, p);
  }
  return [...porUrl.values()];
})();

/** Filtro comum aos catálogos. Campo vazio não filtra. */
export interface Filtro {
  instituicao?: string;
  uf?: string;
  unidade?: string;
  area?: string;
  areaConhecimento?: string;
  tema?: string;
  busca?: string;
}

/** Cartões de topo: tudo calculado do dado, com a data mais recente de acesso. */
export interface ResumoUniversidades {
  instituicoes: number;
  unidades: number;
  grupos: number;
  projetos: number;
  areas: number;
  areasConhecimento: number;
  temas: number;
  ufs: number;
  verificadoEm: string;
}

/** Devolve a instituição pela sigla, sem diferenciar maiúscula/minúscula. */
export function obterInstituicao(sigla: string): Instituicao | undefined {
  const alvo = sigla.trim().toUpperCase();
  return INSTITUICOES.find((i) => i.sigla.toUpperCase() === alvo);
}

/** Lista as instituições em ordem alfabética de sigla, opcionalmente por UF. */
export function listarInstituicoes(uf?: string): Instituicao[] {
  const alvo = uf?.trim().toUpperCase();
  return INSTITUICOES.filter((i) => !alvo || i.uf.toUpperCase() === alvo).sort(
    (a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"),
  );
}

/** Unidades de uma instituição, em ordem alfabética de nome. */
export function listarUnidades(sigla: string): Unidade[] {
  const alvo = sigla.trim().toUpperCase();
  return UNIDADES.filter((u) => u.instituicao.toUpperCase() === alvo).sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** Estados cobertos, em ordem alfabética. */
export function listarEstados(): string[] {
  return [...new Set(INSTITUICOES.map((i) => i.uf))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Preenche grande área e temas derivados sem tocar no dado original. */
function comDerivados(g: GrupoPesquisa): GrupoPesquisa {
  return {
    ...g,
    areaConhecimento: g.areaConhecimento ?? grandeAreaDe(g.area),
    areaTematica: g.areaTematica ?? temasDe(g),
  };
}

/** Igual ao anterior, para projetos de extensão. */
function projetoComDerivados(p: ProjetoExtensao): ProjetoExtensao {
  return {
    ...p,
    areaConhecimento: p.areaConhecimento ?? grandeAreaDe(p.area ?? ""),
    areaTematica: p.areaTematica ?? temasDe({ nome: p.nome, area: p.area }),
  };
}

/**
 * Casa a busca contra o texto da entrada.
 *
 * Todos os termos digitados precisam aparecer (E, não OU).
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

/** Nome legível de uma área do conhecimento (ou a própria marca). */
export function nomeDaAreaConhecimento(area: string): string {
  return area || AREA_NAO_INFORMADA;
}

/** Grupos de pesquisa, com filtro opcional e ordenação por nome. */
export function listarGrupos(filtro: Filtro = {}): GrupoPesquisa[] {
  const termos = termosDe(filtro.busca);
  const area = filtro.area ? semAcento(filtro.area) : null;
  const areaConhecimento = filtro.areaConhecimento
    ? semAcento(filtro.areaConhecimento)
    : null;
  const instituicao = filtro.instituicao?.toUpperCase();
  const uf = filtro.uf?.toUpperCase();
  const unidade = filtro.unidade?.toUpperCase();
  const tema = filtro.tema?.trim();

  const siglasPorUf = new Set(
    INSTITUICOES.filter((i) => !uf || i.uf.toUpperCase() === uf).map((i) =>
      i.sigla.toUpperCase(),
    ),
  );

  return GRUPOS.map(comDerivados)
    .filter((g) => {
      if (instituicao && g.instituicao.toUpperCase() !== instituicao) return false;
      if (uf && !siglasPorUf.has(g.instituicao.toUpperCase())) return false;
      if (unidade && (g.unidade ?? "").toUpperCase() !== unidade) return false;
      if (area && semAcento(g.area) !== area) return false;
      if (areaConhecimento && semAcento(g.areaConhecimento ?? "") !== areaConhecimento)
        return false;
      if (tema && !(g.areaTematica ?? []).includes(tema)) return false;

      const instituicaoNome = obterInstituicao(g.instituicao)?.nome ?? "";
      return casaBusca(
        `${g.nome} ${g.area} ${g.areaConhecimento ?? ""} ${g.lider} ${g.unidade ?? ""} ${g.instituicao} ${instituicaoNome}`,
        termos,
      );
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Projetos de extensão, com filtro opcional e ordenação por nome. */
export function listarProjetos(filtro: Filtro = {}): ProjetoExtensao[] {
  const termos = termosDe(filtro.busca);
  const area = filtro.area ? semAcento(filtro.area) : null;
  const areaConhecimento = filtro.areaConhecimento
    ? semAcento(filtro.areaConhecimento)
    : null;
  const instituicao = filtro.instituicao?.toUpperCase();
  const uf = filtro.uf?.toUpperCase();
  const unidade = filtro.unidade?.toUpperCase();
  const tema = filtro.tema?.trim();

  const siglasPorUf = new Set(
    INSTITUICOES.filter((i) => !uf || i.uf.toUpperCase() === uf).map((i) =>
      i.sigla.toUpperCase(),
    ),
  );

  return PROJETOS.map(projetoComDerivados)
    .filter((p) => {
      if (instituicao && p.instituicao.toUpperCase() !== instituicao) return false;
      if (uf && !siglasPorUf.has(p.instituicao.toUpperCase())) return false;
      if (unidade && (p.unidade ?? "").toUpperCase() !== unidade) return false;
      if (area && (!p.area || semAcento(p.area) !== area)) return false;
      if (areaConhecimento && semAcento(p.areaConhecimento ?? "") !== areaConhecimento)
        return false;
      if (tema && !(p.areaTematica ?? []).includes(tema)) return false;

      const instituicaoNome = obterInstituicao(p.instituicao)?.nome ?? "";
      return casaBusca(
        `${p.nome} ${p.coordenador ?? ""} ${p.area ?? ""} ${p.areaConhecimento ?? ""} ${p.areaTematicaFonte ?? ""} ${p.linhaExtensao ?? ""} ${p.unidade ?? ""} ${p.instituicao} ${instituicaoNome}`,
        termos,
      );
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Áreas predominantes presentes nos grupos, em ordem alfabética. */
export function areasDisponiveis(): string[] {
  return [...new Set(GRUPOS.map((g) => g.area))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Grandes áreas presentes no acervo, na ordem da CAPES. */
export function areasConhecimentoDisponiveis(): string[] {
  const presentes = new Set(
    GRUPOS.map((g) => comDerivados(g).areaConhecimento ?? AREA_NAO_INFORMADA),
  );
  const conhecidas = GRANDES_AREAS.filter((a) => presentes.has(a));
  const resto = [...presentes]
    .filter((a) => !(GRANDES_AREAS as readonly string[]).includes(a))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...conhecidas, ...resto];
}

/** Temas transversais presentes no acervo, com contagem. */
export function temasDisponiveis(): { id: string; nome: string; total: number }[] {
  const contagem = new Map<string, number>();
  for (const g of GRUPOS) {
    for (const t of comDerivados(g).areaTematica ?? []) {
      contagem.set(t, (contagem.get(t) ?? 0) + 1);
    }
  }
  return TEMAS.filter((t) => contagem.has(t.id)).map((t) => ({
    id: t.id,
    nome: t.nome,
    total: contagem.get(t.id) ?? 0,
  }));
}

/** Agrupa os grupos por área predominante, na ordem alfabética da área. */
export function agruparGruposPorArea(
  grupos: GrupoPesquisa[] = GRUPOS.map(comDerivados),
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
    areasConhecimento: areasConhecimentoDisponiveis().length,
    temas: temasDisponiveis().length,
    ufs: new Set(INSTITUICOES.map((i) => i.uf)).size,
    verificadoEm: dataMaisRecente(),
  };
}

export { nomeDoTema, temasDe, grandeAreaDe, AREA_NAO_INFORMADA };
