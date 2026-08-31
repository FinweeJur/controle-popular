/**
 * Verificador determinístico de citação — a segunda metade da regra
 * "referências corretas" do chatbot (a primeira é o prompt que OBRIGA os
 * marcadores `[n]`; esta é a conferência que não depende do modelo).
 *
 * ═══ O QUE ELE CHECA, E POR QUE ═══
 *
 * 1. **Marcadores `[n]`**: todo `[n]` na resposta tem que apontar para uma
 *    fonte do contexto (`1 <= n <= fontes.length`). Marcador fora do
 *    intervalo é citação para lugar nenhum — a falha estrutural que o
 *    pipeline trata com re-tentativa.
 *
 * 2. **Números ↔ trecho citado**: todo número "de verdade" na resposta
 *    (3+ dígitos, ou decimal) precisa aparecer no texto de pelo menos uma
 *    das fontes CITADAS (as que a resposta marcou com `[n]`). Número na
 *    resposta sem casa na fonte é o formato clássico de alucinação de RAG.
 *
 * ═══ O QUE ELE NÃO É ═══
 *
 * A lição do `rastrear()` do ETL do congresso (F4-benchmark.md §5): **falso
 * alarme numa métrica de alucinação é pior que não ter a métrica** — ensina
 * a ignorá-la. Por isso:
 *
 * - O cheque de número é SINAL, não portão: `numerosFora` vira
 *   `verificacao: "parcial"` na resposta (a UI mostra "confira os números"),
 *   nunca bloqueio duro. Redondo "5,5 bi" vs fonte "5,48 bi" é variação de
 *   linguagem, não mentira — e o portal prefere avisar a acusar.
 * - Números curtos (1–2 dígitos) não são checados: ordinal, marcador de
 *   lista, "3 contratos" em frase solta — ruído que dispararia à toa.
 * - Números que já estavam na PERGUNTA são ignorados (o usuário os trouxe).
 * - Normalização é por valor, não por grafia: "R$ 1,65 bi" casa com
 *   "R$ 1,65 bilhão" (vírgula decimal → ponto, separador de milhar
 *   removido), "1.214/1.214" casa com "1214". Mesma disciplina do
 *   `rastrear()`: comparar grafias cruas produz falso negativo.
 */

export interface FonteParaVerificacao {
  texto: string;
}

export interface VerificacaoCitacao {
  /** `false` só por falha ESTRUTURAL (marcador `[n]` fora do intervalo). */
  ok: boolean;
  /** Índices `[n]` que a resposta realmente citou, em ordem de aparição. */
  marcadoresUsados: number[];
  /** `[n]` que não apontam para fonte nenhuma (fora de 1..totalFontes). */
  marcadoresInvalidos: number[];
  /** Números da resposta ausentes de toda fonte citada (amostra, máx 5). */
  numerosFora: string[];
  totalFontes: number;
}

const RE_MARCADOR = /\[(\d{1,3})\]/g;
const RE_NUMERO = /(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,\d+)?/g;

/**
 * Normaliza um número para comparação por valor: remove separador de
 * milhar (ponto ou espaço antes de 3 dígitos) e troca vírgula decimal por
 * ponto. "1.214" → "1214"; "1 214" → "1214"; "5,48" → "5.48".
 */
export function normalizarNumero(trecho: string): string {
  return trecho.replace(/[.\s](?=\d{3}(?:[.,]|$))/g, "").replace(",", ".");
}

/** Números de um texto que valem checagem (3+ dígitos ou decimal), únicos. */
export function extrairNumerosChecaveis(texto: string): string[] {
  const vistos = new Set<string>();
  const numeros: string[] = [];
  for (const m of texto.matchAll(RE_NUMERO)) {
    const cru = m[0];
    const normalizado = normalizarNumero(cru);
    const temDecimal = cru.includes(",");
    if (normalizado.length < 3 && !temDecimal) continue;
    if (vistos.has(normalizado)) continue;
    vistos.add(normalizado);
    numeros.push(normalizado);
  }
  return numeros;
}

function numerosDoTexto(texto: string): Set<string> {
  return new Set(extrairNumerosChecaveis(texto));
}

/**
 * Verifica a resposta contra as fontes recuperadas pelo RAG.
 *
 * `pergunta` é opcional: números que o usuário digitou na pergunta não são
 * alegação do modelo e saem da checagem (senão "quanto Betim gastou em
 * 2025?" marcaria "2025" como suspeito toda vez).
 */
export function verificarCitacao(
  resposta: string,
  fontes: FonteParaVerificacao[],
  pergunta = ""
): VerificacaoCitacao {
  const totalFontes = fontes.length;

  const marcadoresUsados: number[] = [];
  const marcadoresInvalidos: number[] = [];
  for (const m of resposta.matchAll(RE_MARCADOR)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= totalFontes) {
      if (!marcadoresUsados.includes(n)) marcadoresUsados.push(n);
    } else {
      marcadoresInvalidos.push(n);
    }
  }

  // Texto das fontes citadas pelos marcadores; sem marcador nenhum, usa
  // todas as fontes (a resposta pode ter citado em prosa, e o número ainda
  // precisa ter casa em algum lugar do contexto).
  const citadas =
    marcadoresUsados.length > 0
      ? marcadoresUsados.map((n) => fontes[n - 1].texto)
      : fontes.map((f) => f.texto);
  // Comparação por VALOR normalizado, nunca por substring do texto bruto:
  // "1,65" na fonte tem de casar com "1.65" na resposta — é o mesmo número
  // escrito com separador diferente (a lição do rastrear() do congresso).
  const numerosDoCitado = numerosDoTexto(citadas.join("\n"));

  const numerosDaResposta = numerosDoTexto(resposta);
  const numerosDaPergunta = numerosDoTexto(pergunta);
  const fora: string[] = [];
  for (const numero of numerosDaResposta) {
    if (numerosDaPergunta.has(numero)) continue;
    if (!numerosDoCitado.has(numero)) fora.push(numero);
    if (fora.length >= 5) break;
  }

  return {
    ok: marcadoresInvalidos.length === 0,
    marcadoresUsados,
    marcadoresInvalidos,
    numerosFora: fora,
    totalFontes,
  };
}

/** Traduz a verificação para o rótulo do contrato da resposta. */
export function rotuloVerificacao(v: VerificacaoCitacao): "ok" | "parcial" | "falhou" {
  if (!v.ok) return "falhou";
  if (v.numerosFora.length > 0) return "parcial";
  return "ok";
}
