import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { atos_diario } from "@/lib/db/schema";
import { classificarAto, type TipoAto } from "@/lib/diario/classificarAto";
import { extrairEntidades } from "@/lib/diario/extrairEntidades";
import diamantinaTitulos from "@/lib/diario/fixtures/diamantina-75-titulos.json";
import atosMunicipiosJson from "../../data/diario-atos-municipios.json";

export interface ResumoDiarioOficial {
  total: number;
  totalEditais: number;
  totalContratos: number;
  totalConvenios: number;
  totalDecretos: number;
  totalPortarias: number;
  totalLeis: number;
  totalOutros: number;
}

export interface SerieDiarioAno {
  ano: number;
  total: number;
}

export interface LinhaAtoDiario {
  id: string;
  data_publicacao: string;
  edicao: string | null;
  pagina: string | null;
  tipo: TipoAto;
  numero_ato: string | null;
  orgao: string | null;
  ementa: string | null;
  link_fonte: string;
  processo_ref?: string | null;
  valor?: number | null;
  cnpj_mascarado?: string | null;
}

interface ItemAtoJson {
  id: string;
  municipioSlug?: string;
  dataPublicacao?: string;
  numeroEdicao?: string | null;
  orgao?: string | null;
  tipo?: string;
  titulo?: string;
  numeroProcesso?: string | null;
  numeroAto?: string | null;
  cnpj?: string | null;
  nomeCredor?: string | null;
  valor?: number | null;
  objeto?: string | null;
  linkOriginal?: string | null;
}

function resolverSlug(idOuSlug: string): string {
  const norm = idOuSlug.toLowerCase().trim();
  switch (norm) {
    case "3121605":
    case "diamantina":
      return "diamantina";
    case "3106705":
    case "betim":
      return "betim";
    case "3106200":
    case "bh":
    case "belo-horizonte":
      return "belo-horizonte";
    case "3103405":
    case "aracuai":
    case "araçuaí":
      return "aracuai";
    case "3134004":
    case "itinga":
      return "itinga";
    case "3550308":
    case "sp":
    case "sao-paulo":
    case "são paulo":
      return "sp";
    default:
      return norm;
  }
}

/**
 * Gera atos de amostra e calibração estáticos a partir de fixtures locais.
 */
function gerarAtosEstaticos(slug: string): LinhaAtoDiario[] {
  const resultado: LinhaAtoDiario[] = [];
  const dataset = atosMunicipiosJson as Record<string, ItemAtoJson[]>;

  if (slug === "diamantina") {
    // Carrega os 75 atos reais de Diamantina (SIGPub / AMM-MG)
    const base75 = (diamantinaTitulos as {
      titulo: string;
      data: string;
      entidade: string;
      esperado: string;
    }[]).map((item, index) => {
      // Converte data DD-MM-YYYY para ISO YYYY-MM-DD
      const partes = item.data.split("-");
      const dataIso = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : "2026-07-01";
      const entidades = extrairEntidades(item.titulo);
      const tipo = (item.esperado as TipoAto) || classificarAto(item.titulo);

      return {
        id: `ato-diamantina-${dataIso.replace(/-/g, "")}-${String(index + 1).padStart(3, "0")}`,
        data_publicacao: dataIso,
        edicao: null,
        pagina: null,
        tipo,
        numero_ato: entidades.numeroContrato || entidades.numeroEdital || null,
        orgao: item.entidade || "Prefeitura Municipal de Diamantina",
        ementa: item.titulo,
        link_fonte: "https://www.diariomunicipal.com.br/amm-mg/",
        processo_ref: entidades.numeroProcesso || null,
        valor: entidades.valorPrincipal || null,
        cnpj_mascarado: entidades.cnpjs[0] || null,
      };
    });

    resultado.push(...base75);
  }

  // Carrega atos dos demais municípios ou adicionais
  const itensDoJson = dataset[slug] || (slug === "belo-horizonte" ? dataset["bh"] : undefined) || [];
  for (const item of itensDoJson) {
    // Evita duplicatas se já inserido
    if (resultado.some((r) => r.id === item.id)) continue;
    resultado.push({
      id: item.id,
      data_publicacao: item.dataPublicacao ?? "2026-08-01",
      edicao: item.numeroEdicao ?? null,
      pagina: null,
      tipo: (item.tipo as TipoAto) || classificarAto(item.titulo || item.objeto || ""),
      numero_ato: item.numeroAto ?? null,
      orgao: item.orgao ?? null,
      ementa: item.objeto || item.titulo || null,
      link_fonte: item.linkOriginal || "https://controlepopular.com.br",
      processo_ref: item.numeroProcesso ?? null,
      valor: item.valor ?? null,
      cnpj_mascarado: item.cnpj ?? null,
    });
  }

  return resultado;
}

/**
 * Busca todos os atos do diário oficial para o município informado.
 * Tenta o banco Neon/Postgres primeiro; na ausência de conexão, recorre às fixtures estáticas.
 */
export async function fetchAtosDiario(idMunicipio: string): Promise<LinhaAtoDiario[]> {
  const slug = resolverSlug(idMunicipio);

  try {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(atos_diario)
        .where(eq(atos_diario.id_municipio, idMunicipio))
        .orderBy(desc(atos_diario.data_publicacao));

      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const raw = (r.raw as Record<string, unknown> | null) ?? null;
          return {
            id: r.id,
            data_publicacao: r.data_publicacao,
            edicao: r.edicao,
            pagina: r.pagina,
            tipo: r.tipo as TipoAto,
            numero_ato: r.numero_ato,
            orgao: r.orgao,
            ementa: r.ementa,
            link_fonte: r.link_fonte,
            processo_ref: typeof raw?.numeroProcesso === "string" ? raw.numeroProcesso : null,
            valor: typeof raw?.valor === "number" ? raw.valor : null,
            cnpj_mascarado: typeof raw?.cnpj === "string" ? raw.cnpj : null,
          };
        });
      }
    }
  } catch {
    // Fallback silencioso para fixtures quando o banco estiver indisponível
  }

  return gerarAtosEstaticos(slug);
}

/**
 * Calcula o resumo consolidado de matérias por tipo do Diário Oficial.
 */
export async function fetchResumoDiario(idMunicipio: string): Promise<ResumoDiarioOficial> {
  const atos = await fetchAtosDiario(idMunicipio);

  return {
    total: atos.length,
    totalEditais: atos.filter((a) => a.tipo === "edital").length,
    totalContratos: atos.filter((a) => a.tipo === "contrato").length,
    totalConvenios: atos.filter((a) => a.tipo === "convenio").length,
    totalDecretos: atos.filter((a) => a.tipo === "decreto").length,
    totalPortarias: atos.filter((a) => a.tipo === "portaria").length,
    totalLeis: atos.filter((a) => a.tipo === "lei").length,
    totalOutros: atos.filter((a) => a.tipo === "outro").length,
  };
}

/**
 * Agrupa atos por ano para renderização de linha do tempo.
 */
export async function fetchSerieDiarioPorAno(idMunicipio: string): Promise<SerieDiarioAno[]> {
  const atos = await fetchAtosDiario(idMunicipio);
  const contagens = new Map<number, number>();

  for (const ato of atos) {
    if (!ato.data_publicacao) continue;
    const ano = parseInt(ato.data_publicacao.slice(0, 4), 10);
    if (!isNaN(ano)) {
      contagens.set(ano, (contagens.get(ano) ?? 0) + 1);
    }
  }

  return Array.from(contagens.entries())
    .map(([ano, total]) => ({ ano, total }))
    .sort((a, b) => a.ano - b.ano);
}
