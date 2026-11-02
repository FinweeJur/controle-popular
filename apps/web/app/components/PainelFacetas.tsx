import Link from "next/link";

/**
 * @file Faixa de facetas reutilizável: um recorte por vez, estado na URL.
 *
 * O QUE É: a barra de botões que troca o recorte de um painel. Cada botão é um
 * LINK com o N ao lado; a faceta ativa vem do `searchParams` de quem chama.
 *
 * POR QUE LINK E NÃO `useState`: coleção grande não pode virar prop de cliente
 * (AGENTS §5.1) e a casca não pode desmontar entre um clique e outro (§5.13).
 * De quebra, cada recorte fica compartilhável e funciona sem JavaScript.
 *
 * COMO USAR: o chamador monta as facetas com a contagem já medida e passa
 * `hrefDe`, que devolve a URL do recorte (`undefined` = "Todos"). Este
 * componente não conhece eixo, acervo nem domínio: só desenha.
 *
 * FONTE: nenhuma. Os N vêm do chamador, que os mede no mesmo recorte que
 * alimenta a lista — o botão e a tabela nunca podem discordar.
 */

export interface Faceta {
  slug: string;
  rotulo: string;
  n: number;
}

const BOTAO =
  "inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--cp-primary)] focus:ring-offset-2";

export function PainelFacetas({
  facetas,
  atual,
  total,
  hrefDe,
  titulo,
  ariaLabel,
  rotuloTodos = "Todos",
  nota,
}: {
  /** Facetas na ordem de exibição, com o N medido no acervo inteiro. */
  facetas: Faceta[];
  /** Slug da faceta ativa; vazio ou ausente significa "Todos". */
  atual?: string;
  /** Denominador do "Todos": o acervo inteiro, nunca a soma das facetas. */
  total: number;
  /** Monta a URL do recorte. Sem slug, devolve o painel sem faceta. */
  hrefDe: (slug?: string) => string;
  titulo: string;
  ariaLabel: string;
  rotuloTodos?: string;
  nota?: string;
}) {
  const classe = (ativo: boolean) =>
    `${BOTAO} ${
      ativo
        ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] font-semibold text-white"
        : "border-[var(--cp-border)] bg-[var(--cp-surface)] hover:border-[var(--cp-primary)]"
    }`;
  return (
    <nav className="space-y-2" aria-label={ariaLabel}>
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            className={classe(!atual)}
            href={hrefDe()}
            aria-current={!atual ? "page" : undefined}
          >
            {rotuloTodos} · {total.toLocaleString("pt-BR")}
          </Link>
        </li>
        {facetas.map((faceta) => {
          const ativo = atual === faceta.slug;
          return (
            <li key={faceta.slug}>
              <Link
                className={classe(ativo)}
                href={hrefDe(faceta.slug)}
                aria-current={ativo ? "page" : undefined}
              >
                {faceta.rotulo} · {faceta.n.toLocaleString("pt-BR")}
              </Link>
            </li>
          );
        })}
      </ul>
      {nota ? <p className="text-xs opacity-70">{nota}</p> : null}
    </nav>
  );
}
