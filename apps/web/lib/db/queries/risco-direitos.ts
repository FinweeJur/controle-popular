/**
 * Agregador do Índice de Risco a Direitos com dados REAIS do banco.
 *
 * ═══ O QUE ESTE ARQUIVO É ═══
 *
 * `calcularIndiceRiscoDireitos` (lib/risco-direitos.ts) é o motor puro: dado
 * o agregado de entrada, devolve score, nível e fatores. Este arquivo é o
 * outro lado da régua editorial "o número vem do dado; o modelo, se houver,
 * só embrulha": busca no Postgres cada insumo que o motor espera, de fonte
 * oficial já coletada — e devolve junto a COBERTURA, ou seja, quais
 * dimensões têm dado de verdade. Lacuna é informação, e o card na home só
 * existe quando há pelo menos uma dimensão com dado.
 *
 * ═══ POR QUE NÃO FICA EM betim.ts ═══
 *
 * betim.ts já tem 3.1 mil linhas e este agregador cruza tabelas de frentes
 * diferentes (saúde, barragens, contratos, doações, transparência). Arquivo
 * próprio segue o padrão de `barragens.ts` / `terras.ts`, que também
 * separaram domínios que o betim.ts não cobre.
 *
 * ═══ QUAIS INSUMOS TÊM DADO REAL (e quais não, e por quê) ═══
 *
 * | Insumo do motor            | Fonte real usada aqui                  |
 * |----------------------------|----------------------------------------|
 * | barragensCriticasQtd       | feam_barragens (nivel_emergencia>0) +   |
 * |                            | snisb_barragens (nivel_perigo != Normal)|
 * | sobreposicoesTiCarHa       | 0 — não há query de banco; a lente de   |
 * |                            | terras é arquivo (lib/terras) e não     |
 * |                            | casa por id_municipio                  |
 * | infracoesIbamaAtivasQtd    | ibama_autos_infracao (contagem)         |
 * | contratosDoadoresReais     | contratos × doacoes_campanha (CNPJ de   |
 * |                            | doador PJ, 14 dígitos — documento nunca |
 * |                            | é exposto)                              |
 * | empresasSancionadas...     | contratos × fornecedores.ceis_detalhes  |
 * | camaraSemApiAberta         | fontes.camara_proposicoes === false     |
 * | internacoesCidsAmbientaisQtd | saude_internacoes_cid ∩ CIDs de       |
 * |                            | CIDS_MONITORAMENTO_AMBIENTAL (ano       |
 * |                            | mais recente)                           |
 * | taxaMortalidadeEvitavel    | 0 — a tabela mortalidade não classifica |
 * |                            | "evitável"; não inventar taxa           |
 * | indiceTransparenciaPntp    | nota_transparencia (0-1 → 0-100)        |
 *
 * O motor soma pesos em cima de baselines fixos (15/10/15/10). O card da
 * home não pode mostrar "Risco Baixo 12/100" para uma cidade sem dado
 * nenhum — isso seria número fabricado. A `CoberturaIndice` é o que separa
 * "0 real" de "0 sem dado", e quem renderiza decide com ela.
 */

