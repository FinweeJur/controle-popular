import NextLink from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Fábrica do `<Link>` de cada zona.
 *
 * Existe para substituir o `basePath` do Next, que sumiu na unificação dos
 * três repos num app só (um app tem UM basePath, e aqui são três zonas).
 *
 * O que o `basePath` fazia e agora é feito aqui: prefixar automaticamente
 * TODA navegação interna do `next/link` e do router. Ele nunca tocou em
 * `<a href>` cru — por isso as âncoras para a raiz do domínio e para as
 * zonas irmãs continuam sendo `<a>` e continuam corretas sem passar por
 * aqui.
 *
 * Foi escrito como wrapper, e não como reescrita dos ~150 `href` no
 * código, de propósito: muitos ficam em JSX de várias linhas e outros são
 * indiretos (`href={item.href}`, vindos de arrays de navegação). Um
 * find-and-replace erraria em silêncio, e o modo de falha dessa classe de
 * erro é 404 mudo — que os comentários dos repos registram ter acontecido
 * três vezes. Trocando o import, toda forma de `href` passa a valer.
 */
export function criarLinkDaZona(basePath: string) {
  const prefixar = (href: LinkProps["href"]): LinkProps["href"] => {
    if (typeof href !== "string") {
      // UrlObject: só o `pathname` é caminho; query e hash ficam como estão.
      return href?.pathname?.startsWith("/")
        ? { ...href, pathname: `${basePath}${href.pathname}` }
        : href;
    }
    // Absoluta (http, mailto, tel), âncora ou já prefixada: não mexer.
    if (!href.startsWith("/") || href.startsWith("//")) return href;
    if (href === basePath || href.startsWith(`${basePath}/`)) return href;
    return href === "/" ? basePath : `${basePath}${href}`;
  };

  return function Link({ href, ...rest }: LinkProps) {
    return <NextLink href={prefixar(href)} {...rest} />;
  };
}
