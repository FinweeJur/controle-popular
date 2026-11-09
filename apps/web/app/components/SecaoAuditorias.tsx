import NextLink from "next/link";
import {
  formatCurrencyCompactaBR,
  formatDateBR,
  formatNumberBR,
} from "@/lib/betim/format";
import {
  COBERTURA_AUDITORIA_AJRI,
  PERIODO_AUDITORIA_AJRI,
} from "@/lib/paraopeba/auditoria-ajri";
import {
  COBERTURA_EXECUCAO_FGV,
  REFERENCIA_EXECUCAO_FGV,
  TOTAL_EXECUCAO_FGV,
} from "@/lib/paraopeba/execucao-fgv";

/**
 * As duas auditorias do caso, como seção de entrada.
 *
 * POR QUE EXISTE
 *
 * `/paraopeba/auditoria` e `/paraopeba/execucao` são páginas próprias. Quem
 * desce a análise integrada ou a biblioteca não passava por elas e podia sair
 * sem saber que o caso tem duas auditorias independentes, com objetos
 * diferentes: a AECOM mede a execução socioambiental das obras e programas; a
 * FGV mede o dinheiro dos Anexos I.3 e I.4. Os números não se somam.
 *
 * REGRA: todos os números vêm das coberturas literais (`COBERTURA_*`), não de
 * arrays grandes — o mesmo motivo de payload documentado em `execucao-fgv.ts`.
 */

const CAIXA = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export function SecaoAuditorias({
  contexto,
}: {
  contexto: "analise" | "biblioteca";
}) {
  const socioambiental = COBERTURA_AUDITORIA_AJRI;
  const socioeconomica = COBERTURA_EXECUCAO_FGV;
  const trilha =
    contexto === "analise"
      ? "O cruzamento abaixo usa a auditoria socioambiental como eixo e procura a perícia e as ATIs no mesmo tema."
      : "Os 467 documentos da AECOM não entram na lista das ATIs abaixo: eles têm catálogo próprio, para a mesma ficha não aparecer duas vezes.";

  return (
    <section
      aria-labelledby="auditorias-caso"
      className="mt-10 scroll-mt-24 border-t border-border pt-8"
    >
      <h2
        id="auditorias-caso"
        className="font-display text-[clamp(1.25em,2.6vw,1.55em)] font-bold tracking-tight"
      >
        As duas auditorias do caso
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] leading-relaxed text-text-soft">
        São objetos diferentes e os números não se somam. A auditoria
        socioambiental mede a execução das obras e programas do Acordo; a
        socioeconômica mede o dinheiro dos Anexos I.3 e I.4, município por
        município. {trilha}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <article className={`${CAIXA} flex flex-col`}>
          <p className="text-xs font-medium uppercase tracking-wide text-text-soft">
            Auditoria socioambiental
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            AECOM — Acordo de Reparação Integral
          </h3>
          <p className="mt-2 text-sm text-text-soft">
            {formatNumberBR(socioambiental.total)} documentos:{" "}
            {formatNumberBR(socioambiental.porTipo.relatorio)} relatórios e{" "}
            {formatNumberBR(socioambiental.porTipo["nota-tecnica"])} notas
            técnicas, de {formatDateBR(PERIODO_AUDITORIA_AJRI.de)} a{" "}
            {formatDateBR(PERIODO_AUDITORIA_AJRI.ate)}. O acervo usa{" "}
            {formatNumberBR(socioambiental.temas)} temas e{" "}
            {formatNumberBR(socioambiental.instrumentos)} instrumentos do
            Acordo.
          </p>
          <p className="mt-3 text-xs text-text-soft">
            Mede o andamento da reparação, não o dano já ocorrido — essa é a
            régua da perícia da UFMG.
          </p>
          <NextLink
            href="/paraopeba/auditoria"
            className="mt-4 inline-flex font-semibold text-primary underline underline-offset-2 hover:text-accent"
          >
            Abrir o catálogo da auditoria →
          </NextLink>
        </article>

        <article className={`${CAIXA} flex flex-col`}>
          <p className="text-xs font-medium uppercase tracking-wide text-text-soft">
            Auditoria socioeconômica
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            FGV — execução dos Anexos I.3 e I.4
          </h3>
          <p className="mt-2 text-sm text-text-soft">
            {formatNumberBR(socioeconomica.municipios)} municípios da bacia e{" "}
            {formatNumberBR(socioeconomica.projetosDistintos)} projetos
            distintos. O acordo atualizado nesse recorte é de{" "}
            <strong className="text-text">
              {formatCurrencyCompactaBR(TOTAL_EXECUCAO_FGV.acordoAtual)}
            </strong>
            , com relatório de {REFERENCIA_EXECUCAO_FGV.relatorio}.
          </p>
          <p className="mt-3 text-xs text-text-soft">
            Isto não é o Acordo inteiro: a FGV audita os Anexos I.3/I.4, não os
            R$ 37,6 bilhões globalmente. Somar os dois totais inventaria
            dinheiro.
          </p>
          <NextLink
            href="/paraopeba/execucao"
            className="mt-4 inline-flex font-semibold text-primary underline underline-offset-2 hover:text-accent"
          >
            Abrir a execução município a município →
          </NextLink>
        </article>
      </div>
    </section>
  );
}
