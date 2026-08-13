/**
 * Tipos do facilitador de denúncia de violação de direitos humanos —
 * `/direitos-em-movimento/denuncia`. Plano completo em
 * `docs/PLANO-ACAO-CIDADA.md`.
 *
 * Vivem num arquivo à parte, sem `"use client"` nem import de `docx`, porque
 * são o contrato entre TRÊS peças que precisam concordar sem se importar
 * direto: o componente de entrevista (`Facilitador.tsx`), a montagem do
 * documento (`compor.ts`) e o rascunho local (`rascunho.ts`). Nenhuma dessas
 * peças guarda o texto da denúncia em lugar nenhum além da memória do
 * navegador — ver a docstring de `rascunho.ts` para onde ele PODE ir, com
 * consentimento.
 */

/** Pergunta 2 — muda a orientação inteira (ver `docs/PLANO-ACAO-CIDADA.md`). */
export type Continuacao = "sim" | "nao" | "nao_sei";

/**
 * Pergunta 4a — "quem violou". Checkbox, não campo livre: a resposta
 * alimenta o roteamento (`roteiro.ts`), e texto livre não dá para rotear
 * sem um modelo de linguagem interpretando — o que o projeto decidiu não
 * fazer aqui (mesma doutrina de "dado inventado não é publicado").
 */
export type Violador = "pessoa" | "empresa" | "agente_estado";

/**
 * Pergunta 4b — categorias que mudam o destino sugerido. Cada valor aqui
 * corresponde a uma linha da tabela de roteamento do plano E a uma
 * `Necessidade` já cadastrada em `lib/betim/redeProtecao.ts` — ver
 * `roteiro.ts` para o mapeamento. Não é uma pergunta nova em relação ao
 * plano: é o detalhamento de "quais são as forças/pessoas/entidades em
 * conflito" que a tabela de roteamento já pressupõe.
 */
export type Situacao =
  | "crianca_adolescente"
  | "violencia_mulher"
  | "discriminacao"
  | "pessoa_deficiencia_idoso"
  | "quilombola_indigena_tradicional_ambiental";

/** Pergunta 6 — que tipo de prova a pessoa já tem, hoje. */
export type TipoProva = "foto_video" | "print" | "testemunha" | "documento" | "audio" | "nenhuma";

/**
 * Todas as respostas do roteiro — o ÚNICO lugar onde o texto da denúncia
 * existe em memória. Nunca serializado para uma requisição de rede; só para
 * `JSON.stringify` local, em `rascunho.ts`, e só se a pessoa marcar o opt-in.
 */
export interface RespostasDenuncia {
  /** Pergunta 1. Aceita resposta aproximada de propósito — "faz uns 2 anos". */
  quando: string;
  continua: Continuacao | null;
  /** Pergunta 3. Slug de `Cidade`, ou "" se a cidade não está nas 6 cadastradas. */
  cidadeSlug: string;
  /** Só usado no texto do documento quando `cidadeSlug` está vazio. */
  outraCidadeNome: string;
  violadores: Violador[];
  situacoes: Situacao[];
  /** Pergunta 5, campo livre — nunca alimenta o roteamento (ver `roteiro.ts`). */
  relato: string;
  provas: TipoProva[];
  /** Detalhe livre opcional sobre a prova reunida. */
  detalheProvas: string;
  /** Opcional — quem assina o documento. Fica vazio, o documento continua válido. */
  nomeDenunciante: string;
}

export function respostasVazias(): RespostasDenuncia {
  return {
    quando: "",
    continua: null,
    cidadeSlug: "",
    outraCidadeNome: "",
    violadores: [],
    situacoes: [],
    relato: "",
    provas: [],
    detalheProvas: "",
    nomeDenunciante: "",
  };
}
