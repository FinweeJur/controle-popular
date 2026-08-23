"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import type { ContratoRow, MotivoAlertaInfo } from "@/lib/betim/contratos";
// Lógica pura do indício vem do módulo SEM import de banco — puxar de
// `lib/betim/contratos` aqui colocaria a cadeia `lib/db/queries/*` no
// bundle do cliente (regra registrada no cabeçalho deste arquivo).
import {
  INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO,
  contarContratosPorFornecedorAno,
  fornecedorCriadoNoAnoDoContrato,
  fornecedorExcedeContratosNoAno,
  quantosContratosNoAno,
} from "@/lib/betim/contratos-indicios";
import Moeda from "@/app/components/Moeda";
import { formatDateBR } from "@/lib/betim/format";
import { contratoEstaAtivo } from "@/lib/betim/statusContrato";

/**
 * Tabela de `/[municipio]/prefeitura/contratos` — mesmo mecanismo de
 * `camara/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`), com os
 * NOVE filtros estruturais mais os dois da Sprint 2 e o de concentração:
 * busca, ano, status, "somente com alerta", motivo do alerta, tema, faixa
 * de valor, tipo de instrumento, indício "fornecedor criado no mesmo ano"
 * e indício "mais de N contratos do mesmo fornecedor no ano" (N=3 padrão,
 * configurável em `INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO`). É a página com
 * mais filtros do território, e a razão de existir é justamente o filtro
 * por alerta — `filtrar`/`controles` (commit `af12538`, coordenador) é o
 * que evita que ela virasse só busca-texto.
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
  const recemCriado = fornecedorCriadoNoAnoDoContrato(contrato);
  if (!contrato.alerta && !recemCriado) return <span className="text-text-soft">—</span>;
  return (
    <ul className="flex min-w-[280px] flex-col gap-2">
      {recemCriado && (
        <li>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
            · Fornecedor criado no mesmo ano
          </span>
          <p className="mt-1 max-w-[380px] text-sm leading-snug text-text-soft">
            Sinal de atenção — não é violação em si: o CNPJ do fornecedor foi
            registrado no mesmo ano deste contrato
            {contrato.fornecedor_abertura ? ` (${contrato.fornecedor_abertura.split("-").reverse().join("/")})` : ""}.
            Empresas novas podem contratar legalmente; o sinal só diz que não
            havia histórico prévio para conferir.
          </p>
        </li>
      )}
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
  // Sprint 2: tipo de instrumento (PNCP `contratos.tipo`) e os indícios
  // "fornecedor criado no mesmo ano do contrato" e "concentração no ano".
  const [tipo, setTipo] = useState("");
  const [somenteRecemCriado, setSomenteRecemCriado] = useState(false);
  const [somenteConcentrado, setSomenteConcentrado] = useState(false);
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
    setTipo(sp.get("tipo") ?? "");
    setSomenteRecemCriado(sp.get("recem") === "1");
    setSomenteConcentrado(sp.get("conc") === "1");
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
    tipo ? sp.set("tipo", tipo) : sp.delete("tipo");
    somenteRecemCriado ? sp.set("recem", "1") : sp.delete("recem");
    somenteConcentrado ? sp.set("conc", "1") : sp.delete("conc");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano, status, somenteAlerta, motivo, tema, valorMin, valorMax, tipo, somenteRecemCriado, somenteConcentrado]);

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
  // Sprint 2: a faixa de valor e os dois filtros novos agora vão no CSV —
  // o arquivo é o recorte da tela, então carrega os mesmos filtros dela.
  if (valorMin) exportQs.set("valor_min", valorMin);
  if (valorMax) exportQs.set("valor_max", valorMax);
  if (tipo) exportQs.set("tipo", tipo);
  if (somenteRecemCriado) exportQs.set("recem", "1");
  // O indício de concentração é calculado no navegador sobre as linhas
  // carregadas — a rota CSV não o reproduz (ver pendência no plano).
  if (somenteConcentrado) exportQs.set("conc", "1");
  const exportHref = `/${municipioSlug}/api/contratos?${exportQs.toString()}`;

  /**
   * Contagem de contratos por fornecedor+ano, sobre TODAS as linhas que a
   * tabela já carregou (não só a página visível nem o conjunto filtrado).
   *
   * O mapa mora num ref e é atualizado dentro do render de `TabelaEstatica`
   * (o slot `controles` roda antes do `<tbody>` na mesma passada, então as
   * células leem o mapa fresco). Estado React aqui forçaria re-render em
   * cascata a cada fatia baixada. Durante o carregamento a contagem é
   * PARCIAL — ela só cresce, então nunca gera falso positivo; pode gerar
   * falso negativo até a última fatia chegar, o que o texto do badge não
   * esconde ("X contratos" é o número real da fonte).
   */
  const contagensRef = useRef<Map<string, number>>(new Map());

  const filtrar = useCallback(
    (c: LinhaContrato) => {
      if (ano && c.ano !== Number(ano)) return false;
      // Comparação exata (`c.status !== status`) só reconhecia o vocabulário
      // minúsculo do PNCP ('ativo'/'encerrado'); em Belo Horizonte, cujo
      // status vem do GRP da Ábaco ('EM EXECUÇÃO', 'RESCINDIDO' etc.), o
      // filtro "Ativo" não devolvia nenhuma linha. Ver `statusContrato.ts`.
      if (status === "ativo" && !contratoEstaAtivo(c.status)) return false;
      if (status === "encerrado" && contratoEstaAtivo(c.status)) return false;
      if (alertaEfetivo && c.alerta !== true) return false;
      if (motivo && !(c.motivos_alerta ?? []).includes(motivo)) return false;
      if (tema && !(c.temas ?? []).includes(tema)) return false;
      if (tipo && c.tipo !== tipo) return false;
      if (somenteRecemCriado && !fornecedorCriadoNoAnoDoContrato(c)) return false;
      if (
        somenteConcentrado &&
        !fornecedorExcedeContratosNoAno(c, contagensRef.current, INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO)
      ) {
        return false;
      }
      // `valor_global` nulo não entra em nenhuma ponta — mesmo motivo do
      // SQL: contrato sem valor publicado não é "barato" nem "caro".
      if (valorMin && !(c.valor_global != null && c.valor_global >= Number(valorMin))) return false;
      if (valorMax && !(c.valor_global != null && c.valor_global <= Number(valorMax))) return false;
      return true;
    },
    [ano, status, alertaEfetivo, motivo, tema, valorMin, valorMax, tipo, somenteRecemCriado, somenteConcentrado]
  );

  const colunas: ColunaTabela<LinhaContrato>[] = [
    {
      chave: "alerta",
      rotulo: "Alerta",
      formatar: (c) => {
        const qtdNoAno = quantosContratosNoAno(c, contagensRef.current);
        const concentrado =
          fornecedorExcedeContratosNoAno(c, contagensRef.current, INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO);
        return (
          <div className="flex flex-col gap-2">
            {concentrado && (
              <div>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                  · Mais de {INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO} contratos no mesmo ano
                </span>
                <p className="mt-1 max-w-[380px] text-sm leading-snug text-text-soft">
                  Sinal de atenção — não é violação em si: este fornecedor
                  recebeu {qtdNoAno} contratos assinados em {c.ano ?? "?"}.
                  Somados, poderiam exigir licitação única — repartir pode ser
                  um jeito de evitar a disputa (entendimento do TCU sobre
                  fracionamento). Regra configurável, limiar{" "}
                  {INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO + 1}+ contratos.
                </p>
              </div>
            )}
            <ColunaAlerta contrato={c} motivoAlertaInfo={motivoAlertaInfo} />
          </div>
        );
      },
    },
    { chave: "fornecedor_nome", rotulo: "Fornecedor", formatar: (c) => c.fornecedor_nome ?? "—" },
    {
      chave: "objeto",
      rotulo: "Objeto",
      formatar: (c) => (
        <div className="flex flex-col gap-1">
          <ObjetoExpansivel texto={c.objeto} />
          {c.temas && c.temas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {c.temas.map((t) => (
                <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[.8em] font-medium text-primary">
                  {temaLabels[t] ?? t}
                </span>
              ))}
            </div>
          )}
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
    // Órgão contratante — Sprint 2 (colunas pedidas: contrato, fornecedor,
    // valor, objeto, órgão, data, link). Sem `formatar` o render padrão já
    // mostra "—" para nulo e a coluna fica ordenável por texto sem acento.
    { chave: "orgao_nome", rotulo: "Órgão" },
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
      vazio="Nenhum contrato encontrado no momento."
      filtrar={filtrar}
      controles={({ pronto, linhas }) => {
        // Atualiza o mapa de concentração ANTES do <tbody> renderizar na
        // mesma passada (o slot controles vem antes da tabela no JSX do
        // TabelaEstatica) — ver a nota junto à declaração do ref.
        contagensRef.current = contarContratosPorFornecedorAno(linhas);
        return (
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
          {/* Sprint 2: filtro por tipo de licitação/instrumento. As opções
              vêm do DADO que já carregou (ctx.linhas), não de lista fixa —
              filtro que devolve vazio sempre é pior que filtro nenhum. */}
          <div className="flex flex-col">
            <label htmlFor="f-tipo" className="mb-1 text-xs font-medium text-text-soft">
              Tipo
            </label>
            <select
              id="f-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-52 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos os tipos</option>
              {[...new Set(linhas.map((l) => l.tipo).filter((t): t is string => Boolean(t)))]
                .sort((a, b) => a.localeCompare(b, "pt-BR"))
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
            {!pronto && (
              <p className="mt-1 max-w-[208px] text-xs leading-snug text-text-soft">
                As opções aparecem quando as linhas terminarem de carregar.
              </p>
            )}
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
          <label className="flex items-center gap-2 pb-2 text-sm text-text" title="CNPJ do fornecedor registrado no mesmo ano do contrato — indício, não violação">
            <input
              type="checkbox"
              checked={somenteRecemCriado}
              onChange={(e) => setSomenteRecemCriado(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-alert"
            />
            Fornecedor criado no mesmo ano
          </label>
          <label
            className="flex items-center gap-2 pb-2 text-sm text-text"
            title={`Mesmo fornecedor com mais de ${INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO} contratos assinados no mesmo ano — indício de fracionamento, não violação`}
          >
            <input
              type="checkbox"
              checked={somenteConcentrado}
              onChange={(e) => setSomenteConcentrado(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-alert"
            />
            Concentração no ano
          </label>
          {(ano ||
            status ||
            somenteAlerta ||
            motivo ||
            tema ||
            valorMin ||
            valorMax ||
            tipo ||
            somenteRecemCriado ||
            somenteConcentrado) && (
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
                setTipo("");
                setSomenteRecemCriado(false);
                setSomenteConcentrado(false);
              }}
              className="text-sm text-text-soft hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        );
      }}
      />
    </div>
  );
}
