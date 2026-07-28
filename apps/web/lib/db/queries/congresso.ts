import { and, asc, count, desc, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  analise_itensInCongresso,
  analisesInCongresso,
  bancada_membrosInCongresso,
  bancadasInCongresso,
  orgao_membrosInCongresso,
  orgaosInCongresso,
  parlamentaresInCongresso,
  proposicao_autoresInCongresso,
  proposicoesInCongresso,
  tramitacoesInCongresso,
} from "@/lib/db/schema";

/**
 * Queries do eixo Congresso.
 *
 * SOBRE ORDENAÇÃO: aqui várias listas são ordenadas por nome com
 * `localeCompare(..., "pt-BR")` no JavaScript. Isso NÃO foi movido para o
 * SQL de propósito — a collation do banco não é a mesma coisa que a do
 * Intl, e trocar mudaria silenciosamente a posição de nomes com acento
 * ("Ávila" antes ou depois de "Azevedo"). Só a agregação e o filtro vieram
 * para o SQL; a ordenação final continua onde estava, com a mesma
 * semântica de antes. Os conjuntos aqui são pequenos (354 bancadas, ~500
 * parlamentares), então ordenar em memória não custa nada.
 *
 * O `fetchAll()` do Supabase sumiu: existia só por causa do teto de 1000
 * linhas do PostgREST, que truncava sem erro.
 */

/** Bancadas com a contagem de membros, agregada no banco. */
export async function listarBancadasComContagem(tipo?: string) {
  const db = getDb();
  if (!db) return null;
  const q = db
    .select({
      id: bancadasInCongresso.id,
      casa_id: bancadasInCongresso.casa_id,
      id_externo: bancadasInCongresso.id_externo,
      tipo: bancadasInCongresso.tipo,
      nome: bancadasInCongresso.nome,
      legislatura: bancadasInCongresso.legislatura,
      url_site: bancadasInCongresso.url_site,
      // COUNT sobre o LEFT JOIN, não sobre as linhas: bancada sem membro
      // tem de aparecer com 0, e não sumir.
      membros: count(bancada_membrosInCongresso.parlamentar_id),
    })
    .from(bancadasInCongresso)
    .leftJoin(
      bancada_membrosInCongresso,
      eq(bancada_membrosInCongresso.bancada_id, bancadasInCongresso.id)
    )
    .groupBy(bancadasInCongresso.id);
  return tipo ? q.where(eq(bancadasInCongresso.tipo, tipo)) : q;
}

export async function obterBancadaPorId(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(bancadasInCongresso)
    .where(eq(bancadasInCongresso.id, id))
    .limit(1);
  return linha ?? null;
}

/** Membros de uma bancada, já com os dados do parlamentar. */
export async function membrosDaBancada(bancadaId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: parlamentaresInCongresso.id,
      nome: parlamentaresInCongresso.nome,
      partido: parlamentaresInCongresso.partido,
      uf: parlamentaresInCongresso.uf,
      url_foto: parlamentaresInCongresso.url_foto,
      papel: bancada_membrosInCongresso.papel,
    })
    .from(bancada_membrosInCongresso)
    .innerJoin(
      parlamentaresInCongresso,
      eq(parlamentaresInCongresso.id, bancada_membrosInCongresso.parlamentar_id)
    )
    .where(eq(bancada_membrosInCongresso.bancada_id, bancadaId));
}

/**
 * Proposições assinadas por um conjunto de parlamentares, com o rótulo da
 * análise.
 *
 * UMA query, sem fatiar. No Supabase isto rodava em lotes de 60 ids porque
 * o PostgREST põe todo filtro na URL e um `.in()` com 500 uuids devolvia
 * 414 — erro que chegava genérico e sumia fácil no meio da página. Um
 * partido grande custava ~9 requisições; agora custa 1. Isso importa duas
 * vezes: pelo teto de 50 subrequests do Workers Free e porque o modo de
 * falha antigo era silencioso.
 */
export async function proposicoesDeAutores(parlamentarIds: string[]) {
  const db = getDb();
  if (!db || parlamentarIds.length === 0) return [];
  return db
    .select({
      parlamentar_id: proposicao_autoresInCongresso.parlamentar_id,
      id: proposicoesInCongresso.id,
      identificacao: proposicoesInCongresso.identificacao,
      ementa: proposicoesInCongresso.ementa,
      data_apresentacao: proposicoesInCongresso.data_apresentacao,
      rotulo: analisesInCongresso.rotulo,
    })
    .from(proposicao_autoresInCongresso)
    .innerJoin(
      proposicoesInCongresso,
      eq(proposicoesInCongresso.id, proposicao_autoresInCongresso.proposicao_id)
    )
    .leftJoin(
      analisesInCongresso,
      eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id)
    )
    .where(inArray(proposicao_autoresInCongresso.parlamentar_id, parlamentarIds));
}

