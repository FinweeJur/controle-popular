"use client";

import { useState } from "react";
import {
  OrgaoInspecionado,
  EvolucaoDefensoria,
  ComarcaDesassistida,
} from "@/lib/judiciario/inspecoes-defensoria";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import { Search, Download, ShieldAlert, Scale, Building, AlertCircle } from "lucide-react";

interface Props {
  orgaos: OrgaoInspecionado[];
  evolucaoDefensoria: EvolucaoDefensoria[];
  comarcasDesassistidas: ComarcaDesassistida[];
}

export default function TabelaInspecoesClient({
  orgaos,
  evolucaoDefensoria,
  comarcasDesassistidas,
}: Props) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const filtrados = orgaos.filter((o) => {
    const matchBusca =
      o.nome.toLowerCase().includes(busca.toLowerCase()) ||
      o.orgao.toLowerCase().includes(busca.toLowerCase()) ||
      o.uf.toLowerCase().includes(busca.toLowerCase()) ||
      o.achados_destaque.some((a) => a.toLowerCase().includes(busca.toLowerCase()));

    const matchTipo =
      tipoFiltro === "todos" ||
      (tipoFiltro === "estaduais" && o.tipo.includes("Estadual")) ||
      (tipoFiltro === "federais" && o.tipo.includes("Federal")) ||
      (tipoFiltro === "trabalho" && o.tipo.includes("Trabalho"));

    return matchBusca && matchTipo;
  });

  const exportarCsv = () => {
    const cabecalho = "Órgão;Tribunal;Tipo;UF;Total Relatórios;Último Ano;Páginas;Processo CNJ;Achados de Inspeção\n";
    const linhas = filtrados
      .map(
        (o) =>
          `"${o.orgao}";"${o.nome}";"${o.tipo}";"${o.uf}";${o.total_relatorios};${o.ultimo_relatorio_ano};${o.paginas_ultimo_relatorio};"${o.processo_ultimo_relatorio}";"${o.achados_destaque.join(" | ")}"`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inspecoes-cnj-tribunais.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* GRÁFICO SVG NATIVO: DEFENSORIA POR COMARCA */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Déficit Estrutural: Cobertura da Defensoria Pública em Minas Gerais (298 Comarcas)
            </h3>
            <p className="text-xs text-muted">
              120 comarcas atendidas (40,3%) contra 178 desassistidas ou parciais (59,7%). Ritmo histórico: 15 comarcas em 12 anos.
            </p>
          </div>
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo="Déficit da Defensoria Pública em MG: 59,7% das Comarcas sem Atendimento Permanente"
            orgaoTerritorio="Minas Gerais"
            identificador="DPMG / Pesquisa Nacional 2025"
            link="https://controlepopular.com.br/judiciario/inspecoes"
            resumo="Das 298 comarcas mineiras, apenas 120 contam com Defensoria Pública presencial. O ritmo de expansão levaria mais de 100 anos para cobrir todo o Estado."
            rotulo="Divulgar Déficit de Acesso à Justiça"
          />
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {/* BARRA HORIZONTAL DE PROPORÇÃO */}
          <div>
            <span className="text-xs font-semibold text-muted">Proporção Atual de Comarcas em MG:</span>
            <div className="mt-2 flex h-7 w-full overflow-hidden rounded-xl bg-surface-2">
              <div
                style={{ width: "40.3%" }}
                className="flex items-center justify-center bg-emerald-600 text-[11px] font-bold text-white"
                title="120 comarcas atendidas (40,3%)"
              >
                120 Atendidas (40%)
              </div>
              <div
                style={{ width: "59.7%" }}
                className="flex items-center justify-center bg-rose-600 text-[11px] font-bold text-white"
                title="178 comarcas sem defensoria (59,7%)"
              >
                178 Desassistidas (60%)
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-muted">
              <p>• <strong>Águas Formosas (Vales):</strong> 19,2 mil habitantes sem defensor local.</p>
              <p>• <strong>Rio Pardo de Minas (Norte):</strong> 31,2 mil habitantes atendidos por polo distante.</p>
              <p>• <strong>Ervália (Zona da Mata):</strong> 18,5 mil habitantes sem defensoria pública.</p>
            </div>
          </div>

          {/* GRÁFICO SVG NATIVO: EVOLUÇÃO 2013-2025 */}
          <div>
            <span className="text-xs font-semibold text-muted">Evolução Histórica das Comarcas com DPMG:</span>
            <div className="mt-2 h-28 w-full">
              <svg viewBox="0 0 300 100" className="h-full w-full overflow-visible">
                {/* Eixos e linhas de grade */}
                <line x1="30" y1="80" x2="280" y2="80" stroke="currentColor" strokeOpacity="0.2" />
                <line x1="30" y1="20" x2="280" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3,3" />

                {/* Pontos de dados: 2013 (105), 2018 (112), 2025 (120) */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points="60,65 150,50 250,30"
                />

                <circle cx="60" cy="65" r="4" fill="#10b981" />
                <text x="60" y="80" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.8">2013 (105)</text>
                <text x="60" y="55" fontSize="9" textAnchor="middle" fill="#10b981" fontWeight="bold">35,5%</text>

                <circle cx="150" cy="50" r="4" fill="#10b981" />
                <text x="150" y="80" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.8">2018 (112)</text>
                <text x="150" y="40" fontSize="9" textAnchor="middle" fill="#10b981" fontWeight="bold">37,8%</text>

                <circle cx="250" cy="30" r="4" fill="#10b981" />
                <text x="250" y="80" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.8">2025 (120)</text>
                <text x="250" y="20" fontSize="9" textAnchor="middle" fill="#10b981" fontWeight="bold">40,3%</text>
              </svg>
            </div>
            <p className="mt-1 text-[11px] text-muted italic">
              Fonte: Diagnóstico IPEA (2013), DPU/MJ (2018) e Pesquisa Nacional da Defensoria Pública (2025).
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar por tribunal, estado ou assunto de inspeção (ex: TJMG, pautas, flagrante, TRF)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Tribunais ({orgaos.length})</option>
            <option value="estaduais">Justiça Estadual (TJs)</option>
            <option value="federais">Justiça Federal (TRFs)</option>
            <option value="trabalho">Justiça do Trabalho (TRTs)</option>
          </select>

          <button
            onClick={exportarCsv}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Planilha ({filtrados.length})</span>
          </button>
        </div>
      </div>

      {/* LISTA DE CARTÕES DE INSPEÇÃO */}
      <div className="grid gap-6">
        {filtrados.map((item) => (
          <article
            key={item.orgao}
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {item.orgao}
                </span>
                <span className="text-xs text-muted font-medium">
                  {item.tipo} • UF: {item.uf}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-surface-2 px-2.5 py-1 text-xs font-semibold text-foreground">
                  {item.total_relatorios} relatórios no CNJ (2008–{item.ultimo_relatorio_ano})
                </span>
                <BotaoAlertaContextual
                  tipo="resumo_pagina"
                  titulo={`Inspeção CNJ no ${item.orgao}: ${item.achados_destaque[0] || "Achados da Corregedoria"}`}
                  orgaoTerritorio={`${item.nome} (${item.uf})`}
                  identificador={`Processo CNJ: ${item.processo_ultimo_relatorio}`}
                  link="https://controlepopular.com.br/judiciario/inspecoes"
                  resumo={item.achados_destaque.join("\n• ")}
                  variante="icone"
                />
              </div>
            </div>

            <h3 className="mt-3 font-display text-lg font-bold text-foreground">
              {item.nome}
            </h3>

            <div className="mt-2 text-xs text-muted">
              <span><strong>Última Inspeção Oficial:</strong> Ano {item.ultimo_relatorio_ano} ({item.paginas_ultimo_relatorio} páginas analisadas) • <strong>Processo:</strong> {item.processo_ultimo_relatorio}</span>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                Achados e Determinações da Corregedoria Nacional:
              </h4>
              <ul className="mt-2.5 space-y-2 text-xs text-text-soft">
                {item.achados_destaque.map((achado, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{achado}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
