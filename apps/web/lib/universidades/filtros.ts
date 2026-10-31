/**
 * @file apps/web/lib/universidades/filtros.ts
 * @description Filtros do painel universitário, em funções puras.
 *
 * Papel no portal: o painel roda no cliente, mas a regra de filtro não precisa
 * morar no componente. Aqui ficam os eixos comuns (instituição, estado,
 * unidade, área, área do conhecimento, tema e ano) e a busca por texto, para
 * o componente só chamar e renderizar.
 *
 * Por que existe: `PainelUniversidades` passava de 700 linhas e de complexidade
 * aceitável no CodeScene. Mover o filtro para cá deixa o componente curto e
 * o filtro testável sem React.
 *
 * Contrato: campo vazio não filtra; todos os termos buscados precisam aparecer
 * (E, não OU); a ordenação é em pt-BR pelo nome.
 */

import { semAcento } from "@/lib/busca/normalizar";
import { nomeDoTema } from "./temas";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "./tipos";

/** Estado do painel que vira filtro. */
export interface FiltroPainel {
  instituicao?: string;
  uf?: string;
  unidade?: string;
  area?: string;
  areaConhecimento?: string;
  tema?: string;
  /** Ano de referência do grupo ou de início do projeto. */
  ano?: string;
  /** Termos já normalizados (sem acento, minúsculos). */
  termos: string[];
  /** Mapa sigla → instituição, para resolver a UF. */
  instituicoesPorSigla: Map<string, Instituicao>;
}

/** Campos que grupo e projeto compartilham. */
interface RegistroFiltravel {
  instituicao: string;
  unidade?: string;
  area?: string;
  areaConhecimento?: string;
  areaTematica?: string[];
}

/** Aplica os eixos comuns. Cada eixo é uma checagem isolada. */
function passaEixos(registro: RegistroFiltravel, filtro: FiltroPainel): boolean {
  return (
    casaInstituicao(registro, filtro) &&
    casaUf(registro, filtro) &&
    casaUnidade(registro, filtro) &&
    casaArea(registro, filtro) &&
    casaAreaConhecimento(registro, filtro) &&
    casaTema(registro, filtro)
  );
}

function casaInstituicao(r: RegistroFiltravel, f: FiltroPainel): boolean {
  if (!f.instituicao) return true;
  return r.instituicao.toUpperCase() === f.instituicao.toUpperCase();
}

function casaUf(r: RegistroFiltravel, f: FiltroPainel): boolean {
  if (!f.uf) return true;
  const instituicao = f.instituicoesPorSigla.get(r.instituicao.toUpperCase());
  return instituicao?.uf === f.uf;
}

function casaUnidade(r: RegistroFiltravel, f: FiltroPainel): boolean {
  if (!f.unidade) return true;
  return (r.unidade ?? "").toUpperCase() === f.unidade.toUpperCase();
}

function casaArea(r: RegistroFiltravel, f: FiltroPainel): boolean {
  return !f.area || r.area === f.area;
}

function casaAreaConhecimento(r: RegistroFiltravel, f: FiltroPainel): boolean {
  return !f.areaConhecimento || r.areaConhecimento === f.areaConhecimento;
}

function casaTema(r: RegistroFiltravel, f: FiltroPainel): boolean {
  return !f.tema || (r.areaTematica ?? []).includes(f.tema);
}

/** Ano do registro é igual ao filtro? Vazio não filtra. */
function passaAno(anoDoRegistro: string, filtro: string | undefined): boolean {
  return !filtro || anoDoRegistro === filtro;
}

/** Todos os termos precisam estar no texto. Texto é normalizado antes. */
function casaTermos(texto: string, termos: string[]): boolean {
  if (termos.length === 0) return true;
  const alvo = semAcento(texto);
  return termos.every((termo) => alvo.includes(termo));
}

/** Grupos de pesquisa e de estudo, filtrados e ordenados por nome. */
export function filtrarGrupos(
  grupos: GrupoPesquisa[],
  filtro: FiltroPainel,
): GrupoPesquisa[] {
  return filtrarPor(
    grupos,
    filtro,
    (g) => String(g.anoReferencia),
    (g) =>
      `${g.nome} ${g.lider} ${g.area} ${g.areaConhecimento ?? ""} ${g.unidade ?? ""} ${g.instituicao} ${filtro.instituicoesPorSigla.get(g.instituicao.toUpperCase())?.nome ?? ""}`,
  );
}

