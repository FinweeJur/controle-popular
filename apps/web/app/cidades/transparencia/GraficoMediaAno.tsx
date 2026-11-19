import type { SerieAno } from "@/lib/pntp/pagina";

/**
 * ═══ GRÁFICO DA MÉDIA DE ITP EM MG, 2022–2025 ═══
 *
 * O que é:
 *   SVG nativo (sem biblioteca de gráfico) com a média do ITP dos entes de MG
 *   por ciclo, o N de avaliados em cada ponto e a linha tracejada da média
 *   nacional do mesmo ciclo.
 *
 * Fonte oficial:
 *   Atricon — PNTP, https://pntp.atricon.org.br/dados-abertos/. Médias e N vêm
 *   de `apps/web/data/pntp/` (`avaliacoes-mg.json` e `resumo-brasil.json`).
 *
 * Por que foi feito assim:
 *   - **2023 é atípico em MG**: só 14 entes avaliados. O trecho que toca 2023
 *     é tracejado e a faixa do ano fica sombreada, com o motivo escrito — sem
 *     isso o pico de 75,1 vira "MG melhorou em 2023", que é falso.
 *   - **Eixo de 0 a 100**, a escala real do índice: truncar o eixo faria a
 *     diferença entre 54,4 e 66,6 parecer maior do que é.
 *   - **N escrito abaixo de cada ano**, não só no tooltip: média sem N é o
 *     erro que esta página existe para evitar.
 *   - Texto do SVG a partir de 12 px na tela de 390 px (viewBox de 380 px de
 *     largura, fonte 13), e a tabela logo abaixo é a alternativa textual.
 */

interface PontoBrasil {
  ano: number;
  media: number | null;
  n: number;
}

const LARGURA = 380;
const ALTURA = 290;
const PLOT_ESQ = 32;
const PLOT_DIR = 360;
const PLOT_TOPO = 30;
const PLOT_BASE = 220;
const ESCALA_Y = (PLOT_BASE - PLOT_TOPO) / 100;

/** Posição X de cada ciclo: passo fixo de 96 px a partir de 62. */
const X_DE = (indice: number) => 62 + indice * 96;
const Y_DE = (valor: number) => PLOT_BASE - valor * ESCALA_Y;

