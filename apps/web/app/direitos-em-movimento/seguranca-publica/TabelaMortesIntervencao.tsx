"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import type { MortesPorUf } from "@/lib/seguranca/mortes-intervencao-policial";

/**
 * Tabela das mortes por intervenção de agente do Estado, por UF — busca,
 * ordenação por coluna e CSV do filtrado (regras 2, 3 e 6 do AGENTS § 8).
 * O dado é agregado; não há identificação de vítima nem de agente.
 */

type Chave = "uf" | "mdip" | "participacao_pct" | "masculino" | "feminino" | "mvi";

const num = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%");

export default function TabelaMortesIntervencao({ registros }: { registros: MortesPorUf[] }) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({ chave: "mdip", dir: "desc" });

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => (termo ? semAcento(r.uf).includes(termo) : true));
    return [...base].sort((a, b) => {
      const va = a[ordem.chave];
      const vb = b[ordem.chave];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : semAcento(String(va ?? "")).localeCompare(semAcento(String(vb ?? "")), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [registros, busca, ordem]);

  const colunas: ColunaCsv<MortesPorUf>[] = [
    { chave: "uf", rotulo: "UF" },
    { chave: "mdip", rotulo: "Mortes por intervenção" },
    { chave: "masculino", rotulo: "Masculino" },
    { chave: "feminino", rotulo: "Feminino" },
    { chave: "nao_informado", rotulo: "Não informado" },
    { chave: "mvi", rotulo: "Mortes violentas intencionais" },
    { chave: "participacao_pct", rotulo: "Participação (%)", formatar: (v) => String(v ?? "").replace(".", ",") },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <section aria-label="Mortes por intervenção, por UF" className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Mortes por intervenção de agente do Estado, por UF</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {registros.length} UFs · participação sobre as mortes violentas intencionais
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="UF…"
              className="w-28 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "mortes-intervencao-policial-2025-por-uf")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Sinesp VDE / MJSP — mortes por intervenção de agente do Estado em 2025, por UF. Participação = sobre as
            mortes violentas intencionais (homicídio doloso + latrocínio + lesão corporal seguida de morte + estas).
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["uf", "UF"],
                  ["mdip", "Intervenção"],
                  ["participacao_pct", "Participação"],
                  ["masculino", "Homens"],
                  ["feminino", "Mulheres"],
                  ["mvi", "MVI (total)"],
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
              <tr key={r.uf} className="border-b border-border/50">
                <th scope="row" className="py-2 pr-4 text-left font-medium">{r.uf}</th>
                <td className="py-2 pr-4 text-right font-medium tabular-nums">{num(r.mdip)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pct(r.participacao_pct)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{num(r.masculino)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{num(r.feminino)}</td>
                <td className="py-2 text-right tabular-nums">{num(r.mvi)}</td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text-soft">
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
