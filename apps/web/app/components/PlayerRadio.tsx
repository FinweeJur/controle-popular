"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Radio } from "lucide-react";

/**
 * Player persistente da Rádio Brasil de Fato — toca durante a navegação.
 *
 * Papel no portal: oferecer a rádio parceira sem tirar o leitor do site. O
 * `<audio>` vive no layout RAIZ (`app/layout.tsx`), que não desmonta na
 * navegação entre páginas — por isso a transmissão continua ao mudar de
 * página ou de eixo. Um player dentro do rodapé pararia a cada clique, porque
 * o rodapé é renderizado por página.
 *
 * Fonte/stream:
 * - Endpoint direto do provedor da emissora: `https://s09.hstbr.net:8238/live`
 *   (AAC), o mesmo que o Radios.com.br usa no Player Muses/Flowplayer da rádio
 *   98.9 FM. Página de referência:
 *   https://www.radios.com.br/aovivo/radio-brasil-de-fato-989-fm/63689
 *
 * Decisões técnicas:
 * - Sem autoplay: o navegador bloqueia áudio com som sem gesto do usuário; o
 *   play é sempre por clique (botão flutuante ou o botão do rodapé, que
 *   dispara o evento global `cp:radio-toggle`).
 * - `preload="none"`: não baixa a transmissão antes de alguém pedir.
 */

const STREAM_URL = "https://s09.hstbr.net:8238/live";

export default function PlayerRadio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const alternar = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      setCarregando(true);
      void el.play().catch(() => setCarregando(false));
    } else {
      el.pause();
    }
  }, []);

  // O botão do rodapé (outro componente, server) não alcança este estado:
  // ele sinaliza pelo evento global. Assim o controle fica em um lugar só.
  useEffect(() => {
    const aoEvento = () => alternar();
    window.addEventListener("cp:radio-toggle", aoEvento);
    return () => window.removeEventListener("cp:radio-toggle", aoEvento);
  }, [alternar]);

  const rotulo = tocando
    ? "Pausar a Rádio Brasil de Fato"
    : "Ouvir a Rádio Brasil de Fato";

  return (
    <>
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="none"
        onPlay={() => {
          setTocando(true);
          setCarregando(false);
        }}
        onPause={() => setTocando(false)}
        onWaiting={() => setCarregando(true)}
        onPlaying={() => setCarregando(false)}
        onError={() => {
          setTocando(false);
          setCarregando(false);
        }}
      />
      <button
        type="button"
        onClick={alternar}
        aria-label={rotulo}
        title={rotulo}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-2 text-xs font-semibold text-text shadow-lg backdrop-blur transition-colors hover:border-primary hover:text-primary print:hidden"
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          {tocando ? (
            <Pause size={16} aria-hidden="true" className="text-primary" />
          ) : (
            <Radio size={16} aria-hidden="true" className="text-primary" />
          )}
        </span>
        <span className="hidden sm:inline">
          {carregando ? "Sintonizando…" : tocando ? "Rádio Brasil de Fato" : "Ouvir a rádio"}
        </span>
        {tocando && (
          <span
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-primary"
          />
        )}
      </button>
    </>
  );
}
