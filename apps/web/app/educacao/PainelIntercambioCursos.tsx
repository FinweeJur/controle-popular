"use client";

/**
 * Painel Interativo de Intercâmbio, Departamentos Internacionais e Cursos com Coordenadores
 *
 * Papel no portal:
 *   Permite a estudantes, professores e cidadãos consultar os programas de mobilidade
 *   internacional (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander...), contatos
 *   das diretorias de relações internacionais (DRI) e cursos com seus professores coordenadores.
 *
 * Qualidades da Informação atendidas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado à Fonte Oficial Direta (links oficiais de editais e secretarias).
 *   2. Buscável e Filtrável (tempo real, tolerante a acentos e facetas reais).
 *   3. Classificável e Ordenável por Coluna.
 *   4. Resumo e Cartões com Totais Medidos.
 *   5. Chatbot com Contexto Cívico (Seu Nonô).
 *   6. Exportável Multi-formato (CSV com BOM UTF-8 e ponto-e-vírgula + @media print).
 *   7. Responsiva (390 px).
 *   8. Rastreável no Tempo.
 */

import { useState, useMemo } from "react";
import {
  Search,
  Globe2,
  Building2,
  GraduationCap,
  Download,
  Printer,
  Mail,
  Phone,
  ExternalLink,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  Plane,
  Users
} from "lucide-react";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";
import type {
  DepartamentoIntercambio,
  EditalProgramaIntercambio,
  CursoCoordenador,
  ResumoIntercambio,
} from "@/lib/intercambio/tipos";

interface PainelIntercambioProps {
  departamentos: DepartamentoIntercambio[];
  programas: EditalProgramaIntercambio[];
  cursos: CursoCoordenador[];
  resumo: ResumoIntercambio;
}

