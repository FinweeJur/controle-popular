"use client";

/**
 * TabelaLicencas.tsx — feed unificado de licenças, outorgas e autos de infração.
 *
 * Recursos:
 * - Busca livre em texto (empresa, processo, município, tipo, microresumo, porte, tamanho, tags e valores)
 * - Filtros combináveis:
 *   - Porte do empreendimento (Excepcional / PAC, Grande, Médio, Pequeno, Micro/Dispensado)
 *   - Valor do empreendimento (faixas pré-definidas e valores mínimo/máximo customizados em R$)
 *   - Órgão, Categoria, UF, Ano, Situação, Tag, Bacia, Período
 * - Nuvem de tags rápida e seletor rápido de porte para filtragem com 1 clique
 * - Renderização de microresumo explicativo, porte com badge e valor monetário
 * - Ordenação por qualquer coluna (inclusive valor numérico em R$ e hierarquia de porte)
 * - Exportação de CSV filtrado com BOM UTF-8 e separador `;` para Excel
 */
import { useMemo, useState } from "react";
import type { LinhaLicencaUnificada } from "@/lib/ambiental/licencas-unificada";
import { CircularBars, WavePhysicsLoader } from "@/app/components/loaders";

const COLUNAS = [
  { chave: "orgao", titulo: "Órgão", thClass: "w-[68px] text-center" },
  { chave: "uf", titulo: "UF", thClass: "w-[42px] text-center" },
  { chave: "ano", titulo: "Ano", thClass: "w-[48px] text-center" },
  { chave: "tipo", titulo: "Tipo / Microresumo", thClass: "min-w-[190px] max-w-[270px] text-left" },
  { chave: "porte", titulo: "Porte", thClass: "w-[95px] text-left" },
  { chave: "valor_investimento", titulo: "Valor", thClass: "w-[90px] text-right" },
  { chave: "empresa", titulo: "Empresa", thClass: "min-w-[140px] max-w-[200px] text-left" },
  { chave: "municipio", titulo: "Município", thClass: "w-[95px] text-left" },
  { chave: "bacia", titulo: "Bacia", thClass: "w-[90px] text-left" },
  { chave: "data_inicio", titulo: "Início", thClass: "w-[72px] text-center" },
  { chave: "data_fim", titulo: "Validade", thClass: "w-[72px] text-center" },
  { chave: "situacao", titulo: "Situação", thClass: "w-[85px] text-center" },
  { chave: "processo", titulo: "Processo", thClass: "w-[115px] text-left" },
  { chave: "link_oficial", titulo: "Fonte", thClass: "w-[58px] text-center" },
] as const;

type ChaveColuna = (typeof COLUNAS)[number]["chave"];

const PESO_PORTE: Record<string, number> = {
  "Excepcional / PAC": 5,
  "Grande Porte": 4,
  "Médio Porte": 3,
  "Pequeno Porte": 2,
  "Micro / Dispensado": 1,
};

interface Filtro {
  busca: string;
  uf: string;
  categoria: string;
  ano: string;
  bacia: string;
  orgao: string;
  situacao: string;
  tag: string;
  porte: string;
  faixaValor: string;
  valorMin: string;
  valorMax: string;
  empresa: string;
  dataInicioDe: string;
  dataInicioAte: string;
  dataDecDe: string;
  dataDecAte: string;
}

const VAZIO: Filtro = {
  busca: "",
  uf: "",
  categoria: "",
  ano: "",
  bacia: "",
  orgao: "",
  situacao: "",
  tag: "",
  porte: "",
  faixaValor: "",
  valorMin: "",
  valorMax: "",
  empresa: "",
  dataInicioDe: "",
  dataInicioAte: "",
  dataDecDe: "",
  dataDecAte: "",
};

function unicos(valor: Array<string | null | undefined>): string[] {
  return [...new Set(valor.filter((v): v is string => Boolean(v && v !== "—")))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );
}

