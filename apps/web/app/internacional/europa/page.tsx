/**
 * @file apps/web/app/internacional/europa/page.tsx
 * @description Rota canônica /internacional/europa reexportando o Hub Europa.
 *
 * Garante acesso tanto via /europa quanto por /internacional/europa sem quebras de navegação.
 */

export { default, metadata } from "@/app/europa/page";
