"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import type { ContratoRow, MotivoAlertaInfo } from "@/lib/betim/contratos";
import Moeda from "@/app/components/Moeda";
import { formatDateBR } from "@/lib/betim/format";
import { contratoEstaAtivo } from "@/lib/betim/statusContrato";

/**
 * Tabela de `/[municipio]/prefeitura/cultura` — mesmo mecanismo de
 * `prefeitura/contratos/ListaContratos.tsx`, com o conjunto de base já
 * vindo pré-filtrado pelo tema `cultura_esporte_lazer` (o índice estático
 * em `dados/[arquivo]/route.ts` só contém esses contratos, então esta
 * tabela não repete o filtro de tema). Os filtros aqui são um subconjunto
 * deliberado dos sete de `ListaContratos`: ano, status, faixa de valor e
 * "somente com alerta" — o suficiente pra achar o maior gasto ou o
 * contrato sinalizado, sem duplicar o filtro por motivo/tema que já vive
 * na página principal de contratos.
 */

type LinhaContrato = ContratoRow & Record<string, unknown>;

export interface ListaContratosCulturaProps {
  base: string;
  /** Slug da cidade, só para montar o link de exportação CSV (`/${slug}/api/cultura`) — mesmo padrão de `ListaContratos`. */
  municipioSlug: string;
  motivoAlertaInfo: Record<string, MotivoAlertaInfo>;
}

