import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import { ptBr } from "@/lib/db/ordem";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import {
  analise_itens,
  analises,
  anuncios,
  atos_oficiais,
  beneficios_sociais,
  caixa_disponivel,
  classificados,
  clima_cache,
  coleta_lixo,
  comercios_essenciais,
  comissao_membros,
  comissoes,
  contatos_uteis,
  contratos,
  convenios_federais,
  despesas,
  escolas,
  farmacias_plantao,
  fornecedores,
  grupos_economicos,
  indicadores,
  licitacoes,
  noticias,
  nota_transparencia,
  obras,
  paraopeba_iniciativas,
  paraopeba_saldo_municipio,
  postos_anp,
  producao_agropecuaria,
  proposicoes,
  receitas,
  royalties_cfem,
  royalties_cfem_empresas,
  saude_estabelecimentos,
  saude_internacoes,
  mortalidade,
  arboviroses,
  diarias,
  doacoes_campanha,
  bens_candidato,
  seguranca_ocorrencias,
  servidores,
  subsidios,
  verbas_indenizatorias,
  vereadores,
  votacoes_camara,
  votos_camara,
  zap_estabelecimentos,
} from "@/lib/db/schema";

/**
 * Queries do eixo Cidades.
 *
 * REGRA QUE NÃO TEM EXCEÇÃO: `idMunicipio` é o PRIMEIRO parâmetro de toda
 * função daqui, e é obrigatório. Não existe sobrecarga sem ele e não
 * existe valor padrão.
 *
 * Antes, a cidade era a constante de build `ID_MUNICIPIO_DEFAULT`,
 * repetida em 124 lugares como `.eq("id_municipio", ID_MUNICIPIO_DEFAULT)`
 * inline. Isso funcionava porque só havia uma cidade. Com duas, um único
 * call-site que esquecesse o filtro mostraria dado de Betim numa página de
 * BH — sem erro, sem log, só o número errado na tela. Por isso a constante
 * foi DELETADA em vez de mantida como default: o esquecimento tinha de
 * virar erro de compilação, e é o que acontece agora.
 *
 * O `comColunaOpcional()` também sumiu. Ele existia porque o DDL era
 * aplicado à mão e o código ia à frente do schema, então uma coluna nova
 * podia não existir ainda em produção. Como o schema do Drizzle vem da
 * INTROSPECÇÃO do banco real, toda coluna referenciada existe por
 * construção, e defasagem futura vira erro de compilação em vez de
 * fallback em runtime.
 */

export async function caixaDisponivel(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({ ano: caixa_disponivel.ano, valor: num(caixa_disponivel.valor) })
    .from(caixa_disponivel)
    .where(eq(caixa_disponivel.id_municipio, idMunicipio))
    .orderBy(desc(caixa_disponivel.ano))
    .limit(2);
}

export async function listarIndicadores(idMunicipio: IdMunicipio, nomes?: string[]) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(indicadores.id_municipio, idMunicipio)];
  if (nomes?.length) cond.push(inArray(indicadores.nome, nomes));
  return db
    .select({
      nome: indicadores.nome,
      valor: indicadores.valor,
      valor_numerico: num(indicadores.valor_numerico),
      ano_referencia: indicadores.ano_referencia,
      unidade: indicadores.unidade,
    })
    .from(indicadores)
    .where(and(...cond))
    .orderBy(desc(indicadores.ano_referencia));
}

export async function listarObras(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      nome: obras.nome,
      situacao: obras.situacao,
      valor: num(obras.valor),
      percentual_execucao: num(obras.percentual_execucao),
    })
    .from(obras)
    .where(eq(obras.id_municipio, idMunicipio))
    // `nullsFirst: false` do PostgREST equivale a NULLS LAST no SQL.
    .orderBy(sql`${obras.valor} desc nulls last`);
}

export async function listarPostos(idMunicipio: IdMunicipio, bandeira?: string) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(postos_anp.id_municipio, idMunicipio)];
  if (bandeira) cond.push(eq(postos_anp.bandeira, bandeira));
  return db
    .select({
      cnpj: postos_anp.cnpj,
      razao_social: postos_anp.razao_social,
      endereco: postos_anp.endereco,
      bairro: postos_anp.bairro,
      bandeira: postos_anp.bandeira,
      produtos: postos_anp.produtos,
      nota_anp: postos_anp.nota_anp,
      interditado: postos_anp.interditado,
      lat: num(postos_anp.lat),
      lng: num(postos_anp.lng),
    })
    .from(postos_anp)
    .where(and(...cond))
    .orderBy(ptBr(postos_anp.razao_social));
}

export async function ocorrenciasSeguranca(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: seguranca_ocorrencias.ano,
      mes: seguranca_ocorrencias.mes,
      natureza: seguranca_ocorrencias.natureza,
      qtd: seguranca_ocorrencias.qtd,
    })
    .from(seguranca_ocorrencias)
    .where(eq(seguranca_ocorrencias.id_municipio, idMunicipio));
}

/**
 * Servidores com busca, paginação e o total do conjunto filtrado.
 *
 * O total vem por `count(*) over ()` na mesma query — no Supabase era o
 * header `count: "exact"`. Uma segunda consulta só para contar gastaria um
 * subrequest a mais, e o teto no Workers Free é 50.
 */
/**
 * Recortes de `perfil` — quem manda, e não quem é servidor.
 *
 * `comissionados`: sai de `vinculo`, que a fonte já publica pronto
 * (`EM COMISSAO` + `EM COMISS CUMP JUD` = 5.530 em SP). Cargo em comissão é
 * de livre nomeação e exoneração; é a parte do quadro que muda com o governo.
 *
 * `alto_escalao`: cúpula da administração. A lista é por PADRÃO DE CARGO e
 * traz uma exclusão que não é detalhe — sem ela o filtro mentiria feio:
 *
 *     DIRETOR DE ESCOLA        1.330
 *     COORDENADOR PEDAGOGICO   2.123
 *     SECRETARIO DE ESCOLA         2
 *
 * São 3.455 profissionais de ESCOLA cujos cargos usam as mesmas palavras da
 * cúpula. Incluí-los faria "alto escalão" saltar de ~350 para ~3.800 pessoas
 * e transformaria diretor de escola em secretário municipal aos olhos de quem
 * lê. Diretor de escola é chefia pedagógica, não cúpula de governo.
 */
const PERFIS_SERVIDOR = ["comissionados", "alto_escalao"] as const;
export type PerfilServidor = (typeof PERFIS_SERVIDOR)[number];

export function ehPerfilServidor(v: string | undefined): v is PerfilServidor {
  return !!v && (PERFIS_SERVIDOR as readonly string[]).includes(v);
}

export async function listarServidores(
  idMunicipio: IdMunicipio,
  opts: {
    q?: string;
    orgao?: string;
    perfil?: PerfilServidor;
    pagina?: number;
    porPagina?: number;
  } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = opts.porPagina ?? 50;
  const pagina = Math.max(1, opts.pagina ?? 1);

  const cond = [eq(servidores.id_municipio, idMunicipio)];
  if (opts.orgao) cond.push(eq(servidores.orgao, opts.orgao));

  if (opts.perfil === "comissionados") {
    cond.push(sql`${servidores.vinculo} like 'EM COMISS%'`);
  } else if (opts.perfil === "alto_escalao") {
    cond.push(sql`(
      (
           ${servidores.cargo} like 'SECRETARIO %'
        or ${servidores.cargo} like 'SECRETARIO-%'
        or ${servidores.cargo} like 'SUBPREFEITO%'
        or ${servidores.cargo} like 'CHEFE DE GABINETE%'
        or ${servidores.cargo} like 'DIRETOR I%'
        or ${servidores.cargo} like 'DIRETOR DE PROJETOS%'
        or ${servidores.cargo} like 'DIRETOR DE PROGRAMA%'
        or ${servidores.cargo} like 'PRESIDENTE%'
        or ${servidores.cargo} like 'SUPERINTENDENTE%'
        or ${servidores.cargo} like 'OUVIDOR GERAL%'
        or ${servidores.cargo} like 'CONTROLADOR GERAL%'
        or ${servidores.cargo} like 'PROCURADOR GERAL%'
        or ${servidores.cargo} like 'ASSESSOR ESPECIAL%'
        or ${servidores.cargo} like 'COORDENADOR I%'
      )
      -- A exclusao das funcoes de ESCOLA e o que faz este filtro significar
      -- "cupula" em vez de "quem tem palavra de chefia no titulo".
      and ${servidores.cargo} not like '%ESCOLA%'
      and ${servidores.cargo} not like '%PEDAGOGIC%'
    )`);
  }

  if (opts.q) {
    const termo = `%${opts.q}%`;
    // Busca em nome OU cargo OU lotação, como no `.or()` do PostgREST.
    cond.push(
      sql`(${servidores.nome} ilike ${termo} or ${servidores.cargo} ilike ${termo} or ${servidores.lotacao} ilike ${termo})`
    );
  }

  return db
    .select({
      nome: servidores.nome,
      cargo: servidores.cargo,
      lotacao: servidores.lotacao,
      vinculo: servidores.vinculo,
      orgao: servidores.orgao,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(servidores)
    .where(and(...cond))
    // Desempate por nome + cargo: sem ordem total, a paginação pode
    // repetir ou pular linhas entre páginas.
    .orderBy(ptBr(servidores.nome), ptBr(servidores.cargo))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

export async function beneficiosSociais(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      programa: beneficios_sociais.programa,
      competencia: beneficios_sociais.competencia,
      beneficiarios: beneficios_sociais.beneficiarios,
      valor_total: num(beneficios_sociais.valor_total),
    })
    .from(beneficios_sociais)
    .where(eq(beneficios_sociais.id_municipio, idMunicipio))
    .orderBy(asc(beneficios_sociais.competencia));
}

export async function verbasIndenizatorias(idMunicipio: IdMunicipio, vereadorId?: string) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(verbas_indenizatorias.id_municipio, idMunicipio)];
  if (vereadorId) cond.push(eq(verbas_indenizatorias.vereador_id, vereadorId));
  return db
    .select({
      grupo_verba: verbas_indenizatorias.grupo_verba,
      fornecedor: verbas_indenizatorias.fornecedor,
      valor: num(verbas_indenizatorias.valor),
    })
    .from(verbas_indenizatorias)
    .where(and(...cond));
}

/**
 * Subsídio mais recente de um vereador — o quanto ele recebe por mês.
 *
 * `subsidios` é uma série por competência, mas o subsídio de vereador é
 * fixado por lei e muda uma vez por legislatura, então o que interessa na
 * tela é a última linha, não o histórico.
 */
export async function subsidioAtual(idMunicipio: IdMunicipio, vereadorId: string) {
  const db = getDb();
  if (!db) return null;
  const linhas = await db
    .select({
      competencia: subsidios.competencia,
      valor_bruto: num(subsidios.valor_bruto),
      verbas_extras: num(subsidios.verbas_extras),
      fonte: subsidios.fonte,
    })
    .from(subsidios)
    .where(and(eq(subsidios.id_municipio, idMunicipio), eq(subsidios.vereador_id, vereadorId)))
    .orderBy(desc(subsidios.competencia))
    .limit(1);
  return linhas[0] ?? null;
}

/**
 * Custeio/verba do gabinete somado POR ANO.
 *
 * A agregação é no banco, não em JS: `getVerbasAnalytics` puxa todas as
 * linhas e reduz no cliente, o que é aceitável para os 43 registros de
 * Betim e deixa de ser quando a mesma tela roda para Belo Horizonte (834
 * hoje, crescendo todo mês) ou São Paulo (9.117). Aqui só descem quatro
 * linhas, uma por ano.
 *
 * `date_trunc` em vez de `extract` porque a coluna é `date` e o ano tem de
 * sair como número para ordenar — a conversão explícita evita depender do
 * tipo que o driver escolhe.
 */
export async function verbasPorAno(idMunicipio: IdMunicipio, vereadorId: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: sql<number>`extract(year from ${verbas_indenizatorias.data})::int`,
      total: sql<number>`coalesce(sum(${verbas_indenizatorias.valor}), 0)::float8`,
      qtd: sql<number>`count(*)::int`,
    })
    .from(verbas_indenizatorias)
    .where(
      and(
        eq(verbas_indenizatorias.id_municipio, idMunicipio),
        eq(verbas_indenizatorias.vereador_id, vereadorId),
        isNotNull(verbas_indenizatorias.data)
      )
    )
    .groupBy(sql`extract(year from ${verbas_indenizatorias.data})`)
    .orderBy(sql`extract(year from ${verbas_indenizatorias.data}) desc`);
}

/**
 * Custeio do gabinete por vereador e por ano, para a casa inteira.
 *
 * Uma consulta só, agregada no banco. A alternativa seria chamar
 * `verbasPorAno` 41 vezes (55 em São Paulo) — e a página da Câmara já faz
 * cinco consultas antes desta.
 */
export async function verbasPorVereadorPorAno(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      vereador_id: verbas_indenizatorias.vereador_id,
      nome: vereadores.nome_urna,
      slug: vereadores.slug,
      partido: vereadores.partido,
      ano: sql<number>`extract(year from ${verbas_indenizatorias.data})::int`,
      total: sql<number>`coalesce(sum(${verbas_indenizatorias.valor}), 0)::float8`,
    })
    .from(verbas_indenizatorias)
    .innerJoin(vereadores, eq(vereadores.id, verbas_indenizatorias.vereador_id))
    .where(
      and(
        eq(verbas_indenizatorias.id_municipio, idMunicipio),
        isNotNull(verbas_indenizatorias.data)
      )
    )
    .groupBy(
      verbas_indenizatorias.vereador_id,
      vereadores.nome_urna,
      vereadores.slug,
      vereadores.partido,
      sql`extract(year from ${verbas_indenizatorias.data})`
    );
}

export async function notaTransparencia(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select()
    .from(nota_transparencia)
    .where(eq(nota_transparencia.id_municipio, idMunicipio))
    .orderBy(desc(nota_transparencia.ano));
}

export async function comerciosEssenciais(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      id: comercios_essenciais.id,
      nome: comercios_essenciais.nome,
      tipo: comercios_essenciais.tipo,
      bairro: comercios_essenciais.bairro,
      endereco: comercios_essenciais.endereco,
      telefone: comercios_essenciais.telefone,
      lat: num(comercios_essenciais.lat),
      lng: num(comercios_essenciais.lng),
    })
    .from(comercios_essenciais)
    .where(eq(comercios_essenciais.id_municipio, idMunicipio));
}

