import type { Metadata } from "next";
import Link from "next/link";
import {
  obterTodasInstituicoes,
  obterEstatisticasEcossistema,
} from "@/lib/ambiental/ecossistema-nacional";
import PainelEcossistema from "./PainelEcossistema";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title:
    "Ecossistema Regulatório, Ambiental e Concessionárias do Brasil — 27 Estados, Ministérios e Autarquias | ONSA",
  description:
    "Mapeamento consolidado das 27 Secretarias e Agências Estaduais de Meio Ambiente (OEMAs), Ministérios Federais, Agências Reguladoras (IBAMA, ICMBio, ANA, ANEEL, ANM) e principais concessionárias de água e energia elétrica.",
};

export default function PaginaEcossistemaNacional() {
  const instituicoes = obterTodasInstituicoes();
  const estatisticas = obterEstatisticasEcossistema();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">
          ONSA
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">
          Ecossistema Regulatório e Concessionárias
        </span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            27 Estados (OEMAs)
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Regulação Federal & Agências
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Concessionárias de Água e Saneamento
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Concessionárias de Energia & Luz
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ecossistema Nacional Regulatório, Ambiental e de Concessionárias
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Radiografia dos órgãos públicos ambientais dos 27 entes federativos, ministérios, autarquias e agências reguladoras (IBAMA, ICMBio, ANA, ANEEL, ANM), além das principais empresas públicas e concessionárias de serviços essenciais de água e luz. Sistemas informatizados, contatos institucionais e canais de ouvidoria auditados.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;O controle social exige saber quem decide, quem fiscaliza e quem opera as concessões públicas em cada canto do país.&rdquo;
          — Princípio cívico do Observatório Nacional Socioambiental (ONSA)
        </p>
      </header>

      {/* PAINEL INTERATIVO CLIENTE */}
      <section aria-label="Painel interativo do ecossistema">
        <PainelEcossistema instituicoesIniciais={instituicoes} />
      </section>

      {/* SEÇÃO RELACIONADA */}
      <div className="mt-12 border-t border-border pt-8">
        <MeioAmbienteRelacionado />
      </div>

      <FooterGlobal />
    </div>
  );
}
