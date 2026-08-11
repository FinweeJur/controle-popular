import type { Metadata } from "next";

/**
 * `/funcaosocialterra/mapa` — o globo 3D de terras públicas, publicado como
 * arquivo estático dentro do portal (`apps/web/public/terras/globo/`).
 *
 * O globo é um app pronto e funcional (Three.js puro, sem build) que vivia
 * só em ambiente local, nunca publicado — ver a auditoria que trouxe os
 * arquivos para este portal. Ele já resolve o próprio layout interno (HUD
 * nos 4 cantos do canvas), então esta página só entra com o que ele não
 * tem: cabeçalho do portal e o link de volta ao hub da frente.
 *
 * Sem layout.tsx próprio: `/funcaosocialterra` (o hub) não tem um hoje, e
 * criar um layout de zona só para esta única rota adicionaria cabeçalho ao
 * hub também — mudança de comportamento fora do que foi pedido aqui.
 */
export const metadata: Metadata = {
  title: "Mapa 3D — Função social da terra | Controle Popular",
  description:
    "Globo 3D interativo com vazio cadastral, terras públicas certificadas, assentamentos e territórios quilombolas em Minas Gerais, camada por camada.",
};

export default function MapaTerrasPage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          {/* <a> puro, não Link de zona: a raiz do domínio está fora de
              /funcaosocialterra, e um wrapper de zona a prefixaria. */}
          <a href="/" className="font-display text-lg font-bold text-text">
            Controle Popular{" "}
            <span className="opacity-60">· Função social da terra</span>
          </a>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <a
              href="/funcaosocialterra"
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-soft hover:border-primary hover:text-text"
            >
              ← Voltar para função social da terra
            </a>
          </div>
        </div>
      </header>

      <iframe
        src="/terras/globo/index.html"
        title="Globo 3D — terras públicas e vazio cadastral em Minas Gerais"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}