/** Projetos de extensão, filtrados e ordenados por nome. */
export function filtrarProjetos(
  projetos: ProjetoExtensao[],
  filtro: FiltroPainel,
): ProjetoExtensao[] {
  return filtrarPor(
    projetos,
    filtro,
    (p) => p.inicio?.slice(0, 4) ?? "",
    (p) =>
      `${p.nome} ${p.coordenador ?? ""} ${p.area ?? ""} ${p.areaConhecimento ?? ""} ${p.areaTematicaFonte ?? ""} ${p.linhaExtensao ?? ""} ${p.unidade ?? ""} ${p.instituicao} ${filtro.instituicoesPorSigla.get(p.instituicao.toUpperCase())?.nome ?? ""}`,
  );
}

/**
 * Esqueleto comum: eixos, ano, texto e ordem.
 *
 * Grupo e projeto diferem só em como se extrai o ano e o texto de busca; o
 * resto é igual. Uma função só evita a duplicação que o CodeScene acusava.
 */
function filtrarPor<T extends RegistroFiltravel & { nome: string }>(
  itens: T[],
  filtro: FiltroPainel,
  anoDe: (item: T) => string,
  textoDe: (item: T) => string,
): T[] {
  return itens
    .filter(
      (item) =>
        passaEixos(item, filtro) &&
        passaAno(anoDe(item), filtro.ano) &&
        casaTermos(textoDe(item), filtro.termos),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Unidades acadêmicas que têm grupo no recorte atual. */
export function unidadesDoPainel(
  unidades: Unidade[],
  grupos: GrupoPesquisa[],
  instituicao: string,
): Unidade[] {
  const alvo = instituicao.toUpperCase();
  const siglas = new Set(
    grupos
      .filter((g) => !alvo || g.instituicao.toUpperCase() === alvo)
      .map((g) => g.unidade)
      .filter(Boolean) as string[],
  );

  return unidades
    .filter(
      (u) =>
        (!alvo || u.instituicao.toUpperCase() === alvo) &&
        (siglas.size === 0 || siglas.has(u.sigla)),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Áreas predominantes presentes no acervo. */
export function areasDoAcervo(grupos: GrupoPesquisa[]): string[] {
  return [...new Set(grupos.map((g) => g.area))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Grandes áreas do conhecimento presentes no acervo. */
export function areasConhecimentoDoAcervo(grupos: GrupoPesquisa[]): string[] {
  return [
    ...new Set(grupos.map((g) => g.areaConhecimento).filter(Boolean) as string[]),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Temas transversais presentes em grupos e projetos, em ordem de nome. */
export function temasDoAcervo(
  grupos: GrupoPesquisa[],
  projetos: ProjetoExtensao[],
): string[] {
  const presentes = new Set<string>();
  for (const g of grupos) for (const t of g.areaTematica ?? []) presentes.add(t);
  for (const p of projetos) for (const t of p.areaTematica ?? []) presentes.add(t);
  return [...presentes].sort((a, b) =>
    nomeDoTema(a).localeCompare(nomeDoTema(b), "pt-BR"),
  );
}

/**
 * Anos do filtro de data: relatório do grupo e início do projeto.
 * Ordem decrescente, como o leitor espera.
 */
export function anosDoAcervo(
  grupos: GrupoPesquisa[],
  projetos: ProjetoExtensao[],
): string[] {
  const anos = new Set<string>();
  for (const g of grupos) anos.add(String(g.anoReferencia));
  for (const p of projetos) {
    const inicio = p.inicio?.slice(0, 4);
    if (inicio) anos.add(inicio);
  }
  return [...anos].sort((a, b) => b.localeCompare(a, "pt-BR"));
}

/** Estado do painel que decide mostrar o botão "Limpar". */
export interface EstadoFiltro {
  busca: string;
  uf: string;
  unidade: string;
  area: string;
  areaConhecimento: string;
  tema: string;
  ano: string;
  tipo: string;
  instituicao: string;
  /** Quando a página é de uma instituição só, o seletor some. */
  instituicaoFixa?: string;
}

/** Há algum filtro ativo? */
export function temFiltroAtivo(estado: EstadoFiltro): boolean {
  const campos = [
    estado.busca,
    estado.uf,
    estado.unidade,
    estado.area,
    estado.areaConhecimento,
    estado.tema,
    estado.ano,
  ];
  if (campos.some(Boolean)) return true;
  if (estado.tipo !== "todos") return true;
  return !estado.instituicaoFixa && Boolean(estado.instituicao);
}
