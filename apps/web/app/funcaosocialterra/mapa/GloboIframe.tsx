"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Iframe do globo, com deep-link opcional `?camada=X&idx=N` -> `#area=X:N`.
 *
 * O globo (`js/main.js`, `abrirAreaDoEndereco`) já sabe abrir uma feature
 * específica pelo hash `#area=<camada>:<índice>` — mecanismo existente,
 * usado para o endereço compartilhável de dentro do próprio globo. O que
 * faltava era ALGUÉM DE FORA (a página da norma, em
 * `/[municipio]/camara/legislacao`) conseguir montar esse hash sem embutir
 * conhecimento do globo — daqui para lá o contrato é só `?camada=&idx=`.
 *
 * `output: 'export'` não aceita `searchParams` no server component (vira
 * rota dinâmica); por isso isto é client component com `useSearchParams()`,
 * dentro de `<Suspense>` — mesmo padrão de `ListaLegislacao.tsx`.
 */
function IframeComParametros() {
  const sp = useSearchParams();
  const camada = sp.get("camada");
  const idx = sp.get("idx");
  const hash = camada && idx != null && idx !== "" ? `#area=${encodeURIComponent(camada)}:${idx}` : "";

  return (
    <iframe
      src={`/terras/globo/index.html${hash}`}
      title="Globo 3D — terras públicas e vazio cadastral em Minas Gerais"
      className="w-full flex-1 border-0"
    />
  );
}

export default function GloboIframe() {
  return (
    <Suspense
      fallback={
        <iframe
          src="/terras/globo/index.html"
          title="Globo 3D — terras públicas e vazio cadastral em Minas Gerais"
          className="w-full flex-1 border-0"
        />
      }
    >
      <IframeComParametros />
    </Suspense>
  );
}
