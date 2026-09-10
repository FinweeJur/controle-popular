import type { Metadata } from "next";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  ACERVO,
  COBERTURA,
  POR_TIPO,
  SERIE_GRAFICO,
  ITENS,
  listarAnos,
  listarFontes,
  listarTipos,
} from "@/lib/estudos-rurais/dados";
import { metadataEditavel } from "@/lib/edicoes";
import PainelEstudosRurais from "./PainelEstudosRurais";

/**
 * `/estudos-rurais` — o que se publica sobre o rural dos vales do
 * Jequitinhonha e Mucuri: notícias, artigos, eventos e publicações
 * (PPGER/UFVJM como fonte principal; ver `lib/estudos-rurais/dados.ts` e
 * `scripts/coletar-estudos-rurais.mts`).
 *
 * ═══ ARQUITETURA ═══
 *
 * Página de SERVIDOR com agregados (cartões, gráfico, lacunas) — a lista item
 * a item é `<PainelEstudosRurais />`, componente de CLIENTE que recebe os
 * itens como props. 60 itens da primeira rodada (08/09/2026) são pequenos
 * contra o limite de ~2 mil linhas do AGENTS.md; quando a coleta de
 * dissertações engatar e a coleção engordar, a migração é para índice
 * fatiado (`TabelaEstatica`), não para engordar esta props.
 *
 * ═══ REGRA EDITORIAL ═══
 *
 * O resumo é texto da PRÓPRIA FONTE, truncado na coleta — este portal não
 * reescreve, não resume com modelo e não interpreta. Lacuna é informação: os
 * tipos sem item (publicações, eventos) aparecem com 0 e com o motivo.
 */

export const metadata: Metadata = metadataEditavel("/estudos-rurais", {
  title: "Estudos Rurais — Controle Popular",
  description: `Agregação de estudos rurais dos vales do Jequitinhonha e Mucuri: ${formatNumberBR(
    COBERTURA.itens,
  )} itens coletados (PPGER/UFVJM e fontes abertas), com busca, filtro e download em CSV.`,
});

