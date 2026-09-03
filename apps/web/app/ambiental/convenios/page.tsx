import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import {
  COBERTURA_CONVENIOS_AMBIENTAIS,
  CONVENIOS_AMBIENTAIS_POR_ANO,
  CONVENIOS_AMBIENTAIS_POR_ORGAO,
} from "@/lib/ambiental/convenios-mg";
import { COBERTURA_CONVENIOS_FEDERAIS_MG } from "@/lib/ambiental/convenios-federais-mg";
import { metadataEditavel } from "@/lib/edicoes";
import FiltroConvenios from "./FiltroConvenios";

/**
 * `/ambiental/convenios` — os convênios de saída dos quatro órgãos ambientais
 * de Minas Gerais, e quanto tempo a mais cada um levou.
 *
 * ═══ O QUE ESTA PÁGINA IMPORTA, E O QUE NÃO ═══
 *
 * Só as constantes de cobertura e os dois agregados (por órgão, por ano), que
 * somam poucos KiB. O array de 870 convênios (~930 KiB, 59% deles no campo
 * `objetivo`) fica em `FiltroConvenios.tsx`, que é componente de cliente — ver
 * o cabeçalho de lá. Trocar isso derruba o deploy pelo teto do Worker.
 *
 * ═══ POR QUE O NÚMERO ESTADUAL APARECE AO LADO ═══
 *
 * "47,7% dos convênios ambientais foram prorrogados" não diz nada sozinho: pode
 * ser péssimo ou normal. Ao lado dos 27,6% do Estado inteiro — mesma base,
 * mesmo cálculo, 90 mil convênios de 55 órgãos — passa a dizer que o ambiental
 * prorroga quase duas vezes mais que a média. O comparativo é medido, não
 * estimado, e vem do mesmo coletor.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/convenios", {
  title: "Convênios ambientais de Minas Gerais — Controle Popular · Ambiental",
  description: `Os ${formatNumberBR(COBERTURA_CONVENIOS_AMBIENTAIS.convenios)} convênios de saída da Semad, da Feam, do IEF e do Igam entre ${COBERTURA_CONVENIOS_AMBIENTAIS.anoInicial} e ${COBERTURA_CONVENIOS_AMBIENTAIS.anoFinal}, com valor, objetivo e quanto tempo a mais cada um levou — ${COBERTURA_CONVENIOS_AMBIENTAIS.percentualProrrogados}% foram prorrogados, contra ${COBERTURA_CONVENIOS_AMBIENTAIS.percentualProrrogadosNoEstado}% no Estado inteiro.`,
});

const C = COBERTURA_CONVENIOS_AMBIENTAIS;
const F = COBERTURA_CONVENIOS_FEDERAIS_MG;

export default function ConveniosAmbientaisPage() {
  const anosVisiveis = [...CONVENIOS_AMBIENTAIS_POR_ANO]
    .filter((a) => a.convenios > 0)
    .sort((a, b) => b.ano - a.ano)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Convênios
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Os convênios ambientais do Estado, e o tempo a mais que levaram
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          A Secretaria de Meio Ambiente, a Feam, o IEF e o Igam repassaram{" "}
          <strong className="text-text">
            <Moeda value={C.valorTotal} />
          </strong>{" "}
          em <strong className="text-text">{formatNumberBR(C.convenios)} convênios</strong> entre{" "}
          {C.anoInicial} e {C.anoFinal}, em{" "}
          <strong className="text-text">{formatNumberBR(C.municipios)} municípios</strong>.
        </p>
      </header>

      {/* ═══ O ACHADO, COM A RÉGUA COLADA ═══ */}
      <section aria-labelledby="prorrogacao" className="mt-10">
        <h2 id="prorrogacao" className="font-display text-xl font-bold tracking-tight text-text">
          Quase metade foi prorrogada — quase o dobro da média do Estado
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Convênios ambientais prorrogados
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {C.percentualProrrogados.toString().replace(".", ",")}%
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              {formatNumberBR(C.prorrogados)} de {formatNumberBR(C.convenios)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              No Estado inteiro, para comparar
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {C.percentualProrrogadosNoEstado.toString().replace(".", ",")}%
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              dos {formatNumberBR(C.conveniosNoEstado)} convênios dos 55 órgãos
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Prorrogação típica
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.medianaDiasDeProrrogacao)} dias
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              mediana; a maior chegou a {formatNumberBR(C.maximoDiasDeProrrogacao)} dias
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            <strong className="text-text">Como este número é calculado.</strong> A base guarda a
            data-limite originalmente pactuada e a data-limite que vale hoje; a diferença entre as
            duas é a prorrogação. A mediana considera{" "}
            <strong className="text-text">só os convênios que foram prorrogados</strong> — incluir
            os que não foram puxaria o valor para zero e faria prorrogação parecer exceção rara.
          </p>
          <p className="mt-3">
            <strong className="text-text">O que ele não diz:</strong> prorrogação não é, por si,
            irregularidade — obra atrasa por chuva, por licença, por repasse que não saiu. O que o
            número mostra é que no meio ambiente isso acontece com frequência bem maior que na
            média do Estado, e essa diferença é que merece explicação.
          </p>
        </div>
      </section>

      {/* ═══ A COMPARAÇÃO FEDERAL ═══
          Escopo diferente, e o rótulo diz isso em toda menção: os convênios
          federais aqui são de TODOS os setores (saúde, cidades, esporte), não
          só ambiental. Servem para duas coisas: dar uma segunda régua de
          prorrogação, e mostrar que a base federal publica o que a estadual
          não publica. Só agregados — o detalhe são 29 mil registros. */}
      <section aria-labelledby="federal" className="mt-10">
        <h2 id="federal" className="font-display text-xl font-bold tracking-tight text-text">
          O que a base federal mostra e a estadual não
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          O Transferegov publica os convênios da União com proponentes de Minas — e publica,
          para cada um, <strong className="text-text">o prazo e o valor originais ao lado dos
          atuais</strong>, mais um contador de prorrogações. É exatamente o tipo de campo que
          permite dizer se o combinado mudou. São{" "}
          <strong className="text-text">{formatNumberBR(F.convenios)} convênios</strong> de{" "}
          {F.anoInicial} a {F.anoFinal},{" "}
          <strong className="text-text">de todos os setores</strong> — saúde, cidades, agricultura,
          esporte —, não só ambiental. Por isso servem de régua, não de comparação direta.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Valor global (federal, MG)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              <Moeda value={F.valorGlobal} />
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              {F.percentualDesembolsado.toString().replace(".", ",")}% desembolsado
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Com pelo menos uma prorrogação
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {F.percentualComProrrogacao.toString().replace(".", ",")}%
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              contra {C.percentualProrrogados.toString().replace(".", ",")}% nos convênios
              ambientais estaduais
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Crescimento do valor pactuado
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              +{F.crescimentoDeValor.toString().replace(".", ",")}%
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              só nos {formatNumberBR(F.conveniosComValorOriginal)} que declaram o valor original (
              {F.percentualComValorOriginal.toString().replace(".", ",")}%)
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <strong className="text-text">Por que o terceiro número tem um denominador
          próprio.</strong>{" "}
          A base só preenche o valor original em{" "}
          {F.percentualComValorOriginal.toString().replace(".", ",")}% dos convênios. Somar o valor
          atual de todos contra o original de alguns daria um crescimento de 3,3 vezes — número
          impressionante e falso. Comparando apenas quem declara os dois, o valor pactuado cresceu{" "}
          <strong className="text-text">
            +{F.crescimentoDeValor.toString().replace(".", ",")}%
          </strong>
          . Outros {formatNumberBR(F.conveniosSemAno)} convênios não trazem ano válido e ficam fora
          de qualquer série temporal.
        </p>
      </section>

      <section aria-labelledby="por-orgao" className="mt-10">
        <h2 id="por-orgao" className="font-display text-xl font-bold tracking-tight text-text">
          Por órgão
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Órgão</th>
                <th className="py-2 pr-4 text-right font-medium">Convênios</th>
                <th className="py-2 pr-4 text-right font-medium">Valor</th>
                <th className="py-2 text-right font-medium">Prorrogados</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {CONVENIOS_AMBIENTAIS_POR_ORGAO.map((o) => (
                <tr key={o.orgao} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-text">{o.orgao}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatNumberBR(o.convenios)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Moeda value={o.valorTotal} />
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatNumberBR(o.prorrogados)} (
                    {Math.round((o.prorrogados / o.convenios) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="por-ano" className="mt-10">
        <h2 id="por-ano" className="font-display text-xl font-bold tracking-tight text-text">
          Últimos anos
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Ano</th>
                <th className="py-2 pr-4 text-right font-medium">Convênios</th>
                <th className="py-2 pr-4 text-right font-medium">Valor</th>
                <th className="py-2 text-right font-medium">Prorrogados</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {anosVisiveis.map((a) => (
                <tr key={a.ano} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-text">{a.ano}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatNumberBR(a.convenios)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Moeda value={a.valorTotal} />
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatNumberBR(a.prorrogados)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="lista" className="mt-10">
        <h2 id="lista" className="font-display text-xl font-bold tracking-tight text-text">
          Convênio a convênio
        </h2>
        <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">
          O objetivo de cada convênio é texto da fonte, transcrito sem edição. As tags e o resumo
          de execução são inferidos do nome e objetivo; quando a fonte publicar dados de execução,
          eles aparecerão aqui.
        </p>
        <div className="mt-4">
          <FiltroConvenios />
        </div>
      </section>

      <section
        aria-labelledby="fonte-conv"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-conv" className="font-display text-base font-semibold text-text">
          De onde vem este dado, e o que falta nele
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            Portal de dados abertos do Estado de Minas Gerais (
            <a
              href="https://dados.mg.gov.br/dataset/convenios-saida"
              className="underline hover:text-primary"
              rel="noreferrer"
              target="_blank"
            >
              conjunto &ldquo;Convênios de saída de recursos&rdquo; ↗
            </a>
            ), publicado pela Controladoria-Geral do Estado com atualização diária. O recorte são
            os quatro órgãos ambientais; o conjunto completo tem 55 órgãos.
          </li>
          <li>
            <strong className="text-text">Falta o principal para julgar cumprimento:</strong> o
            conjunto publica um arquivo de metas e etapas por convênio, mas ele vem{" "}
            <strong className="text-text">vazio</strong> — só o cabeçalho, sem uma linha de dado
            (conferido duas vezes em 21/08/2026). Sem ele dá para dizer quanto custou e quanto
            tempo levou, <strong className="text-text">não</strong> se o convênio entregou o que
            prometeu.
          </li>
          <li>
            Valores são os atualizados na base, sem correção monetária deste portal. Convênio
            assinado em 2007 e outro em 2026 aparecem em reais de épocas diferentes — somar os dois
            dá uma ordem de grandeza, não um valor comparável.
          </li>
        </ul>
        <p className="mt-4 text-[.88em] text-text-soft">
          Ver também: <Link href="/tac">projetos de TAC</Link> ·{" "}
          <Link href="/licenciamento">licenciamento</Link>
        </p>
      </section>
    </div>
  );
}
