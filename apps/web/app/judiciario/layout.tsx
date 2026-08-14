import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import ThemeSwitcher from "@/app/judiciario/components/ThemeSwitcher";
import FontSizeControl from "@/app/judiciario/components/FontSizeControl";
import CvdToggle from "@/app/components/CvdToggle";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import FooterGlobal from "@/app/components/FooterGlobal";
import { outrasZonas } from "@/lib/zonas";

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
                esta div mede mais que o viewport de celular inteiro
                (375px). Sem quebrar linha, o navegador não estoura o
                layout visualmente, mas comprime/corta os itens — lido
                como "navbar espremida". Cada zona irmã tem essa mesma div;
                se ganhar mais um botão lá, checar de novo.

                Busca unificada e pontes para as zonas irmãs.

                ⟲ 13/08, revisão de onboarding: "Congresso"/"Betim" eram
                CRAVADOS À MÃO, comentário incluído, e ficaram parados no
                dia em que a barra foi escrita — quando Ambiental, Terras
                e Paraopeba publicaram depois, nenhum dos três entrou
                aqui. É a classe de bug que fez o dono não achar uma
                frente que existia navegando no celular. `outrasZonas()`
                devolve toda `ZONA_PUBLICADA` menos a atual — a mesma
                fonte que `OutrasFrentes.tsx` e `FooterGlobal.tsx` usam —
                para esta lista nunca mais atrasar em relação a
                `lib/zonas.ts`. */}
            <a
              href="/busca"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Busca →
            </a>
            {outrasZonas("judiciario").map((z) => (
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

          {/* Rodapé padrão do portal — ver `FooterGlobal.tsx`. O "Sobre"
              logo acima é desta zona (`/judiciario/sobre`); o "Sobre o
              projeto" do bloco abaixo é a apresentação do portal inteiro
              (`/sobre`, raiz) — são páginas diferentes de propósito. */}
          <FooterGlobal />
        </div>
      </footer>
    </>
  );
}
