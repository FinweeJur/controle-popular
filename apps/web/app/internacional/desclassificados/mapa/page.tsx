/**
 * @file apps/web/app/internacional/desclassificados/mapa/page.tsx
 * @description Rota de compatibilidade para o Mapa Global de Inteligência.
 *
 * Papel no portal:
 * Mantém retrocompatibilidade com links antigos que apontavam para /internacional/desclassificados/mapa,
 * reexportando integralmente a página canônica /internacional/inteligencia/mapa.
 */

export { default, metadata } from "@/app/internacional/inteligencia/mapa/page";
