import type { Metadata } from "next";
import Link from "next/link";
import { COBERTURA_CRISE_CLIMATICA } from "@/lib/clima/dados-crise-climatica";
import { formatNumberBR } from "@/lib/betim/format";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import PainelCriseClimaticaClient from "./PainelCriseClimaticaClient";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * @file apps/web/app/ambiental/crise-climatica/page.tsx
 * @description Página do Acervo Global da Crise Climática do Observatório Nacional Socioambiental (ONSA).
 *
 * Papel no portal:
 * Consolida o monitoramento cívico dos grandes vetores do aquecimento global e seus impactos no Brasil:
 * 1. O balanço de emissões dos países do G20 (Climate TRACE e IPCC AR6);
 * 2. O inventário das 20 maiores instalações industriais poluidoras pontuais do mundo;
 * 3. O registro de anomalias térmicas e desastres climáticos históricos (Copernicus ERA5 e WMO);
 * 4. A análise de ambição das NDCs e intensidade de carbono por setor produtivo (UNFCCC e IEA).
 *
 * Fontes oficiais:
 * - Climate TRACE (Emissões globais e ativos industriais): https://climatetrace.org/
 * - IPCC AR6 WG3 (Mitigação do Clima): https://www.ipcc.ch/report/ar6/wg3/
 * - Copernicus ECMWF (Reanálise Climática ERA5): https://climate.copernicus.eu/
 * - WMO / OMM (State of the Global Climate): https://wmo.int/
 * - UNFCCC (Registry of Nationally Determined Contributions): https://unfccc.int/
 * - Global Energy Monitor (Trackers de Carvão e Petróleo): https://globalenergymonitor.org/
 * - SEEG / Observatório do Clima (Inventário Nacional de Emissões): https://seeg.eco.br/
 *
 * Decisões técnicas e restrições:
 * - Server Component leve que importa a constante COBERTURA_CRISE_CLIMATICA pré-calculada (Regra §8 AGENTS.md).
 * - Descrição da página utiliza ResumoExpandivel em conformidade estrita com a Regra §5.10 de acessibilidade.
 * - Toda a interatividade e visualização vetorial delegada ao PainelCriseClimaticaClient.
 */

export const metadata: Metadata = {
  title:
    "Crise Climática Global — Emissões do G20, Superpoluidores, Copernicus e Metas NDCs | Meio Ambiente (ONSA)",
  description:
    "Painel analítico do Observatório Nacional Socioambiental (ONSA): inventário de emissões do G20 (Climate TRACE/IPCC), as 20 maiores instalações industriais poluidoras mundiais, anomalias extremas Copernicus ECMWF/WMO e metas setoriais das NDCs.",
};

