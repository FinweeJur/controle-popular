import Link from "next/link";
import type { Metadata } from "next";
import { LUGARES_CATALOGO } from "@/lib/lugares";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";

export const metadata: Metadata = {
  title: "Nossos Rios, Serras, Territórios e Gente — ONSA · Controle Popular",
  description:
    "Coleção de lugares e territórios brasileiros sob a ótica do Observatório Nacional Socioambiental. Águas, relevo, cerrado e a nossa gente no centro da fiscalização cívica.",
};

export default function HubNossosPage() {
  const rios = LUGARES_CATALOGO.filter((l) => l.tipo === "rio");
  const serras = LUGARES_CATALOGO.filter((l) => l.tipo === "serra");
  const territorios = LUGARES_CATALOGO.filter((l) => l.tipo === "vale" || l.tipo === "cerrado");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* TRILHA */}
      <nav aria-label="Navegação estrutural" className="text-xs text-text-soft">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">Início</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental" className="hover:underline">ONSA · Meio Ambiente & Terras</Link>
          </li>
          <li>›</li>
          <li className="font-semibold text-text">Nossos</li>
        </ol>
      </nav>

      <header className="mt-5 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #natureza
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #ecossistema
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-soft border border-border">
            Coleção Territorial & Humana
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          A terra, as águas e a nossa gente
        </h1>
        <p className="mt-2 text-base text-text-soft max-w-3xl leading-relaxed">
          O meio ambiente não é uma abstração de gabinete: é o rio que sacia a sede, a serra que guarda as nascentes, o cerrado que alimenta a biodiversidade e as pessoas que vivem e trabalham no território.
        </p>

        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (manifesto final, Birri/Galeano) */}
        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft">
          "Para que serve a utopia? Serve para isso: para caminhar." — Fernando Birri, recolhido por Eduardo Galeano em As Palavras Andantes, 1994
        </p>
      </header>

      {/* AS 5 SUBFRENTES */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-text">As cinco frentes da nossa terra</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Nossos Rios */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl">🌊</span>
              <h3 className="mt-2 font-display text-lg font-bold text-text">Nossos Rios</h3>
              <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                Bacias hidrográficas, monitoramento de vazão, outorgas, barragens e a vida das comunidades ribeirinhas.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {rios.map((r) => (
                  <Link
                    key={r.id}
                    href={`/ambiental/nossos-rios/${r.id}`}
                    className="rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] font-medium text-text-soft hover:text-primary transition-colors border border-border"
                  >
                    {r.nome}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link href="/ambiental/nossos-rios" className="text-xs font-semibold text-primary hover:underline">
                Explorar todos os rios →
              </Link>
            </div>
          </div>

          {/* Nossas Serras */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl">⛰️</span>
              <h3 className="mt-2 font-display text-lg font-bold text-text">Nossas Serras</h3>
              <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                Cordilheiras, campos rupestres, parques estaduais, concessões e pressões minerárias no relevo.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {serras.map((s) => (
                  <Link
                    key={s.id}
                    href={`/ambiental/nossas-serras/${s.id}`}
                    className="rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] font-medium text-text-soft hover:text-primary transition-colors border border-border"
                  >
                    {s.nome}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link href="/ambiental/nossas-serras" className="text-xs font-semibold text-primary hover:underline">
                Explorar todas as serras →
              </Link>
            </div>
          </div>

          {/* Nossos Territórios */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl">🌱</span>
              <h3 className="mt-2 font-display text-lg font-bold text-text">Nossos Territórios</h3>
              <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                Vales, biomas, quilombos e terras tradicionais unificados com os dados fundiários do CAR.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {territorios.map((t) => (
                  <Link
                    key={t.id}
                    href={`/ambiental/nossos-territorios/${t.id}`}
                    className="rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] font-medium text-text-soft hover:text-primary transition-colors border border-border"
                  >
                    {t.nome}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <Link href="/ambiental/nossos-territorios" className="text-xs font-semibold text-primary hover:underline">
                Explorar territórios e terras →
              </Link>
            </div>
          </div>

          {/* Nossos Animais */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl">🐆</span>
              <h3 className="mt-2 font-display text-lg font-bold text-text">Nossos Animais</h3>
              <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                Fauna ameaçada, corredores ecológicos, atropelamento de animais em rodovias e proteção de espécies.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <span className="text-xs font-medium text-text-soft">Nova frente da Coleção Nossos</span>
            </div>
          </div>

          {/* Nossa Gente */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-2">
            <div>
              <span className="text-2xl">👥</span>
              <h3 className="mt-2 font-display text-lg font-bold text-text">Nossa Gente & "E nosso povo?"</h3>
              <p className="mt-1.5 text-xs text-text-soft leading-relaxed">
                A presença humana no território: saúde pública, renda de agricultores familiares, ceramistas tradicionais, ribeirinhos e o controle social da terra.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Presente em todas as páginas com o bloco "E nosso povo?" / "E nossa gente?"
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSSISTEMA ONSA — frentes de dado por trás da Coleção Nossos */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-bold text-text">O ecossistema em uma página</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-soft leading-relaxed">
          Rios, serras, territórios e gente são a cara da Coleção Nossos; o dado que sustenta essa fiscalização mora nas frentes técnicas do ONSA — as mesmas que alimentam as pontes entre frentes desta coleção.
        </p>

        <details className="group mt-5 rounded-2xl border border-border bg-surface-2 px-5 py-4">
          <summary className="cursor-pointer list-none font-display text-base font-semibold text-text">
            <span className="mr-2 inline-block text-xs text-primary transition-transform duration-200 group-open:rotate-180">▼</span>
            Onde o dado mora
          </summary>
          <p className="mt-3 text-sm text-text-soft">
            Cada frente abaixo é um motor de dado público — estadual ou federal — coletado pelo ONSA e cruzado com os lugares desta coleção.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href="/ambiental/nossos-territorios" className="rounded-md bg-orange-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-orange-800 transition-colors hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900">Terras e território</Link>
                <Link href="/funcaosocialterra" className="rounded-md bg-orange-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-orange-800 transition-colors hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900">CAR por município</Link>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">Territórios tradicionais unificados ao dado fundiário do CAR, município por município.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Link href="/ambiental/barragens" className="rounded-md bg-teal-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900">Barragens</Link>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">FEAM, SNISB e SIGBM/ANM lado a lado, com nível de emergência e categoria de risco.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Link href="/ambiental/licenciamento" className="rounded-md bg-teal-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900">Licenciamento</Link>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">Toda licença ambiental deferida pela Semad, por município, setor e classe.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Link href="/ambiental/copam" className="rounded-md bg-teal-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900">COPAM</Link>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">A pauta de cada reunião do conselho estadual, item a item, com o resultado da deliberação.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Link href="/ambiental/estudos" className="rounded-md bg-teal-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900">Estudos e perícias</Link>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">EIA/RIMA de audiências públicas, com o link de origem e guarda de cópia.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <Link href="/ambiental/legislacao" className="rounded-md bg-teal-100 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900">Legislação</Link>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">As normas ambientais aplicáveis, organizadas para consulta rápida.</p>
            </div>
          </div>
        </details>
      </section>

      {/* FECHO — citação autorizada */}
      <Epigrafe citacao={citacaoPorId("carolina-mundo-modificar")!} variante="fecho" />

      <OutrasFrentes atual="ambiental" />
    </main>
  );
}
