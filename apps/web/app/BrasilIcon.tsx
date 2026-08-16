"use client";

import { brasilIcons, iconesBrasil } from "./fonts-icones";

/**
 * Mapa nome → letra, preenchido via Character Map do Windows
 * (ver `docs/CREDITOS-MIDIA.md`).
 *
 * Formato: `{ nome: "letra" }` onde nome é descritivo (ex. "tucano")
 * e letra é o caractere que renderiza o glifo na fonte respectiva.
 *
 * Brasil Icons (Woodcutter): 11 figuras pedidas — 9 mapeadas, 2 faltando.
 * Icones do Brasil (Maranzana): 13 figuras pedidas — 13 mapeadas.
 */
const MAP_BRASIL_ICONS: Record<string, string> = {
  tucano: "D",
  cacto: "u",
  arara: "y",
  "cafe em graos": "U",
  maraca: "l",
  arvore: "k",
  "mapa do brasil com bandeira": "h",
  havaianas: "j",
  capoeirista: "H",
  // TODO: cruz e mapa da america latina — dono não reportou ainda
};

const MAP_ICONES_BRASIL: Record<string, string> = {
  tartaruga: "n",
  papagaio: "a",
  banana: "b",
  capoeira: "e",
  violao: "g",
  palmeira: "h",
  onca: "s",
  pandeiro: "t",
  santa: "r",
  mico: "Q",
  "pao de acucar": "U",
  indigena: "M",
  saci: "X",
};

type Props = {
  nome: string;
  fonte: "brasil-icons" | "icones-do-brasil";
  className?: string;
  size?: number;
  animate?: "none" | "hover" | "pulse" | "spin";
};

const FONT_MAP = {
  "brasil-icons": { data: MAP_BRASIL_ICONS, cls: brasilIcons.className },
  "icones-do-brasil": { data: MAP_ICONES_BRASIL, cls: iconesBrasil.className },
} as const;

const ANIM_CLS = {
  none: "",
  hover: "cp-icon-hover",
  pulse: "cp-icon-pulse",
  spin: "cp-icon-spin",
} as const;

export function BrasilIcon({
  nome,
  fonte,
  className = "",
  size = 24,
  animate = "none",
}: Props) {
  const { data, cls } = FONT_MAP[fonte];
  const letra = data[nome];
  const anim = ANIM_CLS[animate];

  if (!letra) {
    return (
      <span
        className={`inline-block rounded bg-surface-2 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${cls} ${anim} ${className}`}
      style={{ fontSize: size, width: size, height: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {letra}
    </span>
  );
}