/** Escolas com o total do conjunto, na mesma consulta. */
export async function listarEscolas(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      id_inep: escolas.id_inep,
      nome: escolas.nome,
      rede: escolas.rede,
      matriculas: escolas.matriculas,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(escolas)
    .where(eq(escolas.id_municipio, idMunicipio))
    .orderBy(ptBr(escolas.nome));
}

/** Classificados aprovados e ainda no prazo. */
export async function classificadosVigentes(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string } = {}
) {
  const db = getDb();
  if (!db) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const cond = [
    eq(classificados.id_municipio, idMunicipio),
    eq(classificados.aprovado, true),
    gte(classificados.expira_em, hoje),
  ];
  if (opts.categoria) cond.push(eq(classificados.categoria, opts.categoria));
  if (opts.q) cond.push(ilike(classificados.titulo, `%${opts.q}%`));
  return db
    .select({
      id: classificados.id,
      categoria: classificados.categoria,
      titulo: classificados.titulo,
      descricao: classificados.descricao,
      preco: num(classificados.preco),
      contato_whatsapp: classificados.contato_whatsapp,
      expira_em: classificados.expira_em,
    })
    .from(classificados)
    .where(and(...cond))
    // Desempate por id: dois anúncios criados no mesmo instante sairiam em
    // ordem indefinida, e com SSG isso vira HTML diferente a cada build.
    .orderBy(desc(classificados.created_at), asc(classificados.id));
}

/** Negócios do Zap aprovados, com os filtros da página e da rota de API. */
export async function zapEstabelecimentos(
  idMunicipio: IdMunicipio,
  opts: { categoria?: string; q?: string; bairros?: string[] } = {}
) {
  const db = getDb();
  if (!db) return null;
  const cond = [
    eq(zap_estabelecimentos.id_municipio, idMunicipio),
    eq(zap_estabelecimentos.aprovado, true),
  ];
  if (opts.categoria) cond.push(eq(zap_estabelecimentos.categoria, opts.categoria));
  if (opts.q) cond.push(ilike(zap_estabelecimentos.nome, `%${opts.q}%`));
  if (opts.bairros?.length) cond.push(inArray(zap_estabelecimentos.bairro, opts.bairros));
  return db
    .select({
      id: zap_estabelecimentos.id,
      nome: zap_estabelecimentos.nome,
      whatsapp: zap_estabelecimentos.whatsapp,
      categoria: zap_estabelecimentos.categoria,
      descricao: zap_estabelecimentos.descricao,
      bairro: zap_estabelecimentos.bairro,
      cliques: zap_estabelecimentos.cliques,
    })
    .from(zap_estabelecimentos)
    .where(and(...cond))
    .orderBy(ptBr(zap_estabelecimentos.nome), asc(zap_estabelecimentos.id));
}

/**
 * Anúncios pagos no ar hoje, premium primeiro.
 *
 * `data_fim` nula significa "sem prazo, enquanto o site existir" — é
 * divulgação única, não mensalidade (ver `ANUNCIO_PRECOS`). Por isso o
 * `or(isNull, gte)`: um `>=` puro descartaria justamente os sem prazo.
 *
 * A ordenação premium-primeiro era um `sort` JS estável sobre uma consulta
 * SEM `order by` — ou seja, a ordem dentro de cada plano era indefinida.
 * Agora é SQL, com desempate por id.
 */
export async function anunciosAtivos(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  return db
    .select({
      id: anuncios.id,
      nome_comercio: anuncios.nome_comercio,
      plano: anuncios.plano,
      banner_url: anuncios.banner_url,
      link: anuncios.link,
    })
    .from(anuncios)
    .where(
      and(
        eq(anuncios.id_municipio, idMunicipio),
        eq(anuncios.ativo, true),
        lte(anuncios.data_inicio, hoje),
        or(isNull(anuncios.data_fim), gte(anuncios.data_fim, hoje))
      )
    )
    // `case` em vez de `(plano = 'premium') desc`: o segundo é NULL para
    // plano nulo, e DESC no Postgres é NULLS FIRST — os sem plano viriam
    // na frente dos premium.
    .orderBy(sql`case when ${anuncios.plano} = 'premium' then 0 else 1 end`, asc(anuncios.id));
}

/** Convênios e repasses federais, maior valor primeiro. */
export async function conveniosFederais(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      id: convenios_federais.id,
      codigo: convenios_federais.codigo,
      numero_convenio: convenios_federais.numero_convenio,
      objeto: convenios_federais.objeto,
      orgao_nome: convenios_federais.orgao_nome,
      orgao_sigla: convenios_federais.orgao_sigla,
      convenente_nome: convenios_federais.convenente_nome,
      situacao: convenios_federais.situacao,
      tipo_instrumento: convenios_federais.tipo_instrumento,
      valor: num(convenios_federais.valor),
      valor_liberado: num(convenios_federais.valor_liberado),
      valor_contrapartida: num(convenios_federais.valor_contrapartida),
      data_inicio_vigencia: convenios_federais.data_inicio_vigencia,
      data_final_vigencia: convenios_federais.data_final_vigencia,
      data_publicacao: convenios_federais.data_publicacao,
    })
    .from(convenios_federais)
    .where(eq(convenios_federais.id_municipio, idMunicipio))
    .orderBy(desc(convenios_federais.valor), asc(convenios_federais.id));
}

/**
 * Legislação municipal (leis, decretos, resoluções, instruções normativas).
 *
 * `temas` vem da classificação por palavra-chave da ementa (`etl/temas.py`,
 * a mesma regra das proposições e dos contratos). A coluna é da migration
 * 0025, que nunca tinha rodado: enquanto isso o `comColunaOpcional()` caía
 * sempre no ramo sem ela, e o ranking por área e o filtro `?tema=` desta
 * página nasciam vazios em produção, sem erro nenhum. A 0025 foi aplicada
 * e as 660 ementas classificadas — 76 pegam tema, o resto são decretos de
 * crédito sem assunto identificável (esperado, ver a docstring do ETL).
 */
export async function atosOficiais(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      // `id` entrou para casar o ato com a análise garantista (0033). Sem
      // ele a página de legislação não tem como saber se a norma que está
      // renderizando foi analisada — e "não analisada" precisa aparecer
      // como ausência de análise, não como neutro.
      id: atos_oficiais.id,
      tipo: atos_oficiais.tipo,
      numero: atos_oficiais.numero,
      ano: atos_oficiais.ano,
      ementa: atos_oficiais.ementa,
      data_publicacao: atos_oficiais.data_publicacao,
      temas: atos_oficiais.temas,
    })
    .from(atos_oficiais)
    .where(eq(atos_oficiais.id_municipio, idMunicipio))
    .orderBy(
      sql`${atos_oficiais.data_publicacao} desc nulls last`,
      asc(atos_oficiais.id)
    );
}

// `type`, não `interface`: `db.execute<T>()` exige `T extends
// Record<string, unknown>`, e só um alias de objeto satisfaz essa
// constraint estruturalmente — uma `interface` não (mesmo padrão de
// `SugestaoBusca` em `queries/congresso.ts`/`queries/judiciario.ts`).
export type ResultadoLegislacaoMunicipal = {
  origem: "ato" | "proposicao";
  id: string;
  id_municipio: IdMunicipio;
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data: string | null;
  temas: string[] | null;
  link_fonte: string | null;
};

/**
 * Busca legislativa combinada — tema + palavra-chave + território — sobre
 * `atos_oficiais` (leis/decretos/resoluções) e `proposicoes`
 * (requerimentos/projetos de lei da Câmara municipal): as duas tabelas que
 * carregam a MESMA classificação por tema (`etl/temas.py`, ver migration
 * 0025 e a docstring de `temas.py` no ETL).
 *
 * `idMunicipio` AUSENTE busca em TODAS as cidades provisionadas — é a
 * exceção deliberada à convenção de `idMunicipio` obrigatório e posicional
 * (ver a docstring de `IdMunicipio` em `queries/municipios.ts`): esta
 * função existe para alimentar uma busca ENTRE cidades (`/busca`, território
 * "todas"), então precisa conseguir expressar "todas" sem deixar de exigir
 * um `IdMunicipio` de verdade quando uma cidade É informada — não uma
 * string qualquer, que foi exatamente o bug que a marca nominal evita.
 *
 * Sem `q`, sem `tema` E sem `idMunicipio`, devolve vazio em vez de "as 660
 * normas + N mil proposições mais recentes de toda cidade provisionada":
 * filtro nenhum aqui não é navegação, é ausência de pergunta — a página
 * mostra estado vazio, não uma lista sem critério.
 *
 * O ranking por relevância (`ts_rank`) só entra quando há `q`; sem palavra-
 * chave, a ordem é por data — não há "relevância" para ordenar.
 */
export async function buscaLegislacaoMunicipal(
  opts: {
    q?: string;
    tema?: string;
    idMunicipio?: IdMunicipio;
    limite?: number;
  } = {}
): Promise<ResultadoLegislacaoMunicipal[]> {
  const db = getDb();
  if (!db) return [];

  const q = opts.q?.trim() || null;
  const tema = opts.tema?.trim() || null;
  const idMunicipio = opts.idMunicipio ?? null;
  if (!q && !tema && !idMunicipio) return [];

  const limite = opts.limite ?? 20;

  // `unaccent_immutable` tem que embrulhar o MESMO jeito aqui e no índice
  // (migration 0046) — expressão diferente da do índice não usa o índice,
  // só fica mais lento (a busca continua certa; sem unaccent é que não
  // acharia "saúde" ao digitar "saude").
  const linhas = await db.execute<ResultadoLegislacaoMunicipal>(sql`
    (
      select 'ato'::text as origem, a.id::text as id, a.id_municipio as id_municipio,
             a.tipo as tipo, a.numero as numero, a.ano as ano, a.ementa as ementa,
             a.data_publicacao as data, a.temas as temas, a.link_fonte as link_fonte,
             case when ${q}::text is null then 0::real else ts_rank(
               to_tsvector('portuguese', public.unaccent_immutable(coalesce(a.ementa, ''))),
               websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
             ) end as relevancia
        from atos_oficiais a
       where (${idMunicipio}::text is null or a.id_municipio = ${idMunicipio})
         and (${tema}::text is null or a.temas @> array[${tema}]::text[])
         and (
           ${q}::text is null or
           to_tsvector('portuguese', public.unaccent_immutable(coalesce(a.ementa, '')))
             @@ websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
         )
       order by relevancia desc, a.data_publicacao desc nulls last
       limit ${limite}
    )
    union all
    (
      select 'proposicao'::text, p.id::text, p.id_municipio,
             p.tipo, p.numero::text, p.ano, p.ementa,
             p.data_apresentacao, p.temas, p.link_fonte,
             case when ${q}::text is null then 0::real else ts_rank(
               to_tsvector('portuguese', public.unaccent_immutable(coalesce(p.ementa, ''))),
               websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
             ) end as relevancia
        from proposicoes p
       where (${idMunicipio}::text is null or p.id_municipio = ${idMunicipio})
         and (${tema}::text is null or p.temas @> array[${tema}]::text[])
         and (
           ${q}::text is null or
           to_tsvector('portuguese', public.unaccent_immutable(coalesce(p.ementa, '')))
             @@ websearch_to_tsquery('portuguese', public.unaccent_immutable(${q}))
         )
       order by relevancia desc, p.data_apresentacao desc nulls last
       limit ${limite}
    )
    order by relevancia desc, data desc nulls last
    limit ${limite}
  `);
  return linhas.rows ?? [];
}

/** Anos com "Despesas Pagas" lançadas, mais recente primeiro. */
export async function anosDeDespesas(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .selectDistinct({ ano: despesas.ano })
    .from(despesas)
    .where(
      and(
        eq(despesas.id_municipio, idMunicipio),
        eq(despesas.estagio, "Despesas Pagas"),
        isNotNull(despesas.ano)
      )
    )
    .orderBy(desc(despesas.ano));
}

/**
 * Despesas pagas somadas por função de governo.
 *
 * A soma e o filtro de funções desceram para o SQL. `despesas` mistura
 * FUNÇÕES e SUBFUNÇÕES na mesma coluna `conta`, então somar tudo contaria
 * a mesma despesa duas vezes — quem decide o que é função é a lista
 * `FUNCOES_COFOG` de `lib/betim/despesas.ts`, passada aqui.
 */
export async function despesasPorFuncao(
  idMunicipio: IdMunicipio,
  ano: number,
  funcoes: string[]
) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      funcao: despesas.conta,
      valor: sql<number>`sum(${despesas.valor})::double precision`,
    })
    .from(despesas)
    .where(
      and(
        eq(despesas.id_municipio, idMunicipio),
        eq(despesas.ano, ano),
        eq(despesas.estagio, "Despesas Pagas"),
        inArray(despesas.conta, funcoes)
      )
    )
    .groupBy(despesas.conta)
    // Desempate por nome: sem ele duas funções de mesmo valor sairiam em
    // ordem indefinida, e com SSG o gráfico mudaria a cada build.
    .orderBy(sql`sum(${despesas.valor}) desc`, ptBr(despesas.conta));
}

export async function contatosUteis(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      nome: contatos_uteis.nome,
      telefone: contatos_uteis.telefone,
      categoria: contatos_uteis.categoria,
      ordem: contatos_uteis.ordem,
    })
    .from(contatos_uteis)
    .where(eq(contatos_uteis.id_municipio, idMunicipio))
    .orderBy(asc(contatos_uteis.ordem), asc(contatos_uteis.id));
}

export async function coletaLixo(idMunicipio: IdMunicipio, bairro?: string) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(coleta_lixo.id_municipio, idMunicipio)];
  if (bairro) cond.push(ilike(coleta_lixo.bairro, `%${bairro}%`));
  return db
    .select({
      bairro: coleta_lixo.bairro,
      tipo: coleta_lixo.tipo,
      dias_semana: coleta_lixo.dias_semana,
      horario: coleta_lixo.horario,
    })
    .from(coleta_lixo)
    .where(and(...cond))
    .orderBy(ptBr(coleta_lixo.bairro), asc(coleta_lixo.id));
}

/** Farmácias de plantão hoje: as 24h sempre, mais as que estão na escala. */
export async function farmaciasPlantao(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  return db
    .select({
      id: farmacias_plantao.id,
      nome: farmacias_plantao.nome,
      endereco: farmacias_plantao.endereco,
      telefone: farmacias_plantao.telefone,
      plantao_inicio: farmacias_plantao.plantao_inicio,
      plantao_fim: farmacias_plantao.plantao_fim,
      h24: farmacias_plantao.h24,
      lat: num(farmacias_plantao.lat),
      lng: num(farmacias_plantao.lng),
    })
    .from(farmacias_plantao)
    .where(
      and(
        eq(farmacias_plantao.id_municipio, idMunicipio),
        or(
          eq(farmacias_plantao.h24, true),
          and(
            lte(farmacias_plantao.plantao_inicio, hoje),
            gte(farmacias_plantao.plantao_fim, hoje)
          )
        )
      )
    )
    .orderBy(ptBr(farmacias_plantao.nome), asc(farmacias_plantao.id));
}

