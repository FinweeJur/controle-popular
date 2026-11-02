"use client";

/**
 * ═══ PAINEL INTERATIVO DE CONCURSOS PÚBLICOS E TEMPORÁRIOS ═══
 *
 * O que é:
 *   Interface cívica interativa para consulta, filtragem multidimensional,
 *   busca tolerante a acentos e exportação de concursos públicos e seleções
 *   temporárias (PSS) em âmbito federal, estadual (27 UFs) e municipal.
 *
 * Fonte oficial:
 *   Diários Oficiais da União (DOU), Diários Oficiais dos Estados e Municípios,
 *   bancas organizadoras oficiais credenciadas (Cebraspe, FGV, FCC, Vunesp, Fundep, etc.).
 *
 * Por que foi feito assim:
 *   - Regra 5.14: Responsivo para telas a partir de 390px (sem rolagem lateral falsa).
 *   - Regra 5.16: Fonte minima de 12px em texto de interface (proibido classes abaixo de text-xs).
 *   - Regra 5.9: Comentário explicativo de cabeçalho.
 *   - 8 Qualidades da Informação: links oficiais diretos, gráficos SVG nativos sem
 *     dependências externas, ordenação por coluna e exportação CSV com BOM UTF-8 e ponto-e-vírgula.
 */

import { useMemo, useState } from "react";
import {
  Search,
  Download,
  Printer,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  X,
} from "lucide-react";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";
import {
  concursosParaCsv,
  filtrarConcursos,
  ordenarConcursos,
  type ChaveOrdenacaoConcurso,
  type DirecaoOrdenacao,
  type ItemConcurso,
} from "@/lib/concursos";
import { formatNumberBR } from "@/lib/betim/format";

const TODOS = "";
const ITENS_INICIAIS = 20;

interface PropsPainel {
  itens: ItemConcurso[];
  esferas: string[];
  poderes: string[];
  modalidades: string[];
  escolaridades: string[];
  statusList: string[];
  ufs: string[];
  distribuicoes: {
    esfera: { chave: string; total: number }[];
    poder: { chave: string; total: number }[];
    modalidade: { chave: string; total: number }[];
  };
}

