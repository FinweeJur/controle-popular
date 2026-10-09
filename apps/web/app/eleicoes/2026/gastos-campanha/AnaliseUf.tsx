"use client";

/**
 * Análise por estado — seletor de UF com cartões de topo e a tabela de
 * partidos por dentro, ordenável por qualquer coluna e exportável em CSV.
 *
 * Por que é componente de cliente: a troca de estado é interação pura do
 * navegador sobre um JSON pequeno (27 UFs × ~30 partidos), sem servidor no
 * meio (AGENTS.md § 5.1). Padrão de cópia/CSV/ordenabilidade copiado de
 * `ListaGastos.tsx` e da TabelaEstatica, para o leitor achar as mesmas
 * alças em toda a página.
 *
 * MG abre por padrão: o portal é de Minas e o dono pediu explicitamente
 * filtro por partido e por MG (09/10/2026). O seletor aceita qualquer UF.
 */
import { useMemo, useState } from "react";
import Moeda from "@/app/components/Moeda";
import BotoesExportar from "@/app/components/BotoesExportar";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";
import { formatarMoedaBR, formatarNumeroBR } from "@/lib/utilitarios/calculos";
import type { ColunaCsv } from "@/lib/tabela/csv";
import { Cartao } from "./comum";
import type { PartidoAnalise, UfAnalise } from "@/lib/eleicoes/gastos-2026";

/** Colunas da tabela de partidos — o campo guia ordenação, célula e CSV. */
type Campo =
  | "partido"
  | "candidaturas"
  | "eleitos"
  | "receita"
  | "contratado"
  | "pago"
  | "digital"
  | "bigtech"
  | "custoVotoMedianoEleitos";

const COLUNAS_TELA: { campo: Campo; rotulo: string; numerica?: boolean }[] = [
  { campo: "partido", rotulo: "Partido" },
  { campo: "candidaturas", rotulo: "Candidaturas", numerica: true },
  { campo: "eleitos", rotulo: "Eleitos", numerica: true },
  { campo: "receita", rotulo: "Receita", numerica: true },
  { campo: "contratado", rotulo: "Contratado", numerica: true },
  { campo: "pago", rotulo: "Pago", numerica: true },
  { campo: "digital", rotulo: "Digital", numerica: true },
  { campo: "bigtech", rotulo: "Big tech", numerica: true },
  { campo: "custoVotoMedianoEleitos", rotulo: "Custo por voto (mediano, eleitos)", numerica: true },
];

/** Dinheiro em pt-BR com 2 casas — o CSV daqui usa `;` e vírgula decimal. */
const dinheiro = (valor: unknown) => (typeof valor === "number" ? formatarNumeroBR(valor, 2) : "");

const COLUNAS_CSV: ColunaCsv<PartidoAnalise>[] = [
  { chave: "partido", rotulo: "Partido" },
  { chave: "nome", rotulo: "Nome" },
  { chave: "candidaturas", rotulo: "Candidaturas" },
  { chave: "eleitos", rotulo: "Eleitos" },
  { chave: "receita", rotulo: "Receita (R$)", formatar: dinheiro },
  { chave: "contratado", rotulo: "Contratado (R$)", formatar: dinheiro },
  { chave: "pago", rotulo: "Pago (R$)", formatar: dinheiro },
  { chave: "digital", rotulo: "Digital contratado (R$)", formatar: dinheiro },
  { chave: "bigtech", rotulo: "Big tech contratado (R$)", formatar: dinheiro },
  { chave: "custoVotoMedianoEleitos", rotulo: "Custo por voto mediano eleitos (R$)", formatar: dinheiro },
];

/** Uma célula da tabela, formatada conforme o campo. */
function celula(p: PartidoAnalise, campo: Campo) {
  switch (campo) {
    case "partido":
      return (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{p.partido}</span>
          <span className="text-xs opacity-70">{p.nome}</span>
        </span>
      );
    case "candidaturas":
    case "eleitos":
      return formatarNumeroBR(p[campo], 0);
    case "custoVotoMedianoEleitos":
      return p.custoVotoMedianoEleitos == null ? "—" : formatarMoedaBR(p.custoVotoMedianoEleitos);
    default:
      return <Moeda value={p[campo]} />;
  }
}

