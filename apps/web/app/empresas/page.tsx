import type { Metadata } from "next";
import Link from "next/link";
import { listarTodasEntidades } from "@/lib/empresas/entidades-dados";
import EmpresasClient from "./EmpresasClient";
import SecaoPaginasRelacionadas from "@/app/components/SecaoPaginasRelacionadas";

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
        <div className="pt-2 flex flex-wrap gap-2.5">
          <Link
            href="/empresas/fortunas"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition shadow-2xs"
          >
            <span>💰 1.000 Maiores Fortunas</span>
            <span>→</span>
          </Link>
          <Link
            href="/empresas/conglomerados"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition shadow-2xs"
          >
            <span>🕸️ Monopólios & Holdings</span>
            <span>→</span>
          </Link>
          <Link
            href="/empresas/executivos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition shadow-2xs"
          >
            <span>👔 CEOs & Conselhos</span>
            <span>→</span>
          </Link>
          <Link
            href="/empresas/documentos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/20 transition shadow-2xs"
          >
            <span>📚 520 Relatórios ESG & CVM</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* Painel Interativo com Gráficos, Filtros e Tabela */}
      <EmpresasClient entidades={entidades} />

      {/* Seção de Páginas Relacionadas e Cruzamentos Cívicos */}
      <SecaoPaginasRelacionadas
        titulo="Investigações & Conexões Corporativas"
        subtitulo="Cruze o poder econômico das empresas com as fortunas globais, governança e impactos no território."
        paginas={[
          {
            href: "/empresas/fortunas",
            titulo: "1.000 Maiores Fortunas Mundiais",
            descricao: "Mapeamento das dinastias e bilionários que controlam as corporações e fundos globais.",
            badge: "Fortunas",
            icone: "dinheiro",
          },
          {
            href: "/empresas/conglomerados",
            titulo: "Monopólios e Redes de Controle",
            descricao: "Grafo interativo das holdings, fundos Big Three e cartéis de grãos e mineração.",
            badge: "Holdings",
            icone: "rede",
          },
          {
            href: "/empresas/executivos",
            titulo: "CEOs e Conselhos Corporativos",
            descricao: "Os principais diretores e conselheiros estatutários e diretorias entrelaçadas.",
            badge: "Governança",
            icone: "empresa",
          },
          {
            href: "/canada/mineracao",
            titulo: "Mineradoras Canadenses no Brasil",
            descricao: "Corporações listadas na TSX com concessões de lavra e barragens de rejeitos na ANM.",
            badge: "Mineração",
            icone: "mineracao",
          },
          {
            href: "/ambiental/barragens-globais",
            titulo: "Grandes Barragens Mundiais",
            descricao: "Monitoramento das barragens de rejeitos operadas pelas grandes mineradoras privadas.",
            badge: "Barragens",
            icone: "barragem",
          },
          {
            href: "/ambiental/crise-climatica",
            titulo: "Observatório da Crise Climática",
            descricao: "As maiores fontes de emissão de gases de efeito estufa das petrolíferas e indústrias.",
            badge: "Clima",
            icone: "clima",
          },
        ]}
      />

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
