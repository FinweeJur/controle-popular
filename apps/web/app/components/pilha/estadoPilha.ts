"use client";

/**
 * @file estadoPilha.ts
 * @description Estado compartilhado da pilha da esquerda (Seu Nonô, pata,
 * rádio e rastro mágico).
 *
 * REGRA DE PRODUTO (dono, 08/11/2026): só o FAB do Seu Nonô aparece parado.
 * A pata, o rádio e o rastro entram quando o ponteiro chega no Seu Nonô e
 * saem quando ele vai embora. Função ligada (rádio tocando, menu do bicho
 * aberto, trilha ativa) mantém o botão visível para poder desligar.
 *
 * REGRA DO ENCAIXE (dono, 08/11/2026): item que fica visível por estar
 * LIGADO não guarda o lugar antigo — encosta no Seu Nonô. Se só o rádio
 * está ligado, ele desce para o primeiro degrau; se rádio e rastro estão
 * ligados, eles ocupam os dois primeiros degraus. Quem calcula o degrau é
 * `useSlotPilha`, com a visibilidade publicada pelos próprios componentes.
 *
 * POR QUE UM STORE, E NÃO PROP: os três controles moram em componentes
 * diferentes (`SeuNono`, `PlayerRadio`, `RastroCursorBotao`), cada um com
 * sua caixa `fixed`. O ponteiro atravessa os três; um estado só evita que o
 * item de cima suma quando o mouse sai do FAB. É estado de interface, sem
 * rede e sem storage.
 */

import { useEffect, useState, useSyncExternalStore } from "react";

/** Todo elemento que participa da pilha leva este atributo no DOM. */
export const ATRIBUTO_PILHA = "data-cp-pilha";

/** Nome de cada degrau, de baixo para cima. */
export type SlotPilha = "pata" | "radio" | "rastro";

/** Estado compartilhado. O objeto é trocado inteiro a cada mudança. */
export interface EstadoPilha {
  /** Ponteiro no Seu Nonô (ou foco de teclado na pilha). */
  revelada: boolean;
  /** Menu do bicho aberto: a pata precisa continuar à mão para fechar. */
  menuPet: boolean;
  /** Rádio tocando ou com o índice aberto. */
  radioAtivo: boolean;
}

const ESTADO_INICIAL: EstadoPilha = {
  revelada: false,
  menuPet: false,
  radioAtivo: false,
};

let estado: EstadoPilha = ESTADO_INICIAL;
const ouvintes = new Set<() => void>();

/** Assina a troca; devolve a função de cancelamento. */
export function assinarPilha(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

/** Leitura síncrona do snapshot (o `useSyncExternalStore` pede isto). */
export function lerEstadoPilha(): EstadoPilha {
  return estado;
}

/** Liga/desliga a pilha avisando só quando o valor muda. */
export function definirPilhaRevelada(valor: boolean): void {
  atualizar({ revelada: valor });
}

/** Publica o menu do bicho aberto (chamado pelo `SeuNono`). */
export function definirMenuPet(aberto: boolean): void {
  atualizar({ menuPet: aberto });
}

/** Publica rádio tocando/índice aberto (chamado pelo `PlayerRadio`). */
export function definirRadioAtivo(ativo: boolean): void {
  atualizar({ radioAtivo: ativo });
}

function atualizar(patch: Partial<EstadoPilha>): void {
  const proximo = { ...estado, ...patch };
  const mudou =
    proximo.revelada !== estado.revelada ||
    proximo.menuPet !== estado.menuPet ||
    proximo.radioAtivo !== estado.radioAtivo;
  if (!mudou) return;
  estado = proximo;
  for (const cb of [...ouvintes]) cb();
}

/** No servidor nada está revelado: o HTML chega só com o Seu Nonô. */
export function useEstadoPilha(): EstadoPilha {
  return useSyncExternalStore(assinarPilha, lerEstadoPilha, () => ESTADO_INICIAL);
}

/** Compatibilidade: leitura direta da revelação. */
export function lerPilhaRevelada(): boolean {
  return estado.revelada;
}

/** Compatibilidade: assinatura da revelação. */
export const inscreverPilha = assinarPilha;

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

/** Ordem dos degraus, de baixo para cima. */
const ORDEM_PILHA: SlotPilha[] = ["pata", "radio", "rastro"];

/**
 * Degrau e visibilidade de um item da pilha.
 *
 * `ativoLocal` é a exceção daquele item (menu do bicho, rádio tocando,
 * trilha ligada) — a mesma que mantém o botão na tela sem o ponteiro.
 * O degrau conta quantos itens ABAIXO estão visíveis, então o item encosta
 * no Seu Nonô quando os de baixo somem.
 *
 * A exceção é publicada aqui (e não num efeito de cada componente) para o
 * item de cima saber que o de baixo está ocupando o degrau.
 */
export function useSlotPilha(
  slot: SlotPilha,
  ...ativos: boolean[]
): { visivel: boolean; indice: number } {
  const e = useEstadoPilha();
  const semHover = useSemHover();
  const ativoLocal = ativos.some(Boolean);

  useEffect(() => {
    if (slot === "pata") definirMenuPet(ativoLocal);
    if (slot === "radio") definirRadioAtivo(ativoLocal);
  }, [slot, ativoLocal]);

  const base = e.revelada || semHover;
  const visiveis: Record<SlotPilha, boolean> = {
    pata: base || e.menuPet,
    radio: base || e.radioAtivo,
    rastro: base || ativoLocal,
  };
  const abaixo = ORDEM_PILHA.slice(0, ORDEM_PILHA.indexOf(slot));
  const indice = abaixo.reduce((n, s) => n + (visiveis[s] ? 1 : 0), 0);

  return { visivel: visiveis[slot], indice };
}

/**
 * Classes de mostrar/esconder um item da pilha.
 *
 * Fica aqui para os três componentes não repetirem o ternário (e o CodeScene
 * não contar um condicional a mais no meio de componentes grandes).
 */
export function classesPilha(visivel: boolean): string {
  return visivel ? "opacity-100" : "pointer-events-none opacity-0";
}
