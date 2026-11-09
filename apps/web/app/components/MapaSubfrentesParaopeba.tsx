import NextLink from "next/link";

/**
 * Mapa das subfrentes do caso Paraopeba.
 *
 * POR QUE EXISTE
 *
 * A análise integrada e a biblioteca são páginas longas. Quem chega nelas não
 * deveria precisar voltar ao índice para achar a auditoria, a perícia, o
 * clipping ou a linha do tempo. Este bloco fecha a página com todas as portas
 * do caso — o leitor acha descendo o feed.
 *
 * A lista é a mesma de `/paraopeba` (`SecaoPaginasIrmas`), mantida aqui para
 * as duas páginas não importarem o arquivo da home (que monta arrays grandes).
 */

const SUBFRENTES = [
  { href: "/paraopeba/analise", rotulo: "Análise integrada" },
  { href: "/paraopeba/auditoria", rotulo: "Auditoria socioambiental" },
  { href: "/paraopeba/execucao", rotulo: "Execução socioeconômica" },
  { href: "/paraopeba/auxilio", rotulo: "Auxílio emergencial" },
  { href: "/paraopeba/pericia", rotulo: "Perícia da UFMG" },
  { href: "/paraopeba/documentos", rotulo: "Documentos do processo" },
  { href: "/paraopeba/biblioteca", rotulo: "Biblioteca das assessorias" },
  { href: "/paraopeba/linha-do-tempo", rotulo: "Linha do tempo" },
  { href: "/paraopeba/clipping", rotulo: "Clipping" },
  { href: "/paraopeba/mab", rotulo: "MAB — notícias e notas" },
  { href: "/paraopeba/noticias?fonte=bacia", rotulo: "Notícias — bacia" },
  { href: "/paraopeba/noticias?fonte=vale", rotulo: "Notícias — Vale" },
  { href: "/paraopeba/quem-atua", rotulo: "Quem atua" },
  { href: "/paraopeba/vale", rotulo: "Ações da Vale" },
  { href: "/paraopeba/vale/documentos", rotulo: "Documentos da Vale na CVM" },
  { href: "/paraopeba/correlacao", rotulo: "Preços × notícias" },
  { href: "/paraopeba/entenda", rotulo: "Entenda o caso" },
] as const;

export function MapaSubfrentesParaopeba({ atual }: { atual: string }) {
  return (
    <nav
      aria-labelledby="mapa-subfrentes"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <h2
        id="mapa-subfrentes"
        className="font-display text-[clamp(1.15em,2.4vw,1.4em)] font-bold tracking-tight"
      >
        Todas as subfrentes do caso
      </h2>
      <p className="mt-1 text-sm text-text-soft">
        O mesmo caso por outras portas. Cada link abre a página que mede
        aquele recorte.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {SUBFRENTES.map((item) => (
          <li key={item.href}>
            <NextLink
              href={item.href}
              aria-current={item.href === atual ? "page" : undefined}
              className={`block rounded-lg border px-3 py-2 text-sm transition ${
                item.href === atual
                  ? "border-primary bg-primary/5 font-semibold text-primary"
                  : "border-border bg-surface text-text hover:border-primary/40 hover:text-primary"
              }`}
            >
              {item.rotulo}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
