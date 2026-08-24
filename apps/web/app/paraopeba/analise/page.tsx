import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { ATI_BIBLIOTECA_LABEL } from "@/lib/paraopeba/biblioteca";
import { CASAMENTOS_ESTUDO_NOTICIA } from "@/lib/paraopeba/estudo-e-noticia";
import {
  ESTUDO_AUSENTE_DO_ACERVO,
  resumoIntegrado,
  sinteseIntegrada,
  temasSemEixo,
} from "@/lib/paraopeba/sintese-integrada";
import PainelAnalise from "./PainelAnalise";

/**
 * `/paraopeba/analise` — a análise integrada: os 16 eixos da síntese da
 * auditoria AECOM (`sintese-ajri.ts`) cruzados com o que a perícia judicial
 * da UFMG mediu e com o que as ATIs publicaram sobre o mesmo assunto.
 *
 * ═══ TRÊS VOZES, NUNCA UMA SÓ ═══
 *
 * Cada trecho nesta página carrega a fonte que o escreveu — auditoria,
 * perícia ou ATI nunca se fundem num parágrafo comum. E as duas coisas que
 * mais importa não confundir: (1) co-ocorrência temática não é causalidade —
 * duas fontes falarem do mesmo assunto não quer dizer que uma respondeu à
 * outra, nem que os números concordam; (2) "ponte não existe" (eixo sem
 * TemaAjri equivalente no vocabulário fechado de 25 temas da própria
 * auditoria) é diferente de "as outras fontes não falam disso" — a primeira
 * é limite deste cruzamento, a segunda seria uma afirmação sobre o que
 * perícia e ATIs escreveram. Ver o cabeçalho de
 * `lib/paraopeba/sintese-integrada.ts` para a régua completa.
 *
 * Nenhum número desta página é digitado — todos vêm de `sinteseIntegrada()`,
 * medida contra os três acervos reais a cada build.
 */

export const dynamic = "force-static";

export const metadata: Metadata = metadataEditavel("/paraopeba/analise", {
  title: "Análise integrada — Paraopeba | Controle Popular",
  description:
    "Os 16 eixos da síntese da auditoria AECOM cruzados com o que a perícia judicial da UFMG mediu e o que as Assessorias Técnicas Independentes publicaram sobre o mesmo assunto — com o que falta em cada eixo e o que nenhuma das três fontes ainda respondeu.",
});

