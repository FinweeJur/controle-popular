"use client";

/**
 * InterceptadorLinks — rede de segurança de navegação do portal.
 *
 * O QUE É
 * -------
 * A casca persistente do site vive no layout raiz: barra superior (`TopNav`),
 * faixa de desenvolvimento, rodapé, `SeuNono`, `CompanheiroFlutuante` e o
 * `PlayerRadio` (o `<audio>` do rádio). No App Router, essa casca SÓ sobrevive
 * quando a navegação é client-side. Um `<a href="/pagina">` cru dispara reload
 * de documento inteiro: a página inteira é trocada e, junto com ela, o áudio
 * do rádio e o estado do pet.
 *
 * Já convertemos os `<a>` de página literais para `next/link`. Sobraram os de
 * `href` DINÂMICO (`href={item.href}`, vindos de arrays de navegação), que a
 * regra `no-html-link-for-pages` do ESLint não enxerga — e são justamente os
 * do menu de eixos e do rodapé. Este componente fecha a lacuna: captura o
 * clique em QUALQUER `<a>` interno de página e o entrega ao router do Next,
 * que navega no cliente.
 *
 * É o "padrão do que permanece ativo" pedido pelo dono (03/10/2026): a casca
 * não morre porque ninguém precisa lembrar de trocar cada link à mão.
 *
 * O QUE NÃO INTERCEPTA (de propósito)
 * -----------------------------------
 * - links externos, `mailto:`, `tel:` e âncoras puras (`#secao`);
 * - arquivo/dado (`.pdf`, `.json`, `.csv`, imagens, áudio…) e caminhos
 *   `/api/...` que são endpoint, não página;
 * - `download` e `target` que não seja `_self` (abrir em nova aba é intenção);
 * - clique com modificador (Ctrl/Cmd/Shift/Alt) ou botão do meio — quem quer
 *   abrir em nova aba continua podendo.
 *
 * É um listener em fase de CAPTURA: roda antes do `onClick` do `next/link`.
 * Quando o link já é `Link`, o `preventDefault` daqui faz o handler do Next
 * desistir (ele respeita `defaultPrevented`) e SÓ o nosso `router.push`
 * navega — nunca duas navegações.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Extensões que nunca são página do App Router (arquivo/dado). */
const EXTENSOES_ARQUIVO =
  /\.(pdf|json|csv|xml|zip|png|jpe?g|webp|svg|gif|mp3|mp4|txt|xlsx|ods|m3u8)$/i;

export function InterceptadorLinks() {
  const router = useRouter();

  useEffect(() => {
    const aoClicar = (ev: MouseEvent) => {
      // Já tratado por outro handler (ex.: um botão que fez preventDefault).
      if (ev.defaultPrevented) return;
      // Modificador ou botão do meio: deixa o navegador abrir em nova aba.
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) {
        return;
      }

      const alvo = ev.target as Element | null;
      const ancora = alvo?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!ancora) return;

      const href = ancora.getAttribute("href") || "";
      // Só caminho interno absoluto: externo, âncora pura e `//host` ficam fora.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Nova aba / download são intenção explícita.
      if (ancora.hasAttribute("download")) return;
      const target = ancora.getAttribute("target");
      if (target && target !== "_self") return;

      const caminho = href.split("#")[0].split("?")[0];
      if (EXTENSOES_ARQUIVO.test(caminho)) return;
      // `/api` é página (app/api/page.tsx); `/api/...` é endpoint.
      if (href.startsWith("/api/")) return;

      // Tudo certo: entrega ao router (navegação client-side).
      ev.preventDefault();
      router.push(href);
    };

    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [router]);

  return null;
}
