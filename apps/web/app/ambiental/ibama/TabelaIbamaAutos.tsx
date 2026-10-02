"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import type { AutosPorMunicipio } from "@/lib/ambiental/ibama-autos";

/**
 * Tabela dos autos de infração do IBAMA por município de Minas Gerais — busca,
 * ordenação por coluna e CSV do filtrado (regras 2, 3 e 6 do AGENTS § 8).
 *
 * Auto lavrado não é condenação: cabe defesa e recurso. O infrator não é
 * publicado — só o agregado por território.
 */

type Chave = "municipio" | "autos" | "valor" | "area_ha" | "com_embargo";

const num = (n: number) => n.toLocaleString("pt-BR");
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const ha = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " ha";

export default function TabelaIbamaAutos({ registros }: { registros: AutosPorMunicipio[] }) {
  const [busca, setBusca] = useState("");
  const [soEmbargo, setSoEmbargo] = useState(false);
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({ chave: "autos", dir: "desc" });

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => {
      if (soEmbargo && r.com_embargo === 0) return false;
      if (!termo) return true;
      return semAcento(`${r.municipio} ${r.cod_ibge}`).includes(termo);
    });
    return [...base].sort((a, b) => {
      const va = a[ordem.chave];
      const vb = b[ordem.chave];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : semAcento(String(va ?? "")).localeCompare(semAcento(String(vb ?? "")), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [registros, busca, soEmbargo, ordem]);

  const colunas: ColunaCsv<AutosPorMunicipio>[] = [
    { chave: "municipio", rotulo: "Município" },
    { chave: "cod_ibge", rotulo: "Código IBGE" },
    { chave: "autos", rotulo: "Autos" },
    { chave: "valor", rotulo: "Valor (R$)", formatar: (v) => String(v).replace(".", ",") },
    { chave: "area_ha", rotulo: "Área autuada (ha)", formatar: (v) => String(v).replace(".", ",") },
    { chave: "com_embargo", rotulo: "Com embargo" },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <section aria-label="Autos do IBAMA por município" className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Autos de infração do IBAMA em Minas Gerais</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {registros.length} municípios · dados de 2015 a 2026
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="município…"
              className="w-44 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soEmbargo} onChange={(e) => setSoEmbargo(e.target.checked)} />
            <span>Só com embargo</span>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "ibama-autos-mg")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Autos de infração lavrados pelo IBAMA em Minas Gerais (2015–2026), por município. Auto lavrado não é
            condenação definitiva: cabe defesa e recurso. O infrator não é publicado — só o agregado.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["municipio", "Município"],
                  ["autos", "Autos"],
                  ["valor", "Valor"],
                  ["area_ha", "Área autuada"],
                  ["com_embargo", "Com embargo"],
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
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.cod_ibge} className="border-b border-border/50">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {r.municipio}
                  <span className="mt-0.5 block text-xs font-normal text-text-soft">{r.cod_ibge}</span>
                </th>
                <td className="py-2 pr-4 text-right tabular-nums">{num(r.autos)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{brl(r.valor)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.area_ha > 0 ? ha(r.area_ha) : "—"}</td>
                <td className="py-2 text-right tabular-nums">{num(r.com_embargo)}</td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna. O CSV leva exatamente estas {filtradas.length} linhas, com{" "}
        <code>;</code> e BOM UTF-8.
      </p>
    </section>
  );
}
