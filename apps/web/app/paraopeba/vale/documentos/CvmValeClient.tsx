"use client";

import { useMemo, useState } from "react";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { type DocumentoCvmVale } from "@/lib/paraopeba/cvm-vale-dados";
import {
  ordenarPor,
  type Direcao,
  type TipoCampo,
} from "@/lib/tabela/ordenar";

/**
 * Tabela de documentos da Vale na CVM — filtro por ano e tipo, ordenação por
 * coluna e CSV do filtrado, tudo no cliente.
 *
 * ═══ POR QUE PROPS, E NÃO ASSET ═══
 *
 * São no máximo ~66 linhas (11 anos × 3 tipos; o ITR tem um trimestre por
 * linha). O teto de "coleção nunca vai como props" do AGENTS.md vale acima de
 * ~2 mil linhas — aqui o payload serializado é minúsculo e o componente
 * continua sem tocar em `useSearchParams()` (padrão de `TabelaEstatica`):
 * estado local, sem link compartilhável, porque filtrar ano/tipo é consulta,
 * não endereço.
 *
 * ═══ O QUE O CSV BAIXA ═══
 *
 * O que está FILTRADO na tela, nunca o acervo inteiro — mesma regra das
 * outras páginas com planilha. Separador `;` e BOM UTF-8: sem o BOM, o Excel
 * brasileiro abre tudo numa coluna e quebra o acento.
 */
export default function CvmValeClient({
  documentos,
}: {
  documentos: DocumentoCvmVale[];
}) {
  const [ano, setAno] = useState<string>("todos");
  const [tipo, setTipo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<{
    chave: string;
    direcao: Direcao;
  } | null>({ chave: "ano", direcao: "desc" });

  const anosComContagem = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const d of documentos) {
      contagem.set(String(d.ano), (contagem.get(String(d.ano)) ?? 0) + 1);
    }
    return [...contagem.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [documentos]);

  const tiposComContagem = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const d of documentos) {
      contagem.set(d.tipo, (contagem.get(d.tipo) ?? 0) + 1);
    }
    return [...contagem.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [documentos]);

  const filtradas = useMemo(() => {
    let lista = documentos;
    if (ano !== "todos") lista = lista.filter((d) => String(d.ano) === ano);
    if (tipo !== "todos") lista = lista.filter((d) => d.tipo === tipo);
    if (!ordem) {
      // Ordem original do dado: ano mais recente primeiro, depois tipo, depois
      // período — o leitor vê o que a companhia protocolou por último.
      return [...lista].sort(
        (a, b) =>
          b.ano - a.ano ||
          a.tipo.localeCompare(b.tipo) ||
          a.periodo.localeCompare(b.periodo)
      );
    }
    const tipoCampo: TipoCampo =
      ordem.chave === "ano" || ordem.chave === "versao"
        ? "numero"
        : ordem.chave === "data_referencia" || ordem.chave === "data_recebimento"
          ? "data"
          : "texto";
    return ordenarPor(lista, ordem.chave as keyof DocumentoCvmVale, ordem.direcao, tipoCampo);
  }, [documentos, ano, tipo, ordem]);

  const alternarOrdem = (chave: string) => {
    setOrdem((atual) => {
      if (atual?.chave !== chave) return { chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave, direcao: "desc" };
      return null; // 3º clique devolve a ordem original do dado
    });
  };

  const baixarCsv = () => {
    const BOM = "\ufeff";
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cabecalho = [
      "ano",
      "tipo",
      "periodo",
      "data_referencia",
      "data_recebimento",
      "versao",
      "id_doc",
      "link_documento",
      "link",
    ];
    const linhas = filtradas.map((d) =>
      [
        d.ano,
        d.tipo,
        d.periodo,
        d.data_referencia ?? "",
        d.data_recebimento ?? "",
        d.versao,
        d.id_doc,
        d.link_documento ?? "",
        d.link,
      ]
        .map(esc)
        .join(";")
    );
    const conteudo = BOM + [cabecalho.join(";"), ...linhas].join("\r\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documentos-vale-cvm.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const colunas: {
    chave: string;
    rotulo: string;
    numerica?: boolean;
    tipo?: TipoCampo;
  }[] = [
    { chave: "ano", rotulo: "Ano", numerica: true, tipo: "numero" },
    { chave: "tipo", rotulo: "Tipo", tipo: "texto" },
    { chave: "periodo", rotulo: "Período", tipo: "texto" },
    { chave: "data_referencia", rotulo: "Referente a", tipo: "data" },
    { chave: "data_recebimento", rotulo: "Recebido em", tipo: "data" },
    { chave: "versao", rotulo: "Versão", numerica: true, tipo: "numero" },
    { chave: "link_documento", rotulo: "Documento", tipo: "texto" },
  ];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">
          {formatNumberBR(filtradas.length)} de{" "}
          {formatNumberBR(documentos.length)} documentos
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label htmlFor="filtro-ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <select
              id="filtro-ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="todos">Todos</option>
              {anosComContagem.map(([a, n]) => (
                <option key={a} value={a}>
                  {a} ({n})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="filtro-tipo" className="mb-1 text-xs font-medium text-text-soft">
              Tipo
            </label>
            <select
              id="filtro-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="todos">Todos</option>
              {tiposComContagem.map(([t, n]) => (
                <option key={t} value={t}>
                  {t} ({n})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={baixarCsv}
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {colunas.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={
                      ativa
                        ? ordem.direcao === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-xs uppercase tracking-wide text-text-soft ${
                      c.numerica ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdem(c.chave)}
                      aria-label={`Ordenar por ${c.rotulo}`}
                      title={`Ordenar por ${c.rotulo}`}
                      className={`inline-flex items-center gap-1 rounded transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        ativa ? "text-text" : ""
                      }`}
                    >
                      {c.rotulo}
                      <span aria-hidden="true" className="font-tabular text-[0.8em]">
                        {ativa
                          ? ordem.direcao === "asc"
                            ? "▲"
                            : "▼"
                          : "⇅"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((d) => (
              <tr key={`${d.tipo}-${d.periodo}`} className="border-b border-border/50">
                <td className="border-b border-border px-3 py-2 text-right font-tabular">
                  {d.ano}
                </td>
                <td className="border-b border-border px-3 py-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-text">
                    {d.tipo}
                  </span>
                </td>
                <td className="border-b border-border px-3 py-2">{d.periodo}</td>
                <td className="border-b border-border px-3 py-2 font-tabular">
                  {formatDateBR(d.data_referencia)}
                </td>
                <td className="border-b border-border px-3 py-2 font-tabular">
                  {formatDateBR(d.data_recebimento)}
                </td>
                <td className="border-b border-border px-3 py-2 text-right font-tabular">
                  {d.versao}
                </td>
                <td className="border-b border-border px-3 py-2">
                  {d.link_documento ? (
                    <a
                      href={d.link_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Ver o documento ↗
                    </a>
                  ) : (
                    <a
                      href={d.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Arquivo em massa ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtradas.length === 0 && (
        <p className="mt-4 text-sm text-text-soft">
          Nenhum documento com esse filtro. A coleta cobre {documentos.length}{" "}
          registro(s); o filtro é sobre eles, não sobre o que a CVM tem.
        </p>
      )}

      <p className="mt-3 text-[.8em] text-text-soft">
        A coluna &ldquo;Versão&rdquo; mostra a versão mais recente do período: a
        CVM recebe republicações (a Vale protocolou o FRE de 2025 dezessete
        vezes), e cada período aparece aqui uma única vez, na versão que está
        valendo.
      </p>
    </section>
  );
}
