import Link from "next/link";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import { EIXOS, paginasDoEixo } from "@/lib/navegacao/mapa";
import { referenciasDoEixo } from "@/lib/navegacao/referencias";

/**
 * Índice expansível por eixo — a árvore do portal.
 *
 * POR QUE EXISTE
 *
 * O índice listava páginas, não assuntos. Aqui o leitor abre o eixo, vê as
 * frentes e chega na página — na ordem Eixo → Frente → Página do mapa de
 * navegação (`lib/navegacao/mapa.ts`), sem lista paralela para desatualizar.
 *
 * ACESSIBILIDADE
 *
 * `<details>/<summary>` nativo: abre sem JavaScript, funciona no teclado e o
 * leitor de tela anuncia "recolhido/expandido". O primeiro eixo com frente em
 * destaque já abre aberto.
 *
 * DESTAQUE
 *
 * Frente com `destaque: true` (o mapa do território) ganha selo e vem primeiro
 * dentro do eixo; o eixo que a contém abre por padrão.
 */

/** Portas que resolvem a maioria das dúvidas de quem chega. */
const COMECE_AQUI = [
  { rotulo: "Brumadinho", href: "/paraopeba", nota: "auxílio, acordo, execução e documentos" },
  { rotulo: "Rio Doce", href: "/riodoce", nota: "Fundão, repactuação e processos" },
  { rotulo: "Jurisprudência", href: "/jurisprudencia", nota: "acórdãos e catálogo dos desastres" },
  { rotulo: "Barragens", href: "/ambiental/barragens", nota: "quantas, onde e em que nível" },
];

/**
 * Matérias do MAB e do Brasil de Fato sobre o eixo.
 *
 * Só aparece quando existe link verificado; eixo sem cobertura não ganha bloco
 * de enfeite. Abre em aba nova porque é outra casa, não o portal.
 */
function ReferenciasDoEixo({ slug }: { slug: string }) {
  const referencias = referenciasDoEixo(slug);
  if (referencias.length === 0) return null;
  return (
    <div className="mt-3 rounded-md border border-dashed border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
        Leia no movimento
      </p>
      <ul className="mt-2 space-y-1.5">
        {referencias.map((referencia) => (
          <li key={referencia.url} className="text-sm">
            <a
              href={referencia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              {referencia.titulo} ↗
            </a>
            <span className="ml-1 text-xs text-text-soft">
              {referencia.veiculo}
              {referencia.nota ? ` · ${referencia.nota}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function IndiceEixos() {
  return (
    <section className="mt-12" aria-labelledby="navegue-por-eixo">
      <div className="mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Navegação
        </span>
        <h2 id="navegue-por-eixo" className="font-display text-2xl font-bold text-text">
          Navegue por eixo
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-soft">
          <ContadorAnimado valor={EIXOS.length} /> eixos, cada um com as suas frentes. Abra o assunto e chegue na página —
          os nomes são links e a trilha no topo de cada página volta para cá.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold">Comece por aqui</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {COMECE_AQUI.map((porta) => (
            <li key={porta.href}>
              <Link
                href={porta.href}
                className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-current"
              >
                <span className="font-medium">{porta.rotulo}</span>
                <span className="text-right text-xs text-text-soft">{porta.nota}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <nav aria-label="Eixos do portal" className="space-y-2">
        {EIXOS.map((eixo) => {
          const temDestaque = eixo.frentes.some((frente) => frente.destaque);
          return (
            <details
              key={eixo.slug}
              open={temDestaque}
              className="group rounded-lg border border-border bg-surface px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-base font-semibold">{eixo.rotulo}</span>
                  <span className="text-xs text-text-soft">
                    <ContadorAnimado valor={eixo.frentes.length} /> frente(s) · <ContadorAnimado valor={paginasDoEixo(eixo.slug)} /> páginas
                  </span>
                  {eixo.estado === "proposta" && (
                    <span className="rounded bg-[var(--cp-border)] px-1.5 py-0.5 text-xs uppercase tracking-wide">
                      porta em construção
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="text-text-soft group-open:rotate-90 transition-transform">
                  ›
                </span>
              </summary>

              <p className="mt-2 text-sm text-text-soft">{eixo.descricao}</p>

              <ul className="mt-3 space-y-2">
                {[...eixo.frentes]
                  .sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)))
                  .map((frente) => (
                    <li key={`${eixo.slug}-${frente.slug}`}>
                      <Link
                        href={frente.rota}
                        className="flex min-h-11 flex-col justify-center gap-0.5 rounded-md border border-border px-3 py-2 transition-colors hover:border-current focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {frente.rotulo}
                          {frente.destaque && (
                            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                              mapa
                            </span>
                          )}
                          <span className="text-xs font-normal text-text-soft">
                            {new Set(frente.rotas).size || 1} rota(s)
                          </span>
                        </span>
                        <span className="text-xs text-text-soft">{frente.descricao}</span>
                      </Link>
                    </li>
                  ))}
              </ul>

              <ReferenciasDoEixo slug={eixo.slug} />
            </details>
          );
        })}
      </nav>
    </section>
  );
}
