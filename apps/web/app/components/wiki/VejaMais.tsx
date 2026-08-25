import Link from "next/link";

/**
 * Link "veja +" para exibir ao lado de titulos de secao.
 *
 * No padrao wiki, todo h2 de pagina de conteudo pode levar a uma pagina
 * geral do mesmo tema (ex.: "Contratos" -> /betim/prefeitura/contratos).
 * Quando nao houver destino, o componente nao renderiza nada.
 *
 * Acessibilidade:
 * - texto descritivo "Veja mais sobre [titulo]" para leitores de tela;
 * - apresentacao visual curta ("veja +") para nao poluir a leitura;
 * - usa Next/Link quando o href e interno e relativo.
 */
export default function VejaMais({ href, titulo }: { href?: string; titulo: string }) {
  if (!href) return null;

  return (
    <Link
      href={href}
      className="ml-2 inline-flex items-center gap-0.5 text-[.85em] font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={`Veja mais sobre ${titulo}`}
    >
      veja +
    </Link>
  );
}
