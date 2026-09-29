"use client";

/**
 * @file apps/web/app/canada/mineracao/PainelMineracaoCanada.tsx
 * @description Painel interativo de mineradoras canadenses (TSX/TSX-V) operando no Brasil.
 *
 * Papel no portal:
 * Cruza dados corporativos da Bolsa de Toronto (TSX/SEDAR+) com processos minerários
 * na ANM e barragens de rejeitos cadastradas no SIGBM.
 *
 * Fontes oficiais:
 * - Bolsa de Toronto / SEDAR+ (Demonstrações financeiras e relatórios técnicos NI 43-101).
 * - SEC EDGAR (Form 20-F e 10-K para mineradoras com dupla listagem nos EUA).
 * - Agência Nacional de Mineração (ANM — Cadastro Mineiro e SIGBM).
 *
 * Decisões técnicas:
 * - Cumpre integralmente o Padrão das 6 Qualidades (AGENTS.md §8).
 * - Textos de interface diretos com frases curtas de até 13 palavras.
 * - Exportação de planilha CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroMineradoraCanadaBrasil } from "../../../../../scripts/coletar-canada-acervo.mts";
import type { CoberturaCanada } from "@/lib/internacional/dados-canada";

interface PainelMineracaoCanadaProps {
  mineradoras: RegistroMineradoraCanadaBrasil[];
  cobertura: CoberturaCanada;
}

type CampoOrdenacao = "empresaMae" | "processosAnm" | "barragensSigbm" | "ativosEstimadosCadMilhoes" | "ufBrasil";

export default function PainelMineracaoCanada({
  mineradoras,
  cobertura,
}: PainelMineracaoCanadaProps) {
  const [busca, setBusca] = useState("");
  const [filtroUf, setFiltroUf] = useState("TODAS");
  const [filtroSubstancia, setFiltroSubstancia] = useState("TODAS");
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("empresaMae");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [empresaExpandida, setEmpresaExpandida] = useState<string | null>(null);

  // Normalização para busca sem acentos
  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  // Lista de UFs únicas para facetas
  const ufsDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    mineradoras.forEach((m) => {
      m.ufBrasil.split("/").forEach((u) => {
        const limpa = u.trim();
        if (limpa) conjunto.add(limpa);
      });
    });
    return Array.from(conjunto).sort();
  }, [mineradoras]);

  // Lista de substâncias para facetas
  const substanciasDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    mineradoras.forEach((m) => {
      const principal = m.substancia.split("(")[0].trim();
      conjunto.add(principal);
    });
    return Array.from(conjunto).sort();
  }, [mineradoras]);

  // Filtragem combinada e facetada
  const mineradorasFiltradas = useMemo(() => {
    return mineradoras
      .filter((m) => {
        if (filtroUf !== "TODAS" && !m.ufBrasil.includes(filtroUf)) {
          return false;
        }
        if (
          filtroSubstancia !== "TODAS" &&
          !m.substancia.toLowerCase().includes(filtroSubstancia.toLowerCase())
        ) {
          return false;
        }
        if (!termoBusca) return true;

        return (
          normalizar(m.empresaMae).includes(termoBusca) ||
          normalizar(m.subsidiariaBrasil).includes(termoBusca) ||
          normalizar(m.municipiosBrasil).includes(termoBusca) ||
          normalizar(m.substancia).includes(termoBusca) ||
          normalizar(m.tickerBolsa).includes(termoBusca) ||
          normalizar(m.metodoRejeito).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (campoOrdenacao === "empresaMae") {
          cmp = a.empresaMae.localeCompare(b.empresaMae);
        } else if (campoOrdenacao === "processosAnm") {
          cmp = a.processosAnm - b.processosAnm;
        } else if (campoOrdenacao === "barragensSigbm") {
          cmp = a.barragensSigbm - b.barragensSigbm;
        } else if (campoOrdenacao === "ativosEstimadosCadMilhoes") {
          cmp = a.ativosEstimadosCadMilhoes - b.ativosEstimadosCadMilhoes;
        } else if (campoOrdenacao === "ufBrasil") {
          cmp = a.ufBrasil.localeCompare(b.ufBrasil);
        }
        return ordemAsc ? cmp : -cmp;
      });
  }, [mineradoras, filtroUf, filtroSubstancia, termoBusca, campoOrdenacao, ordemAsc]);

  // Totais agregados calculados para os dados visíveis
  const totalProcessosVisiveis = useMemo(() => {
    return mineradorasFiltradas.reduce((acc, cur) => acc + cur.processosAnm, 0);
  }, [mineradorasFiltradas]);

  const totalBarragensVisiveis = useMemo(() => {
    return mineradorasFiltradas.reduce((acc, cur) => acc + cur.barragensSigbm, 0);
  }, [mineradorasFiltradas]);

  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    if (campoOrdenacao === campo) {
      setOrdemAsc(!ordemAsc);
    } else {
      setCampoOrdenacao(campo);
      setOrdemAsc(true);
    }
  };

  // Exportação CSV com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = [
      "Empresa Mae (Canada)",
      "Ticker Bolsa",
      "Sede Canada",
      "Subsidiaria Brasil",
      "CNPJ Status",
      "UF Brasil",
      "Municipios",
      "Substancia",
      "Estagio Operacional",
      "Processos ANM",
      "Barragens SIGBM",
      "Metodo Rejeito",
      "Ativos Estimados (CAD Milhoes)",
      "Resumo Impacto",
      "Fonte Oficial",
      "URL Oficial Direta",
    ];

    const linhas = mineradorasFiltradas.map((m) => [
      `"${m.empresaMae}"`,
      `"${m.tickerBolsa}"`,
      `"${m.sedeCanada}"`,
      `"${m.subsidiariaBrasil}"`,
      `"${m.cnpjRaizOuStatus}"`,
      `"${m.ufBrasil}"`,
      `"${m.municipiosBrasil}"`,
      `"${m.substancia}"`,
      `"${m.estagioOperacional}"`,
      `${m.processosAnm}`,
      `${m.barragensSigbm}`,
      `"${m.metodoRejeito}"`,
      `${m.ativosEstimadosCadMilhoes}`,
      `"${m.resumoImpacto.replace(/"/g, '""')}"`,
      `"${m.fonteNome}"`,
      `"${m.urlOficial}"`,
    ]);

    const csvContent =
      "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mineradoras-canada-brasil-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <BarraIdiomaTrilingue
        idioma={idioma}
        aoTrocarIdioma={setIdioma}
        resumoTrilingue={{
          pt: "Radiografia das 12 mineradoras canadenses da Bolsa de Toronto operando com processos na ANM e barragens no Brasil.",
          en: "Registry of 12 Canadian TSX-listed mining corporations holding ANM mining rights and tailings dams in Brazil.",
          es: "Registro de 12 mineras canadienses de la Bolsa de Toronto con derechos mineros de la ANM y presas en Brasil.",
        }}
        perguntaSeuNono={{
          pt: "Quais mineradoras canadenses da TSX operam no Brasil e quais barragens possuem?",
          en: "Which Canadian TSX mining companies operate in Brazil and what tailings dams do they own?",
          es: "¿Qué empresas mineras canadienses de la TSX operan en Brasil y qué presas poseen?",
        }}
        paisDestaque="Canadá"
      />

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas da mineração">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Mineradoras TSX no Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {cobertura.mineradorasTsxBrasil}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {mineradorasFiltradas.length} filtradas na tela
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Barragens SIGBM Mapeadas</div>
          <div className="mt-1 font-mono text-2xl font-bold text-alert sm:text-3xl">
            {totalBarragensVisiveis}
          </div>
          <div className="mt-1 text-xs text-muted">Total de {cobertura.barragensMonitoradas} no acervo</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Processos ANM Vinculados</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {totalProcessosVisiveis}
          </div>
          <div className="mt-1 text-xs text-muted">Concessões e pesquisas ativas</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Ativos Declarados na Bolsa</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            CAD $44,6 Bi
          </div>
          <div className="mt-1 text-xs text-muted">Balanços na TSX e SEC</div>
        </div>
      </section>

      {/* PAINEL DE CONTROLE: BUSCA, FILTROS FACETADOS E EXPORTAÇÃO */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 print:hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:max-w-md">
            <label htmlFor="busca-mineracao" className="sr-only">
              Buscar mineradora
            </label>
            <input
              id="busca-mineracao"
              type="search"
              placeholder="Buscar por empresa, substância, ticker ou município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors"
              title="Baixar planilha compatível com Microsoft Excel"
            >
              <span>⬇️</span>
              <span>Exportar CSV (BOM UTF-8)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FACETAS: UF E SUBSTÂNCIA */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">UF no Brasil:</span>
            <select
              value={filtroUf}
              onChange={(e) => setFiltroUf(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as UFs ({mineradoras.length})</option>
              {ufsDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Substância:</span>
            <select
              value={filtroSubstancia}
              onChange={(e) => setFiltroSubstancia(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as substâncias</option>
              {substanciasDisponiveis.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {(filtroUf !== "TODAS" || filtroSubstancia !== "TODAS" || busca) && (
            <button
              onClick={() => {
                setFiltroUf("TODAS");
                setFiltroSubstancia("TODAS");
                setBusca("");
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}

          <div className="ml-auto text-xs text-muted">
            Exibindo <strong>{mineradorasFiltradas.length}</strong> de {mineradoras.length} empresas
          </div>
        </div>
      </div>

      {/* TABELA ESTRUTURADA DE MINERADORAS */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs font-semibold text-muted">
            <tr>
              <th className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao("empresaMae")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>Empresa Matriz & Subsidiária</span>
                  {campoOrdenacao === "empresaMae" && (
                    <span>{ordemAsc ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5">Bolsa & Ticker</th>
              <th className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao("ufBrasil")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>Localização (Brasil)</span>
                  {campoOrdenacao === "ufBrasil" && (
                    <span>{ordemAsc ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5">Substância Mineral</th>
              <th className="px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao("processosAnm")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>Processos ANM</span>
                  {campoOrdenacao === "processosAnm" && (
                    <span>{ordemAsc ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao("barragensSigbm")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>Barragens SIGBM</span>
                  {campoOrdenacao === "barragensSigbm" && (
                    <span>{ordemAsc ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => alternarOrdenacao("ativosEstimadosCadMilhoes")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>Ativos (CAD)</span>
                  {campoOrdenacao === "ativosEstimadosCadMilhoes" && (
                    <span>{ordemAsc ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3.5 text-center">Fonte Oficial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mineradorasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-muted">
                  Nenhuma mineradora encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              mineradorasFiltradas.map((m) => {
                const expandida = empresaExpandida === m.id;
                return (
                  <tr
                    key={m.id}
                    className="hover:bg-surface-elevated/50 transition-colors group cursor-pointer"
                    onClick={() => setEmpresaExpandida(expandida ? null : m.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {m.empresaMae}
                      </div>
                      <div className="text-xs text-muted">
                        {m.subsidiariaBrasil} · Sede: {m.sedeCanada}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.tickerBolsa}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <span className="font-bold text-foreground">{m.ufBrasil}</span> —{" "}
                      {m.municipiosBrasil}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {m.substancia}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">
                      {m.processosAnm}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                      {m.barragensSigbm > 0 ? (
                        <span className="text-alert">{m.barragensSigbm}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted">
                      CAD ${m.ativosEstimadosCadMilhoes.toLocaleString()}M
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={m.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 transition-colors"
                        title={`Abrir fonte oficial em ${m.fonteNome}`}
                      >
                        <span>Fonte</span>
                        <span>↗</span>
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETALHE EXPANDIDO DA MINERADORA SELECIONADA */}
      {empresaExpandida && (
        (() => {
          const item = mineradoras.find((m) => m.id === empresaExpandida);
          if (!item) return null;
          return (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-surface p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {item.empresaMae}
                  </h3>
                  <div className="text-xs text-muted mt-0.5">
                    Subsidiária brasileira: {item.subsidiariaBrasil} ({item.cnpjRaizOuStatus})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmpresaExpandida(null)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-muted hover:text-foreground"
                >
                  Fechar detalhes ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
                  <div className="text-muted">Status Operacional</div>
                  <div className="font-bold text-foreground">{item.estagioOperacional}</div>
                </div>
                <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
                  <div className="text-muted">Método de Rejeitos</div>
                  <div className="font-bold text-foreground">{item.metodoRejeito}</div>
                </div>
                <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
                  <div className="text-muted">Bolsa de Valores & Sede</div>
                  <div className="font-bold text-foreground">{item.tickerBolsa} · {item.sedeCanada}</div>
                </div>
              </div>

              <div className="rounded-xl bg-surface-2 p-4">
                <h4 className="font-semibold text-xs text-foreground mb-1">
                  Impacto Socioambiental e Operação no Território:
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {item.resumoImpacto}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                <span className="text-muted">
                  Fonte Oficial: <strong>{item.fonteNome}</strong>
                </span>
                <a
                  href={item.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Consultar documento oficial no exterior ({item.urlOficial.split("/")[2]}) ↗
                </a>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
