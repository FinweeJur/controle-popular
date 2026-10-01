/**
 * @file apps/web/app/empresas/executivos/page.tsx
 * @description PÃ¡gina do ObservatÃ³rio CÃ­vico de Executivos, CEOs e Conselhos Corporativos (/empresas/executivos).
 *
 * Papel no portal:
 * 1. Apresenta o mapeamento cÃ­vico dos principais diretores executivos estatutÃ¡rios, presidentes de conselhos
 *    de administraÃ§Ã£o e membros de comitÃªs de auditoria das maiores empresas e fundos atuantes no Brasil.
 * 2. Disponibiliza busca em tempo real, facetas por Ã³rgÃ£o e empresa, ordenaÃ§Ã£o multidimensional,
 *    identificaÃ§Ã£o de diretorias entrelaÃ§adas (interlocking directorates) e exportaÃ§Ã£o em mÃºltiplos formatos.
 * 3. Segue rigorosamente o PadrÃ£o das Seis Qualidades e as regras de acessibilidade e LGPD do Controle Popular.
 *
 * Fontes oficiais primÃ¡rias:
 * - CVM (ComissÃ£o de Valores MobiliÃ¡rios): FormulÃ¡rios de ReferÃªncia (FRE Itens 8, 12 e 13) e IAN/DFP.
 * - SEC (Securities and Exchange Commission): RelatÃ³rios Form 20-F, Form 10-K e Proxy Statements (DEF 14A).
 * - SEDAR+ (CanadÃ¡): Circulars de Acionistas e InformaÃ§Ãµes de GovernanÃ§a.
 * - Companies House (Reino Unido), CMVM (Portugal) e BaFin (Alemanha).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { obterExecutivosConselhos } from "@/lib/server-only/dados-executivos";
import { COBERTURA_EXECUTIVOS } from "@/lib/empresas/dados-executivos";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import PainelExecutivosClient from "./PainelExecutivosClient";

export const metadata: Metadata = {
  title: "Diretores, CEOs e Conselheiros das Grandes Empresas â€” Controle Popular",
  description:
    "Mapeamento cÃ­vico de executivos estatutÃ¡rios, conselhos de administraÃ§Ã£o e comitÃªs de auditoria das 36 maiores empresas e fundos globais. AnÃ¡lise de governanÃ§a corporativa, remuneraÃ§Ãµes e diretorias entrelaÃ§adas.",
};

export default function ExecutivosEmpresasPage() {
  const executivos = obterExecutivosConselhos();

  const textoDescricao =
    `VigilÃ¢ncia cidadÃ£ sobre a lideranÃ§a corporativa e a governanÃ§a das ${COBERTURA_EXECUTIVOS.totalEmpresas} maiores corporaÃ§Ãµes e fundos atuantes no Brasil e no mundo. ` +
    `Consulte diretores-presidentes (CEOs), presidentes de conselhos de administraÃ§Ã£o e comitÃªs de auditoria regulatÃ³rios com dados extraÃ­dos diretamente ` +
    `dos formulÃ¡rios de referÃªncia da CVM, registros da SEC (EUA), SEDAR+ (CanadÃ¡) e Companies House (Reino Unido). ` +
    `Identifique teias de poder e conselhos entrelaÃ§ados (interlocking directorates) para fiscalizar conflitos de interesse, concentraÃ§Ã£o econÃ´mica e impactos socioambientais.`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-8">
      {/* NavegaÃ§Ã£o e Trilha de PÃ£o (Breadcrumbs) */}
      <nav aria-label="Trilha de navegaÃ§Ã£o" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          InÃ­cio
        </Link>{" "}
        Â·{" "}
        <Link href="/estado-e-economia" className="hover:text-primary transition">
          Estado & Economia
        </Link>{" "}
        Â·{" "}
        <Link href="/empresas" className="hover:text-primary transition">
          Grandes Empresas & Fundos
        </Link>{" "}
        Â· <span className="text-foreground font-semibold">Executivos & Conselhos</span>
      </nav>

      {/* CabeÃ§alho da SeÃ§Ã£o */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-2xs">
          <span>ðŸ›ï¸ GovernanÃ§a Corporativa & Controle CÃ­vico</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Executivos, CEOs e Conselhos Corporativos
        </h1>

        {/* Resumo com controle 'Ver + Texto' (Regra Â§ 5.10: mÃ­nimo text-sm / 14px) */}
        <div className="max-w-4xl text-muted">
          <ResumoExpandivel texto={textoDescricao} />
        </div>

        {/* Links rÃ¡pidos para acervos complementares */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs"
          >
            <span>ðŸ¢ ObservatÃ³rio de 130 Grandes Empresas</span>
            <span>â†’</span>
          </Link>
          <Link
            href="/empresas/documentos"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition shadow-2xs"
          >
            <span>ðŸ“š Biblioteca de RelatÃ³rios ESG & Financeiros</span>
            <span>â†’</span>
          </Link>
        </div>
      </header>

      {/* Painel Interativo no PadrÃ£o das Seis Qualidades */}
      <PainelExecutivosClient executivos={executivos} />

      {/* RodapÃ© MetodolÃ³gico e Conformidade LGPD */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2">
        <p>
          <strong>Fontes RegulatÃ³rias Oficiais:</strong> ComissÃ£o de Valores MobiliÃ¡rios (CVM - FormulÃ¡rios de ReferÃªncia ResoluÃ§Ã£o CVM 59), 
          Securities and Exchange Commission (SEC Form 20-F e 10-K), Canadian Securities Administrators (SEDAR+), 
          Companies House (Reino Unido), ComissÃ£o do Mercado de Valores MobiliÃ¡rios (CMVM Portugal) e BaFin (Alemanha).
        </p>
        <p>
          <strong>Conformidade e ProteÃ§Ã£o de Dados (LGPD):</strong> Todos os registros correspondem estritamente a pessoas pÃºblicas 
          ocupantes de cargos estatutÃ¡rios e regulatÃ³rios declarados em relatÃ³rios corporativos pÃºblicos oficiais. O Controle Popular 
          nÃ£o coleta nem publica nÃºmeros de documentos civis pessoais (CPF/RG), endereÃ§os residenciais ou dados privados.
        </p>
        <p>
          <strong>Interlocking Directorates:</strong> A identificaÃ§Ã£o de conselheiros e diretores com cargos em mais de uma empresa monitorada 
          tem objetivo estritamente cÃ­vico, analÃ­tico e jornalÃ­stico de transparÃªncia sobre estruturas de governanÃ§a e mercado, 
          nÃ£o constituindo imputaÃ§Ã£o de ilicitude societÃ¡ria per se.
        </p>
      </footer>
    </div>
  );
}
