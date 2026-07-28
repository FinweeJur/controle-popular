"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * `<Link>` do eixo Cidades.
 *
 * Diferente do Congresso e do Judiciário, aqui o prefixo NÃO é constante:
 * a zona virou `/[municipio]`, então é `/betim` numa página de Betim e
 * `/bh` numa de Belo Horizonte. A cidade é lida do primeiro segmento do
 * próprio caminho — que é exatamente onde ela está.
 *
 * Por que descobrir pelo pathname em vez de receber por prop: são ~150
 * `<Link>` em 34 arquivos, muitos em JSX de várias linhas e outros
 * indiretos (`href={item.href}`, vindos de arrays de navegação). Receber a
 * cidade por prop exigiria tocar em todos eles; assim nenhum muda.
 *
 * É client component por causa do `usePathname()`. Não há custo prático: o
 * `next/link` já é client por dentro, e `usePathname` funciona também
 * durante a renderização no servidor.
 *
 * `<a href>` cru continua fora daqui, de propósito — é o que aponta para a
 * raiz do domínio e para as zonas irmãs, e não deve ganhar prefixo.
 */
export default function Link({ href, ...rest }: LinkProps) {
  const cidade = usePathname()?.split("/")[1] ?? "";
  const base = cidade ? `/${cidade}` : "";

  const prefixar = (h: LinkProps["href"]): LinkProps["href"] => {
    if (!base) return h;
    if (typeof h !== "string") {
      return h?.pathname?.startsWith("/")
        ? { ...h, pathname: `${base}${h.pathname}` }
        : h;
    }
    if (!h.startsWith("/") || h.startsWith("//")) return h;
    if (h === base || h.startsWith(`${base}/`)) return h;
    return h === "/" ? base : `${base}${h}`;
  };

  return <NextLink href={prefixar(href)} {...rest} />;
}