/**
 * Proposições da Câmara, paginadas, com o total do conjunto filtrado na
 * mesma consulta (era o header `count: "exact"` do PostgREST).
 *
 * `temas` é selecionada direto: a coluna existe — tem até índice GIN na
 * introspecção —, então o `comColunaOpcional()` que a protegia nunca
 * chegou a rodar o fallback. Note o contraste com `atos_oficiais.temas`,
 * que NÃO existe.
 */
export async function proposicoesPaginadas(
  idMunicipio: IdMunicipio,
  filtros: {
    tipo?: string;
    situacao?: string;
    ano?: number;
    tema?: string;
    q?: string;
    valorMin?: number;
    valorMax?: number;
    pagina?: number;
    porPagina?: number;
  } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = filtros.porPagina ?? 30;
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const cond = [eq(proposicoes.id_municipio, idMunicipio)];
  if (filtros.tipo) cond.push(eq(proposicoes.tipo, filtros.tipo));
  if (filtros.situacao) cond.push(eq(proposicoes.situacao, filtros.situacao));
  if (filtros.ano) cond.push(eq(proposicoes.ano, filtros.ano));
  if (filtros.tema) cond.push(arrayContains(proposicoes.temas, [filtros.tema]));
  if (filtros.q) cond.push(ilike(proposicoes.ementa, `%${filtros.q}%`));

  return db
    .select({
      id: proposicoes.id,
      tipo: proposicoes.tipo,
      numero: proposicoes.numero,
      ano: proposicoes.ano,
      ementa: proposicoes.ementa,
      situacao: proposicoes.situacao,
      data_apresentacao: proposicoes.data_apresentacao,
      autores: proposicoes.autores,
      link_fonte: proposicoes.link_fonte,
      temas: proposicoes.temas,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(proposicoes)
    .where(and(...cond))
    // Desempate por id: sem ordem total, a paginação repete ou pula linhas.
    .orderBy(desc(proposicoes.ano), desc(proposicoes.numero), asc(proposicoes.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

/**
 * Valores distintos de `situacao` — popula o filtro sem hardcodar a
 * nomenclatura da Câmara.
 *
 * Some junto o `.range(0, 4999)` do original, que era um teto arbitrário
 * contra o truncamento do PostgREST: com `distinct` no banco não há página
 * para truncar. A ordenação continua no JS de propósito — ver
 * `getSituacoesDisponiveis`.
 */
export async function situacoesDeProposicoes(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .selectDistinct({ situacao: proposicoes.situacao })
    .from(proposicoes)
    .where(
      and(eq(proposicoes.id_municipio, idMunicipio), isNotNull(proposicoes.situacao))
    );
}

/**
 * Contagem de temas das proposições — da Câmara inteira, ou de um vereador
 * quando `vereadorId` vem.
 *
 * Antes o app trazia TODAS as linhas (2.7k proposições, em páginas de
 * 1000) só para montar um Map em memória. `unnest` + `group by` faz o
 * mesmo em uma consulta e devolve dezenas de linhas.
 *
 * Uma linha com o mesmo tema repetido no array conta duas vezes, igual ao
 * laço JS que isto substitui; array nulo não gera linha, igual ao `?? []`.
 * O desempate por nome é novo: o Map do JS empatava na ordem de aparição
 * das linhas, que é indefinida sem `order by`.
 */
export async function temasDeProposicoes(idMunicipio: IdMunicipio, vereadorId?: string) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(proposicoes.id_municipio, idMunicipio)];
  if (vereadorId) cond.push(eq(proposicoes.vereador_id, vereadorId));
  return db
    .select({
      tema: sql<string>`unnest(${proposicoes.temas})`,
      qtd: sql<number>`count(*)::int`,
    })
    .from(proposicoes)
    .where(and(...cond))
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`, sql`1 asc`);
}

/** Áreas de atuação da Prefeitura — os temas dos contratos. */
export async function temasDeContratos(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      tema: sql<string>`unnest(${contratos.temas})`,
      qtd: sql<number>`count(*)::int`,
    })
    .from(contratos)
    .where(eq(contratos.id_municipio, idMunicipio))
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`, sql`1 asc`);
}

/** Grupos econômicos entre fornecedores, maior valor contratado primeiro. */
export async function gruposEconomicos(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      id: grupos_economicos.id,
      nome_grupo: grupos_economicos.nome_grupo,
      cnpjs: grupos_economicos.cnpjs,
      socios_comuns: grupos_economicos.socios_comuns,
      valor_total_contratos: num(grupos_economicos.valor_total_contratos),
      qtd_contratos: grupos_economicos.qtd_contratos,
      detectado_em: grupos_economicos.detectado_em,
    })
    .from(grupos_economicos)
    .where(eq(grupos_economicos.id_municipio, idMunicipio))
    .orderBy(desc(grupos_economicos.valor_total_contratos), asc(grupos_economicos.id));
}

/**
 * Fornecedores por CNPJ.
 *
 * ÚNICA função deste arquivo SEM `idMunicipio`, e é de propósito: a tabela
 * não tem a coluna — é chaveada por CNPJ e vale para todas as cidades, já
 * que a mesma empresa fornece para mais de uma. O plano registra
 * `fornecedores`/`socios` como globais junto com `feriados_nacionais`.
 * Quem recorta por cidade é a lista de CNPJs que chega aqui.
 */
export async function fornecedoresPorCnpj(cnpjs: string[]) {
  const db = getDb();
  if (!db || cnpjs.length === 0) return null;
  return db
    .select({
      cnpj: fornecedores.cnpj,
      razao_social: fornecedores.razao_social,
      nome_fantasia: fornecedores.nome_fantasia,
      cnae_descricao: fornecedores.cnae_descricao,
      municipio_sede: fornecedores.municipio_sede,
      uf_sede: fornecedores.uf_sede,
    })
    .from(fornecedores)
    .where(inArray(fornecedores.cnpj, cnpjs));
}

/**
 * Soma de `valor_global` de todos os contratos do município.
 *
 * É o denominador da concentração da página de grupos econômicos. No
 * PostgREST isso era um laço paginado de 1000 em 1000 justamente porque o
 * truncamento silencioso devolveria uma soma MENOR — e um percentual de
 * concentração inflado. Um `sum()` no banco não tem esse modo de falha.
 */
export async function somaContratada(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      total: sql<number>`coalesce(sum(${contratos.valor_global}), 0)::double precision`,
    })
    .from(contratos)
    .where(eq(contratos.id_municipio, idMunicipio));
  return linha?.total ?? 0;
}

/**
 * Quantidade e soma dos contratos ativos.
 *
 * Uma consulta no lugar de "trazer todas as linhas e reduzir no JS" —
 * era assim na Home e no contexto do chat, e trazia o `valor_global` de
 * centenas de contratos só para somar. O `count` vem do banco, não do
 * `data.length`, então não depende de quantas linhas vieram.
 */
export async function resumoContratosAtivos(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      qtd: sql<number>`count(*)::int`,
      soma: sql<number>`coalesce(sum(${contratos.valor_global}), 0)::double precision`,
    })
    .from(contratos)
    .where(and(eq(contratos.id_municipio, idMunicipio), eq(contratos.status, "ativo")));
  return linha ?? { qtd: 0, soma: 0 };
}

/** Comissões do catálogo, em ordem de nome. */
export async function listarComissoes(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({ id: comissoes.id, nome: comissoes.nome, especial: comissoes.especial })
    .from(comissoes)
    .where(eq(comissoes.id_municipio, idMunicipio))
    .orderBy(ptBr(comissoes.nome), asc(comissoes.id));
}

/**
 * Membros ativos das comissões, já com o vereador.
 *
 * O `vereadores(slug, nome_urna)` do PostgREST era um embed que ele
 * resolvia pela FK; aqui é um `inner join` explícito. Membro cujo vereador
 * sumiu deixa de vir — o mesmo efeito do `if (!m.vereadores) continue` que
 * o app fazia depois.
 */
export async function membrosDeComissoes(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      comissao_id: comissao_membros.comissao_id,
      papel: comissao_membros.papel,
      slug: vereadores.slug,
      nome_urna: vereadores.nome_urna,
    })
    .from(comissao_membros)
    .innerJoin(vereadores, eq(vereadores.id, comissao_membros.vereador_id))
    .where(
      and(
        eq(comissao_membros.id_municipio, idMunicipio),
        eq(comissao_membros.ativo, true),
        isNotNull(comissao_membros.comissao_id)
      )
    )
    .orderBy(ptBr(vereadores.nome_urna), asc(comissao_membros.id));
}

/**
 * Histórico de participações de UM vereador em comissões.
 *
 * Usa `nome_comissao_bruto` em vez de juntar com `comissoes`: boa parte do
 * histórico tem comissão já renomeada ou extinta, e o nome que a própria
 * Câmara registrou na época é mais correto que o nome de hoje.
 */
export async function participacoesEmComissoes(
  idMunicipio: IdMunicipio,
  vereadorId: string
) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      nome_comissao_bruto: comissao_membros.nome_comissao_bruto,
      papel: comissao_membros.papel,
      ativo: comissao_membros.ativo,
      data_inicio: comissao_membros.data_inicio,
      data_fim: comissao_membros.data_fim,
    })
    .from(comissao_membros)
    .where(
      and(
        eq(comissao_membros.id_municipio, idMunicipio),
        eq(comissao_membros.vereador_id, vereadorId)
      )
    )
    .orderBy(
      sql`${comissao_membros.data_fim} desc nulls last`,
      asc(comissao_membros.id)
    );
}

/** Produção agropecuária (IBGE PAM/PPM). */
export async function producaoAgropecuaria(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      categoria: producao_agropecuaria.categoria,
      produto: producao_agropecuaria.produto,
      ano: producao_agropecuaria.ano,
      quantidade: num(producao_agropecuaria.quantidade),
      unidade: producao_agropecuaria.unidade,
      area_colhida: num(producao_agropecuaria.area_colhida),
      valor_producao_mil_reais: num(producao_agropecuaria.valor_producao_mil_reais),
    })
    .from(producao_agropecuaria)
    .where(eq(producao_agropecuaria.id_municipio, idMunicipio))
    .orderBy(asc(producao_agropecuaria.id));
}

const COLUNAS_NOTICIA = {
  slug: noticias.slug,
  titulo: noticias.titulo,
  resumo: noticias.resumo,
  categoria: noticias.categoria,
  temas: noticias.temas,
  autor: noticias.autor,
  publicado_em: noticias.publicado_em,
  fonte_externa_nome: noticias.fonte_externa_nome,
  fonte_externa_url: noticias.fonte_externa_url,
};

/**
 * Notícias publicadas, mais recente primeiro.
 *
 * `fonte_externa_nome`/`_url` (migration 0023) EXISTEM no banco — conferido
 * na introspecção. O `comColunaOpcional()` que as protegia entrou porque
 * `/noticias` apareceu vazia em 2026-07-24 com 4 posts no banco, antes da
 * migration rodar; hoje ela já rodou e o fallback é código morto.
 */
export async function listarNoticias(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_NOTICIA)
    .from(noticias)
    .where(eq(noticias.id_municipio, idMunicipio))
    .orderBy(desc(noticias.publicado_em), asc(noticias.id));
}

export async function noticiaPorSlug(idMunicipio: IdMunicipio, slug: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ ...COLUNAS_NOTICIA, conteudo_html: noticias.conteudo_html })
    .from(noticias)
    .where(and(eq(noticias.id_municipio, idMunicipio), eq(noticias.slug, slug)))
    .limit(1);
  return linha ?? null;
}

/**
 * Saldo do Acordo de Reparação do Paraopeba para o município.
 *
 * `maybeSingle()` do PostgREST vira `limit(1)`: a tabela tem uma linha por
 * município, e um `limit` não estoura se algum dia tiver duas.
 */
export async function saldoParaopeba(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      referencia: paraopeba_saldo_municipio.referencia,
      valor_acordo_inicial: num(paraopeba_saldo_municipio.valor_acordo_inicial),
      valor_acordo_atual: num(paraopeba_saldo_municipio.valor_acordo_atual),
      empenhos_autorizados: num(paraopeba_saldo_municipio.empenhos_autorizados),
      saldo_teto: num(paraopeba_saldo_municipio.saldo_teto),
    })
    .from(paraopeba_saldo_municipio)
    .where(eq(paraopeba_saldo_municipio.id_municipio, idMunicipio))
    .orderBy(asc(paraopeba_saldo_municipio.id))
    .limit(1);
  return linha ?? null;
}

const COLUNAS_INICIATIVA = {
  id_fdi: paraopeba_iniciativas.id_fdi,
  titulo: paraopeba_iniciativas.titulo,
  municipios_envolvidos: paraopeba_iniciativas.municipios_envolvidos,
  grupo_iniciativas: paraopeba_iniciativas.grupo_iniciativas,
  tipo_obrigacao: paraopeba_iniciativas.tipo_obrigacao,
  area_tematica: paraopeba_iniciativas.area_tematica,
  sub_area_tematica: paraopeba_iniciativas.sub_area_tematica,
  status: paraopeba_iniciativas.status,
  investimento: num(paraopeba_iniciativas.investimento),
  valor_total: num(paraopeba_iniciativas.valor_total),
  percentual_realizado: num(paraopeba_iniciativas.percentual_realizado),
  percentual_planejado: num(paraopeba_iniciativas.percentual_planejado),
  // REGRESSÃO MINHA, corrigida: estas cinco estavam no select do PostgREST
  // e eu as deixei de fora ao escrever esta consulta. `mapIniciativa` as
  // lia e recebia `undefined`, então a página perdeu os contadores de
  // produtos e — pior — os DOIS LINKS, que são o "acesso direto ao termo
  // de compromisso" pelo qual a fonte foi escolhida. Não deu erro porque
  // um `as RowIniciativa[]` cobria o buraco; quem apontou foi o compilador,
  // quando a coluna nova mudou a forma do objeto o bastante para o cast
  // deixar de colar.
  produtos_previstos: paraopeba_iniciativas.produtos_previstos,
  produtos_entregues: paraopeba_iniciativas.produtos_entregues,
  produtos_em_atraso: paraopeba_iniciativas.produtos_em_atraso,
  link_publico: paraopeba_iniciativas.link_publico,
  link_termo_compromisso: paraopeba_iniciativas.link_termo_compromisso,
};

