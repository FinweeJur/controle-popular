"use client";

import { useMemo, useState } from "react";
import { formatNumberBR } from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import type { CondicionanteLinha } from "@/lib/db/queries/condicionantes";

/**
 * Tabela de condicionantes: filtro, ordenação por coluna e CSV do filtrado
 * (regra do dono — cinco coisas). Recebe as linhas do servidor; o piloto
 * começa vazio e o componente diz isso com todas as letras (AGENTS §7).
 */

type Ordem = "ordem" | "status" | "tipo" | "orgao" | "empreendimento";

const ROTULO_STATUS: Record<string, string> = {
  cumprida: "Cumprida",
  parcial: "Parcial",
  nao_cumprida: "Não cumprida",
  nao_informado: "Não informado (sem evidência)",
  em_analise: "Em análise",
};

const ORDEM_STATUS: Record<string, number> = {
  nao_cumprida: 0,
  parcial: 1,
  em_analise: 2,
  cumprida: 3,
  nao_informado: 4,
};

const COLUNAS_CSV: ColunaCsv<CondicionanteLinha>[] = [
  { chave: "empreendimento", rotulo: "Empreendimento" },
  { chave: "ordemNaFonte", rotulo: "Nº na fonte" },
  { chave: "texto", rotulo: "Condicionante" },
  { chave: "tipo", rotulo: "Tipo" },
  { chave: "prazo", rotulo: "Prazo" },
  { chave: "orgao", rotulo: "Órgão" },
  {
    chave: "status",
    rotulo: "Status",
    formatar: (v: string) => ROTULO_STATUS[v] ?? v,
  },
  { chave: "metodoStatus", rotulo: "Método do status" },
  {
    chave: "documentoUrlFonte",
    rotulo: "Fonte",
    formatar: (_v, linha) => linha.documentoUrlR2 ?? linha.documentoUrlFonte ?? "",
  },
];

export default function FiltroCondicionantes({
  linhas,
}: {
  linhas: CondicionanteLinha[];
}) {
  const [busca, setBusca] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [orgao, setOrgao] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("ordem");

  const empreendimentos = useMemo(() => {
    const s = new Set<string>();
    for (const l of linhas) s.add(l.empreendimento);
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [linhas]);

  const tipos = useMemo(() => {
    const s = new Set<string>();
    for (const l of linhas) s.add(l.tipo);
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [linhas]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    for (const l of linhas) s.add(l.status);
    return [...s].sort(
      (a, b) => (ORDEM_STATUS[a] ?? 99) - (ORDEM_STATUS[b] ?? 99),
    );
  }, [linhas]);

  const orgaos = useMemo(() => {
    const s = new Set<string>();
    for (const l of linhas) s.add(l.orgao);
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [linhas]);

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = linhas.filter((l) => {
      if (empreendimento && l.empreendimento !== empreendimento) return false;
      if (tipo && l.tipo !== tipo) return false;
      if (status && l.status !== status) return false;
      if (orgao && l.orgao !== orgao) return false;
      if (!termo) return true;
      return (
        semAcento(l.texto.toLowerCase()).includes(termo) ||
        semAcento(l.orgao.toLowerCase()).includes(termo) ||
        semAcento((l.prazo ?? "").toLowerCase()).includes(termo)
      );
    });
    return [...lista].sort((a, b) => {
      if (ordem === "status")
        return (ORDEM_STATUS[a.status] ?? 99) - (ORDEM_STATUS[b.status] ?? 99);
      if (ordem === "tipo") return a.tipo.localeCompare(b.tipo, "pt-BR");
      if (ordem === "orgao") return a.orgao.localeCompare(b.orgao, "pt-BR");
      if (ordem === "empreendimento")
        return a.empreendimento.localeCompare(b.empreendimento, "pt-BR");
      return (a.ordemNaFonte ?? 0) - (b.ordemNaFonte ?? 0);
    });
  }, [linhas, busca, empreendimento, tipo, status, orgao, ordem]);

  const filtroAtivo = Boolean(
    busca || empreendimento || tipo || status || orgao,
  );

  function limpar() {
    setBusca("");
    setEmpreendimento("");
    setTipo("");
    setStatus("");
    setOrgao("");
    setOrdem("ordem");
  }

  if (linhas.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-text-soft">
        <p className="font-medium text-text">Acervo vazio no piloto.</p>
        <p className="mt-2">
          A licença prévia de Irapé (10/12/1997) tem 47 condicionantes e a de
          Setúbal (2006) tem 36 — contagens confirmadas na fonte em 23/09/2026.
          O texto integral item a item ainda não foi localizado no SIAM legado
          nem no SEMAD. Enquanto não houver trecho oficial, não publicamos
          linha inventada: status <em>não informado</em> sem evidência é regra
          do dono (decisão 1).
        </p>
        <p className="mt-2">
          Enquanto isso, veja os documentos oficiais e o rodapé “Para saber
          mais” abaixo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Buscar texto</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="reassentamento, prazo…"
            className="min-w-[12rem] rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Empreendimento</span>
          <select
            value={empreendimento}
            onChange={(e) => setEmpreendimento(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="">Todos</option>
            {empreendimentos.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="">Todos</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Órgão</span>
          <select
            value={orgao}
            onChange={(e) => setOrgao(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="">Todos</option>
            {orgaos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-soft">Ordenar por</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <option value="ordem">Nº na fonte</option>
            <option value="status">Status</option>
            <option value="tipo">Tipo</option>
            <option value="orgao">Órgão</option>
            <option value="empreendimento">Empreendimento</option>
          </select>
        </label>
        {filtroAtivo && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2"
          >
            Limpar
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            baixarCsv(
              COLUNAS_CSV,
              filtradas,
              `condicionantes-ambientais-${new Date().toISOString().slice(0, 10)}.csv`,
            )
          }
          className="rounded-lg border border-accent/50 px-3 py-2 text-sm text-accent hover:bg-surface-2"
          disabled={filtradas.length === 0}
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      <p className="mt-3 text-sm text-text-soft">
        Mostrando {formatNumberBR(filtradas.length)} de{" "}
        {formatNumberBR(linhas.length)}.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-soft">
              <th className="py-2 pr-3 font-medium">Nº</th>
              <th className="py-2 pr-3 font-medium">Condicionante</th>
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 font-medium">Órgão</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <tr key={l.id} className="border-b border-border/50 align-top">
                <td className="py-2 pr-3 font-tabular">{l.ordemNaFonte ?? "—"}</td>
                <td className="py-2 pr-3">{l.texto}</td>
                <td className="py-2 pr-3">{l.tipo}</td>
                <td className="py-2 pr-3">{l.orgao}</td>
                <td className="py-2 pr-3">
                  <span title={l.metodoStatus}>
                    {ROTULO_STATUS[l.status] ?? l.status}
                  </span>
                </td>
                <td className="py-2">
                  {(l.documentoUrlR2 ?? l.documentoUrlFonte) && (
                    <a
                      href={l.documentoUrlR2 ?? l.documentoUrlFonte ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Fonte ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
