import localFont from "next/font/local";

/**
 * Fontes de ícones do Brasil, self-hosted — mesma disciplina do
 * `app/fonts.ts` (bundled em build, sem CDN de terceiro).
 *
 * MÓDULO SEPARADO de propósito: o `fonts.ts` é importado pelo layout raiz
 * e `next/font` pré-carrega o que ele declara em TODA página; estas duas
 * só entram no bundle quando um componente de ícone as usar (pendente do
 * mapa letra→ícone — ver `docs/CREDITOS-MIDIA.md`).
 *
 * - Brasil Icons (Woodcutter Manero, 2020): donationware, uso pessoal e
 *   comercial livre, crédito ©Woodcutter Manero. Ícones nas letras A-Z/a-z
 *   + PUA U+F001/F002.
 * - Icones do Brasil (Marcos Ferreira Maranzana, 2009): licença NÃO
 *   verificada (fonttoolbox "Unknown"; fonts2u marca "Personal use") —
 *   decisão do dono pendente antes de usar em produção (ver
 *   `docs/CREDITOS-MIDIA.md`).
 */
export const brasilIcons = localFont({
  src: "./fonts/BrasilIcons.woff2",
  display: "swap",
});

export const iconesBrasil = localFont({
  src: "./fonts/IconesDoBrasil.woff2",
  display: "swap",
});