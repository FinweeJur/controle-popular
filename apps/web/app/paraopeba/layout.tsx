import type { Metadata } from "next";
import Link from "@/lib/paraopeba/link";

/**
 * Zona /paraopeba. Molde ENXUTO igual `/congresso` e `/judiciario` — decisão
 * do dono em 22/08/2026 (`docs/ESTADO.md`, decisão 5): esta zona nunca teve
 * `layout.tsx`, então nenhum link para as outras 11 rotas dela aparecia até
 * quem lia rolar cada página até o rodapé. Ver o comentário que já registrava
 * a lacuna em `paraopeba/page.tsx` (revisão de onboarding, 13/08).
 *
 * ⚠️ DUAS DIFERENÇAS DELIBERADAS frente ao molde de /congresso — as duas
 * porque esta zona cresceu SEM layout.tsx e cada página já resolveu sozinha
 * o que um layout normalmente resolveria:
 *
 * 1. SEM `<footer>` AQUI. As 12 rotas desta zona (o hub + as 11 subpáginas)
 *    já renderizam `<FooterGlobal />` manualmente, dentro do próprio
 *    `<main>` de cada uma (confirmado: `grep -rl FooterGlobal app/paraopeba`
 *    lista as 12). Um `<footer>` neste layout duplicaria o rodapé em TODAS
 *    elas. Consolidar é troca segura (mesma que /congresso já tem), mas
 *    mexer em 12 arquivos é escopo maior que "dar cabeçalho" — fica para
 *    quem pegar essa consolidação depois.
 * 2. `{children}` renderiza direto, SEM outro `<main id="conteudo-principal">`
 *    envolvendo. Diferente de /congresso (onde o `<main>` mora só no
 *    layout), aqui as 12 páginas JÁ têm o próprio `<main id="conteudo-
 *    principal" tabIndex={-1}>` (é o alvo do skip-link "Pular para o
 *    conteúdo" do layout raiz, WCAG 2.4.1 — ver `app/layout.tsx`). Envolver
 *    de novo geraria DOIS `<main>` aninhados e `id` duplicado — o
 *    skip-link e o "Ouvir esta página" passariam a mirar o primeiro `id`
 *    encontrado (o `<main>` vazio deste layout), não o conteúdo real.
 *
 * SEM `BuscaUniversal`, mesma razão do `/ambiental/layout.tsx`: a busca
 * precisa de `/paraopeba/api/busca` e `/api/chat`, e esta zona não tem
 * `api/` nenhuma (confirmado: `find app/paraopeba -maxdepth 1 -type d` não
 * lista nenhuma). Sem endpoint, BuscaUniversal erraria em silêncio.
 */
export const metadata: Metadata = {
  title: "Controle Popular — Paraopeba · Reparação da barragem em Brumadinho",
  description:
    "Clipping de imprensa, linha do tempo do processo, quem atua na reparação e o auxílio emergencial pago mês a mês pelo rompimento da barragem da Vale em Brumadinho. Portal independente.",
};

// Ordem = a mesma do hub (`paraopeba/page.tsx`, array `BLOCOS`): "Entenda"
// primeiro porque explica as siglas (NAE, PTR, zona quente) que aparecem em
// todo o resto; os quatro acervos de documento (Documentos, Biblioteca,
// Auditoria, Perícia) juntos, na ordem que o comentário de
// `pericia/page.tsx` já usa para diferenciar quem fala em cada um; "Análise"
// por último porque cruza os três acervos anteriores. `pericia` não tem
// cartão no hub (só é linkada de dentro de `auditoria`), mas é rota de
// primeiro nível como as outras dez — um cabeçalho existe para alcançar
// TODA a zona, não só o que o hub decidiu destacar em cartão.
const NAV = [
  { href: "/entenda", label: "Entenda" },
  { href: "/clipping", label: "Clipping" },
  { href: "/linha-do-tempo", label: "Linha do tempo" },
  { href: "/quem-atua", label: "Quem atua" },
  { href: "/auxilio", label: "Auxílio" },
  { href: "/execucao", label: "Execução" },
  { href: "/documentos", label: "Documentos" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/auditoria", label: "Auditoria" },
  { href: "/pericia", label: "Perícia" },
  { href: "/analise", label: "Análise" },
];

export default function ParaopebaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          {/* Wordmark da MARCA, botões de zona irmã e controles de
              tema/tamanho/contraste moram na barra global (`TopNav.tsx`,
              layout raiz). Aqui fica só o nome da zona como <a> cru: o
              <Link> da zona prefixaria e geraria /paraopeba/paraopeba. */}
          <a href="/paraopeba" className="font-display text-lg font-bold">
            Paraopeba
          </a>
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </>
  );
}
