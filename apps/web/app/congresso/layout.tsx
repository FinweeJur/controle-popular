import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import ThemeSwitcher from "@/app/congresso/components/ThemeSwitcher";
import FontSizeControl from "@/app/congresso/components/FontSizeControl";
import CvdToggle from "@/app/components/CvdToggle";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import FooterGlobal from "@/app/components/FooterGlobal";
import { outrasZonas } from "@/lib/zonas";

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
          {/* flex-wrap: esta div é gêmea da do /judiciario, que já carrega
              a nota de por que ele é obrigatório — os itens medem ~560px
              contra um viewport de celular de 375px, e sem quebrar linha
              o navegador comprime em vez de estourar, o que se lê como
              "navbar espremida" e não como bug. Aqui ele faltava até o
              scaffold da 4ª zona (/ambiental) chegar, que é quando esta
              barra ganhou o botão de Busca.

              Busca unificada e pontes para as zonas irmãs (mesmo motivo
              do <a> acima).

              ⟲ 13/08, revisão de onboarding: os links de zona irmã eram
              CRAVADOS À MÃO ("Judiciário", "Betim"), com um comentário
              dizendo que Ambiental ficava fora porque estava
              `publicada: false` — e ninguém voltou aqui quando ela (e
              Terras, e Paraopeba) publicaram depois. Resultado real:
              o dono navegou no celular e não achou uma frente que
              EXISTIA, porque esta barra tinha parado no dia em que foi
              escrita. `outrasZonas()` devolve toda `ZONA_PUBLICADA`
              menos a atual — a mesma fonte que `OutrasFrentes.tsx` e
              `FooterGlobal.tsx` já usam — para esta lista nunca mais
              atrasar em relação a `lib/zonas.ts`. */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/busca"
              className="rounded-md border border-[var(--cp-border)] px-2.5 py-1 text-xs font-medium hover:border-[var(--cp-primary)]"
            >
              Busca →
            </a>
            {outrasZonas("congresso").map((z) => (
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

          {/* Rodapé padrão do portal — ver `FooterGlobal.tsx`. */}
          <FooterGlobal />
        </div>
      </footer>
    </>
  );
}
