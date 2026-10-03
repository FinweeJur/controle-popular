"use client";

/**
 * PetIcone — a carinha do bichinho, recortada da folha do Petdex.
 *
 * Por que existe: os seletores (menu da pata e cartão do Seu Nonô) precisam
 * mostrar QUEM é o pet, não só o nome. O sprite é a própria folha de estados
 * (8×192 por linha, 9 linhas), então aqui recorta o quadro 0 da linha 0
 * ("idle") com `background-position`, na escala pedida.
 *
 * Como o recorte funciona (mesma conta do `CompanheiroFlutuante`): o
 * `background-size` é a FOLHA INTEIRA (8 colunas × 9 linhas) ampliada pela
 * escala, não uma célula só. Se o tamanho for de uma célula, o navegador
 * espreme as 72 células dentro de ~19 px e o ícone vira um borrão de pixels
 * — o defeito relatado pelo dono em 03/10/2026. O `background-position`
 * então desloca até a célula do pet e o quadro "idle".
 *
 * Sem estado e sem efeito: é só um recorte. A folha vem de `p.caminho`.
 */

import type { PetCompanheiro } from "./companheiroPets";

const CELL_W = 192;
const CELL_H = 208;
const SHEET_COLS = 8;
const SHEET_ROWS = 9;

export function PetIcone({
  pet,
  altura = 22,
  className = "",
}: {
  pet: PetCompanheiro;
  altura?: number;
  className?: string;
}) {
  const escala = altura / pet.bbox.h;
  const largura = Math.max(1, Math.round(pet.bbox.w * escala));
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-no-repeat ${className}`}
      style={{
        width: largura,
        height: altura,
        backgroundImage: `url(${pet.caminho})`,
        // Folha INTEIRA ampliada pela escala — recortar uma célula a partir
        // dela é o que evita o borrão (ver cabeçalho).
        backgroundSize: `${SHEET_COLS * CELL_W * escala}px ${SHEET_ROWS * CELL_H * escala}px`,
        // linha 0 = "idle", quadro 0 — o bichinho parado, virado para a frente.
        backgroundPosition: `${-pet.bbox.x * escala}px ${-pet.bbox.y * escala}px`,
      }}
    />
  );
}
