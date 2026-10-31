/**
 * @file apps/web/lib/universidades/cruzamento.ts
 * @description Cruzamentos do acervo universitário: tema × estado, local e data.
 *
 * Papel no portal: transformar a lista plana em leitura cruzada. O leitor
 * quer saber "quem pesquisa saúde em Minas", "o que existe no Rio Grande do
 * Sul" e "o que começou em 2024" — sem passar cartão por cartão.
 *
 * Regras (QUALIDADES-DA-INFORMACAO.md):
 * - todo número sai do registro, nunca é digitado à mão;
 * - tema é a classificação editorial já derivada em `temas.ts`;
 * - data de grupo é o ANO DE REFERÊNCIA do relatório oficial, não a data de
 *   criação do grupo (a fonte não publica criação). Data de projeto é o
 *   início de execução declarado na plataforma;
 * - registro sem tema continua contando em local e data, e por isso a soma
 *   das linhas de tema pode ser menor que o total do acervo. O painel avisa.
 *
 * Este módulo é puro: recebe registros já filtrados e devolve linhas prontas.
 * Nada aqui busca dado nem conhece React.
 */

import type { TipoRegistro } from "./tipos";

/** Registro achatado, no formato que os cruzamentos consomem. */
export interface RegistroCruzamento {
  tipo: TipoRegistro;
  /** Sigla da instituição dona do registro. */
  instituicao: string;
  /** Unidade federativa da instituição. */
  uf: string;
  /** Ids de tema transversal (ver `temas.ts`). Pode ser vazio. */
  temas: string[];
  /**
   * Ano que dá sentido à coluna "data": ano de referência do relatório para
   * grupo de pesquisa; ano de início para projeto de extensão. `null` quando
   * a fonte não informa.
   */
  ano: string | null;
}

/** Contagem de uma UF dentro de uma linha de tema. */
export interface CelulaUf {
  uf: string;
  total: number;
}

/** Linha da matriz tema × estado. */
export interface LinhaTema {
  tema: string;
  nome: string;
  total: number;
  porUf: CelulaUf[];
}

/** Linha do recorte por local (UF). */
export interface LinhaLocal {
  uf: string;
  total: number;
  grupos: number;
  projetos: number;
  /** Siglas das instituições com registro naquela UF, em ordem alfabética. */
  instituicoes: string[];
}

/** Linha do recorte por data (ano de referência ou de início). */
export interface LinhaData {
  ano: string;
  total: number;
  grupos: number;
  projetos: number;
}

/**
 * Matriz tema × estado.
 *
 * Só entram registros com ao menos um tema. As UFs saem em ordem alfabética
 * para a leitura não dançar entre renders.
 */
export function cruzarTemasPorUf(
  registros: RegistroCruzamento[],
  nomeDoTema: (id: string) => string,
): LinhaTema[] {
  const mapa = new Map<string, Map<string, number>>();

  for (const r of registros) {
    if (r.temas.length === 0) continue;
    for (const tema of r.temas) {
      const porUf = mapa.get(tema) ?? new Map<string, number>();
      porUf.set(r.uf, (porUf.get(r.uf) ?? 0) + 1);
      mapa.set(tema, porUf);
    }
  }

  return [...mapa.entries()]
    .map(([tema, porUf]) => {
      const celulas = [...porUf.entries()]
        .map(([uf, total]) => ({ uf, total }))
        .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR"));
      return {
        tema,
        nome: nomeDoTema(tema),
        total: celulas.reduce((soma, c) => soma + c.total, 0),
        porUf: celulas,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Estado de filtro que o mapa manipula. */
export interface FiltroCruzamento {
  tema: string;
  uf: string;
  ano: string;
}

/**
 * Calcula o próximo filtro a partir de um clique no mapa.
 *
 * Regras: clicar no que já está ativo desliga aquele eixo; clicar no nome do
 * tema significa "todos os estados deste tema"; o ano é independente.
 * Função pura para o componente não virar uma árvore de `if`.
 */
export function proximoFiltro(
  atual: FiltroCruzamento,
  patch: { tema?: string; uf?: string; ano?: string },
): FiltroCruzamento {
  const ano = alterna(atual.ano, patch.ano);

  if (patch.tema !== undefined) {
    const mesmoPar = (patch.uf ?? "") === atual.uf;
    if (atual.tema === patch.tema && mesmoPar) {
      return { tema: "", uf: "", ano };
    }
    const desligaSoTema = patch.uf === undefined && atual.tema === patch.tema;
    return {
      tema: desligaSoTema ? "" : patch.tema,
      uf: patch.uf ?? "",
      ano,
    };
  }

  if (patch.uf !== undefined) {
    return { tema: atual.tema, uf: alterna(atual.uf, patch.uf), ano };
  }

  return { ...atual, ano };
}

/** Liga o valor; se ele já estiver ativo, desliga. `undefined` não mexe. */
function alterna(valor: string, alvo?: string): string {
  if (alvo === undefined) return valor;
  return alvo === valor ? "" : alvo;
}

/** Recorte por UF: total, grupos, projetos e instituições presentes. */
export function resumirPorLocal(registros: RegistroCruzamento[]): LinhaLocal[] {
  const mapa = new Map<
    string,
    { grupos: number; projetos: number; instituicoes: Set<string> }
  >();

  for (const r of registros) {
    const atual =
      mapa.get(r.uf) ?? { grupos: 0, projetos: 0, instituicoes: new Set<string>() };
    if (r.tipo === "pesquisa") atual.grupos += 1;
    else atual.projetos += 1;
    atual.instituicoes.add(r.instituicao);
    mapa.set(r.uf, atual);
  }

  return [...mapa.entries()]
    .map(([uf, v]) => ({
      uf,
      grupos: v.grupos,
      projetos: v.projetos,
      total: v.grupos + v.projetos,
      instituicoes: [...v.instituicoes].sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR"));
}

/** Recorte por ano, do mais recente para o mais antigo. */
export function resumirPorData(registros: RegistroCruzamento[]): LinhaData[] {
  const mapa = new Map<string, { grupos: number; projetos: number }>();

  for (const r of registros) {
    if (!r.ano) continue;
    const atual = mapa.get(r.ano) ?? { grupos: 0, projetos: 0 };
    if (r.tipo === "pesquisa") atual.grupos += 1;
    else atual.projetos += 1;
    mapa.set(r.ano, atual);
  }

  return [...mapa.entries()]
    .map(([ano, v]) => ({
      ano,
      grupos: v.grupos,
      projetos: v.projetos,
      total: v.grupos + v.projetos,
    }))
    .sort((a, b) => b.ano.localeCompare(a.ano, "pt-BR"));
}
