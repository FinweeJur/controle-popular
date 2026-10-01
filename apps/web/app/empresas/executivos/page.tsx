/**
 * @file apps/web/app/empresas/executivos/page.tsx
 * @description Página do Observatório Cívico de Executivos, CEOs e Conselhos Corporativos (/empresas/executivos).
 *
 * Papel no portal:
 * 1. Apresenta o mapeamento cívico dos principais diretores executivos estatutários, presidentes de conselhos
 *    de administração e membros de comitês de auditoria das maiores empresas e fundos atuantes no Brasil.
 * 2. Disponibiliza busca em tempo real, facetas por órgão e empresa, ordenação multidimensional,
 *    identificação de diretorias entrelaçadas (interlocking directorates) e exportação em múltiplos formatos.
 * 3. Segue rigorosamente o Padrão das Seis Qualidades e as regras de acessibilidade e LGPD do Controle Popular.
 *
 * Fontes oficiais primárias:
 * - CVM (Comissão de Valores Mobiliários): Formulários de Referência (FRE Itens 8, 12 e 13) e IAN/DFP.
 * - SEC (Securities and Exchange Commission): Relatórios Form 20-F, Form 10-K e Proxy Statements (DEF 14A).
 * - SEDAR+ (Canadá): Circulars de Acionistas e Informações de Governança.
 * - Companies House (Reino Unido), CMVM (Portugal) e BaFin (Alemanha).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { obterExecutivosConselhos } from "@/lib/server-only/dados-executivos";
import { COBERTURA_EXECUTIVOS } from "@/lib/empresas/dados-executivos";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import PainelExecutivosClient from "./PainelExecutivosClient";
import SecaoPaginasRelacionadas from "@/app/components/SecaoPaginasRelacionadas";

export const metadata: Metadata = {
  title: "Diretores, CEOs e Conselheiros das Grandes Empresas — Controle Popular",
  description:
    "Mapeamento cívico de executivos estatutários, conselhos de administração e comitês de auditoria das 36 maiores empresas e fundos globais. Análise de governança corporativa, remunerações e diretorias entrelaçadas.",
};

export default function ExecutivosEmpresasPage() {
  const executivos = obterExecutivosConselhos();

  const textoDescricao =
    `Vigilância cidadã sobre a liderança corporativa e a governança das ${COBERTURA_EXECUTIVOS.totalEmpresas} maiores corporações e fundos atuantes no Brasil e no mundo. ` +
    `Consulte diretores-presidentes (CEOs), presidentes de conselhos de administração e comitês de auditoria regulatórios com dados extraídos diretamente ` +
    `dos formulários de referência da CVM, registros da SEC (EUA), SEDAR+ (Canadá) e Companies House (Reino Unido). ` +
    `Identifique teias de poder e conselhos entrelaçados (interlocking directorates) para fiscalizar conflitos de interesse, concentração econômica e impactos socioambientais.`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-8">
      {/* Navegação e Trilha de Pão (Breadcrumbs) */}
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
        · <span className="text-foreground font-semibold">Executivos & Conselhos</span>
      </nav>

      {/* Cabeçalho da Seção */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-2xs">
          <span>🏛️ Governança Corporativa & Controle Cívico</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Executivos, CEOs e Conselhos Corporativos
        </h1>

        {/* Resumo com controle 'Ver + Texto' (Regra § 5.10: mínimo text-sm / 14px) */}
        <div className="max-w-4xl text-muted">
          <ResumoExpandivel texto={textoDescricao} />
        </div>

        {/* Links rápidos para acervos complementares */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs"
          >
            <span>🏢 Observatório de 130 Grandes Empresas</span>
            <span>→</span>
          </Link>
          <Link
            href="/empresas/documentos"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs"
          >
            <span>📚 Biblioteca de Relatórios ESG & Financeiros</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* Painel Interativo no Padrão das Seis Qualidades */}
      <PainelExecutivosClient executivos={executivos} />

      {/* Páginas Relacionadas e Cruzamentos Cívicos */}
      <div className="mt-12">
        <SecaoPaginasRelacionadas
          titulo="Investigações & Governança Relacionadas"
          subtitulo="Cruze a liderança corporativa com as holdings acionárias, fortunas mundiais e concessões públicas."
          paginas={[
            {
              href: "/empresas/conglomerados",
              titulo: "Monopólios e Redes de Controle",
              descricao: "Grafo dos fundos acionários comuns e cartéis que nomeiam e controlam os conselhos de administração.",
              badge: "Holdings",
              icone: "rede",
            },
            {
              href: "/empresas/fortunas",
              titulo: "1.000 Maiores Fortunas Mundiais",
              descricao: "As dinastias familiares e bilionários beneficiários diretos dos dividendos e remunerações executivas.",
              badge: "Fortunas",
              icone: "dinheiro",
            },
            {
              href: "/empresas",
              titulo: "Observatório de Grandes Empresas",
              descricao: "Monitoramento de 130 corporações: cotações na B3/NYSE, contratos públicos e autuações do IBAMA.",
              badge: "Empresas",
              icone: "empresa",
            },
            {
              href: "/canada/mineracao",
              titulo: "Mineradoras Canadenses no Brasil",
              descricao: "Executivos e conselheiros das mineradoras listadas na TSX que operam no território nacional.",
              badge: "Mineração",
              icone: "mineracao",
            },
            {
              href: "/ambiental/conflitos-globais",
              titulo: "Conflitos Socioambientais Globais",
              descricao: "Ações judiciais e denúncias internacionais envolvendo corporações e suas diretorias estatutárias.",
              badge: "EJAtlas",
              icone: "justica",
            },
            {
              href: "/funcaosocialterra/mapa",
              titulo: "Globo 3D de Sobreposições Territoriais",
              descricao: "Visualização tridimensional das áreas de extração e polígonos concedidos às companhias.",
              badge: "Globo 3D",
              icone: "globo",
            },
          ]}
        />
      </div>

      {/* Rodapé Metodológico e Conformidade LGPD */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2">
        <p>
          <strong>Fontes Regulatórias Oficiais:</strong> Comissão de Valores Mobiliários (CVM - Formulários de Referência Resolução CVM 59), 
          Securities and Exchange Commission (SEC Form 20-F e 10-K), Canadian Securities Administrators (SEDAR+), 
          Companies House (Reino Unido), Comissão do Mercado de Valores Mobiliários (CMVM Portugal) e BaFin (Alemanha).
        </p>
        <p>
          <strong>Conformidade e Proteção de Dados (LGPD):</strong> Todos os registros correspondem estritamente a pessoas públicas 
          ocupantes de cargos estatutários e regulatórios declarados em relatórios corporativos públicos oficiais. O Controle Popular 
          não coleta nem publica números de documentos civis pessoais (CPF/RG), endereços residenciais ou dados privados.
        </p>
        <p>
          <strong>Interlocking Directorates:</strong> A identificação de conselheiros e diretores com cargos em mais de uma empresa monitorada 
          tem objetivo estritamente cívico, analítico e jornalístico de transparência sobre estruturas de governança e mercado, 
          não constituindo imputação de ilicitude societária per se.
        </p>
      </footer>
    </div>
  );
}
