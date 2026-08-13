import type { Necessidade } from "@/lib/betim/redeProtecao";
import type { Continuacao, RespostasDenuncia, Situacao, Violador } from "@/lib/denuncia/tipos";

/**
 * Roteamento de destino — determinístico, a partir das respostas 2–4,
 * NUNCA do texto livre da pergunta 5. Mesma doutrina de "dado inventado não
 * é publicado": um modelo de linguagem interpretando o relato e inventando
 * um destino é exatamente o que este módulo evita.
 *
 * NÃO é um roteador novo: cada regra abaixo só decide QUAIS `Necessidade`
 * de `lib/betim/redeProtecao.ts` se aplicam. Quem decide os órgãos de cada
 * necessidade continua sendo `montarItensPainel`/`itensSemCidade`, os
 * mesmos usados por `/direitos-em-movimento/ajuda`. Isto também é o motivo
 * de a Fase 1 não ter um item "MPMG/CAOMA" citado no plano: esse item
 * específico não existe em `redeProtecao.ts` hoje (só CAODH, CAODCA, CAOVD,
 * CAOIPCD estão catalogados) — inventar a entrada aqui quebraria a regra
 * "número/órgão não confirmado não é publicado" do projeto.
 */

interface RegraRoteamento {
  id: string;
  aplica: (r: Pick<RespostasDenuncia, "violadores" | "situacoes">) => boolean;
  necessidades: Necessidade[];
  motivo: string;
  /** Aviso extra, mostrado junto da sugestão — não é `Necessidade`, é texto fixo. */
  avisoExtra?: string;
}

const REGRAS: RegraRoteamento[] = [
  {
    id: "crianca_adolescente",
    aplica: (r) => r.situacoes.includes("crianca_adolescente"),
    necessidades: ["protecao_crianca"],
    motivo: "Envolve criança ou adolescente — o Conselho Tutelar tem plantão para casos urgentes, inclusive fora do horário comercial.",
  },
  {
    id: "violencia_mulher",
    aplica: (r) => r.situacoes.includes("violencia_mulher"),
    necessidades: ["violencia_mulher", "defesa_gratuita"],
    motivo: "É violência contra a mulher — a única DEAM 24h de MG fica em Belo Horizonte; nas demais cidades, delegacia comum + Defensoria.",
  },
  {
    id: "agente_estado",
    aplica: (r) => r.violadores.includes("agente_estado"),
    necessidades: ["direitos_humanos", "defesa_gratuita"],
    motivo: "Um dos envolvidos é agente do Estado (policial, fiscal, funcionário público) — o cenário de maior risco.",
    avisoExtra:
      "Isto não é caso para resolver sozinho com a própria corporação do agente. Procure o MPMG (controle da atividade policial) e a Defensoria.",
  },
  {
    id: "discriminacao",
    aplica: (r) => r.situacoes.includes("discriminacao"),
    necessidades: ["discriminacao"],
    motivo: "Envolve racismo, xenofobia ou LGBTfobia — existe delegacia especializada só para isso (DECRIN, em Belo Horizonte).",
  },
  {
    id: "pessoa_deficiencia_idoso",
    aplica: (r) => r.situacoes.includes("pessoa_deficiencia_idoso"),
    necessidades: ["pessoa_deficiencia_idoso"],
    motivo: "A vítima é pessoa com deficiência ou pessoa idosa — existe delegacia especializada (DEADI, em Belo Horizonte).",
  },
  {
    id: "ambiental_tradicional",
    aplica: (r) => r.situacoes.includes("quilombola_indigena_tradicional_ambiental"),
    necessidades: ["meio_ambiente_terras", "defesa_gratuita"],
    motivo: "Envolve comunidade quilombola, indígena, tradicional, ou é dano ambiental — é onde o portal tem profundidade jurídica própria.",
    avisoExtra:
      "Veja também /ambiental, com instrumentos normativos e precedentes por tema — mas o acervo ainda tem lacunas (ex.: proteção de serras, flora e fauna não têm instrumento catalogado hoje).",
  },
];

/** Quando nenhuma regra específica se aplica — nunca fingir precisão que a pergunta 4 não sustenta. */
const REGRA_PADRAO: RegraRoteamento = {
  id: "padrao",
  aplica: () => true,
  necessidades: ["defesa_gratuita", "denunciar", "direitos_humanos"],
  motivo:
    "Nenhuma categoria específica se aplicou, ou a resposta foi \"não sei\" — melhor sugerir mais de um canal e dizer por quê do que fingir uma precisão que a resposta não sustenta. Mandar para o lugar errado gasta o único fôlego que a pessoa tinha.",
};

