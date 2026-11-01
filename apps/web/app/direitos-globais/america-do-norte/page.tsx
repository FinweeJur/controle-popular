import type { Metadata } from "next";
import Link from "next/link";
import { Shield, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_AMERICA_DO_NORTE } from "@/lib/direitos-globais/america-do-norte/paises";
import { DISPOSITIVOS_AMERICA_DO_NORTE } from "@/lib/direitos-globais/america-do-norte/dispositivos";
import TabelaAmericaDoNorteInterativa from "../componentes/TabelaAmericaDoNorteInterativa";
import { ListaDispositivos } from "../componentes/Dispositivos";

export const metadata: Metadata = {
  title: "América do Norte | Direitos Globais | Controle Popular",
  description:
    "Comparação constitucional e direitos fundamentais dos Estados Unidos e do Canadá, com análise do Bill of Rights, Canadian Charter e Section 35 de povos indígenas.",
};

function ResumoAmericaDoNorte() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Países Catalogados
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">2 Estados Federais</p>
        <p className="mt-1 text-xs text-text-soft">Estados Unidos (US) e Canadá (CA)</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Dispositivos e Lacunas
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">6 Preceitos</p>
        <p className="mt-1 text-xs text-text-soft">Normas federais verbatim e auditoria de lacunas</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Povos Indígenas (CA)
          </h3>
        </div>
        <p className="text-2xl font-bold text-text">Section 35</p>
        <p className="mt-1 text-xs text-text-soft">First Nations, Inuit e Métis</p>
      </div>
    </div>
  );
}

function NotaEditorialMexico() {
  return (
    <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Nota de integridade cadastral:</strong> O México
          geograficamente integra a América do Norte, mas no portal está catalogado na seção de{" "}
          <Link
            href="/direitos-globais/america-latina"
            className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            América Latina
          </Link>{" "}
          (código ISO MX) para preservar a coerência do Sistema Interamericano (OEA/Corte IDH) e
          evitar contagens duplicadas.
        </div>
      </div>
    </div>
  );
}

function DispositivosAmericaDoNorte() {
  const paises = ["Estados Unidos", "Canadá"];

  return (
    <section className="mb-12">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-text">
          Dispositivos Constitucionais e Declarações de Lacuna
        </h2>
        <p className="mt-1 text-sm text-text-soft">
          Artigos transcritos verbatim das fontes públicas canônicas (Constitute Project e Justice
          Laws Website Canada) e auditoria de ausência com fundamentação legal.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {paises.map((pais) => (
          <ListaDispositivos
            key={pais}
            pais={pais}
            dispositivos={DISPOSITIVOS_AMERICA_DO_NORTE.filter((d) => d.pais === pais)}
          />
        ))}
      </div>
    </section>
  );
}

export default function PaginaAmericaDoNorte() {
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
        <span className="font-semibold text-text">América do Norte</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          América do Norte
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Auditoria de direitos constitucionais nos Estados Unidos e Canadá: garantias civis e
          políticas, igualdade perante a lei, proteção a povos originários e constatação da ausência
          de dever constitucional ambiental federal nos EUA.
        </p>
        <div className="mt-4">
          <DataColeta
            coletadoEm="2026-10-30"
            fonte="Constitute Project e Justice Laws Website Canada"
            competencia="América do Norte (EUA e Canadá)"
          />
        </div>
      </header>

      <NotaEditorialMexico />

      <ResumoAmericaDoNorte />

      <section className="mb-12">
        <header className="mb-4">
          <h2 className="text-xl font-bold text-text">Comparação Geral dos Países</h2>
          <p className="text-xs text-text-soft">
            Dados socioeconômicos e constitucionais dos Estados federais norte-americanos.
          </p>
        </header>

        <TabelaAmericaDoNorteInterativa paises={PAISES_AMERICA_DO_NORTE} />
      </section>

      <DispositivosAmericaDoNorte />

      <FooterGlobal />
    </main>
  );
}
