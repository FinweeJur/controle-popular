import NextLink from "next/link";

/**
 * @file Cartoes "Todas as paginas deste tema" do hub Rio Doce.
 * Extraido do RioDoceHub para o componente caber no limite do CodeScene.
 */

const PAGINAS_TEMA = [
  {
    href: "/riodoce",
    titulo: "Visão geral",
    descricao: "O caso, o Acordo de Reparação e o que já está publicado no portal.",
  },
  {
    href: "/riodoce/processos",
    titulo: "Processos da reparação",
    descricao: "Processos-chave consultados ao vivo no DataJud do CNJ.",
  },
  {
    href: "/ambiental/mariana",
    titulo: "Execução do Acordo em MG",
    descricao: "Empenhos, órgãos e anos da execução, lidos do CKAN oficial.",
  },
  {
    href: "/jurisprudencia?frente=riodoce&tribunal=TJMG#lista",
    titulo: "Jurisprudência — TJMG",
    descricao: "Acórdãos de Minas sobre o Rio Doce, filtráveis por órgão e tema.",
  },
  {
    href: "/jurisprudencia?frente=riodoce&tribunal=TJES#lista",
    titulo: "Jurisprudência — TJES",
    descricao: "Acórdãos do Espírito Santo sobre o Fundão, filtráveis por órgão e tema.",
  },
  {
    href: "/ambiental/legislacao",
    titulo: "Que lei protege isso",
    descricao: "Leis ambientais e de direitos que valem para o caso e como acioná-las.",
  },
  {
    href: "/ambiental/crimes-socioambientais",
    titulo: "Crimes socioambientais",
    descricao: "Tipificação, casos e responsabilização de empresas por dano ambiental.",
  },
  {
    href: "/ambiental/direitos-humanos",
    titulo: "Direitos humanos",
    descricao: "Relatórios de violações ligadas a desastres e conflitos no campo.",
  },
  {
    href: "/riodoce/indice",
    titulo: "Índice do tema",
    descricao: "Todas as páginas do Rio Doce reunidas num índice navegável.",
  },
];

export default function PaginasTema() {
  return (
<section aria-labelledby="paginas-do-tema" className="mt-12 border-t border-border pt-8">
  <h2 id="paginas-do-tema" className="font-display text-xl font-semibold">
    Todas as páginas deste tema
  </h2>
  <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
    As portas do Rio Doce no portal — da visão geral aos processos, à
    execução do Acordo e à jurisprudência.
  </p>
  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {PAGINAS_TEMA.map((pagina) => (
      <li key={pagina.href}>
        <NextLink
          href={pagina.href}
          className="cp-card-hover flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
        >
          <span className="text-sm font-semibold text-primary">
            {pagina.titulo}
          </span>
          <span className="mt-1 text-xs leading-snug text-text-soft">
            {pagina.descricao}
          </span>
        </NextLink>
      </li>
    ))}
  </ul>
</section>
  );
}
