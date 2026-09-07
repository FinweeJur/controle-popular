import type { Metadata } from "next";
import Link from "next/link";
import { listarTodasEntidades } from "@/lib/empresas/entidades-dados";
import EmpresasClient from "./EmpresasClient";

export const metadata: Metadata = {
  title: "Observatório de Grandes Empresas & Fundos de Investimento — Controle Popular",
  description:
    "Monitoramento cívico das 130 maiores empresas e fundos atuantes no Brasil: ações na B3 e NYSE, transparência, ESG, direitos humanos, licenciamentos ambientais, contratos no PNCP e TACs.",
};

export default function EmpresasIndexPage() {
  const entidades = listarTodasEntidades();

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
        · <span className="text-foreground font-semibold">Grandes Empresas & Fundos</span>
      </nav>

      {/* Cabeçalho do Observatório */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>🏛️ Setores Estratégicos & Mercado de Capitais</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Observatório de Grandes Empresas & Fundos
        </h1>
        <p className="max-w-4xl text-sm sm:text-base text-muted leading-relaxed">
          Acompanhamento cívico e vigilância cidadã sobre as 130 maiores corporações e fundos de investimento atuantes no Brasil.
          Cruze cotações na B3 e NYSE com licenciamentos ambientais da FEAM e IBAMA, processos minerários na ANM, 
          contratos públicos no PNCP, auditorias do Tribunal de Contas e TACs do Ministério Público.
        </p>
        <div className="pt-2">
          <Link
            href="/empresas/documentos"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/20 transition shadow-2xs"
          >
            <span>📚 Acessar Biblioteca de Relatórios ESG & Financeiros (520 documentos)</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* Painel Interativo com Gráficos, Filtros e Tabela */}
      <EmpresasClient entidades={entidades} />

      {/* Rodapé Metodológico */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2">
        <p>
          <strong>Fontes Oficiais:</strong> Comissão de Valores Mobiliários (CVM), Portal Nacional de Contratações Públicas (PNCP), 
          Sistema de Gestão de Segurança de Barragens (SIGBM/ANM), FEAM-MG, IBAMA, SEC (EUA) e Ministérios Públicos (MPMG e MPF).
        </p>
        <p>
          O Controle Popular não emite recomendações de investimento. O foco é a fiscalização do cumprimento da legislação brasileira,
          dos direitos humanos, da sustentabilidade ambiental e da destinação de recursos públicos.
        </p>
      </footer>
    </div>
  );
}
