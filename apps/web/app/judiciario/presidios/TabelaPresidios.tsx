"use client";

import { useEffect, useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import {
  COBERTURA_CNIEP,
  type EstabelecimentoPenal,
} from "@/lib/judiciario/presidios-cniep";

/**
 * Os estabelecimentos saíram do bundle e viram asset estático
 * (`public/data/estabelecimentos-mg.json`) buscado uma vez por sessão —
 * mesmo padrão de `ConveniosClient.tsx`. Motivo: teto de 3 MiB gzip do
 * Worker Free (erro 10027, 2026-08-24). Antes de carregar, `null`.
 */
let presidiosCache: Promise<EstabelecimentoPenal[]> | null = null;

function buscarPresidios(): Promise<EstabelecimentoPenal[]> {
  if (!presidiosCache) {
    presidiosCache = fetch("/data/estabelecimentos-mg.json").then(
      (r) => r.json() as Promise<EstabelecimentoPenal[]>
    );
  }
  return presidiosCache;
}

function useEstabelecimentosMg(): EstabelecimentoPenal[] | null {
  const [lista, setLista] = useState<EstabelecimentoPenal[] | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarPresidios().then((d) => {
      if (vivo) setLista(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return lista;
}

/**
 * Os 285 estabelecimentos penais de Minas Gerais, um a um: filtra, ordena e
 * exporta CSV do filtrado — as cinco coisas (`AGENTS.md`).
 *
 * ⚠️ **NUNCA `useSearchParams`**: o alvo é `output: 'export'`. Estado fica
 * em `useState`, no molde de `TabelaAchados.tsx` (`/judiciario/inspecoes`).
 */

const POR_PAGINA = 30;
const TODOS = "";

interface ColunaDef {
  chave: keyof EstabelecimentoPenal;
  rotulo: string;
  tipo: TipoCampo;
  numerica?: boolean;
}

const COLUNAS: ColunaDef[] = [
  { chave: "nome", rotulo: "Estabelecimento", tipo: "texto" },
  { chave: "ramo", rotulo: "Ramo", tipo: "texto" },
  { chave: "natureza", rotulo: "Natureza", tipo: "texto" },
  { chave: "inspecoes", rotulo: "Inspeções", tipo: "numero", numerica: true },
];

const ROTULO_RAMO: Record<string, string> = {
  comum: "Justiça comum (TJMG)",
  "militar-estadual": "Justiça Militar de MG",
  "militar-federal": "Superior Tribunal Militar",
};

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
function csvCampo(v: string | number | null): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function paraCsv(linhas: EstabelecimentoPenal[]): string {
  const cab = [
    "id", "nome", "tribunal", "ramo", "natureza", "inspecoes", "situacao", "fonte_url",
  ];
  const corpo = linhas.map((l) => [
    l.id, l.nome, l.tribunal, ROTULO_RAMO[l.ramo] ?? l.ramo, l.natureza, l.inspecoes,
    l.inspecoes === 0 ? "sem inspeção no período" : "com inspeção no período",
    COBERTURA_CNIEP.url,
  ].map(csvCampo).join(","));
  return [cab.join(","), ...corpo].join("\n");
}

function opcoesTexto(vals: string[]): string[] {
  return [...new Set(vals)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function opcoesNumericas(vals: number[]): number[] {
  return [...new Set(vals)].sort((a, b) => a - b);
}

export default function TabelaPresidios() {
  const [busca, setBusca] = useState("");
  const [ramo, setRamo] = useState(TODOS);
  const [natureza, setNatureza] = useState(TODOS);
  const [inspecoes, setInspecoes] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: keyof EstabelecimentoPenal; direcao: Direcao } | null>(
    { chave: "nome", direcao: "asc" },
  );
  const [mostrando, setMostrando] = useState(POR_PAGINA);
  const presidios = useEstabelecimentosMg();

  const listaRamos = useMemo(() => opcoesTexto((presidios ?? []).map((e) => e.ramo)), [presidios]);
  const listaNaturezas = useMemo(
    () => opcoesTexto((presidios ?? []).map((e) => e.natureza)),
    [],
  );
  const listaInspecoes = useMemo(
    () => opcoesNumericas((presidios ?? []).map((e) => e.inspecoes)),
    [],
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const base = (presidios ?? []).filter((e) => {
      if (ramo && e.ramo !== ramo) return false;
      if (natureza && e.natureza !== natureza) return false;
      if (inspecoes && String(e.inspecoes) !== inspecoes) return false;
      if (!termo) return true;
      return semAcento(e.nome.toLowerCase()).includes(termo);
    });
    if (!ordem) return base;
    const def = COLUNAS.find((c) => c.chave === ordem.chave);
    return ordenarPor(base, ordem.chave, ordem.direcao, def?.tipo ?? "texto");
  }, [busca, ramo, natureza, inspecoes, ordem]);

  const visiveis = filtradas.slice(0, mostrando);

  function alternarOrdem(chave: keyof EstabelecimentoPenal) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: "asc" },
    );
    setMostrando(POR_PAGINA);
  }

  function limpar() {
    setBusca("");
    setRamo(TODOS);
    setNatureza(TODOS);
    setInspecoes(TODOS);
    setMostrando(POR_PAGINA);
  }

  const algumFiltro = !!(busca || ramo || natureza || inspecoes);

  return (
    <section aria-labelledby="tabela-presidios" className="mt-14">
      <h2 id="tabela-presidios" className="font-display text-xl font-bold text-text">
        Os {formatNumberBR((presidios ?? []).length)} estabelecimentos, um a um
      </h2>
      <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
        Cada linha é um estabelecimento penal cadastrado no Geopresídios do CNJ, com o número de
        inspeções judiciais que recebeu no período. <strong className="text-text">Zero</strong> quer
        dizer que nenhuma inspeção foi registrada — não que a unidade não exista ou esteja vazia.
      </p>

      {/* ═══ FILTROS ═══ */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[.82em] text-text-soft">
          Buscar pelo nome do estabelecimento
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            placeholder="presídio, APAC, penitenciária…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          />
        </label>

        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Ramo responsável
          <select
            value={ramo}
            onChange={(e) => {
              setRamo(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>Todos</option>
            {listaRamos.map((v) => (
              <option key={v} value={v}>
                {ROTULO_RAMO[v] ?? v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Natureza
          <select
            value={natureza}
            onChange={(e) => {
              setNatureza(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>Todas</option>
            {listaNaturezas.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Número de inspeções
          <select
            value={inspecoes}
            onChange={(e) => {
              setInspecoes(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>Todos</option>
            {listaInspecoes.map((v) => (
              <option key={v} value={String(v)}>
                {v}
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
          {formatNumberBR((presidios ?? []).length)} estabelecimentos
        </p>
        <button
          type="button"
          onClick={() =>
            baixarCsv(paraCsv(filtradas), `presidios-mg-cniep-${filtradas.length}-estabelecimentos.csv`)
          }
          className="rounded-lg border border-primary px-3 py-2 text-[.88em] font-semibold text-primary hover:bg-primary hover:text-surface"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {/* ═══ TABELA ═══ */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[44em] border-collapse text-left text-[.9em]">
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
            {visiveis.map((e) => (
              <tr key={e.id} className="border-t border-border align-top">
                <td className="px-3 py-3">
                  <span className="font-medium text-text">{e.nome}</span>
                  {e.inspecoes === 0 && (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[.78em] text-text-soft">
                      sem inspeção no período
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-text-soft">{ROTULO_RAMO[e.ramo] ?? e.ramo}</td>
                <td className="px-3 py-3 text-text-soft">{e.natureza}</td>
                <td className="px-3 py-3 text-right tabular-nums text-text-soft">{e.inspecoes}</td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-3 py-8 text-center text-text-soft">
                  Nenhum estabelecimento com esses filtros.
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
        O dado é do <strong className="text-text">Conselho Nacional de Justiça</strong>{" "}
        (CNIEP/Geopresídios), não deste portal.{" "}
        <a
          href={COBERTURA_CNIEP.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          Abrir o Geopresídios ↗
        </a>
        .
      </p>
    </section>
  );
}
