/**
 * @file Monta a tabela do post para o componente interativo.
 *
 * O QUE É: converte `colunas: string[]` + `linhas: string[][]` (formato do
 * JSON do blog) no contrato da tabela ordenável do portal
 * (`lib/tabela/ordenavel.ts`): descritores planos + linhas como objeto.
 *
 * POR QUE AQUI, E NÃO NO COMPONENTE:
 * - A detecção de coluna numérica e de faceta é regra, não JSX; assim roda
 *   em teste sem montar React.
 * - A busca é tolerante a acento e caixa (a mesma régua do portal), então
 *   "direito" acha "Direito" e "Ciências Sociais / Direito".
 * - Só vira `<select>` a coluna de texto com 2 a 8 valores únicos. Cidade
 *   (2) vira filtro; área (39) não, para não criar um seletor inútil.
 */
import { normalizar, type ColunaOrdenavel } from "@/lib/tabela/ordenavel";

export interface TabelaMontada {
  colunas: ColunaOrdenavel[];
  linhas: Record<string, unknown>[];
  /** Campos de texto usados pela busca livre (numérico fica fora). */
  camposBusca: string[];
  /** Campo numérico chamado "vagas", quando existir; alimenta o contador. */
  campoVagas: string | null;
}

/** Inteiro puro ou com separador de milhar pt-BR ("1.234"). */
const INTEIRO = /^\d+$/;
const MILHAR = /^\d{1,3}(?:\.\d{3})+$/;

function numeroDe(valor: string): number | null {
  const t = valor.trim();
  if (INTEIRO.test(t)) return Number(t);
  if (MILHAR.test(t)) return Number(t.replace(/\./g, ""));
  return null;
}

/** Verdadeira quando toda célula preenchida da coluna é número inteiro. */
function ehColunaNumerica(linhas: string[][], indice: number): boolean {
  let preenchidas = 0;
  for (const linha of linhas) {
    const valor = (linha[indice] ?? "").trim();
    if (!valor) continue;
    preenchidas += 1;
    if (numeroDe(valor) === null) return false;
  }
  return preenchidas > 0;
}

export function montarTabela(colunas: string[], linhas: string[][]): TabelaMontada {
  const indices = colunas.map((_, i) => i);
  const numericas = indices.map((i) => ehColunaNumerica(linhas, i));

  const descritores: ColunaOrdenavel[] = colunas.map((rotulo, i) => {
    const numerica = numericas[i];
    const unicos = new Set(
      linhas.map((linha) => (linha[i] ?? "").trim()).filter(Boolean)
    );
    return {
      campo: `c${i}`,
      rotulo,
      numerica,
      formato: numerica ? "numero" : "texto",
      filtro: !numerica && unicos.size >= 2 && unicos.size <= 8,
    };
  });

  const objetos = linhas.map((linha, n) => {
    const obj: Record<string, unknown> = { __id: `l${n}` };
    for (const i of indices) {
      const bruto = linha[i] ?? "";
      obj[`c${i}`] = numericas[i] ? (numeroDe(bruto) ?? 0) : bruto;
    }
    return obj;
  });

  const camposBusca = descritores.filter((c) => !c.numerica).map((c) => c.campo);
  const campoVagas =
    descritores.find((c) => c.numerica && normalizar(c.rotulo) === "vagas")?.campo ?? null;

  return { colunas: descritores, linhas: objetos, camposBusca, campoVagas };
}
