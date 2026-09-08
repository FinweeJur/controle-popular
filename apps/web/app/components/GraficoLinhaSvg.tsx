import React from "react";

export interface PontoGraficoLinha {
  rotulo: string; // Ex: "2020", "Jan/24", "2026-08"
  valor: number;
  anotacao?: string;
  destaque?: boolean;
}

export interface GraficoLinhaSvgProps {
  pontos: PontoGraficoLinha[];
  titulo: string;
  subtitulo?: string;
  descricaoAcessivel?: string;
  corLinha?: string;
  altura?: number;
  largura?: number;
  unidade?: string;
  prefixo?: string;
}

export default function GraficoLinhaSvg({
  pontos,
  titulo,
  subtitulo,
  descricaoAcessivel,
  corLinha = "var(--color-primary, #10b981)",
  altura = 240,
  largura = 700,
  unidade = "",
  prefixo = "",
}: GraficoLinhaSvgProps) {
  if (!pontos || pontos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-soft">
        Nenhum dado para exibir no gráfico temporal.
      </div>
    );
  }

  const margemEsq = 55;
  const margemDir = 25;
  const margemTopo = 30;
  const margemBaixo = 40;

  const plotLargura = largura - margemEsq - margemDir;
  const plotAltura = altura - margemTopo - margemBaixo;

  const valores = pontos.map((p) => p.valor);
  const minVal = Math.min(...valores);
  const maxVal = Math.max(...valores);
  const faixa = maxVal - minVal || 1;
  const yMin = Math.max(0, minVal - faixa * 0.1);
  const yMax = maxVal + faixa * 0.1;

  const xDe = (index: number) =>
    margemEsq + (index / Math.max(1, pontos.length - 1)) * plotLargura;
  const yDe = (val: number) =>
    margemTopo + plotAltura - ((val - yMin) / (yMax - yMin)) * plotAltura;

  const pathD = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xDe(i).toFixed(1)} ${yDe(p.valor).toFixed(1)}`)
    .join(" ");

  const numTicks = 4;
  const ticksY = Array.from({ length: numTicks + 1 }, (_, i) => {
    const val = yMin + (i / numTicks) * (yMax - yMin);
    return Math.round(val);
  });

  const textoAcessivel =
    descricaoAcessivel ||
    `${titulo}. Série de ${pontos.length} pontos. Menor valor: ${prefixo}${minVal.toLocaleString("pt-BR")}${unidade}. Maior valor: ${prefixo}${maxVal.toLocaleString("pt-BR")}${unidade}.`;

  return (
    <figure className="w-full">
      {titulo && <h3 className="font-display text-base font-semibold text-text">{titulo}</h3>}
      {subtitulo && <p className="mb-3 text-xs text-text-soft">{subtitulo}</p>}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          role="img"
          aria-label={textoAcessivel}
          className="h-auto w-full min-w-[320px]"
        >
          {/* Linhas de grade horizontais e rótulos do eixo Y */}
          {ticksY.map((t) => (
            <g key={t}>
              <line
                x1={margemEsq}
                x2={largura - margemDir}
                y1={yDe(t)}
                y2={yDe(t)}
                stroke="var(--color-chart-grid, rgba(120, 120, 120, 0.15))"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={margemEsq - 8}
                y={yDe(t) + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                className="font-tabular text-text-soft opacity-75"
              >
                {prefixo}
                {t.toLocaleString("pt-BR")}
                {unidade}
              </text>
            </g>
          ))}

          {/* Rótulos do eixo X (amostrados para não sobrepor) */}
          {pontos.map((p, i) => {
            const step = Math.max(1, Math.floor(pontos.length / 8));
            if (i % step !== 0 && i !== pontos.length - 1) return null;
            return (
              <text
                key={p.rotulo + i}
                x={xDe(i)}
                y={altura - 15}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                className="font-tabular text-text-soft opacity-80"
              >
                {p.rotulo}
              </text>
            );
          })}

          {/* Linha do gráfico */}
          <path
            d={pathD}
            fill="none"
            stroke={corLinha}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de destaque e anotações */}
          {pontos.map((p, i) => {
            const isDestaque = p.destaque || i === pontos.length - 1;
            if (!isDestaque && !p.anotacao) return null;
            return (
              <g key={"dot-" + i}>
                <circle
                  cx={xDe(i)}
                  cy={yDe(p.valor)}
                  r={isDestaque ? 4 : 3}
                  fill="var(--color-surface, #ffffff)"
                  stroke={corLinha}
                  strokeWidth={2}
                />
                {p.anotacao && (
                  <text
                    x={xDe(i)}
                    y={yDe(p.valor) - 8}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill="currentColor"
                    className="text-text"
                  >
                    {p.anotacao}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tabela oculta para tecnologias assistivas (WCAG) */}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Período</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.rotulo}>
              <td>{p.rotulo}</td>
              <td>
                {prefixo}
                {p.valor.toLocaleString("pt-BR")}
                {unidade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
