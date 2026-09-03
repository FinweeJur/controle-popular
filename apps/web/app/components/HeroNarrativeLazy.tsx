"use client";

import dynamic from "next/dynamic";

/**
 * Ponte de carregamento do hero narrativo.
 *
 * `ssr: false` no `next/dynamic` só é permitido dentro de um client
 * component — a home é server component, então ela importa ESTE wrapper,
 * e o wrapper importa o hero sem SSR (o hero é animação de browser; no
 * servidor ele só gastaria hidratação). Enquanto o chunk chega, nada é
 * renderizado no lugar: a home tem o conteúdo de dados logo abaixo e o
 * layout reserva a altura via classe CSS, sem salto.
 */
const HeroNarrative = dynamic(() => import("./HeroNarrative"), {
  ssr: false,
});

export default function HeroNarrativeLazy() {
  return <HeroNarrative />;
}
