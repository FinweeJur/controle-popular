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
  presencas_plenarioInCongresso,
  proposicao_autoresInCongresso,
  proposicoesInCongresso,
  tramitacoesInCongresso,
  votacoesInCongresso,
  votosInCongresso,
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
/**
 * Proposições paradas num órgão, LIMITADAS.
 *
 * O limite não é preferência de UI, é o que mantém o site no ar. Sem ele,
 * `/congresso/comissoes/MESA` renderizava as **2.369** proposições da Mesa
 * Diretora com a `ementa` inteira de cada uma: página de 12,4 MB, medida em
 * **1.897 ms de CPU** no Cloudflare Worker (`wrangler tail`), o que dispara
 * "Worker exceeded CPU time limit". E o efeito não fica na página culpada —
 * com o Worker estourando, rotas VIZINHAS e até estáticas passaram a
 * devolver 503 (12 de 28 no crawl), o risco de arquitetura já registrado no
 * plano: três eixos num Worker só.
 *
 * A Mesa só entrou nesse volume quando `etl.camara.orgaos` passou a
 * sincronizar `codTipoOrgao=1` para consertar os destinatários do ofício —
 * ou seja, a correção de uma coisa criou o gargalo da outra.
 */
export async function proposicoesDoOrgao(sigla: string, limite = 60) {
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
    )
    .limit(limite);
}

/**
 * Só os rótulos de TODAS as proposições do órgão — para o perfil agregado
 * continuar correto mesmo com a lista exibida limitada.
 *
 * Separar é o ponto: agregar sobre as 60 exibidas daria um perfil
 * simplesmente errado, e trazer as 2.369 com `ementa` é o que estourava a
 * CPU. Um enum por linha é barato; a `ementa` é que é caríssima.
 */
export async function rotulosDoOrgao(sigla: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ rotulo: analisesInCongresso.rotulo })
    .from(proposicoesInCongresso)
    .leftJoin(
      analisesInCongresso,
      eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id)
    )
    .where(eq(proposicoesInCongresso.orgao_atual, sigla));
}

export interface FiltrosProposicoes {
  casa?: string;
  ano?: number;
  tramitando?: boolean;
  tema?: string;
  rotulo?: string;
  q?: string;
  /**
   * Nome do autor (parlamentar OU institucional).
   *
   * Existe porque a busca por texto (`q`) varre ementa, keywords e
   * identificação — nunca a autoria. Sem este filtro, clicar num deputado na
   * busca não levaria a lugar nenhum útil: não há página de parlamentar
   * neste eixo, e "projetos de quem" é a pergunta imediata depois de
   * "de quem é este projeto".
   */
  autor?: string;
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
  if (filtros.autor) {
    // `exists` e não join: um join com a autoria multiplicaria as linhas da
    // página por autor e quebraria o `count(*) over ()` que dá o total.
    cond.push(
      sql`exists (select 1 from congresso.proposicao_autoria pa
                   where pa.proposicao_id = ${proposicoesInCongresso.id}
                     and pa.nome ilike ${`%${filtros.autor}%`})`
    );
  }

