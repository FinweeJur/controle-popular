import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { num } from "@/lib/db/num";
import { feam_barragens, ref_municipios_mg, snisb_barragens } from "@/lib/db/schema";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_BARRAGENS } from "@/lib/ambiental/tags-barragens";

/**
 * Queries ESTADUAIS da zona `/ambiental/barragens` — Minas Gerais inteira,
 * sem recorte por cidade do portal.
 *
 * Duas fontes, e elas NÃO SE SUBSTITUEM (ver `docs/ambiental/F0-discovery.md`
 * §5, §11 e §13.3.1):
 *   - `feam_barragens`: só mineração e indústria (249, em 58 municípios),
 *     mas é quem tem condição de estabilidade, nível de emergência e método
 *     construtivo — o "semáforo" que este eixo destaca.
 *   - `snisb_barragens`: todos os usos (abastecimento, irrigação,
 *     hidrelétrica) em MG (2.212, filtro de UF pelo prefixo '31' do código
 *     IBGE — a fonte não publica UF, só nome + sigla, ver §11.1), mas o
 *     campo de nível de perigo vem vazio em ~97% das linhas.
 * "Zero na FEAM" NUNCA é lido como "sem barragem": é só fora do escopo dela.
 *
 * A composição POR MUNICÍPIO (casamento por nome normalizado, falível e
 * documentado) já existe em `lib/betim/barragens.ts` — a rota
 * `/ambiental/barragens/municipio/[idIbge]` reaproveita `getBarragensData`
 * de lá em vez de duplicar o algoritmo. Este arquivo só tem as consultas
 * QUE SÃO estaduais: contagem, o inventário completo da FEAM (alimenta o
 * filtro por nível de emergência/condição de estabilidade/categoria de
 * risco) e a lista de municípios para a busca.
 */

export interface ContagemBarragensMg {
  totalFeam: number;
  municipiosFeam: number;
  totalSnisb: number;
  municipiosSnisb: number;
  emEmergencia: number;
  nivel3: number;
  semEstabilidadeAtestada: number;
}

const CONTAGEM_VAZIA: ContagemBarragensMg = {
  totalFeam: 0,
  municipiosFeam: 0,
  totalSnisb: 0,
  municipiosSnisb: 0,
  emEmergencia: 0,
  nivel3: 0,
  semEstabilidadeAtestada: 0,
};

export async function contarBarragensMg(): Promise<ContagemBarragensMg> {
  const db = getDb();
  if (!db) return CONTAGEM_VAZIA;

  const [feam] = await db
    .select({
      total: sql<number>`count(*)::int`,
      municipios: sql<number>`count(distinct ${feam_barragens.id_municipio})::int`,
      emEmergencia: sql<number>`count(*) filter (where ${feam_barragens.nivel_emergencia} >= 1)::int`,
      nivel3: sql<number>`count(*) filter (where ${feam_barragens.nivel_emergencia} = 3)::int`,
      // `is not null`: 2 linhas vêm com condição vazia na fonte — diferente
      // de "Não Atestada"/"Não apresentou", que SÃO os 31 desta contagem
      // (ver §5). Contar o vazio junto inflaria para 33.
      semEstabilidade: sql<number>`count(*) filter (where ${feam_barragens.condicao_estabilidade} is not null and ${feam_barragens.condicao_estabilidade} <> 'Atestada')::int`,
    })
    .from(feam_barragens);

  const [snisb] = await db
    .select({
      total: sql<number>`count(*)::int`,
      municipios: sql<number>`count(distinct ${snisb_barragens.id_municipio})::int`,
    })
    .from(snisb_barragens)
    // Sem join: `id_municipio` já É o código IBGE (FK para
    // `ref_municipios_mg.id_ibge`), e todo código de MG começa com '31'.
    // A tabela tem grandfather de São Paulo (outra cidade do portal, fora
    // desta zona estadual) — migration 0057 — por isso o filtro é preciso,
    // não decorativo.
    .where(sql`${snisb_barragens.id_municipio} like '31%'`);

  return {
    totalFeam: feam?.total ?? 0,
    municipiosFeam: feam?.municipios ?? 0,
    totalSnisb: snisb?.total ?? 0,
    municipiosSnisb: snisb?.municipios ?? 0,
    emEmergencia: feam?.emEmergencia ?? 0,
    nivel3: feam?.nivel3 ?? 0,
    semEstabilidadeAtestada: feam?.semEstabilidade ?? 0,
  };
}

export interface BarragemFeamMg {
  idIbge: string;
  municipio: string;
  nome: string;
  empreendedor: string | null;
  atividade: string | null;
  finalidade: string | null;
  situacao: string | null;
  condicaoEstabilidade: string | null;
  metodoConstrutivo: string | null;
  categoriaRisco: string | null;
  danoPotencial: string | null;
  nivelEmergencia: number | null;
  suspensao: string | null;
  alturaM: number | null;
  /** Tags de assunto inferidas dos campos de texto da fonte. */
  tags: string[];
}

