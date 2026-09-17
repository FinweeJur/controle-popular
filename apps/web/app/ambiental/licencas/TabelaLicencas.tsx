"use client";

/**
 * TabelaLicencas.tsx — feed unificado de licenças/outorgas/autos com os
 * filtros do dono: estado (UF), tema (categoria/tag), ano, regional
 * (bacia), órgão licenciador, empresa, data de início e data de decisão,
 * tags derivadas do tipo, colunas classificáveis/ordenáveis e CSV do
 * que está filtrado na tela (`;` + BOM UTF-8). Mesma forma de
 * `ListaParlamentares`/`PainelEditais`: filtro no cliente, lista cheia
 * vem do servidor, sem Nova consulta ao banco no runtime.
 */
import { useMemo, useState } from "react";
import type { LinhaLicencaUnificada } from "@/lib/ambiental/licencas-unificada";

const COLUNAS = [
  { chave: "orgao", titulo: "Órgão" },
  { chave: "uf", titulo: "UF" },
  { chave: "ano", titulo: "Ano" },
  { chave: "tipo", titulo: "Tipo (tag)" },
  { chave: "empresa", titulo: "Empresa/titular" },
  { chave: "municipio", titulo: "Município" },
  { chave: "bacia", titulo: "Regional/bacia" },
  { chave: "data_inicio", titulo: "Início" },
  { chave: "data_fim", titulo: "Decisão/validade" },
  { chave: "situacao", titulo: "Situação" },
  { chave: "processo", titulo: "Processo" },
] as const;

type ChaveColuna = (typeof COLUNAS)[number]["chave"];

interface Filtro {
  uf: string;
  categoria: string;
  ano: string;
  bacia: string;
  orgao: string;
  empresa: string;
  dataInicioDe: string;
  dataInicioAte: string;
  dataDecDe: string;
  dataDecAte: string;
}

const VAZIO: Filtro = {
  uf: "",
  categoria: "",
  ano: "",
  bacia: "",
  orgao: "",
  empresa: "",
  dataInicioDe: "",
  dataInicioAte: "",
  dataDecDe: "",
  dataDecAte: "",
};

function unicos(valor: Array<string | null>): string[] {
  return [...new Set(valor.filter((v): v is string => Boolean(v)))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );
}

