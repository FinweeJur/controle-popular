"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { semAcento } from "@/lib/busca/normalizar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { ReuniaoCopam } from "@/lib/db/queries/copam";

/**
 * As reuniões do COPAM (454 na fonte, ver o docstring de
 * `etl/betim/etl/apis/copam_reunioes.py`), buscáveis por título, filtráveis
 * por câmara técnica/situação/ano, ordenáveis por coluna (inclusive a
 * câmara técnica — o "tipo/classe" de uma reunião de conselho), com
 * exportação em CSV do que estiver filtrado.
 *
 * Array pequeno o bastante para caber inteiro no cliente — mesmo raciocínio
 * de `BuscaMunicipio.tsx` nesta mesma pasta e de
 * `listarMunicipiosComItensCopam()`: nada aqui existe por causa do teto de
 * payload do Worker, é só o padrão de interação do resto do portal
 * (`TabelaDecisoes.tsx`, `PainelBarragens.tsx`).
 */

const TODOS = "";
const SEM_CAMARA = "__sem_camara__";
const POR_PAGINA = 50;

type Coluna = "data" | "camaraTecnica" | "situacao" | "qtdItensPauta";
type Direcao = "asc" | "desc";

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: ReuniaoCopam[], situacaoRotulo: Record<string, string>): string {
  const BOM = "﻿";
  const cabecalho = [
    "id_fonte",
    "titulo",
    "data",
    "camara_tecnica",
    "regional",
    "situacao",
    "qtd_itens_pauta",
    "link_detalhe",
  ].join(";");
  const corpo = linhas.map((r) =>
    [
      r.idFonte,
      r.titulo,
      r.data,
      r.camaraTecnica ?? "",
      r.regional ?? "",
      situacaoRotulo[r.situacao] ?? r.situacao,
      r.qtdItensPauta,
      r.linkDetalhe,
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

/** Ano de uma data Postgres "YYYY-MM-DD" — nunca `new Date(string)`: o
 *  parser em UTC rola a data 1 dia para trás em fuso Brasil (mesma
 *  armadilha documentada em `formatDateBR`, `lib/betim/format.ts`). */
function anoDe(dataISO: string): number {
  return Number(dataISO.slice(0, 4));
}

export default function TabelaReunioes({
  reunioes,
  situacaoRotulo,
}: {
  reunioes: ReuniaoCopam[];
  situacaoRotulo: Record<string, string>;
}) {
  const [busca, setBusca] = useState("");
  const [camara, setCamara] = useState(TODOS);
  const [situacao, setSituacao] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [coluna, setColuna] = useState<Coluna>("data");
  const [direcao, setDirecao] = useState<Direcao>("desc");
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const camaras = useMemo(
    () =>
      [...new Set(reunioes.map((r) => r.camaraTecnica).filter((c): c is string => c !== null))].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [reunioes],
  );
  const anos = useMemo(
    () => [...new Set(reunioes.map((r) => anoDe(r.data)))].sort((a, b) => b - a),
    [reunioes],
  );
  const situacoes = useMemo(
    () => [...new Set(reunioes.map((r) => r.situacao))],
    [reunioes],
  );

  function resetarPagina() {
    setMostrando(POR_PAGINA);
  }

  function alternarOrdenacao(col: Coluna) {
    if (coluna === col) {
      setDirecao((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setColuna(col);
      setDirecao(col === "camaraTecnica" || col === "situacao" ? "asc" : "desc");
    }
    resetarPagina();
  }

  const filtradasEOrdenadas = useMemo(() => {
    const termo = busca.trim() ? semAcento(busca.trim()) : "";
    const filtradas = reunioes.filter((r) => {
      if (camara === SEM_CAMARA && r.camaraTecnica !== null) return false;
      if (camara !== TODOS && camara !== SEM_CAMARA && r.camaraTecnica !== camara) return false;
      if (situacao !== TODOS && r.situacao !== situacao) return false;
      if (ano !== TODOS && String(anoDe(r.data)) !== ano) return false;
      if (!termo) return true;
      return semAcento(r.titulo).includes(termo);
    });
    const sinal = direcao === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      switch (coluna) {
        case "data":
          return sinal * a.data.localeCompare(b.data);
        case "camaraTecnica":
          return (
            sinal *
            (a.camaraTecnica ?? "").localeCompare(b.camaraTecnica ?? "", "pt-BR")
          );
        case "situacao":
          return (
            sinal *
            (situacaoRotulo[a.situacao] ?? a.situacao).localeCompare(
              situacaoRotulo[b.situacao] ?? b.situacao,
              "pt-BR",
            )
          );
        case "qtdItensPauta":
          return sinal * (a.qtdItensPauta - b.qtdItensPauta);
        default:
          return 0;
      }
    });
  }, [reunioes, busca, camara, situacao, ano, coluna, direcao, situacaoRotulo]);

  const visiveis = filtradasEOrdenadas.slice(0, mostrando);
  const temFiltro = Boolean(busca || camara || situacao || ano);

  function limparFiltros() {
    setBusca("");
    setCamara(TODOS);
    setSituacao(TODOS);
    setAno(TODOS);
    resetarPagina();
  }

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(filtradasEOrdenadas, situacaoRotulo), `copam-reunioes-${hoje}.csv`);
  }

  // Função de render (não componente): chamada direta evita recriar um
  // tipo de componente a cada render e mantém as colunas estáveis na
  // reconciliação.
  function cabecalho({
    col,
    rotulo,
    alinhar = "left",
  }: {
    col: Coluna;
    rotulo: string;
    alinhar?: "left" | "right";
  }) {
    const ativo = coluna === col;
    const ariaSort = ativo ? (direcao === "asc" ? "ascending" : "descending") : "none";
    return (
      // aria-sort pertence ao <th>, não ao botão interno.
      <th
        className={`py-2 pr-3 font-medium ${alinhar === "right" ? "text-right" : "text-left"}`}
        aria-sort={ariaSort}
      >
        <button
          type="button"
          onClick={() => alternarOrdenacao(col)}
          className="inline-flex items-center gap-1 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {rotulo}
          <span aria-hidden className="text-[.75em] opacity-70">
            {ativo ? (direcao === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">Buscar por título</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              resetarPagina();
            }}
            placeholder="ex.: barragem, licenciamento, retificação"
            aria-label="Buscar reuniões do COPAM por título"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          />
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Câmara técnica</span>
          <select
            value={camara}
            onChange={(e) => {
              setCamara(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {camaras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={SEM_CAMARA}>Sem câmara registrada</option>
          </select>
        </label>

        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Situação</span>
          <select
            value={situacao}
            onChange={(e) => {
              setSituacao(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {situacoes.map((s) => (
              <option key={s} value={s}>
                {situacaoRotulo[s] ?? s}
              </option>
            ))}
          </select>
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
          {formatNumberBR(filtradasEOrdenadas.length)}{" "}
          {filtradasEOrdenadas.length === 1 ? "reunião" : "reuniões"} de{" "}
          {formatNumberBR(reunioes.length)}
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradasEOrdenadas.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradasEOrdenadas.length)})
        </button>
      </div>

      {filtradasEOrdenadas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhuma reunião com esses filtros. Vazio aqui é resposta da busca — não quer dizer que
          faltou dado.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[.9em]">
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-3 font-medium">Reunião</th>
                {cabecalho({ col: "data", rotulo: "Data" })}
                {cabecalho({ col: "camaraTecnica", rotulo: "Câmara técnica (tipo)" })}
                {cabecalho({ col: "situacao", rotulo: "Situação" })}
                {cabecalho({ col: "qtdItensPauta", rotulo: "Itens de pauta", alinhar: "right" })}
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {visiveis.map((r) => (
                <tr key={r.idFonte} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/copam/reuniao/${r.idFonte}`}
                      className="font-medium text-text underline-offset-2 hover:text-primary hover:underline"
                    >
                      {r.titulo}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 font-tabular text-text">{formatDateBR(r.data)}</td>
                  <td className="py-2 pr-3">{r.camaraTecnica ?? "não registrada"}</td>
                  <td className="py-2 pr-3">{situacaoRotulo[r.situacao] ?? r.situacao}</td>
                  <td className="py-2 text-right font-tabular tabular-nums">
                    {formatNumberBR(r.qtdItensPauta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrando < filtradasEOrdenadas.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtradasEOrdenadas.length - mostrando))}{" "}
          de {formatNumberBR(filtradasEOrdenadas.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
