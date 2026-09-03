"use client";

import { useEffect, useMemo, useState } from "react";
import Moeda from "@/app/components/Moeda";
import { semAcento } from "@/lib/busca/normalizar";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_TAC } from "@/lib/ambiental/tags-tac";
import type { AcordoTacContrato } from "@/lib/ambiental/tac-agregados";

/**
 * Os 106 acordos de TAC com filtros por texto, tags, status e ordenação.
 *
 * ═══ POR QUE ESTE COMPONENTE É DE CLIENTE ═══
 *
 * `TAC_ACORDOS_PROJETOS` (~114 KiB) reusa `TAC_POR_PROJETO` de
 * `tac-projetos.ts` por dentro — o MESMO array que a página de servidor
 * já importava. Em componente de cliente o array vai para o chunk servido
 * como asset estático, não para o bundle do Worker.
 */

let cacheAcordos: Promise<AcordoTacContrato[]> | null = null;

function buscarAcordos(): Promise<AcordoTacContrato[]> {
  if (!cacheAcordos) {
    cacheAcordos = fetch("/data/tac-projetos.json")
      .then((r) => r.json() as Promise<{ TAC_ACORDOS_PROJETOS: AcordoTacContrato[] }>)
      .then((d) => d.TAC_ACORDOS_PROJETOS);
  }
  return cacheAcordos;
}

