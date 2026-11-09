import NextLink from "next/link";
import { Marca } from "./Componentes";

/**
 * "O que aconteceu": o mínimo factual para o leitor entender o resto da
 * página, sem repetir a cronologia inteira — essa fica na linha do tempo.
 * Os números vêm da análise do litoral e das fontes que ela cita.
 */
export function SecaoOQueAconteceu() {
  return (
    <section
      id="o-que-aconteceu"
      aria-labelledby="titulo-o-que-aconteceu"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-text-soft">
          02 · Rio Doce
        </p>
        <h2
          id="titulo-o-que-aconteceu"
          className="mt-1 font-display text-[clamp(1.3em,3vw,1.7em)] font-bold leading-tight tracking-tight"
        >
          O que aconteceu
        </h2>
      </header>

      <div className="mt-4 max-w-3xl space-y-4 text-[.98em] leading-relaxed text-text">
        <p>
          Em <strong>05/11/2015</strong>, a barragem de Fundão, em Mariana
          (MG), operada pela Samarco — joint venture de Vale e BHP —, rompeu.
          O evento deixou <strong>19 mortos</strong> e lançou rejeitos que
          percorreram <strong>mais de 650 km</strong> até alcançar o Atlântico.
          <Marca tipo="medido" />
        </p>
        <p>
          O material se espalhou por cerca de <strong>500 km de litoral</strong>,
          do Espírito Santo ao norte fluminense e ao sul da Bahia. Em Abrolhos,
          material proveniente do Rio Doce foi identificado e elementos foram
          incorporados em corais. A evidência é forte para o impacto costeiro
          capixaba e para a chegada do material a Abrolhos, mas{" "}
          <strong>não autoriza atribuir todo dano recifal ao rompimento</strong>.
          <Marca tipo="medido" />
          <Marca tipo="nao" />
        </p>
        <p>
          Na reparação, o Termo de Transação e de Ajustamento de Conduta
          (TTAC) de 2016 criou a Fundação Renova. O Novo Acordo foi homologado
          pelo STF em <strong>06/11/2024</strong>, com R$ 170 bilhões
          previstos e R$ 32 bilhões destinados a indenizações individuais,
          segundo o Governo Federal citado na análise. O Programa de
          Indenização e Desligamento (PID) — R$ 35 mil por pessoa elegível —
          é a medida reparatória final desse desenho.
          <Marca tipo="medido" />
        </p>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1.4fr_1fr] sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
            Do rompimento ao PID
          </p>
          <ol className="mt-3 space-y-3 text-sm">
            <li className="border-l-2 border-primary/40 pl-3">
              <span className="font-tabular font-bold text-primary">2015</span>{" "}
              — rompimento da barragem de Fundão, em 05/11.
            </li>
            <li className="border-l-2 border-primary/40 pl-3">
              <span className="font-tabular font-bold text-primary">2016</span>{" "}
              — TTAC e criação da Fundação Renova.
            </li>
            <li className="border-l-2 border-primary/40 pl-3">
              <span className="font-tabular font-bold text-primary">2024</span>{" "}
              — Novo Acordo homologado pelo STF, em 06/11.
            </li>
            <li className="border-l-2 border-primary/40 pl-3">
              <span className="font-tabular font-bold text-primary">2026</span>{" "}
              — PID chega a 321 mil indenizações, segundo a Samarco.
            </li>
          </ol>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-2 p-4">
          <p className="text-sm leading-relaxed text-text-soft">
            A cronologia completa, com cada marco e o link da fonte oficial,
            está na linha do tempo do caso.
          </p>
          <NextLink
            href="/riodoce/linha-do-tempo"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Abrir a linha do tempo →
          </NextLink>
        </div>
      </div>
    </section>
  );
}
