import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import FooterGlobal from "@/app/components/FooterGlobal";

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
          {/* Wordmark da MARCA, botões de zona irmã e controles de
              tema/tamanho/contraste agora moram na barra global (`TopNav.tsx`,
              layout raiz). Aqui fica só o nome da zona como <a> cru: o <Link>
              da zona prefixaria e geraria /ambiental/ambiental. */}
          <a href="/ambiental" className="font-display text-lg font-bold">
            Ambiental
          </a>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
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
            <Link
              href="/estudos"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-tertiary)]"
            >
              Estudos de impacto →
            </Link>
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
