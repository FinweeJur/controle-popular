import type { Metadata } from "next";
// `next/link` DIRETO (mesmo motivo de app/dados/populares/page.tsx): a página
// mora na raiz, todo caminho interno é absoluto.
import Link from "next/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { COBERTURA_SIGBM } from "@/lib/ambiental/barragens-sigbm";
import { barrasDither, LARGURA_MAXIMA, PASSO_PONTO, RAIO_PONTO, SerieDither } from "@/lib/laboratorio/dither";

/**
 * `/laboratorio` — fase F1 do plano: prova de conceito do gráfico dither
 * (gráfico feito de pontos, estilo mapa de caracteres) sobre UM dataset fixo.
 *
 * Página 100% de servidor: nenhum componente de cliente, nenhuma prop grande
 * (regra 5.1 do AGENTS.md). Sem biblioteca de gráfico nova (regra do dono):
 * o SVG é montado aqui com `barrasDither` (lib/laboratorio/dither.ts).
 *
 * Dataset: barragens de mineração do SIGBM/ANM em MG, agregado por situação
 * operacional (`COBERTURA_SIGBM.porSituacao`) — números medidos do dado real,
 * nunca digitados à mão. O agregado é pequeno (4 valores), então vai ao
 * payload sem risco de inflação.
 */

export const metadata: Metadata = {
  title: "Laboratório — Controle Popular",
  description:
    "Prova de conceito do laboratório de dados: gráfico dither sobre as barragens de mineração do SIGBM/ANM em Minas Gerais.",
};

export default function LaboratorioPage() {
  const serie: readonly SerieDither[] = COBERTURA_SIGBM.porSituacao;
  const barras = barrasDither(serie);

  // Altura do SVG: uma linha por série + folga para o raio dos pontos.
  const altura = serie.length * PASSO_PONTO + RAIO_PONTO * 2;
  // Largura: rótulo de 120px + a faixa de pontos + folga.
  const largura = 120 + LARGURA_MAXIMA * PASSO_PONTO + RAIO_PONTO * 2;

  return (
    // Sem layout.tsx próprio (fora das zonas) — <main> explícito, padrão de
    // app/dados/populares/page.tsx, para o botão global "Ouvir esta página".
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Laboratório</span>
      </nav>

      <header className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Laboratório</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Prova de conceito das fases F1–F7 do plano: um gráfico feito de pontos
          (sem biblioteca de gráfico) sobre um dado fixo. Fase F1 — um gráfico,
          um dataset.
        </p>
      </header>

      <section aria-labelledby="titulo-dither" className="space-y-4">
        <h2 id="titulo-dither" className="font-display text-2xl font-bold">
          Barragens de mineração em MG por situação operacional
        </h2>
        <p className="text-text-soft">
          Cada ponto representa uma barragem do cadastro Nacional de Barragens de Mineração{" "}
          {formatNumberBR(COBERTURA_SIGBM.total)} em{" "}
          {formatNumberBR(COBERTURA_SIGBM.municipios)} municípios de Minas Gerais, atualizado
          pela ANM em {formatDateBR(COBERTURA_SIGBM.ultimaAtualizacao ?? "")} e coletado para o
          portal em {formatDateBR(COBERTURA_SIGBM.coletadoEm)}:
        </p>

        {/* ══ Alternativa em texto e cor: tabela idêntica ao gráfico ══ */}
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label={`Gráfico de pontos: ${serie
              .map((s) => `${s.valor} ${s.total}`)
              .join(", ")}`}
            width={largura}
            height={altura}
            className="my-6"
          >
            {barras.map((b, i) => (
              <g
                key={b.valor}
                // Origem do texto perto do eixo; pontos começam em x=120.
                transform={`translate(0, ${i * PASSO_PONTO + RAIO_PONTO * 2})`}
              >
                <text x={0} y={4} fontSize={12} className="fill-current text-text">
                  {b.valor}
                </text>
                {Array.from({ length: b.pontos }, (_, p) => (
                  <circle
                    key={p}
                    cx={120 + p * PASSO_PONTO}
                    cy={0}
                    r={RAIO_PONTO}
                    className="fill-primary"
                  />
                ))}
              </g>
            ))}
          </svg>

          <table className="sr-only">
            <caption>Barragens por situação operacional (mesmos números do gráfico)</caption>
            <thead>
              <tr>
                <th scope="col">Situação</th>
                <th scope="col">Barragens</th>
              </tr>
            </thead>
            <tbody>
              {barras.map((b) => (
                <tr key={b.valor}>
                  <td>{b.valor}</td>
                  <td>{b.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fonte oficial, formato ABNT com data (regra editorial). */}
        <p className="text-sm text-text-soft">
          Fonte:{" "}
          <a
            href={COBERTURA_SIGBM.urlFonte}
            rel="noopener noreferrer"
            target="_blank"
            className="underline hover:text-primary"
          >
            {COBERTURA_SIGBM.fonte}, atualizado em {formatDateBR(COBERTURA_SIGBM.ultimaAtualizacao)}
          </a>
          . Coletado pelo portal em {formatDateBR(COBERTURA_SIGBM.coletadoEm)}.
        </p>
      </section>
    </main>
  );
}
