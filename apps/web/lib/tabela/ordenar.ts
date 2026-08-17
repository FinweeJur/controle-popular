/**
 * ═══ ORDENAR E FILTRAR LISTAS DE DADO — A LÓGICA PURA ═══
 *
 * Pedido do dono (16/08/2026, ver `docs/planos/TODO-PROXIMAS-RODADAS.md` §10):
 * as listas do portal (contratos, licitações, alertas, emendas, diárias…) devem
 * poder ORDENAR e FILTRAR por campo. Antes de colar isso num componente, o
 * mecanismo vive aqui, em lógica pura — o mesmo molde de
 * `lib/assistente/compor.ts`: tudo testável sem React, e o componente (quando
 * existir) só liga estado e UI.
 *
 * ═══ O QUE ISTO É, E O QUE ISTO NÃO É ═══
 *
 * - `ordenarPor` devolve uma NOVA lista (imutável — quem chama decide se
 *   aplica). Comparador de empate é estável: `Array.prototype.sort` do V8
 *   preserva a ordem original, e é dela que a paginação depende para não
 *   "pular" linha entre páginas.
 * - `filtrarPorIgual` compara o valor EXATO do campo (números, datas,
 *   enums) — é o filtro de seletor, não de busca.
 * - `filtrarPorTexto` procura o termo dentro do texto do campo, sem acento e
 *   sem caixa — é o filtro de caixa de busca.
 * - Texto ordena SEM acento e SEM caixa, do mesmo jeito que a `/busca` trata
 *   o documento (`lib/busca/normalizar.ts`): "Água" e "agua" ficam juntas, e
 *   a régua é a MESMA do resto do portal.
 * - `null`/`undefined`/`NaN`/data inválida vão para o FIM da lista nas duas
 *   direções: dado ausente é menos confiável que dado presente, e o topo da
 *   tela é o lugar de maior atenção (mesma decisão do radar em
 *   `scripts/coletar-noticias-paraopeba.py`). A direção só inverte os
 *   presentes; os ausentes não "sobem".
 *
 * ═══ QUANDO CALA ═══
 *
 * Tipo de campo desconhecido não existe: o union `TipoCampo` limita a três
 * comportamentos medidos (texto, número, data ISO). Data fora de ISO
 * (ex.: "20/07/2026" dd/mm/aaaa) NÃO é reconhecida — quem ordena data tem que
 * guardar ISO no dado (o projeto já faz isso; ver `data` dos itens do radar).
 */

import { semAcento } from "@/lib/busca/normalizar";

export type Direcao = "asc" | "desc";
export type TipoCampo = "texto" | "numero" | "data";

/** Compara dois valores do MESMO campo, devolvendo -1 | 0 | 1. */
export function compararValores(
  a: unknown,
  b: unknown,
  tipo: TipoCampo
): number {
  if (tipo === "numero") return compararNumero(a, b);
  if (tipo === "data") return compararData(a, b);
  return compararTexto(a, b);
}

function compararTexto(a: unknown, b: unknown): number {
  const na = semAcento(String(a ?? ""));
  const nb = semAcento(String(b ?? ""));
  if (na === nb) return 0;
  return na < nb ? -1 : 1;
}

function compararNumero(a: unknown, b: unknown): number {
  const na = Number(a);
  const nb = Number(b);
  const an = Number.isFinite(na);
  const bn = Number.isFinite(nb);
  if (an && bn) return na === nb ? 0 : na < nb ? -1 : 1;
  if (an) return -1; // presente vem antes de ausente (ver cabeçalho)
  if (bn) return 1;
  return 0;
}

function compararData(a: unknown, b: unknown): number {
  const na = typeof a === "string" ? Date.parse(a) : Number.NaN;
  const nb = typeof b === "string" ? Date.parse(b) : Number.NaN;
  const an = Number.isFinite(na);
  const bn = Number.isFinite(nb);
  if (an && bn) return na === nb ? 0 : na < nb ? -1 : 1;
  if (an) return -1;
  if (bn) return 1;
  return 0;
}

/**
 * Ordena uma lista por campo, devolvendo nova lista. Imutável: o array de
 * entrada não é tocado.
 */
export function ordenarPor<T extends object>(
  linhas: T[],
  chave: keyof T,
  direcao: Direcao = "asc",
  tipo: TipoCampo = "texto"
): T[] {
  const fator = direcao === "asc" ? 1 : -1;
  return [...linhas].sort((x, y) => {
    // A ausência de valor nunca "sobe" (ver cabeçalho): o comparador devolve
    // o sinal já direcionado, e quem não tem valor empata no fim. A direção
    // NÃO inverte o lugar dos ausentes — inverte só o dos presentes.
    const c = compararValores(x[chave], y[chave], tipo);
    if (c === 0) return 0;
    const semValor = (v: unknown) =>
      v === null ||
      v === undefined ||
      (tipo === "numero" && !Number.isFinite(Number(v))) ||
      (tipo === "data" && typeof v === "string" && !Number.isFinite(Date.parse(v)));
    if (semValor(x[chave])) return 1;
    if (semValor(y[chave])) return -1;
    return c * fator;
  });
}

/** Filtra pelo valor EXATO do campo — o filtro de seletor (enum, ano, tipo). */
export function filtrarPorIgual<T extends object>(
  linhas: T[],
  chave: keyof T,
  valor: unknown
): T[] {
  return linhas.filter((l) => l[chave] === valor);
}

/**
 * Filtra pelo termo DENTRO do texto do campo — o filtro de caixa de busca.
 * Sem acento e sem caixa, como o resto do portal.
 */
export function filtrarPorTexto<T extends object>(
  linhas: T[],
  chave: keyof T,
  termo: string
): T[] {
  const alvo = semAcento(termo.trim());
  if (!alvo) return linhas;
  return linhas.filter((l) => semAcento(String(l[chave] ?? "")).includes(alvo));
}