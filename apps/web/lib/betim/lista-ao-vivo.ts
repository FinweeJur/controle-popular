"use client";

import { useEffect, useState } from "react";

/**
 * Troca a lista que veio embutida no HTML estático pela lista ao vivo da
 * API, depois que o componente monta.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `/zap` e `/compra-e-venda` são páginas ESTÁTICAS (`dynamic =
 * "force-static"`): o HTML delas sai do build, e o build lê Postgres porque
 * não tem binding de D1 — binding é do runtime do Worker, não existe na
 * máquina que builda. Mas cadastro e moderação gravam no D1 (ver
 * `lib/db/queries/betimD1.ts`). Sem esta troca, aprovar um negócio na
 * moderação só o publicaria no rebuild seguinte, e o rebuild custa 15 a 20
 * minutos — na prática, quem cadastra não vê o próprio negócio entrar.
 *
 * A lista embutida NÃO é desperdício: é ela que quem chega sem JavaScript
 * vê, é ela que o buscador indexa, e é ela que aparece no primeiro quadro
 * antes de a resposta chegar. O que a API faz é corrigir o que envelheceu
 * desde o build.
 *
 * ═══ QUANDO A RESPOSTA NÃO SUBSTITUI ═══
 *
 * Só substitui com resposta OK e sem `message`. As duas rotas devolvem
 * `message` exatamente no caso "não consegui consultar" (binding ausente),
 * e nesse caso `rows` vem `[]` — trocar aí apagaria a lista boa por uma
 * vazia. Lista vazia SEM `message` é resposta honesta ("essa cidade não tem
 * nenhum aprovado hoje") e substitui normalmente.
 *
 * No alvo GitHub Pages não existe rota de API: o fetch dá 404, `r.ok` é
 * falso, e a página continua com o que foi buildado. É degradação, não
 * quebra.
 */
export function useListaAoVivo<T>(caminhoApi: string, embutida: T[]): T[] {
  const [linhas, setLinhas] = useState(embutida);

  useEffect(() => {
    // `descartado` e não `AbortController`: a resposta que chega depois de
    // o componente sair não pode chamar `setLinhas` (aviso do React), mas
    // também não há razão para cancelar um GET já em voo.
    let descartado = false;
    fetch(caminhoApi)
      .then((r) => (r.ok ? r.json() : null))
      .then((dado: { rows?: T[]; message?: string } | null) => {
        if (descartado || !dado || dado.message || !Array.isArray(dado.rows)) return;
        setLinhas(dado.rows);
      })
      .catch(() => {});
    return () => {
      descartado = true;
    };
  }, [caminhoApi]);

  return linhas;
}
