/**
 * @file apps/web/app/america-latina/page.tsx
 * @description Hub América Latina & Mineração Transnacional (/america-latina).
 *
 * Papel no portal:
 * Observatório cívico de mineração transnacional conectando 51 instalações estratégicas
 * (megaminas, projetos de lítio, complexos metalúrgicos, portos e sedes corporativas)
 * em 9 países da América Latina (Brasil, Chile, Peru, Argentina, México, Colômbia, Bolívia,
 * Equador e Panamá).
 *
 * Integração com o Globo 3D Terras:
 * Todas as 51 instalações estão geolocalizadas na camada WGS84
 * `sedes-instalacoes-mineradoras-latam` com visualização tridimensional interativa.
 *
 * Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8):
 * - Links canônicos para órgãos reguladores (ANM, SERNAGEOMIN, INGEMMET, SEGEMAR, SEMARNAT, etc.).
 * - Busca multifacetada sem acento, ordenação bidirecional e filtros por país/mineral/tipo.
 * - Cartões de topo com contagens datadas de 30/09/2026 via `COBERTURA_AMERICA_LATINA`.
 * - Assistente cívico Seu Nonô com frases curtas de até 13 palavras.
 * - Exportação de planilha CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_AMERICA_LATINA,
  obterInstalacoesAmericaLatina,
  obterMineradorasAmericaLatina,
} from "@/lib/internacional/dados-america-latina";
import PainelAmericaLatina from "./PainelAmericaLatina";
import FooterGlobal from "@/app/components/FooterGlobal";
import { Globe2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "América Latina & Mineração Transnacional: Sedes, Megaminas & Lítio | Controle Popular",
  description:
    "Observatório de 51 instalações estratégicas de mineração em 9 países latino-americanos (Brasil, Chile, Peru, Argentina, México, Colômbia, Bolívia, Equador, Panamá). Georreferenciamento auditado e integrado ao Globo 3D Terras.",
};

export default function PaginaAmericaLatina() {
  const instalacoes = obterInstalacoesAmericaLatina();
  const mineradoras = obterMineradorasAmericaLatina();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link
          href="/internacional"
          className="hover:underline hover:text-primary"
        >
          Internacional
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">
          América Latina & Mineração Transnacional (/america-latina)
        </span>
      </nav>

      {/* CABEÇALHO DO HUB AMÉRICA LATINA */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            🌎 Observatório América Latina
          </span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            ⚡ Triângulo do Lítio & Transição Energética
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🏔️ Megaminas Andinas de Cobre & Ouro
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Mineração Transnacional na América Latina
        </h1>

        <p className="mt-3 text-base text-text-soft max-w-4xl leading-relaxed">
          Mapeamento geoespacial e regulatório de 51 instalações estratégicas de
          mineração em 9 países da América Latina. Cruzamento de megaminas de
          cobre, lítio, ferro e ouro com dados de bacias hidrográficas, portos
          exportadores e sedes corporativas globais.
        </p>

        {/* CHAMADA EM DESTAQUE PARA O MAPA 3D TERRAS */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">
                Visualização Interativa no Globo 3D Terras
              </h2>
              <p className="text-xs text-text-soft">
                Explore as 51 sedes e instalações sobrepostas a bacias, terras
                indígenas e alertas socioambientais.
              </p>
            </div>
          </div>
          <Link
            href="/terras/globo?camada=sedes-instalacoes-mineradoras-latam"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-contrast shadow transition hover:opacity-90 whitespace-nowrap"
          >
            Abrir Camada no Globo 3D
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* PAINEL INTERATIVO CLIENT-SIDE */}
      <main>
        <PainelAmericaLatina
          instalacoesIniciais={instalacoes}
          mineradorasIniciais={mineradoras}
          coberturaEstatica={COBERTURA_AMERICA_LATINA}
        />
      </main>

      {/* RODAPÉ DO PORTAL */}
      <FooterGlobal />
    </div>
  );
}
