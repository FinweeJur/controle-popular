import Link from "next/link";
import type { EntidadeDetalhada } from "@/lib/empresas/entidades-dados";
import { contarPorPais, paisDeOrigem, rotuloDoSetor } from "@/lib/empresas/painel";

/**
 * @file Lista do recorte do painel de empresas.
 *
 * O QUE É: o bloco de entidades do recorte atual, renderizado no servidor. No
 * celular vira uma coluna de cartões — a tabela antiga rolava de lado e
 * escondia a coluna de risco (§5.14).
 *
 * POR QUE RECEBE O RECORTE PRONTO: quem chama já mediu com `filtrarPorSetor`;
 * este componente só desenha. Contagem e lista não podem discordar.
 *
 * FONTE: os campos vêm de `data/empresas-perfil/entidades-completas.json`; o
 * link de cada nome abre a ficha com a fonte oficial da entidade.
 */

const BANDEIRA: Record<string, string> = {
  brasil: "🇧🇷",
  eua: "🇺🇸",
  canada: "🇨🇦",
};

const NOME_PAIS: Record<string, string> = {
  brasil: "Brasil",
  eua: "Estados Unidos",
  canada: "Canadá",
};

const CLASSE_RISCO: Record<string, string> = {
  Crítico: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  Alto: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  Médio: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  Baixo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
};

export default function ListaDeEntidades({
  entidades,
  setor,
  total,
}: {
  /** Recorte já filtrado e ordenado pelo chamador. */
  entidades: EntidadeDetalhada[];
  setor?: string;
  /** Universo do painel: denominador do percentual. */
  total: number;
}) {
  const paises = contarPorPais(entidades);
  const percentual = total ? Math.round((entidades.length / total) * 100) : 0;

  return (
    <section aria-labelledby="titulo-recorte" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="titulo-recorte" className="font-display text-2xl font-bold text-foreground">
            {rotuloDoSetor(setor)}
          </h2>
          <p className="text-sm text-text-soft">
            {entidades.length.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")} entidades
            ({percentual}%) · {paises.brasil} Brasil · {paises.eua} EUA · {paises.canada} Canadá
          </p>
        </div>
        <p className="text-xs text-muted">Ordem alfabética. Cada nome abre a ficha com as fontes.</p>
      </div>

      {entidades.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-soft">
          Este recorte não tem entidade no acervo. Escolha outro setor acima.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entidades.map((entidade) => {
            const pais = paisDeOrigem(entidade);
            return (
              <li
                key={entidade.slug}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/empresas/${entidade.slug}`}
                    className="font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline"
                  >
                    {entidade.nome}
                  </Link>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                    {entidade.setorRotulo}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-text-soft">
                  {entidade.investimentoBrasil}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-soft">
                  <span title={`Origem: ${NOME_PAIS[pais]}`}>
                    {BANDEIRA[pais]} {NOME_PAIS[pais]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {entidade.ticker
                      ? `${entidade.ticker}${entidade.bolsa ? ` (${entidade.bolsa})` : ""}`
                      : "Capital fechado"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      CLASSE_RISCO[entidade.esg.riscoAmbiental] ?? CLASSE_RISCO.Médio
                    }`}
                  >
                    Risco {entidade.esg.riscoAmbiental.toLowerCase()}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