  return db
    .select({
      proposicao: proposicoesInCongresso,
      analise: analisesInCongresso,
      total: sql<number>`(count(*) over ())::int`,
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

/**
 * Autoria COMPLETA de uma proposição, incluindo autor institucional.
 *
 * `autoresDaProposicao` (acima) faz `innerJoin` com `parlamentares` porque
 * o ofício precisa do e-mail do gabinete — e por isso ela devolve VAZIO nas
 * 1.117 proposições de autoria institucional. Esta é a lista de leitura;
 * aquela é a de contato. As duas continuam existindo de propósito.
 */
export async function autoriaCompletaDaProposicao(proposicaoId: string) {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{
    nome: string;
    tipo: string | null;
    partido: string | null;
    uf: string | null;
    ordem: number | null;
    proponente: boolean;
    cod_tipo: number | null;
    parlamentar_id: string | null;
  }>(sql`
    select nome, tipo, partido, uf, ordem, proponente, cod_tipo, parlamentar_id
      from congresso.proposicao_autoria
     where proposicao_id = ${proposicaoId}
     order by proponente desc, ordem asc nulls last, nome asc
  `);
  return (linhas.rows ?? []).map((l) => ({
    ...l,
    institucional: l.cod_tipo !== 10000,
  }));
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

export interface AutoriaResumo {
  proposicao_id: string;
  /** Até 2 autores, na ordem de assinatura (proponente primeiro). */
  autores: {
    nome: string;
    tipo: string | null;
    partido: string | null;
    uf: string | null;
    parlamentar_id: string | null;
    institucional: boolean;
  }[];
  /** Total de autores da proposição, não o total exibido. */
  total: number;
}

/**
 * Autoria de um LOTE de proposições, para a lista mostrar de quem é o
 * projeto sem entrar no detalhe.
 *
 * TRAZ NO MÁXIMO 2 AUTORES POR PROPOSIÇÃO, e o total à parte. Isso não é
 * economia decorativa: `PEC 3/2026` tem **224 autores** no banco. Buscar a
 * autoria inteira de 60 cards renderizaria milhares de linhas para exibir
 * duas de cada — o mesmo tipo de desperdício que já estourou o limite de
 * CPU do Worker em `/congresso/comissoes/MESA`.
 *
 * O `row_number()` ordena por `proponente desc` primeiro porque autor
 * principal e primeiro signatário não são sempre a mesma pessoa, e é o
 * proponente que responde pelo projeto.
 *
 * Uma query só, com os ids parametrizados um a um (não interpolados).
 */
export async function autoriaDeProposicoes(ids: string[]): Promise<AutoriaResumo[]> {
  const db = getDb();
  if (!db || ids.length === 0) return [];
  const lista = sql.join(
    ids.map((i) => sql`${i}`),
    sql`, `
  );
  const linhas = await db.execute<{
    proposicao_id: string;
    nome: string;
    tipo: string | null;
    partido: string | null;
    uf: string | null;
    parlamentar_id: string | null;
    cod_tipo: number | null;
    total: number;
  }>(sql`
    select proposicao_id, nome, tipo, partido, uf, parlamentar_id, cod_tipo, total
      from (
        select a.*,
               (count(*) over (partition by a.proposicao_id))::int as total,
               row_number() over (
                 partition by a.proposicao_id
                 order by a.proponente desc, a.ordem asc nulls last, a.nome asc
               ) as rn
          from congresso.proposicao_autoria a
         where a.proposicao_id in (${lista})
      ) x
     where rn <= 2
     order by proposicao_id, rn
  `);

  const porProposicao = new Map<string, AutoriaResumo>();
  for (const l of linhas.rows ?? []) {
    const atual =
      porProposicao.get(l.proposicao_id) ??
      { proposicao_id: l.proposicao_id, autores: [], total: l.total };
    atual.autores.push({
      nome: l.nome,
      tipo: l.tipo,
      partido: l.partido,
      uf: l.uf,
      parlamentar_id: l.parlamentar_id,
      // `cod_tipo` 10000 é "Deputado(a)". Qualquer outro é Poder Executivo,
      // comissão, Senado, Judiciário ou sociedade civil — e a UI escreve
      // esses sem "Dep.".
      institucional: l.cod_tipo !== 10000,
    });
    porProposicao.set(l.proposicao_id, atual);
  }
  return [...porProposicao.values()];
}

export type ProposicaoRelevante = {
  id: string;
  identificacao: string | null;
  ementa: string | null;
  situacao: string | null;
  orgao_atual: string | null;
  rotulo: string | null;
  score: number | null;
  rank: number;
  /** Quantos dos termos da pergunta esta proposição casa. */
  termos_casados: number;
};

/**
 * Proposições por RELEVÂNCIA textual, para o contexto do assistente.
 *
 * POR QUE NÃO REUSAR `paginaDeProposicoes`: ela ordena por
 * `data_apresentacao desc`, que é o certo para uma LISTA navegável e o
 * errado para responder uma pergunta. Medido: "projetos sobre trabalho
 * escravo" devolvia, como primeiro resultado, um PL sobre cooperativas
 * solidárias — as cinco proposições mais RECENTES que contêm "trabalho",
 * não as mais relacionadas a "trabalho escravo". Com `ts_rank`, os dois
 * primeiros passam a ser o PL que inclui trabalho escravo na educação
 * básica e o que reestrutura o tipo penal de redução a condição análoga à
 * de escravo. É a diferença entre um assistente útil e um que muda de
 * assunto.
 *
 * RECEBE TERMOS JÁ LIMPOS, E OS UNE COM `or`. Passar a pergunta crua para
 * `websearch_to_tsquery` foi a primeira tentativa e devolveu ZERO para
 * "projetos sobre trabalho escravo": aquela função faz **AND** de todos os
 * termos, então exigia a palavra "projetos" dentro da ementa. Com `or`, o
 * recall volta e a precisão fica por conta do `ts_rank`, que pontua mais alto
 * justamente o documento que casa com TODOS os termos — medido: o PL sobre
 * trabalho escravo na educação básica fica em primeiro, à frente dos que só
 * falam de "trabalho".
 *
 * O stemming do dicionário português continua valendo ("reunião" acha
 * "reunir"), e é ele que faz um termo digitado no plural encontrar a ementa
 * no singular.
 *
 * A expressão do `to_tsvector` é IDÊNTICA à do índice GIN que já existe
 * (`proposicoes_to_tsvector_idx`, sobre `ementa || ' ' || keywords`).
 * Qualquer diferença — outra ordem, outro separador — faria o Postgres
 * ignorar o índice e varrer 5,5 mil linhas sem avisar.
 */
export async function proposicoesRelevantes(termos: string[], limite = 6) {
  const db = getDb();
  // `or` é sintaxe de `websearch_to_tsquery`; os termos já vêm sem pontuação
  // do extrator, então não há como um deles injetar operador.
  const q = termos.filter(Boolean).join(" or ");
  if (!db || q.length < 3) return [];
  // `cross join` DEPOIS do `left join`, e não `from p, consulta left join a`:
  // naquela forma o Postgres liga o LEFT JOIN a `consulta`, e a condição
  // `a.proposicao_id = p.id` estoura com "invalid reference to FROM-clause
  // entry for table p". O erro era engolido pela degradação do chamador, e o
  // sintoma era o bloco de proposições simplesmente NÃO APARECER no contexto
  // — falha silenciosa, achada só ao ler a resposta inteira do assistente.
  // `termos_casados` conta quantos termos DISTINTOS o documento casa, e a
  // ordenação o usa ANTES do rank.
  //
  // Isto existe porque o `or` sozinho não distingue sinal de ruído quando os
  // termos fortes não existem no banco: medido em "mineração em área
  // indígena" (nenhuma proposição de 2026 fala das duas coisas juntas), o
  // resultado era radiodifusão do "Instituto Banco de Areia" — casando UM
  // termo fraco, com rank parecido com o de qualquer outro que também casa
  // um só. Um piso relativo de rank não resolve esse caso, justamente porque
  // todos os candidatos empatam por baixo. Contar termos resolve: quem casa 2
  // de 3 termos vem antes de quem casa 1, e o chamador pode exigir 2 quando a
  // pergunta tem 2 ou mais termos de conteúdo.
  const contagem = sql.join(
    termos.filter(Boolean).map(
      (t) =>
        sql`(case when to_tsvector('portuguese', coalesce(p.ementa,'') || ' ' || coalesce(p.keywords,'')) @@ plainto_tsquery('portuguese', ${t}) then 1 else 0 end)`
    ),
    sql` + `
  );

  const linhas = await db.execute<ProposicaoRelevante>(sql`
    select p.id, p.identificacao, p.ementa, p.situacao, p.orgao_atual,
           a.rotulo, (a.score)::double precision as score,
           ts_rank(
             to_tsvector('portuguese', coalesce(p.ementa,'') || ' ' || coalesce(p.keywords,'')),
             c.tq
           ) as rank,
           (${contagem})::int as termos_casados
      from congresso.proposicoes p
      left join congresso.analises a
             on a.proposicao_id = p.id and a.status = 'ok'
      cross join (select websearch_to_tsquery('portuguese', ${q}) as tq) c
     where to_tsvector('portuguese', coalesce(p.ementa,'') || ' ' || coalesce(p.keywords,''))
           @@ c.tq
     order by termos_casados desc, rank desc, p.data_apresentacao desc nulls last
     limit ${limite}
  `);
  return linhas.rows ?? [];
}

/* ─────────────────────── Busca rápida (autocomplete) ─────────────────── */

export type SugestaoBusca = {
  tipo: string;
  titulo: string;
  subtitulo: string | null;
  href: string;
  /** Menor = mais relevante. Só para ordenar; não vai para a UI. */
  peso: number;
};

/**
 * Autocomplete do Congresso: proposição, comissão, bancada, autor e agenda.
 *
 * UMA consulta, com `union all`. Cinco consultas separadas custariam cinco
 * subrequests do Worker por TECLA digitada — com o teto de 50 por invocação,
 * a barra de busca sozinha poderia derrubar a rota. O `union all` também
 * deixa o Postgres decidir os cinco planos de uma vez.
 *
 * `peso` ordena por utilidade, não por relevância textual: identificação
 * exata ("PL 3611/2026") primeiro, porque quem digita isso sabe o que quer.
 * Só depois vem sigla de comissão, autor, ementa e agenda.
 *
 * O `ilike '%termo%'` não usa índice de prefixo, e é aceitável aqui porque
 * cada ramo tem `limit` pequeno e os conjuntos são de milhares, não milhões.
 * Se virar gargalo, o caminho é `pg_trgm` — o índice GIN de trigrama já
 * existe em `proposicoes`.
 */
export async function buscaRapidaCongresso(termo: string, limite = 8) {
  const db = getDb();
  const q = termo.trim();
  if (!db || q.length < 2) return [];
  const like = `%${q}%`;

  const linhas = await db.execute<SugestaoBusca>(sql`
    (select 'proposição' as tipo, p.identificacao as titulo,
            left(p.ementa, 110) as subtitulo,
            '/congresso/proposicoes/' || p.id as href,
            case when p.identificacao ilike ${like} then 1 else 4 end as peso
       from congresso.proposicoes p
      where p.identificacao ilike ${like} or p.ementa ilike ${like}
      order by peso, p.data_apresentacao desc nulls last
      limit ${limite})
    union all
    (select 'comissão', o.sigla, o.nome,
            '/congresso/comissoes/' || o.sigla, 2
       from congresso.orgaos o
      where o.ativo and (o.sigla ilike ${like} or o.nome ilike ${like})
      limit 4)
    union all
    (select distinct on (a.nome) 'autor', a.nome,
            coalesce(a.partido || '-' || a.uf, a.tipo),
            '/congresso/proposicoes?autor=' || replace(a.nome, ' ', '+'), 3
       from congresso.proposicao_autoria a
      where a.nome ilike ${like}
      limit 5)
    union all
    (select 'bancada', b.nome, b.tipo,
            '/congresso/bancadas/' || b.id, 5
       from congresso.bancadas b
      where b.nome ilike ${like}
      limit 3)
    union all
    (select 'agenda',
            coalesce(e.tipo, 'evento') || ' · ' || to_char(e.inicio, 'DD/MM HH24:MI'),
            left(e.descricao, 90),
            '/congresso/agenda', 6
       from congresso.eventos e
      where e.descricao ilike ${like}
      order by e.inicio desc
      limit 3)
    order by peso
    limit ${limite}
  `);
  return linhas.rows ?? [];
}

// `type`, não `interface` — mesmo motivo de `SugestaoBusca` logo acima:
// `db.execute<T>()` exige `T extends Record<string, unknown>`, e uma
// `interface` não satisfaz essa constraint estruturalmente.
export type ResultadoBuscaLegislativa = {
  id: string;
  identificacao: string | null;
  ementa: string | null;
  data_apresentacao: string | null;
  situacao: string | null;
  temas_oficiais: string[] | null;
  url_fonte: string | null;
  url_inteiro_teor: string | null;
};

/**
 * Busca por palavra-chave para a `/busca` unificada (Cidades/Congresso/
 * Judiciário) — irmã de `buscaLegislacaoMunicipal` (`queries/betim.ts`),
 * não a mesma função: aqui não existe "território" (o Congresso é federal)
 * e `temas_oficiais` é a classificação da PRÓPRIA Câmara dos Deputados
 * (~70 temas oficiais), vocabulário diferente dos 13 slugs de
 * `etl/temas.py` que `atos_oficiais`/`proposicoes` municipais usam — por
 * isso esta função não recebe `tema`: um filtro por slug municipal aqui
 * bateria em silêncio contra o vocabulário errado e devolveria vazio sempre,
 * o tipo de bug que não aparece em teste nenhum.
 *
 * Sem `q`, devolve vazio: diferente da página de Proposições
 * (`/congresso/proposicoes`), que existe para NAVEGAR o acervo inteiro, esta
 * função existe só para RESPONDER uma palavra-chave — sem uma, não há
 * pergunta para responder.
 */
export async function buscaLegislacaoCongresso(
  opts: { q?: string; limite?: number } = {}
): Promise<ResultadoBuscaLegislativa[]> {
  const db = getDb();
  if (!db) return [];
  const q = opts.q?.trim() || null;
  if (!q) return [];
  const limite = opts.limite ?? 20;

  // Mesma ressalva de `buscaLegislacaoMunicipal`: `unaccent_immutable` aqui
  // precisa bater com a expressão do índice (migration 0009 do Congresso),
  // senão a consulta ainda acerta o resultado, só sem usar o índice.
  const linhas = await db.execute<ResultadoBuscaLegislativa>(sql`
    select p.id::text as id, p.identificacao as identificacao, p.ementa as ementa,
           p.data_apresentacao as data_apresentacao, p.situacao as situacao,
           p.temas_oficiais as temas_oficiais, p.url_fonte as url_fonte,
           p.url_inteiro_teor as url_inteiro_teor
      from congresso.proposicoes p
     where to_tsvector(
             'portuguese',
             public.unaccent_immutable(coalesce(p.ementa, '') || ' ' || coalesce(p.keywords, ''))
           ) @@ websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
     order by ts_rank(
                to_tsvector(
                  'portuguese',
                  public.unaccent_immutable(coalesce(p.ementa, '') || ' ' || coalesce(p.keywords, ''))
                ),
                websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
              ) desc,
              p.data_apresentacao desc nulls last
     limit ${limite}
  `);
  return linhas.rows ?? [];
}

/* ─────────────────────── Agenda legislativa ─────────────────────── */

/**
 * Códigos de tipo de evento (de `referencias/tiposEvento` da Câmara).
 *
 * Guardados por CÓDIGO e não por texto: o rótulo da fonte muda de grafia
 * entre anos e um filtro por `like '%udiência%'` quebraria em silêncio.
 */
export const COD_AUDIENCIA = [120, 125, 122];
export const COD_DELIBERATIVO = [110, 112];

/**
 * `type` e não `interface` de propósito: `db.execute<T>` exige
 * `T extends Record<string, unknown>`, e o TypeScript só infere index
 * signature implícita para alias de tipo objeto — uma `interface` é
 * rejeitada ali com uma mensagem que não diz isso.
 */
export type EventoAgenda = {
  id: string;
  id_externo: string;
  cod_tipo: number | null;
  tipo: string | null;
  descricao: string | null;
  situacao: string | null;
  /**
   * Data e hora JÁ FORMATADAS no banco, como texto.
   *
   * Isto não é preguiça — é a correção de um bug de 3 horas. `eventos.inicio`
   * é `timestamp` SEM fuso de propósito (migration 0007): a Câmara convoca
   * "às 15h em Brasília" e é isso que está gravado. Se a coluna viajasse
   * como Date até o React, o driver a interpretaria no fuso do servidor e a
   * audiência apareceria em outra hora. Formatar em SQL tira o `Date` do
   * caminho por completo — a mesma lição que o /judiciario aprendeu no
   * ofício com data errada.
   */
  data_br: string | null;
  hora_br: string | null;
  /** ISO local (sem Z), para o atributo `dateTime` do <time>. */
  inicio_iso: string | null;
  /** Ordenação e comparação com hoje ficam no banco, pelo mesmo motivo. */
  futuro: boolean;
  local_nome: string | null;
  local_externo: string | null;
  url_registro: string | null;
  url_fonte: string | null;
  orgaos: string[] | null;
  itens_pauta: number;
};

const SELECT_EVENTO = sql`
  select e.id, e.id_externo, e.cod_tipo, e.tipo, e.descricao, e.situacao,
         to_char(e.inicio, 'DD/MM/YYYY')        as data_br,
         to_char(e.inicio, 'HH24:MI')           as hora_br,
         to_char(e.inicio, 'YYYY-MM-DD"T"HH24:MI') as inicio_iso,
         (e.inicio >= (now() at time zone 'America/Sao_Paulo')) as futuro,
         e.local_nome, e.local_externo, e.url_registro, e.url_fonte, e.orgaos,
         (select count(*)::int from congresso.evento_pauta p where p.evento_id = e.id)
           as itens_pauta
    from congresso.eventos e`;

export interface FiltrosAgenda {
  /** Só audiências públicas e tomadas de depoimento. */
  soAudiencias?: boolean;
  /** Sigla do órgão promotor. */
  orgao?: string;
  limite?: number;
}

/**
 * Eventos futuros (agenda) e passados (histórico), em UMA ida ao banco.
 *
 * Duas queries separadas custariam dois subrequests do Worker (teto de 50) e
 * duas consultas ao Neon. O `union all` com uma coluna de partição resolve
 * com uma, e a UI separa em memória.
 */
export async function agenda(filtros: FiltrosAgenda = {}) {
  const db = getDb();
  if (!db) return { proximos: [] as EventoAgenda[], recentes: [] as EventoAgenda[] };
  const limite = filtros.limite ?? 40;

  const cond = [sql`true`];
  if (filtros.soAudiencias) {
    cond.push(
      sql`e.cod_tipo in (${sql.join(
        COD_AUDIENCIA.map((c) => sql`${c}`),
        sql`, `
      )})`
    );
  }
  if (filtros.orgao) cond.push(sql`e.orgaos @> array[${filtros.orgao}]::text[]`);
  const where = sql.join(cond, sql` and `);

  const linhas = await db.execute<EventoAgenda>(sql`
    (${SELECT_EVENTO}
      where ${where} and e.inicio >= (now() at time zone 'America/Sao_Paulo')
      order by e.inicio asc limit ${limite})
    union all
    (${SELECT_EVENTO}
      where ${where} and e.inicio < (now() at time zone 'America/Sao_Paulo')
      order by e.inicio desc limit ${limite})
  `);
  const todos = linhas.rows ?? [];
  return {
    // O `union all` não garante a ordem das partes; reordenar aqui é
    // barato e torna o resultado independente do plano do Postgres.
    proximos: todos.filter((e) => e.futuro).sort((a, b) => (a.inicio_iso ?? "").localeCompare(b.inicio_iso ?? "")),
    recentes: todos.filter((e) => !e.futuro).sort((a, b) => (b.inicio_iso ?? "").localeCompare(a.inicio_iso ?? "")),
  };
}

/** `type`, não `interface` — mesmo motivo de `EventoAgenda`. */
export type ItemPauta = {
  evento_id: string;
  ordem: number;
  titulo: string;
  topico: string | null;
  regime: string | null;
  relator_nome: string | null;
  relator_partido: string | null;
  relator_uf: string | null;
  proposicao_id: string | null;
  rotulo: string | null;
  score: number | null;
  ementa: string | null;
};

/**
 * Pauta de um LOTE de eventos, já com o rótulo da análise quando a
 * proposição existe neste banco.
 *
 * É o cruzamento que dá sentido à agenda: "a CCJC vota na terça um projeto
 * que este portal classificou como fortemente reducionista". Sem o join com
 * `analises`, a agenda seria só um calendário.
 */
export async function pautaDosEventos(eventoIds: string[]): Promise<ItemPauta[]> {
  const db = getDb();
  if (!db || eventoIds.length === 0) return [];
  const lista = sql.join(
    eventoIds.map((i) => sql`${i}`),
    sql`, `
  );
  const linhas = await db.execute<ItemPauta>(sql`
    select p.evento_id, p.ordem, p.titulo, p.topico, p.regime,
           p.relator_nome, p.relator_partido, p.relator_uf,
           p.proposicao_id, a.rotulo, (a.score)::double precision as score,
           pr.ementa
      from congresso.evento_pauta p
      left join congresso.proposicoes pr on pr.id = p.proposicao_id
      left join congresso.analises a
             on a.proposicao_id = p.proposicao_id and a.status = 'ok'
     where p.evento_id in (${lista})
     order by p.evento_id, p.ordem
  `);
  return linhas.rows ?? [];
}

/** Siglas de órgão que aparecem na agenda, para popular o filtro. */
export async function orgaosDaAgenda(): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{ sigla: string }>(sql`
    select distinct unnest(orgaos) as sigla from congresso.eventos
     where orgaos is not null order by 1
  `);
  return (linhas.rows ?? []).map((l) => l.sigla).filter(Boolean);
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

/**
 * Um parlamentar, pelo `id` interno (uuid) — a página de perfil parte daqui.
 */
export async function obterParlamentarPorId(id: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(parlamentaresInCongresso)
    .where(eq(parlamentaresInCongresso.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Todo parlamentar ativo — só para `generateStaticParams` da página de
 * perfil. ~512 da Câmara hoje, mesma ordem de grandeza das 354 bancadas que
 * já pré-renderam por inteiro (ver o comentário no topo do arquivo).
 */
export async function listarParlamentaresAtivos() {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ id: parlamentaresInCongresso.id })
    .from(parlamentaresInCongresso)
    .where(eq(parlamentaresInCongresso.ativo, true));
}

/**
 * A folha de ponto CRUA de um parlamentar — uma linha por dia.
 *
 * Devolve só o que `calcularPresencaDias` (`lib/atuacao-parlamentar.ts`)
 * precisa para classificar. A classificação em si (o que é falta, o que é
 * justificada) fica naquele arquivo, lido pelos dois eixos — não aqui.
 */
export async function presencaDiasDoParlamentar(parlamentarId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      situacao_dia: presencas_plenarioInCongresso.situacao_dia,
      sessoes_total: presencas_plenarioInCongresso.sessoes_total,
      sessoes_presente: presencas_plenarioInCongresso.sessoes_presente,
    })
    .from(presencas_plenarioInCongresso)
    .where(eq(presencas_plenarioInCongresso.parlamentar_id, parlamentarId));
}

/**
 * O voto de UM parlamentar, cruzado com o rótulo da matéria — a
 * matéria-prima da COERÊNCIA com direitos fundamentais.
 *
 * Mesma forma de `votosPorRotuloDeDireito` (eixo Cidades, `queries/betim.ts`):
 * células agregadas `(rotulo, voto, qtd)`, para `calcularCoerencia` aplicar a
 * régua — que é a mesma função nos dois eixos.
 *
 * Só entra votação que `etl.camaras.ligar_votacoes --congresso` já ligou a
 * uma proposição COM análise `status='ok'`. Medido em 2026-08-06: 182 das
 * 2.754 votações do Congresso têm esse elo — a maioria são pareceres e
 * requerimentos de proposições fora da janela que o ETL de análise cobriu, não
 * falha de casamento. A tela precisa dizer o tamanho da amostra, não escondê-lo.
 */
export async function votosPorRotuloDoParlamentar(parlamentarId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      rotulo: analisesInCongresso.rotulo,
      voto: votosInCongresso.voto,
      qtd: sql<number>`count(*)::int`,
    })
    .from(votosInCongresso)
    .innerJoin(
      votacoesInCongresso,
      eq(votacoesInCongresso.id, votosInCongresso.votacao_id)
    )
    .innerJoin(
      proposicoesInCongresso,
      eq(proposicoesInCongresso.id, votacoesInCongresso.proposicao_id)
    )
    .innerJoin(
      analisesInCongresso,
      and(
        eq(analisesInCongresso.proposicao_id, proposicoesInCongresso.id),
        eq(analisesInCongresso.status, "ok")
      )
    )
    .where(eq(votosInCongresso.parlamentar_id, parlamentarId))
    .groupBy(analisesInCongresso.rotulo, votosInCongresso.voto);
}
