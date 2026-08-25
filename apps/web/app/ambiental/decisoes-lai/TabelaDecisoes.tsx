"use client";

import { useEffect, useMemo, useState } from "react";
import type { DecisaoRecursoCgeMg } from "@/lib/ambiental/decisoes-cge";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * As decisões saíram do bundle e viram asset estático
 * (`public/data/decisoes-cge.json`) buscado uma vez por sessão �?" mesmo
 * padrão de `AuditoriaClient.tsx`/`ConveniosClient.tsx`. Motivo: teto de
 * 3 MiB gzip do Worker Free (10027). Antes de carregar, `null`.
 */
let decisoesCache: Promise<DecisaoRecursoCgeMg[]> | null = null;

function buscarDecisoes(): Promise<DecisaoRecursoCgeMg[]> {
  if (!decisoesCache) {
    decisoesCache = fetch("/data/decisoes-cge.json").then(
      (r) => r.json() as Promise<DecisaoRecursoCgeMg[]>
    );
  }
  return decisoesCache;
}

function useDecisoesCgeMg(): DecisaoRecursoCgeMg[] | null {
  const [decisoes, setDecisoes] = useState<DecisaoRecursoCgeMg[] | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarDecisoes().then((d) => {
      if (vivo) setDecisoes(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return decisoes;
}

/**
 * As 753 decisões, filtráveis, com exportação em CSV.
 *
 * �.��.��.� POR QUE ESTE COMPONENTE �? DE CLIENTE �.��.��.�
 *
 * `DECISOES_CGE_MG` é o array individual completo (753 registros). Página de
 * servidor não pode importá-lo �?" mesma regra e mesma divisão de
 * `ConveniosClient.tsx` (`/ambiental/convenios`): o array vai para o chunk de
 * cliente, servido como asset estático (teto de 25 MiB), e nunca entra no
 * bundle do Worker (teto de 3 MiB gzip). Ver `docs/ARQUITETURA.md`.
 *
 * �.��.��.� "TIPO" AQUI N�fO �? O MESMO "TIPO" DO GRÁFICO ACIMA �.��.��.�
 *
 * O gráfico e a tabela de `page.tsx` usam `DECISOES_CGE_POR_TIPO_ANO` �?" a
 * contagem do filtro oficial `ddlTipoDecisao`. Aqui, por registro, o único
 * rótulo disponível é `tipoPasta`: o nome da pasta no link do PDF, presente
 * só na estrutura "antiga" (475 dos 753). `docs/FONTES.md` já mediu que os
 * dois às vezes DISCORDAM no mesmo ano �?" por isso o filtro abaixo nunca
 * chama isso de "tipo oficial", e os registros sem pasta aparecem como "tipo
 * não registrado neste link", nunca escondidos.
 */

const POR_PAGINA = 50;
const TODOS = "";
const SEM_TIPO = "__sem_tipo__";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[�?-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: DecisaoRecursoCgeMg[]): string {
  const BOM = "﻿";
  const cabecalho = [
    "ano",
    "orgao_sigla",
    "tipo_pasta",
    "arquivo",
    "sei_id",
    "link_provavelmente_quebrado",
    "url",
  ].join(";");
  const corpo = linhas.map((d) =>
    [
      d.ano,
      d.orgaoSigla ?? "",
      d.tipoPasta ?? "",
      d.arquivo,
      d.seiId ?? "",
      d.linkProvavelmenteQuebrado ? "sim" : "não",
      d.url,
    ]
      .map(csvEscape)
      .join(";"),
  );
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TabelaDecisoes() {
  const decisoes = useDecisoesCgeMg();
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState<string>(TODOS);
  const [tipo, setTipo] = useState<string>(TODOS);
  const [soQuebrados, setSoQuebrados] = useState(false);
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const anos = useMemo(
    () => [...new Set((decisoes ?? []).map((d) => d.ano))].sort((a, b) => b - a),
    [decisoes],
  );
  const tipos = useMemo(
    () =>
      [...new Set((decisoes ?? []).map((d) => d.tipoPasta).filter((t): t is string => t !== null))].sort(),
    [decisoes],
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim() ? normalizar(busca.trim()) : "";
    return (decisoes ?? []).filter((d) => {
      if (ano !== TODOS && String(d.ano) !== ano) return false;
      if (tipo === SEM_TIPO && d.tipoPasta !== null) return false;
      if (tipo !== TODOS && tipo !== SEM_TIPO && d.tipoPasta !== tipo) return false;
      if (soQuebrados && !d.linkProvavelmenteQuebrado) return false;
      if (!termo) return true;
      return (
        normalizar(d.arquivo).includes(termo) ||
        (d.orgaoSigla ? normalizar(d.orgaoSigla).includes(termo) : false) ||
        (d.seiId ? normalizar(d.seiId).includes(termo) : false)
      );
    });
  }, [busca, ano, tipo, soQuebrados, decisoes]);

  const visiveis = filtradas.slice(0, mostrando);

  function resetarPagina() {
    setMostrando(POR_PAGINA);
  }

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(filtradas), `decisoes-lai-cge-mg-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por arquivo, órgão ou nº SEI
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              resetarPagina();
            }}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            placeholder="ex.: IEF, SEI_40618973, Nota_Tecnica_14"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ano</span>
          <select
            value={ano}
            onChange={(e) => {
              setAno(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Tipo (rótulo da pasta)</span>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={SEM_TIPO}>Tipo não registrado neste link</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-[.92em] text-text-soft">
          <input
            type="checkbox"
            checked={soQuebrados}
            onChange={(e) => {
              setSoQuebrados(e.target.checked);
              resetarPagina();
            }}
          />
          Só com link provavelmente quebrado
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtradas.length)} {filtradas.length === 1 ? "decisão" : "decisões"}
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradas.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhuma decisão com esses filtros. Vazio aqui é resposta �?" não quer dizer que a busca
          falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {visiveis.map((d) => (
            <li
              key={`${d.ano}|${d.url}`}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-[.9em]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-text">
                  {d.ano} · {d.orgaoSigla ?? "órgão não registrado neste link"}
                </p>
                {d.linkProvavelmenteQuebrado && (
                  <span className="rounded-md border border-border px-2 py-0.5 text-[.78em] text-text-soft">
                    link provavelmente quebrado
                  </span>
                )}
              </div>
              <p className="mt-1 text-text-soft">
                {d.tipoPasta ?? "tipo não registrado neste link"}
                {d.seiId ? ` · processo SEI ${d.seiId}` : ""}
              </p>
              <p className="mt-1.5 break-all">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-accent"
                >
                  {d.arquivo}
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}

      {mostrando < filtradas.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtradas.length - mostrando))} de{" "}
          {formatNumberBR(filtradas.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
