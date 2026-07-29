import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Tags temáticas (pedido do usuário 2026-07-22): requerimentos, projetos
 * de lei e contratos carregam tags de tema (Saúde, Educação, Segurança
 * Pública...) pra dar pra filtrar e entender as áreas de foco de atuação
 * de cada vereador/prefeitura — não só QUANTO cada um legisla (ranking
 * ponderado em `lib/vereadores.ts`), mas SOBRE O QUÊ.
 *
 * Classificação (por palavra-chave, feita no ETL — ver `etl/temas.py`)
 * roda uma vez na escrita; aqui é só o rótulo em português e a leitura
 * agregada. Espelha `TEMA_LABELS` do lado Python — mesma lista, mesmos
 * slugs, dois arquivos porque a classificação roda em Python (ETL) e a
 * exibição roda em TypeScript (app), igual ao par
 * `TIPO_MATERIA`/`TIPO_PROPOSICAO_LABELS` já existente pras proposições.
 */
export const TEMA_LABELS: Record<string, string> = {
  saude: "Saúde",
  educacao: "Educação",
  seguranca_publica: "Segurança Pública",
  assistencia_social: "Assistência Social",
  meio_ambiente: "Meio Ambiente",
  infraestrutura_obras: "Infraestrutura e Obras",
  mobilidade_transporte: "Mobilidade e Transporte",
  habitacao_urbanismo: "Habitação e Urbanismo",
  cultura_esporte_lazer: "Cultura, Esporte e Lazer",
  economia_desenvolvimento: "Economia e Desenvolvimento",
  administracao_publica: "Administração Pública",
  homenagens_datas: "Homenagens e Datas Comemorativas",
  agropecuaria: "Agropecuária",
};

/** Ordem alfabética (pelo label em português) pra listas/filtros. */
export const TEMAS_ORDENADOS: string[] = Object.keys(TEMA_LABELS).sort((a, b) =>
  TEMA_LABELS[a].localeCompare(TEMA_LABELS[b], "pt-BR")
);

export interface ContagemTema {
  tema: string;
  label: string;
  qtd: number;
}

interface TemasResult {
  temas: ContagemTema[];
  /** `false` quando o banco não está configurado ou a consulta falhou —
   *  degrada pra "sem dado" em vez de quebrar a página. */
  ok: boolean;
}

const SEM_BANCO: TemasResult = { temas: [], ok: false };

/**
 * A contagem em si desceu para o banco (`unnest` + `group by`, ver
 * `lib/db/queries/betim.ts`). Aqui sobra só pendurar o rótulo em
 * português. Uma proposição/contrato pode ter vários temas ao mesmo tempo,
 * então a soma das contagens passa do total de linhas — é esperado, não um
 * bug. Tema sem nenhuma ocorrência não aparece: a lista é sobre ranquear o
 * que É relevante, e "Agropecuária: 0" não é.
 */
function comRotulo(linhas: { tema: string; qtd: number }[]): ContagemTema[] {
  return linhas.map((r) => ({
    tema: r.tema,
    label: TEMA_LABELS[r.tema] ?? r.tema,
    qtd: r.qtd,
  }));
}

/**
 * Áreas de atuação de UM vereador.
 *
 * ACHADO: a consulta antiga filtrava SÓ por `vereador_id`, sem
 * `id_municipio`. Como o id é uuid a colisão entre cidades é improvável,
 * mas a regra vale sem exceção — e defesa em profundidade custa uma
 * cláusula. Agora filtra pelos dois.
 */
export async function getTemasVereador(
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<TemasResult> {
  try {
    const linhas = await q.temasDeProposicoes(idMunicipio, vereadorId);
    if (!linhas) return SEM_BANCO;
    return { temas: comRotulo(linhas), ok: true };
  } catch {
    return SEM_BANCO;
  }
}

/** Áreas de atuação da Câmara inteira — conta os temas de toda proposição. */
export async function getTemasCamara(idMunicipio: IdMunicipio): Promise<TemasResult> {
  try {
    const linhas = await q.temasDeProposicoes(idMunicipio);
    if (!linhas) return SEM_BANCO;
    return { temas: comRotulo(linhas), ok: true };
  } catch {
    return SEM_BANCO;
  }
}

/** Áreas de atuação da Prefeitura — conta os temas de todo contrato. */
export async function getTemasPrefeitura(idMunicipio: IdMunicipio): Promise<TemasResult> {
  try {
    const linhas = await q.temasDeContratos(idMunicipio);
    if (!linhas) return SEM_BANCO;
    return { temas: comRotulo(linhas), ok: true };
  } catch {
    return SEM_BANCO;
  }
}
