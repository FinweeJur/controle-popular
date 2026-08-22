/**
 * Cabeçalho da zona /funcaosocialterra — molde ENXUTO igual `/congresso` e
 * `/judiciario` (wordmark + nav, sem `BuscaUniversal`: esta zona não tem
 * `api/` nenhuma, mesma razão do `/ambiental/layout.tsx` e de
 * `/paraopeba/layout.tsx`).
 *
 * ⚠️ NÃO é `layout.tsx`, DE PROPÓSITO. Esta zona tem 3 rotas — este hub,
 * `/alertas` e `/mapa` — e `/mapa` é o globo 3D em TELA CHEIA
 * (`h-dvh`) com HUD nos 4 cantos do CANVAS. Um `layout.tsx` de zona colaria
 * em TODAS as três, inclusive `/mapa`; o rodapé desta zona já é manual
 * por-página por essa mesma razão (ver o comentário em `page.tsx`, linhas
 * finais, e em `mapa/page.tsx`). Este componente estende o MESMO padrão
 * manual ao cabeçalho: cada página importa `<Cabecalho />` e a coloca antes
 * do próprio `<main>` — nenhuma delas precisa de outro `<main
 * id="conteudo-principal">` envolvendo (cada uma já tem o seu).
 *
 * ⚠️ SOBRE O HUD EM /mapa, verificado antes de decidir: o HUD do globo
 * (`public/terras/globo/css/hud.css`) usa `position: fixed` dentro do
 * `<iframe>` do globo (`GloboIframe.tsx`) — um DOCUMENTO PRÓPRIO, com
 * `<html>/<body>` dele. `fixed` ali é relativo ao viewport DO IFRAME, não ao
 * da página do portal. O iframe tem `flex-1` dentro de `<main
 * className="flex flex-1 flex-col">`: um cabeçalho mais alto (mais um link
 * de nav, ou quebra de linha em tela estreita) só reduz a ALTURA da caixa do
 * iframe — o HUD reacomoda nos 4 cantos DESSA caixa sozinho, porque é o
 * viewport dele que mudou, não uma sobreposição por cima. Por isso este
 * cabeçalho fino é seguro em `/mapa`: não há como ele colidir com o HUD, só
 * com o próprio espaço que sobra para o globo (que já era menor por causa do
 * cabeçalho ORIGINAL desta página, antes desta mudança — este componente só
 * troca aquele cabeçalho por um consistente com o resto da zona, mesma
 * altura de uma linha).
 *
 * `<a>` cru em vez do `<Link>` de zona: só 3 destinos, usados em 3 lugares —
 * criar `lib/terras/link.tsx` só para isso seria mecanismo novo para um
 * problema que já não tem duplicação (ver `outrasZonas()`/`lib/zonas.ts`
 * sobre NÃO reinventar). Mesmo padrão que as 3 páginas desta zona já usam
 * nos próprios links internos (ex.: os botões "Ver mapa completo (3D) →" do
 * hub).
 */
const NAV = [
  { href: "/funcaosocialterra", label: "Visão geral" },
  { href: "/funcaosocialterra/mapa", label: "Mapa 3D" },
  { href: "/funcaosocialterra/alertas", label: "Alertas" },
];

export default function Cabecalho() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
        {/* Wordmark da MARCA e controles de tema/tamanho/contraste moram na
            barra global (`TopNav.tsx`, layout raiz). Aqui fica só o nome da
            zona, para `/funcaosocialterra` — nunca `/` — porque é para lá
            que as outras duas rotas da zona devem levar de volta. */}
        <a href="/funcaosocialterra" className="font-display text-lg font-bold">
          Função social da terra
        </a>
        <nav className="flex flex-1 flex-wrap gap-4 text-sm">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