/** Número com separador de milhar do jeito brasileiro, sem ICU. */
function milhar(valor: number): string {
  return String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function umaCasa(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(1).replace(".", ",");
}

export default function GraficoMediaAno({
  serie,
  brasil,
}: {
  serie: SerieAno[];
  brasil: PontoBrasil[];
}) {
  const pontos = serie.map((item, indice) => ({
    ...item,
    x: X_DE(indice),
    y: item.media === null ? null : Y_DE(item.media),
    nacional: brasil.find((b) => b.ano === item.ano) ?? null,
  }));
  const comNacional = pontos.filter((p) => p.nacional?.media !== null);

  /** Caminho de uma série, quebrando quando falta valor. */
  function caminho(
    lista: Array<{ x: number; y: number | null }>
  ): string {
    return lista
      .map((p, i) => (p.y === null ? "" : `${i === 0 ? "M" : "L"} ${p.x} ${p.y.toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
  }

  const caminhoBrasil = caminho(
    comNacional.map((p) => ({ x: p.x, y: p.nacional?.media == null ? null : Y_DE(p.nacional.media) }))
  );

  const descricao =
    "Média do Índice de Transparência Pública dos entes de Minas Gerais por ciclo: " +
    pontos
      .map(
        (p) =>
          `${p.ano}, média ${umaCasa(p.media)} com ${p.n} avaliados de ${milhar(p.entes)} entes`
      )
      .join("; ") +
    ". Média nacional no mesmo ciclo: " +
    comNacional
      .map((p) => `${p.ano} ${umaCasa(p.nacional?.media ?? null)}`)
      .join("; ") +
    ". Em 2023 só 14 entes de MG foram avaliados: o ponto é atípico e não representa o estado.";

  return (
    <figure className="mt-4 w-full min-w-0">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        role="img"
        aria-label={descricao}
        className="h-auto w-full max-w-lg"
      >
        {/* Faixa do ano atípico */}
        <rect
          x={158 - 42}
          y={PLOT_TOPO}
          width={84}
          height={PLOT_BASE - PLOT_TOPO}
          fill="var(--color-primary)"
          opacity={0.06}
        />
        <line
          x1={158 - 42}
          x2={158 - 42}
          y1={PLOT_TOPO}
          y2={PLOT_BASE}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
        />
        <line
          x1={158 + 42}
          x2={158 + 42}
          y1={PLOT_TOPO}
          y2={PLOT_BASE}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
        />
        <text
          x={158}
          y={20}
          textAnchor="middle"
          fontSize={13}
          fontWeight="700"
          fill="var(--color-text)"
        >
          2023: só 14 avaliados
        </text>

        {/* Grade e eixo Y */}
        {[0, 20, 40, 60, 80, 100].map((valor) => (
          <g key={valor}>
            <line
              x1={PLOT_ESQ}
              x2={PLOT_DIR}
              y1={Y_DE(valor)}
              y2={Y_DE(valor)}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={valor === 0 ? undefined : "3 4"}
            />
            <text
              x={PLOT_ESQ - 6}
              y={Y_DE(valor) + 4}
              textAnchor="end"
              fontSize={13}
              fill="var(--color-text-soft)"
              className="font-tabular"
            >
              {valor}
            </text>
          </g>
        ))}

        {/* Linha do Brasil — tracejada */}
        {pontos.length > 1 && (
          <path
            d={caminhoBrasil}
            fill="none"
            stroke="var(--color-text-soft)"
            strokeWidth={2}
            strokeDasharray="7 5"
            strokeLinecap="round"
          />
        )}

        {/* Linha de MG — sólida, exceto nos trechos que tocam 2023 */}
        {pontos.length > 1 &&
          pontos.slice(0, -1).map((p, i) => {
            const seguinte = pontos[i + 1];
            if (p.y === null || seguinte.y === null) return null;
            const tocaAtipico = p.ano === 2023 || seguinte.ano === 2023;
            return (
              <line
                key={`${p.ano}-${seguinte.ano}`}
                x1={p.x}
                y1={p.y}
                x2={seguinte.x}
                y2={seguinte.y}
                stroke="var(--color-primary)"
                strokeWidth={3}
                strokeDasharray={tocaAtipico ? "6 5" : undefined}
                strokeLinecap="round"
              />
            );
          })}

        {/* Pontos do Brasil */}
        {comNacional.map((p) => {
          const y = p.nacional?.media == null ? null : Y_DE(p.nacional.media);
          if (y === null) return null;
          return (
            <circle
              key={`br-${p.ano}`}
              cx={p.x}
              cy={y}
              r={3}
              fill="var(--color-surface)"
              stroke="var(--color-text-soft)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Pontos de MG, com valor e N */}
        {pontos.map((p) => {
          // Rótulo acima do ponto, exceto quando a linha do Brasil passa por
          // cima dele: aí desce, para o número não encostar no tracejado.
          const yBrasil =
            p.nacional?.media == null ? null : Y_DE(p.nacional.media);
          const rotuloAbaixo = p.y !== null && yBrasil !== null && yBrasil < p.y;
          return (
            <g key={`mg-${p.ano}`}>
              {p.y !== null && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={4.5}
                    fill="var(--color-surface)"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                  />
                  <text
                    x={p.x}
                    y={rotuloAbaixo ? p.y + 20 : p.y - 11}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight="700"
                    fill="var(--color-text)"
                    stroke="var(--color-surface)"
                    strokeWidth={4}
                    paintOrder="stroke"
                    className="font-tabular"
                  >
                    {umaCasa(p.media)}
                  </text>
                </>
              )}
              <text
                x={p.x}
                y={PLOT_BASE + 22}
                textAnchor="middle"
                fontSize={13}
                fontWeight="600"
                fill="var(--color-text)"
              >
                {p.ano}
              </text>
              <text
                x={p.x}
                y={PLOT_BASE + 39}
                textAnchor="middle"
                fontSize={13}
                fill={p.ano === 2023 ? "var(--color-alert)" : "var(--color-text-soft)"}
                className="font-tabular"
              >
                N={milhar(p.n)}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-soft">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-[3px] w-5 rounded bg-primary" />
          Minas Gerais (média dos avaliados)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-[3px] w-5 rounded border-t-2 border-dashed border-text-soft"
          />
          Brasil (mesma régua)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-[3px] w-5 rounded border-t-2 border-dashed border-primary"
          />
          trecho que toca 2023 (amostra atípica)
        </span>
      </figcaption>

      {/* Alternativa textual: os mesmos números, em tabela */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[330px] text-xs sm:text-sm">
          <caption className="sr-only">
            Média do ITP por ciclo em Minas Gerais e no Brasil, com o número de avaliados.
          </caption>
          <thead>
            <tr className="bg-surface-2 text-xs text-text-soft uppercase">
              <th scope="col" className="px-2 py-2 text-left sm:px-3">
                Ciclo
              </th>
              <th scope="col" className="px-2 py-2 text-right sm:px-3">
                MG: média
              </th>
              <th scope="col" className="px-2 py-2 text-right sm:px-3">
                MG: N
              </th>
              <th scope="col" className="px-2 py-2 text-right sm:px-3">
                Brasil: média
              </th>
              <th scope="col" className="px-2 py-2 text-right sm:px-3">
                Brasil: N
              </th>
            </tr>
          </thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.ano} className={p.ano === 2023 ? "bg-amber-500/10" : undefined}>
                <th scope="row" className="px-2 py-2 text-left font-medium text-text sm:px-3">
                  {p.ano}
                  {p.ano === 2023 ? " (atípico)" : ""}
                </th>
                <td className="px-2 py-2 text-right font-tabular font-semibold text-text sm:px-3">
                  {umaCasa(p.media)}
                </td>
                <td className="px-2 py-2 text-right font-tabular text-text-soft sm:px-3">
                  {milhar(p.n)}
                </td>
                <td className="px-2 py-2 text-right font-tabular text-text-soft sm:px-3">
                  {umaCasa(p.nacional?.media ?? null)}
                </td>
                <td className="px-2 py-2 text-right font-tabular text-text-soft sm:px-3">
                  {p.nacional ? milhar(p.nacional.n) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
