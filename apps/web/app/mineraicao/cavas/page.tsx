import type { Metadata } from "next";
import serieDados from "@/data/cavas-serie-mineracao-mg.json";
import estadosDados from "@/data/cavas-estados-mg.json";
import {
  cartoesTopo,
  estadoDaSerie,
  type ItemAmostra,
  type LinhaSerie,
} from "@/lib/cavas/serie";
import TabelaCavas from "./TabelaCavas";

/**
 * `/mineraicao/cavas` — Fase 5 do plano de cavas: a série anual da mineração
 * em Minas Gerais, com o Δ de área por ano e os três estados editoriais.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * A pergunta do dono é "onde a mineração cresceu, e isso é legal?". Ela se
 * responde em DUAS pontas, e as duas leem o MESMO arquivo — é o que impede o
 * globo e esta página de publicarem números diferentes:
 *
 *   1. **quanto cresceu** — série 1985→2024 da camada `mining_age` do
 *      Monitor da Mineração (MapBiomas), agregada por ano de primeira
 *      detecção (`apps/web/data/cavas-serie-mineracao-mg.json`);
 *   2. **é legal?** — cruzamento de uma amostra datada de 120 cavas com a
 *      poligonal da ANM, nos três estados da Fase 3
 *      (`apps/web/data/cavas-estados-mg.json`).
 *
 * ═══ O QUE ESTA PÁGINA NÃO TEM ═══
 *
 * - **Δ por cava individual ano a ano**: exige a série Sentinel-2 de 10 m, e
 *   a rede da máquina de coleta mediu ~5 KB/s em 28/09 — bloqueado, não
 *   calculado. O que existe aqui é Δ agregado por ano, em 30 m.
 * - **Distância de TI/UC, UF além de MG, imagem com data**: não coletados.
 *   A lacuna fica escrita, não escondida (regra editorial § 7).
 * - **"Ilegal"**: o mapa não julga. Receber sinal não é ilícito — a apuração
 *   é da autoridade, e a frase aparece junto do número.
 */

const serie = serieDados.serie as LinhaSerie[];
const itens = estadosDados.itens as ItemAmostra[];
const PUBLICACAO = new Date(serieDados.gerado_em);

const C = cartoesTopo(serie);
const ESTADO = estadoDaSerie(serie, PUBLICACAO);
const RESUMO_ESTADOS = estadosDados.resumo as Record<string, number>;

export const metadata: Metadata = {
  title: "Onde a mineração cresceu em Minas Gerais - Controle Popular",
  description:
    `${serieDados.cobertura.poligonos.toLocaleString("pt-BR")} polígonos de mineração em Minas Gerais, ` +
    `${Math.round(serieDados.cobertura.area_total).toLocaleString("pt-BR")} hectares, do primeiro ano ` +
    `da série (${C.primeiroAno}) ao último (${C.ultimoAno}) — com a resolução da imagem escrita em cada ficha.`,
};

const fmt = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
      {nota ? <p className="mt-2 text-xs text-text-soft">{nota}</p> : null}
    </div>
  );
}

/**
 * Gráfico SVG nativo do Δ de área por ano — sem biblioteca, porque o portal
 * publica para leitor em celular e o vetor sai na impressão nítido.
 *
 * A cor nunca é o único canal: todo valor existe também na tabela abaixo, no
 * CSV e no `aria-label` de cada barra (AGENTS § 8).
 */