export default function PaginaCriseClimatica() {
  const cob = COBERTURA_CRISE_CLIMATICA;

  const textoDescricao =
    "O painel cívico da emergência climática internacional: enquanto os 20 países e blocos do G20 respondem por mais de 77% das emissões globais de gases de efeito estufa, o ano de 2024 quebrou o recorde histórico com temperatura média global de 1,64°C acima da era pré-industrial, superando o teto referencial do Acordo de Paris. No Brasil, o desmatamento ilegal e o uso da terra concentram quase metade do inventário nacional de 2,32 bilhões de toneladas de CO₂e. Conheça as 20 instalações industriais pontuais que mais poluem no mundo, as anomalias e secas mapeadas pelo Copernicus e WMO, e as metas das NDCs e intensidade de carbono por setor.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO ESTRUTURAL BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted print:hidden"
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
          Crise Climática Global
        </span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2 print:hidden">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Climate TRACE & IPCC AR6
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Copernicus ECMWF & WMO
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Metas NDCs & Acordo de Paris
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            GEM Mega-Instalações Poluidoras
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Crise Climática Global: Emissões, Superpoluidores e Extremos
        </h1>

        {/* DESCRIÇÃO DA PÁGINA (REGRA § 5.10 - NUNCA MENOR QUE text-sm, RESUMO EXPANDÍVEL) */}
        <div className="mt-3 max-w-4xl text-sm text-muted sm:text-base leading-relaxed">
          <ResumoExpandivel texto={textoDescricao} />
        </div>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-xs italic text-muted">
          &ldquo;A crise do clima não é uma tragédia natural abstrata; ela tem donos, chaminés,
          contas bancárias e coordenadas geográficas mensuráveis.&rdquo;
          — Princípio cívico do Observatório Nacional Socioambiental (ONSA)
        </p>
      </header>

      {/* ═══ CARTÕES DE TOPO COM AGREGADOS MEDIDOS (PADRÃO 6 QUALIDADES - ITEM 4) ═══ */}
      <section
        aria-label="Indicadores consolidados da crise climática global"
        className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2"
      >
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Emissões Totais do G20
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {formatNumberBR(Math.round(cob.somaEmissoesG20MtCo2e / 1000))} Gt CO₂e
          </p>
          <span className="mt-1 block text-xs text-muted">
            {cob.participacaoG20GlobalPct}% das emissões antropogênicas mundiais ({cob.totalPaisesG20} potências)
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Brasil no Ranking Global
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatNumberBR(cob.emissaoBrasilMtCo2e)} Mt CO₂e
          </p>
          <span className="mt-1 block text-xs text-muted">
            {cob.posicaoBrasilGlobal}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Anomalia Térmica Recorde
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-rose-600 dark:text-rose-400">
            +1,64°C
          </p>
          <span className="mt-1 block text-xs text-muted">
            Média global do ano civil de 2024 (Copernicus ERA5 / WMO)
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Mega-Instalações Auditadas
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {cob.totalInstalacoesPoluidoras} instalações
          </p>
          <span className="mt-1 block text-xs text-muted">
            {formatNumberBR(cob.somaInstalacoesMapeadasMtCo2e)} Mt CO₂e somadas (top: Secunda CTL 51,5 Mt)
          </span>
        </div>
      </section>

      {/* ═══ TRÊS RESSALVAS DO DADO (CONFORMIDADE AGENTS.MD §7) ═══ */}
      <section
        aria-label="Ressalvas cívicas e metodológicas do acervo climático"
        className="mb-10 rounded-2xl border border-dashed border-border bg-surface-1 p-5 text-xs text-muted leading-relaxed"
      >
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span>⚠️</span> Três ressalvas essenciais que acompanham este levantamento oficial:
        </h3>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <strong>O número vem do dado oficial e de satélites:</strong> As emissões territoriais
            e industriais derivam de medições diretas e inventários do Climate TRACE, IPCC AR6,
            Copernicus ECMWF e SEEG Brasil. Nenhum número foi arbitrado ou extrapolado manualmente.
          </li>
          <li>
            <strong>Justiça climática: Emissão territorial versus emissão per capita:</strong> Enquanto a China
            lidera o volume absoluto (14,3 bilhões de toneladas), países como os Estados Unidos (17,6 t/hab),
            Austrália (20,3 t/hab) e Arábia Saudita (21,6 t/hab) emitem muito mais por habitante,
            refletindo padrões de consumo historicamente desiguais.
          </li>
          <li>
            <strong>O perfil ímpar do Brasil no G20:</strong> Enquanto o Norte Global polui queimando carvão,
            gás e derivados de petróleo na energia e transporte, no Brasil 48% do impacto decorre da
            mudança no uso da terra (desmatamento na Amazônia e no Cerrado) e 27% da agropecuária,
            o que torna o combate ao crime ambiental a ação climática mais urgente do país.
          </li>
        </ul>
      </section>

      {/* ═══ COMPONENTE CLIENTE INTERATIVO (ABAS + BUSCA + FILTROS + GRÁFICOS + CSV + IMPRESSÃO) ═══ */}
      <section aria-label="Painel interativo da crise climática">
        <PainelCriseClimaticaClient />
      </section>

      {/* SEÇÃO RELACIONADA */}
      <div className="mt-12 border-t border-border pt-8 print:hidden">
        <MeioAmbienteRelacionado />
      </div>

      <FooterGlobal />
    </div>
  );
}
