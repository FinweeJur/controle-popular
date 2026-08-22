"use client";

import { useMemo, useState } from "react";
import Moeda from "@/app/components/Moeda";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { TAC_ACORDOS_PROJETOS, contratosParaCsv } from "@/lib/ambiental/tac-agregados";

/**
 * Os 106 contratos de TAC, buscáveis, filtráveis por mineradora/órgão/status/
 * execução, com "Breve relato da situação" expansível por contrato e
 * exportação em CSV do que estiver filtrado.
 *
 * ═══ POR QUE ESTE COMPONENTE É DE CLIENTE, E O QUE ISSO NÃO CUSTA ═══
 *
 * `TAC_ACORDOS_PROJETOS` (~114 KiB) reusa `TAC_POR_PROJETO` de
 * `tac-projetos.ts` por dentro (ver `lib/ambiental/tac-agregados.ts`) — o
 * MESMO array que `page.tsx` já importava para a antiga seção estática
 * "Contrato a contrato", que este componente substitui (ver o cabeçalho de
 * `page.tsx`). Não é payload novo se somado ao que a página já pagava; é o
 * mesmo módulo compartilhado, mais um complemento pequeno (execução +
 * transferido, ~17 KiB) que só existia no JSON bruto.
 *
 * ═══ POR QUE `<details>` E NÃO `<table>` ═══
 *
 * Mesmo padrão de `ConveniosClient.tsx` (`/ambiental/convenios`) e
 * `TabelaDecisoes.tsx` (`/ambiental/decisoes-lai`): lista de cartões, não
 * tabela — o campo mais rico de cada contrato (`relato`) é texto livre de
 * comprimento variável, que uma grade de colunas esconde ou trunca. Os três
 * valores em reais aparecem lado a lado dentro do cartão expandido, então a
 * comparação continua possível sem forçar layout de tabela.
 */

const TODOS = "";
const POR_PAGINA = 40;

function baixarCsv(conteudo: string, nomeArquivo: string) {
  // BOM UTF-8 na frente do conteúdo: sem ele o Excel brasileiro abre o CSV
  // com acento quebrado. `contratosParaCsv` não inclui o BOM de propósito —
  // é decisão de transporte/arquivo, não de conteúdo (ver `tac-agregados.ts`).
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ROTULO_EXECUCAO: Record<string, string> = {
  Mineradora: "executado pela mineradora",
  Estado: "executado pelo Estado",
};

export default function PainelTac() {
  const [busca, setBusca] = useState("");
  const [mineradora, setMineradora] = useState(TODOS);
  const [orgao, setOrgao] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [execucao, setExecucao] = useState(TODOS);
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const opcoes = useMemo(
    () => ({
      mineradoras: [...new Set(TAC_ACORDOS_PROJETOS.map((c) => c.mineradora))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
      orgaos: [...new Set(TAC_ACORDOS_PROJETOS.map((c) => c.orgao))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
      statuses: [...new Set(TAC_ACORDOS_PROJETOS.map((c) => c.status))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
      execucoes: [...new Set(TAC_ACORDOS_PROJETOS.map((c) => c.execucao))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    }),
    [],
  );

  function resetarPagina() {
    setMostrando(POR_PAGINA);
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim() ? semAcento(busca.trim()) : "";
    return TAC_ACORDOS_PROJETOS.filter((c) => {
      if (mineradora && c.mineradora !== mineradora) return false;
      if (orgao && c.orgao !== orgao) return false;
      if (status && c.status !== status) return false;
      if (execucao && c.execucao !== execucao) return false;
      if (!termo) return true;
      return (
        semAcento(c.projeto).includes(termo) ||
        semAcento(c.mineradora).includes(termo) ||
        (c.relato ? semAcento(c.relato).includes(termo) : false)
      );
    }).sort((a, b) => b.previsto - a.previsto);
  }, [busca, mineradora, orgao, status, execucao]);

  const visiveis = filtrados.slice(0, mostrando);
  const temFiltro = Boolean(busca || mineradora || orgao || status || execucao);

  function limparFiltros() {
    setBusca("");
    setMineradora(TODOS);
    setOrgao(TODOS);
    setStatus(TODOS);
    setExecucao(TODOS);
    resetarPagina();
  }

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(contratosParaCsv(filtrados), `tac-ambiental-mg-contratos-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface-2 p-4">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por projeto, mineradora ou relato
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              resetarPagina();
            }}
            placeholder="ex.: drones, Vale, licenciamento"
            aria-label="Buscar contratos de TAC"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          />
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Mineradora</span>
          <select
            value={mineradora}
            onChange={(e) => {
              setMineradora(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {opcoes.mineradoras.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Órgão</span>
          <select
            value={orgao}
            onChange={(e) => {
              setOrgao(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {opcoes.orgaos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {opcoes.statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Execução</span>
          <select
            value={execucao}
            onChange={(e) => {
              setExecucao(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {opcoes.execucoes.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </label>

        {temFiltro && (
          <button
            type="button"
            onClick={limparFiltros}
            className="rounded-md border border-border px-3 py-2 text-[.85em] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtrados.length)} {filtrados.length === 1 ? "contrato" : "contratos"} de{" "}
          {formatNumberBR(TAC_ACORDOS_PROJETOS.length)}
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filtrados.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtrados.length)})
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum contrato com esses filtros. Vazio aqui é resposta da busca — não quer dizer que
          faltou dado.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {visiveis.map((c) => (
            <details
              key={`${c.projeto}|${c.mineradora}`}
              className="group rounded-xl border border-border bg-surface px-4 py-3"
            >
              <summary className="cursor-pointer list-none">
                <span className="font-semibold text-text">{c.projeto}</span>
                <span className="mt-1 block text-[.88em] text-text-soft">
                  {c.mineradora} · {c.orgao} · {c.status} · {ROTULO_EXECUCAO[c.execucao] ?? c.execucao}
                  {c.anoInicial !== null && c.anoFinal !== null ? ` · ${c.anoInicial}–${c.anoFinal}` : ""}
                </span>
              </summary>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
                    Previsto
                  </p>
                  <p className="mt-0.5 font-medium text-text">
                    <Moeda value={c.previsto} />
                  </p>
                </div>
                <div>
                  <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
                    Executado
                  </p>
                  <p className="mt-0.5 font-medium text-text">
                    <Moeda value={c.executado} />
                  </p>
                </div>
                <div>
                  <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
                    Transferido
                  </p>
                  <p className="mt-0.5 font-medium text-text">
                    <Moeda value={c.transferido} />
                  </p>
                </div>
              </div>

              <div className="mt-3 text-[.92em] leading-relaxed text-text-soft">
                {c.relato ? (
                  <>
                    <p className="font-medium text-text">Relato da fonte</p>
                    <p className="mt-1.5">{c.relato}</p>
                  </>
                ) : (
                  <p className="italic">A fonte não publicou relato para este contrato.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {mostrando < filtrados.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtrados.length - mostrando))} de{" "}
          {formatNumberBR(filtrados.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
