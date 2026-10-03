"use client";

/**
 * PetIcone — a carinha do bichinho, recortada da folha do Petdex.
 *
 * Por que existe: os seletores (menu da pata e cartão do Seu Nonô) precisam
 * mostrar QUEM é o pet, não só o nome. O sprite é a própria folha de estados
 * (8×192 por linha, 9 linhas), então aqui recorta o quadro 0 da linha 0
 * ("idle") com `background-position`, na escala pedida.
 *
 * Sem estado e sem efeito: é só um recorte. A folha vem de `p.caminho`.
 */

import type { PetCompanheiro } from "./companheiroPets";

const CELL_W = 192;
const CELL_H = 208;

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
        backgroundSize: `${CELL_W * escala}px ${CELL_H * escala}px`,
        // linha 0 = "idle", quadro 0 — o bichinho parado, virado para a frente.
        backgroundPosition: `${-pet.bbox.x * escala}px ${-pet.bbox.y * escala}px`,
      }}
    />
  );
}
