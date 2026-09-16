"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { editaisParaCsv, type ItemEdital } from "@/lib/editais/dados";
import { ordenarPor, type Direcao } from "@/lib/tabela/ordenar";
import { semAcento } from "@/lib/busca/normalizar";

const TODOS = "";
const POR_PAGINA = 25;

interface Coluna {
  chave: "dataPublicacao" | "orgao" | "modalidade" | "titulo" | "score";
  rotulo: string;
  tipo: "data" | "texto" | "numero";
}

const COLUNAS: Coluna[] = [
  { chave: "dataPublicacao", rotulo: "Data", tipo: "data" },
  { chave: "orgao", rotulo: "Órgão", tipo: "texto" },
  { chave: "modalidade", rotulo: "Modalidade", tipo: "texto" },
  { chave: "titulo", rotulo: "Objeto & Certame", tipo: "texto" },
  { chave: "score", rotulo: "Relevância", tipo: "numero" },
];

function dataBR(iso: string | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export default function PainelEditais({
  itens,
  orgaos,
  modalidades,
  anos,
  distribuicaoOrgaos,
}: {
  itens: ItemEdital[];
  orgaos: string[];
  modalidades: string[];
  anos: number[];
  distribuicaoOrgaos: { orgao: string; total: number }[];
}) {
  const [busca, setBusca] = useState("");
  const [orgaoFiltro, setOrgaoFiltro] = useState(TODOS);
  const [modalidadeFiltro, setModalidadeFiltro] = useState(TODOS);
  const [anoFiltro, setAnoFiltro] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: Coluna["chave"]; direcao: Direcao } | null>({
    chave: "dataPublicacao",
    direcao: "desc",
  });
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    let lista = itens.filter((i) => {
      if (orgaoFiltro && i.orgao !== orgaoFiltro) return false;
      if (modalidadeFiltro && i.modalidade !== modalidadeFiltro) return false;
      if (anoFiltro && !(i.dataPublicacao && i.dataPublicacao.startsWith(`${anoFiltro}-`))) return false;
      if (!termo) return true;
      return (
        semAcento(i.titulo).includes(termo) ||
        semAcento(i.orgao).includes(termo) ||
        semAcento(i.modalidade).includes(termo) ||
        semAcento(i.objeto).includes(termo) ||
        semAcento(i.condicoesEPrazos).includes(termo) ||
        (i.numero && semAcento(i.numero).includes(termo))
      );
    });

    if (ordem) {
      lista = ordenarPor(lista, ordem.chave, ordem.direcao, ordem.chave === "dataPublicacao" ? "data" : ordem.chave === "score" ? "numero" : "texto");
    }

    return lista;
  }, [itens, busca, orgaoFiltro, modalidadeFiltro, anoFiltro, ordem]);

  const temFiltro = Boolean(busca || orgaoFiltro || modalidadeFiltro || anoFiltro);
  const visiveis = filtrados.slice(0, mostrando);

  function alternarOrdem(chave: Coluna["chave"]) {
    setOrdem((atual) => {
      if (!atual || atual.chave !== chave) return { chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave, direcao: "desc" };
      return null;
    });
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    const csvContent = editaisParaCsv(filtrados);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `editais-mg-filtrados-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function limparFiltros() {
    setBusca("");
    setOrgaoFiltro(TODOS);
    setModalidadeFiltro(TODOS);
    setAnoFiltro(TODOS);
    setMostrando(POR_PAGINA);
  }

  // Gráfico SVG Inline: Top 6 órgãos com barras horizontais
  const topOrgaosGrafico = distribuicaoOrgaos.slice(0, 6);
  const maxTotalGrafico = Math.max(1, ...topOrgaosGrafico.map((d) => d.total));

  return (
    <section className="mt-8 space-y-8" aria-label="Painel interativo de editais">
      {/* ─── 1. GRÁFICO SVG INLINE ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-text">
              Distribuição por Órgão Emissor
            </h2>
            <p className="text-xs text-text-soft">
              Volume de certames e editais monitorados no Diário Oficial de Minas Gerais
            </p>
          </div>
          <span className="text-xs font-semibold text-primary">
            {distribuicaoOrgaos.length} órgãos mapeados
          </span>
        </div>

        <div className="mt-6 space-y-3" role="img" aria-label="Gráfico de barras: editais por órgão">
          {topOrgaosGrafico.map((d) => {
            const pct = Math.round((d.total / maxTotalGrafico) * 100);
            return (
              <div key={d.orgao} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-text">{d.orgao}</span>
                  <span className="font-mono text-text-soft">{d.total} {d.total === 1 ? "edital" : "editais"}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. FILTROS INTERATIVOS & BUSCA ──────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-soft">Busca livre</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setMostrando(POR_PAGINA);
              }}
              placeholder="Ex.: Trilhas, saúde, transporte, leilão..."
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-soft">Órgão</span>
            <select
              value={orgaoFiltro}
              onChange={(e) => {
                setOrgaoFiltro(e.target.value);
                setMostrando(POR_PAGINA);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todos os órgãos ({orgaos.length})</option>
              {orgaos.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-soft">Modalidade</span>
            <select
              value={modalidadeFiltro}
              onChange={(e) => {
                setModalidadeFiltro(e.target.value);
                setMostrando(POR_PAGINA);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todas as modalidades ({modalidades.length})</option>
              {modalidades.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-soft">Ano</span>
            <select
              value={anoFiltro}
              onChange={(e) => {
                setAnoFiltro(e.target.value);
                setMostrando(POR_PAGINA);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todos os anos ({anos.length})</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-xs text-text-soft">
            Mostrando <strong className="text-text">{filtrados.length}</strong> de{" "}
            {itens.length} editais
            {temFiltro && " (com filtros aplicados)"}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:border-danger hover:text-danger"
              >
                Limpar filtros
              </button>
            )}

            {/* ─── 3. BOTÃO DE DOWNLOAD CSV (BOM UTF-8) ─────────────── */}
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-contrast shadow-sm transition-opacity hover:opacity-90"
              title="Baixar planilha compatível com Excel (separador ponto-e-vírgula e BOM UTF-8)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Exportar CSV ({filtrados.length})
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 & 5. TABELA COM ORDENAÇÃO POR COLUNA ────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs font-semibold text-text-soft uppercase">
              <tr>
                {COLUNAS.map((col) => {
                  const ativa = ordem?.chave === col.chave;
                  return (
                    <th key={col.chave} scope="col" className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => alternarOrdem(col.chave)}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-text"
                      >
                        <span>{col.rotulo}</span>
                        <span className="font-mono text-[10px]">
                          {ativa ? (ordem.direcao === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="px-4 py-3 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-normal text-text">
              {visiveis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-soft">
                    Nenhum edital encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                visiveis.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-mono text-xs text-text-soft whitespace-nowrap">
                      {dataBR(item.dataPublicacao)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text whitespace-nowrap">
                      <span className="inline-block rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs">
                        {item.orgao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-soft whitespace-nowrap">
                      {item.modalidade}
                      {item.numero ? ` nº ${item.numero}` : ""}
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <div className="font-medium text-text">
                        {item.slug ? (
                          <Link
                            href={`/noticias/${item.slug}`}
                            className="hover:text-primary hover:underline"
                          >
                            {item.titulo}
                          </Link>
                        ) : (
                          item.titulo
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-text-soft">
                        {item.objeto}
                      </p>
                      {item.condicoesEPrazos && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-text-soft/80 italic">
                          Prazos: {item.condicoesEPrazos}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Score {item.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {item.slug && (
                          <Link
                            href={`/noticias/${item.slug}`}
                            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary"
                          >
                            Matéria
                          </Link>
                        )}
                        <a
                          href={item.urlOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft hover:text-text"
                          title="Abrir página oficial do Diário Oficial"
                        >
                          Diário Oficial ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > mostrando && (
          <div className="border-t border-border bg-surface p-4 text-center">
            <button
              type="button"
              onClick={() => setMostrando((m) => m + POR_PAGINA)}
              className="cursor-pointer rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
            >
              Carregar mais editais (+{POR_PAGINA})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