function GraficoDelta({ dados }: { dados: LinhaSerie[] }) {
  const W = 720;
  const H = 260;
  const ESQ = 56;
  const DIR = 12;
  const TOPO = 12;
  const BASE = 46;
  const larg = W - ESQ - DIR;
  const alt = H - TOPO - BASE;
  const max = Math.max(...dados.map((d) => d.area));
  const passo = larg / dados.length;
  const larguraBarra = Math.max(3, passo - 3);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((max * f) / 500) * 500);

  return (
    <figure className="rounded-2xl border border-border bg-surface-2 p-5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-labelledby="titulo-grafico desc-grafico"
      >
        <title id="titulo-grafico">
          Área de mineração nova por ano em Minas Gerais, {C.primeiroAno} a {C.ultimoAno}
        </title>
        <desc id="desc-grafico">
          {fmt(dados.length)} barras, uma por ano, com a altura proporcional aos hectares mapeados pela
          primeira vez naquele ano. Maior valor: {fmt(max)} hectares em{" "}
          {dados.reduce((a, b) => (b.area > a.area ? b : a)).ano}. Todos os números estão na tabela abaixo.
        </desc>
        {ticks.map((t) => {
          const y = TOPO + alt - (t / max) * alt;
          return (
            <g key={t}>
              <line x1={ESQ} x2={W - DIR} y1={y} y2={y} stroke="currentColor" opacity="0.18" />
              <text x={ESQ - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor">
                {fmt(t)}
              </text>
            </g>
          );
        })}
        {dados.map((d, i) => {
          const h = Math.max(1, (d.area / max) * alt);
          const x = ESQ + i * passo;
          return (
            <rect
              key={d.ano}
              x={x}
              y={TOPO + alt - h}
              width={larguraBarra}
              height={h}
              fill="var(--cp-primary, #38bdf8)"
              role="graphics-symbol"
              aria-roledescription="barra"
              aria-label={`${d.ano}: ${fmt(d.area)} hectares`}
            >
              <title>{`${d.ano}: ${fmt(d.area)} hectares em ${fmt(d.qtd)} polígonos`}</title>
            </rect>
          );
        })}
        {dados.map((d, i) =>
          d.ano % 5 === 0 || i === dados.length - 1 ? (
            <text
              key={`r${d.ano}`}
              x={ESQ + i * passo + larguraBarra / 2}
              y={H - BASE + 16}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
            >
              {d.ano}
            </text>
          ) : null
        )}
        <text x={ESQ} y={H - 8} fontSize="11" fill="currentColor" opacity="0.75">
          hectares novos por ano — {fmt(serieDados.resolucao_m)} m por pixel, primeira detecção
        </text>
      </svg>
      <figcaption className="mt-3 text-sm text-text-soft">
        Barra de {C.primeiroAno} é o <strong>começo da série</strong>, não um ano em que tudo começou: ali
        cabe o que já existia antes de {C.primeiroAno}.
        {C.picoAno ? ` Maior crescimento depois do começo: ${C.picoAno}.` : ""}
      </figcaption>
    </figure>
  );
}

const ROTULO_ESTADO: Record<string, string> = {
  em_operacao: "Em operação",
  indicio_processual: "Indício processual",
  sem_cadastro_anm: "Sem cadastro na ANM",
};

