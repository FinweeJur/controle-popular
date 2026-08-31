import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import Moeda from "@/app/components/Moeda";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { ZONAS } from "@/lib/zonas";
import acervoBruto from "@/data/vale3-cotacoes.json";

/**
 * `/paraopeba/vale` — timeline do preço das ações da Vale (VALE3) na B3,
 * 2015–2026.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE DENTRO DO PARAOPEBA ═══
 *
 * A zona Paraopeba acompanha a reparação pelo rompimento da barragem da Vale
 * em Brumadinho (25/01/2019). O preço da ação é dado público de mercado que
 * ajuda a ler esse processo — mas é só isso: **não mede o dano nem a
 * reparação**. O texto da página diz isso com todas as letras, antes de
 * qualquer número (regra editorial do portal: dois dados verdadeiros lado a
 * lado não podem deixar o leitor concluir um terceiro, falso).
 *
 * ═══ NÚMERO VEM DO DADO ═══
 *
 * Nada aqui é digitado à mão: os cartões, o gráfico, a linha do tempo e a
 * alternativa em texto são calculados no build a partir de
 * `apps/web/data/vale3-cotacoes.json`, gerado por
 * `apps/web/scripts/coletar-vale3-cotacoes.mts` direto do arquivo COTAHIST da
 * B3 (ver o cabeçalho do coletor: posições conferidas ano a ano, 2015–2026).
 *
 * ═══ COMPONENTE DE SERVIDOR, DE PROPÓSITO ═══
 *
 * A série tem ~2.900 pregões. Se virassem props de um componente `"use
 * client"`, o payload triplicaria (HTML + RSC flight + segmentData), com o
 * nome de todo campo repetido linha a linha — o padrão que travou o deploy em
 * 15/08 (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`). Aqui o array inteiro mora no
 * módulo do servidor; o que o HTML carrega são só os agregados, a amostra do
 * gráfico (~580 pontos, 1 por semana de pregão) e o CSV estático — que nem
 * passa pelo HTML, é asset em `/data/vale3-cotacoes.csv`.
 */

export const metadata: Metadata = metadataEditavel("/paraopeba/vale", {
  title: "Ações da Vale na B3 — Paraopeba | Controle Popular",
  description:
    "O fechamento de VALE3 na B3, pregão a pregão, de 2015 a 2026 — com os rompimentos de Fundão (2015) e Brumadinho (2019) e o Acordo de reparação (2021) marcados na série. Preços brutos de pregão, sem ajuste.",
});

interface CotacaoVale {
  data: string;
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  volume: number;
}

interface AcervoVale {
  fonte: string;
  ultima_atualizacao: string;
  cotacoes: CotacaoVale[];
}

const acervo = acervoBruto as AcervoVale;
const cotacoes = acervo.cotacoes;

/** Cor da frente, do registro único de zonas — nunca hex cravado aqui. */
const COR = ZONAS.find((z) => z.id === "paraopeba")!.cor;

/* ─────────────────────────────── formatação ─────────────────────────────── */

