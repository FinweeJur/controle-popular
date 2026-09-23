import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  condicionantes,
  condicionantes_evidencias,
  documentos_ambientais,
} from "@/lib/db/schema";

/**
 * Queries de `/ambiental/condicionantes` (piloto Irapé + Setúbal).
 *
 * Regras do dono (PLANO-CONDICIONANTES-AMBIENTAIS.md, 23/09):
 * - status `cumprida`/`nao_cumprida` só com evidência linkada;
 * - agregado no servidor (AGENTS §5.1) — array cru nunca vira prop de
 *   cliente acima do teto;
 * - público acadêmico não consulta daqui (`lib/ambiental/publicacoes-barragens`).
 *
 * Migration: `0089_ambiental_condicionantes.sql`.
 * Banco: Postgres do Guara (Neon em 94% até a Fase 4).
 */

export type StatusCondicionante =
  | "cumprida"
  | "parcial"
  | "nao_cumprida"
  | "nao_informado"
  | "em_analise";

export interface CondicionanteLinha {
  id: string;
  empreendimento: string;
  texto: string;
  tipo: string;
  prazo: string | null;
  orgao: string;
  status: StatusCondicionante;
  metodoStatus: string;
  confianca: number | null;
  resumoIa: string | null;
  ordemNaFonte: number | null;
  documentoUrlFonte: string | null;
  documentoUrlR2: string | null;
  documentoTipo: string | null;
  evidencias: { tipo: string; url: string; data: string | null }[];
}

export interface ContagemCondicionantes {
  total: number;
  comInformacao: number;
  cumpridas: number;
  naoCumpridas: number;
  naoInformado: number;
  empreendimentos: number;
  /** true quando ainda não há nenhuma linha (piloto vazio). */
  vazio: boolean;
}

const CONTAGEM_VAZIA: ContagemCondicionantes = {
  total: 0,
  comInformacao: 0,
  cumpridas: 0,
  naoCumpridas: 0,
  naoInformado: 0,
  empreendimentos: 0,
  vazio: true,
};

/**
 * Cartões do topo: só agregados. `comInformacao` = status diferente de
 * `nao_informado` — o denominador honesto do "% com informação" da tela.
 */
export async function contarCondicionantes(): Promise<ContagemCondicionantes> {
  const db = getDb();
  if (!db) return CONTAGEM_VAZIA;

  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      cumpridas: sql<number>`count(*) filter (where ${condicionantes.status} = 'cumprida')::int`,
      naoCumpridas: sql<number>`count(*) filter (where ${condicionantes.status} = 'nao_cumprida')::int`,
      naoInformado: sql<number>`count(*) filter (where ${condicionantes.status} = 'nao_informado')::int`,
      comInformacao: sql<number>`count(*) filter (where ${condicionantes.status} <> 'nao_informado')::int`,
      empreendimentos: sql<number>`count(distinct ${condicionantes.empreendimento})::int`,
    })
    .from(condicionantes);

  const total = r?.total ?? 0;
  return {
    total,
    comInformacao: r?.comInformacao ?? 0,
    cumpridas: r?.cumpridas ?? 0,
    naoCumpridas: r?.naoCumpridas ?? 0,
    naoInformado: r?.naoInformado ?? 0,
    empreendimentos: r?.empreendimentos ?? 0,
    vazio: total === 0,
  };
}

/**
 * Lista filtrável do empreendimento (piloto: página da barragem).
 * `limit` defensivo: acima de ~2 mil linhas a tela fatia no servidor
 * (AGENTS §5.1).
 */
export async function listarCondicionantes(
  empreendimento: string,
  limite = 500,
): Promise<CondicionanteLinha[]> {
  const db = getDb();
  if (!db) return [];

  const linhas = await db
    .select({
      id: condicionantes.id,
      empreendimento: condicionantes.empreendimento,
      texto: condicionantes.texto,
      tipo: condicionantes.tipo,
      prazo: condicionantes.prazo,
      orgao: condicionantes.orgao,
      status: condicionantes.status,
      metodoStatus: condicionantes.metodo_status,
      confianca: condicionantes.confianca,
      resumoIa: condicionantes.resumo_ia,
      ordemNaFonte: condicionantes.ordem_na_fonte,
      documentoUrlFonte: documentos_ambientais.url_fonte,
      documentoUrlR2: documentos_ambientais.url_r2,
      documentoTipo: documentos_ambientais.tipo_documento,
    })
    .from(condicionantes)
    .innerJoin(documentos_ambientais, eq(condicionantes.documento_id, documentos_ambientais.id))
    .where(eq(condicionantes.empreendimento, empreendimento))
    .orderBy(asc(condicionantes.ordem_na_fonte), asc(condicionantes.id))
    .limit(limite);

  if (linhas.length === 0) return [];

  const evidencias = await db
    .select({
      condicionanteId: condicionantes_evidencias.condicionante_id,
      tipo: condicionantes_evidencias.tipo,
      url: condicionantes_evidencias.url_especifica,
      data: condicionantes_evidencias.data,
    })
    .from(condicionantes_evidencias)
    .orderBy(desc(condicionantes_evidencias.data));

  const porCond = new Map<string, CondicionanteLinha["evidencias"]>();
  for (const e of evidencias) {
    const arr = porCond.get(e.condicionanteId) ?? [];
    arr.push({ tipo: e.tipo, url: e.url, data: e.data });
    porCond.set(e.condicionanteId, arr);
  }

  return linhas.map((l) => ({
    ...l,
    status: l.status as StatusCondicionante,
    confianca: l.confianca == null ? null : Number(l.confianca),
    evidencias: porCond.get(l.id) ?? [],
  }));
}

/** Documentos oficiais já espelhados/marcados para um empreendimento. */
export async function documentosDoEmpreendimento(empreendimento: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: documentos_ambientais.id,
      urlFonte: documentos_ambientais.url_fonte,
      urlR2: documentos_ambientais.url_r2,
      orgao: documentos_ambientais.orgao,
      tipo: documentos_ambientais.tipo_documento,
      data: documentos_ambientais.data_documento,
      processo: documentos_ambientais.numero_processo,
    })
    .from(documentos_ambientais)
    .where(eq(documentos_ambientais.empreendimento, empreendimento))
    .orderBy(desc(documentos_ambientais.data_documento));
}