function useTacAcordos(): AcordoTacContrato[] | null {
  const [lista, setLista] = useState<AcordoTacContrato[] | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarAcordos().then((d) => {
      if (vivo) setLista(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return lista;
}

type Ordem = "nome" | "valor" | "data";

const ROTULO_EXECUCAO: Record<string, string> = {
  Mineradora: "executado pela mineradora",
  Estado: "executado pelo Estado",
};

/** Gera tags para um contrato a partir do nome do projeto e do relato. */
function resolverTags(c: AcordoTacContrato): string[] {
  return extrairTagsDeCampos([c.projeto, c.relato], REGRAS_TAGS_TAC);
}

/** Status simplificado para exibição e filtragem. */
function resolverStatusExibicao(c: AcordoTacContrato): string {
  const s = c.status.toLowerCase();
  if (s === "concluído" || s === "concluido") return "Concluído";
  if (s === "em execução" || s === "em execucao") return "Em andamento";
  if (s === "não iniciado" || s === "nao iniciado") return "Não iniciado";
  if (s === "cancelado") return "Cancelado";
  return c.status;
}

export default function FiltroTAC() {
  const acordos = useTacAcordos();
  const [busca, setBusca] = useState("");
  const [tagSel, setTagSel] = useState<Set<string>>(new Set());
  const [statusFiltro, setStatusFiltro] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("valor");
  const [mostrando, setMostrando] = useState(40);

  const tagsDisponiveis = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of acordos ?? []) {
      for (const t of resolverTags(c)) {
        contagem.set(t, (contagem.get(t) ?? 0) + 1);
      }
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => ({ tag: t, n }));
  }, [acordos]);

  const statusOpcoes = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of acordos ?? []) {
      const s = resolverStatusExibicao(c);
      contagem.set(s, (contagem.get(s) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => ({ status: s, n }));
  }, [acordos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim() ? semAcento(busca.trim().toLowerCase()) : "";
    const lista = (acordos ?? []).filter((c) => {
      if (statusFiltro && resolverStatusExibicao(c) !== statusFiltro) return false;
      if (tagSel.size > 0) {
        const tags = resolverTags(c);
        if (![...tagSel].some((t) => tags.includes(t))) return false;
      }
      if (!termo) return true;
      return (
        semAcento(c.projeto.toLowerCase()).includes(termo) ||
        semAcento(c.mineradora.toLowerCase()).includes(termo) ||
        semAcento(c.orgao.toLowerCase()).includes(termo) ||
        (c.relato ? semAcento(c.relato.toLowerCase()).includes(termo) : false)
      );
    });
    const comparadores: Record<Ordem, (a: AcordoTacContrato, b: AcordoTacContrato) => number> = {
      nome: (a, b) => a.projeto.localeCompare(b.projeto, "pt-BR"),
      valor: (a, b) => b.previsto - a.previsto,
      data: (a, b) => (b.anoFinal ?? 0) - (a.anoFinal ?? 0) || (b.anoInicial ?? 0) - (a.anoInicial ?? 0),
    };
    return [...lista].sort(comparadores[ordem]);
  }, [busca, tagSel, statusFiltro, ordem, acordos]);

  const visiveis = filtrados.slice(0, mostrando);

  const valorTotal = useMemo(
    () => filtrados.reduce((t, c) => t + c.previsto, 0),
    [filtrados],
  );

  function toggleTag(tag: string) {
    setTagSel((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
    setMostrando(40);
  }

  function limparFiltros() {
    setBusca("");
    setTagSel(new Set());
    setStatusFiltro("");
    setOrdem("valor");
    setMostrando(40);
  }

  const filtroAtivo = Boolean(busca || tagSel.size > 0 || statusFiltro);

  if (!acordos) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
        Carregando contratos de TAC…
      </p>
    );
  }

  return (
    <div>
      {/* ═══ FILTROS ═══ */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-[.82em] font-medium text-text-soft">
              Buscar por projeto, mineradora ou órgão
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setMostrando(40);
              }}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
              placeholder="ex.: drones, Vale, licenciamento, SUTAF"
            />
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Situação
            </span>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setMostrando(40);
              }}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {statusOpcoes.map(({ status, n }) => (
                <option key={status} value={status}>
                  {status} ({n})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Ordenar por
            </span>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="valor">Maior valor previsto</option>
              <option value="nome">Nome (A–Z)</option>
              <option value="data">Data mais recente</option>
            </select>
          </label>
          {filtroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="pb-2 text-[.85em] font-medium text-text-soft underline hover:text-text"
            >
              limpar filtros
            </button>
          )}
        </div>

        {/* ═══ TAGS PILLS ═══ */}
        {tagsDisponiveis.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tagsDisponiveis.map(({ tag, n }) => {
              const ativa = tagSel.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-0.5 text-[.8em] font-medium transition-colors ${
                    ativa
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-soft hover:border-primary/50"
                  }`}
                  title={`${n} contrato${n === 1 ? "" : "s"}`}
                >
                  {tag}
                  <span className="ml-1 opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ CONTADOR ═══ */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtrados.length)}{" "}
          {filtrados.length === 1 ? "contrato" : "contratos"}
          {filtrados.length > 0 && (
            <>
              {" "}·{" "}
              <Moeda value={valorTotal} /> somados
            </>
          )}
        </p>
      </div>

      {/* ═══ LISTA ═══ */}
      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum contrato com esses filtros. Vazio aqui é resposta — não quer
          dizer que a busca falhou.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {visiveis.map((c) => {
            const tags = resolverTags(c);
            const statusExibicao = resolverStatusExibicao(c);
            const pctExecutado = c.previsto > 0 ? Math.round((c.executado / c.previsto) * 100) : 0;
            return (
              <div
                key={`${c.projeto}|${c.mineradora}`}
                className="rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text">{c.projeto}</p>
                    <p className="mt-0.5 text-[.88em] text-text-soft">
                      {[c.mineradora, c.orgao].filter(Boolean).join(" · ")}
                      {c.anoInicial !== null && c.anoFinal !== null
                        ? ` · ${c.anoInicial}–${c.anoFinal}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[.75em] font-medium ${
                        statusExibicao === "Concluído"
                          ? "border-green-600/30 bg-green-50 text-green-700"
                          : statusExibicao === "Em andamento"
                            ? "border-blue-600/30 bg-blue-50 text-blue-700"
                            : statusExibicao === "Cancelado"
                              ? "border-red-600/30 bg-red-50 text-red-700"
                              : "border-border text-text-soft"
                      }`}
                    >
                      {statusExibicao}
                    </span>
                    {tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[.75em] font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[.75em] text-text-soft">
                        +{tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[.82em] text-text-soft">
                  <span>
                    <strong className="font-medium text-text">Previsto:</strong>{" "}
                    <Moeda value={c.previsto} />
                  </span>
                  <span>
                    <strong className="font-medium text-text">Executado:</strong>{" "}
                    <Moeda value={c.executado} />
                    {pctExecutado > 0 && (
                      <span className="ml-1">({pctExecutado}%)</span>
                    )}
                  </span>
                  {c.transferido != null && c.transferido > 0 && (
                    <span>
                      <strong className="font-medium text-text">Transferido:</strong>{" "}
                      <Moeda value={c.transferido} />
                    </span>
                  )}
                  <span>
                    <strong className="font-medium text-text">Execução:</strong>{" "}
                    {ROTULO_EXECUCAO[c.execucao] ?? c.execucao}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[.82em] text-text-soft">
                    {c.status}
                  </span>
                  <span className="text-[.82em] text-text-soft">
                    {c.orgao}
                  </span>
                  <a
                    href="https://github.com/melkepinho/controle-popular/blob/main/docs/FONTE.md#painel-tacs-final"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[.82em] text-primary underline-offset-2 hover:underline"
                    title="Abrir fonte original do painel SEMAD/MG"
                  >
                    Verificar fonte
                  </a>
                </div>

                {c.relato && (
                  <details className="mt-2 text-[.9em] text-text-soft">
                    <summary className="cursor-pointer">
                      Breve relato da situação (fonte)
                    </summary>
                    <p className="mt-1.5">{c.relato}</p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mostrando < filtrados.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + 40)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais{" "}
          {formatNumberBR(Math.min(40, filtrados.length - mostrando))} de{" "}
          {formatNumberBR(filtrados.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