/**
 * Colunas `numeric` do Postgres voltam como STRING no Drizzle, para não
 * perder precisão — o PostgREST devolvia número. Sem converter, o
 * `(a.score ?? 0) - (b.score ?? 0)` que ordena os alertas viraria `NaN` e
 * a ordem ficaria arbitrária, sem erro nenhum. O cast para `double precision` restaura
 * o contrato que o app já esperava — feito com cast no SQL. Vale para `analises.score` e
 * `analise_itens.peso`.
 */

/**
 * Análises concluídas de um conjunto de rótulos, já com a proposição.
 *
 * No Supabase eram TRÊS idas ao banco: análises, depois `analise_itens`
 * por `.in(analise_id)`, depois `proposicoes` por `.in(proposicao_id)`.
 * O join elimina a terceira. Os itens continuam numa consulta à parte
 * porque são N por análise — trazê-los no mesmo join multiplicaria as
 * linhas da análise por cada item.
 */
export async function analisesComProposicao(rotulos: string[]) {
  const db = getDb();
  if (!db || rotulos.length === 0) return [];
  return db
    .select({
      id: analisesInCongresso.id,
      proposicao_id: analisesInCongresso.proposicao_id,
      score: sql<number>`(${analisesInCongresso.score})::double precision`,
      rotulo: analisesInCongresso.rotulo,
      clausula_petrea: analisesInCongresso.clausula_petrea,
      vedacao_retrocesso: analisesInCongresso.vedacao_retrocesso,
      resumo_neutro: analisesInCongresso.resumo_neutro,
      modelo: analisesInCongresso.modelo,
      criado_em: analisesInCongresso.criado_em,
      identificacao: proposicoesInCongresso.identificacao,
      ementa: proposicoesInCongresso.ementa,
      keywords: proposicoesInCongresso.keywords,
      temas_oficiais: proposicoesInCongresso.temas_oficiais,
      orgao_atual: proposicoesInCongresso.orgao_atual,
      data_apresentacao: proposicoesInCongresso.data_apresentacao,
    })
    .from(analisesInCongresso)
    .innerJoin(
      proposicoesInCongresso,
      eq(proposicoesInCongresso.id, analisesInCongresso.proposicao_id)
    )
    .where(
      and(
        eq(analisesInCongresso.status, "ok"),
        inArray(analisesInCongresso.rotulo, rotulos)
      )
    );
}

/** Itens de um conjunto de análises. */
export async function itensDasAnalises(analiseIds: string[]) {
  const db = getDb();
  if (!db || analiseIds.length === 0) return [];
  return db
    .select({
      analise_id: analise_itensInCongresso.analise_id,
      direito: analise_itensInCongresso.direito,
      dispositivo: analise_itensInCongresso.dispositivo,
      direcao: analise_itensInCongresso.direcao,
      grau: analise_itensInCongresso.grau,
      trecho: analise_itensInCongresso.trecho,
      peso: sql<number>`(${analise_itensInCongresso.peso})::double precision`,
    })
    .from(analise_itensInCongresso)
    .where(inArray(analise_itensInCongresso.analise_id, analiseIds));
}

/** Cobertura da análise: quantas proposições já foram analisadas. */
export async function coberturaAnalise() {
  const db = getDb();
  if (!db) return { analisadas: 0, total: 0 };
  const [[a], [t]] = await Promise.all([
    db
      .select({ n: count() })
      .from(analisesInCongresso)
      .where(eq(analisesInCongresso.status, "ok")),
    db.select({ n: count() }).from(proposicoesInCongresso),
  ]);
  return { analisadas: a?.n ?? 0, total: t?.n ?? 0 };
}

/** Rótulo da análise por órgão em que a proposição está parada. */
export async function rotulosPorOrgao() {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      orgao_atual: proposicoesInCongresso.orgao_atual,
      rotulo: analisesInCongresso.rotulo,
    })
    .from(proposicoesInCongresso)
    .leftJoin(
      analisesInCongresso,
      eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id)
    )
    .where(isNotNull(proposicoesInCongresso.orgao_atual));
}

