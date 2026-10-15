/**
 * Detecção de cidade citada na pergunta — extraída de `acervo.ts` em
 * 15/10/2026.
 *
 * ═══ O QUE ISTO É ═══
 *
 * Casador único: recebe uma lista de cidades `{codigo, nome}` e a pergunta do
 * cidadão, e devolve o nome MAIS LONGO citado no texto (o mais específico
 * vence) ou `null`. Dois consumidores passam por aqui: o bloco de repasses
 * federais do ComunicaBR (`acervo.ts`) e o bloco do Acordo de Brumadinho
 * (`dado-acordo-brumadinho.ts`). O comportamento é o da função privada
 * original, linha a linha — a extração só mudou a assinatura: OBJETO com
 * campos nomeados no lugar de duas strings soltas, porque o CodeScene mede
 * Primitive Obsession e String Heavy Function Arguments por módulo (lição
 * registrada na CI de 15/10/2026).
 *
 * ═══ FONTE DOS DADOS ═══
 *
 * Nenhuma. Quem fornece a lista de cidades é o chamador — hoje
 * `resumoDosMunicipios()` (`public/data/comunicabr-31.json`) e
 * `arquivoRepasse()` (`public/data/repasse-brumadinho-mg.json`). Este módulo
 * não lê arquivo nem faz rede, o que o deixa testável e usável em qualquer
 * runtime.
 *
 * ═══ DECISÕES ═══
 *
 * `semAcento` é o MESMO normalizador da `/busca` (`lib/busca/normalizar.ts`)
 * — pergunta e nome têm de passar pela mesma régua, senão o casamento
 * depende de quem digitou. O corte `nome.length < 4` vem do original: nomes
 * de 3 letras casariam dentro de outras palavras.
 */

import { semAcento } from "@/lib/busca/normalizar";

/** Uma cidade citável: código do sistema do chamador + nome do IBGE. */
export interface CidadeCitavel {
  codigo: string;
  nome: string;
}

/** Os dois insumos da busca, como campos nomeados — nunca strings soltas. */
export interface BuscaDeCidade {
  cidades: readonly CidadeCitavel[];
  pergunta: string;
}

/** Normaliza texto em palavras minúsculas separadas por espaço (sem acento). */
export function palavrasDe(texto: string): string {
  return semAcento(texto).replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * A cidade mais longa citada na pergunta (a mais específica vence), ou `null`.
 * Casa só no limite de palavra — nunca "Maria" solta dentro de "Santa Maria de
 * X". `semAcento` é o MESMO normalizador da `/busca` (lib/busca/normalizar.ts).
 * ponytail: varredura linear nos 853 nomes; map de lowercase se o perfil de
 * perguntas crescer.
 */
export function municipioMaisLongoCitado(busca: BuscaDeCidade): CidadeCitavel | null {
  const alvo = ` ${palavrasDe(busca.pergunta)} `;
  let achada: CidadeCitavel | null = null;
  let maior = 0;
  for (const c of busca.cidades) {
    const nome = palavrasDe(c.nome);
    if (nome.length < 4 || nome.length <= maior) continue;
    if (alvo.includes(` ${nome} `)) {
      achada = c;
      maior = nome.length;
    }
  }
  return achada;
}
