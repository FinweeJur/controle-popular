import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  contarCoberturaTemasLegislacaoAmbiental,
  contarLegislacaoAmbiental,
  listarLegislacaoAmbiental,
} from "@/lib/db/queries/legislacao-ambiental";
import { listarNormasDireitoCritico, listarPrecedentesDireitoCritico } from "@/lib/db/queries/direito-critico";
import BuscaLegislacaoUnificada from "./BuscaLegislacaoUnificada";
// Compactado ANTES de cruzar a fronteira: o corpus inteiro vai no payload
// da rota, e sem isto o asset passa dos 25 MiB do Workers. Ver
// `lib/ambiental/payload-compacto.ts` e `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`.
import { compactar } from "@/lib/ambiental/payload-compacto";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/legislacao", {
  title: "Legislação e precedentes por tema — Controle Popular · Ambiental",
  description:
    "Legislação ambiental estadual de Minas (ALMG, Semad, Siam) e federal (MMA, Ibama, ICMBio, Resoluções Conama, CNDH), legislação nacional/internacional e precedentes judiciais, numa busca só, filtrável por esfera e por tema de proteção — mineração, fauna e flora, recursos hídricos, serras, indígena, quilombola, rios e mais.",
});

/**
 * `/ambiental/legislacao` — painel unificado, decisão do dono (2026-08-13):
 * "é melhor unificar os painéis de legislação estadual / nacional /
 * proteção em um só, filtrável por temas". Decisão tomada, não reaberta
 * aqui — este comentário documenta a implementação, não o debate.
 *
 * ═══ O QUE ERA DOIS PAINÉIS VIROU UM ═══
 *
 * Até 13/08/2026 esta URL só tinha as 6.378 normas ESTADUAIS (ALMG + Semad
 * + Siam, migration `0063`), e `/ambiental/direito-critico` (agora
 * redirecionada pra cá — ver `next.config.ts` e o bridge em
 * `app/ambiental/direito-critico/page.tsx`) tinha as 30 normas
 * nacionais/internacionais + 15 precedentes (migration `0067`). Duas telas
 * respondendo à MESMA pergunta ("que lei/decisão trata disso"), com o
 * leitor tendo que adivinhar qual abrir — o mesmo raciocínio que já valeu
 * pras camadas quilombolas no mapa 3D.
 *
 * A fusão é só de CAMADA DE APRESENTAÇÃO: as três tabelas de origem
 * (`ambiental_legislacao`, `direito_critico_normas`,
 * `direito_critico_precedentes`) continuam INTOCADAS — sem migration nova,
 * sem coluna nova. `lib/ambiental/legislacao-unificada.ts` é quem junta as
 * três listas já buscadas (uma query por tabela, 3 no total — dentro do
 * teto de 50 subrequests do Workers Free, ver `lib/db/client.ts`) num
 * array só, com esfera resolvida e tema no vocabulário unificado.
 *
 * ═══ ESFERA — CAMPO DE PRIMEIRA CLASSE ═══
 *
 * Antes a esfera de cada norma era implícita na fonte (ALMG = estadual,
 * "direito-crítico" = nacional/internacional misturados sem rótulo). Agora
 * todo item carrega `esfera` (municipal/estadual/nacional/internacional) —
 * FILTRO próprio e badge no card.
 *
 * ═══ 14/08/2026: A LEGISLAÇÃO FEDERAL ENTROU ═══
 *
 * Este comentário dizia, até aqui, que a esfera "nacional" guardava espaço
 * "pro dia em que a legislação federal do MMA entrar". Entrou: migration
 * `0073` + coletores `etl.apis.legislacao_mma` (CSV CC-BY do MMA, com as
 * Resoluções Conama) e `etl.apis.legislacao_cndh` (resoluções e
 * recomendações do CNDH, CC BY-ND — ementa citada, nunca reescrita). As
 * duas gravam na MESMA `ambiental_legislacao`, com `esfera='nacional'`, e
 * por isso o card estadual deixou de carimbar "Estadual" fixo: ele lê a
 * coluna. Números medidos da carga em `docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`.
 *
 * ═══ PRECEDENTE NÃO É NORMA ═══
 *
 * O painel de direito crítico já acertava nisso — cada precedente carrega
 * tribunal/ementa/relevância, nunca artigo, e o card muda de forma. Continua
 * assim aqui: `BuscaLegislacaoUnificada` nunca achata as três classes
 * (`estadual`/`critica`/`precedente`) num shape comum, só compartilha o
 * filtro de esfera/tema/busca.
 *
 * ═══ CARTÕES E GRÁFICO (regra do dono, 2026-08-21: "cinco coisas") ═══
 *
 * O gráfico pedido é "por ano de norma e por órgão emissor" — os dois só
 * existem sobre `estaduais` (a tabela `ambiental_legislacao`, que apesar do
 * nome da variável já inclui MMA/CNDH federais desde a migration 0073):
 * `criticas` e `precedentes` não têm `ano` nem `orgao` na fonte, então
 * entrar num "gráfico por ano" com eles inventaria um eixo que o dado não
 * tem. Isso é dito na legenda de cada gráfico, não escondido.
 *
 * "Por ano" é uma janela dos últimos 12 anos com dado — não a série
 * completa: o corpus tem norma de décadas atrás, e um gráfico com uma barra
 * por ano desde o primeiro registro ficaria ilegível (e a pergunta que o
 * leitor faz de um portal de transparência é "estão legislando mais agora",
 * não a distribuição desde o século passado). O que fica de fora da janela
 * soma numa barra "antes de {ano}" — nenhuma norma sai da CONTAGEM, só do
 * desenho. "Por órgão" recorta aos 8 órgãos com mais normas, mesmo
 * raciocínio, com "outros órgãos" no lugar de "antes de".
 */
