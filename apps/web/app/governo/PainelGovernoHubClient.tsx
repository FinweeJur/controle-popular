"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { MandatoGestao, RegiaoBrasil, Proposta } from "@/lib/gestao/tipos";
import { REGIAO_POR_UF } from "@/lib/gestao/tipos";
import { calcularResumoGestao, ROTULOS_STATUS, obterColunasCsvGestao } from "@/lib/gestao/dados";
import { baixarCsv } from "@/lib/tabela/csv";

interface PainelGovernoHubClientProps {
  mandatos: MandatoGestao[];
}

type FiltroEsfera = "todas" | "federal" | "estadual" | "capital" | "municipal";
type FiltroRegiao = "todas" | RegiaoBrasil;
type Ordenacao = "nome_asc" | "nome_desc" | "propostas_desc" | "cumprimento_desc" | "sem_sinal_desc";

export default function PainelGovernoHubClient({ mandatos }: PainelGovernoHubClientProps) {
  const [filtroEsfera, setFiltroEsfera] = useState<FiltroEsfera>("todas");
  const [filtroRegiao, setFiltroRegiao] = useState<FiltroRegiao>("todas");
  const [busca, setBusca] = useState<string>("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome_asc");

  // Dados com resumos pré-calculados
  const mandatosComResumo = useMemo(() => {
    return mandatos.map((m) => {
      const resumo = calcularResumoGestao(m);
      const isCapital = m.ente.endsWith("-capital");
      let regiao: RegiaoBrasil | "Outra" | undefined = undefined;
      if (m.esfera === "estadual") {
        regiao = REGIAO_POR_UF[m.ente.toUpperCase()] ?? "Outra";
      } else if ((m as any).regiao) {
        regiao = (m as any).regiao;
      } else if ((m as any).uf) {
        regiao = REGIAO_POR_UF[(m as any).uf.toUpperCase()] ?? "Outra";
      }

      return {
        ...m,
        resumo,
        regiao,
        isCapital,
      };
    });
  }, [mandatos]);

  // Filtragem
  const filtrados = useMemo(() => {
    return mandatosComResumo.filter((m) => {
      if (filtroEsfera === "estadual" && m.esfera !== "estadual") return false;
      if (filtroEsfera === "federal" && m.esfera !== "federal") return false;
      if (filtroEsfera === "capital" && !m.isCapital) return false;
      if (filtroEsfera === "municipal" && (m.esfera !== "municipal" || m.isCapital)) return false;

      if (filtroRegiao !== "todas" && m.regiao !== filtroRegiao) return false;

      if (busca.trim() !== "") {
        const termo = busca.toLowerCase();
        const texto = `${m.nome_ente} ${m.gestor} ${m.partido ?? ""} ${m.cargo} ${m.ente} ${m.regiao ?? ""}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });
  }, [mandatosComResumo, filtroEsfera, filtroRegiao, busca]);

  // Ordenação
  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case "nome_asc":
          return a.nome_ente.localeCompare(b.nome_ente);
        case "nome_desc":
          return b.nome_ente.localeCompare(a.nome_ente);
        case "propostas_desc":
          return b.resumo.totalPropostas - a.resumo.totalPropostas;
        case "cumprimento_desc":
          return b.resumo.porStatus.concluida - a.resumo.porStatus.concluida;
        case "sem_sinal_desc":
          return b.resumo.porStatus.sem_sinal - a.resumo.porStatus.sem_sinal;
        default:
          return 0;
      }
    });
  }, [filtrados, ordenacao]);

  // Totais agregados do que está filtrado
  const agregados = useMemo(() => {
    let totalEntes = filtrados.length;
    let totalPropostas = 0;
    let totalConcluidas = 0;
    let totalEmAndamento = 0;
    let totalAnunciadas = 0;
    let totalSemSinal = 0;
    let totalContrariadas = 0;

    for (const item of filtrados) {
      totalPropostas += item.resumo.totalPropostas;
      totalConcluidas += item.resumo.porStatus.concluida;
      totalEmAndamento += item.resumo.porStatus.em_andamento;
      totalAnunciadas += item.resumo.porStatus.anunciada;
      totalSemSinal += item.resumo.porStatus.sem_sinal;
      totalContrariadas += item.resumo.porStatus.contrariada + item.resumo.porStatus.revogada;
    }

    const pctConcluido = totalPropostas > 0 ? Math.round((totalConcluidas / totalPropostas) * 100) : 0;
    const pctEmAndamento = totalPropostas > 0 ? Math.round((totalEmAndamento / totalPropostas) * 100) : 0;
    const pctSemSinal = totalPropostas > 0 ? Math.round((totalSemSinal / totalPropostas) * 100) : 0;

    return {
      totalEntes,
      totalPropostas,
      totalConcluidas,
      totalEmAndamento,
      totalAnunciadas,
      totalSemSinal,
      totalContrariadas,
      pctConcluido,
      pctEmAndamento,
      pctSemSinal,
    };
  }, [filtrados]);

  // Exportação CSV das propostas filtradas
  const handleBaixarCsv = () => {
    const colunas = obterColunasCsvGestao();
    // Extrai todas as propostas dos executivos que estão no filtro atual
    const todasPropostas: (Proposta & { ente_nome: string; esfera: string })[] = [];
    for (const m of filtrados) {
      for (const p of m.propostas) {
        todasPropostas.push({
          ...p,
          ente_nome: m.nome_ente,
          esfera: m.esfera,
        });
      }
    }

    const colunasCompletas = [
      { chave: "ente_nome" as keyof (Proposta & { ente_nome: string; esfera: string }), rotulo: "Executivo / Ente" },
      { chave: "esfera" as keyof (Proposta & { ente_nome: string; esfera: string }), rotulo: "Esfera" },
      ...colunas,
    ];

    baixarCsv(colunasCompletas, todasPropostas, "promessas-governos-controle-popular.csv");
  };

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO (AGREGADOS) ═══ */}
      <section id="resumo-gestao" aria-labelledby="top-cards-governo" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-text-soft">
            Executivos Monitorados
          </span>
          <div className="mt-1 text-3xl font-bold text-text">{agregados.totalEntes}</div>
          <p className="mt-1 text-xs text-text-soft">
            {filtroEsfera === "todas" ? "Estados, União e Cidades" : `Filtro ativo: ${filtroEsfera}`}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Entregues / Concluídas
          </span>
          <div className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {agregados.totalConcluidas}
          </div>
          <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
            {agregados.pctConcluido}% das metas do plano
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Em Execução / Anunciadas
          </span>
          <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {agregados.totalEmAndamento + agregados.totalAnunciadas}
          </div>
          <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
            {agregados.totalEmAndamento} em obras/contratos
          </p>
        </div>

        <div className="rounded-xl border border-surface-3 bg-surface-2 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-text-soft">
            Sem Sinal Público
          </span>
          <div className="mt-1 text-3xl font-bold text-text-soft">
            {agregados.totalSemSinal}
          </div>
          <p className="mt-1 text-xs text-text-soft">
            {agregados.pctSemSinal}% sem ato oficial achado
          </p>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO INLINE (CSS/SVG) ═══ */}
      <section id="grafico-progresso" aria-labelledby="grafico-progresso-titulo" className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="grafico-progresso-titulo" className="text-sm font-bold text-text">
              Panorama de Cumprimento dos Planos de Governo
            </h2>
            <p className="text-xs text-text-soft">
              Distribuição percentual consolidada de {agregados.totalPropostas} metas catalogadas do TSE
            </p>
          </div>
          <button
            type="button"
            onClick={handleBaixarCsv}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-text transition hover:border-primary/50 hover:bg-surface-3"
          >
            <span>📥</span> Baixar Planilha CSV ({filtrados.length} executivos)
          </button>
        </div>

        {agregados.totalPropostas > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                style={{ width: `${(agregados.totalConcluidas / agregados.totalPropostas) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Entregues: ${agregados.totalConcluidas} (${agregados.pctConcluido}%)`}
              />
              <div
                style={{ width: `${(agregados.totalEmAndamento / agregados.totalPropostas) * 100}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`Em Execução: ${agregados.totalEmAndamento}`}
              />
              <div
                style={{ width: `${(agregados.totalAnunciadas / agregados.totalPropostas) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Anunciadas: ${agregados.totalAnunciadas}`}
              />
              <div
                style={{ width: `${(agregados.totalSemSinal / agregados.totalPropostas) * 100}%` }}
                className="bg-neutral-400 dark:bg-neutral-600 transition-all duration-500"
                title={`Sem Sinal: ${agregados.totalSemSinal} (${agregados.pctSemSinal}%)`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-soft">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Entregues: <strong>{agregados.totalConcluidas}</strong> ({agregados.pctConcluido}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>Em execução: <strong>{agregados.totalEmAndamento}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Anunciadas: <strong>{agregados.totalAnunciadas}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>Sem sinal localizado: <strong>{agregados.totalSemSinal}</strong> ({agregados.pctSemSinal}%)</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-text-soft">Nenhum dado encontrado com os filtros selecionados.</p>
        )}
      </section>

      {/* ═══ 3. FILTROS E BUSCA ═══ */}
      <section id="filtros-governo" aria-labelledby="filtros-governo" className="space-y-4 rounded-2xl border border-border bg-surface-1 p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Busca textual */}
          <div>
            <label htmlFor="busca-governo" className="block text-xs font-semibold uppercase tracking-wider text-text-soft">
              Buscar
            </label>
            <input
              id="busca-governo"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Estado, cidade, gestor, partido..."
              className="mt-1 w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-text placeholder-text-soft focus:border-primary focus:outline-none"
            />
          </div>

          {/* Filtro Esfera */}
          <div>
            <label htmlFor="filtro-esfera" className="block text-xs font-semibold uppercase tracking-wider text-text-soft">
              Esfera Governamental
            </label>
            <select
              id="filtro-esfera"
              value={filtroEsfera}
              onChange={(e) => {
                setFiltroEsfera(e.target.value as FiltroEsfera);
                if (e.target.value === "federal") setFiltroRegiao("todas");
              }}
              className="mt-1 w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="todas">Todas as Esferas ({mandatos.length})</option>
              <option value="estadual">Governos Estaduais (27 UFs)</option>
              <option value="capital">Capitais Estaduais (27 Cidades)</option>
              <option value="federal">Governo Federal (União)</option>
              <option value="municipal">Polos do Interior e Cidades</option>
            </select>
          </div>

          {/* Filtro Região (ativo se todas, estadual, capital ou municipal) */}
          <div>
            <label htmlFor="filtro-regiao" className="block text-xs font-semibold uppercase tracking-wider text-text-soft">
              Região Geográfica
            </label>
            <select
              id="filtro-regiao"
              value={filtroRegiao}
              onChange={(e) => setFiltroRegiao(e.target.value as FiltroRegiao)}
              disabled={filtroEsfera === "federal"}
              className="mt-1 w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:opacity-50"
            >
              <option value="todas">Todas as Regiões</option>
              <option value="Sudeste">Sudeste</option>
              <option value="Sul">Sul</option>
              <option value="Nordeste">Nordeste</option>
              <option value="Centro-Oeste">Centro-Oeste</option>
              <option value="Norte">Norte</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <label htmlFor="ordenacao-governo" className="block text-xs font-semibold uppercase tracking-wider text-text-soft">
              Ordenar por
            </label>
            <select
              id="ordenacao-governo"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="nome_asc">Nome do Ente (A → Z)</option>
              <option value="nome_desc">Nome do Ente (Z → A)</option>
              <option value="propostas_desc">Mais propostas catalogadas</option>
              <option value="cumprimento_desc">Mais metas entregues</option>
              <option value="sem_sinal_desc">Mais metas sem sinal</option>
            </select>
          </div>
        </div>

        {/* Tags de status rápido */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-soft">
          <div>
            Mostrando <strong>{ordenados.length}</strong> de <strong>{mandatos.length}</strong> executivos públicos
          </div>
          {(filtroEsfera !== "todas" || filtroRegiao !== "todas" || busca.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setFiltroEsfera("todas");
                setFiltroRegiao("todas");
                setBusca("");
                setOrdenacao("nome_asc");
              }}
              className="font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* ═══ 4. GRID DE EXECUTIVOS ═══ */}
      <section id="catalogo-governos" aria-label="Lista de Executivos Monitorados">
        {ordenados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-text-soft">
            <p className="text-base font-semibold">Nenhum executivo atende aos filtros atuais.</p>
            <p className="mt-1 text-xs">Tente buscar por outro termo ou selecionar todas as regiões.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordenados.map((m) => {
              const linkGoverno =
                m.esfera === "municipal"
                  ? `/${m.slug}/gestao`
                  : `/governo/${m.slug}`;

              const pctConcluida =
                m.resumo.totalPropostas > 0
                  ? Math.round((m.resumo.porStatus.concluida / m.resumo.totalPropostas) * 100)
                  : 0;

              return (
                <Link
                  key={m.ente}
                  href={linkGoverno}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-surface-1 p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-text-soft">
                          {m.esfera === "federal" ? "Federal" : m.esfera === "estadual" ? "Estado" : m.isCapital ? "Capital" : "Cidade"}
                        </span>
                        {m.regiao && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {m.regiao}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-soft">
                        {m.periodo.inicio}–{m.periodo.fim}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-text group-hover:text-primary transition-colors">
                      {m.nome_ente}
                    </h3>
                    <p className="text-sm text-text-soft line-clamp-1">
                      {m.cargo}: <strong>{m.gestor}</strong> {m.partido ? `(${m.partido})` : ""}
                    </p>

                    {/* Barra de progresso visual */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-text-soft mb-1">
                        <span>Progresso do Plano:</span>
                        <strong className="text-text">{pctConcluida}% entregue</strong>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          style={{ width: `${pctConcluida}%` }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              m.resumo.totalPropostas > 0
                                ? Math.round(
                                    ((m.resumo.porStatus.em_andamento + m.resumo.porStatus.anunciada) /
                                      m.resumo.totalPropostas) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Resumo numérico */}
                    <div className="mt-4 grid grid-cols-3 gap-1 border-t border-border pt-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-text">{m.resumo.totalPropostas}</div>
                        <div className="text-xs text-text-soft">Metas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {m.resumo.porStatus.concluida}
                        </div>
                        <div className="text-xs text-text-soft">Entregues</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-neutral-500 dark:text-neutral-400">
                          {m.resumo.porStatus.sem_sinal}
                        </div>
                        <div className="text-xs text-text-soft">Sem sinal</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs font-semibold text-primary">
                    <span>Ver prestação de contas</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
