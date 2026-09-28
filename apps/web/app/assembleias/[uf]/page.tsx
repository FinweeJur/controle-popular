/**
 * Página dinâmica de detalhe da Assembleia Legislativa Estadual.
 *
 * Papel no portal:
 * Reproduz com máxima fidelidade a lógica consagrada da página da Câmara de Betim
 * (AGENTS.md § 7 e § 8) para cada um dos 26 estados brasileiros e Distrito Federal.
 *
 * Fontes oficiais:
 * - Portais oficiais de transparência, dados abertos e SAPL/ALE de cada estado.
 * - Art. 27 da Constituição Federal de 1988 (regras de proporcionalidade de cadeiras).
 *
 * Seções estruturadas:
 * 1. Indicadores de topo: Total de cadeiras, orçamento anual e cota parlamentar.
 * 2. Transmissão oficial ao vivo e agenda de sessões plenárias.
 * 3. Mesa Diretora, presidência e organograma de lideranças.
 * 4. Tabela completa de proposições e projetos de lei com busca, filtros e CSV com BOM UTF-8.
 * 5. Ranking cívico de atuação parlamentar com metodologia aberta.
 * 6. Comissões temáticas permanentes, especiais e CPIs.
 * 7. Audiências públicas com calendário e transmissão.
 * 8. Contatos institucionais, ouvidoria e canais de acesso à informação.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Users,
  Coins,
  FileText,
  Award,
  Layers,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Bot,
  MapPin,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  listarTodasAssembleias,
  obterAssembleiaPorUf,
} from "@/lib/assembleias/dados";
import TransmissaoSessaoCard from "../components/TransmissaoSessaoCard";
import MesaDiretoraCard from "../components/MesaDiretoraCard";
import TabelaProposicoes from "../components/TabelaProposicoes";
import RankingDeputados from "../components/RankingDeputados";
import ComissoesAssembleia from "../components/ComissoesAssembleia";
import AudienciasAssembleia from "../components/AudienciasAssembleia";

export async function generateStaticParams() {
  const assembleias = listarTodasAssembleias();
  return assembleias.map((a) => ({
    uf: a.uf.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uf: string }>;
}): Promise<Metadata> {
  const { uf } = await params;
  const assembleia = obterAssembleiaPorUf(uf);

  if (!assembleia) {
    return {
      title: "Assembleia Legislativa não localizada | Controle Popular",
    };
  }

  return {
    title: `${assembleia.sigla} — Assembleia Legislativa de ${assembleia.estado} | Controle Popular`,
    description: `Auditoria cívica da ${assembleia.sigla} (${assembleia.estado}): ${assembleia.totalDeputados} deputados, projetos de lei, comissões, gastos e ranking de atuação.`,
  };
}

export default async function AssembleiaDetalhePage({
  params,
}: {
  params: Promise<{ uf: string }>;
}) {
  const { uf } = await params;
  const assembleia = obterAssembleiaPorUf(uf);

  if (!assembleia) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ═══ 1. NAVEGAÇÃO BREADCRUMB ═══ */}
        <nav
          aria-label="Trilha de navegação"
          className="flex flex-wrap items-center gap-2 text-xs text-muted"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/assembleias" className="hover:text-foreground transition-colors">
            Assembleias Legislativas
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-semibold">
            {assembleia.estado} ({assembleia.sigla})
          </span>
        </nav>

        {/* ═══ 2. CABEÇALHO DA ASSEMBLEIA ═══ */}
        <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
                  <Landmark size={14} aria-hidden="true" />
                  {assembleia.sigla}
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-0.5 text-xs font-semibold text-muted">
                  Região {assembleia.regiao} • {assembleia.uf}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Transparência Ativa
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground">
                {assembleia.nomeCompleto}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Building2 size={14} className="text-primary" aria-hidden="true" />
                  <strong>Sede:</strong> {assembleia.sede.edificio}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-primary" aria-hidden="true" />
                  <strong>Capital:</strong> {assembleia.capital}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted leading-relaxed pt-1">
                Acompanhamento em tempo real de proposições, requerimentos, composição partidária,
                gastos de gabinete e atuação dos <strong>{assembleia.totalDeputados} deputados estaduais</strong> em exercício.
              </p>
            </div>

            {/* Ações rápidas oficiais */}
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row lg:flex-col">
              <a
                href={assembleia.contatos.processoLegislativo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-ink shadow-xs hover:opacity-90 transition"
              >
                <span>Processo Legislativo ({assembleia.sigla})</span>
                <ExternalLink size={13} aria-hidden="true" />
              </a>

              <a
                href={assembleia.contatos.portalTransparencia}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface transition"
              >
                <span>Portal da Transparência</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>

              <a
                href={assembleia.contatos.dadosAbertos}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface transition"
              >
                <span>Dados Abertos</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Dica de RAG do Assistente Cívico (Regra § 8.5) */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
            <Bot size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Assistente Cívico Seu Nonô — Contexto {assembleia.sigla}:
              </p>
              <p className="text-muted leading-relaxed">
                Tire dúvidas com o assistente sobre os projetos de lei, gastos de gabinete
                ou a atuação dos parlamentares de {assembleia.estado}. Exemplo:
                <em> &quot;Quais deputados da {assembleia.sigla} apresentaram propostas de saúde este ano?&quot;</em>
              </p>
            </div>
          </div>
        </header>

        {/* ═══ 3. CARTÕES DE TOPO E INDICADORES DA CASA ═══ */}
        <section
          aria-label="Indicadores principais da Assembleia"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <Users size={14} className="text-primary" aria-hidden="true" />
              <span>Cadeiras Parlamentares</span>
            </div>
            <span className="mt-2 block font-display text-2xl sm:text-3xl font-bold text-foreground">
              {assembleia.totalDeputados}
            </span>
            <span className="mt-1 block text-xs text-muted">
              Deputados estaduais eleitos
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <Coins size={14} className="text-emerald-500" aria-hidden="true" />
              <span>Orçamento Anual</span>
            </div>
            <span className="mt-2 block font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              R$ {assembleia.orcamentoAnual.valorMilhoes.toLocaleString("pt-BR")} mi
            </span>
            <span className="mt-1 block text-xs text-muted">
              Ano base: {assembleia.orcamentoAnual.anoExercicio}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <Coins size={14} className="text-indigo-500" aria-hidden="true" />
              <span>Cota de Gabinete</span>
            </div>
            <span className="mt-2 block font-display text-2xl sm:text-3xl font-bold text-foreground">
              R$ {(assembleia.orcamentoAnual.cotaMediaGabineteMensal / 1000).toFixed(1)}k
            </span>
            <span className="mt-1 block text-xs text-muted">
              Média mensal por deputado
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              <span>Regra Constitucional</span>
            </div>
            <span className="mt-2 block font-display text-base sm:text-lg font-bold text-foreground">
              Art. 27 da CF/88
            </span>
            <span className="mt-1 block text-xs text-muted">
              Proporcionalidade da bancada
            </span>
          </div>
        </section>

        {/* ═══ 4. TRANSMISSÃO DE SESSÕES PLENÁRIAS (CARD BETIM STYLE) ═══ */}
        <TransmissaoSessaoCard
          transmissao={assembleia.transmissao}
          siglaAssembleia={assembleia.sigla}
        />

        {/* ═══ 5. MESA DIRETORA E ORGANOGRAMA DE LIDERANÇAS ═══ */}
        <section aria-label="Mesa Diretora da Casa" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Mesa Diretora & Representação Política
            </h2>
            <span className="text-xs text-muted">
              Liderança e condução dos trabalhos legislativos
            </span>
          </div>

          <MesaDiretoraCard
            mesa={assembleia.mesaDiretora}
            contatos={assembleia.contatos}
            sede={assembleia.sede}
            siglaAssembleia={assembleia.sigla}
          />
        </section>

        {/* ═══ 6. PROPOSIÇÕES LEGISLATIVAS E PROJETOS DE LEI ═══ */}
        <section aria-label="Proposições e Projetos de Lei" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Proposições & Projetos de Lei de Interesse Social
              </h2>
              <p className="text-xs text-muted">
                Consulte projetos de lei (PLs, PLCs, PECs), requerimentos e indicações com link oficial direto.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {assembleia.proposicoes.length} matérias catalogadas
            </span>
          </div>

          <TabelaProposicoes
            proposicoes={assembleia.proposicoes}
            siglaAssembleia={assembleia.sigla}
          />
        </section>

        {/* ═══ 7. RANKING CÍVICO DE ATUAÇÃO DOS DEPUTADOS ESTADUAIS ═══ */}
        <section aria-label="Ranking de Atuação dos Deputados" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Ranking de Atuação Cívica dos Deputados ({assembleia.sigla})
              </h2>
              <p className="text-xs text-muted">
                Metodologia cívica baseada em volume de proposições protocoladas, participação em comissões e assiduidade.
              </p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Cálculo Objetivo e Aberto
            </span>
          </div>

          <RankingDeputados
            deputados={assembleia.deputadosRanking}
            siglaAssembleia={assembleia.sigla}
          />
        </section>

        {/* ═══ 8. COMISSÕES TEMÁTICAS PERMANENTES E ESPECIAIS ═══ */}
        <section aria-label="Comissões Temáticas" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Comissões Temáticas & Frentes Parlamentares
              </h2>
              <p className="text-xs text-muted">
                Comissões permanentes (CCJ, Finanças, Meio Ambiente, Saúde) e comissões especiais.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {assembleia.comissoes.length} comissões registradas
            </span>
          </div>

          <ComissoesAssembleia
            comissoes={assembleia.comissoes}
            siglaAssembleia={assembleia.sigla}
          />
        </section>

        {/* ═══ 9. AUDIÊNCIAS PÚBLICAS E DEBATES POPULARES ═══ */}
        <section aria-label="Audiências Públicas" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Audiências Públicas & Participação Cidadã
              </h2>
              <p className="text-xs text-muted">
                Calendário e links de transmissão ao vivo de debates com a sociedade civil.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {assembleia.audienciasPublicas.length} audiências mapeadas
            </span>
          </div>

          <AudienciasAssembleia
            audiencias={assembleia.audienciasPublicas}
            siglaAssembleia={assembleia.sigla}
          />
        </section>

        {/* ═══ 10. CANAIS INSTITUCIONAIS E ACESSO À INFORMAÇÃO ═══ */}
        <section
          aria-label="Canais de Contato e Transparência"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-1">
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Canais Institucionais & Serviço de Informação ao Cidadão (SIC)
            </h2>
            <p className="text-xs text-muted">
              Endereços oficiais, telefones, ouvidoria e links diretos para auditoria pública da {assembleia.sigla}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted block">
                Localização da Sede
              </span>
              <p className="text-xs font-semibold text-foreground">
                {assembleia.sede.edificio}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {assembleia.sede.endereco}
              </p>
              <p className="text-[11px] font-mono text-muted">
                CEP: {assembleia.sede.cep} • {assembleia.sede.cidade}-{assembleia.uf}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted block">
                Contatos Telefônicos & E-mail
              </span>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Phone size={13} className="text-primary" aria-hidden="true" />
                <span className="font-mono">{assembleia.contatos.telefone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Mail size={13} className="text-primary" aria-hidden="true" />
                <span className="font-mono break-all">{assembleia.contatos.email}</span>
              </div>
              <a
                href={assembleia.contatos.ouvidoria}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>Canal da Ouvidoria Cidadã</span>
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted block">
                Dados Abertos & Diário Oficial
              </span>
              <p className="text-xs text-muted leading-relaxed">
                Acesse as bases brutas em formato aberto (CSV, JSON, XML) e as publicações oficiais.
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <a
                  href={assembleia.contatos.dadosAbertos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Portal de Dados Abertos</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>

                <a
                  href={assembleia.contatos.processoLegislativo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Consulta ao Processo Legislativo</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 11. REGRA CONSTITUCIONAL EXPLICADA ═══ */}
        <footer className="rounded-2xl border border-border/80 bg-surface/50 p-5 text-xs text-muted space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Info size={14} className="text-primary" aria-hidden="true" />
            <span>Como é definido o número de deputados estaduais?</span>
          </div>
          <p className="leading-relaxed">
            O número de cadeiras na Assembleia Legislativa de cada estado é fixado pelo{" "}
            <strong>Artigo 27 da Constituição Federal de 1988</strong>: corresponde ao triplo da
            representação do Estado na Câmara dos Deputados (para até 12 deputados federais = 36 estaduais).
            Atingido o número de 36, é acrescido de tantos quantos forem os deputados federais acima de doze.
            Por essa regra, o Brasil conta hoje com exatamente <strong>1.059 deputados estaduais e distritais</strong>.
          </p>
        </footer>
      </div>
    </main>
  );
}
