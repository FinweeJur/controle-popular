"use client";

/**
 * @file SinalizarErro404.tsx
 * @description Ponte entre a página 404 e o companheiro flutuante.
 *
 * `app/not-found.tsx` é um componente de SERVIDOR: não pode usar `useEffect`
 * nem acessar `window`. Mas a página precisa avisar o pet de que o endereço
 * não existe. Este cliente mínimo resolve isso: ao montar, dispara o evento
 * global `cp:companheiro-failed` (constante em `lib/companheiro/eventos.ts`),
 * e o CompanheiroFlutuante — que vive no layout raiz e já está montado —
 * escuta e entra no estado "failed".
 *
 * Renderiza `null`: é um sinal puramente comportamental, sem UI própria.
 * A mensagem de erro visível fica a cargo de `not-found.tsx`, que preserva
 * a semântica de acessibilidade (título, texto e links).
 */

import { useEffect } from "react";
import { sinalizarErroCompanheiro } from "@/lib/companheiro/eventos";

/** Dispara o sinal de 404 uma vez, quando a página de erro é montada. */
export function SinalizarErro404() {
  useEffect(() => {
    sinalizarErroCompanheiro();
  }, []);

  return null;
}
