/**
 * CartaoMemoria — "Já aconteceu aqui" v2: memória da cidade com a escada
 * das camadas e botão de fonte.
 *
 * Papel no portal: substituir o cartão antigo (que só tinha copy para as
 * seis cidades de `memoria-cidades.ts`) por um que SEMPRE entrega contexto
 * com fonte para qualquer município. A página desce a escada
 * (`resolverMemoria`): município → UF → região → país. Quando não há
 * verbete local, o cartão ROTULA o degrau ("No seu estado") e diz, com
 * letras, que ainda não há verbete daquele município — a lacuna é
 * informação (AGENTS.md §7), nunca preenchida com marco inventado.
 *
 * Fonte oficial: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md` (arquitetura
 * em quatro camadas, ordem de preferência das fontes e regra de
 * vinculação) e AGENTS.md §7 e §8 (seis qualidades: rótulo por extenso,
 * botão Fonte, link direto).
 *
 * Só usa fonte PRIMÁRIA (`fontesPrimarias`): Wikipédia/Wikidata nunca
 * decide verbete. Cor nunca é o único canal — o tipo de luta sai por
 * extenso.
 */

import type { ResultadoMemoria } from "@/lib/memoria/tipos";
import { fontesPrimarias } from "@/lib/memoria/guardas";
import { ROTULO_TIPO } from "@/lib/memoria/rotulos";
import Link from "@/lib/betim/link";

/** Rótulo do degrau da escada em que o marco foi achado. */
const NIVEL_ROTULO: Record<ResultadoMemoria["nivel"], string> = {
  municipio: "Já aconteceu aqui",
  uf: "No seu estado",
  regiao: "Na sua região",
  pais: "No Brasil",
};

/** Como nomear o degrau na ressalva de lacuna. */
const NIVEL_NOME: Record<ResultadoMemoria["nivel"], string> = {
  municipio: "deste município",
  uf: "do estado",
  regiao: "da região",
  pais: "do país",
};

export interface CartaoMemoriaProps {
  /** Degrau mais específico com fonte, ou `null` se nem o país tem. */
  resultado: ResultadoMemoria | null;
  /** Copy local legada (`memoria-cidades.ts`) — texto municipal, se houver. */
  memoriaLocal: string | null;
  /** Cultura viva da cidade; renderiza sempre que existir. */
  cultura: string | null;
  /** Rota da linha do tempo da cidade (`/<slug>/historico`). */
  hrefHistorico: string;
}

export default function CartaoMemoria({
  resultado,
  memoriaLocal,
  cultura,
  hrefHistorico,
}: CartaoMemoriaProps) {
  const verbete = resultado?.verbete ?? null;
  if (!verbete && !memoriaLocal && !cultura) return null;

  const fontes = verbete ? fontesPrimarias(verbete) : [];
  const rotulo = memoriaLocal
    ? "Já aconteceu aqui"
    : resultado
      ? NIVEL_ROTULO[resultado.nivel]
      : "Já aconteceu aqui";
  const mostrarMarco = !memoriaLocal && verbete;

  return (
    <section
      aria-label="Memória e cultura da cidade"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <span className="text-[.82em] font-semibold uppercase tracking-wide text-primary">
        {rotulo}
      </span>

      {memoriaLocal ? (
        <p className="mt-2 text-[.98em] font-medium text-text">{memoriaLocal}</p>
      ) : null}

      {mostrarMarco ? (
        <article className="mt-2">
          <h3 className="font-display text-[1.05em] font-semibold text-text">
            {verbete.titulo}
            {verbete.periodo ? (
              <span className="ml-2 text-[.8em] font-normal text-muted">
                {verbete.periodo}
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-[.95em] text-text-soft">{verbete.resumo}</p>

          {verbete.tipo.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {verbete.tipo.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft"
                >
                  {ROTULO_TIPO[t]}
                </span>
              ))}
            </p>
          ) : null}

          {fontes.length > 0 ? (
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[.85em] font-semibold text-text">Fonte:</span>
              {fontes.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${f.titulo} — ${f.orgao}, ${f.ano}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[.8em] font-semibold text-primary hover:border-primary hover:bg-primary/5"
                >
                  {f.orgao} ({f.ano})
                </a>
              ))}
            </p>
          ) : null}

          {resultado && resultado.nivel !== "municipio" ? (
            <p className="mt-2 text-[.8em] text-muted">
              Este município ainda não tem verbete próprio com fonte fechada —
              mostramos o marco {NIVEL_NOME[resultado.nivel]}, com a fonte.
            </p>
          ) : null}
        </article>
      ) : null}

      {cultura ? (
        <p className="mt-3 text-[.95em] text-text-soft">{cultura}</p>
      ) : null}

      <Link
        href={hrefHistorico}
        className="mt-3 inline-flex items-center gap-1 text-[.88em] font-semibold text-accent hover:underline"
      >
        Ver a história da cidade na linha do tempo →
      </Link>
    </section>
  );
}
