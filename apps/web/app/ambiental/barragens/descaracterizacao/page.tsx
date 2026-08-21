import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import { COBERTURA_BARRAGENS_MPMG, agruparPorEmpreendedor } from "@/lib/ambiental/barragens-mpmg";
import { metadataEditavel } from "@/lib/edicoes";
import PainelBarragens from "./PainelBarragens";

/**
 * `/ambiental/barragens/descaracterizacao` — as 45 barragens a montante que
 * o MPMG acompanha em processo de DESCARACTERIZAÇÃO (projeto "Desativando
 * Bombas-relógio", Caoma).
 *
 * ═══ POR QUE ESTA É UMA ROTA FILHA DE `/ambiental/barragens`, E NÃO A
 * MESMA ROTA ═══
 *
 * `/ambiental/barragens/page.tsx` **já existe** e cobre outra coisa: o
 * inventário completo de barragens de MG nos cadastros FEAM e SNISB (549+
 * barragens de todos os usos, ativas). Esta tela cobre um recorte diferente
 * e menor — só as que estão EM PROCESSO DE DESCARACTERIZAÇÃO, acompanhadas
 * pelo MPMG — de uma fonte diferente (WordPress do MPMG, não FEAM/SNISB).
 * Escrever por cima da rota existente apagaria uma tela no ar sobre um
 * assunto distinto; por isso o recorte novo ganha caminho próprio,
 * cross-linkado a partir da página-mãe.
 *
 * ═══ PAYLOAD ═══
 *
 * `BARRAGENS_MPMG` tem 45 registros (~17 KiB) — muito abaixo do teto de
 * 3 MiB gzip do Worker, então a página de servidor importa o array inteiro
 * sem risco (diferente da regra que separa `TAC_POR_PROJETO` do array cru de
 * 848 linhas). A busca/filtro em `PainelBarragens.tsx` é de cliente pela
 * mesma razão de sempre: estado de UI, não payload.
 */

const C = COBERTURA_BARRAGENS_MPMG;
const POR_EMPREENDEDOR = agruparPorEmpreendedor();
const MAX_EMPREENDEDOR = Math.max(...POR_EMPREENDEDOR.map((e) => e.volumeTotalMilM3));

const emAndamento = C.total - C.concluidas;
const volumeConcluidoMilM3 = POR_EMPREENDEDOR.reduce((t, e) => t + e.volumeConcluidoMilM3, 0);
const volumeAndamentoMilM3 = POR_EMPREENDEDOR.reduce((t, e) => t + e.volumeEmAndamentoMilM3, 0);
const volumeTotalConhecidoMilM3 = volumeConcluidoMilM3 + volumeAndamentoMilM3;

function formatarVolume(mil: number): string {
  if (mil === 0) return "0 m³";
  if (mil >= 1000) {
    const milhoes = mil / 1000;
    return `${milhoes.toLocaleString("pt-BR", { maximumFractionDigits: milhoes < 10 ? 2 : 1 })} milhões de m³`;
  }
  return `${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil m³`;
}

export const metadata: Metadata = metadataEditavel("/ambiental/barragens/descaracterizacao", {
  title: "Barragens em descaracterização (MPMG) — Controle Popular · Ambiental",
  description: `As ${formatNumberBR(C.total)} barragens a montante que o MPMG acompanha no projeto "Desativando Bombas-relógio" — quem é o empreendedor, quanto rejeito, e quanto já foi descaracterizado (${formatNumberBR(C.concluidas)} de ${formatNumberBR(C.total)} concluídas). Fonte: barragens.mpmg.mp.br.`,
});

export default function BarragensDescaracterizacaoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/ambiental" className="hover:text-primary">
          Ambiental
        </a>{" "}
        · <Link href="/barragens">Barragens</Link> ·{" "}
        <span className="text-text">Descaracterização (MPMG)</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Barragens
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          As barragens que estão sendo desmontadas, uma a uma
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Depois de Brumadinho, o Ministério Público de Minas Gerais passou a acompanhar publicamente
          a descaracterização das barragens de rejeito a montante — o método que rompeu ali. São{" "}
          <strong className="text-text">{formatNumberBR(C.total)} barragens</strong>, de{" "}
          <strong className="text-text">{formatNumberBR(C.empreendedores)} empreendedores</strong>, em{" "}
          <strong className="text-text">{formatNumberBR(C.municipiosReconhecidos)} municípios</strong>{" "}
          de Minas Gerais.
        </p>
      </header>

      {/* ═══ DECLARAÇÃO — de quem é o dado e o que ele não cobre ═══ */}
      <section
        aria-labelledby="declaracao-barragens-mpmg"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-barragens-mpmg" className="font-display text-base font-semibold text-text">
          De quem é este dado, e o que ele não cobre
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">Fonte:</strong>{" "}
            <a
              href="https://barragens.mpmg.mp.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              barragens.mpmg.mp.br ↗
            </a>{" "}
            — projeto &ldquo;Desativando Bombas-relógio&rdquo; do MPMG (Centro de Apoio Operacional
            do Meio Ambiente). Coletado em {C.medidoEm.split("-").reverse().join("/")}, via a API
            REST do WordPress da fonte.
          </li>
          <li>
            <strong className="text-text">
              Isto não é o inventário completo de barragens de Minas.
            </strong>{" "}
            Para isso existe{" "}
            <Link href="/barragens" className="text-primary underline underline-offset-2 hover:text-accent">
              /ambiental/barragens
            </Link>
            , com os cadastros FEAM e SNISB — centenas de barragens ativas, de todos os usos. Esta
            tela é um recorte menor e específico: só as que o MPMG está acompanhando em processo de
            descaracterização.
          </li>
          <li>
            <strong className="text-text">Cobertura por campo, dos 45 registros:</strong>{" "}
            empreendedor {formatNumberBR(C.comEmpreendedor)}/{formatNumberBR(C.total)} · previsão{" "}
            {formatNumberBR(C.comPrevisao)}/{formatNumberBR(C.total)} · andamento{" "}
            {formatNumberBR(C.comAndamento)}/{formatNumberBR(C.total)} · volume{" "}
            {formatNumberBR(C.comVolume)}/{formatNumberBR(C.total)}. Onde a fonte não publicou um
            campo, esta página mostra a lacuna — nunca um zero inventado.
          </li>
          <li>
            <strong className="text-text">
              {formatNumberBR(C.semMunicipioReconhecido)} sem município reconhecido.
            </strong>{" "}
            A lacuna é do dicionário usado para casar o texto da fonte com o cadastro de municípios
            de MG, não da fonte em si — o nome do município aparece no texto bruto (mostrado como
            &ldquo;município não reconhecido&rdquo;, com o texto original ao lado), só não bateu com
            nenhum município cadastrado.
          </li>
          <li>
            <strong className="text-text">Este portal não afirma irregularidade.</strong> É a
            reprodução do que o MPMG publicou, com link para a ficha de cada barragem na fonte.
          </li>
        </ul>
      </section>

      {/* ═══ AVISO — concluídas vs em andamento ═══ */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-5 text-[.92em] leading-relaxed text-text-soft">
        <p className="font-display text-base font-semibold text-text">
          {formatNumberBR(C.concluidas)} das {formatNumberBR(C.total)} já estão 100% concluídas
        </p>
        <p className="mt-2">
          Quase metade do total. As outras {formatNumberBR(emAndamento)}{" "}
          têm prazo declarado até 2030 ou depois, ou ainda aguardam início de obra. Somar as 45 num
          único &ldquo;total de
          barragens em risco&rdquo; faria uma vitória já concluída parecer um problema do mesmo
          tamanho do que ainda falta — por isso cada número nesta página separa as duas situações.
        </p>
      </section>

      {/* ═══ OS NÚMEROS DE TOPO ═══ */}
      <section aria-labelledby="numeros-barragens-mpmg" className="mt-10">
        <h2 id="numeros-barragens-mpmg" className="font-display text-xl font-bold tracking-tight text-text">
          Em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Barragens acompanhadas
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">{formatNumberBR(C.total)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              100% concluídas
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.concluidas)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Ainda em andamento
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(emAndamento)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Volume de rejeito conhecido
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatarVolume(volumeTotalConhecidoMilM3)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              de {formatNumberBR(C.comVolume)} das {formatNumberBR(C.total)} — {formatNumberBR(C.total - C.comVolume)}{" "}
              sem volume publicado
            </p>
          </div>
        </div>
      </section>

      {/* ═══ O GRÁFICO — volume por empreendedor, com situação ═══ */}
      <section aria-labelledby="grafico-barragens-mpmg" className="mt-10">
        <h2 id="grafico-barragens-mpmg" className="font-display text-xl font-bold tracking-tight text-text">
          Volume por empreendedor, e quanto já foi descaracterizado
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Barra por empreendedor, comprimento proporcional ao volume total conhecido — segmentada
          entre o que já está <strong className="text-text">concluído</strong> e o que ainda está{" "}
          <strong className="text-text">em andamento</strong>. Barragens sem volume publicado entram
          na contagem de barragens, mas não somam em nenhum dos dois segmentos — a tabela completa,
          logo abaixo, declara quantas ficaram de fora da soma em cada empreendedor.
        </p>

        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, uma por empreendedor, comprimento proporcional ao volume
            total conhecido, segmentado entre concluído e em andamento.{" "}
            {POR_EMPREENDEDOR.map(
              (e) =>
                `${e.empreendedor}: ${formatarVolume(e.volumeTotalMilM3)} em ${e.barragens} ${e.barragens === 1 ? "barragem" : "barragens"} (${e.concluidas} concluída${e.concluidas === 1 ? "" : "s"}), sendo ${formatarVolume(e.volumeConcluidoMilM3)} concluído e ${formatarVolume(e.volumeEmAndamentoMilM3)} em andamento${e.semVolumeConhecido > 0 ? `, ${e.semVolumeConhecido} sem volume publicado` : ""}.`,
            ).join(" ")}
          </div>

          <div aria-hidden className="space-y-2.5">
            {POR_EMPREENDEDOR.map((e) => (
              <div key={e.empreendedor} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-right text-[.82em] text-text-soft" title={e.empreendedor}>
                  {e.empreendedor}
                </span>
                <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                  {e.volumeTotalMilM3 > 0 && (
                    <div className="flex h-full" style={{ width: `${(e.volumeTotalMilM3 / MAX_EMPREENDEDOR) * 100}%` }}>
                      {e.volumeEmAndamentoMilM3 > 0 && (
                        <div
                          className="cp-ord-seg cp-ord-seg-1 h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{
                            width: `${(e.volumeEmAndamentoMilM3 / e.volumeTotalMilM3) * 100}%`,
                            background: "var(--color-ord-1)",
                          }}
                          title={`${e.empreendedor} · em andamento: ${formatarVolume(e.volumeEmAndamentoMilM3)}`}
                        />
                      )}
                      {e.volumeConcluidoMilM3 > 0 && (
                        <div
                          className="cp-ord-seg cp-ord-seg-3 h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{
                            width: `${(e.volumeConcluidoMilM3 / e.volumeTotalMilM3) * 100}%`,
                            background: "var(--color-ord-3)",
                          }}
                          title={`${e.empreendedor} · concluído: ${formatarVolume(e.volumeConcluidoMilM3)}`}
                        />
                      )}
                    </div>
                  )}
                </div>
                <span className="w-32 shrink-0 text-[.82em] text-text-soft">
                  {e.volumeTotalMilM3 > 0 ? formatarVolume(e.volumeTotalMilM3) : "sem volume conhecido"}
                </span>
              </div>
            ))}
          </div>

          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="cp-ord-seg cp-ord-seg-1 inline-block h-3 w-3 rounded-sm"
                style={{ background: "var(--color-ord-1)" }}
              />
              Em andamento
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="cp-ord-seg cp-ord-seg-3 inline-block h-3 w-3 rounded-sm"
                style={{ background: "var(--color-ord-3)" }}
              />
              Concluído (100%)
            </span>
          </figcaption>
        </figure>

        {/* Alternativa em texto/tabela — todos os empreendedores, sem cortar. */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[.88em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Tabela completa, todos os {formatNumberBR(POR_EMPREENDEDOR.length)} empreendedores —
              alternativa em texto ao gráfico acima.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-3 font-medium">Empreendedor</th>
                <th className="py-2 pr-3 text-right font-medium">Barragens</th>
                <th className="py-2 pr-3 text-right font-medium">Concluídas</th>
                <th className="py-2 pr-3 text-right font-medium">Volume concluído</th>
                <th className="py-2 pr-3 text-right font-medium">Volume em andamento</th>
                <th className="py-2 text-right font-medium">Sem volume publicado</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {POR_EMPREENDEDOR.map((e) => (
                <tr key={e.empreendedor} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium text-text">{e.empreendedor}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(e.barragens)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(e.concluidas)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {e.volumeConcluidoMilM3 > 0 ? formatarVolume(e.volumeConcluidoMilM3) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {e.volumeEmAndamentoMilM3 > 0 ? formatarVolume(e.volumeEmAndamentoMilM3) : "—"}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {e.semVolumeConhecido > 0 ? formatNumberBR(e.semVolumeConhecido) : "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ AS 45 BARRAGENS, BUSCÁVEIS ═══ */}
      <section aria-labelledby="lista-barragens-mpmg" className="mt-10">
        <h2 id="lista-barragens-mpmg" className="font-display text-xl font-bold tracking-tight text-text">
          Barragem a barragem
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          &ldquo;Andamento&rdquo; nem sempre é um percentual: quando a fonte só publicou uma frase de
          estado (como &ldquo;aguarda o início das obras&rdquo;), é essa frase que aparece — nenhuma
          tela deste portal força isso a virar um número.
        </p>
        <div className="mt-5">
          <PainelBarragens />
        </div>
      </section>

      <section
        aria-labelledby="fonte-barragens-mpmg"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-barragens-mpmg" className="font-display text-base font-semibold text-text">
          De onde vem este dado
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            Projeto &ldquo;Desativando Bombas-relógio&rdquo;, Ministério Público de Minas Gerais
            (Centro de Apoio Operacional do Meio Ambiente) —{" "}
            <a
              href="https://barragens.mpmg.mp.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              barragens.mpmg.mp.br ↗
            </a>
            . Cada barragem é uma publicação individual do site, lida pela API REST pública do
            WordPress da fonte — não é raspagem de HTML.
          </li>
          <li>
            <strong className="text-text">O que este dado não diz:</strong> não cobre condição de
            estabilidade, nível de emergência nem categoria de risco — para isso, ver{" "}
            <Link href="/barragens" className="text-primary underline underline-offset-2 hover:text-accent">
              /ambiental/barragens
            </Link>{" "}
            (FEAM/SNISB). &ldquo;Concluída&rdquo; aqui é sobre a obra de descaracterização, não sobre
            o dano ambiental já causado.
          </li>
        </ul>
        <p className="mt-4 text-[.88em] text-text-soft">
          Ver também: <Link href="/decisoes-lai">decisões de recurso de LAI (CGE-MG)</Link>
        </p>
      </section>
    </div>
  );
}
