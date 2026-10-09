import type { ReactNode } from "react";

/**
 * Tabela-resumo simples para agregados da página de gastos de campanha
 * (naturezas, cargos, UFs, partidos, fornecedores, big tech).
 *
 * Por que não é a `TabelaEstatica`: esta roda inteira no servidor, sem
 * busca, filtro nem paginação — os agregados têm dezenas de linhas, não
 * milhares. O acervo pesado (1.823 candidaturas) fica na `TabelaEstatica`
 * da própria página, com as seis qualidades do AGENTS.md § 8.
 *
 * Acessibilidade: `<th scope="col">`, `caption` legível e números alinhados
 * à direita com `font-tabular` — mesmo contrato visual das tabelas do site.
 */
export interface ColunaResumo<T> {
  rotulo: string;
  /** Conteúdo da célula. Use `Moeda`/formatadores, não string crua. */
  valor: (linha: T) => ReactNode;
  /** Alinha à direita e aplica numerais tabulares (dinheiro e contagem). */
  numerica?: boolean;
}

export default function TabelaResumo<T>({
  colunas,
  linhas,
  chave,
  legenda,
}: {
  colunas: ColunaResumo<T>[];
  linhas: T[];
  /** Chave estável de cada linha (o que diferencia duas linhas na tela). */
  chave: (linha: T, indice: number) => string;
  /** Legenda acima da tabela (caption). Opcional, mas recomendado. */
  legenda?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
      <table className="w-full text-sm">
        {legenda ? (
          <caption className="border-b border-[var(--cp-border)] px-3 py-2 text-left text-xs font-semibold opacity-80">
            {legenda}
          </caption>
        ) : null}
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c.rotulo}
                scope="col"
                className={`whitespace-nowrap border-b border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2 text-xs uppercase tracking-wide opacity-70 ${
                  c.numerica ? "text-right" : "text-left"
                }`}
              >
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={chave(linha, i)}>
              {colunas.map((c) => (
                <td
                  key={c.rotulo}
                  className={`border-b border-[var(--cp-border)] px-3 py-1.5 ${
                    c.numerica ? "text-right font-tabular" : "text-left"
                  }`}
                >
                  {c.valor(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
