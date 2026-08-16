import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import FooterGlobal from "@/app/components/FooterGlobal";

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
  { href: "/votacoes", label: "Votações" },
  { href: "/parlamentares", label: "Parlamentares" },
  { href: "/agenda", label: "Agenda" },
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
          {/* Wordmark da MARCA, botões de zona irmã e controles de
              tema/tamanho/contraste agora moram na barra global (`TopNav.tsx`,
              layout raiz). Aqui fica só o nome da zona como <a> cru: o <Link>
              da zona prefixaria e geraria /congresso/congresso. */}
          <a href="/congresso" className="font-display text-lg font-bold">
            Congresso
          </a>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Barra de busca/assistente em faixa própria, largura inteira: no
            meio do nav ela ficaria estreita demais para ler a sugestão, e o
            painel de sugestões precisa de espaço para o subtítulo (ementa,
            nome da comissão). Fora do <nav> de propósito — não é um link de
            navegação e não deve entrar na lista que o leitor de tela anuncia
            como "navegação". */}
        <div className="mx-auto max-w-5xl px-4 pb-4">
          <BuscaUniversal
            endpointSugestoes="/congresso/api/busca"
            endpointChat="/congresso/api/chat"
            placeholder="Buscar PL, comissão, autor — ou perguntar ao assistente"
            exemplos={[
              "Quais projetos restringem direitos agora?",
              "O que a CCJC tem na pauta?",
              "Quais audiências públicas estão marcadas?",
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

          {/* Rodapé padrão do portal — ver `FooterGlobal.tsx`. */}
          <FooterGlobal />
        </div>
      </footer>
    </>
  );
}
