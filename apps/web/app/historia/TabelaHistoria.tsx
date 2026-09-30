"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import BotaoVoarAte from "@/app/components/BotaoVoarAte";

/**
 * Tabela das camadas históricas — uma só, usada por capitanias, revoltas,
 * fazendas e terras públicas (Fase F do PLANO-HISTORIA-CAMADAS-GLOBO-3D.md).
 *
 * As seis qualidades que cabem numa tabela ([AGENTS.md § 8](/AGENTS.md)):
 * busca tolerante a acento, ordenação por coluna, CSV do que está filtrado
 * (separador `;`, BOM UTF-8), contagem visível e layout de impressão.
 *
 * ⚠️ O que NÃO vai ao cliente: a geometria. A página lê o GeoJSON no servidor
 * e passa só as linhas — coordenada de polígono não precisa ir ao navegador
 * para desenhar tabela (AGENTS § 5.1).
 *
 * A coluna `tipo: "voo"` renderiza o botão "Voe até aqui" (Fase 0): a linha
 * precisa trazer `lat`, `lon` e, opcionalmente, `nomeVoo` e `ctx`.
 */
export interface ColunaHistoria {
  chave: string;
  rotulo: string;
  tipo?: "texto" | "numero" | "voo" | "link";
}

export type LinhaHistoria = Record<string, string | number | null>;

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const fmt = (v: string | number | null) =>
  typeof v === "number" ? v.toLocaleString("pt-BR") : String(v ?? "—");

export default function TabelaHistoria({
  titulo,
  nota,
  colunas,
  linhas,
  nomeCsv,
}: {
  titulo: string;
  nota?: string;
  colunas: ColunaHistoria[];
  linhas: LinhaHistoria[];
  nomeCsv: string;
}) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: string; dir: "asc" | "desc" } | null>(null);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    const base = termo
      ? linhas.filter((l) =>
          colunas.some((c) => c.tipo !== "voo" && normalizar(l[c.chave]).includes(termo)),
        )
      : linhas;
    if (!ordem) return base;
    return [...base].sort((a, b) => {
      const va = a[ordem.chave];
      const vb = b[ordem.chave];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : normalizar(va).localeCompare(normalizar(vb), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [linhas, colunas, busca, ordem]);

  const colunasCsv: ColunaCsv<LinhaHistoria>[] = colunas
    .filter((c) => c.tipo !== "voo")
    .map((c) => ({ chave: c.chave, rotulo: c.rotulo }));

  const seta = (chave: string) =>
    ordem?.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "";

  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {linhas.length}
            {nota ? ` · ${nota}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="nome, município, período…"
              className="w-48 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunasCsv, filtradas, nomeCsv)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {colunas.map((c) => (
                <th key={c.chave} scope="col" className="py-2 pr-4 font-semibold">
                  {c.tipo === "voo" ? (
                    c.rotulo
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOrdem((o) =>
                          o?.chave === c.chave
                            ? { chave: c.chave, dir: o.dir === "asc" ? "desc" : "asc" }
                            : { chave: c.chave, dir: "asc" },
                        )
                      }
                      className="underline-offset-2 hover:underline"
                      aria-label={`Ordenar por ${c.rotulo}`}
                    >
                      {c.rotulo}
                      {seta(c.chave)}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l, i) => (
              <tr key={`${nomeCsv}-${i}`} className="border-b border-border/50 align-top">
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={`py-2 pr-4 ${c.tipo === "numero" ? "text-right tabular-nums" : ""}`}
                  >
                    {c.tipo === "voo" &&
                    typeof l.lat === "number" &&
                    typeof l.lon === "number" ? (
                      <BotaoVoarAte
                        lat={l.lat}
                        lon={l.lon}
                        nome={String(l.nomeVoo ?? "")}
                        ctx={typeof l.ctx === "string" ? l.ctx : undefined}
                      />
                    ) : c.tipo === "link" &&
                      typeof l[c.chave] === "string" &&
                      String(l[c.chave]).startsWith("http") ? (
                      <a
                        href={String(l[c.chave])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap underline"
                      >
                        abrir ↗
                      </a>
                    ) : (
                      fmt(l[c.chave])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
