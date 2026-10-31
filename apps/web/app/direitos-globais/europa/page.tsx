import type { Metadata } from "next";
import Link from "next/link";
import { Shield, BookOpen, ExternalLink, Scale, CheckCircle } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_EUROPA } from "@/lib/direitos-globais/europa/paises";
import { DISPOSITIVOS_EUROPA } from "@/lib/direitos-globais/europa/dispositivos";
import TabelaEuropaInterativa from "../componentes/TabelaEuropaInterativa";
import { SecaoDispositivosComFiltro } from "../componentes/Dispositivos";

export const metadata: Metadata = {
  title: "Europa e Conselho da Europa | Direitos Globais | Controle Popular",
  description:
    "Comparação dos 44 países europeus, dispositivos constitucionais da Leva 1, legislação de responsabilização de empresas transnacionais e tutela ambiental.",
};

function ResumoEuropa() {
  const totalPaises = PAISES_EUROPA.length;
  const leva1Paises = PAISES_EUROPA.filter((p) => p.leva === 1).length;
  const totalDispositivos = DISPOSITIVOS_EUROPA.length;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Países Catalogados
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">{totalPaises}</p>
        <p className="mt-1 text-xs text-text-soft">Estados soberanos do continente europeu</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Leva 1 Prioritária
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">{leva1Paises} países</p>
        <p className="mt-1 text-xs text-text-soft">Dispositivos integrais verbatim conferidos</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Dispositivos Reais
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">{totalDispositivos}</p>
        <p className="mt-1 text-xs text-text-soft">Normas constitucionais e estatutárias</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Scale className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Due Diligence & CSDDD
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">Diretiva UE</p>
        <p className="mt-1 text-xs text-text-soft">Dever de vigilância sobre cadeias globais</p>
      </div>
    </div>
  );
}

function BlocoLegislacaoTransnacionais() {
  return (
    <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Responsabilização Corporativa
            </span>
            <span className="text-xs text-text-soft">Litígios Transnacionais e Direitos Humanos</span>
          </div>
          <h2 className="text-xl font-bold text-text">
            Legislação Europeia sobre Cadeias de Suprimentos e Empresas Transnacionais
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">
            Consulte a cobertura detalhada das leis europeias de devida diligência em direitos humanos e meio ambiente: a <strong>Loi de Vigilance</strong> francesa, a <strong>Lieferkettengesetz (LkSG)</strong> alemã, o <strong>Modern Slavery Act</strong> britânico e a <strong>Diretiva CSDDD da União Europeia</strong>, além dos precedentes de responsabilização extraterritorial no caso Mariana/Brumadinho na Justiça inglesa e holandesa.
          </p>
        </div>
        <Link
          href="/europa/legislacao-transnacionais"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90 shadow-sm"
        >
          <span>Acessar Legislação Transnacional</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default function PaginaEuropa() {
  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">
          Direitos Globais
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Europa</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Europa e Conselho da Europa
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Comparação sistemática dos 44 países europeus, catálogo constitucional verbatim da Leva 1
          e mecanismos de devida diligência empresarial sobre direitos humanos e meio ambiente.
        </p>
        <div className="mt-4">
          <DataColeta
            coletadoEm="2026-10-30"
            fonte="Constitute Project e Legislation.gov.uk"
            competencia="Europa (44 países)"
          />
        </div>
      </header>

      <ResumoEuropa />

      <BlocoLegislacaoTransnacionais />

      <section className="mb-12">
        <header className="mb-4">
          <h2 className="text-xl font-bold text-text">Matriz Geral dos 44 Países Europeus</h2>
          <p className="text-xs text-text-soft">
            Filtre por sub-região ou status de coleta. Você pode baixar a planilha completa em CSV.
          </p>
        </header>

        <TabelaEuropaInterativa paises={PAISES_EUROPA} />
      </section>

      <SecaoDispositivosComFiltro
        dispositivos={DISPOSITIVOS_EUROPA}
        titulo="Dispositivos Constitucionais Conferidos na Europa"
        descricao="33 artigos transcritos integralmente com fonte e data de acesso para os países prioritários."
      />

      <FooterGlobal />
    </main>
  );
}