export async function listarOrgaosAtivos() {
  const db = getDb();
  if (!db) return null;
  return db
    .select()
    .from(orgaosInCongresso)
    .where(eq(orgaosInCongresso.ativo, true));
}

/** Órgão por sigla, sem diferenciar maiúscula/minúscula (era `.ilike()`). */
export async function obterOrgaoPorSigla(sigla: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(orgaosInCongresso)
    .where(ilike(orgaosInCongresso.sigla, sigla))
    .limit(1);
  return linha ?? null;
}

export async function membrosDoOrgao(orgaoId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: parlamentaresInCongresso.id,
      nome: parlamentaresInCongresso.nome,
      partido: parlamentaresInCongresso.partido,
      uf: parlamentaresInCongresso.uf,
      email: parlamentaresInCongresso.email,
      papel: orgao_membrosInCongresso.papel,
    })
    .from(orgao_membrosInCongresso)
    .innerJoin(
      parlamentaresInCongresso,
      eq(parlamentaresInCongresso.id, orgao_membrosInCongresso.parlamentar_id)
    )
    .where(eq(orgao_membrosInCongresso.orgao_id, orgaoId));
}

/** Proposições paradas num órgão, com o rótulo e o score da análise. */
export async function proposicoesDoOrgao(sigla: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: proposicoesInCongresso.id,
      identificacao: proposicoesInCongresso.identificacao,
      ementa: proposicoesInCongresso.ementa,
      data_apresentacao: proposicoesInCongresso.data_apresentacao,
      rotulo: analisesInCongresso.rotulo,
      score: sql<number>`(${analisesInCongresso.score})::double precision`,
    })
    .from(proposicoesInCongresso)
    .leftJoin(
      analisesInCongresso,
      eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id)
    )
    .where(eq(proposicoesInCongresso.orgao_atual, sigla))
    .orderBy(
      desc(proposicoesInCongresso.data_apresentacao),
      asc(proposicoesInCongresso.id)
    );
}

export interface FiltrosProposicoes {
  casa?: string;
  ano?: number;
  tramitando?: boolean;
  tema?: string;
  rotulo?: string;
  q?: string;
  pagina?: number;
  porPagina?: number;
}

/**
 * Página de proposições, com a análise (quando existe) e o total do
 * conjunto filtrado.
 *
 * O `leftJoin` é deliberado: `innerJoin` descartaria toda proposição AINDA
 * NÃO analisada, e "sem análise" é estado legítimo que precisa continuar
 * visível. É a mesma razão pela qual o filtro por rótulo era aplicado
 * DEPOIS da consulta no Supabase — lá o `!inner` do PostgREST teria o
 * mesmo efeito destrutivo. Aqui o filtro pode ir para o `where` sem perigo,
 * porque só entra quando o usuário pediu um rótulo.
 *
 * O total vem por `count(*) over ()` na mesma query. No Supabase era o
 * header `count: "exact"`; uma segunda consulta só para contar gastaria um
 * subrequest a mais, e o teto no Workers Free é 50.
 */
export async function paginaDeProposicoes(filtros: FiltrosProposicoes = {}) {
  const db = getDb();
  if (!db) return null;
  const porPagina = filtros.porPagina ?? 20;
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const cond = [];
  if (filtros.casa) cond.push(eq(proposicoesInCongresso.casa_id, filtros.casa));
  if (filtros.ano) cond.push(eq(proposicoesInCongresso.ano, filtros.ano));
  if (filtros.tramitando !== undefined)
    cond.push(eq(proposicoesInCongresso.tramitando, filtros.tramitando));
  if (filtros.tema)
    cond.push(sql`${proposicoesInCongresso.temas_oficiais} @> ARRAY[${filtros.tema}]::text[]`);
  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    cond.push(
      sql`(${proposicoesInCongresso.ementa} ilike ${termo} or ${proposicoesInCongresso.keywords} ilike ${termo} or ${proposicoesInCongresso.identificacao} ilike ${termo})`
    );
  }
  if (filtros.rotulo) cond.push(eq(analisesInCongresso.rotulo, filtros.rotulo));

  return db
    .select({
      proposicao: proposicoesInCongresso,
      analise: analisesInCongresso,
      total: sql<number>`count(*) over ()`,
    })
    .from(proposicoesInCongresso)
    .leftJoin(
      analisesInCongresso,
      eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id)
    )
    .where(cond.length ? and(...cond) : undefined)
    // Desempate por id: sem ele, proposições da mesma data saem em ordem
    // indefinida e a paginação repete ou pula linhas entre páginas.
    .orderBy(desc(proposicoesInCongresso.data_apresentacao), asc(proposicoesInCongresso.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

export async function obterProposicaoPorId(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(proposicoesInCongresso)
    .where(eq(proposicoesInCongresso.id, id))
    .limit(1);
  return linha ?? null;
}

export async function analiseDaProposicao(proposicaoId: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      id: analisesInCongresso.id,
      proposicao_id: analisesInCongresso.proposicao_id,
      score: sql<number>`(${analisesInCongresso.score})::double precision`,
      rotulo: analisesInCongresso.rotulo,
      clausula_petrea: analisesInCongresso.clausula_petrea,
      vedacao_retrocesso: analisesInCongresso.vedacao_retrocesso,
      resumo_neutro: analisesInCongresso.resumo_neutro,
      parecer_critico: analisesInCongresso.parecer_critico,
      legislacao_relacionada: analisesInCongresso.legislacao_relacionada,
      modelo: analisesInCongresso.modelo,
      versao_rubrica: analisesInCongresso.versao_rubrica,
      versao_prompt: analisesInCongresso.versao_prompt,
      status: analisesInCongresso.status,
      criado_em: analisesInCongresso.criado_em,
    })
    .from(analisesInCongresso)
    .where(eq(analisesInCongresso.proposicao_id, proposicaoId))
    .limit(1);
  return linha ?? null;
}

