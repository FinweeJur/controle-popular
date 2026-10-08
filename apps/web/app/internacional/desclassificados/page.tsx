/**
 * @file apps/web/app/internacional/desclassificados/page.tsx
 * @description Rota de compatibilidade para a Central de Inteligência e Documentos Desclassificados.
 *
 * Papel no portal:
 * Mantém retrocompatibilidade com links antigos que apontavam para /internacional/desclassificados,
 * reexportando integralmente a página canônica /internacional/inteligencia.
 */

export { default, metadata } from "@/app/internacional/inteligencia/page";
