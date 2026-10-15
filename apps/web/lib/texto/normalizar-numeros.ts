/**
 * ═══ NORMALIZADOR DE GRANDEZAS NUMÉRICAS ═══
 *
 * Converte representações numéricas decimais inferiores a 1 (ex.: "0,4 bilhões")
 * para unidades inteiras de maior representatividade cívica e clareza (ex.: "400 milhões").
 *
 * Regras:
 * - "0,4 bilhões" -> "400 milhões"
 * - "0,05 bilhão" -> "50 milhões"
 * - "0,2 milhões" -> "200 mil"
 * - "0,5 mil"     -> "500"
 * - Preserva prefixo monetário "R$" quando presente ("R$ 0,4 bilhão" -> "R$ 400 milhões")
 * - Respeita concordância singular/plural (1 milhão vs 2 milhões)
 */

// A escala agora vem da tabela única de unidades do portal: converter() faz
// a mesma multiplicação de antes (fator exato 1e3) e evita fator digitado
// à mão em cada ramo.
import { converter } from '@/lib/transformacao/unidades';

export interface ResultadoNormalizacao {
  original: string;
  normalizado: string;
  mudou: boolean;
}

/**
 * Formata um número em formato brasileiro sem zeros decimais desnecessários.
 */
function formatarNumeroLimpo(num: number): string {
  const valor = Math.round(num * 100) / 100;
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/**
 * Normaliza todas as ocorrências de grandezas decimais fracionárias (< 1) em um texto.
 */
export function normalizarNumerosTexto(texto: string | null | undefined): string {
  if (!texto) return "";

  let resultado = texto;

  // 1. Bilhões fracionários (< 1) -> Milhões
  // Ex: "0,4 bilhões", "0,4 bilhão", "0.4 bilhões", "R$ 0,4 bilhão", "R$ 0,05 bilhão"
  const regexBilhoes = /(R\$\s*)?0[,\.](\d+)\s*(bilh(?:ão|ao|oes|ões))\b/gi;
  resultado = resultado.replace(regexBilhoes, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emMilhoes = converter({ valor, de: 'bilhao', para: 'milhao', dominio: 'escala' });
    const strValor = formatarNumeroLimpo(emMilhoes);
    const unidade = emMilhoes === 1 ? "milhão" : "milhões";
    const prefixo = prefixoMoeda ? prefixoMoeda : "";
    return `${prefixo}${strValor} ${unidade}`;
  });

  // 2. Milhões fracionários (< 1) -> Mil
  // Ex: "0,2 milhões", "0,2 milhão", "R$ 0,2 milhão", "0,75 milhão"
  const regexMilhoes = /(R\$\s*)?0[,\.](\d+)\s*(milh(?:ão|ao|oes|ões))\b/gi;
  resultado = resultado.replace(regexMilhoes, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emMil = converter({ valor, de: 'milhao', para: 'mil', dominio: 'escala' });
    const strValor = formatarNumeroLimpo(emMil);
    const prefixo = prefixoMoeda ? prefixoMoeda : "";
    return `${prefixo}${strValor} mil`;
  });

  // 3. Milhares fracionários (< 1) -> Unidade inteira pura
  // Ex: "0,5 mil", "0,8 mil", "R$ 0,5 mil"
  const regexMil = /(R\$\s*)?0[,\.](\d+)\s*mil\b/gi;
  resultado = resultado.replace(regexMil, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emUnidades = converter({ valor, de: 'mil', para: 'unidade', dominio: 'escala' });
    const strValor = formatarNumeroLimpo(emUnidades);
    const prefixo = prefixoMoeda ? prefixoMoeda : "";
    return `${prefixo}${strValor}`;
  });

  return resultado;
}

/**
 * Normaliza um valor numérico dado com sua unidade atual.
 */
export function normalizarGrandezaValor(
  valor: number,
  unidade: "bilhao" | "milhao" | "mil"
): { valor: number; unidade: string; formatado: string } {
  if (valor >= 1 || valor <= 0) {
    let rotuloUnidade = "";
    if (unidade === "bilhao") rotuloUnidade = valor === 1 ? "bilhão" : "bilhões";
    else if (unidade === "milhao") rotuloUnidade = valor === 1 ? "milhão" : "milhões";
    else rotuloUnidade = "mil";

    return {
      valor,
      unidade: rotuloUnidade,
      formatado: `${formatarNumeroLimpo(valor)} ${rotuloUnidade}`.trim(),
    };
  }

  // Se valor < 1:
  if (unidade === "bilhao") {
    const novoValor = converter({ valor, de: 'bilhao', para: 'milhao', dominio: 'escala' });
    const novaUnidade = novoValor === 1 ? "milhão" : "milhões";
    return {
      valor: novoValor,
      unidade: novaUnidade,
      formatado: `${formatarNumeroLimpo(novoValor)} ${novaUnidade}`,
    };
  }

  if (unidade === "milhao") {
    const novoValor = converter({ valor, de: 'milhao', para: 'mil', dominio: 'escala' });
    return {
      valor: novoValor,
      unidade: "mil",
      formatado: `${formatarNumeroLimpo(novoValor)} mil`,
    };
  }

  // unidade === "mil"
  const novoValor = converter({ valor, de: 'mil', para: 'unidade', dominio: 'escala' });
  return {
    valor: novoValor,
    unidade: "",
    formatado: formatarNumeroLimpo(novoValor),
  };
}
