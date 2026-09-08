import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { obterTodasInstituicoes } from "@/lib/instituicoes/catalogo";
import PainelInstituicoesClient from "./PainelInstituicoesClient";

export const metadata: Metadata = {
  title: "Instituições e Secretarias de Todas as Esferas — Organograma, Contatos e Ouvidoria | Controle Popular",
  description:
    "Catálogo unificado dos órgãos públicos do Brasil: Ministérios federais, Secretarias estaduais e municipais, Congresso, Assembleias, Câmaras, Tribunais, Ministério Público e Defensoria.",
};

export default function InstituicoesHubPage() {
  const instituicoes = obterTodasInstituicoes();

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Instituições e Secretarias</span>
        </nav>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>🏛️</span> Transparência Institucional em Todas as Esferas
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Quem comanda, quanto gasta e como falar
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
            O cidadão não precisa adivinhar para onde vai o seu imposto ou qual telefone atende a sua demanda.
            Reunimos em fichas públicas padronizadas os órgãos do Executivo, Legislativo, Judiciário e Sistema de Justiça:
            organograma com atribuições reais de cada setor, titulares, orçamento na LOA e canais diretos de ouvidoria e e-SIC.
          </p>
        </div>

        {/* ═══ PAINEL INTERATIVO CLIENT (BUSCA, FILTROS, CARDS, CSV) ═══ */}
        <PainelInstituicoesClient instituicoes={instituicoes} />

        {/* ═══ NOTA DE INTEGRIDADE EDITORIAL ═══ */}
        <section className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft">
          <h3 className="text-sm font-bold text-text">Origem dos dados institucionais</h3>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Canais de atendimento:</strong> Telefones, e-mails funcionais e endereços físicos são extraídos de diários oficiais e páginas institucionais governamentais (.gov.br, .leg.br, .jus.br, .mp.br e .def.br).
            </li>
            <li>
              <strong>Orçamento e Pessoal:</strong> Os valores de folha e custeio refletem as Leis Orçamentárias Anuais (LOA) e os Relatórios de Gestão Fiscal (RGF) auditados pelos respectivos Tribunais de Contas.
            </li>
            <li>
              <strong>Direito à Informação:</strong> Todo cidadão tem o direito constitucional (art. 5º, XXXIII da CF/88 e Lei 12.527/2011) de obter informações de qualquer órgão público sem justificar o motivo.
            </li>
          </ul>
        </section>
      </main>

      <FooterGlobal />
    </div>
  );
}