/**
 * As 249 barragens da FEAM, uma a uma, com o nome do município resolvido.
 * É o dado que alimenta o filtro por nível de emergência/condição de
 * estabilidade/categoria de risco na página principal — só a FEAM preenche
 * esse vocabulário (ver a docstring do arquivo). 249 linhas cabem inteiras
 * no cliente, mesmo raciocínio de `BuscaMunicipio` do COPAM.
 */
export async function listarBarragensFeamMg(): Promise<BarragemFeamMg[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select({
      idIbge: feam_barragens.id_municipio,
      municipio: ref_municipios_mg.nome,
      nome: feam_barragens.nome,
      empreendedor: feam_barragens.empreendedor,
      atividade: feam_barragens.atividade,
      finalidade: feam_barragens.finalidade,
      situacao: feam_barragens.situacao,
      condicaoEstabilidade: feam_barragens.condicao_estabilidade,
      metodoConstrutivo: feam_barragens.metodo_construtivo,
      categoriaRisco: feam_barragens.categoria_risco,
      danoPotencial: feam_barragens.dano_potencial,
      nivelEmergencia: feam_barragens.nivel_emergencia,
      suspensao: feam_barragens.suspensao,
      alturaM: num(feam_barragens.altura_m),
    })
    .from(feam_barragens)
    .innerJoin(ref_municipios_mg, eq(feam_barragens.id_municipio, ref_municipios_mg.id_ibge))
    .orderBy(desc(feam_barragens.nivel_emergencia), asc(ref_municipios_mg.nome), asc(feam_barragens.nome));
  return linhas.map((b) => ({
    ...b,
    tags: extrairTagsDeCampos(
      [
        b.nome,
        b.atividade,
        b.finalidade,
        b.situacao,
        b.condicaoEstabilidade,
        b.metodoConstrutivo,
        b.categoriaRisco,
        b.danoPotencial,
      ],
      REGRAS_TAGS_BARRAGENS
    ),
  }));
}

export interface MunicipioComBarragens {
  idIbge: string;
  nome: string;
  totalFeam: number;
  totalSnisb: number;
}

/**
 * Municípios com barragem em pelo menos uma das duas fontes — alimenta a
 * busca por município da página principal e o `generateStaticParams` da
 * rota `/ambiental/barragens/municipio/[idIbge]`.
 *
 * Duas agregações separadas e um merge em JS pela mesma razão de
 * `lib/db/queries/betim.ts` (`barragensFeam`/`barragensSnisb`): não há
 * necessidade de casar linha a linha aqui (é só contagem por município),
 * mas juntar as duas fontes num único `full outer join` por `id_municipio`
 * é mais frágil de ler do que compor em código.
 */
export async function listarMunicipiosComBarragens(): Promise<MunicipioComBarragens[]> {
  const db = getDb();
  if (!db) return [];

  const [porFeam, porSnisb, nomes] = await Promise.all([
    db
      .select({ idIbge: feam_barragens.id_municipio, total: sql<number>`count(*)::int` })
      .from(feam_barragens)
      .groupBy(feam_barragens.id_municipio),
    db
      .select({ idIbge: snisb_barragens.id_municipio, total: sql<number>`count(*)::int` })
      .from(snisb_barragens)
      .where(sql`${snisb_barragens.id_municipio} like '31%'`)
      .groupBy(snisb_barragens.id_municipio),
    db.select({ idIbge: ref_municipios_mg.id_ibge, nome: ref_municipios_mg.nome }).from(ref_municipios_mg),
  ]);

  const nomePorId = new Map(nomes.map((n) => [n.idIbge, n.nome]));
  const porId = new Map<string, MunicipioComBarragens>();

  for (const f of porFeam) {
    porId.set(f.idIbge, {
      idIbge: f.idIbge,
      nome: nomePorId.get(f.idIbge) ?? f.idIbge,
      totalFeam: f.total,
      totalSnisb: 0,
    });
  }
  for (const s of porSnisb) {
    const existente = porId.get(s.idIbge);
    if (existente) {
      existente.totalSnisb = s.total;
    } else {
      porId.set(s.idIbge, {
        idIbge: s.idIbge,
        nome: nomePorId.get(s.idIbge) ?? s.idIbge,
        totalFeam: 0,
        totalSnisb: s.total,
      });
    }
  }

  return [...porId.values()].sort(
    (a, b) => b.totalFeam + b.totalSnisb - (a.totalFeam + a.totalSnisb) || a.nome.localeCompare(b.nome, "pt-BR")
  );
}
