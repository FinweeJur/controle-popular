"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import type { RegistroCadastroEmpregadores } from "@/lib/trabalho/cadastro-empregadores";

/**
 * Tabela do Cadastro de Empregadores do MTE (trabalho escravo contemporâneo) —
 * busca tolerante a acento, filtro por UF e ano, ordenação por coluna e CSV do
 * filtrado (regras 2, 3 e 6 do AGENTS § 8).
 *
 * Cada linha é um empregador pessoa jurídica (CNPJ) com o ato administrativo
 * que gerou a inclusão; o leitor confere na fonte oficial e nos contratos
 * públicos daquele CNPJ (PNCP e Portal da Transparência). O portal republica o
 * ato, não acusa — ver a ressalva na página.
 */

type Chave =
  | "empregador"
  | "cnpj"
  | "uf"
  | "municipio"
  | "trabalhadores_envolvidos"
  | "cnae"
  | "ano_acao_fiscal"
  | "inclusao_cadastro";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

export default function TabelaCadastroEmpregadores({
  registros,
}: {
  registros: RegistroCadastroEmpregadores[];
}) {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("todas");
  const [ano, setAno] = useState("todos");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({
    chave: "inclusao_cadastro",
    dir: "desc",
  });

  const ufs = useMemo(() => [...new Set(registros.map((r) => r.uf))].sort(), [registros]);
  const anos = useMemo(
    () => [...new Set(registros.map((r) => r.ano_acao_fiscal).filter(Boolean))].sort().reverse(),
    [registros],
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => {
      if (uf !== "todas" && r.uf !== uf) return false;
      if (ano !== "todos" && r.ano_acao_fiscal !== ano) return false;
      if (!termo) return true;
      return semAcento([r.empregador, r.cnpj, r.municipio, r.uf, r.cnae, r.estabelecimento].join(" ")).includes(
        termo,
      );
    });
    const valor = (r: RegistroCadastroEmpregadores, chave: Chave): string | number => {
      switch (chave) {
        case "empregador":
          return r.empregador;
        case "cnpj":
          return r.cnpj;
        case "uf":
          return r.uf;
        case "municipio":
          return r.municipio;
        case "trabalhadores_envolvidos":
          return r.trabalhadores_envolvidos ?? -1;
        case "cnae":
          return r.cnae;
        case "ano_acao_fiscal":
          return r.ano_acao_fiscal;
        case "inclusao_cadastro":
          return r.inclusao_cadastro;
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
  }, [registros, busca, uf, ano, ordem]);

  const colunas: ColunaCsv<RegistroCadastroEmpregadores>[] = [
    { chave: "empregador", rotulo: "Empregador" },
    { chave: "cnpj", rotulo: "CNPJ" },
    { chave: "uf", rotulo: "UF" },
    { chave: "municipio", rotulo: "Município" },
    { chave: "trabalhadores_envolvidos", rotulo: "Trabalhadores envolvidos" },
    { chave: "cnae", rotulo: "CNAE" },
    { chave: "estabelecimento", rotulo: "Estabelecimento" },
    { chave: "ano_acao_fiscal", rotulo: "Ano da ação fiscal" },
    { chave: "decisao_administrativa", rotulo: "Decisão administrativa" },
    { chave: "inclusao_cadastro", rotulo: "Inclusão no Cadastro" },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <section aria-label="Cadastro de Empregadores" className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Empresas no Cadastro de Empregadores</h2>
          <p className="mt-1 text-sm text-text-soft">
            {fmt(filtradas.length)} de {fmt(registros.length)} registros · pessoa jurídica (CNPJ)
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="empresa, CNPJ, município, CNAE…"
              className="w-52 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>UF</span>
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
          <label className="flex items-center gap-2 text-sm">
            <span>Ano da ação</span>
            <select
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="todos">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "cadastro-empregadores-mte")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Empregadores pessoa jurídica incluídos no Cadastro de Empregadores do MTE. A inclusão é ato
            administrativo; a empresa pode contestar e ser excluída — a data na linha diz quando o ato ocorreu.
            Confira na fonte antes de qualquer conclusão.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["empregador", "Empregador"],
                  ["uf", "UF"],
                  ["municipio", "Município"],
                  ["trabalhadores_envolvidos", "Trabalhadores"],
                  ["cnae", "CNAE"],
                  ["ano_acao_fiscal", "Ação"],
                  ["inclusao_cadastro", "Inclusão"],
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
              <th scope="col" className="py-2 font-semibold">Contratos do CNPJ</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {r.empregador}
                  <span className="mt-0.5 block text-xs font-normal text-text-soft">{r.cnpj}</span>
                </th>
                <td className="py-2 pr-4">{r.uf}</td>
                <td className="py-2 pr-4 text-xs">{r.municipio || "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.trabalhadores_envolvidos ?? "—"}</td>
                <td className="py-2 pr-4 text-xs">{r.cnae || "—"}</td>
                <td className="py-2 pr-4 text-xs">{r.ano_acao_fiscal || "—"}</td>
                <td className="py-2 pr-4 text-xs">
                  {r.inclusao_cadastro ? r.inclusao_cadastro.split("-").reverse().join("/") : "—"}
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
        {fmt(filtradas.length)} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </section>
  );
}
