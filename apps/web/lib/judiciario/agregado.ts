import type { Ocupacao, Nomeacao } from "@/lib/judiciario/tribunais";

// Poder de indicação — o núcleo do produto (F5).
//
// Regras herdadas de lib/agregado.ts do /congresso, onde foram pagas com
// bug em produção:
//   1. DISTRIBUIÇÃO, nunca média. Aqui é contagem pura, então o risco de
//      "média que mistura réguas" não existe — mas a regra de EXIBIR o
//      numerador e o denominador, nunca só o percentual, vale igual.
//   2. COBERTURA sempre exposta. A composição de um tribunal quase nunca
//      tem 100% dos ocupantes com nomeante conhecido (indicação antiga sem
//      dado, cadeira eletiva). Abaixo de 1/3 de cobertura, a frase se
//      RECUSA a afirmar tendência.
//   3. Nota metodológica fixa: o agregado descreve composição, não avalia
//      magistrado.

export interface PoderIndicacao {
  autoridade: string;
  cadeiras: number;
}

export interface AgregadoTribunal {
  tribunalId: string;
  totalCadeiras: number;
  comOcupante: number;
  comNomeanteConhecido: number;
  cobertura: number; // comNomeanteConhecido / totalCadeiras
  poder: PoderIndicacao[]; // ordenado por cadeiras desc
  frase: string;
}

/**
 * Calcula o poder de indicação de um tribunal a partir das ocupações
 * atuais e das nomeações. Casa ocupação↔nomeante por `magistrado_id`
 * quando a nomeação registra a cadeira/magistrado; na ausência disso
 * (histórico), a cadeira conta como "nomeante desconhecido" — e isso
 * REBAIXA a cobertura, que é exatamente o sinal honesto a dar.
 */
export function agregarPoder(
  tribunalId: string,
  totalCadeiras: number,
  ocupacoes: Ocupacao[],
  nomeacoes: Nomeacao[]
): AgregadoTribunal {
  const nomeantePorMagistrado = new Map<string, string>();
  for (const n of nomeacoes) {
    // `raw` carrega magistrado_id quando a F3 já ligou; aqui usamos o que
    // houver. Sem ligação, a nomeação não credita ninguém — de propósito.
    const mid = (n as unknown as { magistrado_id?: string }).magistrado_id;
    if (mid && n.autoridade_nomeante) nomeantePorMagistrado.set(mid, n.autoridade_nomeante);
  }

  const contagem = new Map<string, number>();
  let comNomeante = 0;
  for (const o of ocupacoes) {
    const aut = nomeantePorMagistrado.get(o.magistrado_id);
    if (aut) {
      contagem.set(aut, (contagem.get(aut) ?? 0) + 1);
      comNomeante += 1;
    }
  }

  const poder = [...contagem.entries()]
    .map(([autoridade, cadeiras]) => ({ autoridade, cadeiras }))
    .sort((a, b) => b.cadeiras - a.cadeiras);

  const cobertura = totalCadeiras ? comNomeante / totalCadeiras : 0;

  let frase: string;
  if (cobertura < 1 / 3) {
    frase =
      `Cobertura insuficiente (${comNomeante} de ${totalCadeiras} cadeiras com nomeante ` +
      `conhecido) para afirmar concentração de poder de indicação neste tribunal.`;
  } else if (poder.length) {
    const lider = poder[0];
    frase =
      `${lider.autoridade} nomeou ${lider.cadeiras} de ${totalCadeiras} cadeiras ` +
      `(${Math.round((100 * lider.cadeiras) / totalCadeiras)}%) com ocupante atual — ` +
      `cobertura de ${comNomeante}/${totalCadeiras}.`;
  } else {
    frase = `Nenhuma cadeira com nomeante conhecido ainda.`;
  }

  return {
    tribunalId,
    totalCadeiras,
    comOcupante: ocupacoes.length,
    comNomeanteConhecido: comNomeante,
    cobertura,
    poder,
    frase,
  };
}
