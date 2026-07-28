"use client";

import { usePathname } from "next/navigation";

/**
 * Prefixo de caminho do eixo Cidades.
 *
 * `next/link` e o router prefixam a navegação interna sozinhos (via o
 * `<Link>` da zona, em `lib/betim/link.tsx`), mas `fetch()` cru e
 * `<a href>` montados a partir de string literal NÃO — foi um 404 real em
 * 2026-07-21, `POST /api/zap` em vez de `POST /betim/api/zap`, descoberto
 * só em teste ponta a ponta do formulário do Zap.
 *
 * Deixou de ser constante: a zona virou `/[municipio]`, então o prefixo é
 * `/betim` numa página de Betim e `/bh` numa de Belo Horizonte. Daí ser um
 * hook — a cidade sai do primeiro segmento do caminho atual.
 *
 * Em componente de SERVIDOR não dá para usar hook: lá a cidade vem do
 * `params` da rota, e o prefixo se monta com `/${municipio}` direto.
 */
export function useCaminhoDaCidade(): (path: string) => string {
  const cidade = usePathname()?.split("/")[1] ?? "";
  const base = cidade ? `/${cidade}` : "";
  return (path: string) => `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
