/**
 * @file apps/web/app/empresas/fortunas/page.tsx
 * @description Página do Observatório das 1.000 Maiores Fortunas Mundiais.
 *
 * Papel no portal:
 * Sistematiza e expõe a extrema concentração de riqueza global no Padrão das Seis Qualidades.
 * Mapeia indivíduos e dinastias familiares por país e setor de atividade, com cálculo auditável
 * de rendimento mensal aproximado e equivalência direta com o sustento de pessoas vivendo na
 * linha de extrema pobreza internacional do Banco Mundial (US$ 2,15/dia).
 *
 * Fontes primárias consultadas:
 * - World Inequality Database (WID.world)
 * - SEC EDGAR (EUA) e CVM (Brasil)
 * - Bloomberg Billionaires Index e Forbes Wealth Tracking
 * - Banco Mundial (Global Poverty Indicators)
 *
 * Conformidade editorial:
 * - Respeito integral à regra 5.10 de acessibilidade: descrição da página com piso `text-sm`.
 * - Dupla verificação e explicitação metodológica clara do cálculo de rendimento.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { obterFortunasMundiais, COBERTURA_FORTUNAS } from "@/lib/empresas/dados-fortunas";
import PainelFortunasClient from "./PainelFortunasClient";
import SecaoPaginasRelacionadas from "@/app/components/SecaoPaginasRelacionadas";

export const metadata: Metadata = {
  title: "1.000 Maiores Fortunas Mundiais — Concentração de Riqueza e Equivalência Social",
  description:
    "Mapeamento auditável das 1.000 maiores fortunas do planeta por pessoa e dinastias familiares. Setores de atuação, rendimento mensal aproximado e equivalência com a linha de extrema pobreza do Banco Mundial.",
  alternates: {
    canonical: "https://www.controlepopular.com.br/empresas/fortunas",
  },
  openGraph: {
    title: "1.000 Maiores Fortunas Mundiais — Controle Popular",
    description:
      "Auditoria cívica da extrema concentração global de capital: US$ 13,39 trilhões acumulados entre 1.000 indivíduos e famílias, com cruzamento de monopólios e equivalência social de renda.",
    url: "https://www.controlepopular.com.br/empresas/fortunas",
    siteName: "Controle Popular",
    type: "website",
  },
};

export default function PaginaFortunasMundiais() {
  const fortunas = obterFortunasMundiais();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Navegação Estrutural (Breadcrumb) */}
      <nav aria-label="Navegação estrutural" className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-foreground transition">
          Início
        </Link>
        <span>/</span>
        <Link href="/empresas" className="hover:text-foreground transition">
          Empresas & Economia
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium" aria-current="page">
          1.000 Maiores Fortunas Mundiais
        </span>
      </nav>

      {/* Cabeçalho Oficial da Página */}
      <header className="space-y-3 border-b border-border/40 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span>Economia & Desigualdade Global</span>
          <span>•</span>
          <span>Dados Atualizados em {COBERTURA_FORTUNAS.dataAtualizacao}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-foreground">
          1.000 Maiores Fortunas Mundiais
        </h1>

        {/* Descrição conforme regra 5.10 de acessibilidade (piso text-sm) */}
        <p className="text-sm sm:text-base text-muted max-w-4xl leading-relaxed">
          Catálogo auditável dos maiores patrimônios privados do mundo entre indivíduos e dinastias familiares.
          O acervo cruza os setores econômicos de atuação com uma estimativa de rendimento de capital
          (taxa anual de 4,5% a.a.) e evidencia o abismo da desigualdade: quantas pessoas na linha internacional
          de extrema pobreza do Banco Mundial (US$ 2,15/dia ou ~US$ 64,50/mês) poderiam ser sustentadas pelo ganho
          mensal de cada fortuna mapeada.
        </p>
      </header>

      {/* Componente Interativo no Padrão das Seis Qualidades */}
      <main>
        <PainelFortunasClient fortunas={fortunas} />
      </main>

      {/* Páginas Relacionadas e Cruzamentos Cívicos */}
      <div className="mt-12">
        <SecaoPaginasRelacionadas
          titulo="Investigações & Conexões Econômicas"
          subtitulo="Cruze a extrema riqueza com os monopólios, governança corporativa e a crise climática."
          paginas={[
            {
              href: "/empresas/conglomerados",
              titulo: "Monopólios e Redes de Controle",
              descricao: "A teia societária dos Big Three (BlackRock, Vanguard) e dos cartéis do agronegócio e mineração.",
              badge: "Holdings",
              icone: "rede",
            },
            {
              href: "/empresas/executivos",
              titulo: "CEOs e Conselhos Corporativos",
              descricao: "Os executivos estatutários e presidentes de conselho que administram essas fortunas.",
              badge: "Governança",
              icone: "empresa",
            },
            {
              href: "/empresas",
              titulo: "Observatório de Grandes Empresas",
              descricao: "Acompanhamento cívico de 130 corporações com contratos públicos e multas ambientais.",
              badge: "Corporativo",
              icone: "dinheiro",
            },
            {
              href: "/ambiental/crise-climatica",
              titulo: "Observatório da Crise Climática",
              descricao: "A pegada de carbono e as emissões de quem controla o capital fóssil e as termelétricas.",
              badge: "Clima",
              icone: "clima",
            },
            {
              href: "/ambiental/conflitos-globais",
              titulo: "Conflitos Socioambientais Globais",
              descricao: "Territórios e comunidades impactadas pelas operações lucrativas das grandes holdings.",
              badge: "EJAtlas",
              icone: "justica",
            },
            {
              href: "/funcaosocialterra/mapa",
              titulo: "Globo 3D de Sobreposições Territoriais",
              descricao: "Visualização tridimensional das concessões de mineração e terras tradicionais.",
              badge: "Globo 3D",
              icone: "globo",
            },
          ]}
        />
      </div>

      {/* Nota Metodológica de Transparência */}
      <footer className="rounded-2xl border border-border bg-surface-2/40 p-5 text-xs text-muted space-y-2 mt-8">
        <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
          Nota Metodológica e Compromisso Editorial (AGENTS.md § 7)
        </h3>
        <p className="leading-relaxed">
          Os patrimônios líquidos refletem dados regulatórios públicos (participações acionárias declaradas à SEC, CVM e
          bolsas internacionais) combinados a estimativas patrimoniais consolidadas do World Inequality Lab (WID.world),
          Bloomberg e Forbes. O ganho mensal constitui estimativa prudencial baseada no rendimento real médio de portfólios
          diversificados de grande porte (4,5% ao ano sobre o patrimônio acumulado). A equivalência social utiliza a Linha
          Internacional de Extrema Pobreza definida pelo Banco Mundial (US$ 2,15 por dia por pessoa, calculada a 30 dias = US$ 64,50/mês).
          A conversão para Reais adota taxa PTAX de referência de R$ 5,50 por dólar.
        </p>
      </footer>
    </div>
  );
}
