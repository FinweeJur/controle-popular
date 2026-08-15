import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import ThemeSwitcher from "@/app/ambiental/components/ThemeSwitcher";
import FontSizeControl from "@/app/ambiental/components/FontSizeControl";
import CvdToggle from "@/app/components/CvdToggle";
import FooterGlobal from "@/app/components/FooterGlobal";
import { outrasZonas } from "@/lib/zonas";

/**
 * Zona /ambiental. O `<html>`, as fontes e o ThemeProvider vêm do layout
 * raiz; aqui fica só o cabeçalho, a navegação e o rodapé do eixo.
 *
 * AINDA sem `<nav>` completo nem `BuscaUniversal`: /legislacao só existe a
 * partir da F6 — um link 404 continua pior que nenhum. A busca universal
 * precisa de `/ambiental/api/busca` e `/api/chat`, que dependem de dado no
 * banco. Os dois entram na fase que os torna verdadeiros.
 *
 * O que MUDOU: a F3 (COPAM), a F4 (licenciamento) e a F5 (Barragens) têm
 * tela real agora (`/ambiental/copam`, `/ambiental/licenciamento`,
 * `/ambiental/barragens`), e o `<Link>` da zona
 * (`lib/ambiental/link.tsx`) passou a ser usado pela primeira vez — ele
 * existia desde o scaffold só porque `scripts/zonas-basepath.mts` confere
 * o `BASE_PATH` de toda zona mesmo sem uso ainda.
 *
 * O segmento `/ambiental` é ESTÁTICO, então o Next o resolve antes do
 * `app/[municipio]` dinâmico — a zona não colide com slug de cidade. O
 * `scripts/rotas-reservadas.mts` trava isso para o futuro: se um dia uma
 * cidade nascer com slug "ambiental", o teste falha antes do build.
 */
export const metadata: Metadata = {
  title: "Controle Popular — Ambiental · O que o COPAM vai decidir",
  description:
    "Pauta das reuniões do COPAM antes de acontecerem, licenciamento ambiental de Minas Gerais por município, empresa e setor, situação das barragens e legislação ambiental federal e estadual. Portal independente.",
};

export default function AmbientalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* <a> puro, não o <Link> da zona: a raiz do domínio está FORA
              de /ambiental, e o wrapper a prefixaria. */}
          <a href="/" className="font-display text-lg font-bold">
            Controle Popular <span className="opacity-60">· Ambiental</span>
          </a>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {/* flex-wrap obrigatório — ver a nota no /judiciario: esta div
                passa da largura de um celular e, sem quebrar linha, o
                navegador comprime os itens em vez de estourar o layout. */}
            <Link
              href="/copam"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-tertiary)]"
            >
              COPAM →
            </Link>
            <Link
              href="/licenciamento"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-tertiary)]"
            >
              Licenciamento →
            </Link>
            <Link
              href="/barragens"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-tertiary)]"
            >
              Barragens →
            </Link>
            {/* Pontes para as zonas irmãs com <a> cru (mesmo motivo acima:
                o <Link> da zona prefixaria e geraria /ambiental/betim).
                Mesmo rótulo e estilo que as irmãs usam entre si: convenção
                do ecossistema, não inventar rótulo novo.

                ⟲ 13/08, revisão de onboarding: esta lista era CRAVADA À
                MÃO (Betim/Congresso/Judiciário) com um comentário dizendo
                que "o caminho de volta entra na F9" — e quando Terras e
                Paraopeba publicaram depois da F9, ninguém voltou aqui
                para incluí-las. Mesma classe de bug que fez o dono não
                achar uma frente que existia navegando no celular.
                `outrasZonas()` devolve toda `ZONA_PUBLICADA` menos a
                atual — a mesma fonte que `OutrasFrentes.tsx` e
                `FooterGlobal.tsx` usam — para esta lista nunca mais
                atrasar em relação a `lib/zonas.ts`. */}
            {outrasZonas("ambiental").map((z) => (
              <a
                key={z.id}
                href={z.href}
                className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
              >
                {z.nomeCurto} →
              </a>
            ))}
            {/* Direitos em Movimento é RAIZ, não zona irmã — mesmo <a> cru
                pelo mesmo motivo, mas cor própria (`--cp-alert`) porque não
                é um sexto eixo de poder, é transversal aos cinco (ver o
                bloco em `app/page.tsx`). */}
            <a
              href="/direitos-em-movimento"
              className="rounded-md border px-2.5 py-1 text-xs font-medium"
              style={{ borderColor: "var(--cp-alert)", color: "var(--cp-alert)" }}
            >
              Direitos em Movimento →
            </a>
            <FontSizeControl />
            <ThemeSwitcher />
            <CvdToggle />
          </div>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-[var(--cp-border)] py-8 text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4 opacity-80">
          <p>
            Portal independente, sem vínculo com a Semad, com o Copam, com a Feam, com o
            IEF, com o Igam ou com qualquer empreendedor. Dados públicos das fontes
            oficiais.
          </p>
          <p>
            Este portal <strong>não afirma irregularidade</strong>. Situação de licença e
            de barragem é reproduzida como a fonte oficial publica, com link para ela.
          </p>
          <p className="flex gap-4">
            <a
              href="https://github.com/FinweeJur/controle-popular"
              className="underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              Código
            </a>
          </p>

          {/* Rodapé padrão do portal (busca, dados populares, as cinco
              frentes, sobre/metodologia) — ver `FooterGlobal.tsx` para por
              que ele mora aqui e não foi reinventado zona a zona. */}
          <FooterGlobal />
        </div>
      </footer>
    </>
  );
}
