"use client";

import { useMemo, useState } from "react";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";
import { TagChip } from "@/app/components/TagChip";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import type { RIO_DOCE_POR_INICIATIVA } from "@/lib/ambiental/ckan-mg-mariana";

type Iniciativa = (typeof RIO_DOCE_POR_INICIATIVA)[number];

type Ordem = "prometido" | "empenhado" | "pago" | "nome";

const COLUNAS_CSV_MARIANA: ColunaCsv<Iniciativa>[] = [
  { chave: "codigo", rotulo: "Código" },
  { chave: "iniciativa", rotulo: "Iniciativa" },
  { chave: "anexo", rotulo: "Anexo" },
  { chave: "valorPrometido", rotulo: "Valor Prometido (R$)" },
  { chave: "valorEmpenhado", rotulo: "Valor Empenhado (R$)" },
  { chave: "valorPagoFinanceiro", rotulo: "Valor Pago Financeiro (R$)" },
  { chave: "empenhos", rotulo: "Quantidade de Empenhos" },
];

export default function PainelMariana({
  iniciativas,
}: {
  iniciativas: readonly Iniciativa[];
}) {
  const [busca, setBusca] = useState("");
  const [anexo, setAnexo] = useState("todos");
  const [ordem, setOrdem] = useState<Ordem>("prometido");

  const anexosUnicos = useMemo(() => {
    return Array.from(new Set(iniciativas.map((i) => i.anexo))).sort();
  }, [iniciativas]);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    return iniciativas
      .filter((i) => {
        if (anexo !== "todos" && i.anexo !== anexo) return false;
        if (!termo) return true;
        return (
          semAcento(i.iniciativa).includes(termo) ||
          semAcento(i.codigo).includes(termo) ||
          semAcento(i.anexo).includes(termo)
        );
      })
      .sort((a, b) => {
        if (ordem === "prometido") return b.valorPrometido - a.valorPrometido;
        if (ordem === "empenhado") return b.valorEmpenhado - a.valorEmpenhado;
        if (ordem === "pago") return b.valorPagoFinanceiro - a.valorPagoFinanceiro;
        return a.iniciativa.localeCompare(b.iniciativa, "pt");
      });
  }, [iniciativas, busca, anexo, ordem]);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(COLUNAS_CSV_MARIANA, filtrados, `acordo-rio-doce-iniciativas-${hoje}.csv`);
  }

  return (
    <div className="mt-8">
      {/* Controles de filtro e busca */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="busca-iniciativa"
              className="block text-xs font-semibold text-text-soft"
            >
              Buscar iniciativas ou cláusulas
            </label>
            <input
              id="busca-iniciativa"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: rodovias, saneamento, saúde, CRAS..."
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div>
              <label
                htmlFor="filtro-ordem"
                className="block text-xs font-semibold text-text-soft"
              >
                Ordenar por
              </label>
              <select
                id="filtro-ordem"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="mt-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="prometido">Maior valor prometido</option>
                <option value="empenhado">Maior valor empenhado</option>
                <option value="pago">Maior valor pago</option>
                <option value="nome">Nome (A-Z)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={exportar}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
              >
                Baixar CSV ↓
              </button>
            </div>
          </div>
        </div>

        {/* Chips de Anexos */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <span className="mr-1 text-xs text-text-soft">Anexos:</span>
          <TagChip
            label="Todos os anexos"
            ativo={anexo === "todos"}
            onClick={() => setAnexo("todos")}
          />
          {anexosUnicos.map((a) => (
            <TagChip
              key={a}
              label={`Anexo ${a}`}
              ativo={anexo === a}
              onClick={() => setAnexo(a)}
            />
          ))}
        </div>
      </div>

      {/* Lista de Iniciativas */}
      <div className="mt-6">
        <p className="text-xs text-text-soft">
          Exibindo <strong>{formatNumberBR(filtrados.length)}</strong> de{" "}
          {formatNumberBR(iniciativas.length)} iniciativas pactuadas.
        </p>

        <div className="mt-3 space-y-3">
          {filtrados.map((item) => {
            const pctEmpenhado =
              item.valorPrometido > 0
                ? Math.min(100, Math.round((item.valorEmpenhado / item.valorPrometido) * 100))
                : 0;

            return (
              <article
                key={item.codigo}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-soft">
                    Iniciativa {item.codigo} · Anexo {item.anexo}
                  </span>
                  <span className="font-tabular text-xs font-semibold text-text-soft">
                    {formatNumberBR(item.empenhos)} empenhos registrados
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-text sm:text-base">
                  {item.iniciativa}
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-3 sm:grid-cols-3">
                  <div>
                    <span className="block text-[0.75rem] text-text-soft">Valor Prometido (Acordo)</span>
                    <span className="font-tabular text-sm font-bold text-text">
                      R$ {formatCurrencyCompactaBR(item.valorPrometido)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[0.75rem] text-text-soft">Valor Empenhado</span>
                    <span className="font-tabular text-sm font-bold text-primary">
                      R$ {formatCurrencyCompactaBR(item.valorEmpenhado)}
                    </span>
                    <span className="ml-1.5 text-xs text-text-soft">({pctEmpenhado}%)</span>
                  </div>

                  <div>
                    <span className="block text-[0.75rem] text-text-soft">Valor Pago Financeiro</span>
                    <span className="font-tabular text-sm font-bold text-accent">
                      R$ {formatCurrencyCompactaBR(item.valorPagoFinanceiro)}
                    </span>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${pctEmpenhado}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
