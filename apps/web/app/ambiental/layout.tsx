import type { Metadata } from "next";
import ThemeSwitcher from "@/app/ambiental/components/ThemeSwitcher";
import FontSizeControl from "@/app/ambiental/components/FontSizeControl";
import CvdToggle from "@/app/components/CvdToggle";

/**
 * Zona /ambiental. O `<html>`, as fontes e o ThemeProvider vêm do layout
 * raiz; aqui fica só o cabeçalho, a navegação e o rodapé do eixo.
 *
 * SEM `<nav>` e SEM `BuscaUniversal` na F1, de propósito. A navegação
 * apontaria para /reunioes, /licencas, /barragens e /legislacao, que só
 * existem a partir da F3 — quatro links 404 é pior do que nenhum. E a
 * busca universal precisa de `/ambiental/api/busca` e `/api/chat`, que
 * dependem de dado no banco. Ambos entram na fase que os torna verdadeiros.
 *
 * É por isso que o `<Link>` da zona (`lib/ambiental/link.tsx`) ainda não é
 * importado aqui: não há navegação interna para prefixar. Ele existe desde
 * já porque `scripts/zonas-basepath.mts` confere o `BASE_PATH` de toda zona
 * — a trava tem de valer desde o scaffold, que é quando o bug de copiar o
 * arquivo de outra zona acontece.
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
                navegador comprime os itens em vez de estourar o layout.

                Pontes para as zonas irmãs com <a> cru (mesmo motivo acima).
                Mesmo rótulo e estilo que as irmãs usam entre si: convenção
                do ecossistema, não inventar rótulo novo. O caminho de volta
                (as irmãs apontando para cá) entra na F9, junto com a
                publicação — antes disso a zona é alcançável por URL, mas
                não se anuncia. */}
            <a
              href="/betim"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Betim →
            </a>
            <a
              href="/congresso"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Congresso →
            </a>
            <a
              href="/judiciario"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Judiciário →
            </a>
            <FontSizeControl />
            <ThemeSwitcher />
            <CvdToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

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
        </div>
      </footer>
    </>
  );
}