export default function PainelConcursos({
  itens,
  esferas,
  poderes,
  modalidades,
  escolaridades,
  statusList,
  ufs,
  distribuicoes,
}: PropsPainel) {
  const [busca, setBusca] = useState("");
  const [esferaFiltro, setEsferaFiltro] = useState(TODOS);
  const [poderFiltro, setPoderFiltro] = useState(TODOS);
  const [modalidadeFiltro, setModalidadeFiltro] = useState(TODOS);
  const [escolaridadeFiltro, setEscolaridadeFiltro] = useState(TODOS);
  const [statusFiltro, setStatusFiltro] = useState(TODOS);
  const [ufFiltro, setUfFiltro] = useState(TODOS);
  const [somenteSalarioAlto, setSomenteSalarioAlto] = useState(false);

  // Ordenação
  const [ordem, setOrdem] = useState<{
    chave: ChaveOrdenacaoConcurso;
    direcao: DirecaoOrdenacao;
  }>({
    chave: "remuneracao",
    direcao: "desc",
  });

  // Paginação progressiva
  const [limiteExibicao, setLimiteExibicao] = useState(ITENS_INICIAIS);

  // Item selecionado para exibição de detalhes completos
  const [itemDetalhe, setItemDetalhe] = useState<ItemConcurso | null>(null);

  // Aplicação dos filtros em lógica pura
  const filtrados = useMemo(() => {
    let lista = filtrarConcursos(itens, {
      busca,
      esfera: esferaFiltro,
      poder: poderFiltro,
      modalidade: modalidadeFiltro,
      escolaridade: escolaridadeFiltro,
      status: statusFiltro,
      uf: ufFiltro,
    });

    if (somenteSalarioAlto) {
      lista = lista.filter((i) => i.remuneracaoNumMax >= 10000);
    }

    if (ordem) {
      lista = ordenarConcursos(lista, ordem.chave, ordem.direcao);
    }

    return lista;
  }, [
    itens,
    busca,
    esferaFiltro,
    poderFiltro,
    modalidadeFiltro,
    escolaridadeFiltro,
    statusFiltro,
    ufFiltro,
    somenteSalarioAlto,
    ordem,
  ]);

  const temFiltroAtivo = Boolean(
    busca ||
      esferaFiltro ||
      poderFiltro ||
      modalidadeFiltro ||
      escolaridadeFiltro ||
      statusFiltro ||
      ufFiltro ||
      somenteSalarioAlto
  );

  const visiveis = filtrados.slice(0, limiteExibicao);
  const temMais = filtrados.length > limiteExibicao;

  function alternarOrdem(chave: ChaveOrdenacaoConcurso) {
    setOrdem((atual) => {
      if (atual.chave === chave) {
        return {
          chave,
          direcao: atual.direcao === "asc" ? "desc" : "asc",
        };
      }
      return { chave, direcao: "desc" };
    });
  }

  function limparFiltros() {
    setBusca("");
    setEsferaFiltro(TODOS);
    setPoderFiltro(TODOS);
    setModalidadeFiltro(TODOS);
    setEscolaridadeFiltro(TODOS);
    setStatusFiltro(TODOS);
    setUfFiltro(TODOS);
    setSomenteSalarioAlto(false);
    setLimiteExibicao(ITENS_INICIAIS);
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    const csv = concursosParaCsv(filtrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `concursos-publicos-brasil-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function dispararImpressao() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  // Estatísticas calculadas para a seleção filtrada
  const vagasFiltradas = useMemo(() => {
    return filtrados.reduce((acc, curr) => acc + (curr.vagasImediatas || 0), 0);
  }, [filtrados]);

  // Gráfico SVG nativo por Esfera
  const maxEsfera = Math.max(1, ...distribuicoes.esfera.map((d) => d.total));

  return (
    <section className="mt-8 w-full max-w-full min-w-0 space-y-8" aria-label="Painel de concursos públicos e temporários">
      {/* ─── 1. GRÁFICOS SVG NATIVOS INLINE ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 print:hidden">
        {/* Distribuição por Esfera */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-text">
                Distribuição por Esfera
              </h2>
              <p className="text-xs text-text-soft">
                Total de certames catalogados por nível federativo
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {itens.length} certames
            </span>
          </div>

          <div className="mt-5 space-y-3" role="img" aria-label="Gráfico de certames por esfera federativa">
            {distribuicoes.esfera.map((item) => {
              const pct = Math.round((item.total / maxEsfera) * 100);
              return (
                <div key={item.chave} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text">{item.chave}</span>
                    <span className="font-mono text-text-soft">
                      {formatNumberBR(item.total)} certames ({Math.round((item.total / itens.length) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Modalidade */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-text">
                Modalidade de Ingresso
              </h2>
              <p className="text-xs text-text-soft">
                Concursos efetivos vs. contratações temporárias e PSS
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              Estatutário & Temporário
            </span>
          </div>

          <div className="mt-5 space-y-3" role="img" aria-label="Gráfico de certames por modalidade de ingresso">
            {distribuicoes.modalidade.map((item) => {
              const maxModalidade = Math.max(1, ...distribuicoes.modalidade.map((d) => d.total));
              const pct = Math.round((item.total / maxModalidade) * 100);
              return (
                <div key={item.chave} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text">{item.chave}</span>
                    <span className="font-mono text-text-soft">
                      {formatNumberBR(item.total)} certames
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 2. BARRA DE BUSCA, FACETAS E FILTROS ───────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm min-w-0 print:hidden space-y-4">
        {/* Caixa de Busca com Ícone e Limpeza */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft pointer-events-none" />
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            placeholder="Buscar por órgão, cargo, banca, município, estado ou palavra-chave..."
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-10 text-sm text-text placeholder:text-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-soft hover:text-text"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Facetas Dropdowns */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {/* Esfera */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">Esfera</label>
            <select
              value={esferaFiltro}
              onChange={(e) => {
                setEsferaFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Todas as esferas</option>
              {esferas.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Poder */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">Poder</label>
            <select
              value={poderFiltro}
              onChange={(e) => {
                setPoderFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Todos os poderes</option>
              {poderes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Modalidade */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">Modalidade</label>
            <select
              value={modalidadeFiltro}
              onChange={(e) => {
                setModalidadeFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Todas modalidades</option>
              {modalidades.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Escolaridade */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">Escolaridade</label>
            <select
              value={escolaridadeFiltro}
              onChange={(e) => {
                setEscolaridadeFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Todos os níveis</option>
              {escolaridades.map((esc) => (
                <option key={esc} value={esc}>
                  {esc}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Todos os status</option>
              {statusList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* UF */}
          <div className="space-y-1">
            <label className="font-semibold text-text-soft">UF / Estado</label>
            <select
              value={ufFiltro}
              onChange={(e) => {
                setUfFiltro(e.target.value);
                setLimiteExibicao(ITENS_INICIAIS);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={TODOS}>Brasil (todas)</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chips de Acesso Rápido */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs font-medium text-text-soft">Atalhos cívicos:</span>
          <button
            type="button"
            onClick={() => {
              setStatusFiltro("Inscrições Abertas");
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFiltro === "Inscrições Abertas"
                ? "bg-emerald-600 text-white"
                : "bg-surface-2 text-text hover:bg-border"
            }`}
          >
            🟢 Inscrições Abertas
          </button>

          <button
            type="button"
            onClick={() => {
              setModalidadeFiltro("Processo Seletivo Simplificado (PSS)");
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              modalidadeFiltro === "Processo Seletivo Simplificado (PSS)"
                ? "bg-primary text-white"
                : "bg-surface-2 text-text hover:bg-border"
            }`}
          >
            📋 PSS / Temporários
          </button>

          <button
            type="button"
            onClick={() => {
              setEsferaFiltro("Federal");
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              esferaFiltro === "Federal"
                ? "bg-primary text-white"
                : "bg-surface-2 text-text hover:bg-border"
            }`}
          >
            🏛️ Federais
          </button>

          <button
            type="button"
            onClick={() => {
              setPoderFiltro("Judiciário");
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              poderFiltro === "Judiciário"
                ? "bg-primary text-white"
                : "bg-surface-2 text-text hover:bg-border"
            }`}
          >
            ⚖️ Judiciário
          </button>

          <button
            type="button"
            onClick={() => {
              setSomenteSalarioAlto(!somenteSalarioAlto);
              setLimiteExibicao(ITENS_INICIAIS);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              somenteSalarioAlto
                ? "bg-amber-600 text-white"
                : "bg-surface-2 text-text hover:bg-border"
            }`}
          >
            💰 Salários ≥ R$ 10.000
          </button>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-500/20"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. BARRA DE CONTROLE: CONTAGEM, ORDENAÇÃO E EXPORTAÇÃO ──────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-semibold text-text">
            Exibindo {formatNumberBR(visiveis.length)} de {formatNumberBR(filtrados.length)} certames
            {temFiltroAtivo && ` (filtrados do total de ${itens.length})`}
          </p>
          <p className="text-xs text-text-soft">
            Totalizando {formatNumberBR(vagasFiltradas)} vagas imediatas disponíveis nos certames filtrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Botão Exportar CSV */}
          <button
            type="button"
            onClick={exportarCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-2 transition shadow-sm cursor-pointer"
            title="Download da seleção em arquivo CSV estruturado para Excel brasileiro"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Exportar CSV</span>
          </button>

          {/* Botão Imprimir */}
          <button
            type="button"
            onClick={dispararImpressao}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-2 transition shadow-sm cursor-pointer"
            title="Imprimir relatório da página atual"
          >
            <Printer className="h-3.5 w-3.5 text-text-soft" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* ─── 4. TABELA EM DESKTOP & CARDS ADAPTATIVOS EM MOBILE ─────────── */}
      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-display text-base font-semibold text-text">
            Nenhum certame localizado com os filtros selecionados.
          </p>
          <p className="mt-1 text-xs text-text-soft">
            Tente desmarcar filtros específicos ou busque por termos mais amplos.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-90 transition"
          >
            Redefinir todos os filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Versão Desktop: Tabela Estilizada */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-text-soft">
                  <th scope="col" className="p-3.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => alternarOrdem("orgao")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-text cursor-pointer"
                    >
                      Órgão / Ente
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => alternarOrdem("uf")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-text cursor-pointer"
                    >
                      UF / Âmbito
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    Esfera & Poder
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    Modalidade
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => alternarOrdem("vagas")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-text cursor-pointer"
                    >
                      Vagas
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => alternarOrdem("remuneracao")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-text cursor-pointer"
                    >
                      Remuneração Inicial
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => alternarOrdem("status")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-text cursor-pointer"
                    >
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th scope="col" className="p-3.5 font-semibold text-right">
                    Edital Oficial
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visiveis.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-2/60 transition-colors cursor-pointer"
                    onClick={() => setItemDetalhe(item)}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-text">{item.orgao}</div>
                      <div className="text-text-soft text-xs line-clamp-1 max-w-[220px]">
                        {item.nomeCompleto}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                        {item.uf}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-text font-medium">{item.esfera}</div>
                      <div className="text-text-soft text-xs">{item.poder}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                          item.modalidade === "Concurso Efetivo"
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20"
                        }`}
                      >
                        {item.modalidade}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-text">
                      <div>
                        <strong className="text-primary">{formatNumberBR(item.vagasImediatas)}</strong> imed.
                      </div>
                      {item.vagasCadastroReserva > 0 && (
                        <div className="text-text-soft text-xs">
                          +{formatNumberBR(item.vagasCadastroReserva)} CR
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-medium text-text">
                      {item.remuneracaoInicial}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "Inscrições Abertas"
                            ? "bg-emerald-600 text-white"
                            : item.status === "Edital Publicado"
                            ? "bg-sky-600 text-white"
                            : "bg-surface-2 text-text-soft border border-border"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={item.linkEdital}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:bg-surface-2 hover:border-primary transition"
                      >
                        <span>Acessar</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile (390px): Cartões Adaptativos sem rolagem lateral */}
          <div className="space-y-3 md:hidden">
            {visiveis.map((item) => (
              <article
                key={item.id}
                onClick={() => setItemDetalhe(item)}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3 cursor-pointer hover:border-primary/50 transition-all min-w-0"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-bold text-text">
                        {item.uf}
                      </span>
                      <span className="text-xs text-text-soft">· {item.esfera}</span>
                      <span className="text-xs text-text-soft">· {item.poder}</span>
                    </div>
                    <h3 className="mt-1 font-display text-sm font-bold text-text break-words">
                      {item.orgao}
                    </h3>
                    <p className="text-xs text-text-soft line-clamp-1">{item.nomeCompleto}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === "Inscrições Abertas"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-2 text-text-soft border border-border"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Modalidade e Remuneração */}
                <div className="rounded-xl bg-surface-2/60 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-text-soft font-medium">Remuneração:</span>
                    <span className="font-mono font-bold text-primary break-words text-right">
                      {item.remuneracaoInicial}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-text-soft font-medium">Vagas imediatas:</span>
                    <span className="font-mono font-semibold text-text">
                      {formatNumberBR(item.vagasImediatas)} vagas
                      {item.vagasCadastroReserva > 0 && ` (+${formatNumberBR(item.vagasCadastroReserva)} CR)`}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-text-soft font-medium">Modalidade:</span>
                    <span className="font-medium text-text">{item.modalidade}</span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-text-soft font-medium">Banca organizadora:</span>
                    <span className="font-medium text-text">{item.banca}</span>
                  </div>
                </div>

                {/* Período de Inscrição */}
                <div className="text-xs text-text-soft space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-soft shrink-0" />
                    <span>Inscrições: {item.periodoInscricao}</span>
                  </div>
                </div>

                {/* Botões de Ação do Card */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <BotaoPerguntarNono
                    pergunta={`Como funciona o certame do ${item.orgao} (${item.modalidade}) e quem tem direito à isenção da taxa?`}
                    rotulo="Perguntar ao Seu Nonô"
                  />

                  <a
                    href={item.linkEdital}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition"
                  >
                    <span>Edital Oficial</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Botão Carregar Mais */}
          {temMais && (
            <div className="pt-4 text-center print:hidden">
              <button
                type="button"
                onClick={() => setLimiteExibicao((prev) => prev + 25)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-6 py-2.5 text-xs font-semibold text-text shadow hover:bg-surface-2 transition cursor-pointer"
              >
                <span>
                  Carregar mais certames (+{Math.min(25, filtrados.length - limiteExibicao)} de{" "}
                  {filtrados.length - limiteExibicao} restantes)
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. MODAL / PAINEL DE DETALHES COMPLETOS DO EDITAL ──────────── */}
      {itemDetalhe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          onClick={() => setItemDetalhe(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-text">
                    {itemDetalhe.uf}
                  </span>
                  <span className="text-xs text-text-soft">· {itemDetalhe.esfera}</span>
                  <span className="text-xs text-text-soft">· {itemDetalhe.poder}</span>
                  <span className="text-xs text-text-soft">· {itemDetalhe.natureza}</span>
                </div>
                <h3 id="modal-titulo" className="mt-1 font-display text-lg font-bold text-text">
                  {itemDetalhe.orgao}
                </h3>
                <p className="text-xs text-text-soft">{itemDetalhe.nomeCompleto}</p>
              </div>

              <button
                type="button"
                onClick={() => setItemDetalhe(null)}
                className="rounded-full p-1 text-text-soft hover:bg-surface-2 hover:text-text"
                aria-label="Fechar detalhes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid de Informações Detalhadas */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Modalidade:</span>
                <p className="font-bold text-text">{itemDetalhe.modalidade}</p>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Remuneração Inicial:</span>
                <p className="font-bold text-primary">{itemDetalhe.remuneracaoInicial}</p>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Vagas Imediatas:</span>
                <p className="font-bold text-text">
                  {formatNumberBR(itemDetalhe.vagasImediatas)}
                  {itemDetalhe.vagasCadastroReserva > 0 &&
                    ` (+${formatNumberBR(itemDetalhe.vagasCadastroReserva)} em Cadastro de Reserva)`}
                </p>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Escolaridade Exigida:</span>
                <p className="font-bold text-text">{itemDetalhe.escolaridade}</p>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Banca Organizadora:</span>
                <p className="font-bold text-text">{itemDetalhe.banca}</p>
              </div>

              <div className="rounded-xl bg-surface-2 p-3 space-y-1">
                <span className="text-text-soft font-medium">Município / Abrangência:</span>
                <p className="font-bold text-text">{itemDetalhe.municipio} ({itemDetalhe.uf})</p>
              </div>
            </div>

            {/* Cargos e Especialidades */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-text">Cargos e Especialidades Ofertadas:</span>
              <div className="flex flex-wrap gap-1.5">
                {itemDetalhe.cargos.map((cargo) => (
                  <span
                    key={cargo}
                    className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-text"
                  >
                    {cargo}
                  </span>
                ))}
              </div>
            </div>

            {/* Inscrições, Taxas e Isenção */}
            <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-4 space-y-2 text-xs">
              <div>
                <strong className="text-text">Período de Inscrições:</strong>{" "}
                <span className="text-text-soft">{itemDetalhe.periodoInscricao}</span>
              </div>
              <div>
                <strong className="text-text">Taxa de Inscrição & Isenção:</strong>{" "}
                <span className="text-text-soft">{itemDetalhe.taxaInscricao}</span>
              </div>
              <div>
                <strong className="text-text">Previsão de Provas / Etapas:</strong>{" "}
                <span className="text-text-soft">{itemDetalhe.dataProva}</span>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <BotaoPerguntarNono
                pergunta={`Seu Nonô, me explique as regras do concurso do ${itemDetalhe.orgao} (${itemDetalhe.modalidade}) e como comprovar isenção de taxa?`}
                rotulo="Tirar dúvidas com Seu Nonô"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setItemDetalhe(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-2"
                >
                  Fechar
                </button>
                <a
                  href={itemDetalhe.linkEdital}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition"
                >
                  <span>Acessar Edital Oficial</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
