import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ambiental_licenciamento, ref_municipios_mg } from "@/lib/db/schema";

/**
 * Queries de `/ambiental/licenciamento`.
 *
 * Método de coleta e as armadilhas medidas (dígito verificador do
 * documento, `link` duplicado na fonte, CPF colado no nome, setor sempre
 * por `cod_atvpri`) estão em `etl/betim/etl/apis/ambiental_licenciamento.py`
 * e na migration `0063_ambiental_licenciamento.sql` — este arquivo só lê o
 * resultado.
 */

export interface LicencaAmbiental {
  idFonte: number;
  idMunicipio: string;
  municipioFonte: string;
  setorLetra: string;
  setorRotulo: string;
  subsetor: string;
  atividadeCodigo: string;
  atividadeDescricao: string | null;
  modalidade: string;
  classe: number | null;
  faseLicenciamento: string;
  situacao: string;
  tipoSolicitacao: string | null;
  numeroSolicitacao: string | null;
  numeroProcesso: string | null;
  documentoClassificacao: string;
  cnpjRaiz: string | null;
  ehPessoaFisica: boolean;
  nomeEmpreendimento: string | null;
  latitude: number | null;
  longitude: number | null;
  dataEmissao: string | null;
  dataValidade: string | null;
  link: string | null;
}

function paraLicenca(l: typeof ambiental_licenciamento.$inferSelect): LicencaAmbiental {
  return {
    idFonte: l.id_fonte,
    idMunicipio: l.id_municipio,
    municipioFonte: l.municipio_fonte,
    setorLetra: l.setor_letra,
    setorRotulo: l.setor_rotulo,
    subsetor: l.subsetor,
    atividadeCodigo: l.atividade_codigo,
    atividadeDescricao: l.atividade_descricao,
    modalidade: l.modalidade,
    classe: l.classe,
    faseLicenciamento: l.fase_licenciamento,
    situacao: l.situacao,
    tipoSolicitacao: l.tipo_solicitacao,
    numeroSolicitacao: l.numero_solicitacao,
    numeroProcesso: l.numero_processo,
    documentoClassificacao: l.documento_classificacao,
    cnpjRaiz: l.cnpj_raiz,
    ehPessoaFisica: l.eh_pessoa_fisica,
    nomeEmpreendimento: l.nome_empreendimento,
    latitude: l.latitude === null ? null : Number(l.latitude),
    longitude: l.longitude === null ? null : Number(l.longitude),
    dataEmissao: l.data_emissao,
    dataValidade: l.data_validade,
    link: l.link,
  };
}

export interface ContagemLicenciamento {
  total: number;
  porSetor: { letra: string; rotulo: string; total: number }[];
  porModalidade: { modalidade: string; total: number }[];
  porClasse: { classe: number | null; total: number }[];
}

/**
 * Os números reais que `/ambiental` e `/ambiental/licenciamento` mostram —
 * nunca o "19.162 licenças" fixo que o card antigo tinha (ver a nota em
 * `app/ambiental/page.tsx`).
 */
