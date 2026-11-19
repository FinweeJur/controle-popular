import { formatarPercentual, type ParticipacaoFonte } from "@/lib/energia/pagina";

/**
 * Participação de cada fonte na geração — barras verticais em SVG nativo.
 *
 * Fonte: ONS, `balanco-energia-subsistema` (https://dados.ons.org.br/dataset/balanco-energia-subsistema),
 * média ponderada pelas horas dos meses da janela. A escala vai de 0 a 100%,
 * então a barra da térmica não cresce só porque é a menor: o desenho mostra a
 * fatia real do total.
 *
 * Acessibilidade: `role="img"` + `<title>`, valor escrito acima de cada barra e
 * nome embaixo. A térmica ainda carrega hachura, para quem imprime em preto e
 * branco não depender da cor.
 */

const LARGURA = 380;
const ALTURA = 240;
const MARGENS = { esquerda: 34, direita: 8, topo: 30, baixo: 44 };

/** Cor por fonte — as vars acompanham o tema; térmica fica neutra. */
const COR: Record<string, string> = {
  hidraulica: "var(--cp-ord-1, #102f5e)",
  termica: "var(--cp-text-soft, #4a5568)",
  eolica: "var(--cp-ord-3, #1fa08b)",
  solar: "var(--cp-tertiary, #8a5300)",
};

export interface GraficoParticipacaoFonteProps {
  itens: ParticipacaoFonte[];
  titulo: string;
  subtitulo?: string;
}

export default function GraficoParticipacaoFonte({
  itens,
  titulo,
  subtitulo,
}: GraficoParticipacaoFonteProps) {
  if (itens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-soft">
        Sem geração por fonte publicada para a janela.
      </p>
    );
  }

  const alturaPlot = ALTURA - MARGENS.topo - MARGENS.baixo;
  const larguraPlot = LARGURA - MARGENS.esquerda - MARGENS.direita;
  const passo = larguraPlot / itens.length;
  const larguraBarra = Math.min(44, passo * 0.55);

  const yDe = (percentual: number) =>
    MARGENS.topo + alturaPlot - (Math.min(100, Math.max(0, percentual)) / 100) * alturaPlot;

  const descricao = itens
    .map((i) => `${i.rotulo}: ${formatarPercentual(i.percentual)}`)
    .join("; ");

  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="font-display text-base font-semibold text-text">{titulo}</h3>
        {subtitulo && <p className="mt-0.5 text-sm text-text-soft">{subtitulo}</p>}
      </figcaption>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface p-2">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          role="img"
          aria-label={`Participação de cada fonte na geração. ${descricao}.`}
          className="mx-auto h-auto w-full min-w-[320px] max-w-[440px]"
        >
          <title>{`${titulo}. ${descricao}.`}</title>
          <defs>
            <pattern
              id="hachura-termica"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="var(--cp-surface, #ffffff)" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="var(--cp-text-soft, #4a5568)"
                strokeWidth="2.5"
              />
            </pattern>
          </defs>

          {/* grade de 0 a 100%, a mesma régua para todas as barras */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={MARGENS.esquerda}
                y1={yDe(tick)}
                x2={MARGENS.esquerda + larguraPlot}
                y2={yDe(tick)}
                stroke="var(--cp-chart-grid, #e2e8f0)"
                strokeWidth={1}
              />
              <text
                x={MARGENS.esquerda - 6}
                y={yDe(tick) + 4}
                textAnchor="end"
                fontSize={12}
                fill="currentColor"
                className="font-tabular text-text-soft"
              >
                {tick}
              </text>
            </g>
          ))}

          {itens.map((item, i) => {
            const centro = MARGENS.esquerda + passo * (i + 0.5);
            const altura = Math.max(2, (item.percentual / 100) * alturaPlot);
            const y = MARGENS.topo + alturaPlot - altura;
            const hachurada = item.fonte === "termica";
            return (
              <g key={item.fonte}>
                <rect
                  x={centro - larguraBarra / 2}
                  y={y}
                  width={larguraBarra}
                  height={altura}
                  rx={3}
                  fill={hachurada ? "url(#hachura-termica)" : COR[item.fonte]}
                  stroke={COR[item.fonte]}
                  strokeWidth={1}
                />
                <text
                  x={centro}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill="currentColor"
                  className="font-tabular text-text"
                >
                  {formatarPercentual(item.percentual)}
                </text>
                <text
                  x={centro}
                  y={ALTURA - 22}
                  textAnchor="middle"
                  fontSize={13}
                  fill="currentColor"
                  className="text-text-soft"
                >
                  {item.rotulo}
                </text>
              </g>
            );
          })}
          <text
            x={MARGENS.esquerda}
            y={ALTURA - 4}
            fontSize={12}
            fill="currentColor"
            className="text-text-soft"
          >
            % da geração total · escala 0 a 100
          </text>
        </svg>
      </div>
    </figure>
  );
}
