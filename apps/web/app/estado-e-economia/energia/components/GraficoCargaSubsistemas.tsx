import {
  formatarGeracaoGw,
  formatarMesCurto,
  type SerieCarga,
} from "@/lib/energia/pagina";

/**
 * Gráfico de linhas da carga mensal por subsistema — SVG nativo, sem
 * biblioteca de gráfico.
 *
 * Fonte do dado: ONS, `carga-energia` (https://dados.ons.org.br/dataset/carga-energia),
 * em MWmed. A conversão para GWmed é só de escala: o eixo numérico curto cabe
 * em 390 px sem encolher o texto abaixo de 12 px.
 *
 * Acessibilidade:
 * - `role="img"` + `<title>`/`aria-label` resumem o que o desenho mostra;
 * - a cor nunca é o único canal: cada série tem traço próprio (contínuo,
 *   tracejado, pontilhado, traço-ponto) e o rótulo no fim da linha;
 * - a tabela equivalente fica logo abaixo, na página.
 */

/** Cor e padrão de traço por subsistema — as vars acompanham o tema. */
const ESTILO: Record<string, { cor: string; tracejado?: string }> = {
  SE: { cor: "var(--cp-ord-1, #102f5e)" },
  S: { cor: "var(--cp-ord-2, #186aa8)", tracejado: "7 4" },
  NE: { cor: "var(--cp-tertiary, #8a5300)", tracejado: "2 4" },
  N: { cor: "var(--cp-accent, #0e8f6e)", tracejado: "9 3 2 3" },
};

const LARGURA = 640;
const ALTURA = 300;
const MARGENS = { esquerda: 34, direita: 70, topo: 58, baixo: 32 };

export interface GraficoCargaSubsistemasProps {
  meses: string[];
  series: SerieCarga[];
  titulo: string;
  subtitulo?: string;
}

/** Caminho SVG que quebra em segmentos quando falta um mês. */
function caminho(pontos: Array<number | null>, xDe: (i: number) => number, yDe: (v: number) => number) {
  let d = "";
  let aberto = false;
  pontos.forEach((valor, i) => {
    if (valor === null) {
      aberto = false;
      return;
    }
    d += `${aberto ? "L" : "M"} ${xDe(i).toFixed(1)} ${yDe(valor).toFixed(1)} `;
    aberto = true;
  });
  return d.trim();
}

/**
 * Empurra rótulos que colidiriam no fim da linha, de baixo para cima.
 * Sem isso, Sul e Nordeste (14,4 e 15,7 GWmed) escreveriam um sobre o outro.
 */
function rotulosSemSobreposicao(
  itens: Array<{ y: number; texto: string; cor: string }>,
  minimo: number,
  maximo: number,
) {
  const ordenados = [...itens].sort((a, b) => b.y - a.y);
  let anterior = Infinity;
  for (const item of ordenados) {
    if (item.y > anterior - 17) item.y = anterior - 17;
    anterior = item.y;
  }
  const menor = Math.min(...ordenados.map((i) => i.y));
  if (menor < minimo) {
    const sobra = minimo - menor;
    for (const item of ordenados) item.y += sobra;
  }
  for (const item of ordenados) item.y = Math.min(item.y, maximo);
  return ordenados;
}

