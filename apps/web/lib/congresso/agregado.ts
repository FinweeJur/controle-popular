import type { Rotulo } from "@/lib/congresso/rubrica";

/**
 * Perfil agregado de um conjunto de proposições — usado por comissão,
 * bancada e (depois) parlamentar.
 *
 * DUAS DECISÕES QUE NÃO SÃO COSMÉTICAS:
 *
 * 1. **Distribuição de rótulos, nunca média de score.** O benchmark da F4
 *    mostrou que modelos diferentes concordam no RÓTULO e divergem na
 *    INTENSIDADE — o mesmo PL deu −6,00 no llama 8B e −1,80 no Sonnet
 *    (`grau: estrutural` contra `moderado`). Como o banco vai conter
 *    análises feitas por modelos diferentes ao longo do tempo, somar ou
 *    tirar média de score misturaria réguas e produziria um número sem
 *    significado. Contar rótulos é robusto a isso.
 *
 * 2. **Cobertura sempre exposta.** Um agregado sobre 12 de 340 proposições
 *    não é o perfil do grupo, é o perfil de uma amostra enviesada pela
 *    ordem da fila de análise. Quem lê precisa ver o denominador junto,
 *    não escondido num rodapé.
 */

export interface PerfilAgregado {
  total: number;
  analisadas: number;
  contagem: Record<Rotulo, number>;
  garantistas: number;
  reducionistas: number;
  mistas: number;
  neutras: number;
  /** Fração de 0 a 1; use para decidir se vale mostrar leitura. */
  cobertura: number;
}

const VAZIO: Record<Rotulo, number> = {
  garantista_forte: 0,
  garantista: 0,
  neutro: 0,
  misto: 0,
  reducionista: 0,
  reducionista_forte: 0,
};

export function agregar(rotulos: (Rotulo | null | undefined)[]): PerfilAgregado {
  const contagem = { ...VAZIO };
  let analisadas = 0;

  for (const r of rotulos) {
    if (!r || !(r in contagem)) continue;
    contagem[r] += 1;
    analisadas += 1;
  }

  const total = rotulos.length;
  return {
    total,
    analisadas,
    contagem,
    garantistas: contagem.garantista_forte + contagem.garantista,
    reducionistas: contagem.reducionista_forte + contagem.reducionista,
    mistas: contagem.misto,
    neutras: contagem.neutro,
    cobertura: total > 0 ? analisadas / total : 0,
  };
}

/**
 * Frase de leitura do agregado — DERIVADA do dado, nunca escrita à mão.
 *
 * `sujeito` já vem COM a preposição ("na CCJC", "de autoria desta
 * bancada") e o template não põe nenhuma. A primeira versão alternava
 * entre "associada a X" e "proposições de X", o que obrigava o chamador a
 * escolher um sujeito que funcionasse nas duas regências — impossível em
 * português, onde a preposição contrai com o artigo. O resultado foi
 * "associada a a CCJC" já no primeiro teste.
 *
 * O `sujeito` também NÃO pode conter adjetivo: ele entra tanto depois de
 * "Nenhuma proposição" (singular) quanto de "20 proposições" (plural), e
 * "paradas na CCJC" produzia "Nenhuma proposição paradas na CCJC".
 * Use só a locução adverbial — "na CCJC", "de autoria desta bancada".
 *
 * Regra do repo, aprendida no app irmão: a primeira versão de um card lá
 * dizia "as indicações dominam o volume" porque a narrativa foi copiada de
 * outro portal, e era falsa para os dados locais. Aqui a frase só existe
 * se os números a sustentarem, e quando não sustentam ela diz isso.
 */
// Concordância de número: uma comissão com 1 proposição não pode ler "1
// proposições". Visto ao vivo na CCJC (só a PEC 9/2026 caíra lá). Helpers
// em vez de remendar cada frase, porque `1` pode surgir em qualquer ponto.
function nProp(n: number): string {
  return `${n} ${n === 1 ? "proposição" : "proposições"}`;
}
function nAnalisadas(n: number): string {
  return `${nProp(n)} ${n === 1 ? "analisada" : "analisadas"}`;
}

export function lerAgregado(p: PerfilAgregado, sujeito: string): string {
  if (p.total === 0) return `Nenhuma proposição ${sujeito} até agora.`;
  if (p.analisadas === 0)
    return `${nProp(p.total)} ${sujeito}, nenhuma analisada ainda.`;

  // Abaixo de um terço analisado, qualquer leitura de tendência descreve a
  // fila de análise, não o grupo.
  if (p.cobertura < 1 / 3) {
    const verbo = p.analisadas === 1 ? "foi analisada" : "foram analisadas";
    return (
      `Só ${p.analisadas} de ${nProp(p.total)} ${sujeito} ${verbo} ` +
      `(${Math.round(p.cobertura * 100)}%) — pouco para afirmar tendência.`
    );
  }

  const relevantes = p.garantistas + p.reducionistas;
  if (relevantes === 0)
    return `${nAnalisadas(p.analisadas)} ${sujeito}: nenhuma amplia nem restringe direitos de forma relevante.`;

  const pctG = Math.round((p.garantistas / p.analisadas) * 100);
  const pctR = Math.round((p.reducionistas / p.analisadas) * 100);

  // Diferença menor que 10 pontos não sustenta "predomina".
  if (Math.abs(pctG - pctR) < 10)
    return (
      `${nAnalisadas(p.analisadas)} ${sujeito}: ampliação e restrição de ` +
      `direitos aparecem em proporção semelhante (${pctG}% e ${pctR}%).`
    );

  const [maior, menor, rotuloMaior, rotuloMenor] =
    pctG > pctR ? [pctG, pctR, "ampliam", "restringem"] : [pctR, pctG, "restringem", "ampliam"];

  return (
    `${nAnalisadas(p.analisadas)} ${sujeito}: ${maior}% ${rotuloMaior} ` +
    `direitos e ${menor}% ${rotuloMenor}.`
  );
}
