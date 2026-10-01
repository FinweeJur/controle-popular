"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { semAcento } from "@/lib/busca/normalizar";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import {
  PADROES_PORTA_GIRATORIA,
  ROTULO_ORGAO_PORTA,
  type RegistroPortaGiratoria,
} from "@/lib/empresas/porta-giratoria";

/**
 * Tabela da porta giratória (FRE/CVM) — busca tolerante a acento, filtro por
 * padrão de cargo público e por PEP, ordenação por coluna e CSV do filtrado
 * (regras 2, 3, 4 e 6 do AGENTS § 8).
 *
 * A coleção vem como prop porque são 713 linhas: cabe na página (o teto de
 * ~2 mil linhas do AGENTS § 5.1 é o critério — acima disso, índice fatiado).
 * O trecho é a declaração literal da companhia; o link abre o formulário
 * original na CVM. O portal não afirma ilicitude — publica sinal com fonte.
 */

type Chave = "nome" | "companhia" | "orgao_cargo" | "padrao" | "pep" | "ano_fre" | "data_posse";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PainelPortaGiratoria({ registros }: { registros: RegistroPortaGiratoria[] }) {
  const [busca, setBusca] = useState("");
  const [padrao, setPadrao] = useState<string>("todos");
  const [soPep, setSoPep] = useState(false);
  const [orgao, setOrgao] = useState<"todos" | "comite" | "conselho_administracao_ou_fiscal_diretoria">("todos");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({ chave: "companhia", dir: "asc" });

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = registros.filter((r) => {
      if (padrao !== "todos" && !r.padroes.includes(padrao)) return false;
      if (soPep && !r.pep_declarada) return false;
      if (orgao !== "todos" && r.tipo_orgao !== orgao) return false;
      if (!termo) return true;
      return semAcento([r.nome, r.companhia, r.orgao_cargo, r.cargo_detalhe, r.padroes.join(" "), r.trecho].join(" "))
        .includes(termo);
    });
    const valor = (r: RegistroPortaGiratoria, chave: Chave): string | number | boolean => {
      switch (chave) {
        case "nome":
          return r.nome;
        case "companhia":
          return r.companhia;
        case "orgao_cargo":
          return r.orgao_cargo;
        case "padrao":
          return r.padroes[0] ?? "";
        case "pep":
          return r.pep_declarada;
        case "ano_fre":
          return r.ano_fre;
        case "data_posse":
          return r.data_posse;
      }
    };
    return [...base].sort((a, b) => {
      const va = valor(a, ordem.chave);
      const vb = valor(b, ordem.chave);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : typeof va === "boolean" && typeof vb === "boolean"
            ? Number(va) - Number(vb)
            : semAcento(String(va)).localeCompare(semAcento(String(vb)), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [registros, busca, padrao, soPep, orgao, ordem]);

  const colunas: ColunaCsv<RegistroPortaGiratoria>[] = [
    { chave: "nome", rotulo: "Pessoa" },
    { chave: "companhia", rotulo: "Companhia" },
    { chave: "cnpj_cia", rotulo: "CNPJ" },
    { chave: "orgao_cargo", rotulo: "Cargo atual" },
    { chave: "tipo_orgao", rotulo: "Órgão", formatar: (v) => ROTULO_ORGAO_PORTA[v as keyof typeof ROTULO_ORGAO_PORTA] ?? String(v) },
    { chave: "padroes", rotulo: "Cargo público declarado", formatar: (v) => (Array.isArray(v) ? v.join("; ") : String(v ?? "")) },
    { chave: "pep_declarada", rotulo: "PEP declarada", formatar: (v) => (v ? "sim" : "não") },
    { chave: "data_posse", rotulo: "Posse" },
    { chave: "ano_fre", rotulo: "Ano do FRE" },
    { chave: "url_documento", rotulo: "Formulário (CVM)" },
    { chave: "trecho", rotulo: "Trecho declarado" },
  ];

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");
  const ordenar = (chave: Chave) =>
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));

  return (
    <section aria-label="Porta giratória" className="rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground">Porta giratória: cargo público e conselho hoje</h2>
          <ResumoExpandivel
            className="mt-2 text-sm leading-relaxed text-text-soft"
            texto={
              `Quem, hoje, senta num conselho, diretoria ou comitê de uma companhia aberta e declarou à CVM ` +
              `ter exercido cargo público (ministro, secretário, Banco Central, agência reguladora, Tribunal de ` +
              `Contas, Ministério Público, cargo eletivo) nos últimos cinco anos. O trecho é a declaração da ` +
              `própria companhia no Formulário de Referência; o link abre o documento na CVM. Trânsito entre o ` +
              `Estado e a empresa é lícito: o que se publica é o sinal, com fonte direta, para a conferência.`
            }
          />
        </div>
        <p className="text-sm text-text-soft">
          {fmt(filtradas.length)} de {fmt(registros.length)} registros
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 print:hidden">
        <label className="flex items-center gap-2 text-sm">
          <span>Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="pessoa, empresa, cargo, trecho…"
            className="w-56 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>Cargo público</span>
          <select
            value={padrao}
            onChange={(e) => setPadrao(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <option value="todos">Todos</option>
            {PADROES_PORTA_GIRATORIA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>Órgão</span>
          <select
            value={orgao}
            onChange={(e) => setOrgao(e.target.value as typeof orgao)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <option value="todos">Todos</option>
            <option value="conselho_administracao_ou_fiscal_diretoria">Diretoria / Conselho</option>
            <option value="comite">Comitê</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soPep} onChange={(e) => setSoPep(e.target.checked)} />
          <span>Só PEP declarada</span>
        </label>
        <button
          type="button"
          onClick={() => baixarCsv(colunas, filtradas, "porta-giratoria-cvm")}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
        >
          Baixar CSV do filtrado
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left text-text-soft">
            Declarações do item 12 do Formulário de Referência (experiência profissional). O trecho é literal; a
            conferência é no documento original na CVM. A menção a um cargo público não é, por si, ilícito.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              {(
                [
                  ["nome", "Pessoa"],
                  ["companhia", "Companhia"],
                  ["orgao_cargo", "Cargo atual"],
                  ["padrao", "Cargo público declarado"],
                  ["pep", "PEP"],
                  ["ano_fre", "FRE"],
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
            {filtradas.map((r) => (
              <tr key={`${r.id_doc}-${r.cnpj_cia}-${r.nome}`} className="border-b border-border/50 align-top">
                <th scope="row" className="py-2 pr-4 text-left font-medium">
                  {r.nome}
                  <span className="mt-1 block max-w-md text-xs font-normal leading-snug text-text-soft">
                    {r.trecho}
                  </span>
                </th>
                <td className="py-2 pr-4">
                  {r.companhia}
                  <span className="mt-0.5 block text-xs text-text-soft">{r.cnpj_cia}</span>
                </td>
                <td className="py-2 pr-4 text-xs">
                  {r.orgao_cargo || ROTULO_ORGAO_PORTA[r.tipo_orgao]}
                  {r.cargo_detalhe ? <span className="mt-0.5 block text-text-soft">{r.cargo_detalhe}</span> : null}
                </td>
                <td className="py-2 pr-4">
                  <span className="flex flex-wrap gap-1">
                    {r.padroes.map((p) => (
                      <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-xs">
                        {p}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="py-2 pr-4">{r.pep_declarada ? "sim" : "não"}</td>
                <td className="py-2 pr-4 tabular-nums">{r.ano_fre}</td>
                <td className="py-2 text-xs">
                  {r.url_documento ? (
                    <a
                      href={r.url_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      title="Abrir o Formulário de Referência na CVM"
                    >
                      FRE/CVM
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-text-soft">
                  Nenhum registro com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna; a busca tolera acento e varre pessoa, empresa, cargo e
        trecho. O CSV leva exatamente estas {fmt(filtradas.length)} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </section>
  );
}
