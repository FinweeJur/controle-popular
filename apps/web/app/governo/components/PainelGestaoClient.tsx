"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { MandatoGestao, Proposta, StatusProposta } from "@/lib/gestao/tipos";
import { ROTULOS_STATUS, obterColunasCsvGestao } from "@/lib/gestao/dados";
import { encontrarSiglaInstituicao } from "@/lib/instituicoes/catalogo";
import { baixarCsv } from "@/lib/tabela/csv";
import { formatCurrencyBRL } from "@/lib/betim/format";

interface PainelGestaoClientProps {
  mandato: MandatoGestao;
}

type OrdenarPor = "tema" | "orgao" | "status" | "pagina";

export default function PainelGestaoClient({ mandato }: PainelGestaoClientProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTema, setFiltroTema] = useState<string>("todos");
  const [filtroOrgao, setFiltroOrgao] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("tema");
  const [ordemDesc, setOrdemDesc] = useState<boolean>(false);
  const [abaAtiva, setAbaAtiva] = useState<"propostas" | "fora_do_plano">("propostas");

  // Lista única de temas e órgãos para os dropdowns de filtro
  const temas = useMemo(() => {
    const setTemas = new Set(mandato.propostas.map((p) => p.tema));
    return Array.from(setTemas).sort();
  }, [mandato.propostas]);

  const orgaos = useMemo(() => {
    const setOrgaos = new Set(mandato.propostas.map((p) => p.orgao_alvo));
    return Array.from(setOrgaos).sort();
  }, [mandato.propostas]);

  // Filtragem
  const propostasFiltradas = useMemo(() => {
    return mandato.propostas.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
      if (filtroTema !== "todos" && p.tema !== filtroTema) return false;
      if (filtroOrgao !== "todos" && p.orgao_alvo !== filtroOrgao) return false;
      if (busca.trim() !== "") {
        const termo = busca.toLowerCase();
        const textoCompleto = `${p.trecho_verbatim} ${p.tema} ${p.orgao_alvo} ${p.observacao || ""}`.toLowerCase();
        if (!textoCompleto.includes(termo)) return false;
      }
      return true;
    });
  }, [mandato.propostas, filtroStatus, filtroTema, filtroOrgao, busca]);

  // Ordenação
  const propostasOrdenadas = useMemo(() => {
    return [...propostasFiltradas].sort((a, b) => {
      let resultado = 0;
      if (ordenarPor === "tema") {
        resultado = a.tema.localeCompare(b.tema);
      } else if (ordenarPor === "orgao") {
        resultado = a.orgao_alvo.localeCompare(b.orgao_alvo);
      } else if (ordenarPor === "status") {
        resultado = a.status.localeCompare(b.status);
      } else if (ordenarPor === "pagina") {
        resultado = a.plano_pagina - b.plano_pagina;
      }
      return ordemDesc ? -resultado : resultado;
    });
  }, [propostasFiltradas, ordenarPor, ordemDesc]);

  // Totais agregados gerais para os cartões de topo
  const contagemGeral = useMemo(() => {
    const total = mandato.propostas.length;
    let concluidas = 0;
    let emAndamento = 0;
    let semSinal = 0;
    for (const p of mandato.propostas) {
      if (p.status === "concluida") concluidas++;
      else if (p.status === "em_andamento" || p.status === "anunciada") emAndamento++;
      else if (p.status === "sem_sinal") semSinal++;
    }
    return {
      total,
      concluidas,
      emAndamento,
      semSinal,
      foraDoPlano: mandato.iniciativas_fora_do_plano.length,
    };
  }, [mandato]);

  // Handler de exportação CSV conforme regra RFC-4180
  const handleBaixarCsv = () => {
    const colunas = obterColunasCsvGestao();
    const nomeArquivo = `plano-governo-${mandato.slug}-${mandato.periodo.inicio}-${mandato.periodo.fim}.csv`;
    baixarCsv(colunas, propostasFiltradas, nomeArquivo);
  };

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO (STATUS GERAL) ═══ */}
      <section aria-labelledby="topo-metricas" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-text-soft">
            Plano TSE
          </span>
          <div className="mt-1 text-3xl font-bold text-text">{contagemGeral.total}</div>
          <p className="mt-1 text-xs text-text-soft">Propostas catalogadas</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Em execução / Obra
          </span>
          <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {contagemGeral.emAndamento}
          </div>
          <p className="mt-1 text-xs text-text-soft">Com contratos ou atos</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Concluídas
          </span>
          <div className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {contagemGeral.concluidas}
          </div>
          <p className="mt-1 text-xs text-text-soft">Entrega comprovada</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Sem sinal público
          </span>
          <div className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">
            {contagemGeral.semSinal}
          </div>
          <p className="mt-1 text-xs text-text-soft">Lacuna documentada</p>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO INLINE (SVG / CSS SEM LIBS EXTERNAS) ═══ */}
      <section aria-labelledby="grafico-distribuicao" className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 id="grafico-distribuicao" className="text-base font-semibold text-text">
              Distribuição da Situação do Plano
            </h2>
            <p className="text-xs text-text-soft">
              Percentual calculado sobre as {contagemGeral.total} propostas oficiais registradas na Justiça Eleitoral.
            </p>
          </div>
          <span className="text-xs font-medium text-text-soft">
            Última medição: {mandato.ultima_medicao}
          </span>
        </div>

        {/* Barra empilhada visual em CSS */}
        <div
          role="img"
          aria-label={`Distribuição das propostas: ${contagemGeral.concluidas} concluídas, ${contagemGeral.emAndamento} em andamento, ${contagemGeral.semSinal} sem sinal`}
          className="mt-4 flex h-6 w-full overflow-hidden rounded-lg bg-surface-3"
        >
          {contagemGeral.concluidas > 0 && (
            <div
              style={{ width: `${(contagemGeral.concluidas / contagemGeral.total) * 100}%` }}
              className="bg-emerald-500 transition-all"
              title={`Concluídas: ${contagemGeral.concluidas} (${Math.round((contagemGeral.concluidas / contagemGeral.total) * 100)}%)`}
            />
          )}
          {contagemGeral.emAndamento > 0 && (
            <div
              style={{ width: `${(contagemGeral.emAndamento / contagemGeral.total) * 100}%` }}
              className="bg-blue-500 transition-all"
              title={`Em andamento: ${contagemGeral.emAndamento} (${Math.round((contagemGeral.emAndamento / contagemGeral.total) * 100)}%)`}
            />
          )}
          {contagemGeral.semSinal > 0 && (
            <div
              style={{ width: `${(contagemGeral.semSinal / contagemGeral.total) * 100}%` }}
              className="bg-amber-400/80 transition-all"
              title={`Sem sinal público: ${contagemGeral.semSinal} (${Math.round((contagemGeral.semSinal / contagemGeral.total) * 100)}%)`}
            />
          )}
        </div>

        {/* Legenda com números exatos */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>Concluídas ({contagemGeral.concluidas})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-500" />
            <span>Em execução / Anunciadas ({contagemGeral.emAndamento})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-400" />
            <span>Sem sinal público ({contagemGeral.semSinal})</span>
          </div>
        </div>
      </section>

      {/* ═══ 3. ABAS: PROPOSTAS DO PLANO × FORA DO PLANO ═══ */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setAbaAtiva("propostas")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            abaAtiva === "propostas"
              ? "border-primary text-primary"
              : "border-transparent text-text-soft hover:text-text"
          }`}
        >
          Propostas do Plano ({mandato.propostas.length})
        </button>
        <button
          onClick={() => setAbaAtiva("fora_do_plano")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            abaAtiva === "fora_do_plano"
              ? "border-primary text-primary"
              : "border-transparent text-text-soft hover:text-text"
          }`}
        >
          Iniciativas Fora do Plano ({mandato.iniciativas_fora_do_plano.length})
        </button>
      </div>

      {abaAtiva === "propostas" ? (
        <>
          {/* ═══ 4. BARRA DE FILTROS, BUSCA E EXPORTAÇÃO CSV ═══ */}
          <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="busca-termo" className="mb-1 block text-xs font-medium text-text-soft">
                  Buscar no texto
                </label>
                <input
                  id="busca-termo"
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Ex.: hospital, rodovia, creche..."
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="filtro-status" className="mb-1 block text-xs font-medium text-text-soft">
                  Situação
                </label>
                <select
                  id="filtro-status"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="todos">Todas as situações</option>
                  {Object.entries(ROTULOS_STATUS).map(([st, info]) => (
                    <option key={st} value={st}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filtro-tema" className="mb-1 block text-xs font-medium text-text-soft">
                  Tema / Área
                </label>
                <select
                  id="filtro-tema"
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

              <div>
                <label htmlFor="filtro-orgao" className="mb-1 block text-xs font-medium text-text-soft">
                  Secretaria / Ministério
                </label>
                <select
                  id="filtro-orgao"
                  value={filtroOrgao}
                  onChange={(e) => setFiltroOrgao(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="todos">Todos os órgãos</option>
                  {orgaos.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha de ordenação e botão de download CSV */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-xs text-text-soft">
                <span>Ordenar por:</span>
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
                  Área {ordenarPor === "tema" && (ordemDesc ? "↓" : "↑")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ordenarPor === "orgao") setOrdemDesc(!ordemDesc);
                    else {
                      setOrdenarPor("orgao");
                      setOrdemDesc(false);
                    }
                  }}
                  className={`rounded px-2 py-1 ${ordenarPor === "orgao" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
                >
                  Órgão {ordenarPor === "orgao" && (ordemDesc ? "↓" : "↑")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ordenarPor === "status") setOrdemDesc(!ordemDesc);
                    else {
                      setOrdenarPor("status");
                      setOrdemDesc(false);
                    }
                  }}
                  className={`rounded px-2 py-1 ${ordenarPor === "status" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
                >
                  Situação {ordenarPor === "status" && (ordemDesc ? "↓" : "↑")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (ordenarPor === "pagina") setOrdemDesc(!ordemDesc);
                    else {
                      setOrdenarPor("pagina");
                      setOrdemDesc(false);
                    }
                  }}
                  className={`rounded px-2 py-1 ${ordenarPor === "pagina" ? "bg-primary/10 font-bold text-primary" : "hover:bg-surface-2"}`}
                >
                  Pág. TSE {ordenarPor === "pagina" && (ordemDesc ? "↓" : "↑")}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-soft">
                  Exibindo <strong>{propostasOrdenadas.length}</strong> de {mandato.propostas.length}
                </span>
                <button
                  type="button"
                  onClick={handleBaixarCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <span>📥</span> Baixar Planilha (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* ═══ 5. LISTA DE PROPOSTAS (CARDS COM CITAÇÃO LITERAL E EVIDÊNCIAS) ═══ */}
          <div className="space-y-4">
            {propostasOrdenadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-soft">
                Nenhuma proposta encontrada com os filtros selecionados.
              </div>
            ) : (
              propostasOrdenadas.map((p) => {
                const rotulo = ROTULOS_STATUS[p.status] || ROTULOS_STATUS.sem_sinal;
                const siglaOrgao = encontrarSiglaInstituicao(p.orgao_alvo);
                return (
                  <article
                    key={p.id}
                    className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm transition-all hover:border-border-strong"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                            {p.tema}
                          </span>
                          <span className="text-xs text-text-soft">
                            Órgão:{" "}
                            {siglaOrgao ? (
                              <Link
                                href={`/instituicoes/${siglaOrgao}`}
                                className="font-bold text-primary underline decoration-primary/40 hover:text-primary/80 inline-flex items-center gap-1"
                                title="Ver organograma, orçamento e contatos desta secretaria"
                              >
                                {p.orgao_alvo} ↗
                              </Link>
                            ) : (
                              <strong>{p.orgao_alvo}</strong>
                            )}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${rotulo.classe}`}
                      >
                        {rotulo.label}
                      </span>
                    </div>

                    {/* Citação verbatim do plano com página */}
                    <div className="mt-3">
                      <blockquote className="border-l-4 border-primary/40 pl-3 text-sm italic text-text">
                        &ldquo;{p.trecho_verbatim}&rdquo;
                      </blockquote>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-soft">
                        <span>Página {p.plano_pagina} do Plano TSE</span>
                        {mandato.plano_pdf_url && (
                          <a
                            href={mandato.plano_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline hover:text-primary/80"
                          >
                            PDF Oficial (TSE) ↗
                          </a>
                        )}
                        {mandato.plano_pdf_r2_url && (
                          <>
                            <span>·</span>
                            <a
                              href={mandato.plano_pdf_r2_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary hover:bg-primary/20"
                              title="Espelho CDN Cloudflare R2 comprimido e rápido"
                            >
                              ⚡ Espelho R2 ↗
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Evidências ou observação de lacuna */}
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-soft">
                        Evidências Documentadas ({p.evidencias.length})
                      </h4>

                      {p.evidencias.length === 0 ? (
                        <p className="mt-1 text-xs text-text-soft">
                          {p.observacao || "Nenhum instrumento executivo localizado em dados públicos abertos até a última medição."}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {p.evidencias.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex flex-col justify-between gap-1 rounded-lg bg-surface-2 p-2.5 text-xs sm:flex-row sm:items-center"
                            >
                              <div>
                                <span className="mr-2 inline-block rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-soft">
                                  {ev.tipo}
                                </span>
                                <a
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-text underline hover:text-primary"
                                >
                                  {ev.titulo}
                                </a>
                                <span className="ml-2 text-text-soft">({ev.orgao_emissor})</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-text-soft">
                                {ev.valor_reais && (
                                  <span className="font-semibold text-text">
                                    {formatCurrencyBRL(ev.valor_reais)}
                                  </span>
                                )}
                                <span>{ev.data_publicacao}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* ═══ 6. SEÇÃO: INICIATIVAS FORA DO PLANO ═══ */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-1 p-4 text-xs text-text-soft">
            <p className="font-semibold text-text">Por que esta seção existe?</p>
            <p className="mt-1">
              Governar é mais do que cumprir uma lista de campanha. Registrar ações de grande vulto
              que a gestão executou sem terem sido prometidas evita criar uma falsa impressão de inação
              nos temas que surgiram durante o mandato (como emergências climáticas ou repactuações).
            </p>
          </div>

          <div className="space-y-3">
            {mandato.iniciativas_fora_do_plano.map((ini) => (
              <div
                key={ini.id}
                className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface-3 px-2 py-0.5 text-xs font-semibold text-text">
                      {ini.tema}
                    </span>
                    <span className="text-xs text-text-soft">{ini.orgao}</span>
                  </div>
                  <span className="text-xs text-text-soft">{ini.data}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-text">{ini.titulo}</h3>
                <p className="mt-1 text-xs text-text-soft">{ini.descricao}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  {ini.valor_reais ? (
                    <span className="font-medium text-text">
                      Valor: <strong>{formatCurrencyBRL(ini.valor_reais)}</strong>
                    </span>
                  ) : <span />}
                  <a
                    href={ini.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Ver ato / fonte oficial ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
