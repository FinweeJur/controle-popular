/**
 * @file apps/web/app/recursos/estados/page.tsx
 * @description Página cívica de transparência e auditoria dos Recursos Públicos dos 27 Estados Brasileiros:
 * 1. Outorgas de Água (ANA/SNIRH e DAEE/IGAM/INEA e congêneres)
 * 2. Energia Elétrica e Assimetria Tarifária (ANEEL e CCEE)
 * 3. Gasto de Combustível e Frotas Governamentais (PNCP e ANP)
 * 4. Parcerias Público-Privadas & Concessões de Infraestrutura (BNDES Hub e Governos Estaduais)
 * 5. Emendas Parlamentares Estaduais e Transferências Especiais PIX (27 Assembleias Legislativas)
 *
 * Papel no portal:
 * Centraliza e cruza pela primeira vez em escala nacional como cada estado apropria seus recursos naturais,
 * concede ativos estratégicos à iniciativa privada e distribui verbas parlamentares impositivas.
 *
 * Conformidade com AGENTS.md:
 * - § 5.1: Não serializa coleções pesadas em props desnecessárias; importa agregados no servidor.
 * - § 5.2: Ausência absoluta de dados pessoais de cidadãos comuns (zero CPFs).
 * - § 5.9: Comentários detalhados de porquê e padrão editorial cívico.
 * - § 5.10: Descrição da página com piso mínimo text-sm (14px) e ResumoExpandivel.
 * - § 8: Regra das Seis Qualidades do Controle Popular.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Zap,
  Fuel,
  Handshake,
  Landmark,
  Scale,
  Layers,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import FooterGlobal from "@/app/components/FooterGlobal";
import SecaoPaginasRelacionadas, {
  type ItemPaginaRelacionada,
} from "@/app/components/SecaoPaginasRelacionadas";
import {
  COBERTURA_RECURSOS_27_ESTADOS,
  DADOS_RECURSOS_27_ESTADOS,
} from "@/lib/recursos/dados-recursos-27-estados";
import PainelRecursosEstadosClient from "./PainelRecursosEstadosClient";

export const metadata: Metadata = {
  title:
    "Recursos Públicos dos 27 Estados: Água, Energia, Combustível, PPPs e Emendas — Controle Popular",
  description:
    "Mapeamento oficial e independente dos 27 estados brasileiros: 751 mil outorgas de água, assimetria tarifária da energia, gastos públicos com combustível, carteira de PPPs e concessões e destino das emendas parlamentares nas Assembleias Legislativas.",
  openGraph: {
    title:
      "Recursos Públicos dos 27 Estados: Água, Energia, Combustível, PPPs e Emendas — Controle Popular",
    description:
      "Radiografia cívica dos 27 estados brasileiros nas 5 vertentes estratégicas de recursos e gastos públicos com dados da ANA, ANEEL, PNCP, BNDES e Assembleias Legislativas.",
  },
};

const PAGINAS_RELACIONADAS: ItemPaginaRelacionada[] = [
  {
    titulo: "Assembleias Legislativas dos 27 Estados",
    descricao:
      "Acompanhe proposições de lei, deputados estaduais e tramitação legislativa em todas as 27 unidades federativas.",
    href: "/assembleias",
    badge: "Legislativo",
    icone: "justica",
  },
  {
    titulo: "Maiores Consumidores Corporativos (MG & G20)",
    descricao:
      "Ranking dos maiores consumidores de água, eletricidade, combustível e empregos com pegada hídrica e tarifas.",
    href: "/consumo-corporativo",
    badge: "Recursos & Indústria",
    icone: "empresa",
  },
  {
    titulo: "Licenciamento Ambiental & Barragens",
    descricao:
      "Processos de licenciamento, barragens de mineração e TACs fiscalizados pelos órgãos ambientais.",
    href: "/ambiental",
    badge: "Meio Ambiente",
    icone: "barragem",
  },
  {
    titulo: "Orçamentos Estratégicos Globais (EUA, Canadá e Europa)",
    descricao:
      "Comparativo dos gastos militares, de inteligência, tecnologia, água e mitigação climática das superpotências.",
    href: "/internacional/orcamentos",
    badge: "Geopolítica & Clima",
    icone: "clima",
  },
];

export default function RecursosEstadosPage() {
  const cob = COBERTURA_RECURSOS_27_ESTADOS;

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-10"
    >
      {/* 1. Trilha de Navegação (Breadcrumb) */}
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/assembleias" className="hover:text-primary transition">
          Cidades & Estados
        </Link>{" "}
        ·{" "}
        <span className="text-foreground font-semibold">
          Recursos Públicos & Concessões dos 27 Estados
        </span>
      </nav>

      {/* 2. Cabeçalho Principal e Resumo Editorial (Fonte mínima text-sm — Regra §5.10 AGENTS.md) */}
      <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Layers size={14} />
            <span>27 Unidades Federativas</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
            <Droplets size={14} />
            <span>ANA & Órgãos de Águas</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Zap size={14} />
            <span>ANEEL & CCEE</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Handshake size={14} />
            <span>BNDES Hub PPPs</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Landmark size={14} />
            <span>27 Assembleias Estaduais</span>
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Recursos Públicos dos 27 Estados: Água, Energia, Combustível, PPPs e Emendas
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-5xl">
            Uma radiografia cívica e independente sobre como os recursos naturais e o dinheiro público são
            geridos em todas as unidades federativas do Brasil. Cruzamos dados oficiais da Agência Nacional de
            Águas (ANA), da Agência Nacional de Energia Elétrica (ANEEL), do Portal Nacional de Contratações
            Públicas (PNCP), do BNDES e dos portais de transparência das 27 Assembleias Legislativas.
          </p>
        </div>

        {/* Resumo Expandível Editorial (Regra § 5.10 AGENTS.md) */}
        <ResumoExpandivel
          texto="Uma radiografia cívica e independente sobre como os recursos naturais e o dinheiro público são geridos em todas as unidades federativas do Brasil. Cruzamos dados oficiais da Agência Nacional de Águas (ANA), da Agência Nacional de Energia Elétrica (ANEEL), do Portal Nacional de Contratações Públicas (PNCP), do BNDES e dos portais de transparência das 27 Assembleias Legislativas. Entenda como a água outorgada abastece grandes empreendimentos, por que o cidadão comum paga tarifas elétricas até 1,9x mais caras que o mercado livre, quanto custa o combustível da frota estatal, quais concessões foram firmadas e como os deputados distribuem as emendas orçamentárias."
        />

        {/* 3. Cinco Cartões de Topo Medidos e Datados (Qualidade 4 — AGENTS.md § 8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-4 border-t border-border/70">
          {/* Card 1: Água */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-sky-600 dark:text-sky-400">
              <span>💧 Outorgas Água</span>
              <Droplets size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {cob.vazaoTotalM3AnoBilhoes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi m³/ano
            </div>
            <p className="text-[11px] text-muted leading-tight">
              {cob.totalInterferenciasAguaNacional.toLocaleString("pt-BR")} interferências ativas (SNIRH/ANA).
            </p>
          </div>

          {/* Card 2: Energia */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
              <span>⚡ Assimetria Luz</span>
              <Zap size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              {cob.assimetriaTarifariaMediaNacional.toFixed(2).replace(".", ",")}x
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Cidadão paga em média 75% a mais por kWh que a grande indústria.
            </p>
          </div>

          {/* Card 3: Combustível */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-red-600 dark:text-red-400">
              <span>⛽ Frotas & Fóssil</span>
              <Fuel size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              R$ {cob.totalGastoCombustivelPublicoBrlBilhoes.toFixed(1).replace(".", ",")} Bi/ano
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Compras públicas de abastecimento registradas no PNCP e TCEs.
            </p>
          </div>

          {/* Card 4: PPPs */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-purple-600 dark:text-purple-400">
              <span>🤝 PPPs Estaduais</span>
              <Handshake size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              R$ {cob.totalPppsContratadasBrlBilhoes.toFixed(1).replace(".", ",")} Bi
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Investimentos contratados em rodovias, transporte e saneamento.
            </p>
          </div>

          {/* Card 5: Emendas */}
          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
              <span>🏛️ Emendas ALEs</span>
              <Landmark size={15} />
            </div>
            <div className="font-mono text-xl font-extrabold text-foreground">
              R$ {cob.totalEmendasEstaduaisBrlBilhoes.toFixed(1).replace(".", ",")} Bi
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Orçamento impositivo anual votado nas 27 Assembleias Legislativas.
            </p>
          </div>
        </div>
      </header>

      {/* 4. Painel Interativo Client (Busca, Filtros de Região, Abas Temáticas, Tabela e Exportação) */}
      <section aria-labelledby="titulo-painel-interativo">
        <h2 id="titulo-painel-interativo" className="sr-only">
          Painel Interativo de Recursos dos 27 Estados
        </h2>
        <PainelRecursosEstadosClient estadosIniciais={DADOS_RECURSOS_27_ESTADOS} />
      </section>

      {/* 5. Páginas Relacionadas e Contexto Cívico */}
      <SecaoPaginasRelacionadas
        titulo="Outros Acervos e Ferramentas Cívicas"
        subtitulo="Aprofunde a investigação sobre uso de recursos naturais, gastos governamentais e representação popular."
        paginas={PAGINAS_RELACIONADAS}
      />

      {/* 6. Rodapé Global */}
      <FooterGlobal />
    </main>
  );
}
