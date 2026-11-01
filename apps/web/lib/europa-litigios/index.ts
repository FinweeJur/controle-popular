/**
 * @file apps/web/lib/europa-litigios/index.ts
 * @description Barrel da subfrente de litígios transnacionais. Reexporta
 * tipos e dados para a página e para os testes, sem puxar `node:fs` nem
 * qualquer módulo de servidor.
 */

export * from "./tipos";
export {
  ADPF,
  CLIPPING,
  CONEXOES,
  DATA_ACESSO,
  LINHA_DO_TEMPO,
  LITIGIOS,
  listarFontes,
  POSICIONAMENTOS,
} from "./dados";
