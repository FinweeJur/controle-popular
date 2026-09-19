import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelAcordosClient from "./PainelAcordosClient";
import {
  obterBaseNegociacoes,
  obterAcordosELicitacoesInternacionais,
} from "@/lib/negociacoes/acordos-internacionais";

export const metadata: Metadata = {
  title:
    "Acordos, Parcerias e Licitações Internacionais (Brasil, EUA e Europa) | Controle Popular",
  description:
    "Monitoramento de acordos bilaterais, memorandos de entendimento (MoUs), leilões do BNDES/PPI e licitações abertas em 7 setores (construção civil, tecnologia, saúde, educação, infraestrutura, energia e mineração) com pronunciamentos oficiais e contrapartidas.",
};

export default function AcordosELicitacoesInternacionaisPage() {
  const base = obterBaseNegociacoes();
  const itens = obterAcordosELicitacoesInternacionais();

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navegação Estrutural (Breadcrumb) */}
        <nav
          aria-label="Navegação estrutural"
          className="mb-4 flex items-center gap-2 text-xs text-text-soft"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/estado-e-economia" className="hover:text-primary">
            Estado & Economia
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">
            Acordos & Licitações Internacionais
          </span>
        </nav>

        {/* Cabeçalho Editorial */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
                Observatório de Negociações & Concorrências Globais
              </span>
              <span className="text-xs text-text-soft">
                Atualizado em {base.metadados.ultima_atualizacao}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-soft">
              <span>Fontes:</span>
              <span className="font-medium text-text">
                BNDES · PPI · Itamaraty · DOE (EUA) · Global Gateway (UE)
              </span>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Acordos, Parcerias e Licitações Internacionais
            </h1>
            <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-4xl">
              Rastreamento contínuo de acordos bilaterais em negociação, memorandos
              de entendimento (MoUs), leilões da B3/BNDES e editais abertos disputados
              por consórcios do Brasil, dos Estados Unidos e dos 10 principais
              países europeus. Cobrindo construção civil, tecnologia, saúde, educação,
              infraestrutura, energia e mineração de transição, com registro
              literal de pronunciamentos oficiais e salvaguardas de contrapartida.
            </p>
          </div>

          {/* Destaque dos 7 setores */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
            <span className="text-xs font-semibold text-text mr-1 py-0.5">
              Setores Monitorados:
            </span>
            {[
              "Construção Civil",
              "Tecnologia & Nuvem",
              "Saúde & Vacinas",
              "Educação & Ciência",
              "Infraestrutura & Ferrovias",
              "Energia & H2 Verde",
              "Mineração Crítica",
            ].map((s) => (
              <span
                key={s}
                className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft"
              >
                {s}
              </span>
            ))}
          </div>
        </header>

        {/* Painel Interativo de Análise */}
        <PainelAcordosClient
          itens={itens}
          dataAtualizacao={base.metadados.ultima_atualizacao}
        />

        {/* Rodapé Metodológico */}
        <footer className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft space-y-3">
          <h3 className="font-semibold text-text text-sm">
            Metodologia de Coleta e Dupla Verificação
          </h3>
          <p className="leading-relaxed">
            1. <strong>Rastreamento de Atos e Pronunciamentos Oficiais:</strong> Todo
            registro neste painel é fundamentado em publicações oficiais de ministérios
            (MME, MCTI, MS, MEC, MDIC, Transportes), agências reguladoras (ANTT, ANP,
            ANEEL), bancos multilaterais de fomento (BNDES, BID, Banco Mundial, KfW, BEI)
            ou despachos diplomáticos oficiais.
          </p>
          <p className="leading-relaxed">
            2. <strong>Contrapartidas e Exigências Cívicas:</strong> O monitoramento
            prioriza o impacto social e a retenção de valor no Brasil (transferência
            de tecnologia, consultas prévias da OIT 169 a comunidades tradicionais,
            regras de descarbonização e prevenção de monopólios abusivos).
          </p>
        </footer>
      </main>

      <FooterGlobal />
    </div>
  );
}
