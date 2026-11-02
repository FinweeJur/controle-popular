import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import PainelEducacaoPowerBI from "./PainelEducacaoPowerBI";
import dadosEducacao from "@/data/educacao-periodicos.json";
import dadosInepMg from "@/data/educacao-inep-mg.json";
import {
  listarDepartamentos,
  listarProgramas,
  listarCursos,
  listarEventosCalendario,
  resumirIntercambio
} from "@/lib/intercambio";
import {
  INSTITUICOES,
  UNIDADES,
  listarGrupos,
  listarProjetos,
  resumirUniversidades
} from "@/lib/universidades";

/**
 * /educacao — Hub Unificado de Educação Básica, Superior, Pesquisa e Mobilidade (PowerBI Cívico)
 *
 * Papel no portal:
 *   Centralizar, auditar e correlacionar todo o ecossistema educacional do país:
 *   1. Educação Básica & IDEB: 178.416 escolas, 47,3 mi de matrículas, série 2015-2023 e cruzamentos municipais.
 *   2. Universidades & Extensão: 1.414 grupos CNPq, 170 projetos de extensão e 39 instituições de ensino superior.
 *   3. Periódicos Científicos: 23.577 títulos do DOAJ e SciELO, 14.729 Diamante (100% sem APC).
 *   4. Mobilidade Internacional: 10 programas de intercâmbio, 31 diretorias de R.I. e calendário 12 meses.
 *   5. Direitos Comparados: matriz federativa de 27 UFs e marcos legais (CF/88, LDB, Fundeb, PNE).
 *
 * As Oito Qualidades da Informação atendidas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado à Fonte Oficial Direta (INEP, MEC, CNPq, DOAJ, Planalto e DRIs).
 *   2. Buscável e Filtrável (tempo real, tolerante a acentos e slicers multidimensionais).
 *   3. Classificável e Ordenável por Coluna (notas do IDEB, títulos, tempo médio de avaliação).
 *   4. Resumo e Cartões de Topo (números medidos derivados dos dados).
 *   5. Chatbot com Contexto Cívico (integração nativa com o Seu Nonô).
 *   6. Exportável Multi-formato (CSV com BOM UTF-8 e ponto-e-vírgula + @media print).
 *   7. Responsiva (390 px para celulares até 4K, sem rolagem lateral falsa).
 *   8. Rastreável no Tempo (data visível e derivada dos arquivos de dados).
 */

export const metadata: Metadata = {
  title: "Educação, Pesquisa e Mobilidade Acadêmica (PowerBI Cívico) — Controle Popular",
  description:
    "Hub unificado de educação básica (Censo Escolar e IDEB), 1.414 grupos de pesquisa CNPq, 23.577 periódicos científicos abertos, editais de intercâmbio e direitos comparados.",
};

export default function PaginaEducacao() {
  const { metricas, amostra_educacao, atualizado_em } = dadosEducacao;
  const dataFormatada = atualizado_em.split("-").reverse().join("/");

  // Módulos carregados no servidor com dados canônicos
  const departamentos = listarDepartamentos();
  const programas = listarProgramas();
  const cursos = listarCursos();
  const eventosCalendario = listarEventosCalendario();
  const resumoIntercambio = resumirIntercambio();

  const grupos = listarGrupos();
  const projetos = listarProjetos();
  const resumoUniversidades = resumirUniversidades();
  const municipiosInep = dadosInepMg.municipios;

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      {/* Navegação estrutural */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Educação, Pesquisa & Mobilidade</span>
      </nav>

      {/* Cabeçalho principal com rastreabilidade temporal (Qualidade 8) */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Hub Unificado · PowerBI Cívico
          </span>
          <span className="text-muted">•</span>
          <Link
            href="/concursos"
            className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
          >
            <span>🏛️ Concursos & PSS da Educação</span>
          </Link>
          <span className="text-muted">•</span>
          <time dateTime={atualizado_em} className="text-muted">
            Dados auditados em {dataFormatada}
          </time>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Educação, Produção Científica e Mobilidade Acadêmica
        </h1>

        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
          Central canônica que unifica os indicadores da <strong>Educação Básica</strong> (178.416 escolas e série histórica do IDEB),
          o diretório de <strong>Universidades & CNPq</strong> (1.414 grupos de pesquisa e 170 projetos de extensão),
          a sistematização mundial de <strong>Periódicos Científicos Abertos</strong> (23.577 títulos, 62,5% Diamante sem taxas),
          o catálogo de <strong>Mobilidade e Intercâmbio</strong> (10 programas de bolsas e 31 diretorias de R.I.) e a matriz de <strong>Direitos Comparados</strong>.
        </p>
      </header>

      {/* Painel Interativo PowerBI com Cross-Filtering, Slicers e Tópicos Dedicados */}
      <PainelEducacaoPowerBI
        amostraEducacao={amostra_educacao}
        metricasPeriodicos={metricas}
        atualizadoEmPeriodicos={atualizado_em}
        municipiosInep={municipiosInep}
        instituicoes={INSTITUICOES}
        unidades={UNIDADES}
        grupos={grupos}
        projetos={projetos}
        resumoUniversidades={resumoUniversidades}
        departamentos={departamentos}
        programas={programas}
        cursos={cursos}
        eventosCalendario={eventosCalendario}
        resumoIntercambio={resumoIntercambio}
      />

      {/* Rodapé institucional e soberania do dado */}
      <section className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Soberania do Dado e Acesso Aberto Cívico
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted max-w-2xl">
              Todos os dados do portal vêm de fontes oficiais auditadas (INEP, MEC, CNPq, DOAJ,
              SciELO, IBGE e Planalto). Nenhum número é inventado ou manipulado. Todos os registros
              podem ser baixados em formato aberto CSV com delimitador brasileiro e codificação UTF-8.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/universidades"
              className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            >
              Índice de Universidades →
            </Link>
            <Link
              href="/periodicos"
              className="px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            >
              Periódicos Contínuos →
            </Link>
          </div>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}
