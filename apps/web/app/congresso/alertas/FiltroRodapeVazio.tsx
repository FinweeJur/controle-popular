import Link from "@/lib/congresso/link";
import { TEMAS } from "@/lib/congresso/temas";

/**
 * `FiltroTema`, `Vazio` e `Rodape` — as três peças de UI compartilhadas
 * entre `/congresso/alertas` e `/congresso/bons-exemplos`, num arquivo
 * próprio.
 *
 * ═══ POR QUE SAÍRAM DE `alertas/page.tsx` ═══
 *
 * Moraram lá porque `bons-exemplos/page.tsx` já importava as três de lá
 * (`import { FiltroTema, Rodape, Vazio } from "@/app/congresso/alertas/page"`).
 * Quando o filtro por tema de `alertas` foi para o cliente
 * (`AlertasLista.tsx`, "use client"), importar essas três funções direto de
 * `page.tsx` funcionaria hoje (nenhuma delas usa hook), mas arrastaria pro
 * bundle do cliente TUDO que `page.tsx` importa no topo do arquivo —
 * inclusive `alertas`/`coberturaAnalise` de `lib/congresso/destaques.ts`,
 * que puxa `lib/db/queries/congresso.ts`. Um bundler com tree-shaking
 * perfeito eliminaria o que não é usado, mas essa é exatamente a classe de
 * problema que só aparece no `next build` de export (ver
 * `docs/deploy-github-pages.md` §8.3) — não vale arriscar quando mover o
 * arquivo resolve de graça.
 *
 * `alertas/page.tsx` re-exporta as três daqui, então o import de
 * `bons-exemplos/page.tsx` continua válido sem mudança.
 */

export function FiltroTema({ atual, base }: { atual?: string; base: string }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      <Link
        href={base}
        className={`rounded-md border px-3 py-1 ${
          atual ? "border-[var(--cp-border)]" : "border-[var(--cp-primary)]"
        }`}
      >
        Todos os temas
      </Link>
      {TEMAS.map((t) => (
        <Link
          key={t.slug}
          href={`${base}?tema=${t.slug}`}
          className={`rounded-md border px-3 py-1 ${
            atual === t.slug ? "border-[var(--cp-primary)]" : "border-[var(--cp-border)]"
          }`}
        >
          {t.nome}
        </Link>
      ))}
    </nav>
  );
}

export function Vazio({
  cobertura,
  tema,
}: {
  cobertura: { analisadas: number; total: number };
  tema?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] p-6">
      {cobertura.analisadas === 0 ? (
        <>
          <h2 className="font-display text-xl font-semibold">Análises em andamento</h2>
          <p className="mt-2 opacity-80">
            Nenhuma proposição foi analisada ainda. As {cobertura.total.toLocaleString("pt-BR")}{" "}
            proposições já estão no banco e navegáveis em{" "}
            <Link href="/proposicoes" className="underline">
              Proposições
            </Link>
            ; a análise de direitos roda em fila e esta página se enche sozinha conforme
            avança.
          </p>
        </>
      ) : (
        <p className="opacity-80">
          Nenhuma proposição {tema ? `de ${tema} ` : ""}classificada assim entre as{" "}
          {cobertura.analisadas.toLocaleString("pt-BR")} já analisadas. Isso não significa
          que não exista — significa que a fila de análise ainda não chegou nela.
        </p>
      )}
    </div>
  );
}

export function Rodape({ cobertura }: { cobertura: { analisadas: number; total: number } }) {
  const pct =
    cobertura.total > 0 ? Math.round((cobertura.analisadas / cobertura.total) * 100) : 0;
  return (
    <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-80">
      <p>
        <strong>
          {cobertura.analisadas.toLocaleString("pt-BR")} de{" "}
          {cobertura.total.toLocaleString("pt-BR")} proposições analisadas ({pct}%).
        </strong>{" "}
        A análise roda em fila, priorizando o que está em tramitação. Uma proposição
        ausente desta lista pode simplesmente não ter chegado a vez dela — a ausência aqui
        não é atestado de nada.
      </p>
      <p className="mt-2">
        O rótulo não é escrito por inteligência artificial: ele é calculado a partir de
        itens que citam, cada um, o dispositivo que fundamenta a leitura.{" "}
        <Link href="/metodologia" className="underline">
          Ver a metodologia
        </Link>
        .
      </p>
    </section>
  );
}