function formatarValor(v?: number | null): string {
  if (v === null || v === undefined || isNaN(v) || v <= 0) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TabelaLicencas({ linhas }: { linhas: LinhaLicencaUnificada[] }) {
  const [filtro, setFiltro] = useState<Filtro>(VAZIO);
  const [ordem, setOrdem] = useState<{ chave: ChaveColuna; desc: boolean }>({ chave: "ano", desc: true });

  // Opções para seletores e nuvens de filtros
  const opcoes = useMemo(() => {
    const todasTags: string[] = [];
    for (const l of linhas) {
      if (l.tags && Array.isArray(l.tags)) {
        todasTags.push(...l.tags);
      }
    }
    const contagemTags: Record<string, number> = {};
    for (const t of todasTags) {
      contagemTags[t] = (contagemTags[t] ?? 0) + 1;
    }
    const tagsOrdenadas = Object.entries(contagemTags)
      .sort(([, a], [, b]) => b - a)
      .map(([t]) => t);

    return {
      ufs: unicos(linhas.map((l) => l.uf)),
      orgaos: unicos(linhas.map((l) => l.orgao)),
      categorias: unicos(linhas.map((l) => l.categoria)),
      situacoes: unicos(linhas.map((l) => l.situacao)),
      bacias: unicos(linhas.map((l) => l.bacia)),
      portes: unicos(linhas.map((l) => l.porte)),
      anos: unicos(linhas.map((l) => (l.ano === null ? null : String(l.ano)))),
      tags: tagsOrdenadas,
    };
  }, [linhas]);

  // Filtragem multi-critério + busca textual livre
  const filtradas = useMemo(() => {
    const buscaLower = filtro.busca.trim().toLowerCase();
    const tagLower = filtro.tag.trim().toLowerCase();
    const minVal = filtro.valorMin ? parseFloat(filtro.valorMin.replace(/\./g, "").replace(",", ".")) : null;
    const maxVal = filtro.valorMax ? parseFloat(filtro.valorMax.replace(/\./g, "").replace(",", ".")) : null;

    return linhas.filter((l) => {
      if (filtro.uf && l.uf !== filtro.uf) return false;
      if (filtro.categoria && l.categoria !== filtro.categoria) return false;
      if (filtro.ano && String(l.ano ?? "") !== filtro.ano) return false;
      if (filtro.orgao && l.orgao !== filtro.orgao) return false;
      if (filtro.situacao && l.situacao !== filtro.situacao) return false;
      if (filtro.porte && l.porte !== filtro.porte) return false;
      if (filtro.bacia && !(l.bacia ?? "").toLowerCase().includes(filtro.bacia.toLowerCase())) return false;
      if (
        filtro.empresa &&
        !(l.empresa ?? "").toLowerCase().includes(filtro.empresa.toLowerCase())
      )
        return false;
      if (filtro.dataInicioDe && (l.data_inicio ?? "") < filtro.dataInicioDe) return false;
      if (filtro.dataInicioAte && (l.data_inicio ?? "") > filtro.dataInicioAte) return false;
      if (filtro.dataDecDe && (l.data_fim ?? "") < filtro.dataDecDe) return false;
      if (filtro.dataDecAte && (l.data_fim ?? "") > filtro.dataDecAte) return false;

      // Filtro por faixa de valor pré-definida
      const val = l.valor_investimento ?? 0;
      if (filtro.faixaValor === "com_valor" && (!l.valor_investimento || l.valor_investimento <= 0)) return false;
      if (filtro.faixaValor === "ate_100k" && (val <= 0 || val > 100000)) return false;
      if (filtro.faixaValor === "100k_1m" && (val <= 100000 || val > 1000000)) return false;
      if (filtro.faixaValor === "1m_10m" && (val <= 1000000 || val > 10000000)) return false;
      if (filtro.faixaValor === "10m_100m" && (val <= 10000000 || val > 100000000)) return false;
      if (filtro.faixaValor === "acima_100m" && val <= 100000000) return false;

      // Filtro por valor customizado
      if (minVal !== null && !isNaN(minVal) && val < minVal) return false;
      if (maxVal !== null && !isNaN(maxVal) && (val <= 0 || val > maxVal)) return false;

      // Filtro por tag
      if (tagLower) {
        const temTag = (l.tags ?? []).some((t) => t.toLowerCase() === tagLower);
        if (!temTag) return false;
      }

      // Busca livre
      if (buscaLower) {
        const textoBusca = [
          l.tipo,
          l.empresa,
          l.municipio,
          l.processo,
          l.bacia,
          l.microresumo,
          l.porte,
          l.tamanho_detalhe,
          l.valor_investimento ? formatarValor(l.valor_investimento) : "",
          (l.tags ?? []).join(" "),
          l.situacao,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!textoBusca.includes(buscaLower)) return false;
      }

      return true;
    });
  }, [linhas, filtro]);

  // Ordenação especializada (numérica para valores, ranking para portes, textual para o resto)
  const ordenadas = useMemo(() => {
    return [...filtradas].sort((a, b) => {
      if (ordem.chave === "valor_investimento") {
        const va = a.valor_investimento ?? 0;
        const vb = b.valor_investimento ?? 0;
        return ordem.desc ? vb - va : va - vb;
      }
      if (ordem.chave === "porte") {
        const pa = PESO_PORTE[a.porte ?? ""] ?? 0;
        const pb = PESO_PORTE[b.porte ?? ""] ?? 0;
        if (pa !== pb) return ordem.desc ? pb - pa : pa - pb;
      }
      const va = String(a[ordem.chave] ?? "").toLowerCase();
      const vb = String(b[ordem.chave] ?? "").toLowerCase();
      const valor = va.localeCompare(vb, "pt-BR");
      return ordem.desc ? -valor : valor;
    });
  }, [filtradas, ordem]);

  function baixarCsv(): void {
    const cab = [
      "orgao",
      "uf",
      "ano",
      "categoria",
      "tipo",
      "porte",
      "tamanho_detalhe",
      "valor_investimento",
      "empresa",
      "municipio",
      "bacia",
      "data_inicio",
      "data_fim",
      "situacao",
      "processo",
      "link_oficial",
      "microresumo",
      "tags",
    ];
    const linhasCsv = [
      cab.join(";"),
      ...ordenadas.map((l) =>
        [
          l.orgao,
          l.uf,
          l.ano,
          l.categoria,
          l.tipo,
          l.porte ?? "",
          l.tamanho_detalhe ?? "",
          l.valor_investimento ? l.valor_investimento.toFixed(2) : "",
          l.empresa,
          l.municipio,
          l.bacia,
          l.data_inicio,
          l.data_fim,
          l.situacao,
          l.processo,
          l.link_oficial ?? "",
          l.microresumo ?? "",
          (l.tags ?? []).join("|"),
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(";")
      ),
    ];
    const blob = new Blob(["\uFEFF" + linhasCsv.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licencas-ambientais-filtrado-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const temFiltro = JSON.stringify(filtro) !== JSON.stringify(VAZIO);

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-1,var(--cp-surface))] p-4 space-y-3">
        {/* Campo de Busca Rápida Livre */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              value={filtro.busca}
              onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value }))}
              placeholder="🔍 Busca livre (empresa, porte, valor R$, processo, município, resumo, tipo, atividade...)"
              className="w-full rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] pl-4 pr-14 py-2.5 text-sm outline-none focus:border-[var(--cp-primary)]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              {filtro.busca.trim().length > 0 && (
                <CircularBars size={15} />
              )}
              {filtro.busca && (
                <button
                  type="button"
                  onClick={() => setFiltro((f) => ({ ...f, busca: "" }))}
                  className="pointer-events-auto text-xs opacity-60 hover:opacity-100 p-0.5"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {temFiltro && (
            <button
              type="button"
              onClick={baixarCsv}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-2 text-xs font-semibold hover:border-[var(--cp-primary)] hover:text-[var(--cp-primary)] transition"
            >
              📥 Baixar Planilha CSV ({ordenadas.length})
            </button>
          )}
        </div>

        {/* Nuvem de portes rápidos */}
        {opcoes.portes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="opacity-70 font-medium">Porte / Tamanho:</span>
            {opcoes.portes.map((p) => {
              const ativa = filtro.porte.toLowerCase() === p.toLowerCase();
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setFiltro((f) => ({
                      ...f,
                      porte: ativa ? "" : p,
                    }))
                  }
                  className={`rounded-full px-2.5 py-0.5 text-xs transition border ${
                    ativa
                      ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-[var(--cp-primary-contrast,#fff)] font-semibold"
                      : "border-[var(--cp-border)] bg-[var(--cp-surface)] opacity-80 hover:opacity-100 hover:border-[var(--cp-primary)]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {filtro.porte && (
              <button
                type="button"
                onClick={() => setFiltro((f) => ({ ...f, porte: "" }))}
                className="ml-1 text-xs underline opacity-70 hover:opacity-100"
              >
                limpar porte
              </button>
            )}
          </div>
        )}

        {/* Nuvem de tags rápidas */}
        {opcoes.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="opacity-70 font-medium">Tags em destaque:</span>
            {opcoes.tags.slice(0, 10).map((t) => {
              const ativa = filtro.tag.toLowerCase() === t.toLowerCase();
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setFiltro((f) => ({
                      ...f,
                      tag: ativa ? "" : t,
                    }))
                  }
                  className={`rounded-full px-2.5 py-0.5 text-xs transition border ${
                    ativa
                      ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-[var(--cp-primary-contrast,#fff)] font-semibold"
                      : "border-[var(--cp-border)] bg-[var(--cp-surface)] opacity-80 hover:opacity-100 hover:border-[var(--cp-primary)]"
                  }`}
                >
                  #{t}
                </button>
              );
            })}
            {filtro.tag && (
              <button
                type="button"
                onClick={() => setFiltro((f) => ({ ...f, tag: "" }))}
                className="ml-1 text-xs underline opacity-70 hover:opacity-100"
              >
                limpar tag
              </button>
            )}
          </div>
        )}

        {/* Filtros Dropdowns e Entradas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs pt-2 border-t border-[var(--cp-border)]">
          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Órgão</span>
            <select
              value={filtro.orgao}
              onChange={(e) => setFiltro((f) => ({ ...f, orgao: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todos os órgãos</option>
              {opcoes.orgaos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Categoria</span>
            <select
              value={filtro.categoria}
              onChange={(e) => setFiltro((f) => ({ ...f, categoria: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todas as categorias</option>
              {opcoes.categorias.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Estado (UF)</span>
            <select
              value={filtro.uf}
              onChange={(e) => setFiltro((f) => ({ ...f, uf: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todos os estados</option>
              {opcoes.ufs.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Porte / Classe</span>
            <select
              value={filtro.porte}
              onChange={(e) => setFiltro((f) => ({ ...f, porte: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5 font-medium"
            >
              <option value="">Todos os portes</option>
              {opcoes.portes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Faixa de Valor</span>
            <select
              value={filtro.faixaValor}
              onChange={(e) => setFiltro((f) => ({ ...f, faixaValor: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todos os valores</option>
              <option value="com_valor">Com valor declarado</option>
              <option value="ate_100k">Até R$ 100 mil</option>
              <option value="100k_1m">R$ 100 mil a R$ 1 milhão</option>
              <option value="1m_10m">R$ 1 milhão a R$ 10 milhões</option>
              <option value="10m_100m">R$ 10 milhões a R$ 100 milhões</option>
              <option value="acima_100m">Acima de R$ 100 milhões</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Ano</span>
            <select
              value={filtro.ano}
              onChange={(e) => setFiltro((f) => ({ ...f, ano: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todos os anos</option>
              {opcoes.anos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Situação</span>
            <select
              value={filtro.situacao}
              onChange={(e) => setFiltro((f) => ({ ...f, situacao: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            >
              <option value="">Todas</option>
              {opcoes.situacoes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Regional / Bacia</span>
            <input
              list="bacias-licencas"
              value={filtro.bacia}
              onChange={(e) => setFiltro((f) => ({ ...f, bacia: e.target.value }))}
              placeholder="Digite a bacia"
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
            <datalist id="bacias-licencas">
              {opcoes.bacias.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Empresa / Titular</span>
            <input
              value={filtro.empresa}
              onChange={(e) => setFiltro((f) => ({ ...f, empresa: e.target.value }))}
              placeholder="Nome da empresa"
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Valor Mínimo (R$)</span>
            <input
              type="number"
              value={filtro.valorMin}
              onChange={(e) => setFiltro((f) => ({ ...f, valorMin: e.target.value }))}
              placeholder="Ex: 500000"
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5 font-tabular"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Valor Máximo (R$)</span>
            <input
              type="number"
              value={filtro.valorMax}
              onChange={(e) => setFiltro((f) => ({ ...f, valorMax: e.target.value }))}
              placeholder="Ex: 50000000"
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5 font-tabular"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Início De</span>
            <input
              type="date"
              value={filtro.dataInicioDe}
              onChange={(e) => setFiltro((f) => ({ ...f, dataInicioDe: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Início Até</span>
            <input
              type="date"
              value={filtro.dataInicioAte}
              onChange={(e) => setFiltro((f) => ({ ...f, dataInicioAte: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Decisão / Fim De</span>
            <input
              type="date"
              value={filtro.dataDecDe}
              onChange={(e) => setFiltro((f) => ({ ...f, dataDecDe: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
          </label>

          <label className="space-y-1">
            <span className="block opacity-75 font-medium">Decisão / Fim Até</span>
            <input
              type="date"
              value={filtro.dataDecAte}
              onChange={(e) => setFiltro((f) => ({ ...f, dataDecAte: e.target.value }))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5"
            />
          </label>

          {temFiltro && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFiltro(VAZIO)}
                className="w-full py-1.5 rounded-md border border-[var(--cp-border)] text-xs text-center underline hover:bg-[var(--cp-surface-2,var(--cp-surface))] opacity-80 hover:opacity-100"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados e Tabela */}
      {linhas.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma licença coletada ainda. Rodar coletores da rotina ambiental
          (scripts/rotina-ambiental.mts) na máquina que publica.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs opacity-75">
            <p>
              Exibindo <strong className="font-tabular text-[var(--cp-foreground)]">{ordenadas.length}</strong> de{" "}
              <strong className="font-tabular text-[var(--cp-foreground)]">{linhas.length}</strong> atos na janela de visualização
              {" · "}
              <span className="italic">cadastros de órgãos distintos não são somados como um único todo</span>
            </p>
            {temFiltro && (
              <button
                type="button"
                onClick={baixarCsv}
                className="underline hover:text-[var(--cp-primary)]"
              >
                📥 Exportar planilha ({ordenadas.length} linhas)
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)]">
            <table className="w-full min-w-[1020px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--cp-border)] bg-[var(--cp-surface-2,var(--cp-surface))] uppercase tracking-wider text-[11px] opacity-75">
                  {COLUNAS.map((c) => (
                    <th key={c.chave} className={`px-2 py-2 font-semibold ${c.thClass}`}>
                      <button
                        type="button"
                        onClick={() =>
                          setOrdem((o) =>
                            o.chave === c.chave
                              ? { chave: c.chave, desc: !o.desc }
                              : { chave: c.chave, desc: true }
                          )
                        }
                        className={`flex items-center gap-1 hover:text-[var(--cp-primary)] transition ${
                          c.thClass.includes("text-center")
                            ? "mx-auto justify-center"
                            : c.thClass.includes("text-right")
                              ? "ml-auto justify-end"
                              : "justify-start"
                        }`}
                      >
                        {c.titulo}
                        <span className="text-[10px] opacity-60">
                          {ordem.chave === c.chave ? (ordem.desc ? "▼" : "▲") : "⇅"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cp-border)]">
                {ordenadas.slice(0, 500).map((l, i) => {
                  const microresumo =
                    l.microresumo ||
                    `${l.tipo}${l.empresa ? ` · ${l.empresa}` : ""}${l.municipio ? ` (${l.municipio}/${l.uf ?? ""})` : ""}`;
                  const tags = l.tags && Array.isArray(l.tags) ? l.tags : [];
                  const porte = l.porte ?? "Não classificado";
                  const valorFmt = formatarValor(l.valor_investimento);

                  return (
                    <tr
                      key={`${l.orgao}-${l.processo}-${i}`}
                      className="align-top hover:bg-[var(--cp-surface-2,var(--cp-surface))]/60 transition"
                    >
                      <td className="px-2 py-2 font-semibold text-center whitespace-nowrap text-[11px]">
                        {l.orgao}
                      </td>
                      <td className="px-1.5 py-2 font-bold text-center text-[11px]">
                        {l.uf ?? "—"}
                      </td>
                      <td className="px-1.5 py-2 font-tabular text-center text-[11px]">
                        {l.ano ?? "—"}
                      </td>
                      <td className="px-2.5 py-2 min-w-[190px] max-w-[270px] whitespace-normal break-words">
                        <div className="font-medium text-[var(--cp-foreground)] leading-tight">{l.tipo}</div>
                        {microresumo && (
                          <div className="mt-1 text-[11px] opacity-75 leading-snug break-words">
                            {microresumo}
                          </div>
                        )}
                        {tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {tags.map((tg) => (
                              <button
                                key={tg}
                                type="button"
                                onClick={() => setFiltro((f) => ({ ...f, tag: tg }))}
                                className="rounded px-1.5 py-0.2 text-[10px] bg-[var(--cp-surface-2,var(--cp-surface))] border border-[var(--cp-border)] hover:border-[var(--cp-primary)] opacity-70 hover:opacity-100"
                              >
                                #{tg}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 w-[95px] whitespace-normal break-words">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${
                            porte.includes("Excepcional") || porte.includes("PAC")
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                              : porte.includes("Grande")
                                ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : porte.includes("Médio")
                                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                  : porte.includes("Pequeno")
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-[var(--cp-surface-2,var(--cp-surface))] text-neutral-600 dark:text-neutral-400 border border-[var(--cp-border)]"
                          }`}
                        >
                          {porte}
                        </span>
                        {l.tamanho_detalhe && (
                          <div className="mt-1 text-[10px] opacity-70 break-words leading-tight" title={l.tamanho_detalhe}>
                            {l.tamanho_detalhe}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 w-[90px] font-tabular whitespace-nowrap text-right">
                        {valorFmt !== "—" ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {valorFmt}
                          </span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 min-w-[140px] max-w-[200px] whitespace-normal break-words font-medium text-[var(--cp-foreground)] leading-snug">
                        {l.empresa ?? "—"}
                      </td>
                      <td className="px-2 py-2 w-[95px] whitespace-normal break-words leading-tight">
                        {l.municipio ?? "—"}
                      </td>
                      <td className="px-2 py-2 w-[90px] whitespace-normal break-words opacity-80 leading-tight">
                        {l.bacia ?? "—"}
                      </td>
                      <td className="px-1.5 py-2 w-[72px] font-tabular text-[11px] whitespace-nowrap text-center opacity-85">
                        {l.data_inicio ?? "—"}
                      </td>
                      <td className="px-1.5 py-2 w-[72px] font-tabular text-[11px] whitespace-nowrap text-center opacity-85">
                        {l.data_fim ?? "—"}
                      </td>
                      <td className="px-2 py-2 w-[85px] text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${
                            /conced|deferid|ativ|v[aá]lid/i.test(l.situacao ?? "")
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : /cancel|vencid|indefer|embarg/i.test(l.situacao ?? "")
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {l.situacao ?? "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2 w-[115px] font-tabular font-mono text-[11px] whitespace-normal break-all leading-tight">
                        {l.link_oficial ? (
                          <a
                            href={l.link_oficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--cp-primary)] hover:underline inline-flex items-baseline gap-1"
                            title={`Consultar processo ${l.processo} no sistema oficial do órgão`}
                          >
                            <span>{l.processo}</span>
                            <span className="text-[10px] opacity-70 shrink-0">↗</span>
                          </a>
                        ) : (
                          <span>{l.processo}</span>
                        )}
                      </td>
                      <td className="px-1 py-2 w-[58px] text-center whitespace-nowrap">
                        {l.link_oficial ? (
                          <a
                            href={l.link_oficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--cp-primary)]/10 text-[var(--cp-primary)] hover:bg-[var(--cp-primary)]/20 transition border border-[var(--cp-primary)]/20"
                            title={`Página oficial do ato no sistema do ${l.orgao}`}
                          >
                            Fonte ↗
                          </a>
                        ) : (
                          <span className="opacity-30 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ordenadas.length > 500 && (
              <div className="p-3 bg-[var(--cp-surface-2,var(--cp-surface))] border-t border-[var(--cp-border)] text-xs text-center opacity-75">
                Exibindo os primeiros 500 registros correspondentes ao filtro atual. Para analisar a íntegra, utilize o botão <strong>Baixar Planilha CSV</strong>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

