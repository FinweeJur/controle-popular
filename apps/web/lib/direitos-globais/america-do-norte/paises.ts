/**
 * @file apps/web/lib/direitos-globais/america-do-norte/paises.ts
 * @description Estados soberanos da América do Norte (EUA e Canadá).
 *
 * NOTA EDITORIAL VINCULANTE:
 * O México NÃO é listado neste módulo, pois integra o módulo de América Latina
 * (`PAISES_AMERICA_LATINA` em `dados.ts`, código ISO "MX"), assegurando integridade
 * cadastral única no sistema sem duplicidade analítica.
 */

import type { Pais } from "../tipos";

export const PAISES_AMERICA_DO_NORTE: readonly Pais[] = [
  {
    id: "estados-unidos",
    nome: "Estados Unidos",
    codigo: "US",
    continente: "america-do-norte",
    subRegiao: "América Setentrional",
    capital: "Washington, D.C.",
    idiomasOficiais: ["Inglês"],
    moeda: "Dólar Americano",
    populacao: 334914895,
    area: 9833517,
    idh: 0.927,
    pibPerCapita: 76398,
    regimePolitico: "democracia",
    dataConstituicao: "1787-09-17",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"],
  },
  {
    id: "canada",
    nome: "Canadá",
    codigo: "CA",
    continente: "america-do-norte",
    subRegiao: "América Setentrional",
    capital: "Ottawa",
    idiomasOficiais: ["Inglês", "Francês"],
    moeda: "Dólar Canadense",
    populacao: 40097761,
    area: 9984670,
    idh: 0.935,
    pibPerCapita: 52722,
    regimePolitico: "monarquia_constitucional",
    dataConstituicao: "1982-04-17",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"],
  },
];

/**
 * Busca país da América do Norte por código ISO 3166-1 alpha-2.
 */
export function paisAmericaDoNortePorCodigo(codigo: string): Pais | undefined {
  const normalizado = codigo.trim().toUpperCase();
  return PAISES_AMERICA_DO_NORTE.find((p) => p.codigo === normalizado);
}
