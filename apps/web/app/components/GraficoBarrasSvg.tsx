import React from "react";
import { BarraAnimadaSvg } from "@/app/components/dados/BarraAnimada";

/**
 * Gráfico de barras em SVG nativo — sem biblioteca de gráfico externa.
 * O desenho é animado via BarraAnimadaSvg com transform scaleX/scaleY.
 */
export interface ItemGraficoBarras {
  rotulo: string;
  valor: number;
  cor?: string;
  detalhe?: string;
}

export interface GraficoBarrasSvgProps {
  itens: ItemGraficoBarras[];
  titulo: string;
  subtitulo?: string;
  descricaoAcessivel?: string;
  corPadrao?: string;
  orientacao?: "horizontal" | "vertical";
  altura?: number;
  largura?: number;
  unidade?: string;
  prefixo?: string;
}

interface RenderProps {
  itens: ItemGraficoBarras[];
  titulo: string;
  subtitulo?: string;
  descricaoAcessivel?: string;
  corPadrao: string;
  altura?: number;
  largura: number;
  unidade: string;
  prefixo: string;
  maxVal: number;
}

function BarrasHorizontaisSvg(p: RenderProps) {
  const alturaCalc = p.altura || Math.max(160, p.itens.length * 36 + 40);
  const margemEsq = 140;
  const margemDir = 80;
  // Barra curta e figura centrada: o valor fica logo ao lado da barra em vez de
  // no canto da tela. O teto de 320 unidades evita a barra de 500 px que
  // cansava a vista no cabeçalho largo.
  const plotLargura = Math.min(p.largura - margemEsq - margemDir, 320);
  const larguraSvg = margemEsq + plotLargura + margemDir;
  const alturaBarra = 18;
  const margemTopo = 20;
  const espacamento = (alturaCalc - margemTopo - 20) / p.itens.length;

  return (
    <figure className="mx-auto w-full max-w-xl">
      {p.titulo && <h3 className="font-display text-base font-semibold text-text">{p.titulo}</h3>}
      {p.subtitulo && <p className="mb-3 text-xs text-text-soft">{p.subtitulo}</p>}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${larguraSvg} ${alturaCalc}`}
          role="img"
          aria-label={p.descricaoAcessivel || `${p.titulo}. Total de ${p.itens.length} categorias.`}
          className="h-auto w-full min-w-[320px]"
        >
          {p.itens.map((item, i) => {
            const y = margemTopo + i * espacamento;
            const w = Math.max(2, (item.valor / p.maxVal) * plotLargura);
            const cor = item.cor || p.corPadrao;
            return (
              <g key={item.rotulo + i}>
                <text
                  x={margemEsq - 10}
                  y={y + alturaBarra / 2 + 4}
                  textAnchor="end"
                  fontSize={13}
                  fill="currentColor"
                  className="text-text-soft truncate"
                >
                  {item.rotulo.length > 20 ? `${item.rotulo.slice(0, 18)}…` : item.rotulo}
                </text>
                <BarraAnimadaSvg
                  x={margemEsq}
                  y={y}
                  width={w}
                  height={alturaBarra}
                  rx={4}
                  fill={cor}
                  className="opacity-85"
                />
                <text
                  x={margemEsq + w + 8}
                  y={y + alturaBarra / 2 + 4}
                  textAnchor="start"
                  fontSize={13}
                  fontWeight="bold"
                  fill="currentColor"
                  className="font-tabular text-text"
                >
                  {p.prefixo}{item.valor.toLocaleString("pt-BR")}{p.unidade}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

function BarrasVerticaisSvg(p: RenderProps) {
  const alturaVert = p.altura || 240;
  const margemEsq = 50;
  const margemDir = 20;
  const margemTopo = 25;
  const margemBaixo = 40;
  const plotLargura = p.largura - margemEsq - margemDir;
  const plotAltura = alturaVert - margemTopo - margemBaixo;
  const larguraBarra = Math.min(40, (plotLargura / p.itens.length) * 0.65);
  const passo = plotLargura / p.itens.length;

  return (
    <figure className="w-full">
      {p.titulo && <h3 className="font-display text-base font-semibold text-text">{p.titulo}</h3>}
      {p.subtitulo && <p className="mb-3 text-xs text-text-soft">{p.subtitulo}</p>}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${p.largura} ${alturaVert}`}
          role="img"
          aria-label={p.descricaoAcessivel || `${p.titulo}. Total de ${p.itens.length} itens.`}
          className="h-auto w-full min-w-[320px]"
        >
          {p.itens.map((item, i) => {
            const h = (item.valor / p.maxVal) * plotAltura;
            const x = margemEsq + i * passo + (passo - larguraBarra) / 2;
            const y = margemTopo + plotAltura - h;
            const cor = item.cor || p.corPadrao;
            return (
              <g key={item.rotulo + i}>
                <BarraAnimadaSvg
                  x={x}
                  y={y}
                  width={larguraBarra}
                  height={h}
                  rx={4}
                  fill={cor}
                  orientacao="vertical"
                  className="opacity-85"
                />
                <text
                  x={x + larguraBarra / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill="currentColor"
                  className="font-tabular text-text"
                >
                  {p.prefixo}{item.valor.toLocaleString("pt-BR")}{p.unidade}
                </text>
                <text
                  x={x + larguraBarra / 2}
                  y={alturaVert - 15}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                  className="text-text-soft"
                >
                  {item.rotulo}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

export default function GraficoBarrasSvg(props: GraficoBarrasSvgProps) {
  const {
    itens,
    titulo,
    subtitulo,
    descricaoAcessivel,
    corPadrao = "var(--color-primary, #10b981)",
    orientacao = "horizontal",
    altura,
    largura = 700,
    unidade = "",
    prefixo = "",
  } = props;

  if (!itens || itens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-soft">
        Nenhum dado para exibir no gráfico de barras.
      </div>
    );
  }

  const maxVal = Math.max(...itens.map((i) => i.valor), 1);
  const renderProps: RenderProps = {
    itens,
    titulo,
    subtitulo,
    descricaoAcessivel,
    corPadrao,
    altura,
    largura,
    unidade,
    prefixo,
    maxVal,
  };

  if (orientacao === "vertical") {
    return <BarrasVerticaisSvg {...renderProps} />;
  }
  return <BarrasHorizontaisSvg {...renderProps} />;
}
