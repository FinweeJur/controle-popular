import type { Metadata } from "next";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import FooterGlobal from "@/app/components/FooterGlobal";
import { metadataEditavel } from "@/lib/edicoes";
import { MARCOS_RIO_DOCE } from "@/lib/riodoce/linha-do-tempo";
import LinhaDoTempo from "./LinhaDoTempo";

/**
 * `/riodoce/linha-do-tempo` — os marcos do caso do Rio Doce, do rompimento
 * da barragem de Fundão (05/11/2015) ao balanço do PID (22/10/2026).
 *
 * O texto de apresentação conta os marcos a partir da própria constante:
 * quem adicionar um marco no `lib` não precisa lembrar de atualizar um
 * número escrito à mão aqui. O componente de cliente desenha os cartões,
 * os filtros e a lista; esta página só monta o hero, a moldura e o rodapé.
 */
export const metadata: Metadata = metadataEditavel("/riodoce/linha-do-tempo", {
  title: "Linha do tempo do Rio Doce — Fundão, TTAC, Novo Acordo e PID | Controle Popular",
  description:
    "Os marcos do caso do Rio Doce, do rompimento da barragem de Fundão em 05/11/2015 ao balanço de mais de 321 mil indenizações do PID em 22/10/2026 — cada data com link para a fonte oficial.",
});

const ATALHOS = [
  {
    href: "/riodoce/analise",
    titulo: "Análise",
    texto: "O que a evidência permite afirmar sobre o desastre e a reparação.",
  },
  {
    href: "/riodoce/clipping",
    titulo: "Clipping",
    texto: "O caso acompanhado pela imprensa, com link para cada matéria.",
  },
  {
    href: "/riodoce/dados-espaciais",
    titulo: "Dados espaciais",
    texto: "A bacia do Rio Doce em camadas e mapas, a partir das fontes oficiais.",
  },
] as const;

export default function LinhaDoTempoRioDocePage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8"
    >
      <CaminhoSistema rota="/riodoce/linha-do-tempo" />

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        A linha do tempo do Rio Doce
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {MARCOS_RIO_DOCE.length} marcos do caso — do rompimento da barragem de
        Fundão, em 5 de novembro de 2015, ao balanço de mais de 321 mil
        indenizações do PID, em 22 de outubro de 2026. Acordos, decisões
        judiciais, a lei que criou a PNAB e cada passo da indenização
        individual, em ordem.
      </p>

      <p className="mt-3 inline-flex max-w-full items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-soft">
        <span aria-hidden="true">✅</span>
        <span>
          Toda data tem link para a fonte oficial. Onde aparece só o ano, a
          fonte não registra o dia — o portal não completa a data por conta
          própria.
        </span>
      </p>

      <LinhaDoTempo />

      <nav aria-labelledby="outras-frentes" className="mt-12 border-t border-border pt-8">
        <h2 id="outras-frentes" className="font-display text-xl font-semibold">
          Continue no Rio Doce
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {ATALHOS.map((atalho) => (
            <li key={atalho.href}>
              <NextLink
                href={atalho.href}
                className="cp-card-hover flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                <span className="text-sm font-semibold text-primary">
                  {atalho.titulo}
                </span>
                <span className="mt-1 text-xs leading-snug text-text-soft">
                  {atalho.texto}
                </span>
              </NextLink>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-text-soft">
          <NextLink href="/riodoce" className="font-medium text-accent hover:underline">
            ← Voltar para a Plataforma Rio Doce
          </NextLink>
        </p>
      </nav>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
