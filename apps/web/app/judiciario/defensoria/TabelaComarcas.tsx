"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import {
  COMARCAS_MG,
  COBERTURA_DEFENSORIA,
  type ComarcaDefensoria,
} from "@/lib/judiciario/defensoria-mg";

/**
 * As 298 comarcas de Minas Gerais, uma a uma: busca, filtra por atendida em
 * 2025, ordena e exporta CSV do filtrado — as cinco coisas (`AGENTS.md`).
 *
 * ⚠️ **NUNCA `useSearchParams`.** O alvo é `output: "export"`; todo estado
 * fica em `useState`, no molde de `TabelaAchados.tsx` (`inspecoes/`).
 *
 * Ordena por POPULAÇÃO ao abrir, não por nome: é o total que dá peso à busca
 * — Belo Horizonte e uma comarca de 4 mil habitantes não pesam igual — e
 * ordenar por nome esconderia isso atrás do alfabeto.
 */

const POR_PAGINA = 25;
const TODOS = "";

type ChaveOrdenavel = keyof ComarcaDefensoria;

interface ColunaDef {
  chave: ChaveOrdenavel;
  rotulo: string;
  tipo: TipoCampo;
  numerica?: boolean;
}

const COLUNAS: ColunaDef[] = [
  { chave: "nome", rotulo: "Comarca", tipo: "texto" },
  { chave: "municipios", rotulo: "Municípios", tipo: "numero", numerica: true },
  { chave: "populacao", rotulo: "População", tipo: "numero", numerica: true },
  { chave: "populacaoAte3SM", rotulo: "Até 3 salários mínimos", tipo: "numero", numerica: true },
  { chave: "atendida2025", rotulo: "Atendida (2025)", tipo: "texto" },
  { chave: "temUnidadeHoje", rotulo: "Unidade hoje", tipo: "texto" },
];

const ROTULO_ATENDIDA: Record<string, string> = {
  SIM: "Atendida",
  "NÃO": "Não atendida",
  PARCIALMENTE: "Parcialmente",
};

const ESTILO_ATENDIDA: Record<string, string> = {
  SIM: "border-accent text-accent",
  "NÃO": "border-alert text-alert",
  PARCIALMENTE: "border-ord-4 text-ord-4",
};

