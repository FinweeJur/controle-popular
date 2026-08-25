"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConvenioAmbientalMg } from "@/lib/ambiental/convenios-mg";
import { formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";

/**
 * A lista saiu do bundle e virou asset estático (`public/data/
 * convenios-ambientais-mg.json`) buscado uma vez por sessão — mesmo padrão
 * de `AuditoriaClient.tsx` com os resumos da AJRI. Motivo: teto de 3 MiB
 * gzip do Worker Free (erro 10027, 2026-08-24). Antes de carregar, `null`.
 */
let conveniosCache: Promise<ConvenioAmbientalMg[]> | null = null;

function buscarConvenios(): Promise<ConvenioAmbientalMg[]> {
  if (!conveniosCache) {
    conveniosCache = fetch("/data/convenios-ambientais-mg.json").then(
      (r) => r.json() as Promise<ConvenioAmbientalMg[]>
    );
  }
  return conveniosCache;
}

function useConveniosAmbientaisMg(): ConvenioAmbientalMg[] | null {
  const [convenios, setConvenios] = useState<ConvenioAmbientalMg[] | null>(null);
  useEffect(() => {
    let vivo = true;
    buscarConvenios().then((d) => {
      if (vivo) setConvenios(d);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return convenios;
}

/**
 * A lista dos 870 convênios, filtrável.
 *
 * ═══ POR QUE ESTE COMPONENTE É DE CLIENTE ═══
 *
 * `CONVENIOS_AMBIENTAIS_MG` pesa ~930 KiB, e 59% disso é o campo `objetivo` —
 * o texto com que a própria fonte descreve para que serve cada convênio. Ele é
 * o que faz a lista valer a pena, então não dá para cortar; mas array desse
 * tamanho importado por página de SERVIDOR entraria no bundle do Worker, que
 * tem teto de 3 MiB gzip e hoje opera com pouca margem.
 *
 * Em componente de cliente o array vai para o chunk servido como asset
 * estático, cujo teto é 25 MiB por arquivo. A página de servidor ao lado só
 * importa as constantes de cobertura. É a mesma divisão de
 * `/paraopeba/auditoria`. Ver `docs/ARQUITETURA.md`.
 *
 * ═══ O GRÁFICO É DO FILTRADO, NÃO DO ACERVO INTEIRO ═══
 *
 * `page.tsx` já tem tabelas estáticas "por órgão" e "por ano" do acervo
 * completo. O gráfico daqui embaixo é outra coisa: reage a `filtrados`, então
 * mostra como o recorte ATUAL da busca se distribui pelos anos — útil
 * justamente para responder "o filtro que apliquei prorroga mais que a
 * média?". Duas séries por barra (prorrogado/não), diferenciadas por padrão
 * de textura, não só por cor — mesmo mecanismo de `HACHURA_SEM_TIPO` em
 * `/ambiental/decisoes-lai/page.tsx`. A tabela logo abaixo do gráfico é a
 * alternativa em texto, sempre visível (não só para leitor de tela).
 *
 * ═══ O CSV É DO FILTRADO, NUNCA DO ACERVO INTEIRO ═══
 *
 * Mesmo contrato de `TabelaDecisoes.tsx` (`/ambiental/decisoes-lai`) e
 * `PainelTac.tsx` (`/ambiental/tac`): separador `;`, número com vírgula
 * decimal (Excel pt-BR lendo `;`), BOM UTF-8 prefixado só no `Blob`, nunca no
 * conteúdo da função — decisão de transporte, não de conteúdo.
 */

const POR_PAGINA = 40;

type Ordem = "valor" | "prorrogacao" | "ano";

type ResumoAno = {
  ano: number;
  total: number;
  prorrogados: number;
  naoProrrogados: number;
};

function escaparCsv(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Vírgula decimal, sem separador de milhar — como o Excel pt-BR lê coluna
 *  numérica de CSV com `;`. */
function numeroCsv(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

const CABECALHO_CSV = [
  "Órgão",
  "Nome",
  "Convenente",
  "Município",
  "Ano",
  "Instrumento",
  "Valor total (R$)",
  "Valor concedente (R$)",
  "Valor contrapartida (R$)",
  "Prazo original",
  "Prazo atual",
  "Dias de prorrogação",
  "Objetivo",
];

function conveniosParaCsv(lista: readonly ConvenioAmbientalMg[]): string {
  const corpo = lista.map((c) =>
    [
      c.orgao,
      c.nome,
      c.convenente,
      c.municipio,
      c.ano,
      c.instrumento,
      numeroCsv(c.valorTotal),
      numeroCsv(c.valorConcedente),
      numeroCsv(c.valorContrapartida),
      c.prazoOriginal ?? "",
      c.prazoAtual ?? "",
      c.diasDeProrrogacao,
      c.objetivo,
    ]
      .map(escaparCsv)
      .join(";"),
  );
  return [CABECALHO_CSV.join(";"), ...corpo].join("\r\n");
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  // BOM UTF-8 na frente: sem ele o Excel brasileiro abre o CSV com acento
  // quebrado e tudo numa coluna só.
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Textura diagonal sobre `--color-ord-2`: o segmento "prorrogado" se
 *  distingue do "sem prorrogação" (ord-1, sólido) por padrão, não só por
 *  matiz — sobrevive a daltonismo, impressão P&B e forced-colors. */
const HACHURA_PRORROGADOS =
  "repeating-linear-gradient(45deg, var(--color-ord-2) 0 3px, var(--color-surface) 3px 4px)";

export default function ConveniosClient() {
  const convenios = useConveniosAmbientaisMg();
  const [busca, setBusca] = useState("");
  const [orgao, setOrgao] = useState("");
  const [soProrrogados, setSoProrrogados] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>("valor");
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const orgaos = useMemo(
    () => [...new Set((convenios ?? []).map((c) => c.orgao))].sort(),
    [convenios],
  );

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = (convenios ?? []).filter((c) => {
      if (orgao && c.orgao !== orgao) return false;
      if (soProrrogados && c.diasDeProrrogacao === 0) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome.toLowerCase()).includes(termo) ||
        semAcento(c.objetivo.toLowerCase()).includes(termo) ||
        semAcento(c.municipio.toLowerCase()).includes(termo) ||
        semAcento(c.convenente.toLowerCase()).includes(termo)
      );
    });
    const por: Record<Ordem, (a: (typeof lista)[number], b: (typeof lista)[number]) => number> = {
      valor: (a, b) => b.valorTotal - a.valorTotal,
      prorrogacao: (a, b) => b.diasDeProrrogacao - a.diasDeProrrogacao,
      ano: (a, b) => b.ano - a.ano,
    };
    return [...lista].sort(por[ordem]);
  }, [busca, orgao, soProrrogados, ordem, convenios]);

  const visiveis = filtrados.slice(0, mostrando);

  // Distribuição por ano do recorte ATUAL (não do acervo inteiro) — ver o
  // cabeçalho do arquivo. Só entram anos com pelo menos 1 convênio no
  // filtro, por isso o mapa nunca precisa de entrada zerada.
  const porAno = useMemo(() => {
    const mapa = new Map<number, ResumoAno>();
    for (const c of filtrados) {
      const atual = mapa.get(c.ano) ?? {
        ano: c.ano,
        total: 0,
        prorrogados: 0,
        naoProrrogados: 0,
      };
      atual.total += 1;
      if (c.diasDeProrrogacao > 0) atual.prorrogados += 1;
      else atual.naoProrrogados += 1;
      mapa.set(c.ano, atual);
    }
    return [...mapa.values()].sort((a, b) => b.ano - a.ano);
  }, [filtrados]);

  const maxAnoTotal = Math.max(1, ...porAno.map((a) => a.total));

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(conveniosParaCsv(filtrados), `convenios-ambientais-mg-filtrado-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[220px]">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por nome, objetivo, município ou convenente
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            placeholder="ex.: nascente, Diamantina, reflorestamento"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Órgão</span>
          <select
            value={orgao}
            onChange={(e) => {
              setOrgao(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="">Todos</option>
            {orgaos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ordenar por</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="valor">Maior valor</option>
            <option value="prorrogacao">Maior prorrogação</option>
            <option value="ano">Mais recente</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-[.92em] text-text-soft">
          <input
            type="checkbox"
            checked={soProrrogados}
            onChange={(e) => {
              setSoProrrogados(e.target.checked);
              setMostrando(POR_PAGINA);
            }}
          />
          Só os prorrogados
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtrados.length)}{" "}
          {filtrados.length === 1 ? "convênio" : "convênios"}
          {filtrados.length > 0 && (
            <>
              {" "}
              · {formatCurrencyCompactaBR(filtrados.reduce((t, c) => t + c.valorTotal, 0))} somados
            </>
          )}
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={filtrados.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtrados.length)})
        </button>
      </div>

      {porAno.length > 0 && (
        <section aria-labelledby="grafico-convenios-por-ano" className="mt-5">
          <h3
            id="grafico-convenios-por-ano"
            className="text-[.88em] font-semibold uppercase tracking-wide text-text-soft"
          >
            Como este filtro se distribui pelos anos
          </h3>

          <figure className="mt-3">
            <div className="sr-only">
              Gráfico de barras horizontais, um por ano, comprimento proporcional ao total de
              convênios do filtro atual naquele ano, dividido em prorrogados e não prorrogados.{" "}
              {porAno
                .map(
                  (a) =>
                    `${a.ano}: ${a.total} convênio${a.total === 1 ? "" : "s"}, sendo ${a.prorrogados} prorrogado${a.prorrogados === 1 ? "" : "s"} e ${a.naoProrrogados} não prorrogado${a.naoProrrogados === 1 ? "" : "s"}.`,
                )
                .join(" ")}
            </div>

            <div aria-hidden className="space-y-2">
              {porAno.map((a) => (
                <div key={a.ano} className="flex items-center gap-2.5">
                  <span className="w-11 shrink-0 text-right font-tabular text-[.8em] font-semibold text-text">
                    {a.ano}
                  </span>
                  <div className="cp-ord-track h-3.5 flex-1 overflow-hidden">
                    <div className="flex h-full" style={{ width: `${(a.total / maxAnoTotal) * 100}%` }}>
                      {a.naoProrrogados > 0 && (
                        <div
                          className="cp-ord-seg h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{
                            width: `${(a.naoProrrogados / a.total) * 100}%`,
                            background: "var(--color-ord-1)",
                          }}
                          title={`${a.ano} · sem prorrogação: ${formatNumberBR(a.naoProrrogados)}`}
                        />
                      )}
                      {a.prorrogados > 0 && (
                        <div
                          className="cp-ord-seg h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{
                            width: `${(a.prorrogados / a.total) * 100}%`,
                            background: HACHURA_PRORROGADOS,
                          }}
                          title={`${a.ano} · prorrogados: ${formatNumberBR(a.prorrogados)}`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="w-9 shrink-0 font-tabular text-[.8em] text-text-soft">
                    {formatNumberBR(a.total)}
                  </span>
                </div>
              ))}
            </div>

            <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[.8em] text-text-soft">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ background: "var(--color-ord-1)" }}
                />
                Sem prorrogação
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-sm border border-border"
                  style={{ background: HACHURA_PRORROGADOS }}
                />
                Prorrogados
              </span>
            </figcaption>
          </figure>

          {/* Alternativa em texto/tabela ao gráfico acima — sempre visível,
              não só para leitor de tela. */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-[.85em]">
              <caption className="mb-1.5 text-left text-[.8em] text-text-soft">
                Mesmos números do gráfico, em tabela.
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-text">
                  <th className="py-1.5 pr-3 font-medium">Ano</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Convênios</th>
                  <th className="py-1.5 text-right font-medium">Prorrogados</th>
                </tr>
              </thead>
              <tbody className="text-text-soft">
                {porAno.map((a) => (
                  <tr key={a.ano} className="border-b border-border/60">
                    <td className="py-1.5 pr-3 font-medium text-text">{a.ano}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatNumberBR(a.total)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatNumberBR(a.prorrogados)} (
                      {Math.round((a.prorrogados / a.total) * 100)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum convênio com esses filtros. Vazio aqui é resposta — não quer dizer que a busca
          falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visiveis.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface px-4 py-3">
              <p className="font-semibold text-text">{c.nome || "(sem nome na fonte)"}</p>
              <p className="mt-1 text-[.88em] text-text-soft">
                {[c.orgao, c.convenente, c.municipio, c.instrumento, c.ano]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-[.92em] text-text-soft">
                <strong className="font-medium text-text">
                  {formatCurrencyCompactaBR(c.valorTotal)}
                </strong>
                {c.prazoOriginal && c.prazoAtual && (
                  <>
                    {" · prazo original "}
                    {formatDateBR(c.prazoOriginal)}
                    {c.diasDeProrrogacao > 0 ? (
                      <>
                        {" → hoje "}
                        {formatDateBR(c.prazoAtual)}{" "}
                        <strong className="font-medium text-text">
                          (+{formatNumberBR(c.diasDeProrrogacao)} dias)
                        </strong>
                      </>
                    ) : (
                      ", sem prorrogação"
                    )}
                  </>
                )}
              </p>
              {c.objetivo && (
                <details className="mt-2 text-[.9em] text-text-soft">
                  <summary className="cursor-pointer">Objetivo, como a fonte escreveu</summary>
                  <p className="mt-1.5">{c.objetivo}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      {mostrando < filtrados.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtrados.length - mostrando))} de{" "}
          {formatNumberBR(filtrados.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
