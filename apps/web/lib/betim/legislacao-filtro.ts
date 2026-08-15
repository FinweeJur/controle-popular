import type { AtoRow } from "./legislacao";

/**
 * Os quatro filtros de `/[municipio]/camara/legislacao` — categoria, ano,
 * área temática e direito afetado —, num módulo com ZERO import de servidor.
 *
 * ═══ POR QUE MÓDULO PRÓPRIO, E NÃO DENTRO DE `legislacao.ts` ═══
 *
 * `lib/betim/legislacao.ts` abre com `import * as q from "@/lib/db/queries/betim"`.
 * Importar dali um VALOR (e não só um tipo) dentro de um componente de cliente
 * arrastaria a camada de banco inteira para o bundle do navegador — a mesma
 * armadilha que fez `TEMA_LABELS` chegar por prop em `ListaLegislacao` e em
 * `ProposicoesDoVereador`. `import type` some na compilação; `import { filtrarAtos }`
 * não some.
 *
 * ═══ POR QUE UMA FUNÇÃO, E NÃO O FILTRO ESCRITO NOS DOIS LUGARES ═══
 *
 * O filtro rodava no servidor (`getLegislacao(id, opts)`) e passou a rodar no
 * navegador quando a página virou estática; agora que a lista saiu do payload,
 * ele roda sobre as linhas vindas do índice fatiado. A cada mudança dessas o
 * risco foi o mesmo: a lógica ser reescrita um pouco diferente e a tela passar
 * a responder outra coisa sem erro nenhum — filtro que devolve a lista errada
 * não quebra, só mente. Com uma função só, o componente e o verificador de
 * paridade (`scripts/paridade-betim.mts`) exercitam O MESMO código, e
 * `lib/betim/legislacao.test.ts` consegue travá-lo (o vitest deste projeto só
 * coleta `lib/**`).
 */
export interface FiltrosLegislacao {
  categoria?: string;
  tema?: string;
  /** String porque vem de `<select>`/query string; comparado como número. */
  ano?: string;
  direito?: string;
}

/**
 * Mesma ordem e mesma semântica do `getLegislacao` original: igualdade em
 * `tipo` e `ano`, "contém" em `temas`, e `direito` olhando só os atos COM
 * análise — ato sem análise não é ato que "não afeta" o direito, é ato sobre o
 * qual não se sabe, e ele fica de fora do recorte em vez de entrar como neutro.
 */
export function atoPassaNoFiltro(ato: AtoRow, filtros: FiltrosLegislacao): boolean {
  const { categoria, tema, ano, direito } = filtros;
  if (categoria && ato.tipo !== categoria) return false;
  if (ano && ato.ano !== Number(ano)) return false;
  if (tema && !(ato.temas ?? []).includes(tema)) return false;
  if (direito && !ato.analise?.direitos.includes(direito)) return false;
  return true;
}

export function filtrarAtos<T extends AtoRow>(atos: T[], filtros: FiltrosLegislacao): T[] {
  return atos.filter((a) => atoPassaNoFiltro(a, filtros));
}

/** Há algum filtro ativo? Decide se a tela oferece "limpar". */
export function temFiltroAtivo(filtros: FiltrosLegislacao): boolean {
  return Boolean(filtros.categoria || filtros.tema || filtros.ano || filtros.direito);
}
