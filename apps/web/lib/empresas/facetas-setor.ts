/**
 * @file Faceta por setor do Observatório de Empresas & Fundos (`/empresas`).
 *
 * O QUE É: funções puras que contam as entidades do acervo por setor
 * estratégico, validam o `?setor=` da URL e montam o href de cada recorte.
 * Não lê arquivo, não conhece React e não importa `entidades-dados.ts` em
 * runtime — o tipo é estrutural, para o teste rodar sem `node:fs`.
 *
 * FONTE: `data/empresas-perfil/entidades-completas.json`, cujo campo `setor`
 * (slug) e o rótulo de `SETOR_NOMES` vêm do cadastro do próprio portal (CVM,
 * SEC, SEDAR+ e PNCP são a origem de cada ficha, não a origem da contagem).
 *
 * POR QUE EXISTE: o setor é a única dimensão em que as 130 fichas se dividem
 * sem sobreposição — 7 setores, uma entidade em cada. Por isso ele pode ser
 * faceta: o N do botão é o mesmo N da lista que o recorte entrega. País, tipo
 * e risco ESG continuam como filtro instantâneo dentro do cliente, porque não
 * são a dimensão que organiza o acervo.
 *
 * REGRA: `contarPorSetor` sempre mede o acervo INTEIRO. O denominador é
 * `entidades.length`, nunca a soma dos botões — soma quebrada é como um painel
 * começa a mentir.
 */

/** O mínimo que a contagem precisa saber de uma entidade. */
export interface EntidadeComSetor {
  /** Slug do setor (`mineracao`, `energia`, ...). */
  setor: string;
  /** Rótulo humano do setor (`Mineração & Metalurgia`, ...). */
  setorRotulo: string;
}

/** Uma faceta pronta para o `PainelFacetas`, com o N já medido. */
export interface FacetaSetor {
  slug: string;
  rotulo: string;
  n: number;
}

/** Valor do slug quando nenhum setor está ativo. */
export const SETOR_TODOS = "";

/**
 * Conta entidades por setor no acervo inteiro.
 *
 * A ordem é N decrescente e, no empate, rótulo em ordem alfabética — ordem
 * estável entre build e runtime, para o botão não trocar de lugar sozinho.
 * Setor sem entidade não entra: botão com N zero só ocupa espaço.
 */
export function contarPorSetor(entidades: readonly EntidadeComSetor[]): FacetaSetor[] {
  const porSlug = new Map<string, FacetaSetor>();

  for (const entidade of entidades) {
    const slug = entidade.setor?.trim();
    if (!slug) continue;

    const atual = porSlug.get(slug);
    if (atual) {
      atual.n += 1;
      continue;
    }
    porSlug.set(slug, {
      slug,
      rotulo: entidade.setorRotulo || slug,
      n: 1,
    });
  }

  return Array.from(porSlug.values()).sort(
    (a, b) => b.n - a.n || a.rotulo.localeCompare(b.rotulo, "pt-BR")
  );
}

/**
 * Lê o `?setor=` cru da URL e devolve o slug válido, ou `SETOR_TODOS`.
 *
 * Slug desconhecido vira "Todos" em vez de erro: link antigo, digitação ou
 * robô não devem derrubar a listagem inteira. Quem decide se o recorte existe
 * é o acervo, não a query.
 */
export function setorDe(
  valor: string | string[] | undefined,
  facetas: readonly FacetaSetor[]
): string {
  const bruto = (Array.isArray(valor) ? valor[0] : valor)?.trim();
  if (!bruto) return SETOR_TODOS;
  return facetas.some((faceta) => faceta.slug === bruto) ? bruto : SETOR_TODOS;
}

/**
 * URL canônica do recorte. "Todos" não carrega query: uma URL por conteúdo.
 */
export function hrefSetor(slug?: string): string {
  return slug && slug !== SETOR_TODOS
    ? `/empresas?setor=${encodeURIComponent(slug)}`
    : "/empresas";
}
