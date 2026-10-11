import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { comBancoReserva } from "@/lib/db/reserva";
import { ambiental_licenciamento, ref_municipios_mg } from "@/lib/db/schema";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_LICENCIAMENTO } from "@/lib/ambiental/tags-licenciamento";

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
  /** Tags de assunto inferidas dos campos de texto da fonte. */
  tags: string[];
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
    tags: extrairTagsDeCampos(
      [
        l.setor_rotulo,
        l.subsetor,
        l.atividade_descricao,
        l.modalidade,
        l.fase_licenciamento,
        l.situacao,
        l.nome_empreendimento,
      ],
      REGRAS_TAGS_LICENCIAMENTO
    ),
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
  return comBancoReserva(
    async (db) => {
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
    },
    {
      vazio: (r) => r.total === 0,
      padrao: { total: 0, porSetor: [], porModalidade: [], porClasse: [] },
      rotulo: "licenciamento",
    }
  );
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
  return comBancoReserva(
    async (db) => {
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
    },
    {
      vazio: (r) => r.porAno.length === 0 && r.semDataEmissao === 0,
      padrao: { porAno: [], semDataEmissao: 0 },
      rotulo: "licenciamento",
    }
  );
}

export interface MunicipioComLicenciamento {
  idIbge: string;
  nome: string;
  /** 0 = município sem licença na fonte. A lacuna é informação (AGENTS §7):
   *  a busca mostra o município com a marca "sem registro na fonte" em vez
   *  de escondê-lo. */
  total: number;
}

/**
 * Todos os 853 municípios de MG, do mais licenciado ao menos — alimenta a
 * busca de `/ambiental/licenciamento` e o `generateStaticParams` de
 * `/ambiental/licenciamento/municipio/[idIbge]` (esse filtra `total > 0`;
 * cidade sem dado não tem página própria — a rota chama `notFound()`).
 *
 * Mudança de 10/10/2026: a query era um `INNER JOIN` partindo da tabela de
 * licenças, que só devolvia os municípios COM dado — a tela dizia "853"
 * mas a lista trazia só 145 (medido no banco de produção: 8.612 licenças
 * em 145 municípios). Agora a base é `ref_municipios_mg` com `LEFT JOIN`
 * das licenças: saem os 853, e os 708 sem dado vêm com `total: 0`.
 *
 * Dois detalhes que mudam o SQL e não são gosto:
 * - `count(ambiental_licenciamento.id_fonte)`, nunca `count(*)`: com
 *   `LEFT JOIN`, município sem dado vira UMA linha só de NULL e `count(*)`
 *   devolveria 1 — mentiria "1 licença" para 0;
 * - `ref_municipios_mg` tem 854 linhas: as 853 de MG + o grandfather de
 *   cidade fora de MG (São Paulo, 3550308, migration 0057). O
 *   `like '31%'` (dígito de estado no código IBGE de MG) corta a linha de
 *   fora — mesma técnica de `lib/ambiental/barragens.ts`.
 */
export async function listarMunicipiosComLicenciamento(): Promise<MunicipioComLicenciamento[]> {
  return comBancoReserva(
    async (db) =>
      db
        .select({
          idIbge: ref_municipios_mg.id_ibge,
          nome: ref_municipios_mg.nome,
          total: sql<number>`count(${ambiental_licenciamento.id_fonte})::int`,
        })
        .from(ref_municipios_mg)
        .leftJoin(
          ambiental_licenciamento,
          eq(ambiental_licenciamento.id_municipio, ref_municipios_mg.id_ibge)
        )
        .where(sql`${ref_municipios_mg.id_ibge} like '31%'`)
        .groupBy(ref_municipios_mg.id_ibge, ref_municipios_mg.nome)
        // Desempate por nome: os 708 zeros ficam em ordem alfabética e
        // estável — sem isso a lista "pula" entre renders.
        .orderBy(
          desc(sql`count(${ambiental_licenciamento.id_fonte})`),
          asc(ref_municipios_mg.nome)
        ),
    { vazio: (r) => r.length === 0, padrao: [], rotulo: "licenciamento" }
  );
}

/** Nome oficial de um município (de `ref_municipios_mg`), para o título da
 * página — não confundir com `municipioFonte` de cada linha, que é a
 * grafia crua da fonte (F0 §1.2: nome, não código IBGE). */
export async function nomeMunicipioMg(idIbge: string): Promise<string | null> {
  return comBancoReserva(
    async (db) => {
      const [linha] = await db
        .select({ nome: ref_municipios_mg.nome })
        .from(ref_municipios_mg)
        .where(eq(ref_municipios_mg.id_ibge, idIbge))
        .limit(1);
      return linha?.nome ?? null;
    },
    { vazio: (r) => r === null, padrao: null, rotulo: "licenciamento" }
  );
}

/** Todas as licenças de um município, mais recente primeiro (por data de
 * emissão; licenças sem data — poucas — vão ao final). */
export async function listarLicencasPorMunicipio(idIbge: string): Promise<LicencaAmbiental[]> {
  return comBancoReserva(
    async (db) => {
      const linhas = await db
        .select()
        .from(ambiental_licenciamento)
        .where(eq(ambiental_licenciamento.id_municipio, idIbge))
        .orderBy(desc(ambiental_licenciamento.data_emissao), asc(ambiental_licenciamento.setor_letra));
      return linhas.map(paraLicenca);
    },
    { vazio: (r) => r.length === 0, padrao: [], rotulo: "licenciamento" }
  );
}
