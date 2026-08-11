"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Dispara um "carregamento de página" para o contador de visualizações
 * (`page_views` — ver `app/api/pageview/route.din.ts`) a cada rota que a
 * pessoa abre.
 *
 * Vive no layout raiz (`app/layout.tsx`), não em cada `layout.tsx` de zona:
 * o layout raiz não desmonta entre navegações dentro do app router, então
 * `usePathname()` é o que faz o efeito RE-DISPARAR a cada troca de rota — um
 * `useEffect` com array vazio só contaria a primeira página de cada sessão
 * de navegação, perdendo toda troca feita por `<Link>` (client-side, sem
 * reload).
 *
 * `sendBeacon`, não `fetch`: não bloqueia a renderização e o navegador
 * garante a entrega mesmo que a pessoa saia da página antes da resposta —
 * o caso comum de quem só passa lendo. Contador APROXIMADO: um disparo por
 * carregamento, sem dedupe por sessão/usuário (visualização = carregamento
 * de página, não visitante único).
 */
export default function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      navigator.sendBeacon(`/api/pageview?path=${encodeURIComponent(pathname)}`);
    } catch {
      // sendBeacon indisponível (navegador muito antigo) — perder uma
      // contagem não é problema num contador aproximado.
    }
  }, [pathname]);

  return null;
}
