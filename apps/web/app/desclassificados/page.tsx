/**
 * @file apps/web/app/desclassificados/page.tsx
 * @description Rota canônica/atalho para o Acervo de Documentos Desclassificados do G20.
 *
 * Papel no portal:
 * Permite acesso direto pela URL amigável /desclassificados,
 * compartilhando a mesma infraestrutura, SSR e lógica de
 * /internacional/desclassificados no padrão das Seis Qualidades (AGENTS.md §8).
 */

export { default, metadata } from "@/app/internacional/desclassificados/page";
