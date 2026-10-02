"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import type { FornecedorCampanha } from "@/lib/eleicoes/fornecedores-campanha";

/**
 * Tabela dos fornecedores de campanha (TSE 2022/MG) — busca, filtro por UF,
 * ordenação por coluna e CSV do filtrado (regras 2, 3 e 6 do AGENTS § 8).
 *
 * Cada linha é uma empresa (CNPJ) que recebeu da campanha, com os principais
 * destinos e o link para conferir os contratos públicos daquele CNPJ. O portal
 * republica a prestação de contas oficial; fornecer à campanha não é ilícito.
 */

type Chave = "nome" | "cnpj" | "uf" | "municipio" | "total" | "despesas" | "cnae";

const formatarBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

export default function TabelaFornecedoresCampanha({ registros }: { registros: FornecedorCampanha[] }) {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("todas");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({ chave: "total", dir: "desc" });

  const ufs = useMemo(
    () => [...new Set(registros.map((r) => r.uf).filter(Boolean))].sort(),
    [registros],
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => {
      if (uf !== "todas" && r.uf !== uf) return false;
      if (!termo) return true;
      return semAcento([r.nome, r.cnpj, r.municipio, r.uf, r.cnae].join(" ")).includes(termo);
    });
    const valor = (r: FornecedorCampanha, chave: Chave): string | number => {
      switch (chave) {
        case "nome":
          return r.nome;
        case "cnpj":
          return r.cnpj;
        case "uf":
          return r.uf;
        case "municipio":
          return r.municipio;
        case "cnae":
          return r.cnae;
        case "total":
          return r.total;
        case "despesas":
          return r.despesas;
      }
    };
    return [...base].sort((a, b) => {
      const va = valor(a, ordem.chave);
      const vb = valor(b, ordem.chave);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : semAcento(String(va)).localeCompare(semAcento(String(vb)), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [registros, busca, uf, ordem]);

  const colunas: ColunaCsv<FornecedorCampanha>[] = [
    { chave: "nome", rotulo: "Fornecedor" },
    { chave: "cnpj", rotulo: "CNPJ" },
    { chave: "cnae", rotulo: "CNAE" },
    { chave: "municipio", rotulo: "Município" },
    { chave: "uf", rotulo: "UF" },
    { chave: "total", rotulo: "Total contratado", formatar: (v) => String(v).replace(".", ",") },
    { chave: "despesas", rotulo: "Despesas" },
    {
      chave: "top_destinos",
      rotulo: "Principais destinos",
      formatar: (v) =>
        Array.isArray(v)
          ? (v as FornecedorCampanha["top_destinos"])
              .map((d) => `${d.candidato} (${d.cargo}/${d.partido})`)
              .join(" | ")
          : "",
    },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <section aria-label="Fornecedores de campanha" className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Empresas que receberam das campanhas</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length.toLocaleString("pt-BR")} de {registros.length.toLocaleString("pt-BR")} fornecedores ·
            valor contratado
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="empresa, CNPJ, CNAE, município…"
              className="w-52 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>UF do fornecedor</span>
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="todas">Todas</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "fornecedores-campanha-2022-mg")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Fornecedores pessoa jurídica das campanhas de 2022 em Minas Gerais (despesas contratadas), por CNPJ.
            Valor contratado não é valor pago; fornecer à campanha é lícito. Confira o contrato e a prestação de
            contas na fonte.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["nome", "Fornecedor"],
                  ["uf", "UF"],
                  ["municipio", "Município"],
                  ["cnae", "CNAE"],
                  ["total", "Total contratado"],
                  ["despesas", "Despesas"],
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
              <th scope="col" className="py-2 pr-4 font-semibold">Principais destinos</th>
              <th scope="col" className="py-2 font-semibold">Contratos do CNPJ</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.cnpj} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {r.nome || "—"}
                  <span className="mt-0.5 block text-xs font-normal text-text-soft">{r.cnpj}</span>
                </th>
                <td className="py-2 pr-4">{r.uf || "—"}</td>
                <td className="py-2 pr-4 text-xs">{r.municipio || "—"}</td>
                <td className="py-2 pr-4 text-xs">{r.cnae || "—"}</td>
                <td className="py-2 pr-4 text-right font-medium tabular-nums">{formatarBRL(r.total)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.despesas.toLocaleString("pt-BR")}</td>
                <td className="py-2 pr-4 text-xs">
                  {r.top_destinos.length === 0 ? (
                    "—"
                  ) : (
                    <ul className="space-y-1">
                      {r.top_destinos.map((d) => (
                        <li key={`${d.candidato}-${d.partido}`}>
                          {d.candidato} · {d.cargo} · {d.partido}
                          <span className="block text-text-soft">{formatarBRL(d.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 text-xs">
                  <a
                    href={`https://pncp.gov.br/app/contratos?q=${soDigitos(r.cnpj)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title="Contratos deste CNPJ no Portal Nacional de Contratações Públicas"
                  >
                    PNCP
                  </a>
                  <span className="mx-1">·</span>
                  <a
                    href={`https://portaldatransparencia.gov.br/busca?termo=${soDigitos(r.cnpj)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title="Gastos e contratos deste CNPJ no Portal da Transparência"
                  >
                    Transparência
                  </a>
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
        Ordenação crescente/decrescente em cada coluna; a busca tolera acento. O CSV leva exatamente estas{" "}
        {filtradas.length.toLocaleString("pt-BR")} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </section>
  );
}