import { and, count, desc, eq, gt, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import {
  contratos,
  doacoes_campanha,
  feam_barragens,
  fornecedores,
  ibama_autos_infracao,
  nota_transparencia,
  saude_internacoes_cid,
  snisb_barragens,
} from "@/lib/db/schema";
import { CIDS_MONITORAMENTO_AMBIENTAL } from "@/lib/saude/cid";
import { calcularIndiceRiscoDireitos, type IndiceRiscoDireitos } from "@/lib/risco-direitos";
import type { Cidade, IdMunicipio } from "@/lib/db/queries/municipios";

/** Quais dimensões do índice têm dado real coletado (não é "0" fabricado). */
export interface CoberturaIndice {
  saudeVida: boolean;
  socioambientalClima: boolean;
  integridadeErario: boolean;
  opacidadePolitica: boolean;
}

export interface IndiceComCobertura {
  indice: IndiceRiscoDireitos;
  cobertura: CoberturaIndice;
}

/** CNPJ de doador PJ tem 14 dígitos; CPF de PF tem 11 e NUNCA entra aqui. */
const SO_CNPJ = sql`length(${doacoes_campanha.doador_documento_mascarado}) = 14`;

/**
 * Busca os insumos reais do índice para o município e calcula o score.
 *
 * Retorna `null` quando o banco não responde (mesmo contrato das queries
 * de betim.ts). A cobertura acompanha o índice: cada dimensão diz se a
 * fonte dela tem dado coletado para esta cidade.
 */
export async function indicadoresRiscoDireitos(
  idMunicipio: IdMunicipio,
  cidade: Cidade
): Promise<IndiceComCobertura | null> {
  const db = getDb();
  if (!db) return null;

  // ── 2. Socioambiental e Clima ─────────────────────────────────────────
  const [feamCriticas, snisbCriticas, autosIbama] = await Promise.all([
    db
      .select({ n: count() })
      .from(feam_barragens)
      .where(and(eq(feam_barragens.id_municipio, idMunicipio), gt(feam_barragens.nivel_emergencia, 0)))
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ n: count() })
      .from(snisb_barragens)
      .where(
        and(
          eq(snisb_barragens.id_municipio, idMunicipio),
          isNotNull(snisb_barragens.nivel_perigo),
          ne(snisb_barragens.nivel_perigo, "Normal")
        )
      )
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ n: count() })
      .from(ibama_autos_infracao)
      .where(eq(ibama_autos_infracao.id_municipio, idMunicipio))
      .then((r) => Number(r[0]?.n ?? 0)),
  ]);

  // ── 3. Integridade e Erário ────────────────────────────────────────────
  const cnpjsSancionados = (
    await db
      .select({ cnpj: fornecedores.cnpj })
      .from(fornecedores)
      .where(isNotNull(fornecedores.ceis_detalhes))
  )
    .map((r) => r.cnpj)
    .filter((c): c is string => Boolean(c));

  const cnpjsDoadoresPj = (
    await db
      .select({ cnpj: doacoes_campanha.doador_documento_mascarado })
      .from(doacoes_campanha)
      .where(and(eq(doacoes_campanha.id_municipio, idMunicipio), isNotNull(doacoes_campanha.doador_documento_mascarado), SO_CNPJ))
  )
    .map((r) => r.cnpj)
    .filter((c): c is string => Boolean(c));

  const [contratosSancionados, valorContratosDoadores, totalContratos] = await Promise.all([
    cnpjsSancionados.length > 0
      ? db
          .select({ n: count() })
          .from(contratos)
          .where(and(eq(contratos.id_municipio, idMunicipio), inArray(contratos.fornecedor_cnpj, cnpjsSancionados)))
          .then((r) => Number(r[0]?.n ?? 0))
      : Promise.resolve(0),
    cnpjsDoadoresPj.length > 0
      ? db
          .select({
            total: sql<number>`coalesce(sum(${num(contratos.valor_global)}), 0)::double precision`,
          })
          .from(contratos)
          .where(and(eq(contratos.id_municipio, idMunicipio), inArray(contratos.fornecedor_cnpj, cnpjsDoadoresPj)))
          .then((r) => Number(r[0]?.total ?? 0))
      : Promise.resolve(0),
    db
      .select({ n: count() })
      .from(contratos)
      .where(eq(contratos.id_municipio, idMunicipio))
      .then((r) => Number(r[0]?.n ?? 0)),
  ]);

  // ── 1. Saúde e Vida — CIDs ambientais no ano mais recente ──────────────
  const cidsDoMunicipio = await db
    .select({
      ano: saude_internacoes_cid.ano,
      cid_codigo: saude_internacoes_cid.cid_codigo,
      internacoes: saude_internacoes_cid.internacoes_total,
    })
    .from(saude_internacoes_cid)
    .where(eq(saude_internacoes_cid.id_municipio, idMunicipio));

  const anoMaisRecente = cidsDoMunicipio.reduce<number | null>(
    (m, l) => (l.ano !== null && (m === null || l.ano > m) ? l.ano : m),
    null
  );
  const cidsAmbientais = cidsDoMunicipio
    .filter((l) => l.ano === anoMaisRecente && l.cid_codigo !== null)
    .filter((l) => l.cid_codigo! in CIDS_MONITORAMENTO_AMBIENTAL)
    .reduce((soma, l) => soma + Number(l.internacoes ?? 0), 0);

  // ── 4. Opacidade Política ─────────────────────────────────────────────
  const camaraSemApiAberta = (cidade.fontes ?? {})["camara_proposicoes"] === false;
  const [pntpMaisRecente] = await db
    .select({ indice: num(nota_transparencia.indice_transparencia) })
    .from(nota_transparencia)
    .where(eq(nota_transparencia.id_municipio, idMunicipio))
    .orderBy(desc(nota_transparencia.ano))
    .limit(1);
  const indiceTransparenciaPntp =
    pntpMaisRecente?.indice === null || pntpMaisRecente?.indice === undefined
      ? null
      : Math.round(Number(pntpMaisRecente.indice) * 100);

  // ── montar a entrada do motor e calcular ───────────────────────────────
  const indice = calcularIndiceRiscoDireitos({
    barragensCriticasQtd: feamCriticas + snisbCriticas,
    sobreposicoesTiCarHa: 0,
    infracoesIbamaAtivasQtd: autosIbama,
    contratosDoadoresReais: valorContratosDoadores,
    empresasSancionadasContratosQtd: contratosSancionados,
    camaraSemApiAberta,
    internacoesCidsAmbientaisQtd: cidsAmbientais,
    taxaMortalidadeEvitavel: 0,
    indiceTransparenciaPntp: indiceTransparenciaPntp ?? 0,
  });

  return {
    indice,
    cobertura: {
      saudeVida: cidsDoMunicipio.length > 0,
      socioambientalClima: feamCriticas + snisbCriticas + autosIbama > 0,
      integridadeErario: totalContratos > 0,
      opacidadePolitica:
        indiceTransparenciaPntp !== null ||
        typeof (cidade.fontes ?? {})["camara_proposicoes"] === "boolean",
    },
  };
}