export default function AnaliseUf({ ufs }: { ufs: UfAnalise[] }) {
  const [uf, setUf] = useState(() => (ufs.some((u) => u.uf === "MG") ? "MG" : (ufs[0]?.uf ?? "")));
  const [campo, setCampo] = useState<Campo>("contratado");
  const [desc, setDesc] = useState(true);

  const atual = ufs.find((u) => u.uf === uf);

  /** Partidos do estado, ordenados pelo campo atual (numérico ↓, texto ↑). */
  const ordenadas = useMemo(() => {
    const copia = [...(atual?.partidos ?? [])];
    copia.sort((a, b) => {
      const va = a[campo];
      const vb = b[campo];
      let cmp: number;
      if (typeof va === "string" || typeof vb === "string") {
        cmp = String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR");
      } else {
        cmp = (va ?? -1) - (vb ?? -1);
      }
      return desc ? -cmp : cmp;
    });
    return copia;
  }, [atual, campo, desc]);

  const controle =
    "rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
        <label className="text-sm">
          <span className="mr-2 opacity-75">Estado</span>
          <select value={uf} onChange={(e) => setUf(e.target.value)} className={controle}>
            {ufs.map((u) => (
              <option key={u.uf} value={u.uf}>
                {u.uf}
              </option>
            ))}
          </select>
        </label>
        {atual && (
          <p className="text-xs opacity-70">
            {formatarNumeroBR(atual.candidaturas, 0)} candidaturas · {formatarNumeroBR(atual.eleitos, 0)}{" "}
            eleitos
            {atual.pendentes2t > 0 ? ` · ${atual.pendentes2t} no 2º turno` : ""}
          </p>
        )}
      </div>

      {!atual && <p className="text-sm opacity-80">Estado sem agregado nesta coleta.</p>}

      {atual && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Cartao
              titulo="Receita"
              valor={<Moeda value={atual.receita} />}
              detalhe={`campanhas com votação em ${atual.uf}`}
            />
            <Cartao
              titulo="Contratado"
              valor={<Moeda value={atual.contratado} />}
              detalhe={`${formatarNumeroBR(atual.candidaturas, 0)} candidaturas no universo completo`}
            />
            <Cartao
              titulo="Pago"
              valor={<Moeda value={atual.pago} />}
              detalhe={`digital ${formatCurrencyCompactaBR(atual.digital)} · big tech ${formatCurrencyCompactaBR(atual.bigtech)}`}
            />
            <Cartao
              titulo="Custo por voto"
              valor={atual.custoVotoMedianoEleitos == null ? "—" : formatarMoedaBR(atual.custoVotoMedianoEleitos)}
              detalhe="mediana entre os eleitos do estado"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
            <table className="w-full text-sm">
              <caption className="border-b border-[var(--cp-border)] px-3 py-2 text-left text-xs font-semibold opacity-80">
                Partidos de {atual.uf}, do maior contratado para o menor — clique no título da coluna
                para ordenar
              </caption>
              <thead>
                <tr className="border-b border-[var(--cp-border)] bg-[var(--cp-surface)]">
                  {COLUNAS_TELA.map((c) => (
                    <th
                      key={c.campo}
                      scope="col"
                      aria-sort={campo === c.campo ? (desc ? "descending" : "ascending") : "none"}
                      className="px-3 py-2 text-left text-xs uppercase tracking-wide opacity-70"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (campo === c.campo) setDesc(!desc);
                          else {
                            setCampo(c.campo);
                            setDesc(Boolean(c.numerica));
                          }
                        }}
                        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:underline"
                      >
                        {c.rotulo}
                        {campo === c.campo ? (desc ? " ↓" : " ↑") : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((p) => (
                  <tr key={p.partido} className="border-b border-[var(--cp-border)] last:border-0">
                    {COLUNAS_TELA.map((c) => (
                      <td
                        key={c.campo}
                        className={`px-3 py-1.5 ${c.numerica ? "text-right font-tabular whitespace-nowrap" : ""}`}
                      >
                        {celula(p, c.campo)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <BotoesExportar
            dados={ordenadas}
            colunas={COLUNAS_CSV}
            nomeArquivo={`gastos-2026-${uf}-partidos`}
            textoClipboard={undefined}
          />

          <p className="text-xs opacity-70">
            Estes são os candidatos do estado somados de ponta a ponta — não a prestação própria do
            órgão estadual da legenda, que vem na seção Órgãos partidários. Os dois números não se
            somam.
          </p>
        </>
      )}
    </div>
  );
}
