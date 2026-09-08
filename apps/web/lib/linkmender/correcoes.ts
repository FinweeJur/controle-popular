/**
 * LinkMender v2 — Camada de correções de links.
 *
 * A correção NUNCA reescreve o dado versionado: `apps/web/data/
 * link-correcoes.json` é uma CAMADA lida no prebuild e aplicada na hora de
 * gerar a página. O acervo original fica intacto — a trilha (urlVelha →
 * urlNova → critérios → data) é revisável e reversível.
 *
 * Formato do JSON (array):
 *   [{ "urlVelha": "...", "urlNova": "...", "criterios": ["..."], "data": "ISO-8601" }]
 *
 * Funções puras: `validarCorrecoes` (lança com mensagem clara se o arquivo
 * estiver malformado — o prebuild ABORTA o build nesses casos), `dedupe` e os
 * aplicadores. Aplicadores servem no build/página e são inofensivos se a
 * camada estiver vazia.
 */

import dadosCorrecoes from "../../data/link-correcoes.json";

export interface CorrecaoLink {
  urlVelha: string;
  urlNova: string;
  criterios: string[];
  data: string;
}

/**
 * Valida o conteúdo de link-correcoes.json. `bruto` é o que o JSON.parse
 * devolveu. Lança `Error` com TODOS os problemas encontrados de uma vez.
 */
export function validarCorrecoes(bruto: unknown): CorrecaoLink[] {
  const problemas: string[] = [];
  if (!Array.isArray(bruto)) {
    throw new Error(
      `link-correcoes.json malformado: esperado array na raiz, veio ${typeof bruto}`
    );
  }
  const saida: CorrecaoLink[] = [];
  bruto.forEach((item, i) => {
    const onde = `item ${i}`;
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      problemas.push(`${onde}: nao e objeto`);
      return;
    }
    const o = item as Record<string, unknown>;
    if (typeof o.urlVelha !== "string" || !o.urlVelha.startsWith("http")) {
      problemas.push(`${onde}: urlVelha ausente ou nao http(s)`);
    }
    if (typeof o.urlNova !== "string" || !o.urlNova.startsWith("http")) {
      problemas.push(`${onde}: urlNova ausente ou nao http(s)`);
    }
    if (
      !Array.isArray(o.criterios) ||
      o.criterios.length === 0 ||
      !o.criterios.every((c) => typeof c === "string")
    ) {
      problemas.push(`${onde}: criterios deve ser array de strings nao vazio`);
    }
    if (typeof o.data !== "string" || Number.isNaN(Date.parse(o.data))) {
      problemas.push(`${onde}: data ausente ou nao ISO`);
    }
    if (problemas.some((p) => p.startsWith(onde))) return;
    saida.push({
      urlVelha: o.urlVelha as string,
      urlNova: o.urlNova as string,
      criterios: o.criterios as string[],
      data: o.data as string,
    });
  });
  if (problemas.length > 0) {
    throw new Error(`link-correcoes.json malformado: ${problemas.join("; ")}`);
  }
  return saida;
}

/** Remove correções repetidas para a mesma urlVelha (fica a última). */
export function dedupeCorrecoes(correcoes: CorrecaoLink[]): CorrecaoLink[] {
  const mapa = new Map<string, CorrecaoLink>();
  for (const c of correcoes) mapa.set(c.urlVelha, c);
  return Array.from(mapa.values()).sort((a, b) => a.urlVelha.localeCompare(b.urlVelha));
}

/** Junta correções novas ao acervo existente (novas vencem por urlVelha). */
export function juntarCorrecoes(
  existentes: CorrecaoLink[],
  novas: CorrecaoLink[]
): CorrecaoLink[] {
  return dedupeCorrecoes([...novas, ...existentes]);
}

/** Aplica as correções a um texto (troca urlVelha por urlNova). */
export function aplicarCorrecoesEmTexto(
  texto: string,
  correcoes: CorrecaoLink[]
): string {
  let saida = texto;
  for (const c of correcoes) {
    if (saida.includes(c.urlVelha)) {
      saida = saida.split(c.urlVelha).join(c.urlNova);
    }
  }
  return saida;
}

/**
 * Aplica as correções a um dado arbitrário (percorre strings de objetos e
 * arrays). Uso na geração de páginas: o dado versionado passa pela camada na
 * hora de renderizar; o arquivo original nunca é reescrito.
 */
export function aplicarCorrecoesEmDado<T>(dado: T, correcoes: CorrecaoLink[]): T {
  if (correcoes.length === 0) return dado;
  if (typeof dado === "string") {
    return aplicarCorrecoesEmTexto(dado, correcoes) as unknown as T;
  }
  if (Array.isArray(dado)) {
    return dado.map((v) => aplicarCorrecoesEmDado(v, correcoes)) as unknown as T;
  }
  if (dado !== null && typeof dado === "object") {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(dado as Record<string, unknown>)) {
      saida[k] = aplicarCorrecoesEmDado(v, correcoes);
    }
    return saida as unknown as T;
  }
  return dado;
}

/**
 * Correção pontual de uma URL, usando a camada commitada
 * (apps/web/data/link-correcoes.json). Para usar em componente/página de
 * servidor: `urlCorrigida(fonte.url)`.
 */
export function urlCorrigida(url: string): string {
  const lista = validarCorrecoes(dadosCorrecoes);
  for (const c of lista) {
    if (url === c.urlVelha) return c.urlNova;
  }
  return url;
}

/** A camada inteira, validada. Lança se o JSON commitado estiver malformado. */
export function carregarCorrecoes(): CorrecaoLink[] {
  return validarCorrecoes(dadosCorrecoes);
}
