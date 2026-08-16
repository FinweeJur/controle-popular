"use client";

import { brasilIcons, iconesBrasil } from "./fonts-icones";

/**
 * Mapa nome → letra. Preenchido depois que o dono usar o Character Map
 * e reportar as respostas (ver `docs/CREDITOS-MIDIA.md`).
 *
 * Formato: `{ nome: "letra" }` onde nome é descritivo (ex. "tucano")
 * e letra é o caractere que renderiza o glifo na fonte respectiva.
 *
 * Enquanto vazio, o componente renderiza um quadrado placeholder.
 */
const MAP_BRASIL_ICONS: Record<string, string> = {
  // TODO: preencher com Character Map (Brasil Icons - Woodcutter)
  // Exemplo: "tucano": "h",
};

const MAP_ICONES_BRASIL: Record<string, string> = {
  // TODO: preencher com Character Map (Icones do Brasil - Maranzana)
  // Exemplo: "tartaruga": "k",
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
