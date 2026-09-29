"use client";

/**
 * Lista interativa das Destinações de Imóveis da União em Minas Gerais.
 *
 * Implementa o padrão das seis qualidades do Controle Popular:
 * 1. Link direto e verificado à fonte oficial (SPU, URL por item).
 * 2. Busca em tempo real tolerante a acento e filtros por faceta
 *    (destinação, classe, proprietário).
 * 3. Ordenação crescente/decrescente por coluna (município, área,
 *    destinação, tipo).
 * 4. Cartões de topo com agregados medidos e microresumo cívico (Seu Nonô).
 * 5. Linguagem direta; a ressalva editorial fica visível, não escondida.
 * 6. Export CSV do filtrado (separador ';', BOM UTF-8) e impressão vetorial.
 *
 * Fonte do dado: SPU — Painel de Transparência Ativa. A lista chega pronta do
 * servidor (`page.tsx`); aqui só filtramos, ordenamos e exportamos.
 */

import { useState, useMemo } from "react";
import {
  type ImovelUniao,
  type MetricasDestinacoes,
  type MetadadosDestinacoesUniao,
  filtrarDestinacoes,
  calcularMetricasDestinacoes,
  gerarCsvDestinacoes,
  gerarMicroresumoDestinacoes,
} from "@/lib/ambiental/autorizacoes";

interface Props {
  metadados: MetadadosDestinacoesUniao;
  imoveis: ImovelUniao[];
}

type CampoOrdenacao = "municipio" | "areaHa" | "destinacao" | "tipo";