export default function EstudosRuraisPage() {
  const maxAno = Math.max(1, ...SERIE_GRAFICO.map((a) => a.total));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Estudos Rurais
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          O que se publica sobre o rural dos vales do Jequitinhonha e Mucuri
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Notícias, artigos, eventos e publicações de estudos rurais — com o{" "}
          <strong className="text-text">PPGER/UFVJM</strong> (Programa de Pós-Graduação em Estudos
          Rurais da Universidade Federal dos Vales do Jequitinhonha e Mucuri) como fonte principal,
          somado a fontes abertas da internet. O resumo de cada item é{" "}
          <strong className="text-text">texto da própria fonte</strong>, sem edição nem
          interpretação deste portal. Coleta de{" "}
          <strong className="text-text">{formatDateBR(COBERTURA.coletadoEm)}</strong>.
        </p>
      </header>

      {/* ═══ CARTÕES DE TOPO — os números são medidos do JSON, nunca digitados ═══ */}
      <section aria-labelledby="totais" className="mt-10">
        <h2 id="totais" className="font-display text-xl font-bold tracking-tight text-text">
          O acervo, em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4 sm:col-span-3">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Itens coletados ({formatNumberBR(COBERTURA.fontes)} fontes consultadas)
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-text">
              {formatNumberBR(COBERTURA.itens)}
            </p>
          </div>
          {POR_TIPO.map((t) => (
            <div key={t.tipo} className="rounded-xl border border-border bg-surface px-4 py-4">
              <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                {t.rotulo}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-text">
                {formatNumberBR(t.total)}
              </p>
              {t.total === 0 && (
                <p className="mt-1 text-[.86em] text-text-soft">
                  lacuna declarada — ver “o que ainda não existe aqui”
                </p>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Itens sem data na fonte
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(COBERTURA.semData)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              aparecem como “—” e ficam fora do gráfico por ano
            </p>
          </div>
        </div>
      </section>

      {/* ═══ GRÁFICO — barras CSS (sem biblioteca), com alternativa em texto ═══ */}
      <section aria-labelledby="por-ano" className="mt-10">
        <h2 id="por-ano" className="font-display text-xl font-bold tracking-tight text-text">
          Publicações por ano
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Distribuição dos itens datados por ano de publicação. Anos em que nada foi coletado não
          aparecem — ausência de coleta não é ausência de produção acadêmica.
        </p>

        {SERIE_GRAFICO.length === 0 ? (
          <p className="mt-5 rounded-lg border border-border p-5 opacity-80">
            Nenhum item datado ainda — o gráfico aparece quando a primeira rodada com datas for
            publicada.
          </p>
        ) : (
          <figure className="mt-5">
            <div className="sr-only">
              Gráfico de barras verticais, uma por ano, altura proporcional ao número de itens
              coletados.{" "}
              {SERIE_GRAFICO.map((a) => `${a.rotulo}: ${a.total} itens.`).join(" ")}
            </div>
            <div aria-hidden className="overflow-x-auto pb-2">
              <div className="flex min-w-[480px] items-end gap-3 sm:min-w-0">
                {SERIE_GRAFICO.map((a) => (
                  <div key={a.rotulo} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="font-tabular text-[11px] font-medium text-text-soft">
                      {a.total}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-[3px]"
                      style={{
                        height: `${Math.max((a.total / maxAno) * 100, 1.5)}%`,
                        background: "var(--color-primary)",
                        minHeight: "4px",
                      }}
                      title={`${a.rotulo}: ${a.total} itens`}
                    />
                    <span className="font-tabular text-[11px] font-medium text-text-soft">
                      {a.rotulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="mt-3 text-[.85em] text-text-soft">
              Cada barra é o total de itens coletados do ano — a coleta começou em 2026 e anos
              anteriores refletem o que as fontes ainda expõem, não a produção do período.
            </figcaption>
          </figure>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-[.92em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Alternativa em texto ao gráfico acima.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Ano</th>
                <th className="py-2 text-right font-medium">Itens</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {SERIE_GRAFICO.map((a) => (
                <tr key={a.rotulo} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-text">{a.rotulo}</td>
                  <td className="py-2 text-right tabular-nums">{formatNumberBR(a.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ ITEM A ITEM ═══ */}
      <section aria-labelledby="tabela" className="mt-10">
        <h2 id="tabela" className="font-display text-xl font-bold tracking-tight text-text">
          Item a item — buscar, filtrar e baixar
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O CSV baixa <strong className="text-text">o que está filtrado na tela</strong> (BOM UTF-8
          e separador <code className="text-[.9em]">;</code>, para o Excel brasileiro abrir
          correto).
        </p>
        <div className="mt-4">
          <PainelEstudosRurais
            itens={ITENS}
            fontes={listarFontes()}
            tipos={listarTipos()}
            anos={listarAnos()}
          />
        </div>
      </section>

      {/* ═══ LACUNAS — lacuna é informação ═══ */}
      <section aria-labelledby="lacunas" className="mt-10">
        <h2 id="lacunas" className="font-display text-xl font-bold tracking-tight text-text">
          O que ainda não existe aqui
        </h2>
        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            Publicar só o que veio preenchido faria a cobertura parecer completa. Não está. A
            coleta de {formatDateBR(COBERTURA.coletadoEm)} declarou{" "}
            <strong className="text-text">{formatNumberBR(COBERTURA.lacunas)} lacunas</strong>:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {ACERVO_LACUNAS.map((l) => (
              <li key={l.slice(0, 40)}>{l}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ FONTES ═══ */}
      <section
        aria-labelledby="fontes"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fontes" className="font-display text-base font-semibold text-text">
          De onde vem este dado
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          {ACERVO_FONTES.map((f) => (
            <li key={f.id}>
              <strong className="text-text">{f.titulo}</strong> —{" "}
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                link da fonte ↗
              </a>
              {f.itens > 0 && <> · {formatNumberBR(f.itens)} itens nesta rodada</>} ·{" "}
              {f.metodo}
              {f.observacao && (
                <span className="mt-1 block text-[.88em]">{f.observacao}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[.88em] text-text-soft">
          A coleta usa User-Agent que identifica o projeto, pausa de 1,5 s entre requisições e
          checkpoint para retomar — ver <code className="text-[.9em]">scripts/coletar-estudos-rurais.mts</code>.
        </p>
      </section>
    </div>
  );
}

const ACERVO_LACUNAS = ACERVO.lacunas;
const ACERVO_FONTES = ACERVO.fontes;
