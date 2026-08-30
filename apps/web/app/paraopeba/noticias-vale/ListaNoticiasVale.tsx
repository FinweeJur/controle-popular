"use client";

import { useMemo, useState } from "react";
import { formatDateBR } from "@/lib/betim/format";

/**
 * Lista filtrável e ordenável das notícias sobre a Vale, mais a exportação
 * em CSV do que estiver filtrado.
 *
 * ═══ POR QUE É DE CLIENTE, E O QUE ISSO CUSTA ═══
 *
 * O filtro por fonte e a ordenação por data precisam de estado; a lista tem
 * no máximo 60 itens (~58 KiB de JSON), muito abaixo do limiar de "coleção
 * vai como props" de `AGENTS.md` (acima de ~2 mil linhas a coleção vira
 * asset fatiado, como em `TabelaEstatica.tsx`). O custo é o mesmo array
 * serializado no flight do RSC — irrelevante nesta escala.
 *
 * ═══ CSV: O QUE SAI E O QUE NÃO SAI ═══
 *
 * Só o que está FILTRADO na tela, separador `;` e BOM UTF-8 (senão o Excel
 * brasileiro abre tudo numa coluna e com acento quebrado — regra do dono,
 * 21/08/2026). Título, veículo, data e link: metadado, não o texto da
 * matéria. Quem quiser a reportagem abre o link.
 */

export interface NoticiaVale {
  titulo: string;
  link: string;
  data: string | null;
  fonte: string;
  descricao: string;
}

const TODAS = "todas";
type Ordem = "desc" | "asc";

function baixarCsv(conteudo: string, nomeArquivo: string) {
  // BOM UTF-8 na frente do conteúdo: sem ele o Excel brasileiro abre o CSV
  // com acento quebrado (mesmo padrão de `PainelTac.tsx`).
  const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Escapa um campo CSV: aspas dobradas, campo citado quando há `;` ou `"`. */
function campoCsv(valor: string): string {
  const comAspas = valor.replace(/"/g, '""');
  return /[;"]/.test(comAspas) ? `"${comAspas}"` : comAspas;
}

export default function ListaNoticiasVale({ noticias }: { noticias: NoticiaVale[] }) {
  const [fonte, setFonte] = useState<string>(TODAS);
  const [ordem, setOrdem] = useState<Ordem>("desc");

  // As opções nascem do dado, nunca de uma lista fixa que envelhece: se um
  // veículo deixar de aparecer, ele some do filtro na próxima coleta.
  const fontes = useMemo(
    () => [...new Set(noticias.map((n) => n.fonte))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [noticias],
  );

  const filtradas = useMemo(() => {
    const base = fonte === TODAS ? noticias : noticias.filter((n) => n.fonte === fonte);
    return [...base].sort((a, b) => {
      // Sem data vai para o fim em qualquer ordem (a mesma regra do coletor):
      // item sem data é o menos confiável do conjunto.
      const da = a.data ?? "";
      const db = b.data ?? "";
      return ordem === "desc" ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [noticias, fonte, ordem]);

  // Distribuição por mês, só com CSS — sem biblioteca de gráfico (teto de
  // 3 MiB gzip do Worker). A contagem em texto acompanha a barra: cor nunca
  // é o único canal de informação.
  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of noticias) {
      const chave = (n.data ?? "").slice(0, 7);
      if (chave) m.set(chave, (m.get(chave) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [noticias]);
  const maxMes = Math.max(1, ...porMes.map(([, c]) => c));

  return (
    <>
      {/* Gráfico de evolução no tempo — a regra das "cinco coisas" do dono,
          versão mínima: barra CSS com a contagem em texto ao lado. */}
      <section className="mt-6">
        <h2 className="font-display text-xl font-semibold">Itens por mês</h2>
        <div className="mt-3 flex h-28 items-end gap-1.5" role="img" aria-label="Distribuição das notícias por mês">
          {porMes.map(([chave, count]) => (
            <div key={chave} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-tabular text-[.68em] text-text-soft">{count}</span>
              <span
                className="w-full rounded-t bg-accent/70"
                style={{ height: `${Math.round((count / maxMes) * 100)}%` }}
                title={`${count} ${count === 1 ? "notícia" : "notícias"} em ${chave.slice(3, 5)}/${chave.slice(0, 4)}`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 max-w-2xl text-[.85em] text-text-soft">
          {porMes
            .map(([chave, count]) => `${count} em ${chave.slice(3, 5)}/${chave.slice(0, 4)}`)
            .join(" · ")}
        </p>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">
            {filtradas.length} {filtradas.length === 1 ? "notícia" : "notícias"}
          </h2>
          <div className="flex flex-wrap gap-3 text-[.9em]">
            <label className="flex flex-col gap-1">
              <span className="text-[.78em] text-text-soft">Fonte</span>
              <select
                value={fonte}
                onChange={(e) => setFonte(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-text"
              >
                <option value={TODAS}>Todas ({noticias.length})</option>
                {fontes.map((f) => (
                  <option key={f} value={f}>
                    {f} ({noticias.filter((n) => n.fonte === f).length})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[.78em] text-text-soft">Ordem</span>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-text"
              >
                <option value="desc">Mais recentes primeiro</option>
                <option value="asc">Mais antigas primeiro</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                baixarCsv(
                  ["titulo;fonte;data;link", ...filtradas.map((n) =>
                    [campoCsv(n.titulo), campoCsv(n.fonte), n.data ?? "", campoCsv(n.link)].join(";"),
                  )].join("\r\n"),
                  "noticias-vale.csv",
                )
              }
              className="self-end rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text transition-colors hover:border-current"
            >
              Baixar CSV do filtro
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {filtradas.map((n) => (
            <li key={n.link}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-current"
              >
                <span className="text-text">{n.titulo}</span>
                <span className="mt-1 block text-[.78em] text-text-soft">
                  {n.fonte}
                  {n.data ? ` · ${formatDateBR(n.data.slice(0, 10))}` : ""}
                </span>
                {n.descricao ? (
                  <span className="mt-1.5 block text-[.88em] text-text-soft">{n.descricao}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
        {filtradas.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-[.92em] text-text-soft">
            Nenhuma notícia desta fonte nesta coleta.
          </p>
        ) : null}

        <p className="mt-4 max-w-2xl text-[.9em] text-text-soft">
          Guardamos título, resumo da própria fonte, veículo, data e link — nunca o texto da
          matéria. Ler a reportagem é no site de quem a publicou.
        </p>
      </section>
    </>
  );
}
