import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  Building2,
  Clock,
  ShieldCheck,
  Plane,
  Users
} from "lucide-react";
import PainelEducacaoPeriodicos from "./PainelEducacaoPeriodicos";
import PainelIntercambioCursos from "./PainelIntercambioCursos";
import dadosEducacao from "@/data/educacao-periodicos.json";
import {
  listarDepartamentos,
  listarProgramas,
  listarCursos,
  resumirIntercambio
} from "@/lib/intercambio";

/**
 * /educacao — Oportunidades de Publicação Acadêmica, Intercâmbio e Ensino Superior
 *
 * Papel no portal:
 *   Democratizar o acesso ao ensino superior e à pesquisa, reunindo:
 *   1. Periódicos de submissão contínua e cíclicos de 141 países.
 *   2. Editais oficiais de intercâmbio (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander...).
 *   3. Departamentos de relações internacionais (DRI/SRI) com contatos oficiais.
 *   4. Cursos de graduação/pós-graduação com nomes e e-mails institucionais de professores coordenadores.
 *
 * As Oito Qualidades da Informação atendidas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado à Fonte Oficial Direta (submissão, editais e páginas institucionais).
 *   2. Buscável e Filtrável (tempo real, tolerante a acentos e facetas reais).
 *   3. Classificável e Ordenável por Coluna (título, tempo de avaliação, país).
 *   4. Resumo e Cartões de Topo (números medidos derivados dos dados).
 *   5. Chatbot com Contexto Cívico (integração nativa com o Seu Nonô).
 *   6. Exportável Multi-formato (CSV com BOM UTF-8 e ponto-e-vírgula + @media print).
 *   7. Responsiva (390 px para celulares até 4K, sem rolagem lateral falsa).
 *   8. Rastreável no Tempo (data visível e derivada do arquivo gerado pelo coletor).
 */

export const metadata: Metadata = {
  title: "Educação Superior, Intercâmbio e Publicação Acadêmica — Controle Popular",
  description:
    "Catálogo unificado de periódicos abertos, editais de intercâmbio (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander), diretorias de relações internacionais e contatos de professores coordenadores de cursos.",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PaginaEducacao() {
  const { metricas, amostra_educacao, atualizado_em } = dadosEducacao;
  const dataFormatada = atualizado_em.split("-").reverse().join("/");

  const departamentos = listarDepartamentos();
  const programas = listarProgramas();
  const cursos = listarCursos();
  const resumoIntercambio = resumirIntercambio();

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
        <span className="font-semibold text-foreground">Educação & Pesquisa</span>
      </nav>

      {/* Cabeçalho principal com rastreabilidade temporal (Qualidade 8) */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Educação Superior, Pesquisa & Mobilidade Cívica
          </span>
          <span className="text-muted">•</span>
          <time dateTime={atualizado_em} className="text-muted">
            Dados verificados em {dataFormatada}
          </time>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Oportunidades Acadêmicas, Intercâmbio e Publicação Científica
        </h1>

        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-4xl">
          Diretório público para estudantes, pesquisadores e movimentos cívicos encontrarem
          <strong> editais de intercâmbio internacional</strong> (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander),
          <strong> diretorias de relações internacionais</strong> (DRI/SRI), <strong>cursos com contatos de professores coordenadores</strong> e
          <strong> periódicos acadêmicos gratuitos</strong> (submissão contínua e cíclica).
        </p>
      </header>

      {/* Cartões de Topo e Agregados Medidos (Qualidade 4) */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            Revistas Científicas
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {fmt(metricas.total_periodicos)}
          </div>
          <p className="mt-1 text-xs text-muted">{fmt(metricas.gratuitos_diamond)} sem APC (Diamante)</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
            <Plane className="w-4 h-4" />
            Editais de Intercâmbio
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {resumoIntercambio.totalProgramas}
          </div>
          <p className="mt-1 text-xs text-muted">Erasmus+, PILA, AUGM, Brafitec...</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase">
            <Building2 className="w-4 h-4" />
            Departamentos de R.I.
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {resumoIntercambio.totalDepartamentos}
          </div>
          <p className="mt-1 text-xs text-muted">Diretorias DRI/SRI mapeadas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase">
            <Users className="w-4 h-4" />
            Cursos & Coordenadores
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {resumoIntercambio.totalCursosMapeados}
          </div>
          <p className="mt-1 text-xs text-muted">Canais de coordenação direta</p>
        </div>
      </section>

      {/* Bloco 1: Intercâmbio, Departamentos e Cursos Oferecidos */}
      <PainelIntercambioCursos
        departamentos={departamentos}
        programas={programas}
        cursos={cursos}
        resumo={resumoIntercambio}
      />

      {/* Explicação Didática: Como Funciona o Intercâmbio Universitário */}
      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Guia Rápido: Como Participar de Intercâmbios Acadêmicos com Bolsa
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3 text-xs sm:text-sm text-muted leading-relaxed">
          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>🏛️</span> 1. Procure a DRI da sua Universidade
            </h3>
            <p className="mt-2">
              Os editais para o <strong>Erasmus+</strong>, <strong>PILA</strong>, <strong>AUGM</strong> e <strong>Brafitec</strong> são lançados
              sempre pela Diretoria de Relações Internacionais (DRI) da instituição onde você estuda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>📄</span> 2. Validação com o Coordenador
            </h3>
            <p className="mt-2">
              Antes de viajar, procure o professor coordenador do seu curso para montar o <strong>plano de equivalência</strong> de
              disciplinas, garantindo o aproveitamento integral de todos os créditos cursados no exterior.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-soft border border-border">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>💰</span> 3. Bolsas e Isenção de Taxas
            </h3>
            <p className="mt-2">
              Programas como PILA e AUGM garantem <strong>moradia e alimentação gratuitas</strong> na universidade anfitriã. O Erasmus+ e Brafitec
              concedem bolsas mensais de manutenção em euros e passagens aéreas.
            </p>
          </div>
        </div>
      </section>

      {/* Bloco 2: Catálogo de Periódicos e Oportunidades Acadêmicas */}
      <PainelEducacaoPeriodicos
        amostra={amostra_educacao}
        atualizadoEm={atualizado_em}
      />

      {/* Rodapé institucional com link para os dados brutos */}
      <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Soberania do Dado e Download Aberto
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted max-w-2xl">
              Dados auditados de editais de mobilidade, diretorias de relações internacionais,
              coordenações de curso e acervo mundial de periódicos disponíveis abertamente para consulta cívica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/universidades"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            >
              Ver Índice de Universidades →
            </Link>
          </div>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}
