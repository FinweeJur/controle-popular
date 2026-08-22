"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
// Link da zona: prefixa a cidade sozinho. `<a href>` cru com caminho
// literal aqui seria o 404 de 2026-07-21 de novo (ver lib/betim/basePath).
import Link from "@/lib/betim/link";
// Módulo PURO de propósito: componente cliente não pode importar
// `lib/betim/fornecedores`, que puxa a cadeia do banco (mesma regra dos
// demais componentes desta pasta).
import { fornecedorAbertoNoPeriodo, type FornecedorRow } from "@/lib/betim/fornecedores-puro";
import Moeda from "@/app/components/Moeda";

/**
 * Tabela de `/[municipio]/prefeitura/fornecedores` — mesmo mecanismo de
 * `prefeitura/contratos` (`TabelaEstatica` sobre índice estático fatiado,
 * ver o porquê em `dados/[arquivo]/route.ts`).
 *
 * O índice é o ACUMULADO da cidade (todos os anos coletados): cada linha já
 * vem agregada do banco, então não existe aqui filtro por ano que re-some
 * valores — um filtro assim mentiria o número da coluna "Valor total".
 * Quem quiser o recorte de um ano usa a tela de contratos, onde cada linha
 * é um contrato e o filtro é exato. Isso é decisão editorial, não limite
 * escondido: o cabeçalho da página declara o período coberto.
 */

type LinhaFornecedor = FornecedorRow & Record<string, unknown>;

export interface ListaFornecedoresProps {
  base: string;
  /** Slug da cidade, para montar o link de exportação CSV e o de
   *  detalhamento (cai na tela de contratos buscando pelo nome). */
  municipioSlug: string;
}

export default function ListaFornecedores({ base, municipioSlug }: ListaFornecedoresProps) {
  const [valorMin, setValorMin] = useState("");
  const [somenteAlerta, setSomenteAlerta] = useState(false);
  const [somenteAberturaRecente, setSomenteAberturaRecente] = useState(false);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setValorMin(sp.get("valor_min") ?? "");
    setSomenteAlerta(sp.get("alerta") === "1");
    setSomenteAberturaRecente(sp.get("recem") === "1");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    valorMin ? sp.set("valor_min", valorMin) : sp.delete("valor_min");
    somenteAlerta ? sp.set("alerta", "1") : sp.delete("alerta");
    somenteAberturaRecente ? sp.set("recem", "1") : sp.delete("recem");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [valorMin, somenteAlerta, somenteAberturaRecente]);

  /** Link do "Exportar CSV" — rota `.din.ts` `/${municipio}/api/fornecedores`
   *  (Cloudflare only, mesmo mecanismo do CSV de contratos). Reflete os
   *  filtros estruturados, não a caixa de busca textual — lacuna pequena e
   *  documentada, igual à tela de contratos. */
  const exportQs = new URLSearchParams();
  if (valorMin) exportQs.set("valor_total_min", valorMin);
  if (somenteAlerta) exportQs.set("alerta", "1");
  if (somenteAberturaRecente) exportQs.set("recem", "1");

  const filtrar = useCallback(
    (f: LinhaFornecedor) => {
      if (valorMin && !(f.valor_total != null && f.valor_total >= Number(valorMin))) return false;
      if (somenteAlerta && f.tem_alerta !== true) return false;
      if (somenteAberturaRecente && !fornecedorAbertoNoPeriodo(f)) return false;
      return true;
    },
    [valorMin, somenteAlerta, somenteAberturaRecente]
  );

  const colunas: ColunaTabela<LinhaFornecedor>[] = [
    {
      chave: "razao_social",
      rotulo: "Razão social",
      formatar: (f) => (
        <div className="flex flex-col gap-1">
          <span>{f.razao_social ?? "Fornecedor não identificado"}</span>
          {/* Detalhamento = a tela de contratos buscando pelo nome publicado
              na fonte. É o mesmo dado, linha a linha — nada de página nova
              com números recalculados que poderiam divergir. */}
          <Link
            href={`/prefeitura/contratos?q=${encodeURIComponent(f.razao_social ?? "")}`}
            className="w-fit text-[.8em] font-medium text-primary underline underline-offset-2"
          >
            Ver contratos deste fornecedor →
          </Link>
        </div>
      ),
    },
    {
      chave: "valor_total",
      rotulo: "Valor total contratado",
      numerica: true,
      formatar: (f) => <Moeda value={Number(f.valor_total)} />,
    },
    { chave: "num_contratos", rotulo: "Contratos", numerica: true },
    {
      chave: "num_orgaos",
      rotulo: "Órgãos",
      numerica: true,
      formatar: (f) => <span title="Quantos órgãos distintos contrataram este fornecedor">{f.num_orgaos}</span>,
    },
    {
      chave: "periodo",
      rotulo: "Período",
      formatar: (f) =>
        f.ano_primeiro ? (
          <span className="whitespace-nowrap">
            {f.ano_primeiro}
            {f.ano_ultimo && f.ano_ultimo !== f.ano_primeiro ? ` – ${f.ano_ultimo}` : ""}
          </span>
        ) : (
          "—"
        ),
    },
    {
      chave: "tem_alerta",
      rotulo: "Alertas",
      formatar: (f) =>
        f.tem_alerta ? (
          <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
            · Tem contratos com alerta
          </span>
        ) : (
          <span className="text-text-soft">—</span>
        ),
    },
    {
      chave: "data_abertura",
      rotulo: "Indício de abertura",
      tipoOrdenacao: "data",
      formatar: (f) =>
        fornecedorAbertoNoPeriodo(f) ? (
          <span className="inline-flex max-w-[260px] flex-col">
            <span className="w-fit rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
              · Aberta durante os próprios contratos
            </span>
            <span className="mt-1 text-sm leading-snug text-text-soft">
              CNPJ registrado em {f.data_abertura?.split("-")?.reverse()?.join("/")}. Sinal estatístico de investigação —
              empresas novas podem contratar legalmente; não é violação nem prova.
            </span>
          </span>
        ) : (
          <span className="text-text-soft">—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href={`/${municipioSlug}/api/fornecedores?${exportQs.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          ↓ Exportar CSV
        </a>
      </div>
      <TabelaEstatica<LinhaFornecedor>
      base={base}
      colunas={colunas}
      camposBusca={["razao_social", "chave"]}
      vazio="Nenhum fornecedor encontrado no momento."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col">
            <label htmlFor="ff-valormin" className="mb-1 text-xs font-medium text-text-soft">
              Valor total de (R$)
            </label>
            <input
              id="ff-valormin"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="w-36 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            />
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
          <label className="flex items-center gap-2 pb-2 text-sm text-text">
            <input
              type="checkbox"
              checked={somenteAberturaRecente}
              onChange={(e) => setSomenteAberturaRecente(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-alert"
            />
            Somente indício de abertura recente
          </label>
          {(valorMin || somenteAlerta || somenteAberturaRecente) && (
            <button
              type="button"
              onClick={() => {
                setValorMin("");
                setSomenteAlerta(false);
                setSomenteAberturaRecente(false);
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
