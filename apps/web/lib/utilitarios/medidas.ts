/**
 * Conversor de unidades — lógica pura da ferramenta em `/tecnologia`.
 *
 * ═══ O QUE É ═══
 *
 * Converte comprimento, área, volume e massa. Existe porque a fiscalização
 * de território mistura unidades: a lei fala em hectares, o cadastro em
 * metros quadrados e a comunidade em alqueires.
 *
 * ═══ POR QUE O ALQUEIRE EXIGE CUIDADO ═══
 *
 * "Alqueire" NÃO tem um valor único no Brasil — muda por estado. Por isso a
 * tabela traz o mineiro (4,84 ha), o paulista (2,42 ha) e o goiano (9,68 ha)
 * separados, com o nome no rótulo. Somar ou comparar alqueires sem dizer de
 * qual estado é a mesma armadilha editorial que comparar dado de fonte
 * diferente sem dizer a fonte.
 *
 * ═══ COMO CONVERTE ═══
 *
 * Cada unidade guarda um fator até a unidade-base da categoria (metro,
 * metro quadrado, litro, grama). A conversão é `valor × fatorOrigem ÷
 * fatorDestino` — só vale dentro da mesma categoria.
 */

export type Categoria = "comprimento" | "area" | "volume" | "massa";

export interface Unidade {
  /** Identificador estável, usado nos seletores. */
  id: string;
  /** Rótulo em português mostrado na tela. */
  rotulo: string;
  /** Quantas unidades-base (m, m², L, g) vale 1 desta unidade. */
  fator: number;
  categoria: Categoria;
}

/** Nome legível de cada categoria. */
export const NOME_CATEGORIA: Record<Categoria, string> = {
  comprimento: "Comprimento",
  area: "Área",
  volume: "Volume",
  massa: "Massa",
};

/** Tabela de unidades, com os alqueires separados por estado. */
export const UNIDADES: Unidade[] = [
  { id: "mm", rotulo: "milímetro (mm)", fator: 0.001, categoria: "comprimento" },
  { id: "cm", rotulo: "centímetro (cm)", fator: 0.01, categoria: "comprimento" },
  { id: "m", rotulo: "metro (m)", fator: 1, categoria: "comprimento" },
  { id: "km", rotulo: "quilômetro (km)", fator: 1000, categoria: "comprimento" },

  { id: "m2", rotulo: "metro quadrado (m²)", fator: 1, categoria: "area" },
  { id: "ha", rotulo: "hectare (ha)", fator: 10000, categoria: "area" },
  { id: "km2", rotulo: "quilômetro quadrado (km²)", fator: 1_000_000, categoria: "area" },
  { id: "alq-mg", rotulo: "alqueire mineiro (4,84 ha)", fator: 48400, categoria: "area" },
  { id: "alq-sp", rotulo: "alqueire paulista (2,42 ha)", fator: 24200, categoria: "area" },
  { id: "alq-go", rotulo: "alqueire goiano (9,68 ha)", fator: 96800, categoria: "area" },

  { id: "ml", rotulo: "mililitro (mL)", fator: 0.001, categoria: "volume" },
  { id: "l", rotulo: "litro (L)", fator: 1, categoria: "volume" },
  { id: "m3", rotulo: "metro cúbico (m³)", fator: 1000, categoria: "volume" },

  { id: "g", rotulo: "grama (g)", fator: 1, categoria: "massa" },
  { id: "kg", rotulo: "quilograma (kg)", fator: 1000, categoria: "massa" },
  { id: "t", rotulo: "tonelada (t)", fator: 1_000_000, categoria: "massa" },
];

/** Lista as unidades de uma categoria, na ordem da tabela. */
export function unidadesPorCategoria(categoria: Categoria): Unidade[] {
  return UNIDADES.filter((u) => u.categoria === categoria);
}

/**
 * Converte `valor` da unidade `idDe` para `idPara`.
 * Devolve `null` se as unidades não existirem ou forem de categorias
 * diferentes (converter metro em litro não é conversão — é engano).
 */
export function converter(valor: number, idDe: string, idPara: string): number | null {
  if (!Number.isFinite(valor)) return null;
  const de = UNIDADES.find((u) => u.id === idDe);
  const para = UNIDADES.find((u) => u.id === idPara);
  if (!de || !para || de.categoria !== para.categoria) return null;
  return (valor * de.fator) / para.fator;
}
