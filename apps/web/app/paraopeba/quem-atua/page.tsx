import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  ATORES_REPARACAO,
  CATEGORIA_ATOR_LABEL,
  type CategoriaAtor,
} from "@/lib/paraopeba";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/quem-atua` — os órgãos e organizações que atuam na reparação
 * pelo rompimento da barragem da Vale em Brumadinho.
 *
 * ═══ POR QUE ISTO É O GANHO MAIOR DA FRENTE ═══
 *
 * `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.4) mediu: 16 dos 18 atores
 * aqui não existem em `lib/betim/redeProtecao.ts` de forma alguma — são
 * quem decide o processo (TJMG, STF, STJ, MPF, MPMG, DPMG) e quem atende
 * quem foi atingido de verdade (as três ATIs: AEDAS, NACAB, Instituto
 * Guaicuy). Página simples de propósito — lista por categoria, cada
 * organização com o que ela faz e como contatar, sem card inventado.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/quem-atua", {
  title: "Quem atua na reparação — Paraopeba | Controle Popular",
  description:
    "Os 18 órgãos e organizações que atuam na reparação pelo rompimento da barragem da Vale em Brumadinho — do Judiciário às três assessorias técnicas independentes (ATIs) que atendem quem foi atingido.",
});

const ORDEM_CATEGORIAS: CategoriaAtor[] = ["judiciario", "mp", "gestora", "mov", "pub"];

// A categoria "mov" mistura dois papéis distintos que `atores.ts` já
// descreve separadamente em `papelNoPainel`: o movimento social de base
// (MAB) e as três assessorias técnicas independentes — ATIs (AEDAS, NACAB,
// Instituto Guaicuy), eleitas pelas pessoas atingidas mas profissionais de
// apoio, não o movimento em si. `docs/PLANO-INGESTAO-PARAOPEBA.md` (1.5)
// já trata o MAB à parte das ATIs ("MAB (organização, contato de
// articulação)" vs. "as três ATIs") e trata ABA/Ascotélite/IEM como
// "associações autoras da ação" institucionais, não movimento — duas delas
// com `contatos: []` no próprio painel-fonte. Por isso o destaque na hero
// é só o MAB: é o único ator cujo `papelNoPainel` o identifica como
// "Movimento social de base", e é o pedido literal do dono ("o movimento").
const MOVIMENTO = ATORES_REPARACAO.find(
  (a) => a.papelNoPainel === "Movimento social de base",
);

export default function QuemAtuaPage() {
  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto de
  // `clipping/page.tsx` (ver o comentário lá).
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Quem atua na reparação</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Quem decide o processo, quem atende quem foi atingido
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {ATORES_REPARACAO.length} órgãos e organizações, do Judiciário ao movimento social —
        inclusive as três assessorias técnicas independentes (ATIs) eleitas pelas pessoas
        atingidas, que raramente aparecem em outro lugar.
      </p>

      {/* Hero do movimento: num rompimento de barragem, a organização das
          pessoas atingidas é parte interessada com posição própria — não
          mais um item em ordem alfabética ao lado de gestora de repasse ou
          Advocacia-Geral da União. Fica sozinho aqui mesmo que a base tenha
          pouco sobre ele (2 contatos); o pouco aparece, nada é inventado. */}
      {MOVIMENTO && (
        <section className="mt-6 rounded-2xl border-2 border-primary bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            O movimento
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-text">
            {MOVIMENTO.nome}
          </h2>
          <p className="mt-2 text-sm text-text-soft">{MOVIMENTO.atuacao}</p>
          {MOVIMENTO.nota && (
            <p className="mt-2 text-xs text-text-soft italic">{MOVIMENTO.nota}</p>
          )}
          {MOVIMENTO.contatos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-border/60 pt-3">
              {MOVIMENTO.contatos.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target={c.tipo === "web" ? "_blank" : undefined}
                  rel={c.tipo === "web" ? "noopener noreferrer" : undefined}
                  className="text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
                >
                  {c.label}
                  {c.tipo === "web" ? " ↗" : ""}
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {ORDEM_CATEGORIAS.map((cat) => {
          const itens = ATORES_REPARACAO.filter(
            (a) => a.categoria === cat && a !== MOVIMENTO,
          );
          if (itens.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="font-display text-lg font-semibold text-text">
                {CATEGORIA_ATOR_LABEL[cat]}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {itens.map((a) => (
                  <div
                    key={a.nome}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                      {a.papelNoPainel}
                    </p>
                    <h3 className="mt-1 font-display text-base font-semibold text-text">
                      {a.nome}
                    </h3>
                    <p className="mt-2 text-sm text-text-soft">{a.atuacao}</p>
                    {a.nota && (
                      <p className="mt-2 text-xs text-text-soft italic">{a.nota}</p>
                    )}
                    {a.contatos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3 border-t border-border/60 pt-3">
                        {a.contatos.map((c) => (
                          <a
                            key={c.href}
                            href={c.href}
                            target={c.tipo === "web" ? "_blank" : undefined}
                            rel={c.tipo === "web" ? "noopener noreferrer" : undefined}
                            className="text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
                          >
                            {c.label}
                            {c.tipo === "web" ? " ↗" : ""}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          Precisa de ajuda concreta, não de um diretório do processo?
        </h2>
        <p className="mt-2">
          Esta lista é quem atua no PROCESSO — instância judicial, procuradoria, gestora dos
          repasses. Para assistência jurídica gratuita, denúncia ou proteção de direitos fora
          do caso Brumadinho, veja a{" "}
          <a
            href="/direitos-em-movimento"
            className="font-medium text-accent hover:underline"
          >
            rede de proteção do Controle Popular ↗
          </a>
          .
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
