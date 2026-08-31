import { formatNumberBR } from "@/lib/betim/format";

/**
 * Evolução das internações de moradores por ano, em SVG inline (sem
 * biblioteca). Server Component: o `title` nativo dá o tooltip sem JS.
 *
 * Regra do portal (AGENTS.md): gráfico sempre com alternativa em texto —
 * a seção que usa este componente renderiza uma tabela com os mesmos
 * números logo abaixo; cor nunca é o único canal de informação.
 */

export interface PontoInternacoes {
  ano: number;
  internacoes: number;
  obitos: number;
}

const LARGURA = 640;
const ALTURA = 300;
const MARGEM_ESQ = 58;
const MARGEM_DIR = 12;
const MARGEM_TOP = 14;
const MARGEM_BAIXO = 30;

export default function GraficoInternacoesSvg({
  pontos,
}: {
  pontos: PontoInternacoes[];
}) {
  if (pontos.length === 0) return null;

  const ordenados = [...pontos].sort((a, b) => a.ano - b.ano);
  const maxIntern = Math.max(...ordenados.map((p) => p.internacoes), 1);
  const plotW = LARGURA - MARGEM_ESQ - MARGEM_DIR;
  const plotH = ALTURA - MARGEM_TOP - MARGEM_BAIXO;
  const n = ordenados.length;
  const grupoW = plotW / n;
  const barraW = Math.min(36, grupoW * 0.36);
  const escala = (v: number) => MARGEM_TOP + plotH - (v / maxIntern) * plotH;

  const linhasGuia = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-label={`Internações por ano, de ${ordenados[0].ano} a ${ordenados[ordenados.length - 1].ano}. Máximo de ${formatNumberBR(maxIntern)} em um ano.`}
      className="h-auto w-full"
    >
      {/* Linhas de guia + rótulos do eixo Y */}
      {linhasGuia.map((fracao) => {
        const y = escala(maxIntern * fracao);
        return (
          <g key={fracao}>
            <line
              x1={MARGEM_ESQ}
              y1={y}
              x2={LARGURA - MARGEM_DIR}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={fracao === 0 ? undefined : "3 3"}
            />
            <text
              x={MARGEM_ESQ - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-text-soft text-[10px] font-tabular"
            >
              {formatNumberBR(Math.round(maxIntern * fracao))}
            </text>
          </g>
        );
      })}

      {/* Barras de internações por ano */}
      {ordenados.map((p, i) => {
        const x = MARGEM_ESQ + grupoW * i + (grupoW - barraW) / 2;
        const y = escala(p.internacoes);
        const h = plotH + MARGEM_TOP - y;
        return (
          <g key={p.ano}>
            <rect
              x={x}
              y={y}
              width={barraW}
              height={h}
              rx={3}
              className="fill-primary"
            >
              <title>{`${p.ano} — ${formatNumberBR(p.internacoes)} internações · ${formatNumberBR(p.obitos)} óbitos`}</title>
            </rect>
            {/* Valor no topo da barra */}
            <text
              x={x + barraW / 2}
              y={y - 5}
              textAnchor="middle"
              className="fill-text-soft text-[9px] font-tabular"
            >
              {formatNumberBR(p.internacoes)}
            </text>
            {/* Ano no eixo X */}
            <text
              x={x + barraW / 2}
              y={ALTURA - MARGEM_BAIXO + 16}
              textAnchor="middle"
              className="fill-text text-[10px] font-medium"
            >
              {p.ano}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
