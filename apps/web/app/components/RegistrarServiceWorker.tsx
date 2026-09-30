"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (`/sw.js`) para o modo offline do PWA.
 *
 * ═══ O QUE FAZ ═══
 *
 * No carregamento da página, registra o worker que guarda o casco do app e os
 * estáticos imutáveis. É o que permite instalar o portal como app e abrir a
 * tela `/offline` sem rede.
 *
 * ═══ POR QUE SEM ESTADO ═══
 *
 * Não há nada para exibir: o registro é efeito colateral. Sem `setState`, sem
 * re-render e sem risco de divergência de hidratação. Falha é ignorada — PWA
 * indisponível não pode quebrar a página.
 */

export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
