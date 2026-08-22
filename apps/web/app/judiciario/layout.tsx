import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import FooterGlobal from "@/app/components/FooterGlobal";

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
  { href: "/inspecoes", label: "Inspeções" },
  { href: "/metodologia", label: "Metodologia" },
];

export default function JudiciarioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* Wordmark da MARCA, botões de zona irmã e controles de
              tema/tamanho/contraste agora moram na barra global (`TopNav.tsx`,
              layout raiz). Aqui fica só o nome da zona como <a> cru: o <Link>
              da zona prefixaria e geraria /judiciario/judiciario. */}
          <a href="/judiciario" className="font-display text-lg font-bold">
            Judiciário
          </a>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
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

      <main id="conteudo-principal" tabIndex={-1} className="flex-1">
        {children}
      </main>

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