/** Preço em reais com duas casas: "R$ 72,89". */
function precoBR(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Variação percentual com sinal: "+2,35%", "-24,30%". */
function varBR(v: number): string {
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function variacaoPct(anterior: number, atual: number): number {
  return ((atual - anterior) / anterior) * 100;
}

/* ─────────────────────────────── dados derivados ────────────────────────── */

/** Primeiro índice de `cotacoes` com data >= `data` (busca binária). */
function indiceDoDia(data: string): number {
  let lo = 0;
  let hi = cotacoes.length;
  while (lo < hi) {
    const meio = (lo + hi) >> 1;
    if (cotacoes[meio].data < data) lo = meio + 1;
    else hi = meio;
  }
  return lo;
}

const primeiro = cotacoes[0];
const ultimo = cotacoes[cotacoes.length - 1];
const penultimo = cotacoes[cotacoes.length - 2];

const fechamentos = cotacoes.map((c) => c.fechamento);
const maiorFechamento = Math.max(...fechamentos);
const menorFechamento = Math.min(...fechamentos);
const diaMaior = cotacoes.find((c) => c.fechamento === maiorFechamento)!;
const diaMenor = cotacoes.find((c) => c.fechamento === menorFechamento)!;
const variacaoUltimoDia = variacaoPct(penultimo.fechamento, ultimo.fechamento);

/** Os três marcos pedidos, com o número medido no dado de cada um. */
const MARCOS_FIXOS = [
  {
    data: "2015-11-05",
    titulo: "Rompimento de Fundão (Mariana)",
    descricao:
      "A barragem de Fundão, da Samarco — joint venture da Vale com a BHP — rompe em Bento Rodrigues (Mariana/MG): 19 mortos e a lama percorre a bacia do Rio Doce até o mar, no maior desastre ambiental da história do país.",
    cor: "var(--color-alert)",
  },
  {
    data: "2019-01-25",
    titulo: "Rompimento de Brumadinho",
    descricao:
      "A barragem B1 da Mina Córrego do Feijão, da Vale, rompe em Brumadinho/MG: 272 vidas perdidas e a lama desce pelo ribeirão Ferro-Carvão até o Rio Paraopeba. É o desastre que esta zona acompanha.",
    cor: "var(--color-alert)",
  },
  {
    data: "2021-02-04",
    titulo: "Acordo de reparação (R$ 37,69 bi)",
    descricao:
      "MPMG, MPF, DPMG e Governo de Minas assinam com a Vale o Acordo Judicial de Reparação, de R$ 37,69 bilhões — o maior da história do país. É ele que financia o PTR e os Anexos que esta zona acompanha.",
    cor: COR,
  },
] as const;

/** Reação medida na série para o rompimento de Fundão (05/11/2015, 15h30). */
function reacaoFundao(): string | null {
  const c4 = cotacoes[indiceDoDia("2015-11-04")];
  const c5 = cotacoes[indiceDoDia("2015-11-05")];
  const c6 = cotacoes[indiceDoDia("2015-11-06")];
  if (!c4 || !c5 || !c6) return null;
  return (
    `Fechou a ${precoBR(c5.fechamento)} em ${formatDateBR(c5.data)} (o rompimento foi às 15h30, ` +
    `e o papel já caiu ${varBR(variacaoPct(c4.fechamento, c5.fechamento))} no próprio dia); ` +
    `no pregão seguinte, ${precoBR(c6.fechamento)} (${varBR(variacaoPct(c5.fechamento, c6.fechamento))}).`
  );
}

/** Reação para Brumadinho: 25/01/2019 NÃO teve pregão na B3 (feriado municipal). */
function reacaoBrumadinho(): string | null {
  const c24 = cotacoes[indiceDoDia("2019-01-24")];
  const c28 = cotacoes[indiceDoDia("2019-01-28")];
  if (!c24 || !c28) return null;
  return (
    `A B3 não teve pregão em 25/01/2019 — feriado municipal (aniversário de São Paulo) — e o ` +
    `rompimento foi numa sexta sem negociação. A queda apareceu no primeiro pregão seguinte, ` +
    `${formatDateBR(c28.data)}: ${precoBR(c28.fechamento)} (${varBR(variacaoPct(c24.fechamento, c28.fechamento))} ` +
    `contra os ${precoBR(c24.fechamento)} de ${formatDateBR(c24.data)}).`
  );
}

/** Reação para a assinatura do Acordo de reparação (04/02/2021). */
function reacaoAcordo(): string | null {
  const c4 = cotacoes[indiceDoDia("2021-02-04")];
  const c5 = cotacoes[indiceDoDia("2021-02-05")];
  if (!c4 || !c5) return null;
  return `Fechou a ${precoBR(c4.fechamento)} em ${formatDateBR(c4.data)}; no pregão seguinte, ${precoBR(c5.fechamento)} (${varBR(variacaoPct(c4.fechamento, c5.fechamento))}).`;
}

function reacaoDe(data: string): string | null {
  if (data === "2015-11-05") return reacaoFundao();
  if (data === "2019-01-25") return reacaoBrumadinho();
  if (data === "2021-02-04") return reacaoAcordo();
  return null;
}

/** Linha do tempo completa: os três marcos + os extremos da própria série. */
const MARCOS_TIMELINE = [
  ...MARCOS_FIXOS.map((m) => ({ ...m, reacao: reacaoDe(m.data) })),
  {
    data: diaMenor.data,
    titulo: "Menor fechamento da série",
    descricao: `${precoBR(menorFechamento)} — o menor fechamento de VALE3 entre 2015 e 2026, calculado desta própria série (dado coletado, não marco externo).`,
    cor: COR,
    reacao: null as string | null,
  },
  {
    data: diaMaior.data,
    titulo: "Maior fechamento da série",
    descricao: `${precoBR(maiorFechamento)} — o maior fechamento de VALE3 entre 2015 e 2026, calculado desta própria série (dado coletado, não marco externo).`,
    cor: COR,
    reacao: null as string | null,
  },
].sort((a, b) => (a.data < b.data ? -1 : 1));

/* ─────────────────────────────── gráfico SVG ────────────────────────────── */

const LARGURA = 860;
const ALTURA = 340;
const MARGEM_ESQ = 48;
const MARGEM_DIR = 18;
const MARGEM_TOPO = 70; // faixa para os rótulos dos eventos (3 linhas)
const MARGEM_BAIXO = 26;
const PLOT_LARGURA = LARGURA - MARGEM_ESQ - MARGEM_DIR;
const PLOT_ALTURA = ALTURA - MARGEM_TOPO - MARGEM_BAIXO;
/** Um ponto por semana de pregão (~580 pontos para ~2.900 pregões). */
const AMOSTRA_A_CADA = 5;

/** Degraus "redondos" (1/2/2,5/5 × 10^n) para o eixo Y. */
function ticksBonitos(min: number, max: number, n: number): number[] {
  const faixa = max - min;
  const passoBruto = faixa / n;
  const mag = 10 ** Math.floor(Math.log10(passoBruto));
  const normalizado = passoBruto / mag;
  const passo =
    (normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 2.5 ? 2.5 : normalizado <= 5 ? 5 : 10) *
    mag;
  const inicio = Math.ceil(min / passo) * passo;
  const ticks: number[] = [];
  for (let v = inicio; v <= max + 1e-9; v += passo) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

function GraficoVale() {
  const amostra = cotacoes.filter((_, i) => i % AMOSTRA_A_CADA === 0);
  const min = Math.min(...amostra.map((c) => c.fechamento));
  const max = Math.max(...amostra.map((c) => c.fechamento));
  const faixa = max - min || 1;
  const yMin = min - faixa * 0.08;
  const yMax = max + faixa * 0.08;

  const xDe = (posicaoAmostra: number) =>
    MARGEM_ESQ + (posicaoAmostra / Math.max(1, amostra.length - 1)) * PLOT_LARGURA;
  const yDe = (v: number) => MARGEM_TOPO + PLOT_ALTURA - ((v - yMin) / (yMax - yMin)) * PLOT_ALTURA;

  const path = amostra
    .map((c, i) => `${i === 0 ? "M" : "L"}${xDe(i).toFixed(1)},${yDe(c.fechamento).toFixed(1)}`)
    .join("");

  const ticks = ticksBonitos(yMin, yMax, 7);
  const anosEixo = [2015, 2018, 2021, 2024, 2026];
  // Rótulos dos eventos: cada um na sua linha (verificado contra o dado real
  // — duas linhas colidiam com Fundão x Acordo), âncoras viram para dentro
  // para não vazarem do viewBox.
  const LINHAS_ROTULO = [14, 30, 46];
  const ANCORAS: ("start" | "middle" | "end")[] = ["start", "middle", "end"];
  const xDeData = (data: string) => xDe(Math.min(amostra.length - 1, indiceDoDia(data) / AMOSTRA_A_CADA));

  return (
    <figure>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        role="img"
        className="h-auto w-full"
        aria-label={`Linha do fechamento de VALE3 (Vale S.A., B3) de ${primeiro.data} a ${ultimo.data}, em reais. ` +
          `Menor fechamento: ${precoBR(menorFechamento)} em ${formatDateBR(diaMenor.data)}. ` +
          `Maior fechamento: ${precoBR(maiorFechamento)} em ${formatDateBR(diaMaior.data)}. ` +
          `Último fechamento: ${precoBR(ultimo.fechamento)} em ${formatDateBR(ultimo.data)}. ` +
          `Marcos: ${MARCOS_FIXOS.map((m) => `${formatDateBR(m.data)}, ${m.titulo}`).join("; ")}. ` +
          `Preços brutos de pregão, sem ajuste por proventos.`}
      >
        {/* Eixo Y: grade + rótulos. */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGEM_ESQ}
              x2={MARGEM_ESQ + PLOT_LARGURA}
              y1={yDe(t)}
              y2={yDe(t)}
              stroke="var(--color-chart-grid)"
              strokeWidth={1}
            />
            <text
              x={MARGEM_ESQ - 6}
              y={yDe(t) + 3.5}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              className="text-text-soft"
            >
              R$ {t.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </text>
          </g>
        ))}

        {/* Eixo X: anos. */}
        {anosEixo.map((ano) => (
          <text
            key={ano}
            x={xDeData(`${ano}-01-01`)}
            y={MARGEM_TOPO + PLOT_ALTURA + 18}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
            className="text-text-soft"
          >
            {ano}
          </text>
        ))}

        {/* Linha do fechamento. */}
        <path
          d={path}
          fill="none"
          stroke={COR}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Marcos: linha vertical + círculo no fechamento do dia + rótulo. */}
        {MARCOS_FIXOS.map((m, i) => {
          const xi = xDeData(m.data);
          const dia = cotacoes[indiceDoDia(m.data)];
          return (
            <g key={m.data}>
              <line
                x1={xi}
                x2={xi}
                y1={MARGEM_TOPO}
                y2={MARGEM_TOPO + PLOT_ALTURA}
                stroke={m.cor}
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={0.6}
              />
              <circle
                cx={xi}
                cy={yDe(dia.fechamento)}
                r={3.5}
                fill="var(--color-surface)"
                stroke={m.cor}
                strokeWidth={2}
              />
              <text
                x={xi + (ANCORAS[i] === "start" ? 6 : ANCORAS[i] === "end" ? -6 : 0)}
                y={LINHAS_ROTULO[i]}
                textAnchor={ANCORAS[i]}
                fontSize={10}
                fill="currentColor"
                className="text-text-soft"
              >
                {m.titulo}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-[.85em] text-text-soft">
        Fechamento de VALE3 na B3, {formatDateBR(primeiro.data)} a {formatDateBR(ultimo.data)}. Um
        ponto por semana de pregão; preços brutos, sem ajuste por proventos.
      </figcaption>
    </figure>
  );
}

/* ─────────────────────────────── a página ───────────────────────────────── */

export default function ValePage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Ações da Vale na B3</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Ações da Vale na B3
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        {formatNumberBR(cotacoes.length)} pregões de VALE3 — a ação ordinária da Vale na B3 — de{" "}
        {formatDateBR(primeiro.data)} a {formatDateBR(ultimo.data)}. O preço da ação não mede o
        dano do rompimento nem o andamento da reparação: é contexto de mercado, e nada mais.
      </p>

      {/* Navegação integrada do monitoramento Vale no portal */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-border pb-4">
        <a
          href="/paraopeba/vale"
          aria-current="page"
          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
        >
          📈 Cotações B3
        </a>
        <a
          href="/paraopeba/vale/documentos"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-primary hover:text-text"
        >
          📑 Documentos CVM (ITR, DFP, FRE)
        </a>
        <a
          href="/paraopeba/noticias-vale"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-primary hover:text-text"
        >
          📰 Radar de Notícias
        </a>
        <a
          href="/paraopeba/correlacao"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-primary hover:text-text"
        >
          ⚡ Preços × Notícias
        </a>
        <a
          href="/paraopeba/linha-do-tempo"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-soft transition-colors hover:border-primary hover:text-text"
        >
          ⏳ Linha do Tempo da Reparação
        </a>
      </div>

      {/* A ressalva vem ANTES do primeiro número: "fechamento ajustado?" é a
          pergunta que muda a leitura de tudo o que vem depois. */}
      <div className="mt-6 rounded-2xl border border-alert/40 bg-surface-2 p-5">
        <p className="text-[.95em] font-semibold text-text">
          Preço de fechamento ajustado? Não.
        </p>
        <p className="mt-2 text-[.92em] text-text-soft">
          Fonte: B3 — Séries Históricas (COTAHIST). Estes são preços <strong className="text-text">brutos de pregão</strong>,
          sem ajuste por dividendos ou JCP — o gráfico mostra a série, nunca interpretação. Dados
          coletados em {formatDateBR(acervo.ultima_atualizacao)}; último pregão da série:{" "}
          {formatDateBR(ultimo.data)}.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Último fechamento</p>
          <p className="mt-1 font-tabular text-xl font-bold text-text">{precoBR(ultimo.fechamento)}</p>
          <p className="mt-1 text-[.78em] text-text-soft">em {formatDateBR(ultimo.data)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Variação no último dia</p>
          <p className="mt-1 font-tabular text-xl font-bold text-text">{varBR(variacaoUltimoDia)}</p>
          <p className="mt-1 text-[.78em] text-text-soft">
            {formatDateBR(ultimo.data)} contra {formatDateBR(penultimo.data)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Maior fechamento do período</p>
          <p className="mt-1 font-tabular text-xl font-bold text-text">{precoBR(maiorFechamento)}</p>
          <p className="mt-1 text-[.78em] text-text-soft">em {formatDateBR(diaMaior.data)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Menor fechamento do período</p>
          <p className="mt-1 font-tabular text-xl font-bold text-text">{precoBR(menorFechamento)}</p>
          <p className="mt-1 text-[.78em] text-text-soft">em {formatDateBR(diaMenor.data)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Volume do último dia</p>
          <p className="mt-1 font-tabular text-xl font-bold text-text">
            <Moeda value={ultimo.volume} />
          </p>
          <p className="mt-1 text-[.78em] text-text-soft">em {formatDateBR(ultimo.data)}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">A série, de 2015 a 2026</h2>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <GraficoVale />
        </div>

        {/* Alternativa em texto — gráfico nunca é o único canal (regra do repo). */}
        <p className="mt-4 max-w-3xl text-[.92em] text-text-soft">
          Em texto: entre {formatDateBR(primeiro.data)} e {formatDateBR(ultimo.data)}, o
          fechamento de VALE3 foi de {precoBR(menorFechamento)} ({formatDateBR(diaMenor.data)}) a{" "}
          {precoBR(maiorFechamento)} ({formatDateBR(diaMaior.data)}). {reacaoFundao()} {reacaoBrumadinho()}{" "}
          {reacaoAcordo()} O último fechamento da série é {precoBR(ultimo.fechamento)}, em{" "}
          {formatDateBR(ultimo.data)}.
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-[.9em] underline">Ver os marcos em tabela</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-[.9em]">
              <thead className="text-text-soft">
                <tr className="border-b border-border">
                  <th scope="col" className="py-1.5 pr-3 font-medium">Data</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Marco</th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">Fechamento</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Reação medida</th>
                </tr>
              </thead>
              <tbody>
                {MARCOS_TIMELINE.map((m) => {
                  const dia = cotacoes[indiceDoDia(m.data)];
                  return (
                    <tr key={m.data} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 font-tabular">{formatDateBR(m.data)}</td>
                      <td className="py-1.5 pr-3">{m.titulo}</td>
                      <td className="py-1.5 pr-3 text-right font-tabular">
                        {dia ? precoBR(dia.fechamento) : "—"}
                      </td>
                      <td className="py-1.5 text-right font-tabular text-text-soft">
                        {m.reacao ? reacaoCurta(m) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">O que aconteceu perto dessas datas</h2>
        <p className="mt-1 max-w-3xl text-[.9em] text-text-soft">
          O mercado reage a fatos, mas o fato não é o preço: abaixo, o número medido na própria
          série para cada marco. Os três foram precificados no pregão seguinte ao fato — em
          Brumadinho, o pregão seguinte só veio na segunda-feira, 28/01, porque 25/01/2019 foi
          feriado na B3 (aniversário de São Paulo).
        </p>
        <ol className="mt-8 flex flex-col gap-0">
          {MARCOS_TIMELINE.map((m, i) => (
            <li key={`${m.data}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
              {i < MARCOS_TIMELINE.length - 1 && (
                <span aria-hidden="true" className="absolute top-3 left-[7px] h-full w-0.5 bg-border" />
              )}
              <span
                aria-hidden="true"
                className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-surface"
                style={{ backgroundColor: m.cor }}
              />
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="font-tabular text-xs font-semibold text-text-soft">
                  {formatDateBR(m.data)}
                </p>
                <p className="mt-0.5 font-display text-base font-semibold text-text">{m.titulo}</p>
                <p className="mt-1 text-sm text-text-soft">{m.descricao}</p>
                {m.reacao && <p className="mt-1.5 text-[.85em] font-medium text-text">{m.reacao}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Baixar os dados</h2>
        <p className="mt-2 max-w-3xl text-[.92em] text-text-soft">
          <a
            href="/data/vale3-cotacoes.csv"
            download
            className="inline-block rounded-xl border border-border bg-surface px-4 py-2.5 font-semibold text-accent transition-colors hover:border-current"
          >
            Baixar planilha (CSV) — as {formatNumberBR(cotacoes.length)} cotações ↓
          </a>
        </p>
        <p className="mt-2 max-w-3xl text-[.85em] text-text-soft">
          Separador <code className="rounded bg-surface-2 px-1 py-0.5">;</code> e BOM UTF-8 — abre
          direto no Excel brasileiro. Colunas: data, abertura, máxima, mínima, fechamento, volume
          (R$).
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
          Série histórica oficial da{" "}
          <a
            href="https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            B3 — Séries Históricas (COTAHIST) ↗
          </a>
          , baixada em {formatDateBR(acervo.ultima_atualizacao)} pelo coletor{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
            scripts/coletar-vale3-cotacoes.mts
          </code>
          . Nenhum número desta página foi digitado à mão: todos saem do arquivo da B3, e as
          posições de coluna foram conferidas contra o arquivo real de cada ano, 2015 a 2026.
        </p>
        <p className="mt-3 max-w-3xl text-[.93em] text-text-soft">
          A série não é ajustada por proventos: dividendos e JCP pagos pela Vale aparecem como
          queda do preço bruto, e é por isso que a ressalva viaja colada ao gráfico. VALE3 não teve
          desdobramento nem grupamento no período, então a linha é contínua.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}

/** Reação curta para a tabela ("-24,52% no pregão seguinte" / "+3,81% no pregão seguinte"). */
function reacaoCurta(m: { data: string; reacao: string | null }): string {
  const texto = m.reacao ?? "";
  const casamento = /([+-][\d.,]+%)/.exec(texto);
  if (!casamento) return "—";
  return `${casamento[1]} no pregão seguinte`;
}
