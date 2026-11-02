/**
 * @file Facetas do Observatório de Grandes Empresas & Fundos.
 *
 * O QUE É: funções puras que recortam o acervo de entidades por setor e
 * contam o mesmo recorte que a página desenha. A faceta é o setor — a única
 * dimensão em que as 130 entidades são irmãs de fato; fortunas, executivos,
 * documentos e conglomerados são outros acervos (outro tipo de registro, outra
 * tabela, outro cliente) e continuam em rota própria.
 *
 * POR QUE AQUI E NÃO NA PÁGINA: o N do botão, o N da barra e o N da lista têm
 * de sair da MESMA função. Contagem feita em dois lugares diferentes diverge
 * no dia em que um filtro muda, e o leitor vê o botão dizer um número e a
 * lista dizer outro.
 *
 * FONTE: `data/empresas-perfil/entidades-completas.json`, o acervo versionado
 * que alimenta `/empresas`. O portal conta o que está no arquivo; não é
 * medição de mercado nem ranking por valor. A fonte oficial de cada entidade
 * (CVM, SEC, PNCP, ANM) está na ficha dela.
 */

import { SETOR_NOMES, type EntidadeDetalhada } from "./entidades-dados";

/**
 * Ordem de exibição das facetas. Fixa para o botão não pular de lugar quando
 * a contagem muda; a ordem alfabética esconderia a hierarquia editorial.
 */
export const SETORES_EMPRESAS = [
  "mineracao",
  "energia",
  "agua_saneamento",
  "construcao_civil",
  "tecnologia",
  "defesa_aeroespacial",
  "fundos_investimento",
] as const;

export type SetorEmpresas = (typeof SETORES_EMPRESAS)[number];

export type FacetaEmpresa = {
  slug: SetorEmpresas;
  rotulo: string;
  n: number;
};

/**
 * Normaliza o `?setor=` da URL. Valor desconhecido ou repetido vira `undefined`
 * ("Todas"), nunca um recorte vazio: URL adulterada não pode renderizar uma
 * lista em branco que parece acervo vazio.
 */
export function setorDaUrl(valor: string | string[] | undefined): SetorEmpresas | undefined {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return SETORES_EMPRESAS.find((setor) => setor === bruto);
}

/** URL da faceta. Sem setor, devolve o painel inteiro. */
export function hrefSetor(setor?: string): string {
  const valido = SETORES_EMPRESAS.find((item) => item === setor);
  return valido ? `/empresas?setor=${valido}` : "/empresas";
}

/** Rótulo de tela do setor; chave crua aparece crua em vez de inventada. */
export function rotuloDoSetor(setor?: string): string {
  if (!setor) return "Todas as entidades";
  return SETOR_NOMES[setor] ?? setor;
}

/** Recorte do painel. Sem setor, devolve o acervo inteiro (mesma referência). */
export function filtrarPorSetor<T extends EntidadeDetalhada>(
  entidades: T[],
  setor?: string
): T[] {
  if (!setor) return entidades;
  return entidades.filter((entidade) => entidade.setor === setor);
}

/**
 * Contagem por setor no acervo INTEIRO, não no recorte. É o denominador dos
 * botões e das barras: quem está em "Mineração" precisa ver quantas entidades
 * existem nos outros setores para escolher.
 */
export function contarPorSetor(entidades: EntidadeDetalhada[]): FacetaEmpresa[] {
  return SETORES_EMPRESAS.map((slug) => ({
    slug,
    rotulo: SETOR_NOMES[slug] ?? slug,
    n: entidades.filter((entidade) => entidade.setor === slug).length,
  }));
}

export type PaisOrigem = "brasil" | "eua" | "canada";

/**
 * Tabelas em vez de cadeia de `if`: o tipo e a bolsa são os dois campos que o
 * acervo declara, e o mercado em que a entidade é fiscalizada vem deles. Não é
 * sede fiscal. Chave desconhecida cai em "brasil", o caso mais comum.
 */
const PAIS_POR_TIPO: Record<string, PaisOrigem> = {
  empresa_canada: "canada",
  empresa_eua: "eua",
  fundo_eua: "eua",
};

const PAIS_POR_BOLSA: Record<string, PaisOrigem> = {
  TSX: "canada",
  TSXV: "canada",
  NYSE: "eua",
  NASDAQ: "eua",
};

export function paisDeOrigem(entidade: EntidadeDetalhada): PaisOrigem {
  return PAIS_POR_TIPO[entidade.tipo] ?? PAIS_POR_BOLSA[entidade.bolsa ?? ""] ?? "brasil";
}

/** Contagem por país dentro do recorte exibido. */
export function contarPorPais(entidades: EntidadeDetalhada[]): Record<PaisOrigem, number> {
  const contagem: Record<PaisOrigem, number> = { brasil: 0, eua: 0, canada: 0 };
  for (const entidade of entidades) contagem[paisDeOrigem(entidade)] += 1;
  return contagem;
}

/** Ordem alfabética estável, em pt-BR, sem alterar o array recebido. */
export function ordenarPorNome<T extends EntidadeDetalhada>(entidades: T[]): T[] {
  return [...entidades].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