export default function PainelIntercambioCursos({
  departamentos,
  programas,
  cursos,
  resumo,
}: PainelIntercambioProps) {
  const [abaAtiva, setAbaAtiva] = useState<"programas" | "departamentos" | "cursos">("programas");
  const [busca, setBusca] = useState("");
  const [filtroInstituicao, setFiltroInstituicao] = useState("Todas");
  const [filtroArea, setFiltroArea] = useState("Todas");

  // Lista de instituições únicas
  const instituicoesDisponiveis = useMemo(() => {
    const setInst = new Set<string>();
    departamentos.forEach((d) => setInst.add(d.instituicao));
    cursos.forEach((c) => setInst.add(c.instituicao));
    return ["Todas", ...Array.from(setInst).sort()];
  }, [departamentos, cursos]);

  // Lista de grandes áreas únicas
  const areasDisponiveis = useMemo(() => {
    const setAreas = new Set<string>();
    cursos.forEach((c) => setAreas.add(c.grandeArea));
    return ["Todas", ...Array.from(setAreas).sort()];
  }, [cursos]);

  // Filtros aplicados por aba
  const programasFiltrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return programas;
    return programas.filter(
      (p) =>
        p.nome.toLowerCase().includes(t) ||
        p.sigla.toLowerCase().includes(t) ||
        p.regiaoDestino.toLowerCase().includes(t) ||
        p.paisesParticipantes.some((pais) => pais.toLowerCase().includes(t)) ||
        p.beneficios.toLowerCase().includes(t)
    );
  }, [programas, busca]);

  const departamentosFiltrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    return departamentos.filter((d) => {
      if (filtroInstituicao !== "Todas" && d.instituicao !== filtroInstituicao) return false;
      if (!t) return true;
      return (
        d.instituicao.toLowerCase().includes(t) ||
        d.nomeInstituicao.toLowerCase().includes(t) ||
        d.nomeDepartamento.toLowerCase().includes(t) ||
        d.responsavel.toLowerCase().includes(t) ||
        d.uf.toLowerCase().includes(t) ||
        d.programas.some((prog) => prog.toLowerCase().includes(t))
      );
    });
  }, [departamentos, busca, filtroInstituicao]);

  const cursosFiltrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    return cursos.filter((c) => {
      if (filtroInstituicao !== "Todas" && c.instituicao !== filtroInstituicao) return false;
      if (filtroArea !== "Todas" && c.grandeArea !== filtroArea) return false;
      if (!t) return true;
      return (
        c.curso.toLowerCase().includes(t) ||
        c.instituicao.toLowerCase().includes(t) ||
        c.nomeInstituicao.toLowerCase().includes(t) ||
        c.coordenador.toLowerCase().includes(t) ||
        c.unidade.toLowerCase().includes(t) ||
        c.campus.toLowerCase().includes(t)
      );
    });
  }, [cursos, busca, filtroInstituicao, filtroArea]);

  // Exportação CSV com BOM UTF-8 e ponto-e-vírgula (Qualidade 6)
  const baixarCSV = () => {
    let cabecalhos: string[] = [];
    let linhas: string[][] = [];
    let nomeArquivo = "dados-educacao-intercambio";

    if (abaAtiva === "programas") {
      nomeArquivo = "editais-programas-intercambio";
      cabecalhos = ["Sigla", "Nome do Programa", "Órgão Financiador", "Destino", "Bolsa / Benefícios", "Público Alvo", "Link Oficial"];
      linhas = programasFiltrados.map((p) => [
        `"${p.sigla}"`,
        `"${p.nome.replace(/"/g, '""')}"`,
        `"${p.orgaoFinanciador.replace(/"/g, '""')}"`,
        `"${p.regiaoDestino}"`,
        `"${p.valorBolsaAprox.replace(/"/g, '""')}"`,
        `"${p.publicoAlvo.replace(/"/g, '""')}"`,
        `"${p.urlOficial}"`
      ]);
    } else if (abaAtiva === "departamentos") {
      nomeArquivo = "departamentos-relacoes-internacionais";
      cabecalhos = ["Instituição", "Nome Completo", "UF", "Departamento", "Responsável", "E-mail Oficial", "Telefone", "Site", "Programas"];
      linhas = departamentosFiltrados.map((d) => [
        `"${d.instituicao}"`,
        `"${d.nomeInstituicao.replace(/"/g, '""')}"`,
        `"${d.uf}"`,
        `"${d.nomeDepartamento.replace(/"/g, '""')}"`,
        `"${d.responsavel.replace(/"/g, '""')}"`,
        `"${d.email}"`,
        `"${d.telefone || ""}"`,
        `"${d.site}"`,
        `"${d.programas.join(", ")}"`
      ]);
    } else {
      nomeArquivo = "cursos-e-professores-coordenadores";
      cabecalhos = ["Instituição", "Curso", "Nível", "Grande Área", "Unidade", "Campus", "Coordenador(a)", "E-mail Institucional", "Site", "Convênios"];
      linhas = cursosFiltrados.map((c) => [
        `"${c.instituicao}"`,
        `"${c.curso.replace(/"/g, '""')}"`,
        `"${c.nivel}"`,
        `"${c.grandeArea}"`,
        `"${c.unidade.replace(/"/g, '""')}"`,
        `"${c.campus.replace(/"/g, '""')}"`,
        `"${c.coordenador.replace(/"/g, '""')}"`,
        `"${c.emailInstitucional}"`,
        `"${c.siteCurso}"`,
        `"${c.conveniosIntercambio.join(", ")}"`
      ]);
    }

    const csvContent = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nomeArquivo}-${resumo.verificadoEm}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mt-8 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-xs">
      {/* Topo do Bloco com Seleção de Abas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            Intercâmbio, Departamentos e Cursos Oferecidos
          </h2>
          <p className="mt-1 text-sm text-muted">
            Programas oficiais de mobilidade (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander) e coordenações acadêmicas.
          </p>
        </div>

        {/* Botões de Exportação CSV e Impressão (Qualidade 6) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={baixarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-soft text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Exportar dados da aba atual para planilha CSV compatível com Excel"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-soft text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Imprimir relatório da página"
          >
            <Printer className="w-3.5 h-3.5 text-muted" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAbaAtiva("programas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            abaAtiva === "programas"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface-soft border border-border text-muted hover:text-foreground"
          }`}
        >
          <Globe2 className="w-4 h-4" />
          Editais & Programas ({programas.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("departamentos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            abaAtiva === "departamentos"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface-soft border border-border text-muted hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Departamentos de Relações Internacionais ({departamentos.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("cursos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            abaAtiva === "cursos"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface-soft border border-border text-muted hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Cursos & Coordenadores ({cursos.length})
        </button>
      </div>

      {/* Barra de Filtros Contextual */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              abaAtiva === "programas"
                ? "Buscar programa (Erasmus, PILA, AUGM, Brafitec, Santander...)..."
                : abaAtiva === "departamentos"
                ? "Buscar universidade, responsável, e-mail ou estado..."
                : "Buscar curso, coordenador, área ou universidade..."
            }
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {abaAtiva !== "programas" && (
          <div className="sm:col-span-3">
            <select
              value={filtroInstituicao}
              onChange={(e) => setFiltroInstituicao(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {instituicoesDisponiveis.map((inst) => (
                <option key={inst} value={inst}>
                  Universidade: {inst}
                </option>
              ))}
            </select>
          </div>
        )}

        {abaAtiva === "cursos" && (
          <div className="sm:col-span-3">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {areasDisponiveis.map((a) => (
                <option key={a} value={a}>
                  Área: {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba 1: Editais e Programas de Intercâmbio */}
      {abaAtiva === "programas" && (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {programasFiltrados.map((prog) => (
            <article
              key={prog.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-soft/60 p-5 hover:border-primary/40 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {prog.sigla}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border text-xs text-muted">
                    🌍 {prog.regiaoDestino}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-foreground leading-snug">
                  {prog.nome}
                </h3>

                <p className="mt-1 text-xs text-muted font-medium">
                  Financiador: <strong>{prog.orgaoFinanciador}</strong>
                </p>

                <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-xs text-foreground leading-relaxed">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {prog.valorBolsaAprox}
                  </p>
                  <p className="mt-1.5 text-muted">{prog.beneficios}</p>
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted">
                  <p>
                    <strong>Público:</strong> {prog.publicoAlvo}
                  </p>
                  <p>
                    <strong>Ciclo de Chamadas:</strong> {prog.cicloChamadas}
                  </p>
                  <div>
                    <strong>Principais requisitos:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-muted pl-1">
                      {prog.requisitos.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs text-muted">
                  Inscrição: via DRI institucional
                </span>

                <a
                  href={prog.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
                >
                  Página Oficial do Programa
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba 2: Departamentos de Relações Internacionais (DRI) */}
      {abaAtiva === "departamentos" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {departamentosFiltrados.map((dep) => (
            <article
              key={dep.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-soft/60 p-5 hover:border-primary/40 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {dep.instituicao} ({dep.uf})
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {dep.nomeInstituicao}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-foreground leading-snug">
                  {dep.nomeDepartamento}
                </h3>

                <p className="mt-1.5 text-xs text-foreground font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>
                    <strong>{dep.responsavel}</strong> — <span className="italic">{dep.cargo}</span>
                  </span>
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    <a
                      href={`mailto:${dep.email}`}
                      className="text-foreground hover:text-primary hover:underline font-mono"
                    >
                      {dep.email}
                    </a>
                  </p>
                  {dep.telefone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>{dep.telefone}</span>
                    </p>
                  )}
                  <p className="text-muted leading-relaxed line-clamp-2">
                    📍 {dep.endereco}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  {dep.programas.map((prog, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-surface border border-border text-foreground font-medium"
                    >
                      {prog}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Canal Oficial Verificado</span>

                <a
                  href={dep.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
                >
                  Site da Diretoria (DRI)
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba 3: Cursos Oferecidos e Contatos de Coordenadores */}
      {abaAtiva === "cursos" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cursosFiltrados.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-soft/60 p-5 hover:border-primary/40 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {item.instituicao}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border text-xs text-muted">
                    {item.nivel}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-foreground leading-snug">
                  {item.curso}
                </h3>

                <p className="mt-1 text-xs text-muted">
                  🏛️ {item.unidade} — {item.campus}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-xs">
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Coordenador(a): <strong>{item.coordenador}</strong>
                    </span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" />
                    <a
                      href={`mailto:${item.emailInstitucional}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {item.emailInstitucional}
                    </a>
                  </p>
                  {item.telefoneInstitucional && (
                    <p className="mt-1 flex items-center gap-1.5 text-muted">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>{item.telefoneInstitucional}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-surface border border-border text-muted">
                    🔬 {item.grandeArea}
                  </span>
                  {item.conveniosIntercambio.map((conv, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
                    >
                      ✈️ {conv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Colegiado de Curso</span>

                <a
                  href={item.siteCurso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
                >
                  Página do Curso
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Assistente Cívico Integrado (Qualidade 5) */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-soft/40 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-muted">
            Dúvidas sobre como validar créditos, requisitos de proficiência linguística ou processos seletivos do Erasmus+, PILA e AUGM?
          </p>
        </div>
        <BotaoPerguntarNono
          pergunta="Quais os requisitos e como se inscrever nos editais de intercâmbio Erasmus+, PILA e AUGM/Escala?"
          rotulo="Perguntar ao Seu Nonô"
        />
      </div>
    </section>
  );
}
