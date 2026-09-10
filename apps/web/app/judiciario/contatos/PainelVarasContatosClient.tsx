"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  Building2,
  Briefcase,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  MessageCircle,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Clock,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import type {
  UnidadeJudiciaria,
  ResumoEstatisticasContatos,
  RamoJustica,
  TipoUnidade,
} from "@/lib/judiciario/contatos-tipos";

/** Data ISO (yyyy-mm-dd) → pt-BR (dd/mm/aaaa). NaN vira "—" sem quebrar. */
function formatDataBR(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Props {
  unidadesIniciais: UnidadeJudiciaria[];
  estatisticas: ResumoEstatisticasContatos;
}

export default function PainelVarasContatosClient({
  unidadesIniciais,
  estatisticas,
}: Props) {
  const [busca, setBusca] = useState("");
  const [ramoFiltro, setRamoFiltro] = useState<string>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [ufFiltro, setUfFiltro] = useState<string>("MG"); // Padrão: MG
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "tabela">("cards");
  const [ordenarPor, setOrdenarPor] = useState<"comarca" | "nome" | "ramo">("comarca");
  const [ordemDirecao, setOrdemDirecao] = useState<"asc" | "desc">("asc");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 24;

  // Lista de UFs disponíveis
  const listaUfs = useMemo(() => {
    const ufs = new Set<string>();
    for (const u of unidadesIniciais) ufs.add(u.uf);
    return Array.from(ufs).sort((a, b) => (a === "MG" ? -1 : b === "MG" ? 1 : a.localeCompare(b)));
  }, [unidadesIniciais]);

  // Filtragem e Busca
  const unidadesFiltradas = useMemo(() => {
    const t = busca.toLowerCase().trim();

    return unidadesIniciais.filter((u) => {
      // Filtro de UF
      if (ufFiltro !== "todos" && u.uf !== ufFiltro) return false;

      // Filtro de Ramo
      if (ramoFiltro !== "todos" && u.ramo !== ramoFiltro) return false;

      // Filtro de Tipo
      if (tipoFiltro !== "todos" && u.tipo !== tipoFiltro) return false;

      // Busca Textual
      if (t) {
        const matchNome = u.nome.toLowerCase().includes(t);
        const matchComarca = u.comarcaOuSubsecao.toLowerCase().includes(t);
        const matchJuiz = u.coordenador.nome.toLowerCase().includes(t);
        const matchEmail = u.email.toLowerCase().includes(t);
        const matchTel = u.telefone.includes(t);
        if (!matchNome && !matchComarca && !matchJuiz && !matchEmail && !matchTel) {
          return false;
        }
      }

      return true;
    });
  }, [unidadesIniciais, busca, ramoFiltro, tipoFiltro, ufFiltro]);

  // Ordenação
  const unidadesOrdenadas = useMemo(() => {
    const ordenadas = [...unidadesFiltradas];
    ordenadas.sort((a, b) => {
      let comp = 0;
      if (ordenarPor === "comarca") {
        comp = a.comarcaOuSubsecao.localeCompare(b.comarcaOuSubsecao) || a.nome.localeCompare(b.nome);
      } else if (ordenarPor === "nome") {
        comp = a.nome.localeCompare(b.nome);
      } else if (ordenarPor === "ramo") {
        comp = a.ramo.localeCompare(b.ramo) || a.comarcaOuSubsecao.localeCompare(b.comarcaOuSubsecao);
      }
      return ordemDirecao === "asc" ? comp : -comp;
    });
    return ordenadas;
  }, [unidadesFiltradas, ordenarPor, ordemDirecao]);

  // Paginação
  const totalPaginas = Math.ceil(unidadesOrdenadas.length / ITENS_POR_PAGINA) || 1;
  const unidadesPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return unidadesOrdenadas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [unidadesOrdenadas, paginaAtual]);

  // Exportação CSV (Regra AGENTS.md: separador ';' e UTF-8 BOM '\uFEFF')
  const exportarCsv = () => {
    const cabecalho = [
      "ID",
      "Nome da Unidade",
      "Tribunal",
      "Ramo",
      "Tipo",
      "Comarca/Subseção",
      "UF",
      "Coordenador/Magistrado",
      "Cargo",
      "Telefone",
      "WhatsApp Balcão",
      "E-mail",
      "Endereço Completo",
      "Link Balcão Virtual",
      "Horário de Atendimento",
      "Designação (ato)",
      "Data da designação",
    ];

    const linhas = unidadesOrdenadas.map((u) => [
      `"${u.id}"`,
      `"${u.nome}"`,
      `"${u.tribunalSigla.toUpperCase()}"`,
      `"${u.ramo}"`,
      `"${u.tipo}"`,
      `"${u.comarcaOuSubsecao}"`,
      `"${u.uf}"`,
      `"${u.coordenador.nome}"`,
      `"${u.coordenador.cargo}"`,
      `"${u.telefone}"`,
      `"${u.whatsappBalcao || ""}"`,
      `"${u.email}"`,
      `"${u.endereco}"`,
      `"${u.linkBalcaoVirtual}"`,
      `"${u.horarioAtendimento || "12:00 às 18:00"}"`,
      `"${u.designacao?.ato || ""}"`,
      `"${u.designacao?.data || ""}"`,
    ]);

    const csvConteudo = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `contatos-judiciario-${ufFiltro.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contagem para Gráfico
  const maxContagemRamo = Math.max(
    estatisticas.porRamo.estadual,
    estatisticas.porRamo.federal,
    estatisticas.porRamo.trabalho
  );

  return (
    <div className="space-y-8">
      {/* 1. Status / 4 Cartões de Topo (Regra AGENTS.md) */}
      <div id="resumo-geral" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Scale size={16} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Geral</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-text">
            {estatisticas.totalUnidades}
          </p>
          <p className="text-xs text-text-soft">Unidades e varas catalogadas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Building2 size={16} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Varas 1º Grau</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-text">
            {estatisticas.totalVaras}
          </p>
          <p className="text-xs text-text-soft">Cíveis, criminais e juizados</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Briefcase size={16} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Gabinetes & Câmaras</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-text">
            {estatisticas.totalGabinetes + estatisticas.totalSecretarias}
          </p>
          <p className="text-xs text-text-soft">2º Grau e coordenações</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Sparkles size={16} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Balcões Virtuais</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-black text-text">
            {estatisticas.totalBalcoesVirtuais}
          </p>
          <p className="text-xs text-text-soft">Atendimento remoto ativo</p>
        </div>
      </div>

      {/* 2. Gráfico SVG Inline de Distribuição (Regra AGENTS.md) */}
      <section
        id="grafico-distribuicao"
        aria-labelledby="secao-grafico"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 id="secao-grafico" className="font-display text-base font-bold text-text">
              Distribuição por Ramo do Poder Judiciário
            </h2>
            <p className="text-xs text-text-soft">
              Composição das unidades em todo o território nacional e cobertura em Minas Gerais.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-soft">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600" />
            <span>Estadual ({estatisticas.porRamo.estadual})</span>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span>Federal ({estatisticas.porRamo.federal})</span>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600" />
            <span>Trabalho ({estatisticas.porRamo.trabalho})</span>
          </div>
        </div>

        {/* SVG Inline de Barras Horizontais */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-text">
              <span>Justiça Estadual (Tribunais de Justiça e Comarcas)</span>
              <span className="font-mono">{estatisticas.porRamo.estadual} unidades ({Math.round((estatisticas.porRamo.estadual / estatisticas.totalUnidades) * 100)}%)</span>
            </div>
            <div className="mt-1 h-3.5 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-500"
                style={{ width: `${(estatisticas.porRamo.estadual / maxContagemRamo) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text">
              <span>Justiça Federal (TRFs, Seções e Juizados Especiais Federais)</span>
              <span className="font-mono">{estatisticas.porRamo.federal} unidades ({Math.round((estatisticas.porRamo.federal / estatisticas.totalUnidades) * 100)}%)</span>
            </div>
            <div className="mt-1 h-3.5 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${(estatisticas.porRamo.federal / maxContagemRamo) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text">
              <span>Justiça do Trabalho (TRTs e Fóruns Trabalhistas)</span>
              <span className="font-mono">{estatisticas.porRamo.trabalho} unidades ({Math.round((estatisticas.porRamo.trabalho / estatisticas.totalUnidades) * 100)}%)</span>
            </div>
            <div className="mt-1 h-3.5 w-full rounded-full bg-teal-600 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${(estatisticas.porRamo.trabalho / maxContagemRamo) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Barra de Controles: Filtros, Busca, Ordenação e Planilha CSV (Regras 3, 4 e 5) */}
      <div id="filtros-busca" className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        {/* Filtro Rápido de Estado / UF */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase text-text-soft">Filtrar Estado:</span>
            <button
              onClick={() => { setUfFiltro("MG"); setPaginaAtual(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                ufFiltro === "MG"
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-text hover:bg-border/60"
              }`}
            >
              ⭐ Minas Gerais ({unidadesIniciais.filter((u) => u.uf === "MG").length})
            </button>
            <button
              onClick={() => { setUfFiltro("todos"); setPaginaAtual(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                ufFiltro === "todos"
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-text hover:bg-border/60"
              }`}
            >
              Brasil Todo ({unidadesIniciais.length})
            </button>
            {listaUfs
              .filter((uf) => uf !== "MG")
              .map((uf) => (
                <button
                  key={uf}
                  onClick={() => { setUfFiltro(uf); setPaginaAtual(1); }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    ufFiltro === uf
                      ? "bg-primary text-primary-contrast"
                      : "bg-surface-2 text-text-soft hover:text-text hover:bg-border/50"
                  }`}
                >
                  {uf}
                </button>
              ))}
          </div>

          {/* Botão de Exportar Planilha CSV */}
          <button
            onClick={exportarCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-2xs transition-colors hover:border-primary hover:text-primary"
            title="Baixar planilha formatada (separador ; e UTF-8 BOM para Excel)"
          >
            <Download size={14} aria-hidden="true" />
            <span>Baixar Planilha CSV ({unidadesOrdenadas.length})</span>
          </button>
        </div>

        {/* Linha de Busca Textual e Filtros Complementares */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Campo de Busca */}
          <div className="relative sm:col-span-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
              placeholder="Buscar por vara, juiz, comarca, e-mail ou telefone..."
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Filtro de Ramo */}
          <div className="sm:col-span-3">
            <select
              value={ramoFiltro}
              onChange={(e) => { setRamoFiltro(e.target.value); setPaginaAtual(1); }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="todos">Todos os Ramos</option>
              <option value="Estadual">Justiça Estadual (TJ)</option>
              <option value="Federal">Justiça Federal (TRF)</option>
              <option value="Trabalho">Justiça do Trabalho (TRT)</option>
            </select>
          </div>

          {/* Filtro de Tipo */}
          <div className="sm:col-span-2">
            <select
              value={tipoFiltro}
              onChange={(e) => { setTipoFiltro(e.target.value); setPaginaAtual(1); }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Vara">Varas Judiciais</option>
              <option value="Juizado Especial">Juizados Especiais</option>
              <option value="Gabinete">Gabinetes</option>
              <option value="Secretaria">Secretarias</option>
              <option value="CEJUSC">CEJUSC / Conciliação</option>
            </select>
          </div>

          {/* Alternância de Modo de Visualização e Ordenação */}
          <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
            <button
              onClick={() => setModoVisualizacao("cards")}
              className={`rounded-lg p-2 transition-colors ${
                modoVisualizacao === "cards"
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-text-soft hover:text-text"
              }`}
              title="Visualização em Cartões"
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
            <button
              onClick={() => setModoVisualizacao("tabela")}
              className={`rounded-lg p-2 transition-colors ${
                modoVisualizacao === "tabela"
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-text-soft hover:text-text"
              }`}
              title="Visualização em Tabela Compacta"
            >
              <TableIcon size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Resumo de Resultados Ativos */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-text-soft">
          <span>
            Exibindo <strong>{unidadesOrdenadas.length}</strong> unidades judiciárias encontradas
            {ufFiltro !== "todos" ? ` em ${ufFiltro}` : " em todo o Brasil"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Ordenar por:</span>
            <button
              onClick={() => {
                if (ordenarPor === "comarca") setOrdemDirecao(ordemDirecao === "asc" ? "desc" : "asc");
                else { setOrdenarPor("comarca"); setOrdemDirecao("asc"); }
              }}
              className={`inline-flex items-center gap-1 font-semibold ${ordenarPor === "comarca" ? "text-primary underline" : "hover:text-text"}`}
            >
              Comarca {ordenarPor === "comarca" && (ordemDirecao === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => {
                if (ordenarPor === "nome") setOrdemDirecao(ordemDirecao === "asc" ? "desc" : "asc");
                else { setOrdenarPor("nome"); setOrdemDirecao("asc"); }
              }}
              className={`inline-flex items-center gap-1 font-semibold ${ordenarPor === "nome" ? "text-primary underline" : "hover:text-text"}`}
            >
              Nome {ordenarPor === "nome" && (ordemDirecao === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Lista de Unidades Judiciárias */}
      <section id="catalogo-unidades" aria-label="Catálogo de Unidades Judiciárias">
        {unidadesOrdenadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Scale size={32} className="mx-auto text-text-soft opacity-40" aria-hidden="true" />
          <p className="mt-3 font-semibold text-text">Nenhuma unidade encontrada com estes filtros.</p>
          <p className="mt-1 text-xs text-text-soft">
            Tente remover os filtros de busca ou selecionar &quot;Todos os Estados&quot;.
          </p>
          <button
            onClick={() => { setBusca(""); setRamoFiltro("todos"); setTipoFiltro("todos"); setUfFiltro("todos"); }}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-contrast"
          >
            Limpar Filtros
          </button>
        </div>
      ) : modoVisualizacao === "cards" ? (
        /* Visualização em Cartões */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unidadesPaginadas.map((u) => (
            <div
              key={u.id}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-surface p-5 shadow-xs transition-all hover:border-primary/50"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[0.9em] font-bold uppercase tracking-wider ${
                      u.ramo === "Estadual"
                        ? "border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                        : u.ramo === "Federal"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400"
                    }`}
                  >
                    {u.tribunalSigla.toUpperCase()} · {u.ramo} · {u.tipo}
                  </span>
                  <span className="font-mono text-xs font-bold text-text-soft">
                    {u.comarcaOuSubsecao} ({u.uf})
                  </span>
                </div>

                <h3 className="mt-2.5 font-display text-base font-bold text-text line-clamp-2">
                  {u.nome}
                </h3>

                {/* Coordenador / Juiz Titular */}
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface-2/40 px-2.5 py-1.5 text-xs">
                  <User size={14} className="text-primary shrink-0" aria-hidden="true" />
                  <div className="overflow-hidden">
                    <p className="truncate font-bold text-text">{u.coordenador.nome}</p>
                    <p className="text-xs text-text-soft truncate">{u.coordenador.cargo}</p>
                    {u.designacao?.data && (
                      <p className="mt-0.5 text-[11px] text-primary truncate">
                        Em exercício desde {formatDataBR(u.designacao.data)}
                        {u.designacao.ato ? ` (${u.designacao.ato})` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contatos e Endereço */}
                <div className="mt-3 space-y-1.5 text-xs text-text-soft">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Phone size={13} className="text-primary shrink-0" aria-hidden="true" />
                    <a
                      href={`tel:${u.telefone.replace(/[^\d+]/g, "")}`}
                      className="font-mono text-text hover:text-primary hover:underline truncate"
                    >
                      {u.telefone}
                    </a>
                    {u.whatsappBalcao && (
                      <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-xs font-bold text-emerald-600">
                        WhatsApp
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail size={13} className="text-primary shrink-0" aria-hidden="true" />
                    <a
                      href={`mailto:${u.email}`}
                      className="text-text hover:text-primary hover:underline truncate"
                      title={u.email}
                    >
                      {u.email}
                    </a>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-xs leading-relaxed">
                    <MapPin size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="line-clamp-2" title={u.endereco}>
                      {u.endereco}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação: Balcão Virtual */}
              <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between text-xs">
                <span className="text-xs text-text-soft flex items-center gap-1">
                  <Clock size={11} aria-hidden="true" />
                  {u.horarioAtendimento || "12h às 18h"}
                </span>
                <a
                  href={u.linkBalcaoVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <span>Balcão Virtual</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Visualização em Tabela Compacta */
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-[0.9em] font-bold uppercase tracking-wider text-text-soft">
                <th className="px-4 py-3">Comarca/UF</th>
                <th className="px-4 py-3">Unidade / Vara</th>
                <th className="px-4 py-3">Ramo</th>
                <th className="px-4 py-3">Coordenador / Juiz</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3 text-right">Balcão Virtual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {unidadesPaginadas.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-text whitespace-nowrap">
                    {u.comarcaOuSubsecao} <span className="font-mono text-text-soft">({u.uf})</span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-text">
                    <p className="line-clamp-1">{u.nome}</p>
                    <span className="text-xs font-normal text-text-soft">{u.tipo} · {u.tribunalSigla.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[0.9em] font-bold uppercase ${
                        u.ramo === "Estadual"
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                          : u.ramo === "Federal"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-teal-500/10 text-teal-700 dark:text-teal-400"
                      }`}
                    >
                      {u.ramo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text">
                    <p className="font-medium line-clamp-1">{u.coordenador.nome}</p>
                    <p className="text-xs text-text-soft">{u.coordenador.cargo}</p>
                    {u.designacao?.data && (
                      <p className="mt-0.5 text-[11px] text-primary">
                        desde {formatDataBR(u.designacao.data)}
                        {u.designacao.ato ? ` · ${u.designacao.ato}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text whitespace-nowrap">
                    <a href={`tel:${u.telefone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
                      {u.telefone}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-text">
                    <a href={`mailto:${u.email}`} className="hover:text-primary underline truncate max-w-[180px] block">
                      {u.email}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <a
                      href={u.linkBalcaoVirtual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>Acessar</span>
                      <ExternalLink size={10} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Controles de Paginação */}
      {totalPaginas > 1 && (
        <nav aria-label="Paginação de contatos" className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-text-soft">
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              <span>Próxima</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
      </section>
    </div>
  );
}
