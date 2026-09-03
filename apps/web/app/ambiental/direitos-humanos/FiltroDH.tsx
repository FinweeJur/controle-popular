"use client";

import { useMemo, useState } from "react";
import type { RelatorioDireitosHumanos } from "@/lib/direitos-humanos/relatorios";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";

/**
 * Acervo de relatórios de direitos humanos com busca, filtros e ordenação
 * client-side: são 9 relatórios, então o server component passa tudo por
 * prop e o navegador filtra local, sem round-trip.
 */

const ROTULO_TEMA: Record<string, string> = {
  pidesca_socioambiental: "PIDESCA, meio ambiente e empresas",
  povos_indigenas: "Povos indígenas e terras tradicionais",
  quilombolas_afrodescendentes: "Afrodescendentes e quilombos",
  combate_tortura_carcere: "Combate à tortura e sistema prisional",
  mineracao_barragens: "Mineração e barragens",
  defensores_direitos_humanos: "Defensores de direitos humanos",
};

function rotuloTema(tema: string): string {
  return ROTULO_TEMA[tema] ?? tema.replace(/_/g, " ");
}

const ROTULO_ESFERA: Record<string, string> = {
  internacional: "Internacional (ONU)",
  regional_interamericana: "Regional interamericana (OEA)",
  nacional: "Nacional (Brasil)",
};

type Ordem = "ano-recente" | "ano-antigo" | "titulo";

export default function FiltroDH({
  relatorios,
}: {
  relatorios: RelatorioDireitosHumanos[];
}) {
  const [busca, setBusca] = useState("");
  const [tema, setTema] = useState("");
  const [orgao, setOrgao] = useState("");
  const [esfera, setEsfera] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("ano-recente");

  const temas = useMemo(() => {
    const set = new Set<string>();
    for (const r of relatorios) set.add(r.tema);
    return [...set].sort((a, b) =>
      rotuloTema(a).localeCompare(rotuloTema(b), "pt"),
    );
  }, [relatorios]);

  const orgaos = useMemo(() => {
    const set = new Set<string>();
    for (const r of relatorios) set.add(r.orgao);
    return [...set].sort((a, b) => a.localeCompare(b, "pt"));
  }, [relatorios]);

  const esferas = useMemo(() => {
    const set = new Set<string>();
    for (const r of relatorios) set.add(r.esfera);
    return [...set].sort((a, b) =>
      (ROTULO_ESFERA[a] ?? a).localeCompare(ROTULO_ESFERA[b] ?? b, "pt"),
    );
  }, [relatorios]);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = relatorios.filter((r) => {
      if (tema && r.tema !== tema) return false;
      if (orgao && r.orgao !== orgao) return false;
      if (esfera && r.esfera !== esfera) return false;
      if (!termo) return true;
      return (
        semAcento(r.titulo.toLowerCase()).includes(termo) ||
        semAcento(r.orgao.toLowerCase()).includes(termo)
      );
    });
    return [...lista].sort((a, b) => {
      if (ordem === "ano-recente") return b.ano - a.ano;
      if (ordem === "ano-antigo") return a.ano - b.ano;
      return a.titulo.localeCompare(b.titulo, "pt");
    });
  }, [busca, tema, orgao, esfera, ordem, relatorios]);

  const filtroAtivo = Boolean(busca || tema || orgao || esfera);

  function limparFiltros() {
    setBusca("");
    setTema("");
    setOrgao("");
    setEsfera("");
    setOrdem("ano-recente");
  }

  return (
    <div>
      {/* ═══ FILTROS ═══ */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-[.82em] font-medium text-text-soft">
              Buscar por título ou órgão
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
              placeholder="ex.: Brumadinho, CIDH, barragens"
            />
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Tema
            </span>
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todos</option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {rotuloTema(t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Órgão
            </span>
            <select
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todos</option>
              {orgaos.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Esfera
            </span>
            <select
              value={esfera}
              onChange={(e) => setEsfera(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {esferas.map((esf) => (
                <option key={esf} value={esf}>
                  {ROTULO_ESFERA[esf] ?? esf}
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
              <option value="ano-recente">Ano mais recente</option>
              <option value="ano-antigo">Ano mais antigo</option>
              <option value="titulo">Título (A–Z)</option>
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
      </div>

      {/* ═══ CONTADOR ═══ */}
      <p className="mt-4 text-[.88em] text-text-soft" role="status">
        {filtroAtivo
          ? `${formatNumberBR(filtrados.length)} de ${formatNumberBR(relatorios.length)} relatórios`
          : `${formatNumberBR(filtrados.length)} ${filtrados.length === 1 ? "relatório" : "relatórios"}`}
      </p>

      {/* ═══ LISTA ═══ */}
      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum relatório com esses filtros. Vazio aqui é resposta — não quer
          dizer que a busca falhou.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {filtrados.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {r.orgao}
                  </span>
                  <span className="text-xs text-muted font-medium">{r.ano}</span>
                  <span className="rounded bg-surface-3 px-2 py-0.5 text-[11px] text-muted">
                    {r.tema}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {r.esfera.toUpperCase()}
                  </span>
                  <BotaoAlertaContextual
                    tipo="resumo_pagina"
                    titulo={`${r.orgao} (${r.ano}): ${r.titulo}`}
                    orgaoTerritorio={
                      r.municipios.length > 0
                        ? r.municipios.join(", ")
                        : r.estados.length > 0
                          ? r.estados.join(", ")
                          : "Brasil"
                    }
                    identificador={`Relatório Oficial ${r.orgao} — ${r.ano}`}
                    link={r.linkOficial}
                    resumo={r.resumoCidadao}
                    variante="icone"
                  />
                </div>
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                {r.titulo}
              </h3>
              <p className="mt-2 text-sm text-muted">{r.resumoCidadao}</p>

              <div className="mt-4 rounded-xl bg-surface-1 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recomendações Chave ao Estado:
                </span>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                  {r.recomendacoesChave.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-xs text-muted">
                  Estados: {r.estados.join(", ")} | {r.esfera.replace("_", " ")}
                </span>
                <a
                  href={r.linkOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Abrir documento oficial ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
