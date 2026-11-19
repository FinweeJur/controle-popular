"use client";

import { useMemo, useState } from "react";

import { formatNumberBR } from "@/lib/betim/format";
import {
  filtrarFornecedores,
  fornecedoresParaCsv,
  formatCNPJ,
  formatarDataBR,
  type FornecedorEnriquecido,
} from "@/lib/fontes-externas/paginas";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";

/**
 * Tabela filtrável da amostra de CNPJ enriquecido.
 *
 * Recebe as 17 linhas prontas do Server Component. Filtro por situação e busca
 * livre (razão social, CNPJ com ou sem máscara, CNAE, município, UF); ordenação
 * por coluna; CSV do que está na tela, com BOM e `;`.
 *
 * A tabela rola DENTRO do quadro em 390 px — o corpo da página não ganha
 * rolagem lateral. Sem sócio, sem CPF: o arquivo e o componente não têm esses
 * campos, e o teste de contrato reprova quem acrescentar.
 */

const TODAS = "";

type ChaveColuna =
  | "razaoSocial"
  | "cnpj"
  | "situacaoCadastral"
  | "cnae"
  | "municipio"
  | "consultaEm";

type ChaveOrdem = "razaoSocial" | "situacaoCadastral" | "municipio" | "consultaEm";

const COLUNAS: Array<{
  chave: ChaveColuna;
  rotulo: string;
  tipo: TipoCampo;
  ordenavel: boolean;
}> = [
  { chave: "razaoSocial", rotulo: "Razão social", tipo: "texto", ordenavel: true },
  { chave: "cnpj", rotulo: "CNPJ", tipo: "texto", ordenavel: false },
  { chave: "situacaoCadastral", rotulo: "Situação", tipo: "texto", ordenavel: true },
  { chave: "cnae", rotulo: "CNAE", tipo: "texto", ordenavel: false },
  { chave: "municipio", rotulo: "Município/UF", tipo: "texto", ordenavel: true },
  { chave: "consultaEm", rotulo: "Consulta", tipo: "data", ordenavel: true },
];

const CLASSES_CABECALHO =
  "border-b border-border bg-surface-2 px-3 py-2 text-left text-xs font-semibold tracking-wide text-text-soft uppercase";

export default function PainelFornecedores({
  linhas,
  situacoes,
}: {
  linhas: FornecedorEnriquecido[];
  situacoes: string[];
}) {
  const [situacao, setSituacao] = useState(TODAS);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: ChaveOrdem; direcao: Direcao }>({
    chave: "razaoSocial",
    direcao: "asc",
  });

  const filtrados = useMemo(() => {
    const lista = filtrarFornecedores(linhas, { situacao, busca });
    const tipo = COLUNAS.find((coluna) => coluna.chave === ordem.chave)?.tipo ?? "texto";
    return ordenarPor(lista, ordem.chave, ordem.direcao, tipo);
  }, [linhas, situacao, busca, ordem]);

  const temFiltro = Boolean(situacao || busca.trim());

  function alternarOrdem(chave: ChaveOrdem) {
    setOrdem((atual) => {
      if (atual.chave !== chave) return { chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave, direcao: "desc" };
      return { chave, direcao: "asc" };
    });
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    const csv = fornecedoresParaCsv(filtrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fornecedores-cnpj-filtrados-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function limparFiltros() {
    setSituacao(TODAS);
    setBusca("");
  }

  function celula(fornecedor: FornecedorEnriquecido, chave: ChaveColuna) {
    switch (chave) {
      case "cnpj":
        return (
          <td
            key={chave}
            className="whitespace-nowrap border-b border-border px-3 py-3 font-tabular text-text"
          >
            {formatCNPJ(fornecedor.cnpj)}
          </td>
        );
      case "razaoSocial":
        return (
          <td key={chave} className="min-w-[190px] border-b border-border px-3 py-3">
            <p className="font-semibold text-text">{fornecedor.razaoSocial}</p>
            <p className="mt-0.5 text-xs text-text-soft">
              {fornecedor.naturezaJuridica} · início{" "}
              {formatarDataBR(fornecedor.dataInicioAtividade)}
            </p>
          </td>
        );
      case "situacaoCadastral":
        return (
          <td key={chave} className="border-b border-border px-3 py-3">
            <span className="inline-flex rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
              {fornecedor.situacaoCadastral}
            </span>
          </td>
        );
      case "cnae":
        return (
          <td key={chave} className="min-w-[210px] border-b border-border px-3 py-3">
            <p className="text-text">{fornecedor.cnae.descricao}</p>
            <p className="mt-0.5 font-tabular text-xs text-text-soft">
              CNAE {fornecedor.cnae.codigo}
            </p>
          </td>
        );
      case "municipio":
        return (
          <td
            key={chave}
            className="whitespace-nowrap border-b border-border px-3 py-3 text-text"
          >
            {fornecedor.municipio}/{fornecedor.uf}
          </td>
        );
      case "consultaEm":
        return (
          <td
            key={chave}
            className="whitespace-nowrap border-b border-border px-3 py-3 font-tabular text-text"
          >
            {formatarDataBR(fornecedor.consultaEm)}
          </td>
        );
    }
  }

  return (
    <div className="mt-4 w-full min-w-0">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Situação cadastral</span>
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODAS}>Todas as situações ({situacoes.length})</option>
              {situacoes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Busca</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Razão social, CNPJ, CNAE ou município…"
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="font-tabular text-xs text-text-soft" aria-live="polite" aria-atomic="true">
            {formatNumberBR(filtrados.length)} de {formatNumberBR(linhas.length)} fornecedores
            {temFiltro ? " com o filtro atual" : ""}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="min-h-9 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={exportarCsv}
              disabled={filtrados.length === 0}
              className="min-h-9 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              Baixar CSV dos filtrados
            </button>
          </div>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-soft">
          Nenhum fornecedor corresponde ao filtro. A busca cobre as {formatNumberBR(linhas.length)}{" "}
          linhas da amostra inteira.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <p className="mb-1 px-3 pt-2 text-xs text-text-soft sm:hidden">
            ← deslize para ver mais colunas →
          </p>
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">
              Fornecedores do acervo com CNPJ enriquecido pela Brasil API;{" "}
              {formatNumberBR(filtrados.length)} de {formatNumberBR(linhas.length)} linhas visíveis.
            </caption>
            <thead>
              <tr>
                {COLUNAS.map((coluna) => {
                  const ativa = ordem.chave === coluna.chave;
                  return (
                    <th
                      key={coluna.chave}
                      scope="col"
                      aria-sort={
                        ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"
                      }
                      className={CLASSES_CABECALHO}
                    >
                      {coluna.ordenavel ? (
                        <button
                          type="button"
                          onClick={() => alternarOrdem(coluna.chave as ChaveOrdem)}
                          aria-label={`Ordenar por ${coluna.rotulo}`}
                          className={`inline-flex min-h-9 items-center gap-1 rounded transition-colors hover:text-text ${
                            ativa ? "text-text" : ""
                          }`}
                        >
                          {coluna.rotulo}
                          <span aria-hidden="true" className="font-tabular text-[12px]">
                            {ativa ? (ordem.direcao === "asc" ? "▲" : "▼") : "⇅"}
                          </span>
                        </button>
                      ) : (
                        coluna.rotulo
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((fornecedor) => (
                <tr key={fornecedor.cnpj} className="align-top">
                  {COLUNAS.map((coluna) => celula(fornecedor, coluna.chave))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