export async function autoresDaProposicao(proposicaoId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      parlamentar_id: parlamentaresInCongresso.id,
      nome: parlamentaresInCongresso.nome,
      partido: parlamentaresInCongresso.partido,
      uf: parlamentaresInCongresso.uf,
      email: parlamentaresInCongresso.email,
      url_foto: parlamentaresInCongresso.url_foto,
      ordem: proposicao_autoresInCongresso.ordem,
      proponente: proposicao_autoresInCongresso.proponente,
    })
    .from(proposicao_autoresInCongresso)
    .innerJoin(
      parlamentaresInCongresso,
      eq(parlamentaresInCongresso.id, proposicao_autoresInCongresso.parlamentar_id)
    )
    .where(eq(proposicao_autoresInCongresso.proposicao_id, proposicaoId))
    .orderBy(asc(proposicao_autoresInCongresso.ordem));
}

/** Itens de UMA análise, com os numéricos já convertidos. */
export async function itensDaAnalise(analiseId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: analise_itensInCongresso.id,
      analise_id: analise_itensInCongresso.analise_id,
      direito: analise_itensInCongresso.direito,
      dispositivo: analise_itensInCongresso.dispositivo,
      direcao: analise_itensInCongresso.direcao,
      grau: analise_itensInCongresso.grau,
      trecho: analise_itensInCongresso.trecho,
      confianca: sql<number>`(${analise_itensInCongresso.confianca})::double precision`,
      peso: sql<number>`(${analise_itensInCongresso.peso})::double precision`,
    })
    .from(analise_itensInCongresso)
    .where(eq(analise_itensInCongresso.analise_id, analiseId));
}

export async function tramitacoesDaProposicao(proposicaoId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      sequencia: tramitacoesInCongresso.sequencia,
      data_hora: tramitacoesInCongresso.data_hora,
      sigla_orgao: tramitacoesInCongresso.sigla_orgao,
      descricao: tramitacoesInCongresso.descricao,
      despacho: tramitacoesInCongresso.despacho,
    })
    .from(tramitacoesInCongresso)
    .where(eq(tramitacoesInCongresso.proposicao_id, proposicaoId))
    .orderBy(desc(tramitacoesInCongresso.sequencia));
}

/** Temas oficiais distintos, para popular o filtro. */
export async function temasDistintos() {
  const db = getDb();
  if (!db) return [];
  // `unnest` faz o trabalho no banco. Antes vinham TODAS as proposições só
  // para juntar os temas num Set em memória.
  const linhas = await db.execute<{ tema: string }>(
    sql`select distinct unnest(temas_oficiais) as tema
        from congresso.proposicoes
        where temas_oficiais is not null`
  );
  return (linhas.rows ?? []).map((l) => l.tema).filter(Boolean);
}

/** Totais da home. Duas contagens, sem trazer linha nenhuma. */
export async function totaisHome() {
  const db = getDb();
  if (!db) return { proposicoes: null, analises: null };
  const [[p], [a]] = await Promise.all([
    db.select({ n: count() }).from(proposicoesInCongresso),
    db.select({ n: count() }).from(analisesInCongresso),
  ]);
  return { proposicoes: p?.n ?? null, analises: a?.n ?? null };
}