const JANELA_ANOS_GRAFICO = 12;
const TOP_ORGAOS_GRAFICO = 8;

export default async function LegislacaoAmbientalIndex() {
  const [estaduais, criticas, precedentes, contagemEstadual, coberturaEstadual] = await Promise.all([
    listarLegislacaoAmbiental(),
    listarNormasDireitoCritico(),
    listarPrecedentesDireitoCritico(),
    contarLegislacaoAmbiental(),
    contarCoberturaTemasLegislacaoAmbiental(),
  ]);

  const totalGeral = estaduais.length + criticas.length + precedentes.length;

  // ═══ GRÁFICO 1 — por ano, janela dos últimos N anos com dado ═══
  const anosPresentes = estaduais.map((l) => l.ano).filter((a): a is number => a !== null);
  const anoMaisRecente = anosPresentes.length > 0 ? Math.max(...anosPresentes) : null;
  const anoCorte = anoMaisRecente !== null ? anoMaisRecente - JANELA_ANOS_GRAFICO + 1 : null;
  const contagemPorAno = new Map<number, number>();
  let normasAntesDoCorte = 0;
  let normasSemAno = 0;
  for (const l of estaduais) {
    if (l.ano === null) {
      normasSemAno++;
      continue;
    }
    if (anoCorte !== null && l.ano < anoCorte) {
      normasAntesDoCorte++;
      continue;
    }
    contagemPorAno.set(l.ano, (contagemPorAno.get(l.ano) ?? 0) + 1);
  }
  const serieAnos =
    anoCorte !== null
      ? Array.from({ length: JANELA_ANOS_GRAFICO }, (_, i) => anoCorte + i).map((ano) => ({
          ano,
          total: contagemPorAno.get(ano) ?? 0,
        }))
      : [];
  const maxSerieAnos = Math.max(1, ...serieAnos.map((a) => a.total));

  // ═══ GRÁFICO 2 — por órgão emissor, os que mais aparecem ═══
  const contagemPorOrgao = new Map<string, number>();
  let normasSemOrgao = 0;
  for (const l of estaduais) {
    const chave = l.orgao?.trim();
    if (!chave) {
      normasSemOrgao++;
      continue;
    }
    contagemPorOrgao.set(chave, (contagemPorOrgao.get(chave) ?? 0) + 1);
  }
  const orgaosOrdenados = [...contagemPorOrgao.entries()].sort((a, b) => b[1] - a[1]);
  const topOrgaos = orgaosOrdenados.slice(0, TOP_ORGAOS_GRAFICO);
  const restoOrgaos = orgaosOrdenados.slice(TOP_ORGAOS_GRAFICO);
  const outrosOrgaosTotal = restoOrgaos.reduce((t, [, n]) => t + n, 0);
  const serieOrgaos: { rotulo: string; total: number }[] = topOrgaos.map(([orgao, total]) => ({
    rotulo: orgao,
    total,
  }));
  if (outrosOrgaosTotal > 0) {
    serieOrgaos.push({ rotulo: `Outros ${restoOrgaos.length} órgãos`, total: outrosOrgaosTotal });
  }
  const maxSerieOrgaos = Math.max(1, ...serieOrgaos.map((o) => o.total));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual, federal e internacional · Legislação e precedentes
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          A legislação e os precedentes de proteção, numa busca só
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Leis, decretos, deliberações e portarias ambientais de Minas Gerais ao lado da legislação
          ambiental federal (Ministério do Meio Ambiente, Ibama, ICMBio e as Resoluções Conama), das
          resoluções e recomendações do Conselho Nacional dos Direitos Humanos, de tratados e de
          decisões de tribunais nacionais e internacionais — numa busca só, filtrável por esfera e
          por tema de proteção, do licenciamento de mineração à proteção da fauna e dos povos
          indígenas.
        </p>

        {totalGeral === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nada coletado ainda. Os coletores (
            <code className="font-mono text-[.85em]">etl.apis.legislacao_almg</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_semad</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_siam</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_mma</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_cndh</code>,{" "}
            <code className="font-mono text-[.85em]">direito_critico_popular</code>) ainda não
            rodaram contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(totalGeral)}</strong> itens ao todo:{" "}
            <strong className="font-tabular">
              {formatNumberBR(
                contagemEstadual.porFonte.almg + contagemEstadual.porFonte.semad + contagemEstadual.porFonte.siam
              )}
            </strong>{" "}
            normas estaduais de Minas (
            <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.almg)}</strong>{" "}
            ALMG, <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.semad)}</strong>{" "}
            Semad, <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.siam)}</strong>{" "}
            Siam),{" "}
            <strong className="font-tabular">
              {formatNumberBR(contagemEstadual.porFonte.mma + contagemEstadual.porFonte.cndh)}
            </strong>{" "}
            normas federais (
            <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.mma)}</strong>{" "}
            MMA/Conama, <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.cndh)}</strong>{" "}
            CNDH), <strong className="font-tabular">{formatNumberBR(criticas.length)}</strong>{" "}
            instrumentos nacionais/internacionais curados e{" "}
            <strong className="font-tabular">{formatNumberBR(precedentes.length)}</strong> precedentes
            judiciais. As três fontes estaduais se sobrepõem em parte — a mesma Lei/Decreto pode
            estar em mais de uma, e o card avisa quando isso acontece.
          </p>
        )}

        {coberturaEstadual.total > 0 && (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.88em] text-text-soft">
            Das normas ambientais coletadas em massa (as estaduais e as federais),{" "}
            <strong className="font-tabular text-text">{formatNumberBR(coberturaEstadual.comTema)}</strong> de{" "}
            <strong className="font-tabular text-text">{formatNumberBR(coberturaEstadual.total)}</strong> (
            {((100 * coberturaEstadual.comTema) / coberturaEstadual.total).toFixed(1).replace(".", ",")}%)
            receberam pelo menos um tema — as demais ficam &quot;sem tema atribuído&quot;, não
            empurradas pra um tema qualquer. As 45 linhas de legislação/precedente
            nacional/internacional têm 100% de cobertura (curadoria dedicada, ver seção abaixo).
          </p>
        )}
      </header>

      {totalGeral > 0 && (
        <>
          {/* ═══ CARTÕES DE TOPO ═══ */}
          <section aria-labelledby="numeros-legislacao" className="mt-10">
            <h2 id="numeros-legislacao" className="font-display text-xl font-semibold">
              O acervo em números
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Itens ao todo
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(totalGeral)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Normas estaduais de Minas
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(
                    contagemEstadual.porFonte.almg + contagemEstadual.porFonte.semad + contagemEstadual.porFonte.siam
                  )}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">ALMG, Semad e Siam</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Normas federais
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(contagemEstadual.porFonte.mma + contagemEstadual.porFonte.cndh)}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">MMA/Conama e CNDH</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Nacional/internacional curados
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(criticas.length)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Precedentes judiciais
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(precedentes.length)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Com tema atribuído
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {coberturaEstadual.total > 0
                    ? `${((100 * coberturaEstadual.comTema) / coberturaEstadual.total).toFixed(1).replace(".", ",")}%`
                    : "—"}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">
                  {formatNumberBR(coberturaEstadual.comTema)} de {formatNumberBR(coberturaEstadual.total)} normas
                  coletadas em massa
                </p>
              </div>
            </div>
          </section>

          {/* ═══ GRÁFICO — por ano e por órgão emissor (só as normas, que são
              o único dos três acervos com esses dois campos) ═══ */}
          <section aria-labelledby="grafico-legislacao" className="mt-10">
            <h2 id="grafico-legislacao" className="font-display text-xl font-semibold">
              Por ano e por órgão emissor
            </h2>
            <p className="mt-2 max-w-2xl text-[.92em] text-text-soft">
              Cobre só as {formatNumberBR(estaduais.length)} normas (ALMG, Semad, Siam, MMA/Conama,
              CNDH) — legislação nacional/internacional curada e precedentes não têm ano nem órgão
              emissor na fonte, então não entram nestes dois gráficos.
            </p>

            {anoMaisRecente !== null && (
              <figure className="mt-6">
                <figcaption className="text-[.85em] font-semibold text-text">
                  Por ano, {anoCorte}–{anoMaisRecente}
                  {normasAntesDoCorte > 0 || normasSemAno > 0 ? (
                    <span className="font-normal text-text-soft">
                      {" "}
                      ({formatNumberBR(normasAntesDoCorte)} anteriores a {anoCorte}
                      {normasSemAno > 0 ? `, ${formatNumberBR(normasSemAno)} sem ano registrado` : ""} — fora da
                      janela do desenho, dentro da contagem)
                    </span>
                  ) : null}
                </figcaption>
                <div className="sr-only">
                  Gráfico de barras horizontais, uma por ano de {anoCorte} a {anoMaisRecente}, comprimento
                  proporcional ao total de normas do ano.{" "}
                  {serieAnos.map((a) => `${a.ano}: ${a.total} normas.`).join(" ")}
                </div>
                <div aria-hidden className="mt-3 space-y-1.5">
                  {serieAnos.map((a) => (
                    <div key={a.ano} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-right font-tabular text-[.82em] font-semibold text-text">
                        {a.ano}
                      </span>
                      <div className="cp-ord-track h-3 flex-1 overflow-hidden">
                        <div
                          className="cp-ord-seg cp-ord-seg-1 h-full rounded-[3px]"
                          style={{ width: `${(a.total / maxSerieAnos) * 100}%`, background: "var(--color-ord-1)" }}
                          title={`${a.ano}: ${formatNumberBR(a.total)} normas`}
                        />
                      </div>
                      <span className="w-12 shrink-0 font-tabular text-[.82em] text-text-soft">
                        {formatNumberBR(a.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </figure>
            )}

            {serieOrgaos.length > 0 && (
              <figure className="mt-8">
                <figcaption className="text-[.85em] font-semibold text-text">
                  Por órgão emissor
                  {normasSemOrgao > 0 ? (
                    <span className="font-normal text-text-soft">
                      {" "}
                      ({formatNumberBR(normasSemOrgao)} sem órgão registrado na fonte — fora do desenho,
                      dentro da contagem)
                    </span>
                  ) : null}
                </figcaption>
                <div className="sr-only">
                  Gráfico de barras horizontais, uma por órgão emissor, comprimento proporcional ao total
                  de normas do órgão.{" "}
                  {serieOrgaos.map((o) => `${o.rotulo}: ${o.total} normas.`).join(" ")}
                </div>
                <div aria-hidden className="mt-3 space-y-1.5">
                  {serieOrgaos.map((o) => (
                    <div key={o.rotulo} className="flex items-center gap-3">
                      <span
                        className="w-40 shrink-0 truncate text-right font-tabular text-[.82em] font-semibold text-text"
                        title={o.rotulo}
                      >
                        {o.rotulo}
                      </span>
                      <div className="cp-ord-track h-3 flex-1 overflow-hidden">
                        <div
                          className="cp-ord-seg cp-ord-seg-1 h-full rounded-[3px]"
                          style={{ width: `${(o.total / maxSerieOrgaos) * 100}%`, background: "var(--color-ord-1)" }}
                          title={`${o.rotulo}: ${formatNumberBR(o.total)} normas`}
                        />
                      </div>
                      <span className="w-12 shrink-0 font-tabular text-[.82em] text-text-soft">
                        {formatNumberBR(o.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </figure>
            )}

            {/* Alternativa em tabela — os dois gráficos, por extenso. */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {serieAnos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[.85em]">
                    <caption className="mb-2 text-left text-[.82em] text-text-soft">
                      Tabela — alternativa em texto ao gráfico &quot;por ano&quot;.
                    </caption>
                    <thead>
                      <tr className="border-b border-border text-left text-text">
                        <th className="py-1.5 pr-3 font-medium">Ano</th>
                        <th className="py-1.5 text-right font-medium">Normas</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-soft">
                      {serieAnos.map((a) => (
                        <tr key={a.ano} className="border-b border-border/60">
                          <td className="py-1.5 pr-3 font-medium text-text">{a.ano}</td>
                          <td className="py-1.5 text-right tabular-nums">{formatNumberBR(a.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {serieOrgaos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[.85em]">
                    <caption className="mb-2 text-left text-[.82em] text-text-soft">
                      Tabela — alternativa em texto ao gráfico &quot;por órgão emissor&quot;.
                    </caption>
                    <thead>
                      <tr className="border-b border-border text-left text-text">
                        <th className="py-1.5 pr-3 font-medium">Órgão</th>
                        <th className="py-1.5 text-right font-medium">Normas</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-soft">
                      {serieOrgaos.map((o) => (
                        <tr key={o.rotulo} className="border-b border-border/60">
                          <td className="py-1.5 pr-3 font-medium text-text">{o.rotulo}</td>
                          <td className="py-1.5 text-right tabular-nums">{formatNumberBR(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <section className="mt-10">
        <BuscaLegislacaoUnificada corpus={compactar(estaduais)} criticas={criticas} precedentes={precedentes} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem cada item</h2>
        <dl className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <div>
            <dt className="font-semibold text-text">ALMG — Assembleia Legislativa de MG (estadual)</dt>
            <dd>
              Leis, decretos e leis complementares do Legislativo e do Executivo estaduais. As normas
              aqui vêm das ~2.500 &quot;normas básicas&quot; publicadas pela própria ALMG, filtradas
              localmente pelo tema oficial &quot;Meio Ambiente&quot; que a ALMG já atribui a cada uma.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Semad — Banco de Legislação Ambiental (estadual)</dt>
            <dd>
              Cobre o que a ALMG não tem: Deliberação Copam, Portaria IEF, Portaria Igam, Resolução
              Conjunta dos órgãos do Sisema — atos administrativos, não leis da Assembleia.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Siam — arquivo histórico (estadual)</dt>
            <dd>
              Sistema de legislação ambiental mais antigo da Semad, cobrindo até 2024. Soma um volume
              maior e um identificador (idNorma) que as outras duas fontes não têm.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">MMA — legislação ambiental federal, inclusive Conama</dt>
            <dd>
              Catálogo de dados abertos do Ministério do Meio Ambiente e Mudança do Clima (licença
              Creative Commons Atribuição): leis, decretos, portarias do Ibama e do ICMBio, instruções
              normativas e as Resoluções Conama. É a esfera que faltava — até 14/08/2026 esta busca
              não tinha uma única norma federal, nem a Resolução Conama que rege o licenciamento que
              o próprio portal publica. Cada norma traz a situação declarada pela fonte (vigente,
              revogada, ato exaurido), mostrada no card: uma portaria revogada não pode ter a mesma
              cara de uma norma em vigor.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">CNDH — resoluções e recomendações (federal)</dt>
            <dd>
              Conselho Nacional dos Direitos Humanos, nas duas plataformas em que ele publica (a
              página de resoluções do gov.br/mdh e o componente de recomendações do Brasil
              Participativo). Licença Creative Commons Atribuição-SemDerivações: a ementa aqui é{" "}
              <strong className="font-semibold text-text">citação literal</strong> do CNDH, nunca
              reescrita. Inclui a Resolução nº 1/2019, sobre a missão emergencial a Brumadinho depois
              do rompimento da barragem.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Direito Crítico Popular (nacional e internacional)</dt>
            <dd>
              Carga inicial curada em torno de barragens e populações atingidas (Mariana, Brumadinho,
              o Movimento dos Atingidos por Barragens) — ver a seção de cobertura desigual abaixo.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[.9em] text-text-soft">
          O que ainda falta: legislação{" "}
          <strong className="font-semibold text-text">municipal</strong> — as leis ambientais das
          câmaras de vereadores não entraram nesta busca. A esfera já está reservada no banco e no
          filtro por esfera; fica dito aqui em vez de a lacuna passar despercebida.
        </p>
        <p className="mt-3 text-[.9em] text-text-soft">
          Tombamento de patrimônio cultural (histórico, paisagístico, arquitetônico) é o mesmo tipo
          de restrição territorial que a legislação ambiental impõe, mas não é norma — é um registro
          de bem protegido. Por isso tem acervo próprio:{" "}
          <Link href="/patrimonio-cultural" className="text-accent hover:underline">
            153 bens tombados pelo IEPHA-MG →
          </Link>
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Como o tema de cada item é decidido</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          A ALMG é a única fonte estadual que atribui, a cada norma, uma taxonomia oficial própria (o
          campo &quot;indexação&quot; da sua API de dados abertos). Os 9 temas estaduais do filtro
          (os 8 originais + &quot;Proteção de serras&quot;, adicionado em 13/08/2026 depois de medir
          180 normas com &quot;serra&quot; na ementa e confirmar um ramo oficial da própria taxonomia
          da ALMG — <code className="font-mono text-[.85em]">/Relevo/Serra (Relevo)</code>) nasceram
          de ramos REAIS dessa taxonomia, cruzados com palavra-chave auditável na ementa (regras em{" "}
          <code className="font-mono text-[.85em]">etl/temas_ambientais.py</code>). Semad e Siam não
          publicam taxonomia equivalente — para essas ~6.300 normas o tema vem só de palavra-chave,
          indício de conteúdo, não afirmação oficial.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          O MMA publica taxonomia própria por norma (o campo &quot;assunto&quot;: biodiversidade,
          licenciamento ambiental, pesca, áreas protegidas...), guardada junto com cada linha. Mas é
          um vocabulário plano, diferente da árvore da ALMG, e o classificador não sabe traduzir um
          no outro — então, na prática, as normas federais também recebem tema só por palavra-chave
          na ementa. Isso está dito aqui em vez de a taxonomia guardada dar a impressão de um rigor
          que ela ainda não produz na tela.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Os 6 temas exclusivos da legislação nacional/internacional (indígena, quilombola, povos e
          comunidades tradicionais, direitos humanos, rios, espécies) não têm campo de tema na
          fonte — cada atribuição saiu da leitura do texto de cada lei/precedente{" "}
          <strong className="font-semibold text-text">feita com auxílio de inteligência artificial</strong>
          , registrada linha a linha em{" "}
          <code className="font-mono text-[.85em]">etl/temas_direito_critico.py</code>, com o trecho
          que sustenta cada tema — reexecutável e auditável item a item, mas curadoria assistida por
          máquina, não leitura humana de ponta a ponta, e{" "}
          <strong className="font-semibold text-text">está em revisão</strong>.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          O tema &quot;Proteção de serras&quot; usa o MESMO slug nos dois vocabulários (estadual e
          nacional/internacional) de propósito — é o que faz o chip somar as duas fontes no filtro
          acima sem tabela de tradução. Os outros temas parecidos entre si (Recursos Hídricos
          estadual vs. Rios nacional/internacional; Fauna e Flora estadual vs. Espécies
          nacional/internacional) continuam com slugs distintos: o método por trás de cada um é
          diferente — um é regra sobre ementa administrativa, o outro é leitura de um material
          jurídico curado — e fundir os dois fingiria uma origem comum que não existe.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Esta página dizia, até 13/08/2026, que a atribuição de tema do acervo nacional/internacional
          vinha de &ldquo;leitura humana&rdquo;. Não vinha, e a correção está aqui em vez de sumir no
          histórico: quem cobra procedência dos outros deve o mesmo padrão sobre si. Se você encontrar
          um tema que o trecho citado não sustenta, é erro nosso — e é exatamente o tipo de erro que
          esta revisão procura.
        </p>
      </section>
    </div>
  );
}
