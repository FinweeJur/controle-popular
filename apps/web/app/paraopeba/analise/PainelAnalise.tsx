"use client";

import { useMemo, useState } from "react";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { TEMA_AJRI_LABEL } from "@/lib/paraopeba/auditoria-ajri";
import type { AtiBiblioteca, ItemBiblioteca } from "@/lib/paraopeba/biblioteca";
import { temasAjriSaoInferidos } from "@/lib/paraopeba/temas-ati-utils";
import type { EixoIntegrado } from "@/lib/paraopeba/sintese-integrada";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

/**
 * `/paraopeba/analise` — a tabela dos 16 eixos, filtrável, ordenável e
 * exportável, com o detalhe das quatro vozes (auditoria, perícia, ATIs, voz
 * da ATI sobre um estudo) dentro de cada eixo.
 *
 * ═══ POR QUE ISTO É CLIENTE, E O QUE FICA DE FORA ═══
 *
 * `eixos` são as 16 linhas já cruzadas por `sintese-integrada.ts` (a página
 * de servidor faz o cruzamento; este componente só filtra/ordena/exibe o que
 * já veio pronto). Nenhum acervo inteiro passa por aqui: cada eixo já traz
 * só os documentos que caem NELE, não os 597 da biblioteca nem os 445 da
 * perícia.
 */

const NEGRITO = /(\*\*[^*]+\*\*)/g;

/** A síntese-fonte usa `**negrito**` em markdown simples (nunca convertido a
 *  HTML pelo gerador) para marcar achados vindos do painel de indicadores —
 *  mesmo parser de `/paraopeba/auditoria/page.tsx`, duplicado aqui de
 *  propósito: é local a cada tela, não vale a pena um módulo compartilhado
 *  para 6 linhas. */
