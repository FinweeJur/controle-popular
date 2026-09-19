import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelMultinacionaisClient from "./PainelMultinacionaisClient";
import {
  obterBaseFornecedores,
  obterFornecedoresMultinacionais,
} from "@/lib/fornecedores/calculos-multinacionais";

export const metadata: Metadata = {
  title:
    "Fornecedores Multinacionais dos Órgãos Públicos (EUA e Europa) | Controle Popular",
  description:
    "Investigação cívica dos contratos públicos com conglomerados dos EUA e Europa (Microsoft, Oracle, Saab, Airbus, AECOM, Pfizer, SAP, Alstom, Caterpillar): valores em R$ e US$, proporção do lucro global na SEC, vigência, condições e contrapartidas tecnológicas.",
};

export default function FornecedoresMultinacionaisPage() {
  const base = obterBaseFornecedores();
  const empresas = obterFornecedoresMultinacionais();

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
            Fornecedores Globais (EUA & Europa)
          </span>
        </nav>

        {/* Cabeçalho Editorial */}
        <header className="mb-8 rounded-2xl border border-border bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase text-primary">
                Auditoria de Compras Governamentais
              </span>
              <span className="text-xs text-text-soft">
                Atualizado em {base.metadados.ultima_atualizacao}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-soft">
              <span>Bases Oficiais:</span>
              <span className="font-medium text-text">PNCP · SIAFI · SEC (10-K) · IFRS</span>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Multinacionais Estrangeiras nos Órgãos Públicos
            </h1>
            <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-4xl">
              Mapeamento dos maiores fornecedores dos Estados Unidos e da Europa
              que faturam no Governo Federal, Estados, Municípios, Tribunais e
              Congresso Nacional. Cruzamos os empenhos e contratos públicos
              com as demonstrações financeiras globais registradas na SEC (EUA) e
              nas bolsas europeias para revelar o real impacto do dinheiro público
              brasileiro no lucro internacional, as condições de monopólio e
              a presença ou ausência de contrapartidas de transferência tecnológica.
            </p>
          </div>

          {/* Destaque didático */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-border pt-4 text-xs text-text-soft">
            <div>
              <strong className="text-text">Dupla Moeda:</strong> Contratos medidos
              em Reais (R$) e convertidos em Dólares (US$) na data de assinatura.
            </div>
            <div>
              <strong className="text-text">Balanço SEC / IFRS:</strong> Lucros
              líquidos globais de 5 e 10 anos auditados por órgãos internacionais.
            </div>
            <div>
              <strong className="text-text">Compensação (Offsets):</strong> Avaliação
              de exigência de fábricas no Brasil ou mero envio de lucros ao exterior.
            </div>
          </div>
        </header>

        {/* Painel Interativo de Análise */}
        <PainelMultinacionaisClient
          empresas={empresas}
          dataAtualizacao={base.metadados.ultima_atualizacao}
        />

        {/* Metodologia e Notas Explicativas */}
        <footer className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft space-y-3">
          <h3 className="font-semibold text-text text-sm">
            Metodologia e Rigor Cívico
          </h3>
          <p className="leading-relaxed">
            1. <strong>Fontes Primárias Governamentais:</strong> Os dados de contratos
            brasileiros têm como base o Portal Nacional de Contratações Públicas (PNCP - Lei 14.133/2021),
            o Portal da Transparência da Controladoria-Geral da União (CGU) e os Diários Oficiais estaduais.
          </p>
          <p className="leading-relaxed">
            2. <strong>Demonstrações Financeiras Internacionais:</strong> Os lucros e receitas
            das companhias americanas derivam dos relatórios anuais obrigatórios (Form 10-K e 20-F)
            arquivados perante a <em>Securities and Exchange Commission</em> (SEC). Companhias
            europeias têm seus números extraídos dos relatórios consolidados sob o padrão IFRS.
          </p>
          <p className="leading-relaxed">
            3. <strong>Regra Editorial:</strong> A publicação destes dados visa fiscalizar a
            dependência tecnológica e a transparência do erário. Constar nesta lista decorre
            de contrato administrativo formal firmado com o poder público brasileiro.
          </p>
        </footer>
      </main>

      <FooterGlobal />
    </div>
  );
}
