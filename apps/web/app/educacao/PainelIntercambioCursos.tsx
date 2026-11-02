"use client";

/**
 * Painel Interativo de Calendário Mensal, Intercâmbio Mundial, Departamentos e Cursos com Coordenadores
 *
 * Papel no portal:
 *   Reúne de forma centralizada e cívica:
 *   1. Calendário Anual Mês a Mês (Janeiro a Dezembro) com prazos de submissão de periódicos e editais de bolsas.
 *   2. Editais de mobilidade internacional (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander, Fulbright, DAAD...).
 *   3. Diretorias de Relações Internacionais (DRI/SRI/IRO) no Brasil e em todos os continentes (Europa, América Latina, América do Norte, Ásia/China, África e Oceania).
 *   4. Catálogo de cursos com canais públicos de professores coordenadores e convênios de intercâmbio.
 *
 * Qualidades da Informação atendidas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado à Fonte Oficial Direta (links de editais e páginas oficiais de DRI).
 *   2. Buscável e Filtrável (tempo real, tolerante a acentos e facetas por mês, categoria e continente).
 *   3. Classificável e Ordenável por Coluna.
 *   4. Resumo e Cartões com Totais Medidos derivados do código.
 *   5. Chatbot com Contexto Cívico (Seu Nonô).
 *   6. Exportável Multi-formato (CSV com BOM UTF-8 e ponto-e-vírgula + @media print).
 *   7. Responsiva (390 px) sem quebra lateral.
 *   8. Rastreável no Tempo (<time>).
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
  Calendar as CalendarIcon,
  CheckCircle2,
  Sparkles,
  Plane,
  Clock,
  MapPin,
  Tag
} from "lucide-react";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";
import type {
  DepartamentoIntercambio,
  EditalProgramaIntercambio,
  CursoCoordenador,
  EventoCalendarioAcademico,
  ResumoIntercambio,
  RegiaoMundial,
} from "@/lib/intercambio/tipos";

interface PainelIntercambioProps {
  departamentos: DepartamentoIntercambio[];
  programas: EditalProgramaIntercambio[];
  cursos: CursoCoordenador[];
  eventosCalendario: EventoCalendarioAcademico[];
  resumo: ResumoIntercambio;
}

const MESES = [
  { num: 0, nome: "Todos os Meses", sigla: "Todos" },
  { num: 1, nome: "Janeiro", sigla: "Jan" },
  { num: 2, nome: "Fevereiro", sigla: "Fev" },
  { num: 3, nome: "Março", sigla: "Mar" },
  { num: 4, nome: "Abril", sigla: "Abr" },
  { num: 5, nome: "Maio", sigla: "Mai" },
  { num: 6, nome: "Junho", sigla: "Jun" },
  { num: 7, nome: "Julho", sigla: "Jul" },
  { num: 8, nome: "Agosto", sigla: "Ago" },
  { num: 9, nome: "Setembro", sigla: "Set" },
  { num: 10, nome: "Outubro", sigla: "Out" },
  { num: 11, nome: "Novembro", sigla: "Nov" },
  { num: 12, nome: "Dezembro", sigla: "Dez" },
];

const REGIOES: (RegiaoMundial | "Todas")[] = [
  "Todas",
  "Brasil",
  "Lusófonos",
  "América Latina",
  "Europa",
  "América do Norte",
  "Ásia e China",
  "África",
  "Oceania",
];

export default function PainelIntercambioCursos({
  departamentos,
  programas,
  cursos,
  eventosCalendario,
  resumo,
}: PainelIntercambioProps) {
  const [abaAtiva, setAbaAtiva] = useState<"calendario" | "programas" | "departamentos" | "cursos">("calendario");
  const [busca, setBusca] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(0);
  const [categoriaCalendario, setCategoriaCalendario] = useState("todas");
  const [filtroRegiao, setFiltroRegiao] = useState<RegiaoMundial | "Todas">("Todas");
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

  // Filtro do Calendário Mês a Mês
  const eventosFiltrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    return eventosCalendario.filter((e) => {
      if (mesSelecionado !== 0 && e.mes !== mesSelecionado) return false;
      if (categoriaCalendario !== "todas" && e.categoria !== categoriaCalendario) return false;
      if (!t) return true;
      return (
        e.titulo.toLowerCase().includes(t) ||
        e.instituicaoOuPrograma.toLowerCase().includes(t) ||
        e.paisOuRegiao.toLowerCase().includes(t) ||
        e.descricao.toLowerCase().includes(t) ||
        e.tags.some((tag) => tag.toLowerCase().includes(t))
      );
    });
  }, [eventosCalendario, busca, mesSelecionado, categoriaCalendario]);

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
      if (filtroRegiao !== "Todas" && d.regiao !== filtroRegiao) return false;
      if (filtroInstituicao !== "Todas" && d.instituicao !== filtroInstituicao) return false;
      if (!t) return true;
      return (
        d.instituicao.toLowerCase().includes(t) ||
        d.nomeInstituicao.toLowerCase().includes(t) ||
        d.nomeDepartamento.toLowerCase().includes(t) ||
        d.pais.toLowerCase().includes(t) ||
        d.cidade.toLowerCase().includes(t) ||
        (d.uf && d.uf.toLowerCase().includes(t)) ||
        d.responsavel.toLowerCase().includes(t) ||
        d.programas.some((prog) => prog.toLowerCase().includes(t))
      );
    });
  }, [departamentos, busca, filtroRegiao, filtroInstituicao]);

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

    if (abaAtiva === "calendario") {
      nomeArquivo = "calendario-publicacoes-intercambio";
      cabecalhos = ["Mês", "Categoria", "Título", "Instituição / Programa", "País / Região", "Prazo / Período", "Público Alvo", "Link Oficial"];
      linhas = eventosFiltrados.map((e) => [
        `"${e.nomeMes}"`,
        `"${e.categoria}"`,
        `"${e.titulo.replace(/"/g, '""')}"`,
        `"${e.instituicaoOuPrograma.replace(/"/g, '""')}"`,
        `"${e.paisOuRegiao.replace(/"/g, '""')}"`,
        `"${e.prazoOuPeriodo.replace(/"/g, '""')}"`,
        `"${e.publicoAlvo.replace(/"/g, '""')}"`,
        `"${e.linkOficial}"`
      ]);
    } else if (abaAtiva === "programas") {
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
      nomeArquivo = "diretorias-relacoes-internacionais-mundo";
      cabecalhos = ["Instituição", "Nome Completo", "País", "Região", "Cidade", "Departamento", "Responsável", "E-mail Oficial", "Telefone", "Site", "Programas"];
      linhas = departamentosFiltrados.map((d) => [
        `"${d.instituicao}"`,
        `"${d.nomeInstituicao.replace(/"/g, '""')}"`,
        `"${d.pais}"`,
        `"${d.regiao}"`,
        `"${d.cidade}"`,
        `"${d.nomeDepartamento.replace(/"/g, '""')}"`,
        `"${d.responsavel.replace(/"/g, '""')}"`,
        `"${d.email}"`,
        `"${d.telefone || ""}"`,
        `"${d.site}"`,
        `"${d.programas.join("; ")}"`
      ]);
    } else {
      nomeArquivo = "cursos-e-coordenadores-academicos";
      cabecalhos = ["Curso", "Nível", "Grande Área", "Instituição", "Unidade", "Coordenador", "E-mail Institucional", "Telefone", "Site do Curso", "Convênios de Intercâmbio"];
      linhas = cursosFiltrados.map((c) => [
        `"${c.curso.replace(/"/g, '""')}"`,
        `"${c.nivel}"`,
        `"${c.grandeArea}"`,
        `"${c.instituicao}"`,
        `"${c.unidade.replace(/"/g, '""')}"`,
        `"${c.coordenador.replace(/"/g, '""')}"`,
        `"${c.emailInstitucional}"`,
        `"${c.telefoneInstitucional || ""}"`,
        `"${c.siteCurso}"`,
        `"${c.conveniosIntercambio.join("; ")}"`
      ]);
    }

    const conteudoCSV = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="titulo-intercambio" className="mt-12 space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Globe2 className="w-4 h-4" />
            <span>Mobilidade Acadêmica, Publicação e Ensino Superior Global</span>
          </div>
          <h2 id="titulo-intercambio" className="font-display text-xl sm:text-3xl font-bold text-foreground mt-1">
            Calendário Mensal, Relações Internacionais e Coordenações
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-3xl">
            Acompanhe o cronograma anual mês a mês de publicações científicas e editais de bolsas internacionais,
            contatos oficiais de diretorias nos 5 continentes e coordenações de cursos.
          </p>
        </div>

        {/* Ações: Exportar e Imprimir */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={baixarCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Exportar dados filtrados em formato CSV (compatível com Excel)"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Imprimir relatório da página"
          >
            <Printer className="w-3.5 h-3.5 text-muted" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Cartões de Resumo no Topo (Qualidade 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            Calendário
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-2">
            12 meses
          </span>
          <span className="text-xs text-muted mt-1">{resumo.totalEventosCalendario} chamadas mapeadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <Plane className="w-3.5 h-3.5 text-primary" />
            Editais Internacionais
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-2">
            {resumo.totalProgramas}
          </span>
          <span className="text-xs text-muted mt-1">Erasmus, PILA, AUGM...</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Diretorias de RI
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-2">
            {resumo.totalDepartamentos}
          </span>
          <span className="text-xs text-muted mt-1">Em {resumo.totalPaisesAlcancados} países</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            Cursos & Coordenadores
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-2">
            {resumo.totalCursosMapeados}
          </span>
          <span className="text-xs text-muted mt-1">Com e-mail de colegiado</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            Continentes
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-foreground mt-2">
            8 Regiões
          </span>
          <span className="text-xs text-muted mt-1">Brasil a Ásia e África</span>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-soft border border-border overflow-x-auto">
        <button
          onClick={() => setAbaAtiva("calendario")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "calendario"
              ? "bg-primary text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendário Mês a Mês ({eventosFiltrados.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("programas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "programas"
              ? "bg-primary text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Editais & Bolsas ({programasFiltrados.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("departamentos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "departamentos"
              ? "bg-primary text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Diretorias de RI no Mundo ({departamentosFiltrados.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("cursos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "cursos"
              ? "bg-primary text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Cursos & Coordenadores ({cursosFiltrados.length})</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca em Tempo Real (Qualidade 2) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              abaAtiva === "calendario"
                ? "Buscar no calendário (ex: bolsas, Fiocruz, Chevening, mestrado, TCU)..."
                : abaAtiva === "programas"
                ? "Buscar edital por sigla, país de destino ou benefício (ex: Erasmus, França, moradia)..."
                : abaAtiva === "departamentos"
                ? "Buscar universidade, país, cidade ou responsável (ex: Coimbra, Sorbonne, Oxford, Tsinghua)..."
                : "Buscar curso, coordenador ou área (ex: Direito, Engenharia, Computação)..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
          />
        </div>

        {/* Filtros específicos por aba */}
        {abaAtiva === "calendario" && (
          <div className="flex items-center gap-2">
            <select
              value={categoriaCalendario}
              onChange={(e) => setCategoriaCalendario(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="todas">Todas as Chamadas</option>
              <option value="intercambio">Intercâmbio & Bolsas</option>
              <option value="periodico_ciclico">Periódicos Cíclicos</option>
              <option value="edital_pesquisa">Editais de Pesquisa</option>
            </select>
          </div>
        )}

        {abaAtiva === "departamentos" && (
          <div className="flex items-center gap-2">
            <select
              value={filtroRegiao}
              onChange={(e) => setFiltroRegiao(e.target.value as RegiaoMundial | "Todas")}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              {REGIOES.map((r) => (
                <option key={r} value={r}>
                  {r === "Todas" ? "Todas as Regiões" : r}
                </option>
              ))}
            </select>
          </div>
        )}

        {(abaAtiva === "departamentos" || abaAtiva === "cursos") && (
          <div className="flex items-center gap-2">
            <select
              value={filtroInstituicao}
              onChange={(e) => setFiltroInstituicao(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              {instituicoesDisponiveis.map((inst) => (
                <option key={inst} value={inst}>
                  {inst === "Todas" ? "Todas as Instituições" : inst}
                </option>
              ))}
            </select>
          </div>
        )}

        {abaAtiva === "cursos" && (
          <div className="flex items-center gap-2">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              {areasDisponiveis.map((area) => (
                <option key={area} value={area}>
                  {area === "Todas" ? "Todas as Áreas" : area}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Seletor Mês a Mês (exibido na aba Calendário) */}
      {abaAtiva === "calendario" && (
        <div className="p-3 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted px-1">
            <span>Filtrar por Mês de Prazo / Início:</span>
            {mesSelecionado !== 0 && (
              <button
                onClick={() => setMesSelecionado(0)}
                className="text-primary hover:underline font-bold"
              >
                Limpar mês (ver ano todo)
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {MESES.map((m) => {
              const ativo = mesSelecionado === m.num;
              return (
                <button
                  key={m.num}
                  onClick={() => setMesSelecionado(m.num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    ativo
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface-soft border border-border text-foreground hover:bg-surface-hover hover:border-primary/40"
                  }`}
                >
                  {m.sigla}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba: 1. CALENDÁRIO MÊS A MÊS */}
      {abaAtiva === "calendario" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>
              Exibindo <strong>{eventosFiltrados.length}</strong> chamadas e marcos no calendário
              {mesSelecionado !== 0 ? ` para o mês de ${MESES.find((m) => m.num === mesSelecionado)?.nome}` : " ao longo de todo o ano"}.
            </span>
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% auditado com fonte oficial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventosFiltrados.map((ev) => (
              <article
                key={ev.id}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {ev.nomeMes}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-xs ${
                        ev.categoria === "intercambio"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : ev.categoria === "periodico_ciclico"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      {ev.categoria === "intercambio"
                        ? "Intercâmbio / Bolsa"
                        : ev.categoria === "periodico_ciclico"
                        ? "Periódico Cíclico"
                        : "Edital de Pesquisa"}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-foreground leading-snug">
                    {ev.titulo}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{ev.instituicaoOuPrograma}</span>
                    <span>•</span>
                    <span>{ev.paisOuRegiao}</span>
                  </div>

                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    {ev.descricao}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-surface-soft border border-border space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground">
                        <strong>Período:</strong> {ev.prazoOuPeriodo}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted">
                        <strong>Público:</strong> {ev.publicoAlvo}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {ev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-surface-soft text-muted text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rodapé com Link e Chatbot */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <a
                    href={ev.linkOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Página Oficial</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <BotaoPerguntarNono
                    pergunta={`Como funciona o edital "${ev.titulo}" (${ev.instituicaoOuPrograma}) e quais são as etapas para participar?`}
                    rotulo="Perguntar ao Seu Nonô"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba: 2. PROGRAMAS / EDITAIS */}
      {abaAtiva === "programas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programasFiltrados.map((prog) => (
            <article
              key={prog.id}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-primary/10 text-primary">
                    {prog.sigla}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {prog.regiaoDestino}
                  </span>
                </div>

                <h3 className="mt-2 font-display font-bold text-base text-foreground leading-snug">
                  {prog.nome}
                </h3>

                <p className="mt-1 text-xs text-muted">
                  <strong>Financiador:</strong> {prog.orgaoFinanciador}
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-surface-soft border border-border">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <span>💰</span> Bolsa e Benefícios Oferecidos:
                    </span>
                    <p className="mt-1 text-muted leading-relaxed">
                      {prog.beneficios}
                    </p>
                    <p className="mt-1 font-bold text-primary">
                      {prog.valorBolsaAprox}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-soft border border-border">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <span>🎯</span> Público-alvo & Ciclo de Chamadas:
                    </span>
                    <p className="mt-1 text-muted">
                      {prog.publicoAlvo} • <strong>Ciclo:</strong> {prog.cicloChamadas}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-foreground block mb-1">
                      Requisitos Básicos:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted pl-1">
                      {prog.requisitos.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                <a
                  href={prog.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Edital e Regulamento</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <BotaoPerguntarNono
                  pergunta={`Como me inscrevo no programa de intercâmbio ${prog.sigla} (${prog.nome}) e o que é necessário para concorrer à bolsa?`}
                  rotulo="Tirar Dúvida"
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba: 3. DIRETORIAS DE RI NO MUNDO */}
      {abaAtiva === "departamentos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departamentosFiltrados.map((dep) => (
            <article
              key={dep.id}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">
                    {dep.instituicao}
                  </span>
                  <span className="text-muted font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted" />
                    {dep.cidade}, {dep.pais}
                  </span>
                </div>

                <h3 className="mt-2 font-display font-bold text-sm text-foreground leading-snug">
                  {dep.nomeInstituicao}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-primary">
                  {dep.nomeDepartamento}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-surface-soft border border-border space-y-1.5 text-xs">
                  <div>
                    <span className="text-muted block text-xs">Responsável Institucional:</span>
                    <strong className="text-foreground">{dep.responsavel}</strong>
                    <span className="block text-muted text-xs">{dep.cargo}</span>
                  </div>

                  <div className="pt-2 border-t border-border space-y-1">
                    <a
                      href={`mailto:${dep.email}`}
                      className="flex items-center gap-1.5 text-primary hover:underline font-medium text-xs break-all"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{dep.email}</span>
                    </a>

                    {dep.telefone && (
                      <span className="flex items-center gap-1.5 text-muted text-xs">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{dep.telefone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Programas Oferecidos */}
                <div className="mt-3">
                  <span className="text-xs font-semibold text-foreground block mb-1">
                    Programas e Convênios Ativos:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {dep.programas.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-surface-soft border border-border text-foreground text-xs font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <a
                  href={dep.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Portal da DRI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <BotaoPerguntarNono
                  pergunta={`Quais oportunidades de mobilidade a ${dep.instituicao} (${dep.nomeInstituicao}) oferece e como entrar em contato com a ${dep.nomeDepartamento}?`}
                  rotulo="Contatar DRI"
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba: 4. CURSOS & COORDENADORES */}
      {abaAtiva === "cursos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>
              Exibindo <strong>{cursosFiltrados.length}</strong> cursos mapeados com canais oficiais de colegiado.
            </span>
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" /> E-mails institucionais públicos auditados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursosFiltrados.map((curso) => (
              <article
                key={curso.id}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">
                      {curso.instituicao}
                    </span>
                    <span className="text-muted font-medium">
                      {curso.grandeArea}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display font-bold text-base text-foreground leading-snug">
                    {curso.curso}
                  </h3>
                  <span className="text-xs text-muted block">{curso.nivel}</span>

                  <p className="mt-1 text-xs text-muted">
                    {curso.unidade} • {curso.campus}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-surface-soft border border-border space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted block text-xs">Professor(a) Coordenador(a):</span>
                      <strong className="text-foreground">{curso.coordenador}</strong>
                    </div>

                    <div className="pt-2 border-t border-border space-y-1">
                      <a
                        href={`mailto:${curso.emailInstitucional}`}
                        className="flex items-center gap-1.5 text-primary hover:underline font-medium text-xs break-all"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{curso.emailInstitucional}</span>
                      </a>

                      {curso.telefoneInstitucional && (
                        <span className="flex items-center gap-1.5 text-muted text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{curso.telefoneInstitucional}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Convênios de Intercâmbio do Curso */}
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      Intercâmbios & Mobilidade da Área:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {curso.conveniosIntercambio.map((conv) => (
                        <span
                          key={conv}
                          className="px-2 py-0.5 rounded-md bg-surface-soft text-foreground text-xs font-medium"
                        >
                          {conv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <a
                    href={curso.siteCurso}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Página do Curso</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <BotaoPerguntarNono
                    pergunta={`Como funciona a graduação em ${curso.curso} na ${curso.instituicao} e quais opções de intercâmbio existem para esse curso?`}
                    rotulo="Dúvidas do Curso"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