function negritoInline(texto: string) {
  const partes = texto.split(NEGRITO);
  return partes.map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={i} className="font-medium text-text">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const COLUNAS_CSV_PAINEL_ANALISE: ColunaCsv<EixoIntegrado>[] = [
  { chave: "titulo", rotulo: "Eixo" },
  {
    chave: "cobertura",
    rotulo: "Tem Tema AJRI",
    formatar: (c) => (c.temTemaAjri ? "sim" : "nao"),
  },
  {
    chave: "cobertura",
    rotulo: "Fontes Que Falam",
    formatar: (c) => c.fontesQueFalam,
  },
  {
    chave: "pericia",
    rotulo: "Documentos Perícia",
    formatar: (p) => p.documentos.length,
  },
  {
    chave: "atis",
    rotulo: "Documentos ATI",
    formatar: (a) => a.documentos.length,
  },
  {
    chave: "vozAti",
    rotulo: "Vozes ATI",
    formatar: (v) => v.length,
  },
  {
    chave: "cobertura",
    rotulo: "Quais Faltam",
    formatar: (c) => c.quaisFaltam.join(" | "),
  },
];

/** "3_Apresentação_Ambiental_Claudia.pdf" -> "Apresentação Ambiental Claudia". */
function tituloLegivelPericia(nomeArquivo: string): string {
  let nome = nomeArquivo;
  try {
    nome = decodeURIComponent(nomeArquivo);
  } catch {
    // mantém como veio — mesma tolerância de temas-acervo.ts
  }
  return nome
    .replace(/\.pdf$/i, "")
    .replace(/^\d+[._]\s*/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type FiltroCobertura = "todas" | "lacuna" | "tres-fontes" | "so-auditoria";
type Ordenacao = "fontes-desc" | "fontes-asc" | "titulo" | "ati-desc" | "pericia-desc";

function valoresUnicosOrdenados(itens: ItemBiblioteca[], extrair: (i: ItemBiblioteca) => string[]): string[] {
  const set = new Set<string>();
  for (const i of itens) for (const v of extrair(i)) set.add(v);
  return [...set].sort((a, b) => a.localeCompare(b, "pt"));
}

const ORD_COR: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-3)",
  3: "var(--color-ord-4)",
};

export default function PainelAnalise({
  eixos,
  atiLabel,
}: {
  eixos: EixoIntegrado[];
  /** Rótulo por sigla de ATI — vem do componente de servidor (ver cabeçalho). */
  atiLabel: Record<AtiBiblioteca, string>;
}) {
  const [busca, setBusca] = useState("");
  const [cobertura, setCobertura] = useState<FiltroCobertura>("todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("fontes-asc");
  const [macroAti, setMacroAti] = useState<string>("todas");
  const [tagAti, setTagAti] = useState<string>("todas");

  const todosDocsAti = useMemo(() => eixos.flatMap((e) => e.atis.documentos), [eixos]);
  const macrosAti = useMemo(() => valoresUnicosOrdenados(todosDocsAti, (i) => [i.macro_categoria]), [todosDocsAti]);
  const tagsAti = useMemo(() => valoresUnicosOrdenados(todosDocsAti, (i) => i.tags), [todosDocsAti]);

  const filtrados = useMemo(() => {
    const termo = busca.trim() ? normalizar(busca.trim()) : "";
    let lista = eixos
      .map((e) => ({
        ...e,
        atis: {
          ...e.atis,
          documentos: e.atis.documentos.filter((d) => {
            if (macroAti !== "todas" && d.macro_categoria !== macroAti) return false;
            if (tagAti !== "todas" && !d.tags.includes(tagAti)) return false;
            return true;
          }),
        },
      }))
      .filter((e) => {
        if (cobertura === "lacuna" && e.cobertura.quaisFaltam.length === 0) return false;
        if (cobertura === "tres-fontes" && e.cobertura.fontesQueFalam !== 3) return false;
        if (cobertura === "so-auditoria" && e.cobertura.fontesQueFalam !== 1) return false;
        if (!termo) return true;
        return (
          normalizar(e.titulo).includes(termo) || normalizar(e.auditoria.estadoGeral).includes(termo)
        );
      });
    lista = [...lista].sort((a, b) => {
      switch (ordenacao) {
        case "fontes-desc":
          return b.cobertura.fontesQueFalam - a.cobertura.fontesQueFalam || a.titulo.localeCompare(b.titulo, "pt");
        case "fontes-asc":
          return a.cobertura.fontesQueFalam - b.cobertura.fontesQueFalam || a.titulo.localeCompare(b.titulo, "pt");
        case "ati-desc":
          return b.atis.documentos.length - a.atis.documentos.length || a.titulo.localeCompare(b.titulo, "pt");
        case "pericia-desc":
          return (
            b.pericia.documentos.length - a.pericia.documentos.length || a.titulo.localeCompare(b.titulo, "pt")
          );
        case "titulo":
        default:
          return a.titulo.localeCompare(b.titulo, "pt");
      }
    });
    return lista;
  }, [eixos, busca, cobertura, ordenacao, macroAti, tagAti]);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(COLUNAS_CSV_PAINEL_ANALISE, filtrados, `paraopeba-analise-integrada-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por título do eixo ou estado geral
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            placeholder="ex.: captação, rejeito, fundiária"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Cobertura</span>
          <select
            value={cobertura}
            onChange={(e) => setCobertura(e.target.value as FiltroCobertura)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="todas">Todos os eixos</option>
            <option value="lacuna">Só com alguma fonte faltando</option>
            <option value="tres-fontes">Só as três fontes falam</option>
            <option value="so-auditoria">Só a auditoria fala — é pauta</option>
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ordenar por</span>
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="fontes-asc">Nº de fontes, menos cobertas primeiro</option>
            <option value="fontes-desc">Nº de fontes, mais cobertas primeiro</option>
            <option value="ati-desc">Documentos de ATI, mais primeiro</option>
            <option value="pericia-desc">Documentos de perícia, mais primeiro</option>
            <option value="titulo">Título do eixo, A–Z</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Categoria do documento ATI</span>
          <select
            value={macroAti}
            onChange={(e) => setMacroAti(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="todas">Todas</option>
            {macrosAti.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Tag do documento ATI</span>
          <select
            value={tagAti}
            onChange={(e) => setTagAti(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="todas">Todas</option>
            {tagsAti.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {(macroAti !== "todas" || tagAti !== "todas") && (
          <button
            type="button"
            onClick={() => {
              setMacroAti("todas");
              setTagAti("todas");
            }}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[.85em] font-medium text-text hover:border-primary"
          >
            Limpar filtros ATI
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtrados.length)} {filtrados.length === 1 ? "eixo" : "eixos"} de{" "}
          {formatNumberBR(eixos.length)}
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
          Nenhum eixo com esses filtros. Vazio aqui é resposta — não quer dizer que a busca falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtrados.map((eixo) => (
            <li key={eixo.titulo} className="rounded-xl border border-border bg-surface">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="font-semibold text-text">{eixo.titulo}</span>
                  <span className="flex items-center gap-2 text-[.82em] text-text-soft">
                    <span
                      className="inline-flex h-2.5 w-14 overflow-hidden rounded-full border border-border/60"
                      aria-hidden
                    >
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className="h-full flex-1"
                          style={{
                            background:
                              n <= eixo.cobertura.fontesQueFalam ? ORD_COR[eixo.cobertura.fontesQueFalam] : "var(--color-chart-track)",
                          }}
                        />
                      ))}
                    </span>
                    {eixo.cobertura.fontesQueFalam}/3 fontes
                    {eixo.cobertura.quaisFaltam.length > 0 && (
                      <span className="rounded-md border border-border px-2 py-0.5">lacuna</span>
                    )}
                  </span>
                </summary>

                <div className="space-y-4 border-t border-border px-4 py-4 text-[.92em] leading-relaxed text-text-soft">
                  {eixo.cobertura.quaisFaltam.length > 0 && (
                    <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[.9em]">
                      <strong className="text-text">Falta:</strong> {eixo.cobertura.quaisFaltam.join("; ")}.
                    </p>
                  )}

                  {/* ═══ VOZ 1 — AUDITORIA (AECOM) ═══ */}
                  <div>
                    <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
                      Auditoria (AECOM)
                    </p>
                    <p className="mt-1.5">{negritoInline(eixo.auditoria.estadoGeral)}</p>
                    <p className="mt-1.5">
                      <strong className="font-medium text-text">Números-chave.</strong>{" "}
                      {negritoInline(eixo.auditoria.numerosChave)}
                    </p>
                  </div>

                  {/* ═══ VOZ 2 — PERÍCIA (UFMG) ═══ */}
                  <div>
                    <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
                      Perícia judicial (UFMG){" "}
                      <span className="normal-case text-text-soft/80">
                        — {eixo.pericia.documentos.length} documento
                        {eixo.pericia.documentos.length === 1 ? "" : "s"}
                      </span>
                    </p>
                    {eixo.pericia.documentos.length === 0 ? (
                      <p className="mt-1.5 text-text-soft/80">
                        {eixo.temasAjri.length === 0
                          ? "sem tema técnico equivalente — não avaliável por este cruzamento."
                          : "nenhum dos documentos com resultado da perícia usa este tema."}
                      </p>
                    ) : (
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        {eixo.pericia.documentos.map((d) => (
                          <li key={d.url}>
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2 hover:text-accent"
                            >
                              {tituloLegivelPericia(d.nomeArquivo)}
                            </a>{" "}
                            <span className="text-text-soft/80">
                              ({d.temas.map((t) => TEMA_AJRI_LABEL[t]).join(", ")})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* ═══ VOZ 3 — ATIS (biblioteca) ═══ */}
                  <div>
                    <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
                      ATIs — biblioteca{" "}
                      <span className="normal-case text-text-soft/80">
                        — {formatNumberBR(eixo.atis.documentos.length)} documento
                        {eixo.atis.documentos.length === 1 ? "" : "s"}
                      </span>
                    </p>
                    {eixo.atis.documentos.length === 0 ? (
                      <p className="mt-1.5 text-text-soft/80">
                        {eixo.temasAjri.length === 0
                          ? "sem tema técnico equivalente — não avaliável por este cruzamento."
                          : "nenhum item com tema declarado da biblioteca das ATIs usa este tema."}
                      </p>
                    ) : (
                      <ul className="mt-1.5 max-h-64 space-y-1 overflow-y-auto pl-0 text-[.95em]">
                        {eixo.atis.documentos
                          .slice()
                          .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
                          .map((item) => (
                            <li key={item.id} className="border-b border-border/40 py-1 last:border-0">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-2 hover:text-accent"
                              >
                                {item.titulo}
                              </a>{" "}
                              <span className="text-text-soft/80">
                                — {atiLabel[item.ati]}
                                {item.data ? `, ${formatDateBR(item.data)}` : ""}
                                {item.macro_categoria && (
                                  <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[.78em] text-text-soft/70">
                                    {item.macro_categoria}
                                  </span>
                                )}
                                {item.tags.length > 0 && (
                                  <span className="ml-2 text-[.78em] text-text-soft/70">
                                    {item.tags.join(" · ")}
                                  </span>
                                )}
                                {temasAjriSaoInferidos(item) && (
                                  <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[.78em] text-text-soft/70">
                                    tema inferido
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>

                  {/* ═══ VOZ 4 — O QUE A PRÓPRIA ATI ESCREVEU SOBRE UM ESTUDO ═══ */}
                  {eixo.vozAti.length > 0 && (
                    <div>
                      <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
                        Voz da ATI sobre um estudo
                      </p>
                      <ul className="mt-1.5 space-y-2.5">
                        {eixo.vozAti.map((c) => (
                          <li
                            key={c.noticia.id}
                            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5"
                          >
                            <p>
                              <a
                                href={c.noticia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                              >
                                {c.noticia.titulo}
                              </a>
                            </p>
                            <p className="mt-0.5 text-[.85em] text-text-soft/80">
                              {c.noticia.fonte}, {formatDateBR(c.noticia.data)} · casamento {c.forca === "forte" ? "forte" : "médio"} com{" "}
                              {c.documento ? (
                                <a
                                  href={c.documento.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-accent"
                                >
                                  {c.documento.titulo}
                                </a>
                              ) : (
                                "—"
                              )}
                            </p>
                            <p className="mt-1.5">{c.evidencia}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