export interface SugestaoRoteamento {
  necessidades: Necessidade[];
  regras: RegraRoteamento[];
}

/** Regras que casaram com as respostas — nunca vazio: cai na `REGRA_PADRAO`. */
export function regrasAplicaveis(
  r: Pick<RespostasDenuncia, "violadores" | "situacoes">
): RegraRoteamento[] {
  const casadas = REGRAS.filter((regra) => regra.aplica(r));
  return casadas.length > 0 ? casadas : [REGRA_PADRAO];
}

/** União das `Necessidade` sugeridas, sem repetição — o que filtra os itens de `redeProtecao.ts`. */
export function necessidadesSugeridas(
  r: Pick<RespostasDenuncia, "violadores" | "situacoes">
): Necessidade[] {
  const set = new Set<Necessidade>();
  for (const regra of regrasAplicaveis(r)) {
    for (const n of regra.necessidades) set.add(n);
  }
  return [...set];
}

// ═══════════════════════════ Textos fixos ═══════════════════════════

/**
 * Pesquisado em 13/08/2026 (Regulamento da CIDH — fonte em
 * `docs/PLANO-ACAO-CIDADA.md`). Aparece só na tela de resultado, nunca como
 * primeiro destino — a regra do plano é literal: "o facilitador não
 * oferece a CIDH como primeiro destino em nenhum cenário".
 */
export const TEXTO_CIDH =
  "A Comissão Interamericana de Direitos Humanos (CIDH) normalmente não é o primeiro passo: " +
  "ela exige, salvo três exceções (falta de devido processo interno, impedimento de acesso aos " +
  "recursos internos, ou atraso injustificado na decisão), que você já tenha buscado a Justiça " +
  "brasileira antes — e tem prazo de 6 meses após a decisão interna final. Isto não é " +
  "aconselhamento jurídico: leve esta dúvida à Defensoria ou a um advogado antes de enviar " +
  "qualquer coisa à CIDH.";

/**
 * O que o servidor sabe MESMO quando a pessoa nunca envia a denúncia — a
 * visita em si (`CF-Connecting-IP`, data/hora, caminho) continua nos logs
 * de observability do Worker, como em qualquer página do portal. Precisa
 * estar dito antes da primeira pergunta, não como letra miúda depois.
 */
export const TEXTO_VISITA_REGISTRADA =
  "O texto que você escreve fica só no seu aparelho — nunca é enviado. O fato de você ter " +
  "visitado esta página, com data e hora, fica registrado como qualquer visita a este site.";

export const TEXTO_NAO_E_ACONSELHAMENTO =
  "Este facilitador não protocola nada, não acompanha o seu caso e não é advogado. Ele ajuda a " +
  "organizar o que aconteceu e sugere para onde levar — a decisão e o acompanhamento continuam " +
  "sendo seus, com quem você procurar a seguir.";

export function textoUrgencia(continua: Continuacao | null): string | null {
  if (continua !== "sim") return null;
  return (
    "A violação continua acontecendo. Isso pede uma medida imediata, não só um documento: " +
    "ligue 190 (emergência em curso), 180 (violência contra a mulher, 24h) ou 100 (Disque " +
    "Direitos Humanos, 24h) antes de terminar este facilitador, se puder. O documento continua " +
    "útil depois da ligação — não é ou um ou outro."
  );
}

export const VIOLADOR_LABEL: Record<Violador, string> = {
  pessoa: "uma pessoa (vizinho, chefe, conhecido)",
  empresa: "uma empresa",
  agente_estado: "um agente do Estado (policial, fiscal, funcionário público)",
};

export const SITUACAO_LABEL: Record<Situacao, string> = {
  crianca_adolescente: "a vítima é criança ou adolescente",
  violencia_mulher: "é violência contra a mulher",
  discriminacao: "envolve racismo, xenofobia ou LGBTfobia",
  pessoa_deficiencia_idoso: "a vítima é pessoa com deficiência ou pessoa idosa",
  quilombola_indigena_tradicional_ambiental:
    "envolve comunidade quilombola, indígena, tradicional, ou é dano ambiental",
};