function ColunaAlerta({
  contrato,
  motivoAlertaInfo,
}: {
  contrato: LinhaContrato;
  motivoAlertaInfo: Record<string, MotivoAlertaInfo>;
}) {
  if (!contrato.alerta) return <span className="text-text-soft">—</span>;
  return (
    <ul className="flex min-w-[280px] flex-col gap-2">
      {(contrato.motivos_alerta ?? []).map((m) => {
        const info = motivoAlertaInfo[m];
        const ehViolacao = info?.categoria === "violacao_legal";
        return (
          <li key={m}>
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                ehViolacao ? "bg-alert/15 text-alert" : "bg-accent/15 text-accent"
              }`}
            >
              {ehViolacao ? "⚠ " : "· "}
              {info?.label ?? m}
            </span>
            {info && (
              <p className="mt-1 max-w-[380px] text-sm leading-snug text-text-soft">
                {ehViolacao ? "Base legal: " : "Sinal de atenção — não é violação em si: "}
                {info.fundamentacao}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ListaContratosCultura({ base, municipioSlug, motivoAlertaInfo }: ListaContratosCulturaProps) {
  const [ano, setAno] = useState("");
  const [status, setStatus] = useState("");
  const [somenteAlerta, setSomenteAlerta] = useState(false);
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setAno(sp.get("ano") ?? "");
    setStatus(sp.get("status") ?? "");
    setSomenteAlerta(sp.get("alerta") === "1");
    setValorMin(sp.get("valor_min") ?? "");
    setValorMax(sp.get("valor_max") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (ano) {
      sp.set("ano", ano);
    } else {
      sp.delete("ano");
    }
    if (status) {
      sp.set("status", status);
    } else {
      sp.delete("status");
    }
    if (somenteAlerta) {
      sp.set("alerta", "1");
    } else {
      sp.delete("alerta");
    }
    if (valorMin) {
      sp.set("valor_min", valorMin);
    } else {
      sp.delete("valor_min");
    }
    if (valorMax) {
      sp.set("valor_max", valorMax);
    } else {
      sp.delete("valor_max");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano, status, somenteAlerta, valorMin, valorMax]);

  /** Link do "Exportar CSV" — mesma rota `.din.ts` que só existe no alvo
   *  Cloudflare (ver `api/cultura/route.din.ts`). Não leva a busca por
   *  texto, mesma lacuna documentada de `ListaContratos`. */
  const exportQs = new URLSearchParams({ format: "csv" });
  if (ano) exportQs.set("ano", ano);
  if (valorMin) exportQs.set("valor_min", valorMin);
  if (valorMax) exportQs.set("valor_max", valorMax);
  const exportHref = `/${municipioSlug}/api/cultura?${exportQs.toString()}`;

  const filtrar = useCallback(
    (c: LinhaContrato) => {
      if (ano && c.ano !== Number(ano)) return false;
      if (status === "ativo" && !contratoEstaAtivo(c.status)) return false;
      if (status === "encerrado" && contratoEstaAtivo(c.status)) return false;
      if (somenteAlerta && c.alerta !== true) return false;
      if (valorMin && !(c.valor_global != null && c.valor_global >= Number(valorMin))) return false;
      if (valorMax && !(c.valor_global != null && c.valor_global <= Number(valorMax))) return false;
      return true;
    },
    [ano, status, somenteAlerta, valorMin, valorMax]
  );

  const colunas: ColunaTabela<LinhaContrato>[] = [
    {
      chave: "alerta",
      rotulo: "Alerta",
      formatar: (c) => <ColunaAlerta contrato={c} motivoAlertaInfo={motivoAlertaInfo} />,
    },
    { chave: "fornecedor_nome", rotulo: "Fornecedor", formatar: (c) => c.fornecedor_nome ?? "—" },
    {
      chave: "objeto",
      rotulo: "Objeto",
      formatar: (c) => (
        <div className="flex flex-col gap-1">
          <ObjetoExpansivel texto={c.objeto} />
          {typeof c.link_fonte === "string" && c.link_fonte && (
            <a
              href={c.link_fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-[.8em] font-medium text-primary underline underline-offset-2"
            >
              Conferir no PNCP
              {typeof c.numero_contrato === "string" && c.numero_contrato
                ? ` — contrato ${c.numero_contrato}`
                : ""}{" "}
              ↗
            </a>
          )}
        </div>
      ),
    },
    {
      chave: "valor_global",
      rotulo: "Valor global",
      numerica: true,
      formatar: (c) => (c.valor_global != null ? <Moeda value={Number(c.valor_global)} /> : "—"),
    },
    {
      chave: "status",
      rotulo: "Status",
      formatar: (c) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            contratoEstaAtivo(c.status) ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-soft"
          }`}
        >
          {c.status ?? "—"}
        </span>
      ),
    },
    {
      chave: "vigencia_inicio",
      rotulo: "Vigência",
      formatar: (c) => `${formatDateBR(c.vigencia_inicio)} – ${formatDateBR(c.vigencia_fim)}`,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href={exportHref}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          ↓ Exportar CSV
        </a>
      </div>
      <TabelaEstatica<LinhaContrato>
        base={base}
        colunas={colunas}
        camposBusca={["objeto", "fornecedor_nome"]}
        vazio="Nenhum contrato de cultura, esporte ou lazer encontrado no momento."
        filtrar={filtrar}
        controles={() => (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex flex-col">
              <label htmlFor="f-ano" className="mb-1 text-xs font-medium text-text-soft">
                Ano
              </label>
              <input
                id="f-ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="2025"
                className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="f-valormin" className="mb-1 text-xs font-medium text-text-soft">
                Valor de (R$)
              </label>
              <input
                id="f-valormin"
                value={valorMin}
                onChange={(e) => setValorMin(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="w-32 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="f-valormax" className="mb-1 text-xs font-medium text-text-soft">
                até (R$)
              </label>
              <input
                id="f-valormax"
                value={valorMax}
                onChange={(e) => setValorMax(e.target.value)}
                placeholder="sem teto"
                inputMode="decimal"
                className="w-32 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="f-status" className="mb-1 text-xs font-medium text-text-soft">
                Status
              </label>
              <select
                id="f-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-text">
              <input
                type="checkbox"
                checked={somenteAlerta}
                onChange={(e) => setSomenteAlerta(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-alert"
              />
              Somente com alerta
            </label>
            {(ano || status || somenteAlerta || valorMin || valorMax) && (
              <button
                type="button"
                onClick={() => {
                  setAno("");
                  setStatus("");
                  setSomenteAlerta(false);
                  setValorMin("");
                  setValorMax("");
                }}
                className="text-sm text-text-soft hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
