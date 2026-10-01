"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";

/**
 * Tabela unificada dos municípios dos Vales do Jequitinhonha e do Mucuri (MG) —
 * busca tolerante a acento, filtros por faceta real, ordenação por coluna e
 * CSV do filtrado (regras 2, 3 e 6 do AGENTS § 8).
 *
 * A coleção vem como prop porque são 82 linhas: cabe na página. O teto de
 * ~2 mil linhas do AGENTS § 5.1 é o critério — acima disso, índice fatiado
 * (mesma decisão da tabela de comunidades de `/mineracao/ilegal`).
 *
 * Cada linha traz os links oficiais de conferência do próprio dado (PNCP para
 * contratações, portal de transparência da prefeitura). O portal não publica
 * opinião sobre o município: publica o catálogo com a porta de entrada oficial.
 */

export interface LinhaVale {
  /** Vale a que o município pertence. */
  vale: "Jequitinhonha" | "Mucuri";
  /** Nome canônico do município (IBGE). */
  nome: string;
  /** Código IBGE de 7 dígitos (com dígito verificador). */
  id_ibge7: string;
  /** Sub-região (Alto/Médio/Baixo Jequitinhonha) ou null no Mucuri. */
  subregiao: string | null;
  /** Polo regional de referência para serviços. */
  polo_regional: string;
  /** Bacia hidrográfica principal. */
  bacia: string;
  /** True quando há títulos/pesquisas/reservas de lítio mapeadas. */
  tem_litio: boolean;
  /** Tipos de povos e comunidades tradicionais, ou null quando não há. */
  comunidades: string | null;
  /** Povo indígena presente (ex: Maxakali), ou null quando não há. */
  povo_indigena: string | null;
  /** Link paramétrico de contratações no PNCP. */
  link_pncp: string;
  /** Link do portal de transparência da prefeitura. */
  link_transparencia: string;
}