function SeloAtendida({ valor }: { valor: string | null }) {
  const chave = valor ?? "";
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-[.82em] font-medium ${
        ESTILO_ATENDIDA[chave] ?? "border-border text-text-soft"
      }`}
    >
      {ROTULO_ATENDIDA[chave] ?? "—"}
    </span>
  );
}

function fmtN(v: number | null): string {
  return v === null ? "—" : formatNumberBR(v);
}

/** "Comarca com/sem Defensoria Pública" (IPEA 2013) resumido pra uma linha. */
function resumo2013(c: ComarcaDefensoria): string | null {
  if (c.atendida2013 === null) return null;
  const tinha = c.atendida2013.includes("com Defensoria");
  const defensores =
    tinha && c.defensores2013 ? ` (${c.defensores2013} defensor${c.defensores2013 > 1 ? "es" : ""})` : "";
  return tinha ? `tinha Defensoria em 2013${defensores}` : "não tinha em 2013";
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const BOM = "﻿";
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Aspas duplicadas e campo entre aspas — o nome tem vírgula em alguns casos. */
function csvCampo(v: string | number | boolean | null): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function paraCsv(linhas: ComarcaDefensoria[]): string {
  const cab = [
    "comarca", "municipios", "populacao", "populacao_ate_3_sm",
    "atendida_2025", "tem_unidade_dpmg_hoje", "atendida_2013", "defensores_2013", "link",
  ];
  const corpo = linhas.map((l) => [
    l.nome, l.municipios, l.populacao, l.populacaoAte3SM,
    ROTULO_ATENDIDA[l.atendida2025 ?? ""] ?? l.atendida2025,
    l.temUnidadeHoje ? "Sim" : "Não",
    l.atendida2013, l.defensores2013, l.link,
  ].map(csvCampo).join(","));
  return [cab.join(","), ...corpo].join("\n");
}

function opcoes<T extends string | null>(vals: T[]): string[] {
  return [...new Set(vals.filter((v): v is NonNullable<T> => !!v))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export default function TabelaComarcas() {
  const [busca, setBusca] = useState("");
  const [atendida, setAtendida] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: ChaveOrdenavel; direcao: Direcao } | null>({
    chave: "populacao",
    direcao: "desc",
  });
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const listaAtendida = useMemo(() => opcoes(COMARCAS_MG.map((c) => c.atendida2025)), []);

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const base = COMARCAS_MG.filter((c) => {
      if (atendida && c.atendida2025 !== atendida) return false;
      if (!termo) return true;
      return semAcento(c.nome.toLowerCase()).includes(termo);
    });
    if (!ordem) return base;
    const def = COLUNAS.find((c) => c.chave === ordem.chave);
    return ordenarPor(base, ordem.chave, ordem.direcao, def?.tipo ?? "texto");
  }, [busca, atendida, ordem]);

  const visiveis = filtradas.slice(0, mostrando);

  function alternarOrdem(chave: ChaveOrdenavel) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: chave === "populacao" || chave === "populacaoAte3SM" ? "desc" : "asc" },
    );
    setMostrando(POR_PAGINA);
  }

  function limpar() {
    setBusca("");
    setAtendida(TODOS);
    setMostrando(POR_PAGINA);
  }

  const algumFiltro = !!(busca || atendida);

  return (
    <section aria-labelledby="tabela-comarcas" className="mt-14">
      <h2 id="tabela-comarcas" className="font-display text-xl font-bold text-text">
        As {formatNumberBR(COMARCAS_MG.length)} comarcas, uma a uma
      </h2>
      <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
        Procure o nome da sua comarca. Quando a Defensoria mantém unidade lá hoje, o nome vira
        link para a página oficial da unidade.
      </p>

      {/* ═══ FILTROS ═══ */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[.82em] text-text-soft">
          Buscar comarca
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            placeholder="Belo Horizonte, Araçuaí, Passos…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          />
        </label>

        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Atendida (2025)
          <select
            value={atendida}
            onChange={(e) => {
              setAtendida(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>Todas</option>
            {listaAtendida.map((v) => (
              <option key={v} value={v}>
                {ROTULO_ATENDIDA[v] ?? v}
              </option>
            ))}
          </select>
        </label>

        {algumFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-border px-3 py-2 text-[.88em] text-text-soft hover:text-text"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-[.9em] text-text-soft" aria-live="polite">
          <strong className="text-text">{formatNumberBR(filtradas.length)}</strong> de{" "}
          {formatNumberBR(COMARCAS_MG.length)} comarcas
        </p>
        <button
          type="button"
          onClick={() =>
            baixarCsv(paraCsv(filtradas), `defensoria-mg-comarcas-${filtradas.length}.csv`)
          }
          className="rounded-lg border border-primary px-3 py-2 text-[.88em] font-semibold text-primary hover:bg-primary hover:text-surface"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {/* ═══ TABELA ═══ */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[52em] border-collapse text-left text-[.9em]">
          <thead className="bg-surface-2">
            <tr>
              {COLUNAS.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={String(c.chave)}
                    scope="col"
                    aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
                    className={`px-3 py-2 font-semibold text-text ${c.numerica ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdem(c.chave)}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      {c.rotulo}
                      <span aria-hidden="true" className="text-text-soft">
                        {ativa ? (ordem.direcao === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => {
              const resumo = resumo2013(c);
              return (
                <tr key={c.nome} className="border-t border-border align-top">
                  <td className="px-3 py-3">
                    {c.link ? (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                      >
                        {c.nome} ↗
                      </a>
                    ) : (
                      <span className="font-medium text-text">{c.nome}</span>
                    )}
                    {resumo && <p className="mt-1 text-[.85em] text-text-soft">{resumo}</p>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                    {fmtN(c.municipios)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                    {fmtN(c.populacao)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                    {fmtN(c.populacaoAte3SM)}
                  </td>
                  <td className="px-3 py-3">
                    <SeloAtendida valor={c.atendida2025} />
                  </td>
                  <td className="px-3 py-3 text-text-soft">{c.temUnidadeHoje ? "Sim" : "Não"}</td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-3 py-8 text-center text-text-soft">
                  Nenhuma comarca com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrando < filtradas.length && (
        <button
          type="button"
          onClick={() => setMostrando((m) => m + POR_PAGINA)}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-[.9em] text-text hover:border-primary hover:text-primary"
        >
          Mostrar mais ({formatNumberBR(filtradas.length - mostrando)} restantes)
        </button>
      )}

      <p className="mt-4 text-[.85em] leading-relaxed text-text-soft">
        Cobertura da <strong className="text-text">Defensoria Pública de Minas Gerais</strong>,
        Pesquisa Nacional da Defensoria 2025 e IPEA 2013. Extraído em{" "}
        {COBERTURA_DEFENSORIA.extraidoEm}.
      </p>
    </section>
  );
}
