/**
 * camadas.ts — lê as camadas históricas publicadas e as entrega prontas para a
 * página `/historia` (Fase F do PLANO-HISTORIA-CAMADAS-GLOBO-3D.md).
 *
 * ═══ POR QUE LER O GEOJSON NO SERVIDOR ═══
 *
 * As camadas vivem em `public/terras/globo/dados/camadas/*.geojson` — são o
 * MESMO arquivo que o globo 3D carrega. Ler daqui (e não recriar o dado num
 * segundo lugar) é o que impede a página e o globo de publicarem números
 * diferentes: um arquivo, dois lugares (regra da casa, AGENTS § 8).
 *
 * O módulo é SERVER-ONLY: usa `node:fs`, como `lib/paraopeba/documentos-dados.ts`.
 * A página passa ao cliente apenas as LINHAS das tabelas, nunca a geometria —
 * o array de coordenadas não precisa ir ao navegador para uma tabela.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import indiceListas from "@/data/apm-listas-populacao.json";

/**
 * Onde estão os GeoJSON. Dois candidatos porque o `cwd` muda de acordo com quem
 * roda: no build do Next é `apps/web`; na suíte (vitest) é a raiz do monorepo.
 * Resolver só por `cwd` faria a página passar e o teste (ou o inverso) falhar
 * por caminho, não por dado.
 */
const CAMADAS = [
  path.resolve(process.cwd(), "public", "terras", "globo", "dados", "camadas"),
  path.resolve(process.cwd(), "apps", "web", "public", "terras", "globo", "dados", "camadas"),
].find((p) => existsSync(p)) ?? path.resolve(process.cwd(), "public", "terras", "globo", "dados", "camadas");

interface FeatureCollection {
  features: { properties: Record<string, unknown>; geometry: unknown }[];
  _nota?: string;
}

function ler(nome: string): FeatureCollection {
  try {
    return JSON.parse(readFileSync(path.join(CAMADAS, `${nome}.geojson`), "utf-8"));
  } catch {
    // Camada ausente não derruba a página: devolve vazio e a seção declara a lacuna.
    return { features: [] };
  }
}

function props(nome: string): Record<string, unknown>[] {
  return ler(nome).features.map((f) => f.properties ?? {});
}

/** As 13 capitanias hereditárias de 1534 (OpenHistoricalMap, CC0). */
export interface Capitania {
  nome: string;
  inicio: string;
  fim: string;
  area: number | null;
}

export function capitanias(): Capitania[] {
  return props("hist-capitanias")
    .map((p) => ({
      nome: String(p.nome ?? "—"),
      inicio: String(p.inicio ?? "—"),
      fim: String(p.fim ?? "—"),
      area: typeof p.area_graus2 === "number" ? (p.area_graus2 as number) : null,
    }))
    .sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
}

/** Registros de terras públicas do Império que nomeiam o município (APM). */
export interface TerraPublica {
  notacao: string;
  municipio: string;
  periodo: string;
  titulo: string;
  url: string;
}

export function terrasPublicas(): TerraPublica[] {
  return props("hist-terras-publicas").map((p) => ({
    notacao: String(p.notacao ?? "—"),
    municipio: String(p.municipio ?? "—"),
    periodo: String(p.periodo ?? "—"),
    titulo: String(p.titulo ?? "—"),
    url: String(p.url ?? ""),
  }));
}

/** Conjuntos rurais tombados pelo IEPHA-MG (fazendas e uma usina). */
export interface FazendaTombada {
  denominacao: string;
  municipio: string;
  distrito: string;
  classe: string;
  ato: string;
  url: string;
}

export function fazendasTombadas(): FazendaTombada[] {
  return props("hist-fazendas-engenhos").map((p) => ({
    denominacao: String(p.denominacao ?? "—"),
    municipio: String(p.municipio ?? "—"),
    distrito: String(p.distrito ?? "—"),
    classe: String(p.classe ?? "—"),
    ato: String(p.ato_legal ?? "—"),
    url: String(p.fonte_url ?? ""),
  }));
}

/**
 * As listas nominativas do APM (1838-1840) — a fonte primária da população da
 * província, incluindo a escravizada. A página lista o ÍNDICE INTEIRO (354),
 * inclusive os locais que não resolveram em município (`municipio: null`):
 * a lacuna é informação, e é ela que diz o que ainda falta ler.
 *
 * ⚠️ O acervo cataloga o DOCUMENTO; ele NÃO traz a contagem de pessoas
 * escravizadas — isso exigiria ler a imagem de cada lista.
 */
export interface ListaPopulacao {
  local: string;
  municipio: string | null;
  data: string;
  notacao: string;
  url: string;
  /** Vila mineradora do século XVIII, quando o município pertencia a uma. */
  vilaMineradora: string | null;
  comarcaMineradora: string | null;
}

interface IndiceListas {
  registros: { local?: string | null; municipio?: string | null; data?: string | null;
    notacao?: string | null; url?: string | null;
    zona_mineradora_vila?: string | null; zona_mineradora_comarca?: string | null }[];
}

export function listasPopulacao(): ListaPopulacao[] {
  const registros = (indiceListas as unknown as IndiceListas).registros ?? [];
  return registros.map((r) => ({
    local: String(r.local ?? "—"),
    municipio: r.municipio ? String(r.municipio) : null,
    data: String(r.data ?? "—"),
    notacao: String(r.notacao ?? "—"),
    url: String(r.url ?? ""),
    vilaMineradora: r.zona_mineradora_vila ? String(r.zona_mineradora_vila) : null,
    comarcaMineradora: r.zona_mineradora_comarca ? String(r.zona_mineradora_comarca) : null,
  }));
}

/**
 * Bens tombados pelo IPHAN (federal) cujo nome é de **fazenda, engenho, usina ou
 * café** — é o recorte que responde ao pedido do dev, e cabe na página (161 de
 * 2.475 no mapa). A base completa fica no globo e no índice
 * (`apps/web/data/iphan-bens-tombados.json`).
 */
export interface BemTombadoFederal {
  nome: string;
  municipio: string;
  uf: string;
  classificacao: string;
  ano: string;
  processo: string;
}

export function bensTombadosRurais(): BemTombadoFederal[] {
  return props("hist-bens-tombados")
    .filter((p) => p.fazenda_engenho === true)
    .map((p) => ({
      nome: String(p.nome ?? "—"),
      municipio: String(p.municipio ?? "—"),
      uf: String(p.uf ?? "—"),
      classificacao: String(p.classificacao ?? "—"),
      ano: String(p.ano ?? "—"),
      processo: String(p.processo_t ?? "—"),
    }))
    .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Agregado da mineração detectada dentro de área protegida (Fase D do plano de
 * mineração). A página lista os NOMES das áreas protegidas afetadas, não os 875
 * polígonos: a geometria é do globo, a contagem é daqui.
 */
export interface AgregadoProtegido {
  camada: string;
  total: number;
  areas: { nome: string; quantos: number }[];
}

export function mineracaoProtegida(): AgregadoProtegido[] {
  return ["mineracao-em-uc", "mineracao-em-quilombo"].map((camada) => {
    const linhas = props(camada);
    const contagem = new Map<string, number>();
    for (const p of linhas) {
      const nome = String(p.dentro_de ?? "(sem nome)");
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
    const areas = [...contagem.entries()]
      .map(([nome, quantos]) => ({ nome, quantos }))
      .sort((a, b) => b.quantos - a.quantos || a.nome.localeCompare(b.nome, "pt-BR"));
    return { camada, total: linhas.length, areas };
  });
}
