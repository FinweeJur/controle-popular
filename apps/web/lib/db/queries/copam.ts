import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { copam_pauta_itens, copam_reunioes } from "@/lib/db/schema";

/**
 * Queries da zona /ambiental/copam.
 *
 * Método de coleta e as armadilhas medidas estão em
 * `etl/betim/etl/apis/copam_reunioes.py` e em `docs/ambiental/F0-discovery.md`
 * §14 — não repetir aqui. O que este arquivo formata é só a leitura.
 *
 * `municipios_ids`/`municipios_nomes` são arrays PARALELOS (migration 0058):
 * um item pode tratar de mais de um município. Nunca tratar como 1:1.
 */

export interface ReuniaoCopam {
  idFonte: number;
  titulo: string;
  data: string;
  camaraTecnica: string | null;
  regional: string | null;
  situacao: string;
  linkDetalhe: string;
  linkPautaPdf: string | null;
  linkDecisaoPdf: string | null;
  linkAtaPdf: string | null;
  qtdItensPauta: number;
}

export interface ItemPautaCopam {
  numeroItem: string;
  processo: string | null;
  empreendimento: string | null;
  municipiosIds: string[];
  municipiosNomes: string[];
  municipioFonte: string | null;
  decisao: string | null;
  textoPauta: string;
  linkDocumento: string | null;
}

export interface ItemPautaCopamComReuniao extends ItemPautaCopam {
  reuniao: ReuniaoCopam;
}

function paraReuniao(r: typeof copam_reunioes.$inferSelect): ReuniaoCopam {
  return {
    idFonte: r.id_fonte,
    titulo: r.titulo,
    data: r.data,
    camaraTecnica: r.camara_tecnica,
    regional: r.regional,
    situacao: r.situacao,
    linkDetalhe: r.link_detalhe,
    linkPautaPdf: r.link_pauta_pdf,
    linkDecisaoPdf: r.link_decisao_pdf,
    linkAtaPdf: r.link_ata_pdf,
    qtdItensPauta: r.qtd_itens_pauta,
  };
}

function paraItem(i: typeof copam_pauta_itens.$inferSelect): ItemPautaCopam {
  return {
    numeroItem: i.numero_item,
    processo: i.processo,
    empreendimento: i.empreendimento,
    municipiosIds: i.municipios_ids,
    municipiosNomes: i.municipios_nomes,
    municipioFonte: i.municipio_fonte,
    decisao: i.decisao,
    textoPauta: i.texto_pauta,
    linkDocumento: i.link_documento,
  };
}

/**
 * O número real que `/ambiental` mostra em vez do "454 reuniões" estático
 * — ver a nota em `app/ambiental/page.tsx`. Conta o que está NO BANCO, não
 * o que a fonte publica (isso é `qtdReunioesNaFonte`, abaixo, só para dar
 * contexto de cobertura).
 */
export async function contarReunioesCopam(): Promise<{
  reunioes: number;
  itens: number;
  itensComMunicipio: number;
}> {
  const db = getDb();
  if (!db) return { reunioes: 0, itens: 0, itensComMunicipio: 0 };
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(copam_reunioes);
  const [i] = await db.select({ n: sql<number>`count(*)::int` }).from(copam_pauta_itens);
  // `cardinality > 0`: item com o array de municípios vazio não foi
  // identificado (ou é política geral sem local, ver
  // `etl.apis.copam_reunioes._eh_administrativo`) — nunca contar como êxito.
  const [c] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(copam_pauta_itens)
    .where(sql`cardinality(${copam_pauta_itens.municipios_ids}) > 0`);
  return { reunioes: r?.n ?? 0, itens: i?.n ?? 0, itensComMunicipio: c?.n ?? 0 };
}

/** Reuniões mais recentes, mais nova primeiro. */
export async function listarReunioesCopamRecentes(limite = 40): Promise<ReuniaoCopam[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select()
    .from(copam_reunioes)
    .orderBy(desc(copam_reunioes.data), desc(copam_reunioes.id_fonte))
    .limit(limite);
  return linhas.map(paraReuniao);
}

/** Todos os `id_fonte`, para `generateStaticParams` da rota de detalhe. */
export async function idsFonteReunioesCopam(): Promise<number[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select({ id_fonte: copam_reunioes.id_fonte })
    .from(copam_reunioes);
  return linhas.map((l) => l.id_fonte);
}

/** Uma reunião pelo `id_fonte` (o `?id=` da fonte), com os itens de pauta. */
export async function obterReuniaoCopamPorIdFonte(
  idFonte: number
): Promise<{ reuniao: ReuniaoCopam; itens: ItemPautaCopam[] } | null> {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(copam_reunioes)
    .where(eq(copam_reunioes.id_fonte, idFonte))
    .limit(1);
  if (!linha) return null;
  const itens = await db
    .select()
    .from(copam_pauta_itens)
    .where(eq(copam_pauta_itens.id_reuniao, linha.id))
    .orderBy(asc(copam_pauta_itens.numero_item));
  return { reuniao: paraReuniao(linha), itens: itens.map(paraItem) };
}

export interface MunicipioComItensCopam {
  idIbge: string;
  nome: string;
  qtdItens: number;
}

/**
 * Municípios com pelo menos 1 item de pauta, do mais citado ao menos —
 * alimenta o seletor de "ver por município" e o `generateStaticParams` da
 * rota `/ambiental/copam/municipio/[idIbge]`.
 *
 * `unnest` sobre o array: cada item pode contribuir para mais de um
 * município (a nota do topo do arquivo) — contar direto do array sem
 * desaninhar contaria "Itabirito, Nova Lima e Rio Acima" como 1 linha só,
 * não 3.
 */
export async function listarMunicipiosComItensCopam(): Promise<MunicipioComItensCopam[]> {
  const db = getDb();
  if (!db) return [];
  // `linhas.rows ?? []`: `db.execute()` devolve `NeonHttpQueryResult`, não
  // um array — mesmo desembrulho que os outros ~13 call sites deste padrão
  // (ver a nota em `lib/db/client.ts`).
  const linhas = await db.execute<{ id_ibge: string; nome: string; qtd: number }>(sql`
    select m.id_ibge, m.nome, count(*)::int as qtd
    from copam_pauta_itens i,
         unnest(i.municipios_ids, i.municipios_nomes) as m(id_ibge, nome)
    group by m.id_ibge, m.nome
    order by qtd desc, m.nome asc
  `);
  return (linhas.rows ?? []).map((l) => ({ idIbge: l.id_ibge, nome: l.nome, qtdItens: l.qtd }));
}

/**
 * Itens de pauta que citam um município, com a reunião de cada um — mais
 * recente primeiro. Casa por `id_ibge` DENTRO do array (`= any(...)`), não
 * por igualdade de array inteiro — um item com 3 municípios aparece nas 3
 * páginas de município, corretamente.
 */
export async function listarItensCopamPorMunicipio(
  idIbge: string
): Promise<ItemPautaCopamComReuniao[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select({ item: copam_pauta_itens, reuniao: copam_reunioes })
    .from(copam_pauta_itens)
    .innerJoin(copam_reunioes, eq(copam_pauta_itens.id_reuniao, copam_reunioes.id))
    .where(sql`${idIbge} = any(${copam_pauta_itens.municipios_ids})`)
    .orderBy(desc(copam_reunioes.data));
  return linhas.map((l) => ({ ...paraItem(l.item), reuniao: paraReuniao(l.reuniao) }));
}
