"use client";

/**
 * @file estadoPilha.ts
 * @description Estado compartilhado da pilha da esquerda (Seu Nonô, pata,
 * rádio e rastro).
 *
 * REGRA DE PRODUTO (dono, 08/11/2026): só o FAB do Seu Nonô aparece parado.
 * A pata, o rádio e o rastro mágico entram quando o ponteiro chega perto do
 * Seu Nonô e saem quando ele vai embora. Função ligada (rádio tocando, menu
 * do bicho aberto, trilha ativa) mantém o botão visível para poder desligar.
 *
 * POR QUE UM STORE, E NÃO PROP: os três controles moram em componentes
 * diferentes (`SeuNono`, `PlayerRadio`, `RastroCursorBotao`), cada um com sua
 * caixa `fixed`. O ponteiro atravessa os três; um estado só evita que o item
 * de cima suma quando o mouse sai do FAB. É estado de interface, sem rede e
 * sem storage.
 */

import { useEffect, useState, useSyncExternalStore } from "react";

/** Todo elemento que participa da pilha leva este atributo no DOM. */
export const ATRIBUTO_PILHA = "data-cp-pilha";

let revelada = false;
const ouvintes = new Set<() => void>();

/** Leitura síncrona: o `useSyncExternalStore` pede o snapshot atual. */
export function lerPilhaRevelada(): boolean {
  return revelada;
}

/** Assina a troca; devolve a função de cancelamento. */
export function assinarPilha(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

/** Liga/desliga a pilha avisando só quando o valor muda. */
export function definirPilhaRevelada(valor: boolean): void {
  if (valor === revelada) return;
  revelada = valor;
  for (const cb of [...ouvintes]) cb();
}

/** No servidor nada está revelado: o HTML chega só com o Seu Nonô. */
export function usePilhaRevelada(): boolean {
  return useSyncExternalStore(assinarPilha, lerPilhaRevelada, () => false);
}

/**
 * Tela sem hover (celular, tablet): a pilha fica sempre visível.
 *
 * Não existe "mouse em cima do Seu Nonô" no dedo; esconder por padrão
 * deixaria pata, rádio e rastro inalcançáveis. O layout de toque é o mesmo
 * de antes: os quatro botões parados na coluna.
 */
export function useSemHover(): boolean {
  const [semHover, setSemHover] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(hover: none), (pointer: coarse)");
    const aplicar = () => setSemHover(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  return semHover;
}

/**
 * "Este item da pilha deve aparecer agora?"
 *
 * Junta as três razões num lugar só: ponteiro no Seu Nonô (`revelada`), tela
 * sem hover (`semHover`) e as exceções do item — rádio tocando, menu do bicho
 * aberto, trilha ligada. Os componentes chamam com as exceções e não repetem
 * a lógica.
 */
export function usePilhaVisivel(...excecoes: boolean[]): boolean {
  const revelada = usePilhaRevelada();
  const semHover = useSemHover();
  return revelada || semHover || excecoes.some(Boolean);
}