type Chave =
  | "nome"
  | "vale"
  | "subregiao"
  | "polo_regional"
  | "bacia"
  | "tem_litio"
  | "comunidades"
  | "povo_indigena";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TabelaMunicipiosVales({ linhas }: { linhas: LinhaVale[] }) {
  const [busca, setBusca] = useState("");
  const [vale, setVale] = useState<"todos" | LinhaVale["vale"]>("todos");
  const [soLitio, setSoLitio] = useState(false);
  const [soTradicionais, setSoTradicionais] = useState(false);
  const [soIndigenas, setSoIndigenas] = useState(false);
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({
    chave: "nome",
    dir: "asc",
  });

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = linhas.filter((l) => {
      if (vale !== "todos" && l.vale !== vale) return false;
      if (soLitio && !l.tem_litio) return false;
      if (soTradicionais && !l.comunidades) return false;
      if (soIndigenas && !l.povo_indigena) return false;
      if (!termo) return true;
      return semAcento(
        [l.nome, l.id_ibge7, l.subregiao, l.polo_regional, l.bacia, l.comunidades, l.povo_indigena]
          .filter(Boolean)
          .join(" "),
      ).includes(termo);
    });
    const valor = (l: LinhaVale, chave: Chave): string | boolean => {
      switch (chave) {
        case "nome":
          return l.nome;
        case "vale":
          return l.vale;
        case "subregiao":
          return l.subregiao ?? "";
        case "polo_regional":
          return l.polo_regional;
        case "bacia":
          return l.bacia;
        case "tem_litio":
          return l.tem_litio;
        case "comunidades":
          return l.comunidades ?? "";
        case "povo_indigena":
          return l.povo_indigena ?? "";
      }
    };
    return [...base].sort((a, b) => {
      const va = valor(a, ordem.chave);
      const vb = valor(b, ordem.chave);
      const cmp =
        typeof va === "boolean" && typeof vb === "boolean"
          ? Number(va) - Number(vb)
          : semAcento(String(va)).localeCompare(semAcento(String(vb)), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [linhas, busca, vale, soLitio, soTradicionais, soIndigenas, ordem]);

  const colunas: ColunaCsv<LinhaVale>[] = [
    { chave: "nome", rotulo: "Município" },
    { chave: "vale", rotulo: "Vale" },
    { chave: "id_ibge7", rotulo: "Código IBGE" },
    { chave: "subregiao", rotulo: "Sub-região" },
    { chave: "polo_regional", rotulo: "Polo regional" },
    { chave: "bacia", rotulo: "Bacia principal" },
    { chave: "tem_litio", rotulo: "Lítio mapeado", formatar: (v) => (v ? "sim" : "não") },
    { chave: "comunidades", rotulo: "Comunidades tradicionais" },
    { chave: "povo_indigena", rotulo: "Povo indígena" },
    { chave: "link_pncp", rotulo: "Consulta PNCP" },
    { chave: "link_transparencia", rotulo: "Portal de transparência" },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");

  const ordenar = (chave: Chave) =>
    setOrdem((o) =>
      o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" },
    );

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Os 82 municípios dos dois vales</h2>
          <p className="mt-1 text-sm text-text-soft">
            {fmt(filtradas.length)} de {fmt(linhas.length)} municípios · dados de 25/09/2026
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="nome, código IBGE, bacia, povo…"
              className="w-52 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Vale</span>
            <select
              value={vale}
              onChange={(e) => setVale(e.target.value as "todos" | LinhaVale["vale"])}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="Jequitinhonha">Jequitinhonha</option>
              <option value="Mucuri">Mucuri</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soLitio} onChange={(e) => setSoLitio(e.target.checked)} />
            <span>Com lítio mapeado</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soTradicionais}
              onChange={(e) => setSoTradicionais(e.target.checked)}
            />
            <span>Com comunidades tradicionais</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soIndigenas}
              onChange={(e) => setSoIndigenas(e.target.checked)}
            />
            <span>Com terra indígena</span>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "vales-jequitinhonha-mucuri-mg")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Catálogo territorial dos Vales do Jequitinhonha (55 municípios) e do Mucuri (27) — lítio
            mapeado, povos e comunidades tradicionais e bacias. Receber menção no catálogo não é
            certificação oficial: a fonte é a porta de conferência.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["nome", "Município"],
                  ["vale", "Vale"],
                  ["subregiao", "Sub-região"],
                  ["polo_regional", "Polo"],
                  ["bacia", "Bacia"],
                  ["tem_litio", "Lítio"],
                  ["comunidades", "Comunidades"],
                  ["povo_indigena", "Povo indígena"],
                ] as const
              ).map(([chave, rotulo]) => (
                <th key={chave} scope="col" className="py-2 pr-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => ordenar(chave)}
                    className="underline-offset-2 hover:underline"
                    aria-label={`Ordenar por ${rotulo}`}
                  >
                    {rotulo}
                    {seta(chave)}
                  </button>
                </th>
              ))}
              <th scope="col" className="py-2 font-semibold">Conferir na fonte</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <tr key={l.id_ibge7} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {l.nome}
                  <span className="mt-0.5 block text-xs text-text-soft">{l.id_ibge7}</span>
                </th>
                <td className="py-2 pr-4">{l.vale}</td>
                <td className="py-2 pr-4 text-xs">{l.subregiao ?? "—"}</td>
                <td className="py-2 pr-4 text-xs">{l.polo_regional}</td>
                <td className="py-2 pr-4 text-xs">{l.bacia}</td>
                <td className="py-2 pr-4">{l.tem_litio ? "sim" : "não"}</td>
                <td className="py-2 pr-4 text-xs">{l.comunidades ?? "—"}</td>
                <td className="py-2 pr-4 text-xs">{l.povo_indigena ?? "—"}</td>
                <td className="py-2 text-xs">
                  <a
                    href={l.link_pncp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title="Consulta paramétrica de contratações no PNCP pelo nome do município"
                  >
                    PNCP
                  </a>
                  <span className="mx-1">·</span>
                  <a
                    href={l.link_transparencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title="Portal de transparência oficial da prefeitura"
                  >
                    Transparência
                  </a>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna; a busca tolera acento e varre nome, código
        IBGE, sub-região, polo, bacia, comunidades e povo. O CSV leva exatamente estas{" "}
        {fmt(filtradas.length)} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </div>
  );
}
