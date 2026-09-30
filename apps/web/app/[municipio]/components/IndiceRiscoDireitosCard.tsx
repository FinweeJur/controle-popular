"use client";

import type { IndiceRiscoDireitos } from "@/lib/risco-direitos";
import type { CoberturaIndice } from "@/lib/db/queries/risco-direitos";
import Link from "next/link";

interface Props {
  indice: IndiceRiscoDireitos;
  cobertura: CoberturaIndice;
  municipioSlug: string;
  municipioNome: string;
}

export default function IndiceRiscoDireitosCard({
  indice,
  cobertura,
  municipioSlug,
  municipioNome,
}: Props) {
  const dimensoesComDado = [
    cobertura.saudeVida,
    cobertura.socioambientalClima,
    cobertura.integridadeErario,
    cobertura.opacidadePolitica,
  ].filter(Boolean).length;
  const todasComDado = dimensoesComDado === 4;

  return (
    <section className="rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">
              Indicador Sintético
            </span>
            {todasComDado ? (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: `${indice.corHex}1a`,
                  color: indice.corHex,
                  border: `1px solid ${indice.corHex}40`,
                }}
              >
                {indice.rotuloNivel}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-border/50 px-2.5 py-0.5 text-xs font-bold text-text-soft">
                Índice parcial — {dimensoesComDado} de 4 dimensões com dado
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text">
            Índice de Risco a Direitos — {municipioNome}
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Medição sintética de violação e ameaça a direitos fundamentais (saúde, meio ambiente, integridade e transparência).
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-surface-raised p-4">
          {todasComDado ? (
            <div className="text-right">
              <span className="text-xs text-text-soft">Score Global</span>
              <div
                className="font-tabular text-3xl font-extrabold"
                style={{ color: indice.corHex }}
              >
                {indice.scoreGeral}
                <span className="text-base font-normal text-text-soft">/100</span>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-xs text-text-soft">Dado coletado</span>
              <div className="font-tabular text-3xl font-extrabold text-text">
                {dimensoesComDado}
                <span className="text-base font-normal text-text-soft">/4</span>
              </div>
            </div>
          )}
          <div className="h-10 w-[2px] bg-border/60" />
          <Link
            href={`/${municipioSlug}/interesses`}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver Teia de Interesses →
          </Link>
        </div>
      </div>

      {/* Grid das 4 Dimensões */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DimensaoCard
          icone="🏥"
          titulo="Saúde & Vida"
          score={indice.dimensoes.saudeVida.score}
          cor="bg-primary"
          temDado={cobertura.saudeVida}
          qtdFatores={indice.dimensoes.saudeVida.fatores.length}
          textoComDado="alerta(s) de internações/óbitos"
          textoSemDado="Dado de internações por CID ainda não coletado para este município."
        />

        <DimensaoCard
          icone="🌳"
          titulo="Socioambiental"
          score={indice.dimensoes.socioambientalClima.score}
          cor="bg-emerald-500"
          temDado={cobertura.socioambientalClima}
          qtdFatores={indice.dimensoes.socioambientalClima.fatores.length}
          textoComDado="sobreposição/barragem crítica"
          textoSemDado="Dado de barragens e autuações ambientais ainda não coletado para este município."
        />

        <DimensaoCard
          icone="🏛️"
          titulo="Finanças & Erário"
          score={indice.dimensoes.integridadeErario.score}
          cor="bg-amber-500"
          temDado={cobertura.integridadeErario}
          qtdFatores={indice.dimensoes.integridadeErario.fatores.length}
          textoComDado="vínculo(s) contratos-doações"
          textoSemDado="Dado de contratos, CEIS/CNEP e doações ainda não coletado para este município."
        />

        <DimensaoCard
          icone="⚖️"
          titulo="Opacidade Política"
          score={indice.dimensoes.opacidadePolitica.score}
          cor="bg-indigo-500"
          temDado={cobertura.opacidadePolitica}
          qtdFatores={indice.dimensoes.opacidadePolitica.fatores.length}
          textoComDado="Câmara sem API aberta de votos"
          textoSemDado="Dado de transparência e sistema da Câmara ainda não coletado para este município."
        />
      </div>

      {/* Como calculamos — o cálculo aberto: fórmula, pesos, limiares e nível.
          Regra editorial: o número vem do dado; a régua que o produziu também
          tem de estar à vista. Ver `lib/risco-direitos.ts`. */}
      <details className="mt-6 rounded-lg border border-border/50 bg-surface-raised p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text">
          Como calculamos este índice
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-text-soft">
          <p>
            O score geral (0–100) é a <strong>média ponderada</strong> de quatro
            dimensões, cada uma também de 0 a 100:
          </p>
          <p className="overflow-x-auto rounded bg-surface px-3 py-2 font-mono text-[.72rem] text-text">
            0,30×Saúde + 0,30×Socioambiental + 0,25×Integridade + 0,15×Opacidade
          </p>
          <p>
            Cada dimensão parte de um piso e soma pontos ao cruzar um limiar
            (satura em 100):
          </p>
          <ul className="space-y-1.5">
            <li>
              <strong>🏥 Saúde &amp; Vida — 30%.</strong> Piso 15. +40 se as
              internações por CID sensível ao ambiente passam de 100; +30 se a
              mortalidade evitável passa de 20.
            </li>
            <li>
              <strong>🌳 Socioambiental e clima — 30%.</strong> Piso 10. +50 se
              há barragem de mineração em emergência; +35 se há sobreposição de
              imóvel rural (CAR) sobre terra indígena/quilombola; +20 se há
              autuação do IBAMA.
            </li>
            <li>
              <strong>🏛️ Finanças e erário — 25%.</strong> Piso 15. +50 se há
              contrato com empresa sancionada (CEIS/CNEP); +30 se os contratos
              com doadores de campanha passam de R$ 100 mil.
            </li>
            <li>
              <strong>⚖️ Opacidade política — 15%.</strong> Piso 10. +45 se a
              Câmara não publica as matérias em formato aberto; +35 se a nota de
              transparência (PNTP) fica abaixo de 50.
            </li>
          </ul>
          <p>
            Níveis: <strong>Crítico</strong> ≥ 76 · <strong>Alto</strong> ≥ 51 ·{" "}
            <strong>Moderado</strong> ≥ 26 · <strong>Baixo</strong> abaixo de 26.
          </p>

          {/* O CASO, DIMENSÃO POR DIMENSÃO — não a régua em abstrato, o
              porquê desta nota: valor medido, limiar e quanto somou. */}
          <div>
            <p className="font-semibold text-text">
              Por que esta nota — o caso de {municipioNome}
            </p>
            <div className="mt-2 space-y-3">
              {(
                [
                  ["🏥 Saúde & Vida", indice.dimensoes.saudeVida, cobertura.saudeVida],
                  ["🌳 Socioambiental e clima", indice.dimensoes.socioambientalClima, cobertura.socioambientalClima],
                  ["🏛️ Finanças e erário", indice.dimensoes.integridadeErario, cobertura.integridadeErario],
                  ["⚖️ Opacidade política", indice.dimensoes.opacidadePolitica, cobertura.opacidadePolitica],
                ] as const
              ).map(([titulo, dim, temDado]) => (
                <div key={titulo}>
                  <p className="text-text">
                    <strong>{titulo}</strong>{" "}
                    {temDado ? (
                      <span className="font-tabular font-semibold">{dim.score}/100</span>
                    ) : (
                      <em>sem dado coletado</em>
                    )}{" "}
                    <span className="text-text-soft">
                      (peso {Math.round(dim.peso * 100)}% · base {dim.piso})
                    </span>
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {dim.itens.map((it) => (
                      <li key={it.rotulo}>
                        <span aria-hidden className="font-mono text-text">
                          {it.somou ? "▲" : it.coletado ? "·" : "–"}
                        </span>{" "}
                        {it.rotulo}: <span className="text-text">{it.valorMedido}</span>{" "}
                        <span className="text-text-soft">
                          ({it.limiar}) → {it.somou ? `+${it.pontos}` : "0"}
                        </span>
                        {" · Fonte: "}
                        {it.urlFonte ? (
                          <a
                            href={it.urlFonte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            {it.fonte} ↗
                          </a>
                        ) : (
                          it.fonte
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[.7rem] italic">
            Legenda: <span className="font-mono">▲</span> limiar cruzado (somou
            pontos) · <span className="font-mono">·</span> medido, abaixo do
            limiar · <span className="font-mono">–</span> não coletado (não é
            zero). O índice é <strong>sintético</strong>: soma limiares
            verificáveis na fonte, não substitui a leitura de cada uma.
            Dimensão sem dado aparece como “—” e não entra como zero.
          </p>
        </div>
      </details>
    </section>
  );
}

function DimensaoCard({
  icone,
  titulo,
  score,
  cor,
  temDado,
  qtdFatores,
  textoComDado,
  textoSemDado,
}: {
  icone: string;
  titulo: string;
  score: number;
  cor: string;
  temDado: boolean;
  qtdFatores: number;
  textoComDado: string;
  textoSemDado: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-raised p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-soft">{icone} {titulo}</span>
        <span className="font-tabular text-xs font-bold text-text">
          {temDado ? `${score}/100` : "—"}
        </span>
      </div>
      {temDado ? (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div className={`h-full ${cor}`} style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-text-soft">
            {qtdFatores > 0
              ? `${qtdFatores} ${textoComDado}`
              : "Sem alerta disparado com o dado disponível"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-text-soft">{textoSemDado}</p>
      )}
    </div>
  );
}
