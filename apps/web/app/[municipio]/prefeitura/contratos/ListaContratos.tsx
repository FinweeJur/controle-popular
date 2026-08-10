"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { ContratoRow, MotivoAlertaInfo } from "@/lib/betim/contratos";
import { formatCurrencyBRL, formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/prefeitura/contratos` — mesmo mecanismo de
 * `camara/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`), com
 * os SETE filtros originais: busca, ano, status, "somente com alerta",
 * motivo do alerta, tema, faixa de valor. É a página com mais filtros do
 * território, e a razão de existir é justamente o filtro por alerta —
 * `filtrar`/`controles` (commit `af12538`, coordenador) é o que evita que
 * ela virasse só busca-texto.
 *
 * `filtrar` replica exatamente `condicoesDeContratos` em
 * `lib/db/queries/betim.ts`: igualdade em ano/status, `alerta === true`,
 * array-contains em motivo/tema, `ilike` em objeto/fornecedor, faixa em
 * `valor_global` EXCLUINDO nulo dos dois lados (contrato sem valor
 * publicado não é "barato" nem "caro" — não entra em nenhuma ponta).
 *
 * `MOTIVO_ALERTA_INFO`/`TEMA_LABELS` chegam por prop: os módulos de origem
 * importam `lib/db/queries/betim`, e importar direto arrastaria código de
 * servidor pro bundle do cliente (mesmo motivo já registrado nas páginas
 * anteriores).
 */

type LinhaContrato = ContratoRow & Record<string, unknown>;

export interface ListaContratosProps {
  base: string;
  /** Slug da cidade, só para montar o link de exportação CSV (`/${slug}/api/contratos`). */
  municipioSlug: string;
  motivoAlertaInfo: Record<string, MotivoAlertaInfo>;
  temaLabels: Record<string, string>;
  temasOrdenados: string[];
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
            {m === "regra_5_fornecedor_sancionado_ceis" &&
              contrato.sancoesCeis &&
              contrato.sancoesCeis.length > 0 && (
                <ul className="mt-1.5 max-w-[380px] rounded-lg bg-surface-2 p-2.5 text-sm leading-snug">
                  {contrato.sancoesCeis.map((s, i) => (
                    <li key={i} className="mb-1.5 last:mb-0">
                      <strong className="text-text">{s.tipo ?? "Sanção"}</strong>
                      {s.orgao_sancionador && <> — aplicada por {s.orgao_sancionador}</>}
                      {s.abrangencia && <p className="text-text-soft">Abrangência: {s.abrangencia}</p>}
                      {s.data_fim && <p className="text-text-soft">Vigente até {s.data_fim}</p>}
                    </li>
                  ))}
                </ul>
              )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ListaContratos({
  base,
  municipioSlug,
  motivoAlertaInfo,
  temaLabels,
  temasOrdenados,
}: ListaContratosProps) {
  const [ano, setAno] = useState("");
  const [status, setStatus] = useState("");
  const [somenteAlerta, setSomenteAlerta] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [tema, setTema] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setAno(sp.get("ano") ?? "");
    setStatus(sp.get("status") ?? "");
    setSomenteAlerta(sp.get("alerta") === "1");
    setMotivo(sp.get("motivo") ?? "");
    setTema(sp.get("tema") ?? "");
    setValorMin(sp.get("valor_min") ?? "");
    setValorMax(sp.get("valor_max") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    ano ? sp.set("ano", ano) : sp.delete("ano");
    status ? sp.set("status", status) : sp.delete("status");
    somenteAlerta ? sp.set("alerta", "1") : sp.delete("alerta");
    motivo ? sp.set("motivo", motivo) : sp.delete("motivo");
    tema ? sp.set("tema", tema) : sp.delete("tema");
    valorMin ? sp.set("valor_min", valorMin) : sp.delete("valor_min");
    valorMax ? sp.set("valor_max", valorMax) : sp.delete("valor_max");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano, status, somenteAlerta, motivo, tema, valorMin, valorMax]);

  // Um motivo específico já implica alerta=true, mesma regra de
  // `condicoesDeContratos` — `motivos_alerta` só tem item quando o alerta
  // disparou.
  const alertaEfetivo = somenteAlerta || Boolean(motivo);

  /**
   * Link do "Exportar CSV" — monta a query da rota `.din.ts`
   * `/${municipio}/api/contratos`, que só existe no alvo Cloudflare (ver
   * `docs/deploy-github-pages.md` §1, ela já está na lista de rotas que não
   * saem no export estático — isso não é coisa nova desta conversão).
   *
   * NÃO leva a busca por texto (`q`): essa é estado interno de
   * `TabelaEstatica`, não exposto para este componente. O CSV exportado
   * reflete os filtros estruturados (ano/status/alerta/motivo/tema), não a
   * caixa de busca — uma lacuna pequena e documentada, não um comportamento
   * escondido.
   */
  const exportQs = new URLSearchParams({ format: "csv" });
  if (ano) exportQs.set("ano", ano);
  if (status) exportQs.set("status", status);
  if (alertaEfetivo) exportQs.set("alerta", "1");
  if (motivo) exportQs.set("motivo", motivo);
  if (tema) exportQs.set("tema", tema);
  const exportHref = `/${municipioSlug}/api/contratos?${exportQs.toString()}`;

  const filtrar = useCallback(
    (c: LinhaContrato) => {
      if (ano && c.ano !== Number(ano)) return false;
      if (status && c.status !== status) return false;
      if (alertaEfetivo && c.alerta !== true) return false;
      if (motivo && !(c.motivos_alerta ?? []).includes(motivo)) return false;
      if (tema && !(c.temas ?? []).includes(tema)) return false;
      // `valor_global` nulo não entra em nenhuma ponta — mesmo motivo do
      // SQL: contrato sem valor publicado não é "barato" nem "caro".
      if (valorMin && !(c.valor_global != null && c.valor_global >= Number(valorMin))) return false;
      if (valorMax && !(c.valor_global != null && c.valor_global <= Number(valorMax))) return false;
      return true;
    },
    [ano, status, alertaEfetivo, motivo, tema, valorMin, valorMax]
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
          <span className="line-clamp-3 text-text-soft">{c.objeto ?? "—"}</span>
          {c.temas && c.temas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {c.temas.map((t) => (
                <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[.8em] font-medium text-primary">
                  {temaLabels[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      chave: "valor_global",
      rotulo: "Valor global",
      numerica: true,
      formatar: (c) => (c.valor_global != null ? formatCurrencyBRL(Number(c.valor_global)) : "—"),
    },
    {
      chave: "status",
      rotulo: "Status",
      formatar: (c) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "ativo" ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-soft"
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
      vazio="Nenhum contrato encontrado no momento."
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
          <div className="flex flex-col">
            <label htmlFor="f-motivo" className="mb-1 text-xs font-medium text-text-soft">
              Tipo de alerta
            </label>
            <select
              id="f-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-64 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Qualquer alerta</option>
              {Object.entries(motivoAlertaInfo).map(([codigo, info]) => (
                <option key={codigo} value={codigo}>
                  {info.categoria === "violacao_legal" ? "⚠ " : "· "}
                  {info.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="f-tema" className="mb-1 text-xs font-medium text-text-soft">
              Área/tema
            </label>
            <select
              id="f-tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos os temas</option>
              {temasOrdenados.map((slug) => (
                <option key={slug} value={slug}>
                  {temaLabels[slug] ?? slug}
                </option>
              ))}
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
          {(ano || status || somenteAlerta || motivo || tema || valorMin || valorMax) && (
            <button
              type="button"
              onClick={() => {
                setAno("");
                setStatus("");
                setSomenteAlerta(false);
                setMotivo("");
                setTema("");
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
