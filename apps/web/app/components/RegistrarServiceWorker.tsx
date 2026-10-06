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
 *
 * ═══ EM DESENVOLVIMENTO NÃO REGISTRA — E LIMPA O QUE EXISTIR ═══
 *
 * Medido em 06/10/2026: o worker guardava o casco e servia HTML/JS de builds
 * antigos para uma aba deixada aberta entre dois rebuilds do `next dev`. O
 * sintoma era cruel — o overlay do Next acusava um erro no código ATUAL
 * (linha do `layout.tsx`) que o navegador novo não reproduzia, porque a aba
 * rodava um bundle velho; um "bug fantasma" que custou horas.
 *
 * Em dev este componente, em vez de registrar, DESREGISTRA o worker e apaga
 * os caches: a próxima recarga já se cura sozinha, sem o dono precisar limpar
 * nada à mão. Em produção o registro continua exatamente como antes — o modo
 * offline é recurso do portal publicado.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registros) => {
          for (const registro of registros) void registro.unregister();
        })
        .catch(() => undefined);
      if (typeof caches !== "undefined") {
        caches
          .keys()
          .then((chaves) => {
            for (const chave of chaves) void caches.delete(chave);
          })
          .catch(() => undefined);
      }
      return;
    }

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
