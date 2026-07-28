import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import {
  beneficios_sociais,
  caixa_disponivel,
  classificados,
  comercios_essenciais,
  escolas,
  indicadores,
  nota_transparencia,
  obras,
  postos_anp,
  seguranca_ocorrencias,
  servidores,
  verbas_indenizatorias,
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

export async function caixaDisponivel(idMunicipio: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select({ ano: caixa_disponivel.ano, valor: num(caixa_disponivel.valor) })
    .from(caixa_disponivel)
    .where(eq(caixa_disponivel.id_municipio, idMunicipio))
    .orderBy(desc(caixa_disponivel.ano))
    .limit(2);
}

export async function listarIndicadores(idMunicipio: string, nomes?: string[]) {
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

export async function listarObras(idMunicipio: string) {
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

export async function listarPostos(idMunicipio: string, bandeira?: string) {
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
    .orderBy(asc(postos_anp.razao_social));
}

export async function ocorrenciasSeguranca(idMunicipio: string) {
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
  idMunicipio: string,
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
    .orderBy(asc(servidores.nome), asc(servidores.cargo))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);
}

export async function beneficiosSociais(idMunicipio: string) {
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

export async function verbasIndenizatorias(idMunicipio: string, vereadorId?: string) {
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

export async function notaTransparencia(idMunicipio: string) {
  const db = getDb();
  if (!db) return null;
  return db
    .select()
    .from(nota_transparencia)
    .where(eq(nota_transparencia.id_municipio, idMunicipio))
    .orderBy(desc(nota_transparencia.ano));
}

export async function comerciosEssenciais(idMunicipio: string) {
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
export async function listarEscolas(idMunicipio: string) {
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
    .orderBy(asc(escolas.nome));
}

/** Classificados aprovados e ainda no prazo. */
export async function classificadosVigentes(idMunicipio: string) {
  const db = getDb();
  if (!db) return null;
  const hoje = new Date().toISOString().slice(0, 10);
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
    .where(
      and(
        eq(classificados.id_municipio, idMunicipio),
        eq(classificados.aprovado, true),
        gte(classificados.expira_em, hoje)
      )
    )
    .orderBy(desc(classificados.created_at));
}
