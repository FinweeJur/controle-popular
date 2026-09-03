/**
 * lib/acordos/tags-reparacao.ts
 *
 * Regras de extração de tags temáticas para os Acordos de Reparação MG.
 * Baseado em `situacao_predominante` + `finalidade` dos anexos.
 */

export interface RegraTagAcordo {
  tag: string;
  label: string;
  /** Palavras-chave em minúsculas que, se presentes no texto, ativam a tag. */
  keywords: string[];
}

export const REGRAS_TAGS_ACORDOS: RegraTagAcordo[] = [
  { tag: "infraestrutura-viaria", label: "Infraestrutura Viária", keywords: ["pavimentação", "pavimentacao", "viário", "viario", "viária", "viaria", "arco viário", "arco viario", "manutenção viária", "rodovia", "ponte", "pontes"] },
  { tag: "saude", label: "Saúde", keywords: ["saúde", "saude", "hospital", "ubs", "centro de saúde", "centro de saude", "posto de saúde", "posto de saude", "sus", "atenção básica", "atencao basica"] },
  { tag: "saneamento", label: "Saneamento Básico", keywords: ["saneamento", "esgoto", "fossa", "tratamento de esgoto", "coleta de esgoto"] },
  { tag: "agua", label: "Água", keywords: ["captação de água", "captacao de agua", "adutora", "tratamento de água", "tratamento de agua", "abastecimento de água", "abastecimento de agua", "poço", "poco"] },
  { tag: "drenagem-urbana", label: "Drenagem Urbana", keywords: ["drenagem", "drenagem urbana", "bueiro", "microdrenagem"] },
  { tag: "meio-ambiente", label: "Meio Ambiente", keywords: ["recuperação ambiental", "recuperacao ambiental", "matas ciliares", "fauna", "flora", "remediação", "remediacao", "passivo ambiental", "barragem", "rejeito"] },
  { tag: "reassentamento", label: "Reassentamento", keywords: ["reassentamento", "reassentamentos", "bento rodrigues", "paracatu", "realocação", "realocacao", "indenização", "indenizacao"] },
  { tag: "cultura-patrimonio", label: "Cultura e Patrimônio", keywords: ["cultura", "patrimônio", "patrimonio", "centro histórico", "historico", "memória", "memoria", "turismo"] },
  { tag: "mobilidade", label: "Mobilidade", keywords: ["mobilidade", "transporte", "rôdoferroviária", "rodoferroviaria", "ferroviário", "ferroviario"] },
  { tag: "transferencia-renda", label: "Transferência de Renda", keywords: ["transferência de renda", "transferencia de renda", "ptr", "auxílio", "auxilio", "benefício", "beneficio", "bpc"] },
  { tag: "seguranca-hidrica", label: "Segurança Hídrica", keywords: ["segurança hídrica", "seguranca hidrica", "captação", "captacao", "rio das velhas", "adutora"] },
  { tag: "povos-tradicionais", label: "Povos Tradicionais", keywords: ["indígena", "indigena", "quilombola", "krenak", "tupiniquim", "guarani", "comunidade tradicional", "povos tradicionais"] },
  { tag: "educacao", label: "Educação", keywords: ["educação", "educacao", "escola", "escolas", "creche", "creches"] },
  { tag: "assistencia-social", label: "Assistência Social", keywords: ["assistência social", "assistencia social", "cras", "creas", "pulseira Solidária", "pulseira Solidaria"] },
];

/**
 * Extrai tags temáticas de um texto (situacao_predominante + finalidade).
 */
export function extrairTagsAcordo(texto: string): string[] {
  const normalizado = texto.toLowerCase();
  return REGRAS_TAGS_ACORDOS
    .filter((r) => r.keywords.some((kw) => normalizado.includes(kw)))
    .map((r) => r.tag);
}

/**
 * Gera micro-resumo para um município a partir dos dados disponíveis.
 */
export function gerarMicroResumo(m: {
  nome: string;
  acordo: string;
  valor_destinado_atualizado: number;
  projetos_em_execucao: number;
  situacao_predominante: string;
  bacia: string;
}): string {
  const valor = m.valor_destinado_atualizado;
  const valorFormatado = valor >= 1_000_000_000
    ? `R$ ${(valor / 1_000_000_000).toFixed(1)} bilhão`
    : valor >= 1_000_000
      ? `R$ ${(valor / 1_000_000).toFixed(0)} milhões`
      : `R$ ${valor.toLocaleString("pt-BR")}`;

  const situacao = m.situacao_predominante.charAt(0).toLowerCase() + m.situacao_predominante.slice(1);

  return `${m.nome} recebeu ${valorFormatado} do acordo de ${m.acordo} para ${m.projetos_em_execucao} projetos em execução na bacia da ${m.bacia}. ${situacao.charAt(0).toUpperCase() + situacao.slice(1)}.`;
}