export default async function AnaliseIntegradaPage() {
  const eixos = await sinteseIntegrada();
  const resumo = resumoIntegrado(eixos);
  const orfaos = await temasSemEixo();

  const idsComVoz = new Set(eixos.flatMap((e) => e.vozAti.map((c) => c.noticia.id)));
  const casamentosSemEixo = CASAMENTOS_ESTUDO_NOTICIA.filter(
    (c) => c.forca !== "nula" && !idsComVoz.has(c.noticia.id)
  );

  const ordenadosParaGrafico = [...eixos].sort(
    (a, b) => a.cobertura.fontesQueFalam - b.cobertura.fontesQueFalam || a.titulo.localeCompare(b.titulo, "pt")
  );

  const COR_FONTE: Record<number, string> = {
    1: "var(--color-ord-1)",
    2: "var(--color-ord-3)",
    3: "var(--color-ord-4)",
  };

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Análise integrada</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        O que a auditoria, a perícia e as ATIs dizem sobre o mesmo eixo — e o que só uma delas diz
      </h1>

      <p className="mt-3 max-w-2xl text-[1.02em] leading-relaxed text-text-soft">
        A auditoria independente (AECOM) organiza sete anos e meio de relatórios em{" "}
        <strong className="text-text">{formatNumberBR(resumo.totalEixos)} eixos temáticos</strong>.
        Esta página cruza cada um deles com o que a{" "}
        <strong className="text-text">perícia judicial da UFMG</strong> mediu e com o que a{" "}
        <strong className="text-text">biblioteca das Assessorias Técnicas Independentes</strong>{" "}
        publicou sobre o mesmo assunto — por tema controlado, nunca por palavra parecida. O que
        importa mais aqui não é onde as três concordam: é{" "}
        <strong className="text-text">onde só uma delas fala</strong>.
      </p>

      {/* ═══ DECLARAÇÃO — o que este cruzamento é e não é ═══ */}
      <section
        aria-labelledby="declaracao-analise"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-analise" className="font-display text-base font-semibold text-text">
          O que este cruzamento é, e o que ele não é
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">Cada trecho carrega a fonte.</strong> O texto da auditoria
            é da AECOM; o que a perícia mediu é da UFMG; o que as ATIs publicaram é delas. Nada é
            reescrito num parágrafo comum — cada voz aparece rotulada, com link para a origem.
          </li>
          <li>
            <strong className="text-text">Co-ocorrência temática não é causalidade.</strong> Duas
            fontes falarem do mesmo eixo não quer dizer que uma respondeu à outra, nem que os números
            concordam. Como o próprio cruzamento entre perícia e auditoria já registra em outra
            página deste portal: as duas quase nunca falam do mesmo objeto — a perícia mede o dano já
            ocorrido, a auditoria mede o andamento da reparação.
          </li>
          <li>
            <strong className="text-text">&quot;Ponte não existe&quot; ≠ &quot;ninguém mais fala disso&quot;.</strong>{" "}
            {formatNumberBR(resumo.soAuditoriaSemPonte)} dos {formatNumberBR(resumo.totalEixos)} eixos
            não têm um tema equivalente no vocabulário fechado de 25 temas que a própria AECOM usa
            para marcar seus documentos — não é possível cruzá-los por tema, o que é diferente de
            afirmar que a perícia e as ATIs não tratam do assunto.
          </li>
          <li>
            <strong className="text-text">O cruzamento é por TemaAjri, nunca por palavra em
            comum.</strong> Um documento só entra num eixo quando carrega o mesmo tema controlado que
            o eixo — a mesma régua que <code className="rounded bg-surface px-1 py-0.5 text-[.85em]">temas-ati.ts</code> e{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[.85em]">temas-acervo.ts</code> já
            aplicam ao resto do portal.
          </li>
        </ul>
      </section>

      {/* ═══ OS NÚMEROS DE TOPO ═══ */}
      <section aria-labelledby="numeros-analise" className="mt-10">
        <h2 id="numeros-analise" className="font-display text-xl font-bold tracking-tight text-text">
          Em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Eixos temáticos
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(resumo.totalEixos)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Cobertos pelas três fontes
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(resumo.comTresFontes)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Só a auditoria fala — é pauta
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(resumo.soAuditoria)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              {formatNumberBR(resumo.soAuditoriaComPonteVazia)} com ponte mas sem uso ·{" "}
              {formatNumberBR(resumo.soAuditoriaSemPonte)} sem ponte
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Temas sem eixo correspondente
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(orfaos.length)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">ver seção abaixo</p>
          </div>
        </div>
      </section>

      {/* ═══ O GRÁFICO — cobertura por eixo × fonte ═══ */}
      <section aria-labelledby="grafico-analise" className="mt-10">
        <h2 id="grafico-analise" className="font-display text-xl font-bold tracking-tight text-text">
          Cobertura por eixo, menos fontes primeiro
        </h2>
        <p className="mt-2 max-w-2xl text-[.92em] leading-relaxed text-text-soft">
          A auditoria sempre conta — é ela que define os 16 eixos. A barra mostra quantas das outras
          duas fontes (perícia, ATIs) também falam do mesmo eixo, por tema controlado.
        </p>

        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, um por eixo temático, comprimento proporcional ao número
            de fontes que falam dele (de 1, só a auditoria, a 3, as três fontes).{" "}
            {ordenadosParaGrafico
              .map(
                (e) =>
                  `${e.titulo}: ${e.cobertura.fontesQueFalam} de 3 fontes${
                    e.cobertura.temTemaAjri ? "" : " (sem tema equivalente na auditoria)"
                  }.`
              )
              .join(" ")}
          </div>

          <div aria-hidden className="space-y-2">
            {ordenadosParaGrafico.map((e) => (
              <div key={e.titulo} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-right text-[.82em] text-text-soft" title={e.titulo}>
                  {e.titulo}
                </span>
                <div className="cp-ord-track h-3.5 flex-1 overflow-hidden">
                  <div
                    className="h-full rounded-r-[3px]"
                    style={{
                      width: `${(e.cobertura.fontesQueFalam / 3) * 100}%`,
                      background: COR_FONTE[e.cobertura.fontesQueFalam],
                    }}
                    title={`${e.titulo}: ${e.cobertura.fontesQueFalam}/3 fontes`}
                  />
                </div>
                <span className="w-10 shrink-0 text-[.82em] text-text-soft">
                  {e.cobertura.fontesQueFalam}/3
                </span>
              </div>
            ))}
          </div>

          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: COR_FONTE[1] }}
              />
              Só a auditoria
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: COR_FONTE[2] }}
              />
              Duas fontes
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: COR_FONTE[3] }}
              />
              As três fontes
            </span>
          </figcaption>
        </figure>
      </section>

      {/* ═══ TEMAS SEM EIXO — o espelho de "quais faltam" ═══ */}
      <section aria-labelledby="orfaos-analise" className="mt-10">
        <h2 id="orfaos-analise" className="font-display text-xl font-bold tracking-tight text-text">
          Temas que perícia e ATIs cobrem, sem eixo correspondente na síntese
        </h2>
        <p className="mt-2 max-w-2xl text-[.92em] leading-relaxed text-text-soft">
          O espelho da pergunta acima: {formatNumberBR(orfaos.length)} temas do vocabulário fechado
          da AECOM têm documento real de perícia e/ou de ATI, mas nenhum dos 16 eixos da síntese é
          &quot;sobre&quot; eles especificamente — atravessam a síntese inteira sem virar um eixo próprio (ver
          o cabeçalho de <code className="rounded bg-surface-2 px-1 py-0.5 text-[.85em]">sintese-integrada.ts</code>).
        </p>
        {orfaos.length === 0 ? (
          <p className="mt-4 text-[.92em] text-text-soft">Nenhum tema órfão medido nesta build.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[.9em]">
              <thead>
                <tr className="border-b border-border text-left text-text">
                  <th className="py-1.5 pr-3 font-medium">Tema (TemaAjri)</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Documentos da perícia</th>
                  <th className="py-1.5 text-right font-medium">Documentos das ATIs</th>
                </tr>
              </thead>
              <tbody className="text-text-soft">
                {orfaos.map((o) => (
                  <tr key={o.tema} className="border-b border-border/60">
                    <td className="py-1.5 pr-3 font-medium text-text">{o.rotulo}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatNumberBR(o.documentosPericia)}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatNumberBR(o.documentosAti)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══ O ESTUDO CITADO EM NOTÍCIA, AUSENTE DO ACERVO DA PERÍCIA ═══ */}
      <section aria-labelledby="estudo-ausente" className="mt-10">
        <h2 id="estudo-ausente" className="font-display text-xl font-bold tracking-tight text-text">
          Um estudo citado em notícia, ausente do acervo raspado
        </h2>
        <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            <a
              href={ESTUDO_AUSENTE_DO_ACERVO.noticia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              {ESTUDO_AUSENTE_DO_ACERVO.noticia.titulo}
            </a>{" "}
            <span className="text-text-soft/80">
              ({ESTUDO_AUSENTE_DO_ACERVO.noticia.fonte}, {formatDateBR(ESTUDO_AUSENTE_DO_ACERVO.noticia.data)})
            </span>
          </p>
          <p className="mt-2">{ESTUDO_AUSENTE_DO_ACERVO.evidencia}</p>
          <p className="mt-2">
            <strong className="text-text">Por que não casa com nenhum documento:</strong>{" "}
            {ESTUDO_AUSENTE_DO_ACERVO.motivo}
          </p>
          <p className="mt-3 text-[.86em] text-text-soft/80">
            Achado por lacuna, não por casamento — este é o único caso do cruzamento notícia×estudo em
            que uma ATI descreve, com número, um estudo específico que os 445 itens raspados do
            acervo da perícia não contêm.
          </p>
        </div>

        {casamentosSemEixo.length > 0 && (
          <p className="mt-4 max-w-2xl text-[.85em] leading-relaxed text-text-soft">
            <strong className="text-text">Nota à parte:</strong> {formatNumberBR(casamentosSemEixo.length)}{" "}
            casamento{casamentosSemEixo.length === 1 ? "" : "s"} estudo×notícia com força forte ou
            média (
            {casamentosSemEixo.map((c, i) => (
              <span key={c.noticia.id}>
                {i > 0 ? ", " : ""}
                <code className="rounded bg-surface-2 px-1 py-0.5">{c.noticia.id}</code>
              </span>
            ))}
            ) não aparece em nenhum eixo abaixo: o documento que a notícia cita é do Guaicuy (que não
            declara tema livre na biblioteca — ver <code className="rounded bg-surface-2 px-1 py-0.5">biblioteca.ts</code>) ou é o
            resumo geral da perícia (classificado como transversal às reuniões com as partes, não de
            um eixo só). Mostrados aqui, não escondidos.
          </p>
        )}
      </section>

      {/* ═══ A TABELA — filtrável, ordenável, exportável, com o detalhe das quatro vozes ═══ */}
      <section aria-labelledby="tabela-analise" className="mt-10">
        <h2 id="tabela-analise" className="font-display text-xl font-bold tracking-tight text-text">
          Eixo a eixo
        </h2>
        <p className="mt-2 max-w-2xl text-[.92em] leading-relaxed text-text-soft">
          Abra cada eixo para ver as quatro vozes separadas: o que a auditoria concluiu, o que a
          perícia mediu, o que as ATIs publicaram e — quando existe — o que a própria ATI escreveu
          sobre um estudo específico.
        </p>
        <div className="mt-5">
          <PainelAnalise eixos={eixos} atiLabel={ATI_BIBLIOTECA_LABEL} />
        </div>
      </section>

      <section
        aria-labelledby="fonte-analise"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-analise" className="font-display text-base font-semibold text-text">
          De onde vem cada voz
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">Auditoria:</strong> síntese deste portal sobre os 337
            relatórios da AECOM — ver{" "}
            <a href="/paraopeba/auditoria" className="text-primary underline underline-offset-2 hover:text-accent">
              /paraopeba/auditoria
            </a>{" "}
            para o eixo completo, com achados e evolução no tempo.
          </li>
          <li>
            <strong className="text-text">Perícia:</strong> os 7 documentos de resultado do CTC/UFMG
            (nov/2025) — ver a leitura de conjunto em{" "}
            <span className="text-text">sintese-pericia.ts</span> (perícia × auditoria, narrativa
            completa).
          </li>
          <li>
            <strong className="text-text">ATIs:</strong> o que AEDAS e Guaicuy publicaram — ver{" "}
            <a href="/paraopeba/biblioteca" className="text-primary underline underline-offset-2 hover:text-accent">
              /paraopeba/biblioteca
            </a>
            . O NACAB tem itens prometidos que ainda não entraram no acervo (ver{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[.85em]">biblioteca-ati.json</code>).
          </li>
        </ul>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
