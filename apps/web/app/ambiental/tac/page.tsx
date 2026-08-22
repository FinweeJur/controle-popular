import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import Moeda from "@/app/components/Moeda";
import { COBERTURA_TAC_PROJETOS, TAC_POR_MINERADORA, TAC_POR_STATUS } from "@/lib/ambiental/tac-projetos";
import { COBERTURA_TAC_GTAC } from "@/lib/ambiental/tac-gtac";
import {
  COBERTURA_TAC_ACORDOS,
  STATUS_ORDEM,
  TAC_ANO_ACORDOS,
  TAC_STATUS_POR_ORGAO,
} from "@/lib/ambiental/tac-agregados";
import { metadataEditavel } from "@/lib/edicoes";
import PainelTac from "./PainelTac";

/**
 * `/ambiental/tac` — o dinheiro dos Termos de Ajustamento de Conduta
 * ambientais de Minas Gerais: quem prometeu quanto, para qual órgão, e o que
 * saiu do papel.
 *
 * ═══ ARQUITETURA: SÓ O AGREGADO NO SERVIDOR, O CONTRATO A CONTRATO É DE CLIENTE ═══
 *
 * Esta página (servidor) importa só `COBERTURA_*` e agregados pequenos —
 * nunca `TAC_POR_PROJETO` (106 contratos, 88 KiB) nem o array cru
 * `TAC_PROJETOS` (848 células ano-a-ano, 285 KiB). O contrato a contrato,
 * buscável e com CSV, é `<PainelTac />` — componente de CLIENTE (ver o
 * cabeçalho dele): o array vai para o chunk de cliente, cujo teto é 25 MiB,
 * nunca para o bundle do Worker, cujo teto é 3 MiB gzip. Mesma divisão de
 * `/ambiental/decisoes-lai` e `/ambiental/convenios`. Ver `docs/ARQUITETURA.md`.
 *
 * `tac-agregados.ts` cruza esta entidade (`projetos`, o plano de execução)
 * com a entidade `empresas` do mesmo painel — o valor TOTAL de cada termo,
 * maior e diferente do "previsto" abaixo. Ver o cabeçalho daquele arquivo
 * antes de mexer nos números desta página.
 *
 * ═══ A REGRA EDITORIAL DESTA PÁGINA ═══
 *
 * Nenhum percentual de execução aparece sem a janela ao lado. O plano vai até
 * 2029 e a fonte só reporta execução até 2025: dividir um pelo outro dá 40,8% e
 * sugere um atraso que o dado não sustenta. Os dois números aparecem, sempre
 * juntos, e os anos sem execução reportada dizem isso com todas as letras — não
 * "R$ 0,00", que seria afirmar que nada foi feito.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/tac", {
  title: "Projetos de TAC ambiental — Controle Popular · Ambiental",
  description: `Execução financeira dos ${formatNumberBR(COBERTURA_TAC_PROJETOS.projetos)} projetos custeados por mineradoras em Termos de Ajustamento de Conduta ambientais de Minas Gerais, entre ${COBERTURA_TAC_PROJETOS.anoInicial} e ${COBERTURA_TAC_PROJETOS.anoFinal}: quanto cada empresa prometeu, para qual órgão, e quanto de fato foi executado até ${COBERTURA_TAC_PROJETOS.ultimoAnoComExecucao}.`,
});

const C = COBERTURA_TAC_PROJETOS;
const G = COBERTURA_TAC_GTAC;
const A = COBERTURA_TAC_ACORDOS;

/** Cor de cada status na rampa ordinal — mesma paleta de `StackedPointsBar.tsx`. */
const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

/** Slot 1→4 na mesma ordem narrativa de `STATUS_ORDEM`. */
const SLOT_POR_STATUS: Record<(typeof STATUS_ORDEM)[number], number> = {
  "Não Iniciado": 1,
  "Em execução": 2,
  Concluído: 3,
  Cancelado: 4,
};

