"use client";

import { useEffect, useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import {
  TEMA_ROTULOS,
  COBERTURA_INSPECOES,
  type AchadoInspecao,
} from "@/lib/judiciario/inspecoes-cnj";

/**
 * Os achados saíram do bundle e viram asset estático
 * (`public/data/achados-tjmg.json`) buscado uma vez por sessão — mesmo
 * padrão de `ConveniosClient.tsx`. Motivo: teto de 3 MiB gzip do Worker
 * Free (erro 10027, 2026-08-24). Antes de carregar, `null`.
 */
let achadosCache: Promise<AchadoInspecao[]> | null = null;

function buscarAchados(): Promise<AchadoInspecao[]> {
  if (!achadosCache) {
    achadosCache = fetch("/data/achados-tjmg.json")
      .then((r) => r.json() as Promise<{ ACHADOS_TJMG: AchadoInspecao[] }>)
      .then((d) => d.ACHADOS_TJMG);
  }
  return achadosCache;
}

function useAchadosTjmg(): AchadoInspecao[] | null {
  const [achados, setAchados] = useState<AchadoInspecao[] | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarAchados().then((d) => {
      if (vivo) setAchados(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return achados;
}

/**
 * As seções com achado do relatório de inspeção do TJMG, uma a uma: filtra,
 * ordena e exporta CSV do filtrado — as cinco coisas (`AGENTS.md`).
 *
 * ═══ POR QUE NÃO É `TabelaEstatica.tsx` ═══
 *
 * Mesma razão já registrada em `PainelDecisoes.tsx`: `TabelaEstatica` não
 * expõe a quem chama o conjunto DEPOIS do filtro, e uma das cinco coisas é
 * **CSV do filtrado**. Aqui as 123 linhas cabem num import direto (115 KiB
 * no total do módulo), então não há carregamento por fatias.
 *
 * ═══ O TRECHO É TRECHO, E A TELA DIZ ISSO ═══
 *
 * O relatório tem 2,9 milhões de caracteres; cada linha traz até 600. O
 * projeto **não espelha o PDF** — publica resumo próprio e manda para a
 * origem. Por isso toda linha carrega o link do documento oficial, e o
 * rodapé da tabela repete de quem é o dado.
 */

const POR_PAGINA = 25;
const TODOS = "";

interface ColunaDef {
  chave: keyof AchadoInspecao;
  rotulo: string;
  tipo: TipoCampo;
  numerica?: boolean;
}

const COLUNAS: ColunaDef[] = [
  { chave: "unidade", rotulo: "Unidade inspecionada", tipo: "texto" },
  { chave: "tipo", rotulo: "Tipo", tipo: "texto" },
  { chave: "comarca", rotulo: "Comarca", tipo: "texto" },
  { chave: "tipoSecao", rotulo: "Seção", tipo: "texto" },
  { chave: "itens", rotulo: "Itens", tipo: "numero", numerica: true },
  { chave: "caracteres", rotulo: "Extensão", tipo: "numero", numerica: true },
];

const ROTULO_TIPO: Record<string, string> = {
  vara: "Vara",
  juizado: "Juizado",
  gabinete: "Gabinete de desembargador",
  turma: "Turma recursal",
  serventia: "Serventia extrajudicial",
  "orgao-central": "Órgão central do tribunal",
  outra: "Outra",
};

/** ⚠️ Três tipos, não dois. Os capítulos 7 (Precatórios), 8 (unidades
 *  administrativas) e 9 (TI) usam "Achados" e "Determinações" em seções
 *  SEPARADAS, e não a forma composta dos capítulos judiciais. Um parser que
 *  só conhecia a forma composta perdia esses capítulos inteiros. */
const ROTULO_SECAO: Record<string, string> = {
  achados: "Achados",
  determinacoes: "Determinações",
  recomendacoes: "Recomendações",
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

/** Aspas duplicadas e campo entre aspas — o trecho tem vírgula e ponto-e-vírgula. */
function csvCampo(v: string | number | null): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function paraCsv(linhas: AchadoInspecao[]): string {
  const cab = [
    "ano", "secao", "unidade", "tipo", "comarca", "tipo_secao",
    "itens", "caracteres", "temas", "trecho", "fonte_url",
  ];
  const corpo = linhas.map((l) => [
    l.ano, l.secao, l.unidade, ROTULO_TIPO[l.tipo] ?? l.tipo, l.comarca ?? "",
    ROTULO_SECAO[l.tipoSecao] ?? l.tipoSecao, l.itens, l.caracteres,
    l.temas.map((t) => TEMA_ROTULOS[t] ?? t).join(" | "),
    l.trecho, COBERTURA_INSPECOES.tjmg.url,
  ].map(csvCampo).join(","));
  return [cab.join(","), ...corpo].join("\n");
}

function opcoes<T extends string | null>(vals: T[]): string[] {
  return [...new Set(vals.filter((v): v is NonNullable<T> => !!v))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export default function TabelaAchados() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState(TODOS);
  const [comarca, setComarca] = useState(TODOS);
  const [tema, setTema] = useState(TODOS);
  const [secao, setSecao] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: keyof AchadoInspecao; direcao: Direcao } | null>({
    chave: "caracteres",
    direcao: "desc",
  });
  const [mostrando, setMostrando] = useState(POR_PAGINA);
  const achados = useAchadosTjmg();

  const listaTipos = useMemo(() => opcoes((achados ?? []).map((l) => l.tipo)), [achados]);
  const listaComarcas = useMemo(() => opcoes((achados ?? []).map((l) => l.comarca)), [achados]);
  const listaTemas = useMemo(
    () => opcoes((achados ?? []).flatMap((l) => l.temas)),
    [achados],
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const base = (achados ?? []).filter((l) => {
      if (tipo && l.tipo !== tipo) return false;
      if (comarca && l.comarca !== comarca) return false;
      if (secao && l.tipoSecao !== secao) return false;
      if (tema && !l.temas.includes(tema)) return false;
      if (!termo) return true;
      return semAcento(`${l.unidade} ${l.trecho}`.toLowerCase()).includes(termo);
    });
    if (!ordem) return base;
    const def = COLUNAS.find((c) => c.chave === ordem.chave);
    return ordenarPor(base, ordem.chave, ordem.direcao, def?.tipo ?? "texto");
  }, [busca, tipo, comarca, secao, tema, ordem, achados]);

  const visiveis = filtradas.slice(0, mostrando);

  function alternarOrdem(chave: keyof AchadoInspecao) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: "asc" },
    );
    setMostrando(POR_PAGINA);
  }

  function limpar() {
    setBusca("");
    setTipo(TODOS);
    setComarca(TODOS);
    setTema(TODOS);
    setSecao(TODOS);
    setMostrando(POR_PAGINA);
  }

  const algumFiltro = !!(busca || tipo || comarca || tema || secao);

  return (
    <section aria-labelledby="tabela-achados" className="mt-10">
      <h2 id="tabela-achados" className="font-display text-xl font-bold text-text">
        As {formatNumberBR((achados ?? []).length)} seções com achado, uma a uma
      </h2>
      <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
        Cada linha é uma seção do relatório em que a equipe de inspeção registrou algo. O texto
        aqui é <strong className="text-text">trecho</strong> — o relatório inteiro tem 2,9 milhões
        de caracteres, e este portal não hospeda cópia dele. O link do documento oficial está no
        fim de cada linha e no rodapé.
      </p>
      <p className="mt-2 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
        A comarca aparece como <strong className="text-text">&mdash;</strong> quando o próprio
        relatório não a declara no nome da unidade. É o caso de boa parte das varas: o capítulo que
        as agrupa se chama apenas &ldquo;Varas&rdquo;. Muitas provavelmente são de Belo Horizonte, e
        é justamente por isso que a coluna fica vazia &mdash; preencher por dedução trocaria o
        documento pelo nosso palpite.
      </p>

      {/* ═══ FILTROS ═══ */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[.82em] text-text-soft">
          Buscar na unidade ou no trecho
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            placeholder="execução penal, custódia, Nova Lima…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          />
        </label>

        {[
          { rotulo: "Tipo de unidade", valor: tipo, set: setTipo, lista: listaTipos, rot: ROTULO_TIPO },
          { rotulo: "Comarca", valor: comarca, set: setComarca, lista: listaComarcas, rot: null },
          { rotulo: "Tema", valor: tema, set: setTema, lista: listaTemas, rot: TEMA_ROTULOS },
          { rotulo: "Seção", valor: secao, set: setSecao, lista: ["achados", "determinacoes", "recomendacoes"], rot: ROTULO_SECAO },
        ].map((f) => (
          <label key={f.rotulo} className="flex flex-col gap-1 text-[.82em] text-text-soft">
            {f.rotulo}
            <select
              value={f.valor}
              onChange={(e) => {
                f.set(e.target.value);
                setMostrando(POR_PAGINA);
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
            >
              <option value={TODOS}>Todos</option>
              {f.lista.map((v) => (
                <option key={v} value={v}>
                  {f.rot?.[v] ?? v}
                </option>
              ))}
            </select>
          </label>
        ))}

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
          {formatNumberBR((achados ?? []).length)} seções
        </p>
        <button
          type="button"
          onClick={() =>
            baixarCsv(paraCsv(filtradas), `inspecao-cnj-tjmg-2026-${filtradas.length}-secoes.csv`)
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
            {visiveis.map((l) => (
              <tr key={`${l.secao}-${l.tipoSecao}`} className="border-t border-border align-top">
                <td className="px-3 py-3">
                  <span className="font-medium text-text">{l.unidade}</span>
                  <span className="ml-2 text-[.85em] text-text-soft">§ {l.secao}</span>
                  <p className="mt-1 max-w-[46em] text-[.92em] leading-relaxed text-text-soft">
                    {l.trecho}
                  </p>
                  {l.temas.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {l.temas.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border px-2 py-0.5 text-[.78em] text-text-soft"
                        >
                          {TEMA_ROTULOS[t] ?? t}
                        </span>
                      ))}
                    </p>
                  )}
                  <a
                    href={COBERTURA_INSPECOES.tjmg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[.85em] text-primary underline underline-offset-2 hover:text-accent"
                  >
                    Ler no relatório oficial do CNJ (PDF) ↗
                  </a>
                </td>
                <td className="px-3 py-3 text-text-soft">{ROTULO_TIPO[l.tipo] ?? l.tipo}</td>
                <td className="px-3 py-3 text-text-soft">{l.comarca ?? "—"}</td>
                <td className="px-3 py-3 text-text-soft">{ROTULO_SECAO[l.tipoSecao] ?? l.tipoSecao}</td>
                <td className="px-3 py-3 text-right tabular-nums text-text-soft">{l.itens}</td>
                <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                  {formatNumberBR(l.caracteres)}
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-3 py-8 text-center text-text-soft">
                  Nenhuma seção com esses filtros.
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
        O documento é do <strong className="text-text">Conselho Nacional de Justiça</strong>, não
        deste portal. Aqui há resumo e trecho; o inteiro teor está no{" "}
        <a
          href={COBERTURA_INSPECOES.tjmg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          PDF oficial ↗
        </a>
        .
      </p>
    </section>
  );
}
