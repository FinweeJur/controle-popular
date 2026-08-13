import Link from "@/lib/betim/link";
import type { Cidade } from "@/lib/db/queries/municipios";
import FooterGlobal from "@/app/components/FooterGlobal";

const CIDADE_LINKS = [
  { label: "Prefeitura", href: "/prefeitura" },
  { label: "Câmara", href: "/camara" },
  { label: "Contratos", href: "/prefeitura/contratos" },
];

/**
 * "Ação cidadã" saiu de `href="#"` e passou a apontar para canal real.
 *
 * O comentário anterior dizia que os três eram "intentional 404s for now,
 * features not built yet". Deixou de ser verdade sem que ninguém religasse:
 * `PedidoLAI.tsx` existe há várias fases e `/anuncie` tem rota. Placeholder
 * que sobrevive ao recurso que esperava vira link quebrado em produção — e
 * num portal cuja proposta é ação cidadã, quebrado justo na coluna de agir.
 *
 * Os dois primeiros vêm do BANCO (`municipios.fontes`, migration 0040) e não
 * de literal: são portais DIFERENTES por cidade, e foi assim que o e-SIC de
 * BH ficou apontando para uma URL que a PBH tinha removido.
 *
 * Item sem URL cadastrada é OMITIDO, nunca renderizado apontando para "#":
 * link que não leva a lugar nenhum é pior que ausência, porque promete.
 */
function acaoCidada(cidade: Cidade) {
  const f = cidade.fontes ?? {};
  const url = (k: string) => (typeof f[k] === "string" && f[k] ? (f[k] as string) : null);
  return [
    { label: "Pedido LAI", href: url("sic_prefeitura") },
    { label: "Denunciar", href: url("ouvidoria") },
    { label: "Anuncie aqui", href: "/anuncie" },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));
}

/**
 * O tribunal de contas MUDA COM A CIDADE, e "TCE-MG" estava fixo aqui — em
 * São Paulo a corte que fiscaliza o município é o TCM-SP, não o TCE-MG. É o
 * mesmo defeito de crédito de fonte que já apareceu no card de servidores:
 * rótulo errado com aparência de certo dá credibilidade ao destino errado.
 */
function fontesDeDados(cidade: Cidade) {
  const corte =
    cidade.id_municipio === "3550308"
      ? { label: "TCM-SP", href: "https://portal.tcm.sp.gov.br" }
      : { label: "TCE-MG", href: "https://www.tce.mg.gov.br" };
  return [
    { label: "IBGE", href: "https://www.ibge.gov.br" },
    { label: "PNCP", href: "https://www.gov.br/pncp" },
    { label: "Tesouro Nacional", href: "https://www.tesourotransparente.gov.br" },
    corte,
    { label: "INEP", href: "https://www.gov.br/inep" },
    { label: "DataSUS", href: "https://datasus.saude.gov.br" },
  ];
}

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
        <FooterColumn title="Ação cidadã" links={acaoCidada(cidade)} />
        <div>
          <h4 className="mb-3 text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
            Fontes de dados
          </h4>
          <ul className="flex flex-wrap gap-x-3.5 gap-y-2 text-[.9em]">
            {fontesDeDados(cidade).map((f) => (
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

      {/* Extensão do rodapé padrão do portal (busca, dados populares, as
          cinco frentes, sobre/metodologia) — ver `FooterGlobal.tsx` para a
          decisão de arquitetura: este rodapé de cidade é RICO demais
          (LAI, ouvidoria, fontes de dados por município) para virar
          FooterGlobal sozinho, então ele o ESTENDE em vez de ser
          substituído por ele. O "Sobre o projeto" logo abaixo, no rodapé
          de baixo, é o `/sobre` LOCAL da cidade (via `<Link>` de zona,
          `/betim/sobre`); o "Sobre o projeto" dentro do FooterGlobal é o
          `/sobre` da RAIZ — a apresentação do portal inteiro. */}
      <div className="mx-auto max-w-6xl">
        <FooterGlobal />
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[.8em] text-text-soft">
        <span>© {new Date().getFullYear()} controlepopular.br · iniciativa cidadã independente</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacidade" className="hover:text-primary">
            Privacidade (LGPD)
          </Link>
          {/* "Termos" apontava para `/termos`, rota que nunca existiu em
              `app/[municipio]/` nem na raiz — 404 em produção, em TODA
              página do eixo Cidades, desde sempre (achado na auditoria de
              hiperlinks de 2026-08-13). Mesma doutrina do resto deste
              arquivo (ver `acaoCidada` acima): sem destino real, o link
              some, não aponta para lugar nenhum. */}
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
            {/* URL ABSOLUTA SAI EM <a> CRU, e isso não é estilo.
                O `<Link>` importado aqui é o wrapper de zona, que prefixa a
                rota da cidade (ver `lib/betim/link`) — passar
                "https://esic..." por ele geraria "/bh/https://esic...", um
                404 silencioso. O README registra que essa classe de erro já
                aconteceu três vezes. */}
            {/^https?:\/\//.test(l.href) ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent"
              >
                {l.label} ↗
              </a>
            ) : (
              <Link href={l.href} className="text-primary hover:text-accent">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
