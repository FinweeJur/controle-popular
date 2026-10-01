/**
 * @file apps/web/app/internacional/orcamentos/page.tsx
 * @description Página cívica de análise dos 7 Orçamentos Estratégicos:
 * Militar, Inteligência, Econômico, Tecnológico, Hídrico, Energético e Climático
 * de Estados Unidos (EUA), Canadá e Europa (União Europeia, Reino Unido, Alemanha, França e Itália).
 *
 * Papel no portal:
 * Apresenta a radiografia orçamentária do poder global, comparando como as potências
 * do hemisfério norte alocam trilhões de dólares em poder bélico e espionagem versus
 * transição ecológica, segurança hídrica e pesquisa científica, e como essas escolhas
 * impactam diretamente o Brasil e o Sul Global.
 *
 * Conformidade com AGENTS.md:
 * - § 5.1: Importa agregados leves (COBERTURA_ORCAMENTOS) para SSR sem inflação.
 * - § 5.9: Comentários obrigatórios de arquivo e funções em português direto.
 * - § 5.10: Descrição da página com piso mínimo text-sm (14px) e ResumoExpandivel.
 * - § 8: Regra das Seis Qualidades do Controle Popular.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Eye,
  TrendingUp,
  Cpu,
  Leaf,
  Globe,
  Coins,
} from "lucide-react";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import FooterGlobal from "@/app/components/FooterGlobal";
import SecaoPaginasRelacionadas, {
  type ItemPaginaRelacionada,
} from "@/app/components/SecaoPaginasRelacionadas";
import {
  COBERTURA_ORCAMENTOS,
  obterTodosOrcamentos,
} from "@/lib/internacional/dados-orcamentos";
import PainelOrcamentosClient from "./PainelOrcamentosClient";

export const metadata: Metadata = {
  title:
    "Orçamentos de EUA, Canadá e Europa: Militar, Inteligência, Economia, Tecnologia, Água, Energia e Clima | Controle Popular",
  description:
    "Auditoria e comparativo cívico dos orçamentos de Defesa, Inteligência, Economia, P&D, Água, Energia e Crise Climática de Estados Unidos, Canadá e Europa com fontes oficiais diretas.",
};

const PAGINAS_RELACIONADAS: ItemPaginaRelacionada[] = [
  {
    href: "/internacional",
    titulo: "Hub Internacional & Multilateral",
    descricao: "Comparativo de IDH, desigualdade de renda, gastos sociais e comércio multilateral.",
    badge: "Multilateral",
    icone: "globo",
  },
  {
    href: "/eua",
    titulo: "Observatório dos Estados Unidos",
    descricao: "Contratos federais, compras governamentais, SEC EDGAR e fundos de investimento.",
    badge: "EUA",
    icone: "empresa",
  },
  {
    href: "/europa",
    titulo: "Conexões Europeias e Transnacionais",
    descricao: "Ações judiciais de Mariana em Londres e Maceió em Roterdã, diretiva EUDR e CSDDD.",
    badge: "Europa",
    icone: "justica",
  },
  {
    href: "/canada",
    titulo: "Observatório do Canadá e Mineração",
    descricao: "Bolsa de Toronto TSX, mineradoras canadenses em Minas e no Pará e ouvidoria CORE.",
    badge: "Canadá",
    icone: "mineracao",
  },
  {
    href: "/empresas/fortunas",
    titulo: "Observatório das 1.000 Maiores Fortunas",
    descricao: "Mapeamento das dinastias e bilionários mundiais, renda mensal e equivalência social.",
    badge: "Riqueza Global",
    icone: "dinheiro",
  },
  {
    href: "/ambiental/crise-climatica",
    titulo: "Observatório da Crise Climática Global",
    descricao: "Emissões do G20, maiores complexos poluidores industriais e metas das NDCs.",
    badge: "Clima",
    icone: "clima",
  },
  {
    href: "/estado-e-economia/orcamento",
    titulo: "Orçamento Público e Fiscalização no Brasil",
    descricao: "Dotações federais, repasses aos municípios, FPM, Fundeb e séries do Banco Central.",
    badge: "Brasil",
    icone: "dinheiro",
  },
];

export default function PaginaOrcamentosComparados() {
  const cob = COBERTURA_ORCAMENTOS;
  const orcamentos = obterTodosOrcamentos();

  const descricaoPagina =
    "Enquanto os países do Sul Global e o Brasil enfrentam pressões severas sobre recursos naturais e descarbonização, as grandes potências do Atlântico Norte (EUA, Canadá e potências europeias) alocam mais de 1,1 trilhão de dólares anuais exclusivamente em poderio militar e redes globais de inteligência. Este painel cívico abre as caixas-pretas dos orçamentos oficiais de Defesa, Espionagem, Fomento Econômico, Pesquisa & Desenvolvimento, Segurança Hídrica, Redes de Energia e Combate à Crise Climática, permitindo a comparação proporcional por jurisdição e o acesso direto aos demonstrativos contábeis de cada agência governamental.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ═══ BREADCRUMB NAVEGACIONAL ═══ */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:underline hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <Link href="/internacional" className="hover:underline hover:text-primary">
          Internacional & Multilateral
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Orçamentos Estratégicos</span>
      </nav>

      {/* ═══ CABEÇALHO DA PÁGINA ═══ */}
      <header className="mb-8 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary inline-flex items-center gap-1.5">
            <Globe size={14} aria-hidden="true" />
            <span>Auditoria Orçamentária Global</span>
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs text-muted">
            EUA · Canadá · Europa (UE, UK, DE, FR, IT)
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs text-muted font-mono">
            {cob.totalRegistros} dotações oficiais
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
          Orçamentos Estratégicos: EUA, Canadá e Europa
        </h1>

        {/* Resumo com controle "Ver + Texto" para não empurrar os dados (Regra § 5.10) */}
        <ResumoExpandivel texto={descricaoPagina} className="text-muted max-w-5xl" />
      </header>

      {/* ═══ CARTÕES DE TOPO COM AGREGADOS MEDIDOS (REGRA 4 DAS SEIS QUALIDADES) ═══ */}
      <section aria-labelledby="titulo-cartoes" className="mb-10 space-y-4">
        <h2 id="titulo-cartoes" className="sr-only">
          Indicadores Orçamentários Consolidados
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Militar & Defesa */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Poder Militar
              </span>
              <div className="rounded-lg bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                <Shield size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground font-mono">
              US$ {cob.somaMilitarUsdBi.toFixed(1)} bi
            </div>
            <p className="text-xs text-muted leading-relaxed">
              EUA (US$ 842 bi), Reino Unido, Alemanha, França, Itália e Canadá.
            </p>
          </div>

          {/* Card 2: Inteligência & Espionagem */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Inteligência & Sinais
              </span>
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                <Eye size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground font-mono">
              US$ {cob.somaInteligenciaUsdBi.toFixed(1)} bi
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Programas secretos NIP/MIP dos EUA, Five Eyes (CSIS Canadá) e GCHQ britânico.
            </p>
          </div>

          {/* Card 3: Tecnologia, P&D & Inovação */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Tecnologia & P&D
              </span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
                <Cpu size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground font-mono">
              US$ {cob.somaTecnologiaUsdBi.toFixed(1)} bi
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Horizon Europe (€ 95,5 bi), CHIPS Act (EUA) e NRC do Canadá.
            </p>
          </div>

          {/* Card 4: Clima & Transição Ecológica */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Crise Climática
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Leaf size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-foreground font-mono">
              US$ {cob.somaClimaUsdBi.toFixed(1)} bi
            </div>
            <p className="text-xs text-muted leading-relaxed">
              European Green Deal, créditos tributários do IRA (EUA) e ERP 2030 (Canadá).
            </p>
          </div>
        </div>

        {/* Nota Metodológica de Desproporção Bélica */}
        <div className="rounded-2xl border border-border/80 bg-surface-2 p-4 text-xs text-muted flex items-start gap-3 shadow-2xs">
          <Coins size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Desproporção orçamentária comprovada:</strong> Nos Estados Unidos, o orçamento
            militar oficial (US$ 842 bilhões) é <strong>{cob.razaoMilitarVsClimaEua} vezes maior</strong> do
            que todo o orçamento federal destinado ao combate direto à crise climática (US$ 46,5 bilhões),
            evidenciando onde residem as prioridades geopolíticas reais dos recursos públicos do hemisfério norte.
          </p>
        </div>
      </section>

      {/* ═══ TABELA INTERATIVA COM AS SEIS QUALIDADES ═══ */}
      <section aria-labelledby="titulo-tabela" className="mb-12">
        <h2 id="titulo-tabela" className="sr-only">
          Tabela Auditável das Dotações Orçamentárias
        </h2>
        <PainelOrcamentosClient orcamentos={orcamentos} />
      </section>

      {/* ═══ SEÇÃO DE PÁGINAS RELACIONADAS ═══ */}
      <SecaoPaginasRelacionadas
        titulo="Explorar Conexões Cívicas e Transnacionais"
        subtitulo="Navegue entre os observatórios internacionais, fluxos de capitais, grandes fortunas e crise climática."
        paginas={PAGINAS_RELACIONADAS}
        className="mb-12"
      />

      {/* ═══ RODAPÉ GLOBAL ═══ */}
      <FooterGlobal />
    </div>
  );
}
