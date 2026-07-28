import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import ThemeSwitcher from "@/app/congresso/components/ThemeSwitcher";
import FontSizeControl from "@/app/congresso/components/FontSizeControl";

/**
 * Zona /congresso. O `<html>`, as fontes e o ThemeProvider vêm do layout
 * raiz; aqui fica só o cabeçalho, a navegação e o rodapé do eixo.
 */
export const metadata: Metadata = {
  title: "Controle Popular — Congresso · Monitoramento legislativo federal",
  description:
    "Acompanhe projetos de lei federais por tema, bancada e comissão, com análise fundamentada de ampliação ou restrição de direitos. Portal independente.",
};

const NAV = [
  { href: "/alertas", label: "Alertas" },
  { href: "/bons-exemplos", label: "Bons exemplos" },
  { href: "/proposicoes", label: "Proposições" },
  { href: "/comissoes", label: "Comissões" },
  { href: "/bancadas", label: "Bancadas" },
  { href: "/metodologia", label: "Metodologia" },
];

export default function CongressoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* <a> puro, não o <Link> da zona: a raiz do domínio está FORA
              de /congresso, e o wrapper a prefixaria — o clique na marca
              cairia em /congresso em vez da home que lista as seções. */}
          <a href="/" className="font-display text-lg font-bold">
            Controle Popular <span className="opacity-60">· Congresso</span>
          </a>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {/* Pontes para as zonas irmãs (mesmo motivo do <a> acima). */}
            <a
              href="/betim"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Betim →
            </a>
            <FontSizeControl />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-[var(--cp-border)] py-8 text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4 opacity-80">
          <p>
            Portal independente, sem vínculo com a Câmara dos Deputados, o Senado
            Federal ou qualquer partido. Dados públicos das APIs oficiais.
          </p>
          <p>
            As classificações de ampliação ou restrição de direitos seguem uma régua
            declarada e auditável — ver{" "}
            <Link href="/metodologia" className="underline">
              Metodologia
            </Link>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
