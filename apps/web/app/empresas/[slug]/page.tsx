import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterEmpresa } from "@/lib/empresas/dados";
import { processosPorEmpresa } from "@/lib/empresas/sigmine";
import { NOTICIAS_SIGMA_LITHIUM, NOTICIAS_VALE } from "@/lib/empresas/noticias";
import { montarTimelineAmbiental } from "@/lib/correlacao/sigma";
import { EVENTOS_AMBIENTAIS_SIGMA } from "@/lib/correlacao/sigma-dados";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const empresa = obterEmpresa(slug);
  if (!empresa) return { title: "Empresa não encontrada — Controle Popular" };
  return {
    title: `${empresa.nomeCurto} — Observatório de Empresas`,
    description: empresa.descricao,
  };
}

function formatarArea(ha: number): string {
  if (ha >= 10000) return `${(ha / 10000).toFixed(2)} km²`;
  return `${ha.toFixed(2)} ha`;
}

function linkAnm(processo: string): string {
  return `https://app.anm.gov.br/SIGMINE/publico/processos/${processo.replace("/", "")}`;
}

export default async function EmpresaPage({ params }: Props) {
  const { slug } = await params;
  const empresa = obterEmpresa(slug);
  if (!empresa) notFound();

  const processos = await processosPorEmpresa(empresa.sinonimosSigmine);
  const noticias =
    slug === "sigma-lithium" ? NOTICIAS_SIGMA_LITHIUM : NOTICIAS_VALE;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/empresas" className="hover:text-primary">
          Empresas monitoradas
        </Link>{" "}
        · <span className="text-text">{empresa.nomeCurto}</span>
      </nav>

      <header className="mb-10 space-y-4">
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
          {empresa.nome}
        </h1>
        <p className="text-text-soft">{empresa.descricao}</p>
        {empresa.cnpj && (
          <p className="text-sm text-text-soft">
            CNPJ: <span className="text-text">{empresa.cnpj}</span>
          </p>
        )}
      </header>

      {empresa.notas.length > 0 && (
        <section className="mb-10 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-semibold text-text">
            Destaques do acompanhamento
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-soft">
            {empresa.notas.map((nota, i) => (
              <li key={i}>{nota}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-text">
          Processos minerários no SIGMINE/ANM
        </h2>
        {processos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-text-soft">
            Nenhum processo de {empresa.nomeCurto} encontrado na base SIGMINE
            operação carregada no portal.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-text-soft">
              {processos.length} processos encontrados, ordenados por área.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-text-soft">
                  <tr>
                    <th className="px-4 py-2">Processo</th>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Substância</th>
                    <th className="px-4 py-2">Fase</th>
                    <th className="px-4 py-2">Área</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processos.slice(0, 50).map((p) => (
                    <tr key={p.processo} className="hover:bg-surface-2/50">
                      <td className="px-4 py-2">
                        <a
                          href={linkAnm(p.processo)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {p.processo}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-text">{p.nome}</td>
                      <td className="px-4 py-2 text-text-soft">{p.substancia}</td>
                      <td className="px-4 py-2 text-text-soft">{p.fase}</td>
                      <td className="px-4 py-2 text-text-soft">
                        {formatarArea(p.areaHa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processos.length > 50 && (
              <p className="mt-2 text-xs text-text-soft">
                Mostrando os 50 maiores processos. Consulte a ANM para a lista
                completa.
              </p>
            )}
          </>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-text">
          Notícias e alertas
        </h2>
        {noticias.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-text-soft">
            Nenhuma notícia curada para {empresa.nomeCurto} ainda.
          </p>
        ) : (
          <ul className="space-y-4">
            {noticias.map((n) => (
              <li
                key={n.href}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="text-xs text-text-soft">
                  {n.data} · {n.veiculo}
                </p>
                <a
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-medium text-accent hover:underline"
                >
                  {n.titulo}
                </a>
                <p className="mt-1 text-sm text-text-soft">{n.resumo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {slug === "sigma-lithium" && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold text-text">
            Eventos ambientais e impactos
          </h2>
          <p className="mb-4 text-sm text-text-soft">
            Timeline de eventos regulatórios e ambientais que afetaram as
            operações da Sigma Lithium no Vale do Jequitinhonha.
          </p>
          {(() => {
            const timeline = montarTimelineAmbiental(
              EVENTOS_AMBIENTAIS_SIGMA,
              NOTICIAS_SIGMA_LITHIUM.map((n) => ({
                titulo: n.titulo,
                href: n.href,
                data: n.data,
                fonte: n.veiculo,
                descricao: n.resumo,
              }))
            );
            return timeline.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-text-soft">
                Nenhum evento registrado.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, i) => (
                  <div
                    key={`${item.data}-${i}`}
                    className="flex gap-3 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.cor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-soft">
                        {item.data} ·{" "}
                        <span className="capitalize">{item.tipo}</span>
                      </p>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block font-medium text-accent hover:underline"
                      >
                        {item.titulo}
                      </a>
                      <p className="mt-1 text-sm text-text-soft">
                        {item.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-text">
          Links úteis
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {empresa.linksUteis.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-xl border border-border bg-surface p-3 text-sm font-medium text-accent hover:bg-surface-2"
              >
                {l.texto}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border pt-6 text-sm text-text-soft">
        <p>
          Este observatório reúne dados públicos. A ausência de informação é
          declarada. Quando houver indícios, eles são apresentados como pontos
          de atenção, nunca como conclusões judiciais.
        </p>
      </footer>
    </div>
  );
}
