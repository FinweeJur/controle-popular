import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import Moeda from "@/app/components/Moeda";
import {
  COBERTURA_TAC_PROJETOS,
  TAC_POR_ANO,
  TAC_POR_MINERADORA,
  TAC_POR_PROJETO,
  TAC_POR_STATUS,
} from "@/lib/ambiental/tac-projetos";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/ambiental/tac` — o dinheiro dos Termos de Ajustamento de Conduta
 * ambientais de Minas Gerais: quem prometeu quanto, para qual órgão, e o que
 * saiu do papel.
 *
 * ═══ POR QUE A TABELA É RENDERIZADA NO SERVIDOR ═══
 *
 * Mesmo desenho de `/paraopeba/execucao`: a tabela É o conteúdo, então ela sai
 * pronta no HTML e a página não carrega JavaScript nenhum — funciona sem
 * hidratação, em leitor de tela e com JS desligado.
 *
 * O custo disso é `TAC_POR_PROJETO` (88 KiB) entrar no bundle do Worker, que
 * tem teto de 3 MiB gzip. Coube porque o agregado por CONTRATO tem 106 linhas;
 * o array cru `TAC_PROJETOS` (848 células ano-a-ano, 285 KiB) **não é importado
 * aqui de propósito** — ele existe para quem for montar série temporal, e
 * entraria no teto sem necessidade. Ver a regra em `docs/ARQUITETURA.md`.
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

/** "R$ 12,3 milhões" com o valor cheio no `title` — ver `Moeda.tsx`. */
function Dinheiro({ valor }: { valor: number }) {
  return <Moeda value={valor} />;
}

export default function TacAmbientalPage() {
  const anosSemExecucao = TAC_POR_ANO.filter((a) => a.ano > C.ultimoAnoComExecucao);
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
        </div>
      </section>

      {/* ═══ A SÉRIE ANO A ANO ═══ */}
      <section aria-labelledby="por-ano" className="mt-10">
        <h2 id="por-ano" className="font-display text-xl font-bold tracking-tight text-text">
          Ano a ano
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-4 font-medium">Ano</th>
                <th className="py-2 pr-4 text-right font-medium">Previsto</th>
                <th className="py-2 pr-4 text-right font-medium">Executado</th>
                <th className="py-2 font-medium">Situação do reporte</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {TAC_POR_ANO.map((a) => {
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

      {/* ═══ CONTRATO A CONTRATO ═══ */}
      <section aria-labelledby="contratos" className="mt-10">
        <h2 id="contratos" className="font-display text-xl font-bold tracking-tight text-text">
          Contrato a contrato
        </h2>
        <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">
          {formatNumberBR(TAC_POR_PROJETO.length)} contratos, do maior previsto para o menor. Onde a
          fonte escreveu um relato da situação, ele está aqui transcrito sem edição — o texto é
          dela, não deste portal.
        </p>
        <div className="mt-4 space-y-3">
          {TAC_POR_PROJETO.map((p) => (
            <details
              key={`${p.projeto}|${p.mineradora}`}
              className="group rounded-xl border border-border bg-surface px-4 py-3"
            >
              <summary className="cursor-pointer list-none">
                <span className="font-semibold text-text">{p.projeto}</span>
                <span className="mt-1 block text-[.88em] text-text-soft">
                  {p.mineradora} · {p.orgao} · {p.status}
                  {p.anoInicial !== null && p.anoFinal !== null
                    ? ` · ${p.anoInicial}–${p.anoFinal}`
                    : ""}{" "}
                  · previsto {formatCurrencyCompactaBR(p.previsto)}
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
                <p>
                  <strong className="font-medium text-text">Previsto.</strong>{" "}
                  <Dinheiro valor={p.previsto} />{" "}
                  <strong className="font-medium text-text">· Executado até {C.ultimoAnoComExecucao}.</strong>{" "}
                  <Dinheiro valor={p.executado} />
                </p>
                {p.relato ? (
                  <div>
                    <p className="font-medium text-text">Relato da fonte</p>
                    <p className="mt-1.5">{p.relato}</p>
                  </div>
                ) : (
                  <p className="italic">A fonte não publicou relato para este contrato.</p>
                )}
              </div>
            </details>
          ))}
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