export default function PaginaCavas() {
  const hoje = serieDados.gerado_em.slice(0, 10).split("-").reverse().join("/");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Mineração · Minas Gerais · dados de {hoje}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Onde a mineração cresceu em Minas Gerais</h1>
        <p className="mt-3 max-w-3xl leading-relaxed">
          Este portal olha {fmt(serieDados.cobertura.poligonos)} polígonos de mineração mapeados por
          satélite entre {C.primeiroAno} e {C.ultimoAno} e responde duas perguntas separadas:{" "}
          <strong>quanto de chão mudou em cada ano</strong> e <strong>isso consta na ANM</strong>. São
          respostas diferentes, e nunca se somam.
        </p>
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={fmt(C.poligonos)}
          rotulo="polígonos de mineração mapeados"
          nota={`série de ${C.qtdAnos} anos, ${C.primeiroAno}→${C.ultimoAno}`}
        />
        <Cartao
          valor={`${fmt(C.area, 1)} ha`}
          rotulo="área mapeada no total"
          nota={`${fmt(C.area / 100, 1)} km² a ${serieDados.resolucao_m} m por pixel`}
        />
        <Cartao
          valor={`${fmt(C.areaFora, 1)} ha`}
          rotulo="fora de todo polígono da ANM"
          nota={`${fmt(C.qtdFora)} polígonos — sem cadastro na área`}
        />
        <Cartao
          valor={String(C.picoAno ?? "—")}
          rotulo="ano do maior crescimento"
          nota={
            C.picoAno
              ? `${fmt(serie.find((l) => l.ano === C.picoAno)?.area ?? 0, 1)} hectares naquele ano`
              : "sem dado"
          }
        />
        <Cartao
          valor={ESTADO.estado === "ativa" ? "Ativa" : ESTADO.estado === "estavel" ? "Estável" : ESTADO.estado === "encerrada" ? "Encerrada" : "Sem dado"}
          rotulo="estado da janela de 24 meses"
          nota={ESTADO.explicacao}
        />
        <Cartao
          valor={fmt(RESUMO_ESTADOS.em_operacao ?? 0)}
          rotulo="amostra em operação (ANM)"
          nota={`de ${estadosDados.amostra} cavas conferidas em ${hoje}`}
        />
        <Cartao
          valor={fmt(RESUMO_ESTADOS.indicio_processual ?? 0)}
          rotulo="amostra com indício processual"
          nota="dentro de polígono da ANM sem autorização de extração"
        />
        <Cartao
          valor={fmt(RESUMO_ESTADOS.sem_cadastro_anm ?? 0)}
          rotulo="amostra sem cadastro na ANM"
          nota="fora de todo polígono — conferir na ANM"
        />
      </section>

      <section aria-label="Área nova por ano" className="mt-6">
        <GraficoDelta dados={serie} />
        <details className="mt-3 rounded-2xl border border-border bg-surface-2 p-5">
          <summary className="cursor-pointer font-medium">
            Ver os mesmos números em tabela ({serie.length} anos)
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="mb-2 text-left text-text-soft">
                Área de mineração nova por ano, em hectares — mesma série do gráfico.
              </caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 pr-4 font-semibold">Ano</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Polígonos</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Área nova (ha)</th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">Acumulado (ha)</th>
                  <th scope="col" className="py-2 text-right font-semibold">Fora da ANM (ha)</th>
                </tr>
              </thead>
              <tbody>
                {serie.map((l) => (
                  <tr key={l.ano} className="border-b border-border/50">
                    <th scope="row" className="py-1.5 pr-4 text-left font-medium tabular-nums">{l.ano}</th>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{fmt(l.qtd)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{fmt(l.area, 1)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{fmt(l.acumulado, 1)}</td>
                    <td className="py-1.5 text-right tabular-nums">{fmt(l.area_fora_sigmine, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section aria-label="Os três estados editoriais" className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-xl font-semibold">É mineração sem processo? Três respostas possíveis</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          Cruzamos {estadosDados.amostra} cavas da série com os polígonos da ANM, com{" "}
          {estadosDados.buffer_m} metros de folga na borda (o mesmo critério do MapBiomas). A amostra é
          fixa e datada — repetir o sorteio reproduz os mesmos {estadosDados.amostra} itens.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["em_operacao", "indicio_processual", "sem_cadastro_anm"] as const).map((e) => (
            <li key={e} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-semibold tabular-nums">{fmt(RESUMO_ESTADOS[e] ?? 0)}</p>
              <p className="mt-1 text-sm font-medium">{ROTULO_ESTADO[e]}</p>
              <p className="mt-2 text-xs text-text-soft">
                {e === "em_operacao"
                  ? "dentro de polígono da ANM em fase que autoriza extrair"
                  : e === "indicio_processual"
                    ? "dentro de polígono da ANM sem autorização de extração — conferir na ANM"
                    : "fora de todo polígono da ANM — o mapa enxerga mineração onde a ANM não tem cadastro"}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
          <strong>Receber sinal não é ilícito.</strong> “Sem cadastro na ANM” pode ser lavra informal,
          garimpo, areia isenta de cadastro, ou um polígono da ANM que não encosta por causa do desenho.
          É o convite para conferir na ANM — a apuração é da autoridade.
        </p>
      </section>

      <section aria-label="Amostra de cavas" className="mt-6">
        <TabelaCavas itens={itens} dataColeta={estadosDados.gerado_em} />
      </section>

      <section aria-label="Fonte e método" className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Fonte</dt>
            <dd>
              <a
                href={serieDados.fonte_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {serieDados.fonte}
              </a>{" "}
              — camada <code>{serieDados.camada}</code>.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Licença</dt>
            <dd>{serieDados.licenca}</dd>
          </div>
          <div>
            <dt className="font-semibold">Método</dt>
            <dd>{serieDados.metodo}.</dd>
          </div>
          <div>
            <dt className="font-semibold">Resolução</dt>
            <dd>{serieDados.resolucao_aviso}.</dd>
          </div>
          <div>
            <dt className="font-semibold">Unidade da área</dt>
            <dd>{serieDados.area_unidade}.</dd>
          </div>
          <div>
            <dt className="font-semibold">Cruzamento ANM</dt>
            <dd>
              {estadosDados.fonte}. Buffer de {estadosDados.buffer_m} m. Amostra de{" "}
              {estadosDados.amostra} cavas (semente {estadosDados.semente}).
            </dd>
          </div>
        </dl>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Ressalva:</strong> {serieDados.ressalva}. {estadosDados.ressalva}.
        </p>
        <p className="mt-2 text-text-soft">
          Plano completo, com as medições datadas:{" "}
          <code>docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md</code>, seção Fase 3.
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela acima é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que
          está filtrado na tela, com separador <code>;</code> e BOM UTF-8 para abrir no Excel brasileiro.
        </p>
      </section>
    </main>
  );
}
