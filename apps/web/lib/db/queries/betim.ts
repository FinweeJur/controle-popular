import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import { ptBr } from "@/lib/db/ordem";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import {
  anuncios,
  atos_oficiais,
  beneficios_sociais,
  caixa_disponivel,
  classificados,
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
  noticias,
  nota_transparencia,
  obras,
  paraopeba_iniciativas,
  paraopeba_saldo_municipio,
  postos_anp,
  producao_agropecuaria,
  proposicoes,
  seguranca_ocorrencias,
  servidores,
  verbas_indenizatorias,
  vereadores,
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
export async function listarServidores(
  idMunicipio: IdMunicipio,
  opts: { q?: string; orgao?: string; pagina?: number; porPagina?: number } = {}
) {
  const db = getDb();
  if (!db) return null;
  const porPagina = opts.porPagina ?? 50;
  const pagina = Math.max(1, opts.pagina ?? 1);

  const cond = [eq(servidores.id_municipio, idMunicipio)];
  if (opts.orgao) cond.push(eq(servidores.orgao, opts.orgao));
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
 * NÃO seleciona `temas`: a coluna da migration 0025 **não existe no banco**
 * — verificado por introspecção no Neon e por `select=temas` no PostgREST
 * do Supabase, que responde 42703. O `comColunaOpcional()` do código antigo
 * caía sempre no fallback, então o ranking por área e o filtro `?tema=`
 * desta página já nasciam vazios em produção.
 */
export async function atosOficiais(idMunicipio: IdMunicipio) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({
      tipo: atos_oficiais.tipo,
      numero: atos_oficiais.numero,
      ano: atos_oficiais.ano,
      ementa: atos_oficiais.ementa,
      data_publicacao: atos_oficiais.data_publicacao,
    })
    .from(atos_oficiais)
    .where(eq(atos_oficiais.id_municipio, idMunicipio))
    .orderBy(
      sql`${atos_oficiais.data_publicacao} desc nulls last`,
      asc(atos_oficiais.id)
    );
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
};

/**
 * Iniciativas do Paraopeba, maior valor primeiro.
 *
 * NÃO seleciona `percentual_planejado`: a coluna da migration 0026 não
 * existe no banco — mesmo caso de `atos_oficiais.temas`. O
 * `comColunaOpcional()` caía sempre no fallback, então o "executado vs
 * planejado" da página já nascia sem o planejado.
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