/** "R$ 12,3 milhões" com o valor cheio no `title` — ver `Moeda.tsx`. */
function Dinheiro({ valor }: { valor: number }) {
  return <Moeda value={valor} />;
}

export default function TacAmbientalPage() {
  const anosSemExecucao = TAC_ANO_ACORDOS.filter((a) => a.ano > C.ultimoAnoComExecucao);
  const previstoAindaPorVir = anosSemExecucao.reduce((t, a) => t + a.previsto, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Acordos
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          O dinheiro dos TACs ambientais de Minas
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Quando uma mineradora firma um <strong className="text-text">Termo de Ajustamento de
          Conduta</strong> ambiental, parte da reparação vira dinheiro para projetos tocados por
          órgãos do Estado. São{" "}
          <strong className="text-text">{formatNumberBR(C.projetos)} projetos</strong> e{" "}
          <strong className="text-text">{formatNumberBR(C.combinacoesProjetoMineradora)} contratos</strong>{" "}
          (o mesmo projeto pode ser dividido entre empresas), custeados por{" "}
          <strong className="text-text">{formatNumberBR(C.mineradoras)} mineradoras</strong> e
          executados por <strong className="text-text">{formatNumberBR(C.orgaos)} órgãos</strong>,
          com valores planejados de {C.anoInicial} a {C.anoFinal}.
        </p>
      </header>

      {/* ═══ O TAMANHO DO ACORDO ═══
          Número maior e DIFERENTE do "previsto" da seção seguinte — vem de
          outra consulta do mesmo painel (entidade `empresas`, não
          `projetos`). Ver `lib/ambiental/tac-agregados.ts`. */}
      <section aria-labelledby="tamanho-acordo" className="mt-10">
        <h2 id="tamanho-acordo" className="font-display text-xl font-bold tracking-tight text-text">
          O valor total dos termos assinados
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Este número vem de uma consulta diferente do mesmo painel da SEMAD — o valor TOTAL de
          cada termo, dividido entre Estado e Ministério Público, não o plano de execução por
          projeto da seção abaixo (por isso é maior). Os dois são publicados lado a lado pela fonte
          sem reconciliá-los, e esta página também não reconcilia: mostra os dois, cada um com sua
          origem.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4 sm:col-span-3">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Valor total dos termos ({formatNumberBR(A.mineradoras)} mineradoras)
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-text">
              <Dinheiro valor={A.valorTotalTermos} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Parcela do Estado
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={A.valorTotalEstado} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Parcela do Ministério Público
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={A.valorTotalMp} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Executado até {C.ultimoAnoComExecucao}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={A.executadoTotal} />
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            <strong className="text-text">Dado congelado, não ao vivo.</strong> A fonte declara
            este painel com atualização automática desligada
            (<code className="text-[.9em]">refreshEnabled: false</code>); a última carga é de{" "}
            <strong className="text-text">{formatDateBR(A.dadoCongeladoEm)}</strong> e os números
            desta página NÃO refletem a situação atual dos TACs.
          </p>
          <p className="mt-3">
            <strong className="text-text">Publicado de uma conta pessoal.</strong>{" "}
            {A.ressalvaWorkspace}
          </p>
        </div>
      </section>

      {/* ═══ O NÚMERO, COM A JANELA COLADA NELE ═══
          Publicar só "40,8% executado" seria dizer que o plano está atrasado
          usando anos que ainda não chegaram como se fossem dívida vencida. */}
      <section aria-labelledby="quanto" className="mt-10">
        <h2 id="quanto" className="font-display text-xl font-bold tracking-tight text-text">
          Quanto foi prometido, e quanto saiu do papel
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Previsto {C.anoInicial}–{C.anoFinal}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={C.previstoTotal} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Executado até {C.ultimoAnoComExecucao}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={C.executadoTotal} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Ainda por executar, de {C.ultimoAnoComExecucao + 1} em diante
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Dinheiro valor={previstoAindaPorVir} />
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            <strong className="text-text">Dois percentuais, e nenhum deles sozinho conta a
            história.</strong>{" "}
            Contra o plano inteiro, que vai até {C.anoFinal}, o executado é{" "}
            <strong className="text-text">
              {C.percentualDoPlanoInteiro.toString().replace(".", ",")}%
            </strong>
            . Mas a fonte só reporta execução até <strong className="text-text">{C.ultimoAnoComExecucao}</strong>, e
            comparar o que foi feito com anos que ainda não chegaram inventa um atraso. Na janela
            já decorrida, o executado é{" "}
            <strong className="text-text">
              {C.percentualDaJanelaDecorrida.toString().replace(".", ",")}%
            </strong>{" "}
            do previsto — essa é a comparação justa.
          </p>
          <p className="mt-3">
            Nos anos de {C.ultimoAnoComExecucao + 1} a {C.anoFinal}, a tabela abaixo mostra
            execução zerada. Isso quer dizer{" "}
            <strong className="text-text">&ldquo;ainda não reportado&rdquo;</strong>, não &ldquo;nada
            foi feito&rdquo;.
          </p>
          <p className="mt-3">
            <strong className="text-text">Este total inclui 3 projetos marcados &ldquo;Cancelado&rdquo;
            pela fonte</strong> — o painel oficial da SEMAD exclui esses projetos do número que
            publica. A diferença é{" "}
            <strong className="text-text">
              <Dinheiro valor={A.diferencaCancelados} />
            </strong>
            , idêntica em Previsto e em Transferido, e vem inteira de um único contrato: &ldquo;Projeto
            Marilac - Nacip Raydan&rdquo; (Mosaic Fertilizantes P&amp;K Ltda.). Os outros 2 contratos
            cancelados têm previsto e transferido zerados. Sem os cancelados, o previsto desta
            página seria <Dinheiro valor={A.previstoSemCancelados} /> — o número que a SEMAD mostra.
          </p>
        </div>
      </section>

      {/* ═══ A SÉRIE ANO A ANO ═══
          Gráfico de barras agrupadas (previsto/executado/transferido) +
          tabela — a tabela é a alternativa em texto exigida para o gráfico,
          não decoração ao lado dele. */}
      <section aria-labelledby="por-ano" className="mt-10">
        <h2 id="por-ano" className="font-display text-xl font-bold tracking-tight text-text">
          Ano a ano: previsto, executado e transferido
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          <strong className="text-text">Transferido</strong> é o valor que já mudou de mão da conta
          do TAC para o projeto — um passo intermediário entre prometer (previsto) e o dinheiro
          efetivamente virar obra ou serviço (executado). Os anos de {C.ultimoAnoComExecucao + 1} em
          diante têm previsto (é plano), mas nenhum executado ou transferido reportado — a barra
          fica em branco ali, não em zero.
        </p>

        {(() => {
          const maxValor = Math.max(
            ...TAC_ANO_ACORDOS.flatMap((a) => [a.previsto, a.executado, a.transferido]),
          );
          const SERIES = [
            { chave: "previsto" as const, rotulo: "Previsto", cor: "var(--color-primary)" },
            { chave: "executado" as const, rotulo: "Executado", cor: "var(--color-accent)" },
            { chave: "transferido" as const, rotulo: "Transferido", cor: "var(--cp-secondary)" },
          ];
          return (
            <figure className="mt-5">
              <div className="sr-only">
                Gráfico de barras verticais agrupadas, uma coluna por ano de {C.anoInicial} a{" "}
                {C.anoFinal}, com três barras cada (previsto, executado, transferido), altura
                proporcional ao valor em reais.{" "}
                {TAC_ANO_ACORDOS.map((a) => {
                  const reportado = a.ano <= C.ultimoAnoComExecucao;
                  return `${a.ano}: previsto ${formatCurrencyCompactaBR(a.previsto)}${
                    reportado
                      ? `, executado ${formatCurrencyCompactaBR(a.executado)}, transferido ${formatCurrencyCompactaBR(a.transferido)}`
                      : ", execução e transferência ainda não reportadas"
                  }.`;
                }).join(" ")}
              </div>

              <div aria-hidden className="overflow-x-auto pb-2">
                <div className="flex min-w-[560px] items-end gap-4 sm:min-w-0">
                  {TAC_ANO_ACORDOS.map((a) => {
                    const reportado = a.ano <= C.ultimoAnoComExecucao;
                    return (
                      <div key={a.ano} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-40 items-end gap-1">
                          {SERIES.map((s) => {
                            if (s.chave !== "previsto" && !reportado) {
                              return (
                                <div
                                  key={s.chave}
                                  className="h-1 w-3 rounded-t-[3px] border border-dashed border-border"
                                  title={`${a.ano} · ${s.rotulo}: ainda não reportado`}
                                />
                              );
                            }
                            const valor = a[s.chave];
                            const alturaPct = maxValor > 0 ? (valor / maxValor) * 100 : 0;
                            return (
                              <div
                                key={s.chave}
                                className="w-3 rounded-t-[3px]"
                                style={{ height: `${Math.max(alturaPct, valor > 0 ? 1.5 : 0)}%`, background: s.cor }}
                                title={`${a.ano} · ${s.rotulo}: ${formatCurrencyCompactaBR(valor)}`}
                              />
                            );
                          })}
                        </div>
                        <span className="font-tabular text-[.78em] font-medium text-text-soft">{a.ano}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
                {SERIES.map((s) => (
                  <span key={s.chave} className="flex items-center gap-1.5">
                    <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: s.cor }} />
                    {s.rotulo}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-3 w-3 rounded-[3px] border border-dashed border-border" />
                  Ainda não reportado (não é zero medido)
                </span>
              </figcaption>
            </figure>
          );
        })()}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[.92em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Alternativa em texto ao gráfico acima — os mesmos números, sem escala visual.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Ano</th>
                <th className="py-2 pr-4 text-right font-medium">Previsto</th>
                <th className="py-2 pr-4 text-right font-medium">Executado</th>
                <th className="py-2 pr-4 text-right font-medium">Transferido</th>
                <th className="py-2 font-medium">Situação do reporte</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {TAC_ANO_ACORDOS.map((a) => {
                const reportado = a.ano <= C.ultimoAnoComExecucao;
                return (
                  <tr key={a.ano} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-text">{a.ano}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      <Dinheiro valor={a.previsto} />
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {reportado ? <Dinheiro valor={a.executado} /> : <span aria-hidden>—</span>}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {reportado ? <Dinheiro valor={a.transferido} /> : <span aria-hidden>—</span>}
                    </td>
                    <td className="py-2">
                      {reportado
                        ? `${a.previsto > 0 ? Math.round((a.executado / a.previsto) * 100) : 0}% do previsto do ano`
                        : "ainda não reportado"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ QUEM PROMETEU ═══ */}
      <section aria-labelledby="por-mineradora" className="mt-10">
        <h2 id="por-mineradora" className="font-display text-xl font-bold tracking-tight text-text">
          Quem prometeu quanto
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Mineradora</th>
                <th className="py-2 pr-4 text-right font-medium">Previsto</th>
                <th className="py-2 text-right font-medium">Executado até {C.ultimoAnoComExecucao}</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {TAC_POR_MINERADORA.map((m) => (
                <tr key={m.mineradora} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-text">{m.mineradora}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Dinheiro valor={m.previsto} />
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    <Dinheiro valor={m.executado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[.88em] text-text-soft">
          Situação declarada pela fonte:{" "}
          {TAC_POR_STATUS.map((s, i) => (
            <span key={s.status}>
              {i > 0 ? " · " : ""}
              <strong className="text-text">{formatNumberBR(s.projetos)}</strong> {s.status.toLowerCase()}
            </span>
          ))}
          .
        </p>
      </section>

      {/* ═══ SITUAÇÃO POR ÓRGÃO EXECUTOR ═══
          Contrato (106), não projeto (81) — unidade diferente da frase
          acima, por isso o rótulo diz "contratos" em todo lugar aqui. Mesma
          rampa ordinal e mesmas classes CSS (`cp-ord-track`/`cp-ord-seg`) de
          `StackedPointsBar.tsx` e de `/ambiental/decisoes-lai` — reaproveitadas
          via classe global, sem importar componente de outra zona. */}
      <section aria-labelledby="por-orgao" className="mt-10">
        <h2 id="por-orgao" className="font-display text-xl font-bold tracking-tight text-text">
          Situação dos contratos, por órgão executor
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          {formatNumberBR(TAC_STATUS_POR_ORGAO.reduce((t, o) => t + o.total, 0))} contratos
          (projeto × mineradora), por órgão responsável pela execução e situação declarada pela
          fonte. Um mesmo projeto pode ter mais de um contrato — um por mineradora que o financia.
        </p>

        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, uma por órgão, comprimento proporcional ao total de
            contratos e segmentada por status.{" "}
            {TAC_STATUS_POR_ORGAO.map(
              (o) =>
                `${o.orgao}: ${o.total} contratos — ${STATUS_ORDEM.map((s) => `${o.porStatus[s]} ${s.toLowerCase()}`).join(", ")}.`,
            ).join(" ")}
          </div>

          <div aria-hidden className="space-y-2.5">
            {TAC_STATUS_POR_ORGAO.map((o) => {
              const max = TAC_STATUS_POR_ORGAO[0].total;
              return (
                <div key={o.orgao} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-right font-tabular text-[.85em] font-semibold text-text">
                    {o.orgao}
                  </span>
                  <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                    <div className="flex h-full" style={{ width: `${(o.total / max) * 100}%` }}>
                      {STATUS_ORDEM.map((s) => {
                        const valor = o.porStatus[s];
                        if (valor <= 0) return null;
                        const slot = SLOT_POR_STATUS[s];
                        return (
                          <div
                            key={s}
                            className={`cp-ord-seg cp-ord-seg-${slot} h-full first:rounded-l-[3px] last:rounded-r-[3px]`}
                            style={{ width: `${(valor / o.total) * 100}%`, background: COR_POR_SLOT[slot] }}
                            title={`${o.orgao} · ${s}: ${formatNumberBR(valor)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="w-8 shrink-0 font-tabular text-[.85em] text-text-soft">
                    {formatNumberBR(o.total)}
                  </span>
                </div>
              );
            })}
          </div>

          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
            {STATUS_ORDEM.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`cp-ord-seg cp-ord-seg-${SLOT_POR_STATUS[s]} inline-block h-3 w-3 rounded-sm`}
                  style={{ background: COR_POR_SLOT[SLOT_POR_STATUS[s]] }}
                />
                {s}
              </span>
            ))}
          </figcaption>
        </figure>

        {/* Alternativa em texto/tabela — a matriz órgão × status sem escala visual. */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[.88em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Alternativa em texto ao gráfico acima.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-3 font-medium">Órgão</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                {STATUS_ORDEM.map((s) => (
                  <th key={s} className="py-2 pr-3 text-right font-medium">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {TAC_STATUS_POR_ORGAO.map((o) => (
                <tr key={o.orgao} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium text-text">{o.orgao}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(o.total)}</td>
                  {STATUS_ORDEM.map((s) => (
                    <td key={s} className="py-2 pr-3 text-right tabular-nums">
                      {formatNumberBR(o.porStatus[s])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ CONTRATO A CONTRATO ═══
          `<PainelTac />` é componente de CLIENTE — busca, filtro por
          mineradora/órgão/status/execução e CSV. Ver o cabeçalho dele para o
          porquê da divisão servidor/cliente. */}
      <section aria-labelledby="contratos" className="mt-10">
        <h2 id="contratos" className="font-display text-xl font-bold tracking-tight text-text">
          Contrato a contrato
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Onde a fonte escreveu um relato da situação, ele está aqui transcrito sem edição — o
          texto é dela, não deste portal. &ldquo;Execução&rdquo; é quem toca o projeto: a própria
          mineradora ou o Estado, com o dinheiro que a mineradora depositou.
        </p>
        <div className="mt-4">
          <PainelTac />
        </div>
      </section>

      {/* ═══ O CADASTRO DE TACs (GTAC) ═══
          Fonte diferente da de cima: o painel mostra o DINHEIRO de projetos de
          alguns TACs; o GTAC é o cadastro de todos os termos assinados. Só
          agregados aqui — o array tem 2.002 registros. */}
      <section aria-labelledby="cadastro" className="mt-10">
        <h2 id="cadastro" className="font-display text-xl font-bold tracking-tight text-text">
          O cadastro de termos assinados
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Além do painel de dinheiro acima, o Estado mantém um cadastro dos TACs ambientais
          assinados: <strong className="text-text">{formatNumberBR(G.tacs)} termos</strong> entre{" "}
          {G.anoInicial} e {G.anoFinal}, em{" "}
          <strong className="text-text">{formatNumberBR(G.municipios)} municípios</strong>,
          distribuídos por {formatNumberBR(G.unidades)} unidades regionais.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Marcados como vigentes
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(G.vigentes)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Vigentes cuja data de vencimento já passou
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(G.vigentesComVencimentoPassado)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              de {formatNumberBR(G.vigentes)}, na coleta de {formatDateBR(G.coletadoEm)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Sem data de vencimento na base
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(G.semDataDeVencimento)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              de {formatNumberBR(G.tacs)} — ficam fora de qualquer conta de prazo
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            <strong className="text-text">A base se contradiz em {formatNumberBR(G.vigentesComVencimentoPassado)}{" "}
            casos.</strong>{" "}
            São termos que o próprio sistema marca como <em>vigentes</em> e, ao mesmo tempo,
            registra com data de vencimento anterior à data da coleta.{" "}
            <strong className="text-text">Isso não prova descumprimento</strong> — pode ser aditivo
            assinado e não lançado, ou situação não atualizada. Mas é a base discordando de si
            mesma, e quem fiscaliza precisa saber onde olhar.
          </p>
          <p className="mt-3">
            <strong className="text-text">Mais da metade não tem prazo declarado.</strong> Em{" "}
            {formatNumberBR(G.semDataDeVencimento)} dos {formatNumberBR(G.tacs)} termos a base não
            traz data de vencimento — sobre esses não dá para dizer nada a respeito de prazo, e
            qualquer percentual que os incluísse no denominador estaria mentindo.
          </p>
          <p className="mt-3">
            <strong className="text-text">Dado pessoal:</strong> a fonte publica o documento do
            signatário, e em {formatNumberBR(G.cpfRedigidos)} registros ele é o{" "}
            <strong className="text-text">CPF de uma pessoa física</strong>. Este portal não
            republica CPF: eles são removidos na coleta. Os {formatNumberBR(G.comCnpj)} CNPJ ficam,
            porque identificam a empresa que assinou.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="fonte-tac"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-tac" className="font-display text-base font-semibold text-text">
          De onde vem este dado
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            Painel público de acompanhamento dos TACs ambientais do Estado de Minas Gerais. Os
            valores, as situações e os relatos são <strong className="text-text">da fonte</strong>;
            este portal transcreve e organiza, não recalcula nem reclassifica.
          </li>
          <li>
            <strong className="text-text">O que este dado não diz:</strong> ele cobre o dinheiro
            previsto e executado, não a qualidade nem o resultado ambiental do que foi feito.
            Contrato executado não é dano reparado.
          </li>
          <li>
            Nos anos posteriores a {C.ultimoAnoComExecucao} a execução aparece zerada porque a fonte
            ainda não reportou o período — não porque tenha sido medida como zero.
          </li>
        </ul>
        <p className="mt-4 text-[.88em] text-text-soft">
          Ver também: <Link href="/licenciamento">licenciamento ambiental</Link> ·{" "}
          <Link href="/barragens">barragens</Link>
        </p>
      </section>
    </div>
  );
}