export async function contarLicenciamento(): Promise<ContagemLicenciamento> {
  const db = getDb();
  if (!db) return { total: 0, porSetor: [], porModalidade: [], porClasse: [] };

  const [totalRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(ambiental_licenciamento);

  const porSetor = await db
    .select({
      letra: ambiental_licenciamento.setor_letra,
      rotulo: ambiental_licenciamento.setor_rotulo,
      total: sql<number>`count(*)::int`,
    })
    .from(ambiental_licenciamento)
    .groupBy(ambiental_licenciamento.setor_letra, ambiental_licenciamento.setor_rotulo)
    .orderBy(asc(ambiental_licenciamento.setor_letra));

  const porModalidade = await db
    .select({
      modalidade: ambiental_licenciamento.modalidade,
      total: sql<number>`count(*)::int`,
    })
    .from(ambiental_licenciamento)
    .groupBy(ambiental_licenciamento.modalidade)
    .orderBy(desc(sql`count(*)`));

  const porClasse = await db
    .select({
      classe: ambiental_licenciamento.classe,
      total: sql<number>`count(*)::int`,
    })
    .from(ambiental_licenciamento)
    .groupBy(ambiental_licenciamento.classe)
    .orderBy(asc(ambiental_licenciamento.classe));

  return { total: totalRow?.n ?? 0, porSetor, porModalidade, porClasse };
}

export interface LicenciamentoPorAno {
  ano: number;
  total: number;
}

export interface ContagemLicenciamentoPorAno {
  porAno: LicenciamentoPorAno[];
  /** Licenças sem `data_emissao` na fonte — nunca somadas em silêncio a um
   *  ano, aparecem como categoria própria na página. */
  semDataEmissao: number;
}

/**
 * Série temporal para o gráfico "por ano" de `/ambiental/licenciamento` —
 * agregada no banco (nunca traz uma linha por licença). Mesmo padrão de
 * `verbasPorAno` em `lib/db/queries/betim.ts`: `extract(year from …)` no
 * `groupBy`/`orderBy`, com as linhas sem data contadas à parte em vez de
 * caírem num "ano" inventado.
 */
export async function contarLicenciamentoPorAno(): Promise<ContagemLicenciamentoPorAno> {
  const db = getDb();
  if (!db) return { porAno: [], semDataEmissao: 0 };

  const porAno = await db
    .select({
      ano: sql<number>`extract(year from ${ambiental_licenciamento.data_emissao})::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(ambiental_licenciamento)
    .where(isNotNull(ambiental_licenciamento.data_emissao))
    .groupBy(sql`extract(year from ${ambiental_licenciamento.data_emissao})`)
    .orderBy(sql`extract(year from ${ambiental_licenciamento.data_emissao}) asc`);

  const [semData] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(ambiental_licenciamento)
    .where(isNull(ambiental_licenciamento.data_emissao));

  return { porAno, semDataEmissao: semData?.n ?? 0 };
}

export interface MunicipioComLicenciamento {
  idIbge: string;
  nome: string;
  total: number;
}

/**
 * Municípios com pelo menos 1 licença, do mais licenciado ao menos —
 * alimenta a busca de `/ambiental/licenciamento` e o
 * `generateStaticParams` de `/ambiental/licenciamento/municipio/[idIbge]`.
 */
export async function listarMunicipiosComLicenciamento(): Promise<MunicipioComLicenciamento[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select({
      idIbge: ambiental_licenciamento.id_municipio,
      nome: ref_municipios_mg.nome,
      total: sql<number>`count(*)::int`,
    })
    .from(ambiental_licenciamento)
    .innerJoin(ref_municipios_mg, eq(ambiental_licenciamento.id_municipio, ref_municipios_mg.id_ibge))
    .groupBy(ambiental_licenciamento.id_municipio, ref_municipios_mg.nome)
    .orderBy(desc(sql`count(*)`));
  return linhas;
}

/** Nome oficial de um município (de `ref_municipios_mg`), para o título da
 * página — não confundir com `municipioFonte` de cada linha, que é a
 * grafia crua da fonte (F0 §1.2: nome, não código IBGE). */
export async function nomeMunicipioMg(idIbge: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select({ nome: ref_municipios_mg.nome })
    .from(ref_municipios_mg)
    .where(eq(ref_municipios_mg.id_ibge, idIbge))
    .limit(1);
  return linha?.nome ?? null;
}

/** Todas as licenças de um município, mais recente primeiro (por data de
 * emissão; licenças sem data — poucas — vão ao final). */
export async function listarLicencasPorMunicipio(idIbge: string): Promise<LicencaAmbiental[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select()
    .from(ambiental_licenciamento)
    .where(eq(ambiental_licenciamento.id_municipio, idIbge))
    .orderBy(desc(ambiental_licenciamento.data_emissao), asc(ambiental_licenciamento.setor_letra));
  return linhas.map(paraLicenca);
}
