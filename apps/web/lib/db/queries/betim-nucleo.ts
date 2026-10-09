/**
 * @file betim-nucleo.ts
 * @description Núcleo compartilhado das consultas do eixo Cidades: o que mais
 * de um módulo `queries/betim*` precisa. Nasceu na divisão de
 * `queries/betim.ts` (09/10/2026), quando o CodeScene apontou "Number of
 * Functions in a Single Module" (95 funções contra teto de 75). `emBetim` é
 * usado por quase toda consulta do eixo, então mora aqui para os módulos de
 * domínio o importarem sem criar ciclo.
 *
 * A regra de negócio do eixo é a de `queries/betim.ts`: `idMunicipio` é o
 * primeiro parâmetro de toda consulta e é obrigatório.
 */
import { comBancoReserva } from "@/lib/db/reserva";
import type { DB } from "@/lib/db/client";

/**
 * `comBancoReserva` com as opções padrão do eixo Cidades: vazio = nulo ou
 * array sem linhas, sem fallback (padrão null), rótulo `betim`.
 *
 * 72 das ~99 chamadas do arquivo repetiam este MESMO objeto literal — a
 * refatoração de hotspots CodeScene de 08/10/2026 (saúde 7,09) centralizou
 * aqui. `T` infere SÓ da consulta (primeiro argumento), nunca das opções:
 * inferir das options travava o tipo em `{}/any` e derrubava os callers
 * (medido no `tsc` de 08/10). Quem precisa de `vazio`/`padrao` diferentes
 * continua chamando `comBancoReserva` direto.
 */
export function emBetim<T>(consulta: (db: DB) => Promise<T>): Promise<T | null> {
  return comBancoReserva<T | null>(consulta, {
    vazio: (r) => r === null || (Array.isArray(r) && r.length === 0),
    padrao: null,
    rotulo: "betim",
  });
}