/**
 * Iniciativas do Paraopeba, maior valor primeiro.
 *
 * `percentual_planejado` é da migration 0026, que também nunca tinha
 * rodado — então a leitura "executado < planejado ⇒ atrasado" da página
 * nunca funcionou. Aplicada e preenchida a partir da aba "Avanço Físico"
 * da planilha da FGV: das 19 iniciativas de Betim, 5 estão atrasadas.
 */
export async function iniciativasParaopeba(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_INICIATIVA)
    .from(paraopeba_iniciativas)
    .where(eq(paraopeba_iniciativas.id_municipio, idMunicipio))
    .orderBy(desc(paraopeba_iniciativas.valor_total), asc(paraopeba_iniciativas.id));
}

/** As N iniciativas em execução mais longe de concluir. */
export async function iniciativasParaopebaMenosConcluidas(
  idMunicipio: IdMunicipio,
  limite = 5
) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_INICIATIVA)
    .from(paraopeba_iniciativas)
    .where(
      and(
        eq(paraopeba_iniciativas.id_municipio, idMunicipio),
        eq(paraopeba_iniciativas.status, "Em execução"),
        isNotNull(paraopeba_iniciativas.percentual_realizado)
      )
    )
    .orderBy(asc(paraopeba_iniciativas.percentual_realizado), asc(paraopeba_iniciativas.id))
    .limit(limite);
}

/** Quantos vereadores ativos — número-âncora do contexto do chat. */
export async function contagemVereadoresAtivos(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ qtd: sql<number>`count(*)::int` })
    .from(vereadores)
    .where(and(eq(vereadores.id_municipio, idMunicipio), eq(vereadores.ativo, true)));
  return linha?.qtd ?? 0;
}

/**
 * Contratos que casam com algum termo da pergunta do chat, maiores
 * primeiro. `termos` já vem limpo de stopwords por `lib/betim/chat.ts`.
 */
export async function contratosPorTermos(
  idMunicipio: IdMunicipio,
  termos: string[],
  limite: number
) {
  const db = getDb();
  if (!db || termos.length === 0) return null;
  const alternativas = termos.flatMap((t) => [
    ilike(contratos.objeto, `%${t}%`),
    ilike(contratos.fornecedor_nome, `%${t}%`),
  ]);
  return db
    .select({
      objeto: contratos.objeto,
      fornecedor_nome: contratos.fornecedor_nome,
      valor_global: num(contratos.valor_global),
      ano: contratos.ano,
      status: contratos.status,
    })
    .from(contratos)
    .where(and(eq(contratos.id_municipio, idMunicipio), or(...alternativas)))
    .orderBy(sql`${contratos.valor_global} desc nulls last`, asc(contratos.id))
    .limit(limite);
}

/**
 * Proposições que casam com algum termo da pergunta do chat.
 *
 * Ganhou `order by`: a consulta original tinha só `limit(6)`, o que deixa
 * ao Postgres escolher QUAIS seis — a mesma pergunta podia trazer
 * proposições diferentes a cada vez, e o chat responderia coisas
 * diferentes sem nada ter mudado no banco.
 */
export async function proposicoesPorTermos(
  idMunicipio: IdMunicipio,
  termos: string[],
  limite: number
) {
  const db = getDb();
  if (!db || termos.length === 0) return null;
  return db
    .select({
      tipo: proposicoes.tipo,
      numero: proposicoes.numero,
      ano: proposicoes.ano,
      ementa: proposicoes.ementa,
      situacao: proposicoes.situacao,
    })
    .from(proposicoes)
    .where(
      and(
        eq(proposicoes.id_municipio, idMunicipio),
        or(...termos.map((t) => ilike(proposicoes.ementa, `%${t}%`)))
      )
    )
    .orderBy(desc(proposicoes.ano), desc(proposicoes.numero), asc(proposicoes.id))
    .limit(limite);
}

/** Ano mais recente com despesa lançada, em qualquer estágio. */
export async function anoMaisRecenteDeDespesas(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ ano: despesas.ano })
    .from(despesas)
    .where(and(eq(despesas.id_municipio, idMunicipio), isNotNull(despesas.ano)))
    .orderBy(desc(despesas.ano))
    .limit(1);
  return linha?.ano ?? null;
}

/**
 * Despesas pagas somadas pela coluna `funcao` — o corte da visão geral da
 * Prefeitura, diferente de `despesasPorFuncao()`, que soma pela coluna
 * `conta` e filtra pela lista COFOG.
 *
 * Devolve TUDO agrupado, inclusive os dois blocos de escopo orçamentário
 * ("Despesas Exceto Intra" + "Intra"), que não são função COFOG e juntos
 * são o total geral — quem os separa é `BLOCOS_TOTAL` em
 * `lib/betim/prefeitura.ts`, que precisa dos dois.
 */
