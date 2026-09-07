import type { Metadata } from "next";
import Link from "next/link";
import { obterCatalogoDocumentos } from "@/lib/empresas/empresas-documentos";
import BibliotecaEmpresasClient from "./BibliotecaEmpresasClient";

export const metadata: Metadata = {
  title: "Biblioteca de Documentos Estratégicos, Relatórios ESG e Prestação de Contas — Controle Popular",
  description:
    "Acervo público de relatórios de sustentabilidade (GRI/SASB), demonstrações financeiras (CVM/SEC), inventários de carbono e relatórios de direitos humanos das maiores corporações e fundos atuantes no Brasil.",
};

export default function DocumentosEmpresasPage() {
  const catalogo = obterCatalogoDocumentos();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-8">
      {/* Navegação e Trilha */}
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/estado-e-economia" className="hover:text-primary transition">
          Estado & Economia
        </Link>{" "}
        ·{" "}
        <Link href="/empresas" className="hover:text-primary transition">
          Grandes Empresas & Fundos
        </Link>{" "}
        · <span className="text-foreground font-semibold">Biblioteca de Documentos</span>
      </nav>

      {/* Cabeçalho */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>📚 Acervo Cívico & Preservação Digital</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Biblioteca de Relatórios Corporativos & ESG
        </h1>
        <p className="max-w-4xl text-sm sm:text-base text-muted leading-relaxed">
          Repositório centralizado de transparência pública das {catalogo.totalEmpresas} empresas estratégicas brasileiras e globais. 
          Consulte relatórios anuais de sustentabilidade, auditorias financeiras independentes, metas de descarbonização e conformidade com direitos humanos. 
          Cada documento conta com espelho no bucket de armazenamento em nuvem R2 para garantia de acesso perpétuo e link direto para a fonte oficial.
        </p>
      </header>

      {/* Painel Interativo com Gráficos, Filtros e Tabela */}
      <BibliotecaEmpresasClient documentos={catalogo.itens} />

      {/* Rodapé Metodológico */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2">
        <p>
          <strong>Metodologia e Diretrizes:</strong> Os relatórios indexados seguem os padrões de transparência da Comissão de Valores Mobiliários (CVM Resolução 59/193), 
          Securities and Exchange Commission (SEC Form 10-K / 20-F), Global Reporting Initiative (GRI Standards) e Task Force on Climate-related Financial Disclosures (TCFD).
        </p>
        <p>
          <strong>Armazenamento e Espelhamento:</strong> Os arquivos armazenados no bucket R2 do Controle Popular têm finalidade exclusiva de preservação da memória cívica e auditoria cidadã, 
          resguardados os direitos de autoria e publicação original dos respectivos emissores.
        </p>
      </footer>
    </div>
  );
}
