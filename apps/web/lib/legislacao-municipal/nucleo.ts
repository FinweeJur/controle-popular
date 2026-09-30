/**
 * Núcleo PURO da coleta de legislação municipal — o "bot" que traz as leis
 * das câmaras para a biblioteca unificada de legislação.
 *
 * Plano: `docs/planos/PLANO-BIBLIOTECA-LEGISLACAO.md`, Fase F1 (municipal, MG
 * primeiro). Este arquivo NÃO faz rede: recebe o JSON da fonte já baixado e
 * devolve a linha normalizada, no shape de `ambiental_legislacao`
 * (`esfera='municipal'`). Quem fala com a rede é `bots/coletor-legislacao-municipal.mts`,
 * que importa estas funções. Separar assim é o que permite testar o parser,
 * o dedup e o filtro de robots com `vitest`, sem tocar a internet.
 *
 * ═══ FONTE (Plano A): APIs das câmaras ═══
 *
 * O adaptador é o do SAPL (Sistema de Apoio ao Processo Legislativo, software
 * público usado por várias câmaras de MG). A API é Django REST:
 *
 *     GET /api/materia/materialegislativa/?format=json&ano=YYYY&page_size=100&page=N
 *     GET /api/materia/tipomaterialegislativa/?format=json&page_size=100
 *
 * Armadilhas medidas ao vivo em 30/09/2026 (Contagem):
 *   1. `limit` é IGNORADO — a página fixa em 10. O que funciona é `page_size`,
 *      e o teto é 100. Paginar com `limit` multiplicaria as requisições por 10.
 *   2. O filtro `?ano=YYYY` funciona (Contagem 2026: 5.187 matérias). Sem ele,
 *      o corpus inteiro da casa é 59.277 — grande demais para varrer.
 *   3. `tipo` é uma FK numérica: o rótulo ("PROJETO DE LEI", "INDICAÇÃO"…)
 *      vem de `/api/materia/tipomaterialegislativa/`. Gravar o número sem
 *      resolver seria publicar "tipo 8" para o leitor.
 *   4. `format=csv` devolve 404 — não existe export em massa.
 *   5. `robots.txt` destas câmaras pede `Crawl-delay: 60` e bloqueia
 *      `/materia/docacessoario/` — por isso o coletor respeita o delay lido
 *      do próprio `robots.txt` (ver `parseRobots` e o bot).
 *
 * A URL pública da matéria é `https://<base>/materia/<id>` (conferido: 200).
 */

/** Sistemas de câmara suportados. Hoje só o SAPL; outros entram como adaptador. */
export type SistemaCamara = "sapl";

/** Uma câmara mapeada — o registro que o bot percorre. */
export interface CidadeFonte {
  /** Slug estável, sem acento — usado no nome do arquivo e no `id_fonte`. */
  slug: string;
  nome: string;
  /** Código IBGE de 7 dígitos (municipio-mg.json). */
  idIbge: string;
  uf: string;
  sistema: SistemaCamara;
  /** Raiz da API/portal da câmara, sem barra final. */
  base: string;
}

/** Matéria legislativa como o SAPL entrega — só os campos que usamos. */
export interface MateriaSapl {
  id?: number;
  numero?: number | string | null;
  ano?: number | string | null;
  /** FK para `tipo_material_legislativa`. */
  tipo?: number | null;
  ementa?: string | null;
  data_apresentacao?: string | null;
  apelido?: string | null;
  /** Taxonomia da própria câmara, quando publica (nem toda publica). */
  indexacao?: string | null;
}

/** Tipo de matéria como o SAPL entrega. */
export interface TipoMateriaSapl {
  id: number;
  descricao?: string | null;
  sigla?: string | null;
}

/** Linha normalizada — o que o bot grava e o que a biblioteca consome. */
export interface LinhaLegislacaoMunicipal {
  /** `camara-sapl` — de qual adaptador veio. */
  fonte: string;
  /** `${slug}-${id}` — estável dentro da fonte. */
  id_fonte: string;
  esfera: "municipal";
  id_ibge_municipio: string;
  /** Rótulo do tipo, resolvido pela FK. Nunca o número cru. */
  tipo: string;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data: string | null;
  orgao: string | null;
  situacao: string | null;
  /** Link público da matéria no portal da câmara. */
  link_oficial: string;
  /** Chave canônica para dedup na carga da biblioteca. */
  chave_dedup: string;
  indexacao: string | null;
  /** Classificação derivada — vazia até a etapa Ollama (`--enriquecer-ollama`). */
  temas: string[];
  tags: string[];
  /** Microresumo — `null` até a etapa Ollama. Rotulado quando gerado. */
  resumo: string | null;
}