export async function despesasAgrupadasPorFuncao(idMunicipio: IdMunicipio, ano: number) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      funcao: sql<string>`coalesce(nullif(${despesas.funcao}, ''), 'Outros')`,
      valor: sql<number>`sum(${despesas.valor})::double precision`,
    })
    .from(despesas)
    .where(
      and(
        eq(despesas.id_municipio, idMunicipio),
        eq(despesas.ano, ano),
        eq(despesas.estagio, "Despesas Pagas")
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`, sql`1 asc`);
}

/**
 * Receita total realizada do ano.
 *
 * Lê a LINHA "TOTAL DAS RECEITAS", não a soma das linhas: `receitas` é um
 * plano de contas hierárquico e o total do pai convive com os filhos na
 * mesma tabela. Somar tudo contava o mesmo dinheiro em cada nível —
 * medido ao vivo em 2026-07-21: dava R$ 24,8 bi contra os R$ 3,49 bi
 * reais.
 */
export async function receitaTotalDoAno(idMunicipio: IdMunicipio, ano: number) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ valor: num(receitas.valor) })
    .from(receitas)
    .where(
      and(
        eq(receitas.id_municipio, idMunicipio),
        eq(receitas.ano, ano),
        eq(receitas.estagio, "Receitas Brutas Realizadas"),
        ilike(receitas.conta, "TOTAL DAS RECEITAS%")
      )
    )
    .orderBy(asc(receitas.id))
    .limit(1);
  return linha?.valor ?? 0;
}

/**
 * Maiores fornecedores por valor contratado.
 *
 * O agrupamento desceu para o banco — era um `Map` sobre TODAS as linhas
 * de `contratos` só para tirar o top 5. A chave continua sendo o CNPJ e,
 * na falta dele, o nome. O rótulo passa a ser `min(fornecedor_nome)` do
 * grupo, e não "o primeiro que apareceu": a consulta antiga não tinha
 * `order by`, então "o primeiro" era indefinido — quando o mesmo CNPJ
 * aparece com grafias diferentes, qual delas ia para a tela mudava sem
 * motivo.
 */
export async function maioresFornecedores(idMunicipio: IdMunicipio, limite = 5) {
  const db = getDb();
  if (!db) return null;
  const chave = sql`coalesce(${contratos.fornecedor_cnpj}, ${contratos.fornecedor_nome}, 'Fornecedor não identificado')`;
  return db
    .select({
      chave: sql<string>`${chave}`,
      nome: sql<string>`coalesce(min(${contratos.fornecedor_nome}), ${chave})`,
      cnpj: contratos.fornecedor_cnpj,
      valor: sql<number>`coalesce(sum(${contratos.valor_global}), 0)::double precision`,
    })
    .from(contratos)
    .where(eq(contratos.id_municipio, idMunicipio))
    .groupBy(chave, contratos.fornecedor_cnpj)
    .orderBy(sql`4 desc`, sql`1 asc`)
    .limit(limite);
}

/** Filtros compartilhados pela listagem, pela exportação e pelos totais. */
function condicoesDeContratos(
  idMunicipio: IdMunicipio,
  f: {
    ano?: number;
    status?: string;
    alerta?: boolean;
    motivo?: string;
    tema?: string;
    q?: string;
    valorMin?: number;
    valorMax?: number;
  }
) {
  const cond = [eq(contratos.id_municipio, idMunicipio)];
  if (f.ano) cond.push(eq(contratos.ano, f.ano));
  if (f.status) cond.push(eq(contratos.status, f.status));
  if (f.alerta) cond.push(eq(contratos.alerta, true));
  // Um motivo específico já implica alerta=true: `motivos_alerta` só tem
  // item quando o alerta disparou.
  if (f.motivo) cond.push(arrayContains(contratos.motivos_alerta, [f.motivo]));
  if (f.tema) cond.push(arrayContains(contratos.temas, [f.tema]));
  if (f.q) {
    const termo = `%${f.q}%`;
    cond.push(
      sql`(${contratos.objeto} ilike ${termo} or ${contratos.fornecedor_nome} ilike ${termo})`
    );
  }
  /**
   * Faixa de valor sobre `valor_global`.
   *
   * `valor_global` É ANULÁVEL, e é isso que decide o comportamento: contrato
   * sem valor publicado NÃO entra em nenhuma das duas pontas. Um `NULL` não
   * é "zero" nem "barato" — é "a fonte não disse", e deixá-lo passar no
   * filtro "até R$ 10 mil" faria o portal afirmar que um contrato de valor
   * desconhecido é pequeno. A comparação SQL já exclui NULL sozinha; o
   * comentário existe para que ninguém "conserte" isso com um `coalesce`.
   */
  if (f.valorMin !== undefined) cond.push(sql`${contratos.valor_global} >= ${f.valorMin}`);
  if (f.valorMax !== undefined) cond.push(sql`${contratos.valor_global} <= ${f.valorMax}`);
  return and(...cond);
}

const COLUNAS_CONTRATO = {
  id: contratos.id,
  fornecedor_nome: contratos.fornecedor_nome,
  fornecedor_cnpj: contratos.fornecedor_cnpj,
  objeto: contratos.objeto,
  valor_global: num(contratos.valor_global),
  status: contratos.status,
  data_assinatura: contratos.data_assinatura,
  vigencia_inicio: contratos.vigencia_inicio,
  vigencia_fim: contratos.vigencia_fim,
  ano: contratos.ano,
  alerta: contratos.alerta,
  motivos_alerta: contratos.motivos_alerta,
  temas: contratos.temas,
};

/**
 * Página de contratos com os três agregados do conjunto filtrado na mesma
 * consulta: total de linhas, soma de `valor_global` e quantos têm alerta.
 *
 * Eram DUAS idas ao banco, e a primeira trazia `valor_global` de todas as
 * linhas casadas só para somar e contar no JS — o padrão que o PostgREST
 * trunca em 1000 sem avisar. Três `over ()` resolvem em uma consulta e sem
 * teto, o que também importa pelo limite de 50 subrequests do Workers.
 */
export async function contratosPaginados(
  idMunicipio: IdMunicipio,
  filtros: {
    ano?: number;
    status?: string;
    alerta?: boolean;
    motivo?: string;
    tema?: string;
    q?: string;
    pagina?: number;
    porPagina?: number;
  } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = filtros.porPagina ?? 25;
  const pagina = Math.max(1, filtros.pagina ?? 1);
  return db
    .select({
      ...COLUNAS_CONTRATO,
      total: sql<number>`(count(*) over ())::int`,
      soma: sql<number>`(coalesce(sum(${contratos.valor_global}) over (), 0))::double precision`,
      total_alertas: sql<number>`(count(*) filter (where ${contratos.alerta}) over ())::int`,
    })
    .from(contratos)
    .where(condicoesDeContratos(idMunicipio, filtros))
    // Desempate por id: sem ordem total a paginação repete ou pula linhas,
    // e muitos contratos compartilham a mesma `data_assinatura`.
    .orderBy(sql`${contratos.data_assinatura} desc nulls last`, asc(contratos.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

/**
 * Totais do conjunto filtrado quando a página não tem nenhuma linha.
 *
 * Os `over ()` acima vêm pendurados em cada linha; sem linha, não vêm. Com
 * filtro que não casa nada os três agregados são mesmo zero, mas numa
 * página ALÉM da última (`?page=999`) o total real não é zero e a
 * paginação precisa dele para desenhar os controles.
 */
export async function totaisDeContratos(
  idMunicipio: IdMunicipio,
  filtros: {
    ano?: number;
    status?: string;
    alerta?: boolean;
    motivo?: string;
    tema?: string;
    q?: string;
    valorMin?: number;
    valorMax?: number;
  } = {}
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      total: sql<number>`count(*)::int`,
      soma: sql<number>`coalesce(sum(${contratos.valor_global}), 0)::double precision`,
      total_alertas: sql<number>`(count(*) filter (where ${contratos.alerta}))::int`,
    })
    .from(contratos)
    .where(condicoesDeContratos(idMunicipio, filtros));
  return linha ?? { total: 0, soma: 0, total_alertas: 0 };
}

/** Contratos para a exportação em CSV — sem paginação, com teto. */
export async function contratosParaExport(
  idMunicipio: IdMunicipio,
  filtros: {
    ano?: number;
    status?: string;
    alerta?: boolean;
    motivo?: string;
    tema?: string;
    q?: string;
    valorMin?: number;
    valorMax?: number;
  },
  limite: number
) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_CONTRATO)
    .from(contratos)
    .where(condicoesDeContratos(idMunicipio, filtros))
    .orderBy(sql`${contratos.data_assinatura} desc nulls last`, asc(contratos.id))
    .limit(limite);
}

/**
 * Detalhe das sanções CEIS/CNEP dos fornecedores indicados.
 *
 * Sem `idMunicipio` pela mesma razão de `fornecedoresPorCnpj`: a tabela é
 * global, chaveada por CNPJ.
 */
export async function sancoesCeisPorCnpj(cnpjs: string[]) {
  const db = getDb();
  if (!db || cnpjs.length === 0) return null;
  return db
    .select({ cnpj: fornecedores.cnpj, ceis_detalhes: fornecedores.ceis_detalhes })
    .from(fornecedores)
    .where(inArray(fornecedores.cnpj, cnpjs));
}

/** Quantos estabelecimentos de saúde e a soma dos profissionais. */
export async function resumoEstabelecimentosSaude(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      qtd: sql<number>`count(*)::int`,
      profissionais: sql<number>`coalesce(sum(${saude_estabelecimentos.profissionais_count}), 0)::int`,
    })
    .from(saude_estabelecimentos)
    .where(eq(saude_estabelecimentos.id_municipio, idMunicipio));
  return linha ?? { qtd: 0, profissionais: 0 };
}

export async function internacoesSaude(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: saude_internacoes.ano,
      carater: saude_internacoes.carater,
      qtd: saude_internacoes.qtd,
      obitos: saude_internacoes.obitos,
      permanencia_media: num(saude_internacoes.permanencia_media),
    })
    .from(saude_internacoes)
    .where(eq(saude_internacoes.id_municipio, idMunicipio))
    .orderBy(
      desc(saude_internacoes.ano),
      asc(saude_internacoes.carater),
      asc(saude_internacoes.id)
    );
}

/** Internações de urgência (caráter "2") a partir de um ano. */
export async function internacoesUrgenciaDesde(idMunicipio: IdMunicipio, anoMinimo: number) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({ ano: saude_internacoes.ano, qtd: saude_internacoes.qtd })
    .from(saude_internacoes)
    .where(
      and(
        eq(saude_internacoes.id_municipio, idMunicipio),
        eq(saude_internacoes.carater, "2"),
        gte(saude_internacoes.ano, anoMinimo)
      )
    );
}

export async function arbovirosesDoMunicipio(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      doenca: arboviroses.doenca,
      ano: arboviroses.ano,
      casos: arboviroses.casos,
      nivel_alerta: arboviroses.nivel_alerta,
    })
    .from(arboviroses)
    .where(eq(arboviroses.id_municipio, idMunicipio))
    .orderBy(desc(arboviroses.ano), asc(arboviroses.id));
}

/** Últimas semanas de dengue — janela curta, é o que o InfoDengue devolve. */
export async function ultimasSemanasDeDengue(idMunicipio: IdMunicipio, limite: number) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      semana_epidemiologica: arboviroses.semana_epidemiologica,
      casos: arboviroses.casos,
      ano: arboviroses.ano,
    })
    .from(arboviroses)
    .where(and(eq(arboviroses.id_municipio, idMunicipio), eq(arboviroses.doenca, "dengue")))
    .orderBy(
      desc(arboviroses.ano),
      desc(arboviroses.semana_epidemiologica),
      asc(arboviroses.id)
    )
    .limit(limite);
}

export async function anoMaisRecenteDeMortalidade(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ ano: mortalidade.ano })
    .from(mortalidade)
    .where(and(eq(mortalidade.id_municipio, idMunicipio), isNotNull(mortalidade.ano)))
    .orderBy(desc(mortalidade.ano))
    .limit(1);
  return linha?.ano ?? null;
}

export async function topCausasDeMortalidade(
  idMunicipio: IdMunicipio,
  ano: number,
  limite: number
) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({ grupo_causa: mortalidade.grupo_causa, obitos: mortalidade.obitos })
    .from(mortalidade)
    .where(and(eq(mortalidade.id_municipio, idMunicipio), eq(mortalidade.ano, ano)))
    .orderBy(desc(mortalidade.obitos), asc(mortalidade.id))
    .limit(limite);
}

/** Óbitos por grupo de causa a partir de um ano — base do cálculo de tendência. */
export async function mortalidadeDesde(idMunicipio: IdMunicipio, anoMinimo: number) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: mortalidade.ano,
      grupo_causa: mortalidade.grupo_causa,
      obitos: mortalidade.obitos,
    })
    .from(mortalidade)
    .where(and(eq(mortalidade.id_municipio, idMunicipio), gte(mortalidade.ano, anoMinimo)));
}

const COLUNAS_VEREADOR = {
  id: vereadores.id,
  slug: vereadores.slug,
  nome: vereadores.nome,
  nome_urna: vereadores.nome_urna,
  partido: vereadores.partido,
  email: vereadores.email,
  cargo_mesa: vereadores.cargo_mesa,
  foto_url: vereadores.foto_url,
  mandato_inicio: vereadores.mandato_inicio,
  mandato_fim: vereadores.mandato_fim,
  votos_eleicao: vereadores.votos_eleicao,
  ano_eleicao: vereadores.ano_eleicao,
  biografia: vereadores.biografia,
  profissao: vereadores.profissao,
  aniversario_dia_mes: vereadores.aniversario_dia_mes,
  situacao_mandato: vereadores.situacao_mandato,
};

/**
 * Vereadores ativos.
 *
 * `biografia`, `profissao` e `aniversario_dia_mes` (migration 0017) são
 * selecionadas direto: existem no banco, então o `comColunaOpcional()` que
 * as protegia nunca chegou a usar o fallback.
 */
export async function listarVereadores(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_VEREADOR)
    .from(vereadores)
    .where(and(eq(vereadores.id_municipio, idMunicipio), eq(vereadores.ativo, true)))
    .orderBy(ptBr(vereadores.nome_urna), asc(vereadores.id));
}

/**
 * Os vereadores que NAO estao em exercicio, com o motivo.
 *
 * Consulta separada de `listarVereadores` de proposito, e a separacao E o
 * ponto: `listarVereadores` filtra `ativo = true` e alimenta contagem, media
 * por vereador e ranking. Juntar os licenciados ali faria Sao Paulo exibir 59
 * vereadores para 55 cadeiras, e toda estatistica derivada herdaria o erro.
 *
 * Eles existem no banco porque continuam sendo os titulares — e porque sem
 * eles 8 participacoes de comissao em vigor nao eram gravaveis, deixando a
 * vice-presidencia da CCJ vazia na tela.
 */
export async function listarVereadoresForaDeExercicio(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select(COLUNAS_VEREADOR)
    .from(vereadores)
    .where(
      and(
        eq(vereadores.id_municipio, idMunicipio),
        ne(vereadores.situacao_mandato, "em_exercicio")
      )
    )
    .orderBy(ptBr(vereadores.nome_urna), asc(vereadores.id));
}

export async function vereadorPorSlug(idMunicipio: IdMunicipio, slug: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select(COLUNAS_VEREADOR)
    .from(vereadores)
    .where(and(eq(vereadores.id_municipio, idMunicipio), eq(vereadores.slug, slug)))
    .limit(1);
  return linha ?? null;
}

/**
 * Proposições de um vereador — as 10 mais recentes, com o total do
 * conjunto (que é maior que 10) por `count(*) over ()`.
 *
 * As três consultas por vereador (proposições, diárias, doações, bens)
 * filtravam SÓ por `vereador_id`. As quatro tabelas têm `id_municipio` e
 * agora filtram pelos dois — mesmo caso de `getTemasVereador`.
 */
export async function proposicoesDeVereador(
  idMunicipio: IdMunicipio,
  vereadorId: string,
  tema?: string,
  limite = 10
) {
  const db = getDb();
  if (!db) return null;
  const cond = [
    eq(proposicoes.id_municipio, idMunicipio),
    eq(proposicoes.vereador_id, vereadorId),
  ];
  if (tema) cond.push(arrayContains(proposicoes.temas, [tema]));
  return db
    .select({
      tipo: proposicoes.tipo,
      numero: proposicoes.numero,
      ano: proposicoes.ano,
      ementa: proposicoes.ementa,
      situacao: proposicoes.situacao,
      link_fonte: proposicoes.link_fonte,
      temas: proposicoes.temas,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(proposicoes)
    .where(and(...cond))
    .orderBy(desc(proposicoes.ano), desc(proposicoes.numero), asc(proposicoes.id))
    .limit(limite);
}

export async function diariasDeVereador(idMunicipio: IdMunicipio, vereadorId: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      destino: diarias.destino,
      data_inicio: diarias.data_inicio,
      data_fim: diarias.data_fim,
      valor: num(diarias.valor),
      motivo: diarias.motivo,
    })
    .from(diarias)
    .where(and(eq(diarias.id_municipio, idMunicipio), eq(diarias.vereador_id, vereadorId)))
    .orderBy(sql`${diarias.data_inicio} desc nulls last`, asc(diarias.id));
}

/**
 * TODA a tabela `diarias` de uma cidade — inclusive o que não é de vereador.
 *
 * `diariasDeVereador` era a ÚNICA consumidora desta tabela, e filtra por
 * `vereador_id`. As 381 viagens oficiais de Belo Horizonte têm esse campo
 * NULO (são servidores do Executivo, não vereadores), então estavam gravadas
 * e invisíveis — R$ 897 mil que o portal tinha e não mostrava.
 *
 * `natureza` sai explícita porque a tabela guarda duas coisas diferentes:
 * diária (verba de alimentação e hospedagem por dia de afastamento) e
 * passagem aérea (o bilhete). A PBH não publica diária em dataset nenhum; se
 * a tela somasse os dois sob o rótulo "diárias", afirmaria um gasto que não
 * é esse.
 */
export async function viagensDoMunicipio(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      id: diarias.id,
      natureza: diarias.natureza,
      orgao: diarias.orgao,
      orgao_nome: diarias.orgao_nome,
      beneficiario: diarias.beneficiario,
      cargo: diarias.cargo,
      vereador_id: diarias.vereador_id,
      origem: diarias.origem,
      destino: diarias.destino,
      data_inicio: diarias.data_inicio,
      data_fim: diarias.data_fim,
      qtd_diarias: num(diarias.qtd_diarias),
      valor: num(diarias.valor),
      motivo: diarias.motivo,
      link_fonte: diarias.link_fonte,
    })
    .from(diarias)
    .where(eq(diarias.id_municipio, idMunicipio))
    .orderBy(sql`${diarias.data_inicio} desc nulls last`, asc(diarias.id));
}

/**
 * Doações de campanha, maior valor primeiro, com o total do conjunto.
 *
 * CPF/CNPJ do doador não sai daqui: a Lei das Eleições exige divulgação do
 * financiamento e o NOME é público, mas o documento não precisa aparecer.
 */
export async function doacoesDeVereador(idMunicipio: IdMunicipio, vereadorId: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      doador_nome: doacoes_campanha.doador_nome,
      doador_tipo: doacoes_campanha.doador_tipo,
      valor: num(doacoes_campanha.valor),
      data_doacao: doacoes_campanha.data_doacao,
      total: sql<number>`(count(*) over ())::int`,
      soma: sql<number>`(coalesce(sum(${doacoes_campanha.valor}) over (), 0))::double precision`,
    })
    .from(doacoes_campanha)
    .where(
      and(
        eq(doacoes_campanha.id_municipio, idMunicipio),
        eq(doacoes_campanha.vereador_id, vereadorId)
      )
    )
    .orderBy(sql`${doacoes_campanha.valor} desc nulls last`, asc(doacoes_campanha.id));
}

/** Patrimônio declarado na campanha (TSE), maior valor primeiro. */
export async function bensDeVereador(idMunicipio: IdMunicipio, vereadorId: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      tipo_item: bens_candidato.tipo_item,
      descricao_item: bens_candidato.descricao_item,
      valor: num(bens_candidato.valor),
      total: sql<number>`(count(*) over ())::int`,
      soma: sql<number>`(coalesce(sum(${bens_candidato.valor}) over (), 0))::double precision`,
    })
    .from(bens_candidato)
    .where(
      and(
        eq(bens_candidato.id_municipio, idMunicipio),
        eq(bens_candidato.vereador_id, vereadorId)
      )
    )
    .orderBy(sql`${bens_candidato.valor} desc nulls last`, asc(bens_candidato.id));
}

/**
 * Contagem de proposições por (vereador, tipo) — a base do ranking de
 * atuação.
 *
 * Substitui um laço que trazia TODAS as 2.733 linhas de `proposicoes` em
 * páginas de 1000. Esse laço existia porque o PostgREST corta em 1000 sem
 * erro, e o comentário do código registra que o ranking chegou a mostrar
 * "o 1º colocado errado" quando a tabela passou de 487 para 2.731 linhas.
 * Um `group by` devolve dezenas de linhas e o teto some junto.
 *
 * `vereador_id` vem nulo em proposição sem autor casado; essas contam para
 * o total da Câmara e não para o ranking por pessoa — quem separa é
 * `lib/betim/vereadores.ts`, que precisa das duas contagens.
 */
/**
 * A contagem quebra por mais duas dimensões, e as duas mudam PONTO:
 *
 * - `classe_teor` (migration 0038) separa o Projeto de Lei que é política
 *   pública do que dá nome a rua. São 12% dos PLs de BH, 22% dos de São
 *   Paulo e 29% dos de Betim — grande demais para o ranking ignorar.
 * - `rotulo` vem da análise garantista, e só das que estão em `status='ok'`
 *   (a mesma régua de `legislacao-garantista.ts`: análise em
 *   `requer_revisao` tem baixa confiança e não pode mexer no ranking de
 *   ninguém).
 *
 * O JOIN é LEFT de propósito: a esmagadora maioria das proposições não tem
 * análise, e um INNER JOIN faria o ranking sumir com quase todo mundo.
 * `rotulo` nulo significa "não analisada", NUNCA "neutra" — quem consome
 * trata os dois casos separadamente.
 */
export async function contagemDeProposicoesPorVereador(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      vereador_id: proposicoes.vereador_id,
      tipo: proposicoes.tipo,
      classe_teor: proposicoes.classe_teor,
      rotulo: analises.rotulo,
      qtd: sql<number>`count(*)::int`,
    })
    .from(proposicoes)
    .leftJoin(
      analises,
      and(eq(analises.proposicao_id, proposicoes.id), eq(analises.status, "ok"))
    )
    .where(and(eq(proposicoes.id_municipio, idMunicipio), isNotNull(proposicoes.tipo)))
    .groupBy(
      proposicoes.vereador_id,
      proposicoes.tipo,
      proposicoes.classe_teor,
      analises.rotulo
    );
}

/** A proposição mais recente que casa com um filtro — teaser da Home. */
export async function ultimaProposicao(
  idMunicipio: IdMunicipio,
  filtro: { tipo?: string; situacao?: string }
) {
  const db = getDb();
  if (!db) return null;
  const cond = [eq(proposicoes.id_municipio, idMunicipio)];
  if (filtro.tipo) cond.push(eq(proposicoes.tipo, filtro.tipo));
  if (filtro.situacao) cond.push(eq(proposicoes.situacao, filtro.situacao));
  const [linha] = await db
    .select({
      tipo: proposicoes.tipo,
      numero: proposicoes.numero,
      ano: proposicoes.ano,
      ementa: proposicoes.ementa,
      link_fonte: proposicoes.link_fonte,
      data_apresentacao: proposicoes.data_apresentacao,
    })
    .from(proposicoes)
    .where(and(...cond))
    /**
     * Desempate por NÚMERO, não por id — e a diferença é de significado,
     * não de estilo.
     *
     * Quatro requerimentos dividem `data_apresentacao = 2026-07-15`. Um
     * desempate por uuid escolheria o nº 821; a Câmara numera as
     * proposições em sequência, então o nº 822 é que é o último. Com id o
     * teaser da Home ficaria determinístico e ERRADO. O `id` continua no
     * fim como garantia de ordem total, para o caso de número repetido.
     */
    .orderBy(
      sql`${proposicoes.data_apresentacao} desc nulls last`,
      desc(proposicoes.ano),
      desc(proposicoes.numero),
      asc(proposicoes.id)
    )
    .limit(1);
  return linha ?? null;
}


/**
 * Cache do clima da cidade.
 *
 * `clima_cache` tem uma linha por município e `id_municipio` é a chave —
 * não tem coluna `id`, então o desempate de ordem não se aplica aqui.
 */
export async function climaDaCidade(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      atual: clima_cache.atual,
      diario: clima_cache.diario,
      chuva_7d: num(clima_cache.chuva_7d),
      atualizado_em: clima_cache.atualizado_em,
    })
    .from(clima_cache)
    .where(eq(clima_cache.id_municipio, idMunicipio))
    .limit(1);
  return linha ?? null;
}

/* ------------------------------------------------------------------ *
 * ESCRITAS
 *
 * Mesma regra das leituras: `idMunicipio` é o primeiro parâmetro, e aqui
 * ela vale duas vezes. Num INSERT ele é o valor gravado — errar carimba a
 * linha na cidade errada de forma permanente. Num UPDATE/DELETE ele entra
 * no WHERE ao lado do `id`: sem isso, o painel de uma cidade poderia
 * alterar ou apagar a linha de outra, e o único obstáculo seria a
 * dificuldade de adivinhar um uuid. O `ADMIN_TOKEN` é UM SÓ para toda a
 * instalação (`lib/betim/adminAuth.ts`), então ele não distingue cidades —
 * quem distingue é este filtro.
 *
 * As escritas usam o mesmo driver HTTP das leituras: cada uma é um
 * statement único e atômico. Onde havia read-then-write, virou um UPDATE
 * só (ver `incrementarCliquesZap`).
 * ------------------------------------------------------------------ */

export async function inserirClassificado(
  idMunicipio: IdMunicipio,
  dados: {
    titulo: string;
    descricao: string;
    categoria: string;
    preco: number | null;
    contato_whatsapp: string;
    expira_em: string;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(classificados)
    .values({
      id_municipio: idMunicipio,
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoria: dados.categoria,
      // `preco` é `numeric`: na ESCRITA o driver quer string. É a mesma
      // assimetria do `num()` na leitura, do outro lado.
      preco: dados.preco === null ? null : String(dados.preco),
      contato_whatsapp: dados.contato_whatsapp,
      expira_em: dados.expira_em,
      aprovado: false,
    })
    .returning({ id: classificados.id });
  return linha ?? null;
}

export async function inserirZapEstabelecimento(
  idMunicipio: IdMunicipio,
  dados: {
    nome: string;
    whatsapp: string;
    categoria: string;
    descricao: string | null;
    bairro: string | null;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(zap_estabelecimentos)
    .values({ id_municipio: idMunicipio, ...dados, aprovado: false })
    .returning({ id: zap_estabelecimentos.id });
  return linha ?? null;
}

/**
 * Soma 1 no contador de cliques de um negócio do Zap.
 *
 * Era SELECT do valor atual + UPDATE com `valor + 1` — dois passos, e
 * entre eles cabe outro clique: com dois acessos simultâneos, os dois leem
 * o mesmo número e gravam o mesmo, perdendo uma contagem. Um
 * `set cliques = cliques + 1` resolve no banco, num statement, sem essa
 * janela. De quebra gasta um subrequest em vez de dois.
 *
 * `returning` vazio significa "não existe, não é desta cidade, ou não está
 * aprovado" — é assim que o chamador devolve 404 sem consulta extra.
 */
export async function incrementarCliquesZap(idMunicipio: IdMunicipio, id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .update(zap_estabelecimentos)
    .set({ cliques: sql`coalesce(${zap_estabelecimentos.cliques}, 0) + 1` })
    .where(
      and(
        eq(zap_estabelecimentos.id_municipio, idMunicipio),
        eq(zap_estabelecimentos.id, id),
        eq(zap_estabelecimentos.aprovado, true)
      )
    )
    .returning({ id: zap_estabelecimentos.id, cliques: zap_estabelecimentos.cliques });
  return linha ?? null;
}

/** Todos os anúncios da cidade, inclusive inativos — visão do painel. */
export async function listarAnunciosAdmin(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select()
    .from(anuncios)
    .where(eq(anuncios.id_municipio, idMunicipio))
    .orderBy(desc(anuncios.created_at), asc(anuncios.id));
}

export async function inserirAnuncio(
  idMunicipio: IdMunicipio,
  dados: {
    nome_comercio: string;
    plano: string;
    banner_url: string | null;
    link: string | null;
    data_inicio: string | null;
    data_fim: string | null;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .insert(anuncios)
    .values({ id_municipio: idMunicipio, ...dados, ativo: false })
    .returning();
  return linha ?? null;
}

export type PatchAnuncio = Partial<{
  nome_comercio: string;
  plano: string;
  banner_url: string | null;
  link: string | null;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
}>;

export async function atualizarAnuncio(
  idMunicipio: IdMunicipio,
  id: string,
  patch: PatchAnuncio
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .update(anuncios)
    .set(patch)
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning();
  return linha ?? null;
}

export async function removerAnuncio(idMunicipio: IdMunicipio, id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .delete(anuncios)
    .where(and(eq(anuncios.id_municipio, idMunicipio), eq(anuncios.id, id)))
    .returning({ id: anuncios.id });
  return linha ?? null;
}

/**
 * As duas tabelas que passam por moderação, indexadas pelo nome que a rota
 * aceita no corpo do pedido.
 *
 * O mapa É a lista de permissão, e a tabela sai dele — nunca da string que
 * o cliente mandou. No PostgREST era `supabase.from(tabela)` com `tabela`
 * vindo do corpo, seguro apenas enquanto a checagem `includes()` de duas
 * linhas acima continuasse ali.
 */
export const TABELAS_MODERADAS = {
  zap_estabelecimentos,
  classificados,
} as const;

export type TabelaModerada = keyof typeof TABELAS_MODERADAS;

/** Cadastros aguardando moderação nas duas tabelas. */
export async function pendentesDeModeracao(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [zap, pendentesClassificados] = await Promise.all([
    db
      .select({
        id: zap_estabelecimentos.id,
        nome: zap_estabelecimentos.nome,
        whatsapp: zap_estabelecimentos.whatsapp,
        categoria: zap_estabelecimentos.categoria,
        descricao: zap_estabelecimentos.descricao,
        bairro: zap_estabelecimentos.bairro,
        created_at: zap_estabelecimentos.created_at,
      })
      .from(zap_estabelecimentos)
      .where(
        and(
          eq(zap_estabelecimentos.id_municipio, idMunicipio),
          eq(zap_estabelecimentos.aprovado, false)
        )
      )
      .orderBy(desc(zap_estabelecimentos.created_at), asc(zap_estabelecimentos.id)),
    db
      .select({
        id: classificados.id,
        titulo: classificados.titulo,
        descricao: classificados.descricao,
        categoria: classificados.categoria,
        preco: num(classificados.preco),
        contato_whatsapp: classificados.contato_whatsapp,
        created_at: classificados.created_at,
      })
      .from(classificados)
      .where(
        and(eq(classificados.id_municipio, idMunicipio), eq(classificados.aprovado, false))
      )
      .orderBy(desc(classificados.created_at), asc(classificados.id)),
  ]);
  return { zap_estabelecimentos: zap, classificados: pendentesClassificados };
}

export async function aprovarPendente(
  idMunicipio: IdMunicipio,
  tabela: TabelaModerada,
  id: string
) {
  const db = getDb();
  if (!db) return null;
  const t = TABELAS_MODERADAS[tabela];
  const [linha] = await db
    .update(t)
    .set({ aprovado: true })
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id)))
    .returning({ id: t.id });
  return linha ?? null;
}

/** Rejeitar apaga a linha pendente — ela nunca chegou a ser pública. */
export async function rejeitarPendente(
  idMunicipio: IdMunicipio,
  tabela: TabelaModerada,
  id: string
) {
  const db = getDb();
  if (!db) return null;
  const t = TABELAS_MODERADAS[tabela];
  const [linha] = await db
    .delete(t)
    // `aprovado = false` também no WHERE: rejeitar só alcança o que está
    // pendente. Sem isso, o id de um cadastro JÁ APROVADO e público seria
    // apagado por este caminho.
    .where(and(eq(t.id_municipio, idMunicipio), eq(t.id, id), eq(t.aprovado, false)))
    .returning({ id: t.id });
  return linha ?? null;
}

/* ────────────────────────────────────────────────────────────────────────
 * Análise garantista × reducionista (migration 0033)
 *
 * Estas funções são o único caminho do app até `public.analises`. Todas
 * exigem `idMunicipio` primeiro, inclusive as que leem `analise_itens` — a
 * coluna `id_municipio` foi denormalizada para lá exatamente para que o
 * filtro de cidade não dependa de lembrar de um join.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Análises de uma cidade, já com o objeto analisado junto.
 *
 * A CONSULTA PARTE DE `analises`, NÃO DOS OBJETOS — mesma razão do
 * Congresso (`lib/congresso/destaques.ts`): as analisadas são ~60 de
 * milhares, e partir da tabela grande leria milhares de linhas para
 * descartar quase todas.
 *
 * Os dois `leftJoin` (ato e proposição) são a contrapartida das duas
 * colunas nuláveis da 0033. `tipo_objeto` vem explícito no retorno em vez
 * de ser inferido depois por "qual campo não é nulo", porque a distinção
 * importa na tela: projeto em tramitação ainda pode mudar, lei sancionada
 * já vale.
 */
export async function analisesDoMunicipio(
  idMunicipio: IdMunicipio,
  rotulos?: string[]
) {
  const db = getDb();
  if (!db) return null;
  if (rotulos && rotulos.length === 0) return [];

  const cond = [eq(analises.id_municipio, idMunicipio), eq(analises.status, "ok")];
  if (rotulos) cond.push(inArray(analises.rotulo, rotulos));

  return db
    .select({
      id: analises.id,
      ato_id: analises.ato_id,
      proposicao_id: analises.proposicao_id,
      tipo_objeto: sql<"ato" | "proposicao">`case when ${analises.ato_id} is null then 'proposicao' else 'ato' end`,
      score: num(analises.score),
      rotulo: analises.rotulo,
      clausula_petrea: analises.clausula_petrea,
      vedacao_retrocesso: analises.vedacao_retrocesso,
      resumo_neutro: analises.resumo_neutro,
      modelo: analises.modelo,
      versao_rubrica: analises.versao_rubrica,
      criado_em: analises.criado_em,
      // Identificação e ementa vêm do lado que existir. `tipo` do ato já é
      // texto ("Lei Ordinária"); o da proposição é código ("projeto_lei") e
      // ganha rótulo em português na camada de cima.
      ato_tipo: atos_oficiais.tipo,
      ato_numero: atos_oficiais.numero,
      ato_ano: atos_oficiais.ano,
      ato_ementa: atos_oficiais.ementa,
      ato_temas: atos_oficiais.temas,
      ato_data: atos_oficiais.data_publicacao,
      ato_link: atos_oficiais.link_fonte,
      prop_tipo: proposicoes.tipo,
      prop_numero: proposicoes.numero,
      prop_ano: proposicoes.ano,
      prop_ementa: proposicoes.ementa,
      prop_temas: proposicoes.temas,
      prop_data: proposicoes.data_apresentacao,
      prop_situacao: proposicoes.situacao,
      prop_autores: proposicoes.autores,
      prop_link: proposicoes.link_fonte,
    })
    .from(analises)
    .leftJoin(atos_oficiais, eq(atos_oficiais.id, analises.ato_id))
    .leftJoin(proposicoes, eq(proposicoes.id, analises.proposicao_id))
    .where(and(...cond));
}

/** Itens de um conjunto de análises da MESMA cidade. */
export async function itensDeAnalises(idMunicipio: IdMunicipio, analiseIds: string[]) {
  const db = getDb();
  if (!db || analiseIds.length === 0) return [];
  return db
    .select({
      analise_id: analise_itens.analise_id,
      direito: analise_itens.direito,
      dispositivo: analise_itens.dispositivo,
      direcao: analise_itens.direcao,
      mecanismo: analise_itens.mecanismo,
      titulares: analise_itens.titulares,
      grau: analise_itens.grau,
      trecho: analise_itens.trecho,
      confianca: num(analise_itens.confianca),
      peso: num(analise_itens.peso),
    })
    .from(analise_itens)
    .where(
      and(
        eq(analise_itens.id_municipio, idMunicipio),
        inArray(analise_itens.analise_id, analiseIds)
      )
    );
}

/**
 * O denominador honesto: quantos objetos de cada tipo já foram analisados e
 * quantos existem.
 *
 * Sem isto nenhuma tela deste eixo pode publicar um ranking. A análise
 * cobre ~60 objetos por cidade de milhares — um "top 10 mais reducionista"
 * sem o denominador ao lado parece veredito sobre a Câmara inteira.
 */
export async function coberturaAnaliseMunicipio(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  const [analisadas, totalAtos, totalProps] = await Promise.all([
    db
      .select({
        tipo_objeto: sql<"ato" | "proposicao">`case when ${analises.ato_id} is null then 'proposicao' else 'ato' end`,
        n: count(),
      })
      .from(analises)
      .where(and(eq(analises.id_municipio, idMunicipio), eq(analises.status, "ok")))
      .groupBy(sql`1`),
    db
      .select({ n: count() })
      .from(atos_oficiais)
      .where(eq(atos_oficiais.id_municipio, idMunicipio)),
    db
      .select({ n: count() })
      .from(proposicoes)
      .where(eq(proposicoes.id_municipio, idMunicipio)),
  ]);
  return {
    atosAnalisados: analisadas.find((r) => r.tipo_objeto === "ato")?.n ?? 0,
    proposicoesAnalisadas:
      analisadas.find((r) => r.tipo_objeto === "proposicao")?.n ?? 0,
    totalAtos: totalAtos[0]?.n ?? 0,
    totalProposicoes: totalProps[0]?.n ?? 0,
  };
}

/**
 * Análises dos objetos que uma página já vai renderizar.
 *
 * Retorna também os itens, porque o requisito é rótulo COM justificativa:
 * "reducionista" sem o trecho que sustenta a leitura é opinião. Objeto
 * ausente do retorno é objeto SEM ANÁLISE — diferente de análise com
 * resultado neutro, e a UI tem de distinguir os dois.
 */
export async function analisesDeObjetos(
  idMunicipio: IdMunicipio,
  ids: { atos?: string[]; proposicoes?: string[] }
) {
  const db = getDb();
  if (!db) return null;

  const porObjeto = [];
  if (ids.atos?.length) porObjeto.push(inArray(analises.ato_id, ids.atos));
  if (ids.proposicoes?.length)
    porObjeto.push(inArray(analises.proposicao_id, ids.proposicoes));
  if (porObjeto.length === 0) return { linhas: [], itens: [] };

  const linhas = await db
    .select({
      id: analises.id,
      ato_id: analises.ato_id,
      proposicao_id: analises.proposicao_id,
      score: num(analises.score),
      rotulo: analises.rotulo,
      status: analises.status,
      clausula_petrea: analises.clausula_petrea,
      vedacao_retrocesso: analises.vedacao_retrocesso,
      resumo_neutro: analises.resumo_neutro,
      modelo: analises.modelo,
      versao_rubrica: analises.versao_rubrica,
    })
    .from(analises)
    .where(and(eq(analises.id_municipio, idMunicipio), or(...porObjeto)));

  const itens = await itensDeAnalises(
    idMunicipio,
    linhas.map((l) => l.id)
  );
  return { linhas, itens };
}

/**
 * Quantos objetos analisados tocam cada direito da rubrica — alimenta o
 * filtro por direito da página de legislação.
 *
 * Lê `analise_itens` direto: é para isso que a 0033 denormalizou
 * `id_municipio` para a tabela de itens.
 */
export async function direitosDoMunicipio(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      direito: analise_itens.direito,
      tipo_objeto: sql<"ato" | "proposicao">`case when ${analises.ato_id} is null then 'proposicao' else 'ato' end`,
      qtd: sql<number>`count(distinct ${analise_itens.analise_id})::int`,
    })
    .from(analise_itens)
    .innerJoin(analises, eq(analises.id, analise_itens.analise_id))
    .where(and(eq(analise_itens.id_municipio, idMunicipio), eq(analises.status, "ok")))
    .groupBy(analise_itens.direito, sql`2`);
}

/**
 * Como cada vereador consta em cada votação — a matéria-prima da PRESENÇA.
 *
 * Devolve células cruas `(vereador_id, voto, origem, qtd)`. A CLASSIFICAÇÃO
 * NÃO ACONTECE AQUI, e isso é deliberado: o que "Não votou", "Ausente" e
 * "Presidência" significam é decisão editorial, vive em
 * `lib/presenca/vocabulario.json` e é lida pelo TypeScript E pelo Python.
 * Um `case when` em SQL esconderia num lugar que ninguém audita a régua que
 * a página `/metodologia` promete explicar — a mesma razão de
 * `PESO_PROPOSICAO` nunca ter descido para o banco.
 *
 * ═══ O DENOMINADOR É O NÚMERO DE LINHAS DA PESSOA, NÃO O DE VOTAÇÕES ═══
 *
 * Medido em 2026-08-06, linhas por votação:
 *
 *   Betim           23,0 (min 23, max 25) — 23 vereadores. Lista COMPLETA.
 *   Belo Horizonte  41,5 (min 41, max 42) — 41 vereadores. Lista COMPLETA.
 *   São Paulo       16,7 (min  1, max 55) — 55 vereadores. Só quem VOTOU.
 *
 * Em Betim e BH a fonte inscreve todo mundo em toda votação e marca quem
 * faltou; o denominador natural é em quantas votações a pessoa aparece, o
 * que já trata sozinho quem assumiu no meio do mandato ou se licenciou.
 *
 * Em São Paulo esse denominador seria uma armadilha: quem falta não gera
 * linha, então dividir ausências por linhas daria 0% de falta para quem
 * nunca apareceu. É por isso que `fonteDeclaraAusencia()` DESLIGA a métrica
 * em SP em vez de a estimar — ver `lib/presenca/vocabulario.ts`.
 *
 * `origem` vem junto porque `voto_contrario` (dissidência anotada em votação
 * simbólica de SP) não é registro de presença: dizer que alguém "compareceu"
 * porque a ata anotou o voto contrário dele confundiria as duas coisas.
 */
export async function contagemDeVotosPorVereador(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      vereador_id: votos_camara.vereador_id,
      voto: votos_camara.voto,
      origem: votos_camara.origem,
      qtd: sql<number>`count(*)::int`,
    })
    .from(votos_camara)
    .where(
      and(
        eq(votos_camara.id_municipio, idMunicipio),
        isNotNull(votos_camara.vereador_id)
      )
    )
    .groupBy(votos_camara.vereador_id, votos_camara.voto, votos_camara.origem);
}

/**
 * O voto de cada vereador CRUZADO com o rótulo de direitos da matéria —
 * a matéria-prima da COERÊNCIA.
 *
 * Só entram votações que a migration 0042 conseguiu ligar a uma proposição
 * COM análise `status='ok'`. É um recorte pequeno e a tela precisa dizer o
 * tamanho dele. Medido em 2026-08-06, votações cuja proposição tem rótulo
 * garantista ou reducionista (as únicas que produzem veredito):
 *
 *   Betim           150     ← sinal real
 *   São Paulo        16     ← fino
 *   Belo Horizonte    0     ← a coleta de votação ainda tem 2 votações
 *
 * `neutro` e `misto` ficam fora do numerador por construção (não há direção a
 * comparar), mas continuam saindo daqui: é a contagem deles que permite à
 * tela dizer "de N matérias analisadas que este vereador votou, M tinham
 * direção de direitos" em vez de fingir que a amostra é maior.
 *
 * Como no caso da presença, o veredito "coerente/incoerente" é calculado no
 * TypeScript e não em SQL — ele é a régua editorial que `/metodologia`
 * publica.
 */
export async function votosPorRotuloDeDireito(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      vereador_id: votos_camara.vereador_id,
      rotulo: analises.rotulo,
      voto: votos_camara.voto,
      /** Autor da matéria — permite a coerência AUTORIA × VOTO sem uma
       *  segunda consulta. */
      autor_id: proposicoes.vereador_id,
      qtd: sql<number>`count(*)::int`,
    })
    .from(votos_camara)
    .innerJoin(votacoes_camara, eq(votacoes_camara.id, votos_camara.votacao_id))
    .innerJoin(proposicoes, eq(proposicoes.id, votacoes_camara.proposicao_id))
    .innerJoin(
      analises,
      and(eq(analises.proposicao_id, proposicoes.id), eq(analises.status, "ok"))
    )
    .where(
      and(
        eq(votos_camara.id_municipio, idMunicipio),
        isNotNull(votos_camara.vereador_id),
        // Voto NOMINAL apenas. `voto_contrario` de SP é anotação de
        // dissidência em votação simbólica: registra quem foi CONTRA e não
        // registra quem foi a favor. Contá-lo produziria uma taxa de
        // coerência medida só sobre discordantes.
        eq(votos_camara.origem, "nominal")
      )
    )
    .groupBy(
      votos_camara.vereador_id,
      analises.rotulo,
      votos_camara.voto,
      proposicoes.vereador_id
    );
}

/**
 * Despesas de verba indenizatória que destoam do próprio grupo — os
 * ALERTAS DE GASTO.
 *
 * ═══ POR QUE PERCENTIL, E NÃO UM VALOR EM REAIS ═══
 *
 * "R$ 2 mil num almoço" é o exemplo certo do problema e o limiar errado para
 * a regra: R$ 2 mil de aluguel de imóvel de gabinete é rotina e R$ 2 mil de
 * alimentação é escândalo. Um teto absoluto acusaria o primeiro e deixaria
 * passar um almoço de R$ 900. Por isso a régua é RELATIVA ao mesmo
 * `grupo_verba` da MESMA cidade — a única comparação em que o número quer
 * dizer alguma coisa. São Paulo gasta em ordens de grandeza que Betim não
 * tem; comparar as duas produziria um ranking de tamanho de cidade.
 *
 * O corte é p95 do grupo E pelo menos o dobro da mediana. As duas condições
 * juntas, porque cada uma sozinha erra:
 *
 *   - só p95: num grupo homogêneo (combustível, quase tudo entre R$ 600 e
 *     800) o topo do percentil não é anomalia nenhuma — 5% das linhas seriam
 *     acusadas por construção, em todo grupo, para sempre.
 *   - só "dobro da mediana": num grupo de cauda longa isso dispara demais.
 *
 * `minLinhas` existe pelo mesmo motivo: percentil sobre 3 linhas não é
 * estatística. Grupo pequeno fica fora e a tela não o menciona — o silêncio
 * aqui é honesto, o alerta seria ruído.
 *
 * ⚠ ISTO NÃO ENTRA NA PONTUAÇÃO, DE PROPÓSITO. Uma conta de correio acima do
 * normal pode ser mala direta legítima de mandato; o dado sustenta "olhe para
 * isto", não "isto é irregular". Rebaixar alguém no ranking por um outlier
 * estatístico transformaria suspeita em veredito. O ranking desconta falta e
 * incoerência de voto, que são atos do parlamentar; gasto atípico é
 * sinalizado e fica para o leitor.
 */
export async function gastosAtipicos(
  idMunicipio: IdMunicipio,
  { minLinhas = 8, limite = 50 }: { minLinhas?: number; limite?: number } = {}
) {
  const db = getDb();
  if (!db) return [];
  // `db.execute` devolve `NeonHttpQueryResult`, não um array — desembrulhar
  // aqui e não no consumidor, senão cada tela repete o `.rows ?? []` e a
  // primeira que esquecer compila e itera sobre o objeto errado.
  const linhas = await db.execute<{
    vereador_id: string | null;
    beneficiario: string | null;
    grupo_verba: string | null;
    fornecedor: string | null;
    data: string | null;
    valor: number;
    mediana_grupo: number;
    p95_grupo: number;
    vezes_a_mediana: number;
    linhas_no_grupo: number;
  }>(sql`
    with base as (
      select vereador_id, beneficiario, grupo_verba, fornecedor, data,
             valor::float8 as valor
        from verbas_indenizatorias
       where id_municipio = ${idMunicipio}
         and valor is not null
         and grupo_verba is not null
    ),
    estat as (
      select grupo_verba,
             count(*)::int as linhas_no_grupo,
             percentile_cont(0.5)  within group (order by valor) as mediana,
             percentile_cont(0.95) within group (order by valor) as p95
        from base
       group by grupo_verba
      having count(*) >= ${minLinhas}
    )
    select b.vereador_id, b.beneficiario, b.grupo_verba, b.fornecedor,
           b.data::text as data, b.valor,
           e.mediana as mediana_grupo,
           e.p95     as p95_grupo,
           (b.valor / e.mediana) as vezes_a_mediana,
           e.linhas_no_grupo
      from base b
      join estat e using (grupo_verba)
     where e.mediana > 0
       and b.valor >= e.p95
       and b.valor >= 2 * e.mediana
     order by (b.valor / e.mediana) desc
     limit ${limite}
  `);
  return linhas.rows ?? [];
}

/**
 * Royalties CFEM por (ano, mês, substância) — bruto, sem agregação. A
 * composição (`lib/betim/royaltiesCfem.ts`) decide o ano mais recente e
 * agrega por ano/substância no JS, no mesmo padrão de `getAgroData` sobre
 * `producaoAgropecuaria`: a série inteira de uma cidade (poucas centenas de
 * linhas desde 2004) não justifica uma segunda ida ao banco só para achar o
 * ano mais recente.
 *
 * NUNCA some `valor` entre municípios — ver a migration 0044 e a docstring
 * de `etl/betim/etl/apis/anm_cfem.py`: a mesma guia da ANM pode aparecer
 * inteira em duas cidades quando o título minerário atravessa divisa. Somar
 * dentro de UM município (por ano, por substância) é seguro; entre
 * municípios não é — por isso esta função não aceita lista de cidades.
 */
export async function royaltiesCfemPorSubstancia(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: royalties_cfem.ano,
      mes: royalties_cfem.mes,
      substancia: royalties_cfem.substancia,
      valor: num(royalties_cfem.valor),
    })
    .from(royalties_cfem)
    .where(eq(royalties_cfem.id_municipio, idMunicipio))
    .orderBy(desc(royalties_cfem.ano), desc(royalties_cfem.mes));
}

/** Quem pagou CFEM, por ano — bruto; ver `royaltiesCfemPorSubstancia`. */
export async function royaltiesCfemPorEmpresa(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      ano: royalties_cfem_empresas.ano,
      empresa: royalties_cfem_empresas.empresa,
      qtde_titulos: royalties_cfem_empresas.qtde_titulos,
      valor_operacao: num(royalties_cfem_empresas.valor_operacao),
      valor_cfem: num(royalties_cfem_empresas.valor_cfem),
      pct_recolhimento: num(royalties_cfem_empresas.pct_recolhimento),
    })
    .from(royalties_cfem_empresas)
    .where(eq(royalties_cfem_empresas.id_municipio, idMunicipio))
    .orderBy(desc(royalties_cfem_empresas.ano), desc(royalties_cfem_empresas.valor_cfem));
}

function condicoesDeLicitacoes(
  idMunicipio: IdMunicipio,
  f: { ano?: number; situacao?: string; modalidade?: string; q?: string }
) {
  const cond = [eq(licitacoes.id_municipio, idMunicipio)];
  if (f.ano) cond.push(sql`extract(year from ${licitacoes.data_publicacao_pncp}) = ${f.ano}`);
  if (f.situacao) cond.push(eq(licitacoes.situacao, f.situacao));
  if (f.modalidade) cond.push(eq(licitacoes.modalidade_nome, f.modalidade));
  if (f.q) {
    const termo = `%${f.q}%`;
    cond.push(
      sql`(${licitacoes.objeto} ilike ${termo} or ${licitacoes.orgao_nome} ilike ${termo})`
    );
  }
  return and(...cond);
}

const COLUNAS_LICITACAO = {
  id: licitacoes.id,
  numero_controle_pncp: licitacoes.numero_controle_pncp,
  orgao_nome: licitacoes.orgao_nome,
  unidade_nome: licitacoes.unidade_nome,
  modalidade_nome: licitacoes.modalidade_nome,
  objeto: licitacoes.objeto,
  situacao: licitacoes.situacao,
  valor_estimado: num(licitacoes.valor_estimado),
  valor_homologado: num(licitacoes.valor_homologado),
  data_publicacao_pncp: licitacoes.data_publicacao_pncp,
  data_abertura: licitacoes.data_abertura,
  data_encerramento: licitacoes.data_encerramento,
  link_sistema_origem: licitacoes.link_sistema_origem,
};

/**
 * Página de licitações (PNCP) com o total do conjunto filtrado na mesma
 * consulta — mesmo padrão de `contratosPaginados`. `licitacoes` é a fase
 * ANTERIOR ao contrato (o processo de compra, não o ajuste assinado): as
 * duas tabelas convivem sem se sobrepor, e por isso ganham página própria
 * em vez de entrar no filtro de `prefeitura/contratos`.
 */
export async function licitacoesPaginadas(
  idMunicipio: IdMunicipio,
  filtros: {
    ano?: number;
    situacao?: string;
    modalidade?: string;
    q?: string;
    pagina?: number;
    porPagina?: number;
  } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = filtros.porPagina ?? 25;
  const pagina = Math.max(1, filtros.pagina ?? 1);
  return db
    .select({
      ...COLUNAS_LICITACAO,
      total: sql<number>`(count(*) over ())::int`,
      soma_estimado: sql<number>`(coalesce(sum(${licitacoes.valor_estimado}) over (), 0))::double precision`,
    })
    .from(licitacoes)
    .where(condicoesDeLicitacoes(idMunicipio, filtros))
    // Desempate por id: mesmo motivo de `contratosPaginados` — muitas
    // licitações compartilham a mesma `data_publicacao_pncp`.
    .orderBy(sql`${licitacoes.data_publicacao_pncp} desc nulls last`, asc(licitacoes.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

/** Totais do conjunto filtrado quando a página não tem nenhuma linha — mesmo motivo de `totaisDeContratos`. */
export async function totaisDeLicitacoes(
  idMunicipio: IdMunicipio,
  filtros: { ano?: number; situacao?: string; modalidade?: string; q?: string } = {}
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({
      total: sql<number>`count(*)::int`,
      soma_estimado: sql<number>`coalesce(sum(${licitacoes.valor_estimado}), 0)::double precision`,
    })
    .from(licitacoes)
    .where(condicoesDeLicitacoes(idMunicipio, filtros));
  return linha ?? { total: 0, soma_estimado: 0 };
}

/** Situações distintas de `licitacoes` no banco, pra popular o filtro sem chutar valores. */
export async function situacoesDeLicitacoesDisponiveis(idMunicipio: IdMunicipio): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .selectDistinct({ situacao: licitacoes.situacao })
    .from(licitacoes)
    .where(and(eq(licitacoes.id_municipio, idMunicipio), isNotNull(licitacoes.situacao)));
  return linhas.map((l) => l.situacao as string).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Modalidades distintas de `licitacoes` no banco, pra popular o filtro sem chutar valores. */
export async function modalidadesDeLicitacoesDisponiveis(idMunicipio: IdMunicipio): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .selectDistinct({ modalidade: licitacoes.modalidade_nome })
    .from(licitacoes)
    .where(and(eq(licitacoes.id_municipio, idMunicipio), isNotNull(licitacoes.modalidade_nome)));
  return linhas.map((l) => l.modalidade as string).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function condicoesDeVotacoes(idMunicipio: IdMunicipio, f: { ano?: number; q?: string }) {
  const cond = [eq(votacoes_camara.id_municipio, idMunicipio)];
  if (f.ano) cond.push(sql`extract(year from ${votacoes_camara.data}) = ${f.ano}`);
  if (f.q) {
    const termo = `%${f.q}%`;
    cond.push(
      sql`(${votacoes_camara.materia} ilike ${termo} or ${votacoes_camara.ementa} ilike ${termo})`
    );
  }
  return and(...cond);
}

/**
 * Página de votações nominais da Câmara, com o total do conjunto filtrado
 * na mesma consulta — mesmo padrão de `contratosPaginados`. O voto de cada
 * vereador NÃO vem aqui: viria por join com `votos_camara`, que multiplica
 * uma linha de votação em até ~55 linhas de voto e quebraria o
 * `count(*) over ()` do total. Ver `votosDeVotacoes`.
 */
export async function votacoesPaginadas(
  idMunicipio: IdMunicipio,
  filtros: { ano?: number; q?: string; pagina?: number; porPagina?: number } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = filtros.porPagina ?? 25;
  const pagina = Math.max(1, filtros.pagina ?? 1);
  return db
    .select({
      id: votacoes_camara.id,
      data: votacoes_camara.data,
      sessao: votacoes_camara.sessao,
      tipo_votacao: votacoes_camara.tipo_votacao,
      materia: votacoes_camara.materia,
      ementa: votacoes_camara.ementa,
      resultado: votacoes_camara.resultado,
      presentes: votacoes_camara.presentes,
      placar_sim: votacoes_camara.placar_sim,
      placar_nao: votacoes_camara.placar_nao,
      placar_abstencao: votacoes_camara.placar_abstencao,
      placar_branco: votacoes_camara.placar_branco,
      link_fonte: votacoes_camara.link_fonte,
      total: sql<number>`(count(*) over ())::int`,
    })
    .from(votacoes_camara)
    .where(condicoesDeVotacoes(idMunicipio, filtros))
    .orderBy(sql`${votacoes_camara.data} desc nulls last`, asc(votacoes_camara.id))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

/** Totais do conjunto filtrado quando a página não tem nenhuma linha — mesmo motivo de `totaisDeContratos`. */
export async function totaisDeVotacoes(
  idMunicipio: IdMunicipio,
  filtros: { ano?: number; q?: string } = {}
) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(votacoes_camara)
    .where(condicoesDeVotacoes(idMunicipio, filtros));
  return linha ?? { total: 0 };
}

/**
 * O voto de cada vereador nas votações indicadas — SEGUNDA consulta, batida
 * sobre os ids de UMA página (no máx. `porPagina`, hoje 25). Mesmo padrão de
 * `sancoesCeisPorCnpj`/`autoriaDeProposicoes` (Congresso): um join direto em
 * `votacoesPaginadas` multiplicaria cada votação em até ~55 linhas (uma por
 * vereador) e quebraria o `count(*) over ()` que dá o total da página.
 *
 * `vereador_id` é ANULÁVEL (ver migration 0041): o `<VotoContrario>` de São
 * Paulo registra dissidência em votação simbólica sem identificador — por
 * isso o join com `vereadores` é LEFT e `nome_fonte`/`partido_fonte` vêm
 * junto, para a tela ainda nomear quem votou mesmo sem a FK.
 *
 * Sem ORDER BY por nome de propósito: nomes com acento exigem
 * `localeCompare(..., "pt-BR")`, que não é a mesma coisa que a collation do
 * banco — ver o comentário equivalente em `queries/congresso.ts`. A
 * composição (`lib/betim/votacoesCamara.ts`) ordena em memória.
 */
export async function votosDeVotacoes(idMunicipio: IdMunicipio, votacaoIds: string[]) {
  const db = getDb();
  if (!db || votacaoIds.length === 0) return null;
  return db
    .select({
      votacao_id: votos_camara.votacao_id,
      vereador_id: votos_camara.vereador_id,
      nome_fonte: votos_camara.nome_fonte,
      partido_fonte: votos_camara.partido_fonte,
      voto: votos_camara.voto,
      origem: votos_camara.origem,
      slug: vereadores.slug,
      nome_urna: vereadores.nome_urna,
    })
    .from(votos_camara)
    .leftJoin(vereadores, eq(vereadores.id, votos_camara.vereador_id))
    .where(
      and(
        eq(votos_camara.id_municipio, idMunicipio),
        inArray(votos_camara.votacao_id, votacaoIds)
      )
    );
}

// ─────────────────── CAP · autuação ambiental estadual (MG) ───────────────────

/**
 * POR QUE TODA CONSULTA DESTA TABELA COMEÇA COM UMA CTE DE DEDUPLICAÇÃO.
 *
 * `cap_autos_infracao` tem grão (auto × dispositivo legal infringido): o AI
 * 316253 de Betim são DUAS linhas, mesmo auto, `dispositivo_legal` diferente
 * — e os valores (`valor_multa`, `valor_remanescente`, ...) vêm IDÊNTICOS nas
 * duas, porque na fonte eles pertencem ao AUTO, não ao dispositivo.
 *
 * Consequência prática: `count(*)` infla o número de autuações e `sum(valor)`
 * MULTIPLICA o dinheiro pelo número de dispositivos. Betim tem 9.621 linhas
 * para bem menos autos. Um `sum()` ingênuo aqui não dá erro nenhum — só
 * publica um valor errado com cara de exato, que é a pior falha possível num
 * portal de transparência.
 *
 * O `max()` dentro da CTE não é escolha estatística: é desempate de valores
 * que a fonte repete iguais. Onde eles pudessem divergir de verdade
 * (`status_ai` entre dispositivos do mesmo auto), a página mostra o campo
 * como "situação do auto", que é o que ele é na fonte.
 */
const CAP_AUTOS_DEDUP = (idMunicipio: IdMunicipio) => sql`
  select numero_ai,
         min(data_lavratura)                as data_lavratura,
         max(orgao_autuante)                as orgao,
         max(status_ai)                     as status_ai,
         max(status_debito)                 as status_debito,
         max(valor_multa)::float8           as valor_multa,
         max(valor_remanescente)::float8    as valor_remanescente
    from cap_autos_infracao
   where id_municipio = ${idMunicipio}
     and numero_ai is not null
   group by numero_ai
`;

export type CapFacetaAno = {
  ano: number;
  autos: number;
  multa: number;
};

export type CapFacetaTexto = {
  chave: string;
  autos: number;
  valor: number;
};

export type CapResumo = {
  total_autos: number;
  total_linhas: number;
  total_multa: number;
  total_remanescente: number;
  primeira_lavratura: string | null;
  ultima_lavratura: string | null;
  por_ano: CapFacetaAno[];
  por_orgao: CapFacetaTexto[];
  por_debito: CapFacetaTexto[];
};

/**
 * Resumo do CAP para um município, em UMA ida ao banco.
 *
 * Uma ida só, e nenhuma linha crua atravessando: BH tem 26.764 linhas nesta
 * tabela e trazê-las para agregar no JS (o padrão de `royaltiesCfemPorSubstancia`,
 * que serve para séries de poucas centenas de linhas) repetiria exatamente a
 * falha já medida em produção — uma rota que carregou 2.369 ementas inteiras
 * pôs 12 de 28 rotas em 503 por estourar CPU do Worker. Aqui o banco devolve
 * um punhado de agregados e mais nada.
 *
 * `null` = banco não configurado (mesmo sinal do resto do arquivo).
 */
export async function capResumo(idMunicipio: IdMunicipio): Promise<CapResumo | null> {
  const db = getDb();
  if (!db) return null;
  const linhas = await db.execute<CapResumo>(sql`
    with autos as (${CAP_AUTOS_DEDUP(idMunicipio)}),
    por_ano as (
      select extract(year from data_lavratura)::int as ano,
             count(*)::int                          as autos,
             coalesce(sum(valor_multa), 0)::float8  as multa
        from autos
       where data_lavratura is not null
       group by 1
       order by 1 desc
       limit 15
    ),
    por_orgao as (
      select coalesce(orgao, 'Não informado')       as chave,
             count(*)::int                          as autos,
             coalesce(sum(valor_multa), 0)::float8  as valor
        from autos
       group by 1
       order by 2 desc
    ),
    por_debito as (
      select coalesce(status_debito, 'Não informado')      as chave,
             count(*)::int                                 as autos,
             coalesce(sum(valor_remanescente), 0)::float8  as valor
        from autos
       group by 1
       order by 2 desc
    )
    select
      (select count(*)::int from autos)                                       as total_autos,
      (select count(*)::int from cap_autos_infracao
        where id_municipio = ${idMunicipio})                                  as total_linhas,
      (select coalesce(sum(valor_multa), 0)::float8 from autos)               as total_multa,
      (select coalesce(sum(valor_remanescente), 0)::float8 from autos)        as total_remanescente,
      (select min(data_lavratura)::text from autos)                           as primeira_lavratura,
      (select max(data_lavratura)::text from autos)                           as ultima_lavratura,
      -- json_agg(t) sobre o ALIAS da CTE, e não json_agg(cte.*): a segunda
      -- forma depende de o planner expor a CTE como composite. Sem crase
      -- neste comentário: ele vive dentro de um template literal de JS.
      coalesce((select json_agg(t) from por_ano t),    '[]'::json)            as por_ano,
      coalesce((select json_agg(t) from por_orgao t),  '[]'::json)            as por_orgao,
      coalesce((select json_agg(t) from por_debito t), '[]'::json)            as por_debito
  `);
  return (linhas.rows ?? [])[0] ?? null;
}

export type CapAutoRecente = {
  numero_ai: string;
  data_lavratura: string | null;
  nome_autuado: string | null;
  cpf_cnpj: string | null;
  orgao_autuante: string | null;
  unidade_atual: string | null;
  status_ai: string | null;
  status_processo: string | null;
  status_debito: string | null;
  valor_multa: number | null;
  valor_remanescente: number | null;
  qtd_dispositivos: number;
  dispositivos: string | null;
  tem_embargo: boolean;
  tem_apreensao: boolean;
  tem_demolicao: boolean;
};

/**
 * Os autos mais recentes, um por `numero_ai` — com a contagem de dispositivos
 * que aquele auto tem, para que o leitor VEJA por que a soma de linhas é maior
 * que a soma de autos em vez de ter que acreditar num rodapé.
 *
 * `limite` é teto duro de payload, não paginação: esta página não aceita
 * `searchParams` (ver `docs/deploy-github-pages.md` — as rotas que aceitam são
 * justamente as que travam o modo estático).
 */
export async function capAutosRecentes(
  idMunicipio: IdMunicipio,
  limite = 25
): Promise<CapAutoRecente[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<CapAutoRecente>(sql`
    select numero_ai,
           max(data_lavratura)::text          as data_lavratura,
           max(nome_autuado)                  as nome_autuado,
           max(cpf_cnpj)                      as cpf_cnpj,
           max(orgao_autuante)                as orgao_autuante,
           max(unidade_atual)                 as unidade_atual,
           max(status_ai)                     as status_ai,
           max(status_processo)               as status_processo,
           max(status_debito)                 as status_debito,
           max(valor_multa)::float8           as valor_multa,
           max(valor_remanescente)::float8    as valor_remanescente,
           count(*)::int                      as qtd_dispositivos,
           string_agg(distinct dispositivo_legal, ' · ') as dispositivos,
           bool_or(pen_embargo_obra = 'S' or pen_embargo_atividade = 'S') as tem_embargo,
           bool_or(pen_apreensao = 'S')       as tem_apreensao,
           bool_or(pen_demolicao = 'S')       as tem_demolicao
      from cap_autos_infracao
     where id_municipio = ${idMunicipio}
       and numero_ai is not null
     group by numero_ai
     order by max(data_lavratura) desc nulls last, numero_ai desc
     limit ${limite}
  `);
  return linhas.rows ?? [];
}
