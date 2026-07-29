import Link from "@/lib/betim/link";
import type { Cidade } from "@/lib/db/queries/municipios";

// "Ação cidadã" column links to features not built yet (LAI request wizard,
// denúncia form, fiscalização tracks, ad self-service) — intentional 404s
// for now, same convention as Header's Câmara/Dados links. "Anuncie aqui"
// is real planned scope (plan §7.6) with no route yet either.
const CIDADE_LINKS = [
  { label: "Prefeitura", href: "/prefeitura" },
  { label: "Câmara", href: "/camara" },
  { label: "Contratos", href: "/prefeitura/contratos" },
];
const ACAO_CIDADA_LINKS = [
  { label: "Pedido LAI", href: "#" },
  { label: "Denunciar", href: "#" },
  { label: "Anuncie aqui", href: "#" },
];
const FONTES_DADOS = [
  { label: "IBGE", href: "https://www.ibge.gov.br" },
  { label: "PNCP", href: "https://www.gov.br/pncp" },
  { label: "Tesouro Nacional", href: "https://www.tesourotransparente.gov.br" },
  { label: "TCE-MG", href: "https://www.tce.mg.gov.br" },
  { label: "INEP", href: "https://www.gov.br/inep" },
  { label: "DataSUS", href: "https://datasus.saude.gov.br" },
];

export default function Footer({ cidade }: { cidade: Cidade }) {
  return (
    <footer className="border-t border-border bg-surface px-4 pt-10 pb-7 sm:px-8 sm:pt-14">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <span className="font-display text-[1.1em] font-bold text-text">
            controlepopular<span className="text-primary">.br</span>
          </span>
          <p className="mt-3 max-w-[34ch] text-[.85em] text-text-soft">
            Transparência pública de {cidade.nome}, {cidade.uf}. Iniciativa cidadã independente,
            sem vínculo com a Prefeitura ou a Câmara Municipal.
          </p>
        </div>
        <FooterColumn title="Cidade" links={CIDADE_LINKS} />
        <FooterColumn title="Ação cidadã" links={ACAO_CIDADA_LINKS} />
        <div>
          <h4 className="mb-3 text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
            Fontes de dados
          </h4>
          <ul className="flex flex-wrap gap-x-3.5 gap-y-2 text-[.9em]">
            {FONTES_DADOS.map((f) => (
              <li key={f.label}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent"
                >
                  {f.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[.8em] text-text-soft">
        <span>© {new Date().getFullYear()} controlepopular.br · iniciativa cidadã independente</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacidade" className="hover:text-primary">
            Privacidade (LGPD)
          </Link>
          <Link href="/termos" className="hover:text-primary">
            Termos
          </Link>
          <Link href="/sobre" className="hover:text-primary">
            Sobre o projeto
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
        {title}
      </h4>
      <ul className="flex flex-col gap-2 text-[.9em]">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-primary hover:text-accent">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