export default function GraficoCargaSubsistemas({
  meses,
  series,
  titulo,
  subtitulo,
}: GraficoCargaSubsistemasProps) {
  const alturaPlot = ALTURA - MARGENS.topo - MARGENS.baixo;
  const larguraPlot = LARGURA - MARGENS.esquerda - MARGENS.direita;

  const valores = series.flatMap((s) => s.pontos).filter((v): v is number => v !== null);
  if (meses.length === 0 || valores.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-soft">
        Sem carga mensal publicada para o período.
      </p>
    );
  }

  const emGw = valores.map((v) => v / 1000);
  const teto = Math.max(10, Math.ceil(Math.max(...emGw) / 10) * 10);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(teto * f));

  const xDe = (i: number) =>
    MARGENS.esquerda + (i / Math.max(1, meses.length - 1)) * larguraPlot;
  const yDe = (mw: number) =>
    MARGENS.topo + alturaPlot - (mw / 1000 / teto) * alturaPlot;

  const rotulosFinais = rotulosSemSobreposicao(
    series
      .filter((s) => s.pontos[s.pontos.length - 1] !== null)
      .map((s) => ({
        y: yDe(s.pontos[s.pontos.length - 1] as number),
        texto: `${s.codigo} ${formatarGeracaoGw(s.pontos[s.pontos.length - 1] as number)}`,
        cor: ESTILO[s.codigo]?.cor ?? "var(--cp-primary)",
      })),
    MARGENS.topo,
    MARGENS.topo + alturaPlot,
  );

  const resumo = series
    .map((s) => {
      const ultimo = [...s.pontos].reverse().find((v) => v !== null) ?? null;
      return `${s.rotulo}: ${ultimo === null ? "sem dado" : `${formatarGeracaoGw(ultimo)} GWmed`}`;
    })
    .join("; ");

  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="font-display text-base font-semibold text-text">{titulo}</h3>
        {subtitulo && <p className="mt-0.5 text-sm text-text-soft">{subtitulo}</p>}
      </figcaption>

      <div className="mx-auto max-w-[700px] overflow-x-auto rounded-xl border border-border bg-surface p-2">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          role="img"
          aria-label={`Carga média mensal por subsistema, em GWmed. ${resumo}.`}
          className="mx-auto h-auto w-full min-w-[600px] max-w-[680px]"
        >
          <title>{`${titulo}. Carga média mensal por subsistema, em GWmed.`}</title>

          {/* legenda dentro do gráfico: traço real + nome, em duas linhas */}
          {series.map((s, i) => {
            const coluna = i % 2;
            const linha = Math.floor(i / 2);
            const x = MARGENS.esquerda + coluna * (larguraPlot / 2);
            const y = 12 + linha * 17;
            const estilo = ESTILO[s.codigo] ?? { cor: "var(--cp-primary)" };
            return (
              <g key={s.codigo}>
                <line
                  x1={x}
                  y1={y}
                  x2={x + 18}
                  y2={y}
                  stroke={estilo.cor}
                  strokeWidth={3}
                  strokeDasharray={estilo.tracejado}
                  strokeLinecap="round"
                />
                <text x={x + 23} y={y + 4} fontSize={13} fill="currentColor" className="text-text-soft">
                  {s.curto}
                </text>
              </g>
            );
          })}

          {/* grade + eixo Y */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGENS.esquerda}
                y1={yDe(tick * 1000)}
                x2={MARGENS.esquerda + larguraPlot}
                y2={yDe(tick * 1000)}
                stroke="var(--cp-chart-grid, #e2e8f0)"
                strokeWidth={1}
              />
              <text
                x={MARGENS.esquerda - 6}
                y={yDe(tick * 1000) + 4}
                textAnchor="end"
                fontSize={13}
                fill="currentColor"
                className="font-tabular text-text-soft"
              >
                {tick}
              </text>
            </g>
          ))}
          <text
            x={MARGENS.esquerda + 2}
            y={MARGENS.topo - 10}
            textAnchor="start"
            fontSize={12}
            fill="currentColor"
            className="text-text-soft"
          >
            GWmed
          </text>

          {/* eixo X: janeiro de cada ano, mais o último mês */}
          {meses.map((mes, i) => {
            const mostrar = mes.endsWith("-01") || i === meses.length - 1;
            if (!mostrar) return null;
            const ancora = i === 0 ? "start" : i === meses.length - 1 ? "end" : "middle";
            return (
              <text
                key={mes}
                x={xDe(i)}
                y={ALTURA - 8}
                textAnchor={ancora}
                fontSize={12}
                fill="currentColor"
                className="text-text-soft"
              >
                {formatarMesCurto(mes)}
              </text>
            );
          })}

          {/* séries */}
          {series.map((s) => {
            const estilo = ESTILO[s.codigo] ?? { cor: "var(--cp-primary)" };
            const ultimo = s.pontos[s.pontos.length - 1];
            return (
              <g key={s.codigo}>
                <path
                  d={caminho(s.pontos, xDe, yDe)}
                  fill="none"
                  stroke={estilo.cor}
                  strokeWidth={2.5}
                  strokeDasharray={estilo.tracejado}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {ultimo !== null && (
                  <circle cx={xDe(s.pontos.length - 1)} cy={yDe(ultimo)} r={3} fill={estilo.cor} />
                )}
              </g>
            );
          })}

          {/* rótulo no fim de cada linha: cor não é o único canal */}
          {rotulosFinais.map((r) => (
            <text
              key={r.texto}
              x={MARGENS.esquerda + larguraPlot + 6}
              y={r.y + 4}
              fontSize={13}
              fontWeight={600}
              fill={r.cor}
              className="font-tabular"
            >
              {r.texto}
            </text>
          ))}
        </svg>
      </div>
      <p className="mt-1 text-xs text-text-soft sm:hidden">← deslize o gráfico para ver os 36 meses →</p>
    </figure>
  );
}
