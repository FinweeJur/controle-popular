"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

/**
 * Tabela das comunidades tradicionais de MG cruzadas com a mineração — busca,
 * filtro por tipo/bacia/indício, ordenação por coluna e CSV do filtrado
 * (regras 2, 3 e 6 do AGENTS § 8).
 *
 * A coleção vem como prop porque são 43 linhas: cabe na página. O teto de
 * ~2 mil linhas do AGENTS § 5.1 é o critério — acima disso, índice fatiado.
 *
 * Cada linha linka a fonte oficial de consulta (FUNAI para terra indígena,
 * INCRA para território quilombola). O identificador da fonte (código da TI,
 * processo do INCRA) fica na própria linha, para o leitor conferir.
 */

export interface Comunidade {
  tipo: "terra_indigena" | "quilombola";
  nome: string;
  municipio: string | null;
  fase: string | null;
  area_ha: number | null;
  etnia: string | null;
  processo: string | null;
  familias: string | null;
  em_bacia_paraopeba: boolean;
  indicios_mineracao: number;
}

const ROTULO_TIPO: Record<Comunidade["tipo"], string> = {
  terra_indigena: "Terra indígena",
  quilombola: "Território quilombola",
};

const FONTE_TI = "https://geoserver.funai.gov.br/geoserver/ows?service=wfs&version=1.1.0&request=GetCapabilities";
const FONTE_QUILOMBOLA = "http://acervofundiario.incra.gov.br/i3geo/ogc.php?service=WFS&version=1.1.0&request=GetCapabilities";

type Chave = "nome" | "tipo" | "municipio" | "area_ha" | "fase" | "em_bacia_paraopeba" | "indicios_mineracao";

const fmt = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function TabelaComunidades({
  comunidades,
  geradoEm,
}: {
  comunidades: Comunidade[];
  geradoEm: string;
}) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | Comunidade["tipo"]>("todos");
  const [soBacia, setSoBacia] = useState(false);
  const [soIndicio, setSoIndicio] = useState(false);
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({
    chave: "indicios_mineracao",
    dir: "desc",
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = comunidades.filter((c) => {
      if (tipo !== "todos" && c.tipo !== tipo) return false;
      if (soBacia && !c.em_bacia_paraopeba) return false;
      if (soIndicio && c.indicios_mineracao <= 0) return false;
      if (!termo) return true;
      return [c.nome, c.municipio, c.fase, c.etnia, c.processo, ROTULO_TIPO[c.tipo]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
    const valor = (c: Comunidade, chave: Chave): number | string | boolean =>
      chave === "tipo"
        ? c.tipo
        : chave === "nome"
          ? c.nome
          : chave === "municipio"
            ? c.municipio ?? ""
            : chave === "fase"
              ? c.fase ?? ""
              : chave === "area_ha"
                ? c.area_ha ?? -1
                : chave === "em_bacia_paraopeba"
                  ? c.em_bacia_paraopeba
                  : c.indicios_mineracao;
    return [...base].sort((a, b) => {
      const va = valor(a, ordem.chave);
      const vb = valor(b, ordem.chave);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : typeof va === "boolean" && typeof vb === "boolean"
            ? Number(va) - Number(vb)
            : String(va).localeCompare(String(vb), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [comunidades, busca, tipo, soBacia, soIndicio, ordem]);

  const colunas: ColunaCsv<Comunidade>[] = [
    { chave: "nome", rotulo: "Comunidade" },
    { chave: "tipo", rotulo: "Tipo", formatar: (v) => ROTULO_TIPO[v as Comunidade["tipo"]] },
    { chave: "municipio", rotulo: "Município" },
    { chave: "fase", rotulo: "Fase" },
    { chave: "area_ha", rotulo: "Área (ha)", formatar: (v) => (v == null ? "" : String(v).replace(".", ",")) },
    { chave: "etnia", rotulo: "Etnia" },
    { chave: "processo", rotulo: "Processo (INCRA)" },
    { chave: "familias", rotulo: "Famílias" },
    { chave: "em_bacia_paraopeba", rotulo: "Na bacia SF3", formatar: (v) => (v ? "sim" : "não") },
    { chave: "indicios_mineracao", rotulo: "Indícios de mineração dentro" },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");

  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Comunidades tradicionais e mineração</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {comunidades.length} comunidades · cruzamento de{" "}
            {new Date(geradoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="nome, município, etnia, processo…"
              className="w-52 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Tipo</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "todos" | Comunidade["tipo"])}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="terra_indigena">Terra indígena</option>
              <option value="quilombola">Território quilombola</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soBacia} onChange={(e) => setSoBacia(e.target.checked)} />
            <span>Na bacia do Paraopeba</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soIndicio} onChange={(e) => setSoIndicio(e.target.checked)} />
            <span>Com indício de mineração</span>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "comunidades-tradicionais-mineracao-mg")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Comunidades tradicionais de MG, com a bacia do Paraopeba (SF3) e os indícios de mineração
            detectada por satélite dentro de cada uma. O número é piso, não total (método por centroide).
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {([
                ["nome", "Comunidade"],
                ["tipo", "Tipo"],
                ["municipio", "Município"],
                ["fase", "Fase"],
                ["area_ha", "Área (ha)"],
                ["em_bacia_paraopeba", "Bacia SF3"],
                ["indicios_mineracao", "Indícios"],
              ] as const).map(([chave, rotulo]) => (
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
            {filtradas.map((c, i) => (
              <tr key={`${c.tipo}-${c.nome}-${i}`} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {c.nome}
                  {c.etnia ? <span className="mt-0.5 block text-xs text-text-soft">{c.etnia}</span> : null}
                </th>
                <td className="py-2 pr-4">{ROTULO_TIPO[c.tipo]}</td>
                <td className="py-2 pr-4">{c.municipio ?? "—"}</td>
                <td className="py-2 pr-4 text-xs">{c.fase ?? "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {c.area_ha == null ? "—" : fmt(Number(c.area_ha), 1)}
                </td>
                <td className="py-2 pr-4">{c.em_bacia_paraopeba ? "sim" : "não"}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{c.indicios_mineracao}</td>
                <td className="py-2 text-xs">
                  <a
                    href={c.tipo === "terra_indigena" ? FONTE_TI : FONTE_QUILOMBOLA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title={
                      c.tipo === "terra_indigena"
                        ? "Consulta oficial da FUNAI (geoserviços das terras indígenas)"
                        : "Consulta oficial do INCRA (Acervo Fundiário)"
                    }
                  >
                    {c.tipo === "terra_indigena" ? "FUNAI" : "INCRA"}
                  </a>
                  {c.processo ? <span className="mt-0.5 block text-text-soft">{c.processo}</span> : null}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna; a busca varre nome, município, etnia, processo e tipo.
        O CSV leva exatamente estas {filtradas.length} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </div>
  );
}
