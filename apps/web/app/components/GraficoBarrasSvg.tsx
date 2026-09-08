import React from "react";

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

export default function GraficoBarrasSvg({
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
}: GraficoBarrasSvgProps) {
  if (!itens || itens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-soft">
        Nenhum dado para exibir no gráfico de barras.
      </div>
    );
  }

  const valores = itens.map((i) => i.valor);
  const maxVal = Math.max(...valores, 1);

  if (orientacao === "horizontal") {
    const alturaCalculada = altura || Math.max(160, itens.length * 36 + 40);
    const margemEsq = 140;
    const margemDir = 60;
    const margemTopo = 20;
    const plotLargura = largura - margemEsq - margemDir;
    const alturaBarra = 18;
    const espacamento = (alturaCalculada - margemTopo - 20) / itens.length;

    return (
      <figure className="w-full">
        {titulo && <h3 className="font-display text-base font-semibold text-text">{titulo}</h3>}
        {subtitulo && <p className="mb-3 text-xs text-text-soft">{subtitulo}</p>}

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${largura} ${alturaCalculada}`}
            role="img"
            aria-label={descricaoAcessivel || `${titulo}. Total de ${itens.length} categorias.`}
            className="h-auto w-full min-w-[320px]"
          >
            {itens.map((item, i) => {
              const y = margemTopo + i * espacamento;
              const w = Math.max(2, (item.valor / maxVal) * plotLargura);
              const cor = item.cor || corPadrao;

              return (
                <g key={item.rotulo + i}>
                  <text
                    x={margemEsq - 10}
                    y={y + alturaBarra / 2 + 4}
                    textAnchor="end"
                    fontSize={11}
                    fill="currentColor"
                    className="text-text-soft truncate"
                  >
                    {item.rotulo.length > 20 ? `${item.rotulo.slice(0, 18)}…` : item.rotulo}
                  </text>
                  <rect
                    x={margemEsq}
                    y={y}
                    width={w}
                    height={alturaBarra}
                    rx={4}
                    fill={cor}
                    opacity={0.85}
                  />
                  <text
                    x={margemEsq + w + 8}
                    y={y + alturaBarra / 2 + 4}
                    textAnchor="start"
                    fontSize={11}
                    fontWeight="bold"
                    fill="currentColor"
                    className="font-tabular text-text"
                  >
                    {prefixo}
                    {item.valor.toLocaleString("pt-BR")}
                    {unidade}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tabela alternativa para leitores de tela */}
        <table className="sr-only">
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Categoria</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.rotulo}>
                <td>{i.rotulo}</td>
                <td>
                  {prefixo}
                  {i.valor.toLocaleString("pt-BR")}
                  {unidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  }

  // Orientação vertical
  const alturaVertical = altura || 240;
  const margemEsq = 50;
  const margemDir = 20;
  const margemTopo = 25;
  const margemBaixo = 40;
  const plotLargura = largura - margemEsq - margemDir;
  const plotAltura = alturaVertical - margemTopo - margemBaixo;
  const larguraBarra = Math.min(40, (plotLargura / itens.length) * 0.65);
  const passo = plotLargura / itens.length;

  return (
    <figure className="w-full">
      {titulo && <h3 className="font-display text-base font-semibold text-text">{titulo}</h3>}
      {subtitulo && <p className="mb-3 text-xs text-text-soft">{subtitulo}</p>}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${largura} ${alturaVertical}`}
          role="img"
          aria-label={descricaoAcessivel || `${titulo}. Total de ${itens.length} itens.`}
          className="h-auto w-full min-w-[320px]"
        >
          {itens.map((item, i) => {
            const h = (item.valor / maxVal) * plotAltura;
            const x = margemEsq + i * passo + (passo - larguraBarra) / 2;
            const y = margemTopo + plotAltura - h;
            const cor = item.cor || corPadrao;

            return (
              <g key={item.rotulo + i}>
                <rect x={x} y={y} width={larguraBarra} height={h} rx={4} fill={cor} opacity={0.85} />
                <text
                  x={x + larguraBarra / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="bold"
                  fill="currentColor"
                  className="font-tabular text-text"
                >
                  {prefixo}
                  {item.valor.toLocaleString("pt-BR")}
                  {unidade}
                </text>
                <text
                  x={x + larguraBarra / 2}
                  y={alturaVertical - 15}
                  textAnchor="middle"
                  fontSize={10}
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

      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.rotulo}>
              <td>{i.rotulo}</td>
              <td>
                {prefixo}
                {i.valor.toLocaleString("pt-BR")}
                {unidade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