export default function TabelaLicencas({ linhas }: { linhas: LinhaLicencaUnificada[] }) {
  const [filtro, setFiltro] = useState<Filtro>(VAZIO);
  const [ordem, setOrdem] = useState<{ chave: ChaveColuna; desc: boolean }>({ chave: "ano", desc: true });

  const opcoes = useMemo(
    () => ({
      ufs: unicos(linhas.map((l) => l.uf)),
      orgaos: unicos(linhas.map((l) => l.orgao)),
      categorias: unicos(linhas.map((l) => l.categoria)),
      bacias: unicos(linhas.map((l) => l.bacia)),
      anos: unicos(linhas.map((l) => (l.ano === null ? null : String(l.ano)))),
    }),
    [linhas]
  );

  const filtradas = linhas.filter(
    (l) =>
      (!filtro.uf || l.uf === filtro.uf) &&
      (!filtro.categoria || l.categoria === filtro.categoria) &&
      (!filtro.ano || String(l.ano ?? "") === filtro.ano) &&
      (!filtro.bacia || (l.bacia ?? "").includes(filtro.bacia)) &&
      (!filtro.orgao || l.orgao === filtro.orgao) &&
      (!filtro.empresa ||
        (l.empresa ?? "").toLowerCase().includes(filtro.empresa.toLowerCase())) &&
      (!filtro.dataInicioDe ||
        (l.data_inicio ?? "") >= filtro.dataInicioDe) &&
      (!filtro.dataInicioAte ||
        (l.data_inicio ?? "") <= filtro.dataInicioAte) &&
      (!filtro.dataDecDe || (l.data_fim ?? "") >= filtro.dataDecDe) &&
      (!filtro.dataDecAte || (l.data_fim ?? "") <= filtro.dataDecAte)
  );

  const ordenadas = [...filtradas].sort((a, b) => {
    const va = String(a[ordem.chave] ?? "").toLowerCase();
    const vb = String(b[ordem.chave] ?? "").toLowerCase();
    const valor = va.localeCompare(vb, "pt-BR");
    return ordem.desc ? -valor : valor;
  });

  function baixarCsv(): void {
    const cab = ["orgao", "uf", "ano", "categoria", "tipo", "empresa", "municipio", "bacia", "data_inicio", "data_fim", "situacao", "processo"];
    const linhasCsv = [
      cab.join(";"),
      ...ordenadas.map((l) =>
        [l.orgao, l.uf, l.ano, l.categoria, l.tipo, l.empresa, l.municipio, l.bacia, l.data_inicio, l.data_fim, l.situacao, l.processo]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(";")
      ),
    ];
    // BOM UTF-8 + ';' — Excel brasileiro abre acento e coluna certos.
    const blob = new Blob(["\uFEFF" + linhasCsv.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "licencas-ambientais-filtrado.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const temFiltro = JSON.stringify(filtro) !== JSON.stringify(VAZIO);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
        {(
          [
            ["orgao", "Órgão", opcoes.orgaos],
            ["categoria", "Categoria (tag)", opcoes.categorias],
            ["uf", "Estado (UF)", opcoes.ufs],
            ["ano", "Ano", opcoes.anos],
          ] as const
        ).map(([chave, titulo, valores]) => (
          <label key={chave}>
            <span className="block opacity-75">{titulo}</span>
            <select
              value={filtro[chave]}
              onChange={(e) => setFiltro({ ...filtro, [chave]: e.target.value })}
              className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
            >
              <option value="">Todos</option>
              {valores.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label>
          <span className="block opacity-75">Regional/bacia</span>
          <input
            list="bacias-licencas"
            value={filtro.bacia}
            onChange={(e) => setFiltro({ ...filtro, bacia: e.target.value })}
            placeholder="digite ou escolha"
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
          <datalist id="bacias-licencas">
            {opcoes.bacias.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </label>

        <label>
          <span className="block opacity-75">Empresa/titular</span>
          <input
            value={filtro.empresa}
            onChange={(e) => setFiltro({ ...filtro, empresa: e.target.value })}
            placeholder="parte do nome"
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>

        <label>
          <span className="block opacity-75">Início de</span>
          <input
            type="date"
            value={filtro.dataInicioDe}
            onChange={(e) => setFiltro({ ...filtro, dataInicioDe: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>
        <label>
          <span className="block opacity-75">Início até</span>
          <input
            type="date"
            value={filtro.dataInicioAte}
            onChange={(e) => setFiltro({ ...filtro, dataInicioAte: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>
        <label>
          <span className="block opacity-75">Decisão de</span>
          <input
            type="date"
            value={filtro.dataDecDe}
            onChange={(e) => setFiltro({ ...filtro, dataDecDe: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>
        <label>
          <span className="block opacity-75">Decisão até</span>
          <input
            type="date"
            value={filtro.dataDecAte}
            onChange={(e) => setFiltro({ ...filtro, dataDecAte: e.target.value })}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>

        {temFiltro ? (
          <>
            <button
              type="button"
              onClick={baixarCsv}
              className="mb-1 rounded-md border border-[var(--cp-border)] px-3 py-2 underline hover:border-[var(--cp-primary)]"
            >
              Baixar CSV do que está na tela
            </button>
            <button type="button" onClick={() => setFiltro(VAZIO)} className="mb-1 pb-2 underline">
              limpar
            </button>
          </>
        ) : null}
      </div>

      {linhas.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma licença coletada ainda. Rodar coletores da rotina ambiental
          (scripts/rotina-ambiental.mts) na máquina que publica.
        </p>
      ) : (
        <>
          <p className="text-sm opacity-70">
            <span className="font-tabular">{ordenadas.length}</span> de{" "}
            <span className="font-tabular">{linhas.length}</span>{" "}
            {ordenadas.length === 1 ? "registro" : "registros"}
            {" — cadastros de órgãos diferentes não são somados como um só total"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--cp-border)] uppercase tracking-wider opacity-70">
                  {COLUNAS.map((c) => (
                    <th key={c.chave}>
                      <button
                        type="button"
                        onClick={() =>
                          setOrdem((o) =>
                            o.chave === c.chave
                              ? { chave: c.chave, desc: !o.desc }
                              : { chave: c.chave, desc: true }
                          )
                        }
                        className="flex w-full items-center gap-1 py-2 font-semibold"
                      >
                        {c.titulo}
                        {ordem.chave === c.chave ? (ordem.desc ? "▼" : "▲") : "⇅"}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenadas.slice(0, 500).map((l, i) => (
                  <tr
                    key={`${l.orgao}-${l.processo}-${i}`}
                    className="border-b border-border/50 hover:bg-surface-2/40"
                  >
                    {COLUNAS.map((c) => (
                      <td key={c.chave} className="px-2 py-2">
                        {String(l[c.chave] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {ordenadas.length > 500 ? (
              <p className="mt-2 text-xs opacity-70">
                A tabela mostra os 500 primeiro registros do filtro. A base
                completa sai do botão de CSV e nas próximas rodadas via
                paginação no servidor (acima de 2.000 linhas, regra do
                repositório).
              </p>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
