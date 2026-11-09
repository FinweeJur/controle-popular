import NextLink from "next/link";

/**
 * Mapa das subfrentes do caso Rio Doce.
 *
 * A análise integrada é longa: quem chega ao fim não deveria voltar ao hub
 * para achar a linha do tempo, o clipping ou os processos. Este bloco fecha
 * a página com todas as portas do caso, agrupadas por assunto. Cada href
 * aponta para rota já publicada ou para rota em entrega pela mesma frente.
 */

const GRUPOS = [
  {
    titulo: "O caso",
    itens: [
      { href: "/riodoce", rotulo: "Visão geral do Rio Doce" },
      { href: "/riodoce/analise", rotulo: "Análise integrada" },
      { href: "/riodoce/linha-do-tempo", rotulo: "Linha do tempo" },
      { href: "/riodoce/clipping", rotulo: "Clipping de imprensa" },
      { href: "/riodoce/indice", rotulo: "Índice do tema" },
      { href: "/eixos/casos", rotulo: "Os três casos do portal" },
    ],
  },
  {
    titulo: "Dinheiro e reparação",
    itens: [
      { href: "/ambiental/mariana", rotulo: "Execução do Acordo em MG" },
      {
        href: "/ambiental/rio-doce/analise",
        rotulo: "Análise do litoral e da reparação",
      },
      { href: "/riodoce/processos", rotulo: "Processos da reparação" },
    ],
  },
  {
    titulo: "Justiça",
    itens: [
      {
        href: "/jurisprudencia?tribunal=TJES&estado=ES#lista",
        rotulo: "Jurisprudência — TJES",
      },
      {
        href: "/jurisprudencia?frente=riodoce&tribunal=TJMG#lista",
        rotulo: "Jurisprudência — TJMG",
      },
      { href: "/ambiental/legislacao", rotulo: "Que lei protege isso" },
      {
        href: "/ambiental/crimes-socioambientais",
        rotulo: "Crimes socioambientais",
      },
    ],
  },
  {
    titulo: "Acervos e fontes",
    itens: [
      {
        href: "/ambiental/crimes-socioambientais",
        rotulo: "Biblioteca dos desastres",
      },
      { href: "/paraopeba/mab", rotulo: "MAB — notícias e notas" },
      { href: "/paraopeba/biblioteca", rotulo: "Biblioteca das assessorias" },
      { href: "/dados", rotulo: "Dados abertos do portal" },
    ],
  },
  {
    titulo: "Contexto",
    itens: [
      { href: "/paraopeba", rotulo: "Caso Brumadinho (Paraopeba)" },
      { href: "/ambiental/barragens", rotulo: "Segurança de barragens" },
      { href: "/ambiental/direitos-humanos", rotulo: "Direitos humanos" },
      { href: "/mineracao", rotulo: "Mineração" },
    ],
  },
] as const;

export default function MapaSubfrentes({ atual }: { atual: string }) {
  return (
    <nav
      aria-labelledby="mapa-subfrentes"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <h2
        id="mapa-subfrentes"
        className="font-display text-[clamp(1.3em,3vw,1.7em)] font-bold tracking-tight"
      >
        Mapa das subfrentes
      </h2>
      <p className="mt-2 max-w-3xl text-[.95em] text-text-soft">
        O mesmo caso por outras portas. Cada botão abre a página que mede
        aquele recorte — do dinheiro do Acordo à jurisprudência, dos acervos
        ao contexto do desastre.
      </p>

      <div className="mt-5 space-y-5">
        {GRUPOS.map((grupo) => (
          <section key={grupo.titulo} aria-label={grupo.titulo}>
            <h3 className="text-xs font-semibold uppercase tracking-[.16em] text-text-soft">
              {grupo.titulo}
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.itens.map((item) => {
                const aqui = item.href === atual;
                return (
                  <li key={`${grupo.titulo}-${item.href}-${item.rotulo}`}>
                    <NextLink
                      href={item.href}
                      aria-current={aqui ? "page" : undefined}
                      className={`block min-h-10 rounded-lg border px-3 py-2.5 text-sm leading-snug transition ${
                        aqui
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border bg-surface text-text hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {item.rotulo}
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
