"use client";

/**
 * Coleta os headings da página corrente para o sumário do rodapé e para o
 * widget lateral de Capítulos — os dois montados no layout raiz, que NÃO
 * desmonta na navegação (regra §5.13).
 *
 * Três defeitos medidos em 14/10/2026 que levaram a esta forma:
 * 1. effect sem `pathname` rodava UMA vez — os capítulos da primeira
 *    página sobreviviam às demais ("aleatórios");
 * 2. páginas que renderizam conteúdo no cliente nasciam com DOM vazio e o
 *    sumário ficava vazio para sempre;
 * 3. observar o `main` direto deixava o observer ÓRFÃO na navegação:
 *    o effect podia rodar quando o `main` novo ainda não estava no DOM
 *    (corrida com o Suspense do App Router), e a troca de nó escapava do
 *    observer preso no nó velho — medido como falha intermitente.
 *
 * A forma final: observa o `document.body` (nunca sai do DOM), RE-QUERIED
 * o container a cada coleta (o `main` troca a cada rota) e só grava o
 * estado quando o conteúdo MUDA de verdade — sem isso o próprio re-render
 * do widget geraria mutação, que geraria coleta, que geraria re-render.
 *
 * `coletarSecoes` é idempotente: reus id já gravados não mudam nada.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { coletarSecoes, type SecaoIndice } from "./indice-pagina";

/** Intervalo mínimo entre coletas — o React pinta em rajada. */
const INTERVALO_MS = 150;

/** Conteúdo igual? (id, título e nível — o que o sumário exibe.) */
function iguais(a: SecaoIndice[], b: SecaoIndice[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x.id === b[i].id && x.titulo === b[i].titulo && x.nivel === b[i].nivel);
}

/**
 * Devolve os headings (h2 e h3) do container indicado, atualizando a cada
 * navegação e a cada mutação de DOM que adicione conteúdo. O consumidor
 * corta o que quiser (só h2, limite) depois — ver `CapitulosFlutuantes`.
 *
 * @param seletor seletor CSS do container (normalmente "main")
 */
export function useColetaSecoes(seletor = "main"): SecaoIndice[] {
  const [itens, setItens] = useState<SecaoIndice[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const coletar = () => {
      // Re-queried: o `main` da rota nova pode só ter entrado agora.
      const container = document.querySelector(seletor);
      if (!container) return;
      const novos = coletarSecoes(container);
      // Só grava se mudou — senão o re-render do widget vira mutação,
      // que vira coleta, que vira re-render (loop).
      setItens((antigos) => (iguais(antigos, novos) ? antigos : novos));
    };

    coletar();

    // Observa o BODY e não o container: na navegação o nó do `main` é
    // substituído e um observer preso a ele nunca mais veria nada.
    // Throttle com trailing (não re-agenda se já agendado): mutação a cada
    // quadro (transcrição da rádio, por exemplo) não pode engolir o timer.
    const observer = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        coletar();
      }, INTERVALO_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [seletor, pathname]);

  return itens;
}
