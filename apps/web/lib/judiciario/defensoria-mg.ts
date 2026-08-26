/**
 * Cobertura da Defensoria Pública de Minas Gerais, comarca a comarca.
 * ARQUIVO GERADO por `scripts/gerar-transparencia-justica.mts`.
 *
 * ═══ O DENOMINADOR É O PRODUTO ═══
 *
 * A DPMG publica onde ELA está. Nunca publica onde ela **não** está. "128
 * unidades" parece cobertura boa; contra as 298 comarcas do estado, vira
 * déficit. Esta camada existe para juntar as duas pontas.
 *
 * ⚠️ **AS FONTES DIVERGEM, E AS DUAS FICAM.** A DPMG lista 129 unidades hoje
 * (128 comarcas mineiras + a sede em Brasília); a Pesquisa Nacional da
 * Defensoria 2025 marca 120 comarcas como atendidas. São recortes
 * diferentes — unidade física instalada contra comarca declarada atendida —,
 * e escolher um e calar esconderia a diferença.
 *
 * ⚠️ Duas armadilhas medidas na coleta: a planilha nacional só baixa com
 * headers de navegador (curl cru = HTTP 406), e o CSV do IPEA 2013 é **CP850**,
 * não ISO-8859-1 — decodificar errado produz texto ilegível em silêncio.
 */

export interface ComarcaDefensoria {
  nome: string;
  populacao: number | null;
  populacaoAte3SM: number | null;
  municipios: number | null;
  /** SIM | NÃO | PARCIALMENTE — Pesquisa Nacional da Defensoria 2025 */
  atendida2025: string | null;
  /** A DPMG lista unidade física nesta comarca hoje? */
  temUnidadeHoje: boolean;
  link: string | null;
  atendida2013: string | null;
  defensores2013: number | null;
}

export const COBERTURA_DEFENSORIA = {
  extraidoEm: "2026-08-22",
  comarcas: 298,
  atendidas2025: 120,
  naoAtendidas2025: 176,
  parcialmente2025: 2,
  comUnidadeFisicaHoje: 128,
  comarcas2013: 295,
  atendidas2013: 105,
  populacaoEmComarcaNaoAtendida: 6090773,
} as const;

