"use client";

import { useState, useMemo } from "react";
import type { ItemRecomendacao, StatusCumprimento } from "@/lib/judiciario/recomendacoes";
import { ROTULOS_STATUS_CUMPRIMENTO, obterColunasCsvRecomendacoes } from "@/lib/judiciario/recomendacoes";
import { baixarCsv } from "@/lib/tabela/csv";

interface PainelRecomendacoesClientProps {
  itens: ItemRecomendacao[];
}

type OrdenarPor = "ano" | "tema" | "tribunal" | "status";

export default function PainelRecomendacoesClient({ itens }: PainelRecomendacoesClientProps) {
  const [filtroOrgao, setFiltroOrgao] = useState<string>("todos");
  const [filtroTribunal, setFiltroTribunal] = useState<string>("todos");
  const [filtroTema, setFiltroTema] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("ano");
  const [ordemDesc, setOrdemDesc] = useState<boolean>(true);

  // Listas para filtros
  const tribunais = useMemo(() => {
    return Array.from(new Set(itens.map((i) => i.tribunal_ou_mp))).sort();
  }, [itens]);

  const temas = useMemo(() => {
    return Array.from(new Set(itens.map((i) => i.tema))).sort();
  }, [itens]);

  // Filtragem
  const itensFiltrados = useMemo(() => {
    return itens.filter((i) => {
      if (filtroOrgao !== "todos" && i.orgao_fiscalizador !== filtroOrgao) return false;
      if (filtroTribunal !== "todos" && i.tribunal_ou_mp !== filtroTribunal) return false;
      if (filtroTema !== "todos" && i.tema !== filtroTema) return false;
      if (filtroStatus !== "todos" && i.status_cumprimento !== filtroStatus) return false;

      if (busca.trim() !== "") {
        const termo = busca.toLowerCase();
        const textoCompleto = `${i.microresumo} ${i.texto_oficial} ${i.tema} ${i.tribunal_ou_mp} ${i.unidade_alvo} ${i.tags.join(" ")}`.toLowerCase();
        if (!textoCompleto.includes(termo)) return false;
      }
      return true;
    });
  }, [itens, filtroOrgao, filtroTribunal, filtroTema, filtroStatus, busca]);

  // Ordenação
  const itensOrdenados = useMemo(() => {
    return [...itensFiltrados].sort((a, b) => {
      let res = 0;
      if (ordenarPor === "ano") {
        res = a.ano - b.ano;
      } else if (ordenarPor === "tema") {
        res = a.tema.localeCompare(b.tema);
      } else if (ordenarPor === "tribunal") {
        res = a.tribunal_ou_mp.localeCompare(b.tribunal_ou_mp);
      } else if (ordenarPor === "status") {
        res = a.status_cumprimento.localeCompare(b.status_cumprimento);
      }
      return ordemDesc ? -res : res;
    });
  }, [itensFiltrados, ordenarPor, ordemDesc]);

  // Totais agregados
  const totais = useMemo(() => {
    let cnj = 0;
    let cnmp = 0;
    let cumpridas = 0;
    let reiteradas = 0;
    for (const i of itens) {
      if (i.orgao_fiscalizador === "CNJ") cnj++;
      if (i.orgao_fiscalizador === "CNMP") cnmp++;
      if (i.status_cumprimento === "cumprida") cumpridas++;
      if (i.status_cumprimento === "reiterada") reiteradas++;
    }
    return { total: itens.length, cnj, cnmp, cumpridas, reiteradas };
  }, [itens]);

  const handleBaixarCsv = () => {
    const colunas = obterColunasCsvRecomendacoes();
    baixarCsv(colunas, itensFiltrados, "recomendacoes-cnj-cnmp.csv");
  };

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO ═══ */}
      <section aria-labelledby="top-cards-recomendacoes" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-text-soft">
            Total Monitorado
          </span>
          <div className="mt-1 text-3xl font-bold text-text">{totais.total}</div>
          <p className="mt-1 text-xs text-text-soft">
            {totais.cnj} do CNJ · {totais.cnmp} do CNMP
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Cumpridas
          </span>
          <div className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {totais.cumpridas}
          </div>
          <p className="mt-1 text-xs text-text-soft">Comprovadas nos autos</p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-300">
            Reiteradas
          </span>
          <div className="mt-1 text-3xl font-bold text-rose-700 dark:text-rose-300">
            {totais.reiteradas}
          </div>
          <p className="mt-1 text-xs text-text-soft">Cobradas pela 2ª vez</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Em Acompanhamento
          </span>
          <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {totais.total - totais.cumpridas}
          </div>
          <p className="mt-1 text-xs text-text-soft">Com prazo ou diligência</p>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO INLINE (CSS / SVG SEM LIBS) ═══ */}
      <section aria-labelledby="grafico-cnj-cnmp" className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm">
        <h2 id="grafico-cnj-cnmp" className="text-base font-semibold text-text">
          Divisão por Órgão Fiscalizador
        </h2>
        <p className="text-xs text-text-soft">
          Proporção das cobranças expedidas pelo Conselho Nacional de Justiça vs. Conselho Nacional do Ministério Público.
        </p>

        <div
          role="img"
          aria-label={`Gráfico de divisão: ${totais.cnj} atos do CNJ, ${totais.cnmp} atos do CNMP`}
          className="mt-4 flex h-6 w-full overflow-hidden rounded-lg bg-surface-3"
        >
          <div
            style={{ width: `${(totais.cnj / totais.total) * 100}%` }}
            className="bg-primary transition-all"
            title={`CNJ: ${totais.cnj}`}
          />
          <div
            style={{ width: `${(totais.cnmp / totais.total) * 100}%` }}
            className="bg-indigo-500 transition-all"
            title={`CNMP: ${totais.cnmp}`}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" />
            <span>CNJ — Tribunais ({totais.cnj})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-indigo-500" />
            <span>CNMP — Ministérios Públicos ({totais.cnmp})</span>
          </div>
        </div>
      </section>

      {/* ═══ 3. FILTROS E BUSCA ═══ */}
      <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="busca-rec" className="mb-1 block text-xs font-medium text-text-soft">
              Buscar no microresumo / texto
            </label>
            <input
              id="busca-rec"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: custódia, precatórios, polícia..."
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="filtro-fiscalizador" className="mb-1 block text-xs font-medium text-text-soft">
              Órgão Fiscalizador
            </label>
            <select
              id="filtro-fiscalizador"
              value={filtroOrgao}
              onChange={(e) => setFiltroOrgao(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos (CNJ e CNMP)</option>
              <option value="CNJ">Apenas CNJ (Judiciário)</option>
              <option value="CNMP">Apenas CNMP (Ministério Público)</option>
            </select>
          </div>

          <div>
            <label htmlFor="filtro-tribunal" className="mb-1 block text-xs font-medium text-text-soft">
              Tribunal ou MP
            </label>
            <select
              id="filtro-tribunal"
              value={filtroTribunal}
              onChange={(e) => setFiltroTribunal(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos os órgãos</option>
              {tribunais.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-tema-rec" className="mb-1 block text-xs font-medium text-text-soft">
              Tema
            </label>
            <select
              id="filtro-tema-rec"
              value={filtroTema}
              onChange={(e) => setFiltroTema(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos os temas</option>
              {temas.map((tema) => (
                <option key={tema} value={tema}>
                  {tema}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha de ordenação e download CSV */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs text-text-soft">
            <span>Ordenar por:</span>
            <button
              type="button"
              onClick={() => {
                if (ordenarPor === "ano") setOrdemDesc(!ordemDesc);
                else {
                  setOrdenarPor("ano");
                  setOrdemDesc(true);
                }
              }}
              className={`rounded px-2 py-1 ${ordenarPor === "ano" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
            >
              Ano {ordenarPor === "ano" && (ordemDesc ? "↓" : "↑")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (ordenarPor === "tema") setOrdemDesc(!ordemDesc);
                else {
                  setOrdenarPor("tema");
                  setOrdemDesc(false);
                }
              }}
              className={`rounded px-2 py-1 ${ordenarPor === "tema" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
            >
              Tema {ordenarPor === "tema" && (ordemDesc ? "↓" : "↑")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (ordenarPor === "tribunal") setOrdemDesc(!ordemDesc);
                else {
                  setOrdenarPor("tribunal");
                  setOrdemDesc(false);
                }
              }}
              className={`rounded px-2 py-1 ${ordenarPor === "tribunal" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
            >
              Tribunal/MP {ordenarPor === "tribunal" && (ordemDesc ? "↓" : "↑")}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-soft">
              Exibindo <strong>{itensOrdenados.length}</strong> de {itens.length}
            </span>
            <button
              type="button"
              onClick={handleBaixarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <span>📥</span> Baixar Planilha (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 4. LISTA DE CARDS COM MICRORESUMO VISÍVEL ═══ */}
      <div className="space-y-4">
        {itensOrdenados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-soft">
            Nenhuma recomendação encontrada com os filtros atuais.
          </div>
        ) : (
          itensOrdenados.map((item) => {
            const rotuloStatus = ROTULOS_STATUS_CUMPRIMENTO[item.status_cumprimento];
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm transition-all hover:border-border-strong"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {item.orgao_fiscalizador}
                    </span>
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                      {item.tribunal_ou_mp}
                    </span>
                    <span className="text-xs font-medium text-text-soft">
                      {item.tipo_ato.toUpperCase()} (Item {item.numero_item}) · Ano {item.ano}
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${rotuloStatus.classe}`}
                  >
                    {rotuloStatus.label}
                  </span>
                </div>

                {/* ═══ MICRORESUMO VISÍVEL PARA O USUÁRIO (DESTAQUE) ═══ */}
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">💡</span>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                        O que isso significa para o cidadão:
                      </span>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-text">
                        {item.microresumo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Texto oficial */}
                <div className="mt-3">
                  <p className="text-xs italic text-text-soft leading-relaxed">
                    &ldquo;{item.texto_oficial}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-text-soft">
                    Unidade fiscalizada: <strong>{item.unidade_alvo}</strong>
                  </p>
                </div>

                {/* Tags e link de fonte */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setBusca(tag)}
                        className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-text-soft hover:bg-surface-3"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  <a
                    href={item.link_relatorio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary underline hover:text-primary/80"
                  >
                    Ver relatório na íntegra ↗
                  </a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
