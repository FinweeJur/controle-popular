"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConvenioAmbientalMg } from "@/lib/ambiental/convenios-mg";
import {
  formatCurrencyCompactaBR,
  formatDateBR,
  formatNumberBR,
} from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_CONVENIOS } from "@/lib/ambiental/tags-convenios";

/**
 * Lista dos 870 convênios com filtros por texto, esfera e tags.
 *
 * ═══ POR QUE ESTE COMPONENTE É DE CLIENTE ═══
 *
 * `convenios-ambientais-mg.json` pesa ~930 KiB e 59% disso é o campo
 * `objetivo`. Em componente de cliente o array vai para o chunk servido como
 * asset estático (teto 25 MiB), não para o bundle do Worker (3 MiB gzip).
 */

let conveniosCache: Promise<ConvenioAmbientalMg[]> | null = null;

function buscarConvenios(): Promise<ConvenioAmbientalMg[]> {
  if (!conveniosCache) {
    conveniosCache = fetch("/data/convenios-ambientais-mg.json").then(
      (r) => r.json() as Promise<ConvenioAmbientalMg[]>,
    );
  }
  return conveniosCache;
}

function useConveniosAmbientaisMg(): ConvenioAmbientalMg[] | null {
  const [convenios, setConvenios] = useState<ConvenioAmbientalMg[] | null>(
    null,
  );
  useEffect(() => {
    let vivo = true;
    buscarConvenios().then((d) => {
      if (vivo) setConvenios(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return convenios;
}

type Ordem = "nome" | "valor" | "data" | "ano";

function resolverEsfera(c: ConvenioAmbientalMg): string {
  if (c.esfera) return c.esfera;
  const o = semAcento(c.orgao);
  if (o.includes("federal") || o.includes("ministerio") || o.includes("uniao"))
    return "Federal";
  if (o.includes("municipio") || o.includes("municipal")) return "Municipal";
  return "Estadual";
}

function resolverTags(c: ConvenioAmbientalMg): string[] {
  if (c.tags && c.tags.length > 0) return c.tags;
  return extrairTagsDeCampos([c.nome, c.objetivo], REGRAS_TAGS_CONVENIOS);
}

function resolverResumo(c: ConvenioAmbientalMg): string {
  if (c.resumo_execucao) return c.resumo_execucao;
  if (c.diasDeProrrogacao > 0) {
    return `Prorrogado ${formatNumberBR(c.diasDeProrrogacao)} dias`;
  }
  return "Sem prorrogação";
}

function resolverSituacao(c: ConvenioAmbientalMg): string {
  if (c.situacao_execucao) return c.situacao_execucao;
  if (c.prazoAtual) {
    const hoje = new Date();
    const prazo = new Date(c.prazoAtual);
    if (prazo < hoje) return "Encerrado";
    return "Vigente";
  }
  return "Sem prazo informado";
}

export default function FiltroConvenios() {
  const convenios = useConveniosAmbientaisMg();
  const [busca, setBusca] = useState("");
  const [esfera, setEsfera] = useState("");
  const [tagSel, setTagSel] = useState<Set<string>>(new Set());
  const [ordem, setOrdem] = useState<Ordem>("valor");
  const [mostrando, setMostrando] = useState(40);

  const esferas = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of convenios ?? []) {
      const e = resolverEsfera(c);
      contagem.set(e, (contagem.get(e) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([e]) => e);
  }, [convenios]);

  const tagsDisponiveis = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of convenios ?? []) {
      for (const t of resolverTags(c)) {
        contagem.set(t, (contagem.get(t) ?? 0) + 1);
      }
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => ({ tag: t, n }));
  }, [convenios]);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = (convenios ?? []).filter((c) => {
      if (esfera && resolverEsfera(c) !== esfera) return false;
      if (tagSel.size > 0) {
        const tags = resolverTags(c);
        if (![...tagSel].some((t) => tags.includes(t))) return false;
      }
      if (!termo) return true;
      return (
        semAcento(c.nome.toLowerCase()).includes(termo) ||
        semAcento(c.objetivo.toLowerCase()).includes(termo) ||
        semAcento(c.orgao.toLowerCase()).includes(termo) ||
        semAcento(c.convenente.toLowerCase()).includes(termo) ||
        semAcento(c.municipio.toLowerCase()).includes(termo)
      );
    });
    const comparadores: Record<
      Ordem,
      (a: ConvenioAmbientalMg, b: ConvenioAmbientalMg) => number
    > = {
      nome: (a, b) => a.nome.localeCompare(b.nome, "pt"),
      valor: (a, b) => b.valorTotal - a.valorTotal,
      data: (a, b) => {
        const da = a.prazoAtual ?? a.prazoOriginal ?? "";
        const db = b.prazoAtual ?? b.prazoOriginal ?? "";
        return db.localeCompare(da);
      },
      ano: (a, b) => b.ano - a.ano || b.valorTotal - a.valorTotal,
    };
    return [...lista].sort(comparadores[ordem]);
  }, [busca, esfera, tagSel, ordem, convenios]);

  const visiveis = filtrados.slice(0, mostrando);

  const valorTotal = useMemo(
    () => filtrados.reduce((t, c) => t + c.valorTotal, 0),
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
    setEsfera("");
    setTagSel(new Set());
    setOrdem("valor");
    setMostrando(40);
  }

  const filtroAtivo = Boolean(busca || esfera || tagSel.size > 0);

  if (!convenios) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
        Carregando convênios…
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
              Buscar por nome, órgão, convenente ou município
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setMostrando(40);
              }}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
              placeholder="ex.: nascente, Diamantina, reflorestamento"
            />
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Esfera
            </span>
            <select
              value={esfera}
              onChange={(e) => {
                setEsfera(e.target.value);
                setMostrando(40);
              }}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {esferas.map((e) => (
                <option key={e} value={e}>
                  {e}
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
              <option value="valor">Maior valor</option>
              <option value="nome">Nome (A–Z)</option>
              <option value="data">Data mais recente</option>
              <option value="ano">Ano mais recente</option>
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
                  title={`${n} convênio${n === 1 ? "" : "s"}`}
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
          {filtrados.length === 1 ? "convênio" : "convênios"}
          {filtrados.length > 0 && (
            <>
              {" "}
              · {formatCurrencyCompactaBR(valorTotal)} somados
            </>
          )}
        </p>
      </div>

      {/* ═══ LISTA ═══ */}
      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum convênio com esses filtros. Vazio aqui é resposta — não quer
          dizer que a busca falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visiveis.map((c) => {
            const tags = resolverTags(c);
            const esf = resolverEsfera(c);
            const resumo = resolverResumo(c);
            const situacao = resolverSituacao(c);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-text">
                    {c.nome || "(sem nome na fonte)"}
                  </p>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[.75em] font-medium text-text-soft">
                      {esf}
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
                <p className="mt-1 text-[.88em] text-text-soft">
                  {[c.orgao, c.convenente, c.municipio, c.ano]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-[.92em] text-text-soft">
                  <strong className="font-medium text-text">
                    {formatCurrencyCompactaBR(c.valorTotal)}
                  </strong>
                  {c.prazoOriginal && c.prazoAtual && (
                    <>
                      {" · prazo original "}
                      {formatDateBR(c.prazoOriginal)}
                      {c.diasDeProrrogacao > 0 ? (
                        <>
                          {" → hoje "}
                          {formatDateBR(c.prazoAtual)}{" "}
                          <strong className="font-medium text-text">
                            (+{formatNumberBR(c.diasDeProrrogacao)} dias)
                          </strong>
                        </>
                      ) : (
                        ", sem prorrogação"
                      )}
                    </>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[.82em] text-text-soft">
                  <span>
                    <strong className="font-medium text-text">Execução:</strong>{" "}
                    {resumo}
                  </span>
                  <span>
                    <strong className="font-medium text-text">Situação:</strong>{" "}
                    {situacao}
                  </span>
                  {typeof c.percentual_execucao === "number" && (
                    <span>
                      <strong className="font-medium text-text">
                        Progresso:
                      </strong>{" "}
                      {c.percentual_execucao}%
                    </span>
                  )}
                </div>
                {c.objetivo && (
                  <details className="mt-2 text-[.9em] text-text-soft">
                    <summary className="cursor-pointer">
                      Objetivo, como a fonte escreveu
                    </summary>
                    <p className="mt-1.5">{c.objetivo}</p>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
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
