"use client";

import { useState, useMemo } from "react";
import { ItemDocumentoDesastre } from "@/lib/ambiental/biblioteca-desastres";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import { Search, Download, FileText, ExternalLink, Filter, Tag, ArrowUpDown } from "lucide-react";

interface Props {
  documentos: ItemDocumentoDesastre[];
  total_documentos: number;
  totais: {
    brumadinho_paraopeba: number;
    mariana_rio_doce: number;
    nacional: number;
    regioes_mg: Record<string, number>;
    esferas: Record<string, number>;
    ufs: Record<string, number>;
    acoes_coletivas: number;
    instituicoes_justica: Record<string, number>;
  };
  regioes_disponiveis: string[];
  tipos_disponiveis: string[];
}

type SortField = "titulo" | "data" | "orgao" | "tipo" | "uf" | "bacia" | "desastre";

export default function TabelaDesastresClient({ documentos, total_documentos, totais, regioes_disponiveis, tipos_disponiveis }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroDesastre, setFiltroDesastre] = useState("todos");
  const [filtroUf, setFiltroUf] = useState("todas");
  const [filtroRegiao, setFiltroRegiao] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todas");
  const [filtroAcaoColetiva, setFiltroAcaoColetiva] = useState(false);
  const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const tagsUnicas = useMemo(() => {
    const t = new Set<string>();
    for (const d of documentos) {
      for (const tag of d.tags) t.add(tag);
    }
    return [...t].sort();
  }, [documentos]);

  const filtrados = useMemo(() => {
    let result = documentos.filter((d) => {
      const matchBusca =
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        d.orgao.toLowerCase().includes(busca.toLowerCase()) ||
        (d.resumo && d.resumo.toLowerCase().includes(busca.toLowerCase())) ||
        d.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()));

      const matchDesastre = filtroDesastre === "todos" || d.desastre === filtroDesastre;
      const matchUf = filtroUf === "todas" || d.uf === filtroUf;
      const matchRegiao = filtroRegiao === "todas" || d.bacia === filtroRegiao || d.regiao_mg === filtroRegiao;
      const matchTipo = filtroTipo === "todas" || d.tipo === filtroTipo;
      const matchAcaoColetiva = !filtroAcaoColetiva || d.acao_coletiva === true;
      const matchTag = !tagSelecionada || d.tags.includes(tagSelecionada);

      return matchBusca && matchDesastre && matchUf && matchRegiao && matchTipo && matchAcaoColetiva && matchTag;
    });

    result.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [documentos, busca, filtroDesastre, filtroUf, filtroRegiao, filtroTipo, filtroAcaoColetiva, tagSelecionada, sortField, sortDir]);

  const exportarCsv = () => {
    const cabecalho = "ID;Desastre;Bacia;Caso Nacional;Região MG;Ação Coletiva;Instituição Justiça;Título;Data;Tipo;Órgão;Esfera;UF;Tags;Classificável;Resumo;URL Oficial\n";
    const linhas = filtrados.map((d) =>
      `"${d.id}";"${d.desastre}";"${d.bacia}";"${d.caso_nacional ?? ""}";"${d.regiao_mg ?? ""}";"${d.acao_coletiva ? "SIM" : "NÃO"}";"${d.instituicao_justica ?? ""}";"${d.titulo}";"${d.data ?? ""}";"${d.tipo}";"${d.orgao}";"${d.esfera}";"${d.uf}";"${d.tags.join(", ")}";"${d.classificavel ? "SIM" : "NÃO"}";"${d.resumo ?? ""}";"${d.url}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biblioteca-crimes-socioambientais.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroDesastre("todos");
    setFiltroUf("todas");
    setFiltroRegiao("todas");
    setFiltroTipo("todas");
    setFiltroAcaoColetiva(false);
    setTagSelecionada(null);
    setSortField("data");
    setSortDir("desc");
  };

  const filtroAtivoCount = [filtroDesastre !== "todos", filtroUf !== "todas", filtroRegiao !== "todas", filtroTipo !== "todas", filtroAcaoColetiva, tagSelecionada !== null].filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* GRÁFICO SVG NATIVO: DISTRIBUIÇÃO DOCUMENTAL */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Acervo Documental Unificado: Expansão Regional + Nacional + Ações Coletivas
            </h3>
            <p className="text-xs text-muted">
              {total_documentos} documentos oficiais mapeados: {totais.brumadinho_paraopeba} Brumadinho/Paraopeba, {totais.mariana_rio_doce} Mariana/Rio Doce, {totais.nacional} nacional, {totais.acoes_coletivas} ações coletivas.
            </p>
          </div>
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo={`Biblioteca Unificada de Crimes Socioambientais: ${total_documentos} Laudos e Documentos Oficiais`}
            orgaoTerritorio="MG, ES, BA, BR e internacional"
            identificador="ONSA / Controle Popular"
            link="https://controlepopular.com.br/ambiental/crimes-socioambientais"
            resumo="Catálogo de laudos de saúde, perícias ambientais, TACs, notas técnicas ministeriais e ações coletivas dos rompimentos de barragens."
            rotulo="Divulgar Acervo de Documentos"
          />
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <span className="text-xs font-semibold text-muted">Distribuição por Desastre / Caso:</span>
            <div className="mt-2 flex h-8 w-full overflow-hidden rounded-xl bg-surface-2">
              <div style={{ width: `${total_documentos > 0 ? (totais.brumadinho_paraopeba / total_documentos) * 100 : 0}%` }} className="flex items-center justify-center bg-amber-600 text-[11px] font-bold text-white">Brumadinho ({totais.brumadinho_paraopeba})</div>
              <div style={{ width: `${total_documentos > 0 ? (totais.mariana_rio_doce / total_documentos) * 100 : 0}%` }} className="flex items-center justify-center bg-cyan-700 text-[11px] font-bold text-white">Mariana ({totais.mariana_rio_doce})</div>
              <div style={{ width: `${total_documentos > 0 ? (totais.nacional / total_documentos) * 100 : 0}%` }} className="flex items-center justify-center bg-indigo-600 text-[11px] font-bold text-white">Nacional ({totais.nacional})</div>
            </div>
          </div>
          <div>
            <span className="text-xs font-semild text-muted">Cobertura Territorial:</span>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl border border-border bg-surface-2 p-2.5"><span className="font-bold text-foreground">MG</span><p className="mt-1 font-display text-base font-bold text-primary">{totais.ufs.MG}</p></div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5"><span className="font-bold text-foreground">ES</span><p className="mt-1 font-display text-base font-bold text-teal-600">{totais.ufs.ES}</p></div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5"><span className="font-bold text-foreground">BA</span><p className="mt-1 font-display text-base font-bold text-amber-600">{totais.ufs.BA}</p></div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5"><span className="font-bold text-foreground">BR</span><p className="mt-1 font-display text-base font-bold text-indigo-600">{totais.ufs.BR ?? 0}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input type="text" placeholder="Buscar por laudo, órgão, tema ou caso..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            {["todos", "brumadinho", "mariana", "nacional"].map((opt) => (
              <button key={opt} onClick={() => setFiltroDesastre(opt)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${filtroDesastre === opt ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}>{opt === "todos" ? `Todos (${documentos.length})` : opt === "brumadinho" ? `Brumadinho ({totais.brumadinho_paraopeba})` : opt === "mariana" ? `Mariana ({totais.mariana_rio_doce})` : `Nacional ({totais.nacional})`}</button>
            ))}
          </div>

          <select value={filtroUf} onChange={(e) => setFiltroUf(e.target.value)} className="rounded-lg border border-border bg-surface py-2 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none">
            <option value="todas">Todas as UFs</option><option value="MG">MG</option><option value="ES">ES</option><option value="BA">BA</option><option value="BR">BR</option>
          </select>

          <select value={filtroRegiao} onChange={(e) => setFiltroRegiao(e.target.value)} className="rounded-lg border border-border bg-surface py-2 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none">
            <option value="todas">Todas as Regiões</option>{regioes_disponiveis.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded-lg border border-border bg-surface py-2 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none">
            <option value="todas">Todos os Tipos</option>{tipos_disponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={() => setFiltroAcaoColetiva(!filtroAcaoColetiva)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${filtroAcaoColetiva ? "bg-primary text-primary-foreground" : "border-border bg-surface-2 text-muted hover:text-foreground"}`}>
            <Filter className="inline h-3 w-3 mr-1" />Ação Coletiva
          </button>

          {tagSelecionada && (
            <button onClick={() => setTagSelecionada(null)} className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              <Tag className="inline h-3 w-3 mr-1" />{tagSelecionada} ✕
            </button>
          )}

          <button onClick={limparFiltros} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground">
            Limpar ({filtroAtivoCount})
          </button>

          <button onClick={exportarCsv} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface">
            <Download className="h-3.5 w-3.5" />CSV ({filtrados.length})
          </button>
        </div>

        {/* TAGS CLICÁVEIS PARA FILTRAR */}
        <div className="flex flex-wrap gap-1.5">
          {tagsUnicas.slice(0, 20).map((tag) => (
            <button key={tag} onClick={() => setTagSelecionada(tagSelecionada === tag ? null : tag)} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${tagSelecionada === tag ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border text-muted hover:text-foreground"}`}>#{tag}</button>
          ))}
        </div>
      </div>

      {/* ORDENAÇÃO */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs text-muted">
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span>Ordenar por:</span>
        {(["data", "titulo", "orgao", "tipo", "uf", "bacia"] as SortField[]).map((f) => (
          <button key={f} onClick={() => toggleSort(f)} className={`rounded px-2 py-0.5 font-semibold transition-colors ${sortField === f ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}>
            {f} {sortField === f ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>

      {/* LISTA DE DOCUMENTOS */}
      <div className="grid gap-4">
        {filtrados.map((doc) => (
          <article key={doc.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${doc.desastre === "brumadinho" ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300" : doc.desastre === "mariana" ? "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300" : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"}`}>
                  {doc.desastre === "brumadinho" ? "Brumadinho" : doc.desastre === "mariana" ? "Mariana" : doc.desastre === "nacional" ? "Nacional" : doc.desastre}
                </span>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">{doc.tipo}</span>
                <span className="text-xs text-muted">UF: <strong>{doc.uf}</strong> {doc.data ? `• ${doc.data}` : ""}</span>
                {doc.regiao_mg && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{doc.regiao_mg}</span>}
                {doc.acao_coletiva && <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">⚖ Ação Coletiva</span>}
                {doc.instituicao_justica && <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{doc.instituicao_justica}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">{doc.orgao}</span>
                {doc.classificavel && <span className="text-[10px] text-muted bg-surface-2 px-1.5 py-0.5 rounded">classificável</span>}
                <BotaoAlertaContextual tipo="resumo_pagina" titulo={`${doc.orgao}: ${doc.titulo}`} orgaoTerritorio={`${doc.desastre === "brumadinho" ? "Bacia do Paraopeba" : doc.desastre === "mariana" ? "Bacia do Rio Doce" : "Nacional"} (${doc.uf})`} identificador={`${doc.tipo} — ${doc.orgao}`} link={doc.url} resumo={doc.resumo || undefined} variante="icone" />
              </div>
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-foreground">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline inline-flex items-center gap-1.5">
                <span>{doc.titulo}</span><ExternalLink className="h-3.5 w-3.5 text-muted shrink-0" />
              </a>
            </h3>
            {doc.resumo ? <p className="mt-2 text-xs text-muted leading-relaxed">{doc.resumo}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.tags.map((tag) => (
                <button key={tag} onClick={() => setTagSelecionada(tagSelecionada === tag ? null : tag)} className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${tagSelecionada === tag ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border text-muted hover:text-foreground"}`}>#{tag}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