/** Remove acento, caixa e espaços repetidos — para comparar e montar chave. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** `"  R$ Lei  "` → `"r$ lei"`. Aceita nulo sem estourar. */
function texto(s: unknown): string | null {
  if (s === null || s === undefined) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

/** Ano da matéria como número; `null` quando a fonte não informa. */
export function anoDaMateria(m: MateriaSapl): number | null {
  const bruto = m.ano;
  if (typeof bruto === "number" && Number.isFinite(bruto)) return bruto;
  if (typeof bruto === "string" && /^\d{4}$/.test(bruto.trim())) return Number(bruto);
  return null;
}

/** Número da matéria como texto; `null` quando a fonte não informa. */
export function numeroDaMateria(m: MateriaSapl): string | null {
  const bruto = m.numero;
  if (bruto === null || bruto === undefined) return null;
  const t = String(bruto).trim();
  return t.length ? t : null;
}

/** Link público da matéria no portal da câmara. */
export function urlOficialMateria(base: string, id: number): string {
  return `${base.replace(/\/+$/, "")}/materia/${id}`;
}

/**
 * Chave canônica da norma municipal: `municipal:<IBGE>:<tipo>:<numero>:<ano>`.
 * O prefixo `municipal:` evita colisão com chaves de outras esferas na mesma
 * tabela. Tipo e número entram normalizados; ausência vira `-`, nunca some.
 */
export function chaveDedupMunicipal(
  idIbge: string,
  tipo: string,
  numero: string | null,
  ano: number | null
): string {
  return [
    "municipal",
    idIbge,
    normalizar(tipo),
    numero ? normalizar(numero) : "-",
    ano ?? "-",
  ].join(":");
}

/** Mapa de `tipo` (FK) para o rótulo, a partir da lista de tipos da câmara. */
export function montarMapaTipos(tipos: TipoMateriaSapl[]): Map<number, string> {
  const mapa = new Map<number, string>();
  for (const t of tipos) {
    const rotulo = texto(t.descricao) ?? texto(t.sigla);
    if (rotulo) mapa.set(t.id, rotulo);
  }
  return mapa;
}

/**
 * Normaliza uma matéria do SAPL para a linha da biblioteca. Devolve `null`
 * quando falta o mínimo para um registro honesto — `id` (não há chave) ou
 * `tipo` resolvido (gravar o número cru seria publicar "tipo 8"). Ementa
 * vazia NÃO derruba a linha: a norma existe, a lacuna fica dita.
 */
export function normalizarMateriaSapl(
  materia: MateriaSapl,
  cidade: CidadeFonte,
  tipos: Map<number, string>
): LinhaLegislacaoMunicipal | null {
  const id = materia.id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;

  const tipo = materia.tipo !== null && materia.tipo !== undefined ? tipos.get(materia.tipo) : undefined;
  if (!tipo) return null;

  const numero = numeroDaMateria(materia);
  const ano = anoDaMateria(materia);
  return {
    fonte: `camara-${cidade.sistema}`,
    id_fonte: `${cidade.slug}-${id}`,
    esfera: "municipal",
    id_ibge_municipio: cidade.idIbge,
    tipo,
    numero,
    ano,
    ementa: texto(materia.ementa),
    data: texto(materia.data_apresentacao),
    orgao: null,
    situacao: null,
    link_oficial: urlOficialMateria(cidade.base, id),
    chave_dedup: chaveDedupMunicipal(cidade.idIbge, tipo, numero, ano),
    indexacao: texto(materia.indexacao),
    temas: [],
    tags: [],
    resumo: null,
  };
}

/** Regras do `robots.txt` para o agente genérico (`*`). */
export interface RegrasRobots {
  /** Segundos pedidos em `Crawl-delay`, ou `null` se o arquivo não declarar. */
  crawlDelay: number | null;
  /** Caminhos `Disallow` do agente `*`. */
  disallow: string[];
}

const REGRAS_VAZIAS: RegrasRobots = { crawlDelay: null, disallow: [] };

/**
 * Lê `robots.txt` e extrai o grupo do agente `*`.
 *
 * Parser mínimo e conservador: agrupa por `User-agent`, e as diretivas valem
 * para o grupo corrente. O que interessa é o `*` — os milhares de `User-agent`
 * de bloqueio que estas câmaras listam (Semrush, Ahrefs…) não nos atingem,
 * porque o bot envia User-Agent próprio.
 */
export function parseRobots(robots: string): RegrasRobots {
  const linhas = robots.split(/\r?\n/);
  let grupoAsterisco = false;
  let viuUserAgent = false;
  let delay: number | null = null;
  const disallow: string[] = [];

  for (const linha of linhas) {
    const semComentario = linha.split("#")[0].trim();
    if (!semComentario) continue;
    const idx = semComentario.indexOf(":");
    if (idx < 0) continue;
    const campo = semComentario.slice(0, idx).trim().toLowerCase();
    const valor = semComentario.slice(idx + 1).trim();

    if (campo === "user-agent") {
      // Nova linha de agente: o grupo `*` começa ou termina aqui. Um `*`
      // seguido de outro `user-agent` fecha o grupo.
      if (grupoAsterisco && viuUserAgent) grupoAsterisco = false;
      viuUserAgent = true;
      if (valor === "*") grupoAsterisco = true;
      continue;
    }
    if (!grupoAsterisco) continue;
    if (campo === "crawl-delay") {
      const n = Number(valor);
      if (Number.isFinite(n) && n >= 0) delay = n;
    } else if (campo === "disallow") {
      disallow.push(valor);
    }
  }
  return { crawlDelay: delay, disallow };
}

/** O caminho é permitido pelas regras (`Disallow`)? */
export function robotsPermite(caminho: string, regras: RegrasRobots | null | undefined): boolean {
  const r = regras ?? REGRAS_VAZIAS;
  for (const regra of r.disallow) {
    if (regra === "") continue; // "Disallow:" vazio = libera tudo
    if (regra === "/") return false;
    // `Disallow` do robots não usa glob; o `*` final é o único curinga comum.
    const prefixo = regra.endsWith("*") ? regra.slice(0, -1) : regra;
    if (caminho.startsWith(prefixo)) return false;
  }
  return true;
}