/** Formata hectares em pt-BR com duas casas. */
function formatarArea(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formata número inteiro em pt-BR. */
function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export default function AutorizacoesClient({ metadados, imoveis }: Props) {
  const [busca, setBusca] = useState("");
  const [destinacaoFiltro, setDestinacaoFiltro] = useState("todas");
  const [classeFiltro, setClasseFiltro] = useState("todas");
  const [proprietarioFiltro, setProprietarioFiltro] = useState("todos");

  const [colunaOrdenacao, setColunaOrdenacao] =
    useState<CampoOrdenacao>("areaHa");
  const [ordemCrescente, setOrdemCrescente] = useState(false);

  // Facetas disponíveis, derivadas do próprio dado (filtro nunca nasce vazio).
  const destinacoesDisponiveis = useMemo(
    () => [...new Set(imoveis.map((i) => i.destinacao))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [imoveis],
  );
  const classesDisponiveis = useMemo(
    () => [...new Set(imoveis.map((i) => i.classe))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [imoveis],
  );
  const proprietariosDisponiveis = useMemo(
    () => [...new Set(imoveis.map((i) => i.proprietario))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [imoveis],
  );

  // Recorte atual: o que os filtros deixam passar.
  const dadosFiltrados = useMemo(
    () =>
      filtrarDestinacoes(imoveis, {
        busca,
        destinacao: destinacaoFiltro,
        classe: classeFiltro,
        proprietario: proprietarioFiltro,
      }),
    [imoveis, busca, destinacaoFiltro, classeFiltro, proprietarioFiltro],
  );

  // Ordenação do recorte. Área é número; o resto é texto em pt-BR.
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      if (colunaOrdenacao === "areaHa") {
        return ordemCrescente ? a.areaHa - b.areaHa : b.areaHa - a.areaHa;
      }
      const va = String(a[colunaOrdenacao]);
      const vb = String(b[colunaOrdenacao]);
      const comp = va.localeCompare(vb, "pt-BR");
      return ordemCrescente ? comp : -comp;
    });
  }, [dadosFiltrados, colunaOrdenacao, ordemCrescente]);

  // Agregados e microresumo do RECORTE atual (não do acervo inteiro).
  const metricas: MetricasDestinacoes = useMemo(
    () => calcularMetricasDestinacoes(dadosFiltrados),
    [dadosFiltrados],
  );
  const microresumos = useMemo(
    () => gerarMicroresumoDestinacoes(metricas),
    [metricas],
  );

  function alternarOrdenacao(coluna: CampoOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setOrdemCrescente(!ordemCrescente);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemCrescente(false);
    }
  }

  /** Baixa o CSV do que está filtrado na tela (nunca do acervo inteiro). */
  function baixarCsv() {
    const csv = gerarCsvDestinacoes(dadosOrdenados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `destinacoes-imoveis-uniao-mg-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* 4. Cartões de topo — agregados medidos do recorte atual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-text-soft uppercase tracking-wider">
            Imóveis
          </span>
          <p className="text-2xl font-bold text-accent mt-1">
            {formatarNumero(metricas.total)}
          </p>
          <p className="text-xs text-text-soft mt-1">Registros com os filtros atuais</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-text-soft uppercase tracking-wider">
            Área somada
          </span>
          <p className="text-2xl font-bold text-accent mt-1">
            {formatarArea(metricas.areaTotalHa)} ha
          </p>
          <p className="text-xs text-text-soft mt-1">Hectares no recorte atual</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-text-soft uppercase tracking-wider">
            Municípios
          </span>
          <p className="text-2xl font-bold text-accent mt-1">
            {formatarNumero(metricas.municipiosAtendidos)}
          </p>
          <p className="text-xs text-text-soft mt-1">Municípios mineiros no recorte</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-text-soft uppercase tracking-wider">
            Classes
          </span>
          <p className="text-2xl font-bold text-accent mt-1">
            {formatarNumero(Object.keys(metricas.distribuicaoPorClasse).length)}
          </p>
          <p className="text-xs text-text-soft mt-1">Classes de imóvel representadas</p>
        </div>
      </div>

      {/* Ressalva editorial — sempre visível, nunca atrás de clique */}
      <div
        role="note"
        className="rounded-xl border border-alert/40 bg-alert/5 p-4 text-sm text-text"
      >
        <h2 className="font-bold mb-1">⚠️ O que esta lista é — e o que ela não é</h2>
        <p className="text-text-soft leading-relaxed">{metadados.ressalva}</p>
        <p className="text-text-soft leading-relaxed mt-2">
          Fonte: {metadados.fonte}. Acesso à fonte em {metadados.dataAcessoFonte}.
        </p>
      </div>

      {/* Microresumo cívico (Seu Nonô) */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
        <h2 className="font-bold text-accent mb-2">👴🏽 Seu Nonô explica</h2>
        <ul className="space-y-1 text-text-soft list-disc list-inside">
          {microresumos.map((frase, i) => (
            <li key={i}>{frase}</li>
          ))}
        </ul>
      </div>

      {/* 2. Busca e filtros por faceta; 6. exportação e impressão */}
      <div className="no-print flex flex-col lg:flex-row gap-3 items-stretch lg:items-end justify-between rounded-xl border border-border bg-surface p-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-soft">
              Buscar (município, tipo, classe, proprietário)
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="ex.: Belo Horizonte, Terreno, Dominial"
              className="px-3 py-2 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-soft">Destinação</span>
            <select
              value={destinacaoFiltro}
              onChange={(e) => setDestinacaoFiltro(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="todas">Todas</option>
              {destinacoesDisponiveis.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-soft">Classe</span>
            <select
              value={classeFiltro}
              onChange={(e) => setClasseFiltro(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="todas">Todas</option>
              {classesDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-soft">Proprietário</span>
            <select
              value={proprietarioFiltro}
              onChange={(e) => setProprietarioFiltro(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="todos">Todos</option>
              {proprietariosDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={baixarCsv}
            disabled={dadosFiltrados.length === 0}
            className="px-3 py-2 text-sm rounded-lg bg-accent text-accent-ink font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            📥 Baixar CSV ({formatarNumero(dadosFiltrados.length)})
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-soft hover:text-text transition-colors"
            title="Imprimir relatório"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* 3. Tabela ordenável por coluna */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]">
            <caption className="sr-only">
              Imóveis da União em Minas Gerais, com município, destinação, tipo e área.
            </caption>
            <thead>
              <tr className="border-b border-border bg-bg/60 text-xs font-semibold text-text-soft">
                <th className="p-3">RIP</th>
                <th
                  onClick={() => alternarOrdenacao("municipio")}
                  className="p-3 cursor-pointer hover:text-text"
                  scope="col"
                >
                  Município {colunaOrdenacao === "municipio" && (ordemCrescente ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => alternarOrdenacao("destinacao")}
                  className="p-3 cursor-pointer hover:text-text"
                  scope="col"
                >
                  Destinação {colunaOrdenacao === "destinacao" && (ordemCrescente ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => alternarOrdenacao("tipo")}
                  className="p-3 cursor-pointer hover:text-text"
                  scope="col"
                >
                  Tipo {colunaOrdenacao === "tipo" && (ordemCrescente ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => alternarOrdenacao("areaHa")}
                  className="p-3 cursor-pointer hover:text-text text-right"
                  scope="col"
                >
                  Área (ha) {colunaOrdenacao === "areaHa" && (ordemCrescente ? "↑" : "↓")}
                </th>
                <th className="p-3 text-right" scope="col">
                  Fonte
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dadosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-soft">
                    Nenhum imóvel com esses filtros. Vazio aqui é resposta — não é falha da busca.
                  </td>
                </tr>
              ) : (
                dadosOrdenados.map((item) => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-text-soft">{item.rip}</td>
                    <td className="p-3 font-medium">{item.municipio}</td>
                    <td className="p-3 text-xs">
                      {item.destinacao}
                      {item.regimeCompleto &&
                        item.regimeCompleto !== item.destinacao && (
                          <span className="block text-text-soft mt-0.5">
                            {item.regimeCompleto}
                          </span>
                        )}
                    </td>
                    <td className="p-3 text-xs">
                      <span className="block">{item.tipo}</span>
                      <span className="text-text-soft">
                        {item.classe} · {item.proprietario}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {formatarArea(item.areaHa)}
                    </td>
                    {/* 1. Link direto e verificado à fonte oficial */}
                    <td className="p-3 text-right">
                      <a
                        href={item.fonteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border text-xs font-medium hover:border-accent hover:text-accent transition-colors"
                      >
                        Fonte ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-text-soft" role="status">
        Mostrando {formatarNumero(dadosOrdenados.length)} de{" "}
        {formatarNumero(imoveis.length)} imóveis do cadastro.
      </p>

      {/* CSS de impressão: esconde controles, libera a tabela inteira */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          table { font-size: 10px; }
          a { text-decoration: none; color: inherit; }
        }
      `}</style>
    </div>
  );
}
