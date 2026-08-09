import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import ThemeSwitcher from "@/app/judiciario/components/ThemeSwitcher";
import FontSizeControl from "@/app/judiciario/components/FontSizeControl";
import BuscaUniversal from "@/app/components/BuscaUniversal";

/**
 * Zona /judiciario. O `<html>`, as fontes e o ThemeProvider vêm do layout
 * raiz; aqui fica só o cabeçalho, a navegação e o rodapé do eixo.
 */
export const metadata: Metadata = {
  title: "Controle Popular — Judiciário · Quem ocupa, quem indicou, quando vaga",
  description:
    "Composição dos tribunais brasileiros, projeção de vacância pela aposentadoria compulsória aos 75 anos, cota de origem de cada cadeira e poder de indicação por autoridade. Portal independente.",
};

const NAV = [
  { href: "/tribunais", label: "Tribunais" },
  { href: "/vagas", label: "Vagas" },
  { href: "/indicacoes", label: "Indicações" },
  { href: "/metodologia", label: "Metodologia" },
];

export default function JudiciarioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* <a> puro, não o <Link> da zona: a raiz do domínio está FORA
              de /judiciario, e o wrapper a prefixaria. */}
          <a href="/" className="font-display text-lg font-bold">
            Controle Popular <span className="opacity-60">· Judiciário</span>
          </a>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            {/* flex-wrap é OBRIGATÓRIO aqui: achado real em revisão —
                esta div (Busca/Congresso/Betim/Entrar + 3 botões de texto +
                3 de tema = 9 itens) mede mais que o viewport de celular
                inteiro (375px). Sem quebrar linha, o navegador não estoura
                o layout visualmente, mas comprime/corta os itens — lido
                como "navbar espremida". Cada zona irmã tem essa mesma div;
                se ganhar mais um botão lá, checar de novo.

                Busca unificada e pontes para as zonas irmãs (mesmo motivo
                do <a> acima). Mesmo rótulo/estilo que o /congresso já usa
                pro link de volta a esta zona — convenção do ecossistema,
                não inventar rótulo novo. "Betim" por enquanto: é a única
                cidade publicada (BH/SP vêm na Fase 3, multi-cidade). */}
            <a
              href="/busca"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Busca →
            </a>
            <a
              href="/congresso"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Congresso →
            </a>
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
        {/* Faixa própria para a busca — mesma decisão do /congresso e da zona
            de cidades: largura inteira, fora do <nav>. */}
        <div className="mx-auto max-w-5xl px-4 pb-4">
          <BuscaUniversal
            endpointSugestoes="/judiciario/api/busca"
            endpointChat="/judiciario/api/chat"
            placeholder="Buscar tribunal, ministro, vaga — ou perguntar ao assistente"
            exemplos={[
              "Quais vagas abrem no STF até 2030?",
              "Quantos ministros do STJ cada presidente nomeou?",
              "O que é o quinto constitucional?",
            ]}
            aviso="O assistente responde a partir dos dados já reunidos no portal e pode errar. Confira sempre na página e na fonte oficial."
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-[var(--cp-border)] py-8 text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4 opacity-80">
          <p>
            Portal independente, sem vínculo com qualquer tribunal, com o CNJ ou com
            partido. Dados públicos das APIs oficiais.
          </p>
          <p>
            Datas de vacância são <strong>projeção determinística</strong> (nascimento +
            75 anos, LC 152/2015), não previsão de saída — ver{" "}
            <Link href="/metodologia" className="underline">
              Metodologia
            </Link>
            .
          </p>
          <p className="flex gap-4">
            <Link href="/sobre" className="underline">
              Sobre
            </Link>
            <Link href="/privacidade" className="underline">
              Privacidade
            </Link>
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
