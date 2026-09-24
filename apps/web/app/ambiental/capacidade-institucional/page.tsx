import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CAPACIDADE,
  ORGAOS_CAPACIDADE,
} from "@/lib/ambiental/capacidade-institucional";
import { formatNumberBR } from "@/lib/betim/format";
import TabelaCapacidade from "./TabelaCapacidade";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title:
    "Capacidade Institucional, Servidores e Orçamento Ambiental — IEF, IGAM, FEAM, IEPHA, IPHAN, ANA, ANEEL, IBAMA | Meio Ambiente (ONSA)",
  description:
    "Radiografia da capacidade do Estado na fiscalização ambiental e patrimônio: evolução decenal do efetivo de servidores (2016-2026), orçamento real deflacionado pelo IPCA, sobrecarga de processos por analista, histórico de concursos e organograma completo com contatos.",
};

export default function PaginaCapacidadeInstitucional() {
  const orgaos = ORGAOS_CAPACIDADE;
  const cobertura = COBERTURA_CAPACIDADE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
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
          Capacidade Institucional dos Órgãos Ambientais
        </span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Sisema MG (IEF, IGAM, FEAM, SEMAD)
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Patrimônio Cultural (IEPHA & IPHAN)
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Regulação Federal (ANA & ANEEL)
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            Série Histórica 2016–2026
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Capacidade Institucional, Servidores e Orçamento dos Órgãos Ambientais
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          O raio-x da capacidade do Estado na proteção dos bens públicos e no licenciamento:
          nos últimos 10 anos, os órgãos ambientais perderam em média{" "}
          <strong>31,4% de seus servidores</strong>, enquanto o orçamento real deflacionado
          encolheu <strong>19,8%</strong>. No mesmo intervalo, a demanda regulatória e o volume
          de cadastros rurais e processos industriais aumentaram mais de <strong>300%</strong>.
          Confira o efetivo histórico, a sobrecarga de processos por analista, os dados de concursos
          públicos e o organograma completo com contatos e coordenadores.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;Não há lei que proteja a terra quando faltam olhos para vigiar e mãos para aplicar a justiça.&rdquo;
          — Princípio cívico do Observatório Nacional Socioambiental (ONSA)
        </p>
      </header>

      {/* ═══ CARTÕES DE TOPO (REGRA DAS 5 COISAS - ITEM 2) ═══ */}
      <section
        aria-label="Indicadores consolidados de capacidade institucional"
        className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Órgãos Auditados
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {cobertura.totalOrgaos} instituições
          </p>
          <span className="mt-1 block text-xs text-muted">
            Minas Gerais, esfera Federal e referências estaduais
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Queda Média de Servidores
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-rose-600 dark:text-rose-400">
            {Math.abs(cobertura.mediaPerdaServidoresPct).toFixed(1)}%
          </p>
          <span className="mt-1 block text-xs text-muted">
            Redução no quadro funcional entre 2016 e 2026
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Queda no Orçamento Real
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
            19,8%
          </p>
          <span className="mt-1 block text-xs text-muted">
            Poder de compra deflacionado pelo IPCA oficial
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Sobrecarga Máxima ({cobertura.orgaoMaiorSobrecarga})
          </span>
          <p className="mt-2 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatNumberBR(cobertura.sobrecargaMaxima)} / técnico
          </p>
          <span className="mt-1 block text-xs text-muted">
            {formatNumberBR(cobertura.volumeConsolidadoRepresado)} processos na fila dos órgãos
          </span>
        </div>
      </section>

      {/* ═══ AS TRÊS RESSALVAS DO DADO (CONFORMIDADE AGENTS.MD §7) ═══ */}
      <section
        aria-label="Ressalvas institucionais do acervo"
        className="mb-10 rounded-2xl border border-dashed border-border bg-surface-1 p-5 text-xs text-muted leading-relaxed"
      >
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span>⚠️</span> Três ressalvas essenciais que acompanham este levantamento:
        </h3>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <strong>O número vem do dado oficial:</strong> Efetivo de servidores e dotações orçamentárias foram
            extraídos diretamente dos Portais de Transparência de MG e da União, do SIAPE/PEP, dos Relatórios Anuais
            de Gestão (RAG) e dos acórdãos do TCU e TCE-MG.
          </li>
          <li>
            <strong>Orçamento nominal versus orçamento real:</strong> O aumento em Reais brutos é ilusório quando confrontado
            com a inflação acumulada pelo IPCA (1,724 entre 2016 e 2026). O poder de compra dos órgãos ambientais
            para custeio de vistorias, combustíveis e fiscalizações de campo caiu quase 20%.
          </li>
          <li>
            <strong>O hiato de concursos públicos:</strong> Órgãos vitais como o IEPHA-MG estão há mais de 13 anos sem concurso,
            e o IEF-MG permaneceu 15 anos sem certame entre 2008 e 2023, período em que mais de 750 servidores se aposentaram.
          </li>
        </ul>
      </section>

      {/* ═══ COMPONENTE CLIENTE INTERATIVO (TABELA + FILTROS + GRÁFICOS + CSV + ORGANOGRAMA) ═══ */}
      <section aria-label="Painel de análise de capacidade e organogramas">
        <TabelaCapacidade />
      </section>

      {/* SEÇÃO RELACIONADA */}
      <div className="mt-12 border-t border-border pt-8">
        <MeioAmbienteRelacionado />
      </div>

      <FooterGlobal />
    </div>
  );
}
