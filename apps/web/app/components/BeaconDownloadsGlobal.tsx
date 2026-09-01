"use client";

import { useEffect } from "react";

/**
 * Beacon global de downloads — conta no contador público qualquer clique em
 * link de PDF/CSV do portal (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Um listener só no layout raiz cobre TODOS os links de arquivo, sem tocar
 * em cada página: `document` captura o clique, procura o `<a>` mais próximo
 * e, se o href termina em `.pdf`/`.csv`, dispara o beacon fogo-e-esqueça em
 * `/api/contador?tipo=download`. Falha não bloqueia nada.
 */
export default function BeaconDownloadsGlobal() {
  useEffect(() => {
    function aoClique(ev: MouseEvent) {
      const alvo = ev.target as HTMLElement | null;
      const link = alvo?.closest?.("a") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (/\.(pdf|csv)(\?|#|$)/i.test(href)) {
        fetch("/api/contador?tipo=download", { method: "POST", keepalive: true }).catch(() => {});
      }
    }
    document.addEventListener("click", aoClique);
    return () => document.removeEventListener("click", aoClique);
  }, []);
  return null;
}
