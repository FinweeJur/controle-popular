/**
 * Allowlist de hosts e vocabulário da fila de coleta (Fase 1
 * "coletar na nuvem, digerir no PC").
 *
 * PAPEL NO PROJETO
 * ----------------
 * A rota `POST /api/fila/semear` recebe da nuvem uma lista de alvos.
 * Antes de enfileirar qualquer um, valida o host contra `HOSTS_PERMITIDOS`.
 * Sem isto, a rota viraria um proxy SSRF genérico: qualquer um com o
 * segredo poderia mandar o Worker buscar um endereço interno
 * (`169.254.169.254`, `svc-*.svc.cluster.local`, `localhost`) e usar o
 * portal como intermediário. A rota NÃO busca o alvo — só o enfileira —
 * mas o puller busca depois: barrar na borda é o que mantém a fila usável
 * sem transformar o PC numa porta aberta.
 *
 * FONTE DOS HOSTS
 * ---------------
 * São fontes públicas oficiais já coletadas pelo projeto — não inventar
 * endereço novo aqui. Um host novo entra por decisão explícita (revisão de
 * código), nunca por input de requisição.
 *
 * Comparação EXATA de hostname, não `endsWith`: `ibge.gov.br.atacante.com`
 * termina com a string mas não é o IBGE. É a mesma lição do `ehNeon()` em
 * `lib/db/client.ts`.
 */

/**
 * Hosts oficiais autorizados a aparecer em `fila_coleta.alvo`.
 *
 * Todos começam por `https:` (a validação exige HTTPS; HTTP fica de fora
 * porque dado público sensível não deve trafegar em claro). Mantenha a
 * lista curta e deliberada: cada linha é uma porta que a fila abre.
 */
export const HOSTS_PERMITIDOS = [
  // IBGE — Censo, malhas, códigos de município (fonte única do repositório).
  "servicodados.ibge.gov.br",
  "www.ibge.gov.br",
  // Dados abertos de Minas Gerais (CKAN) — contratos, convênios, saneamento.
  "dados.mg.gov.br",
  // Sistemas ambientais de MG usados pelos coletores (SEMAD/IGAM/FEAM).
  "ecosistemas.meioambiente.mg.gov.br",
  "siam.meioambiente.mg.gov.br",
  "www.igam.mg.gov.br",
  // Compras públicas federais/municipais (PNCP).
  "pncp.gov.br",
  // Câmara dos Deputados — proposições, votações, presença.
  "dadosabertos.camara.leg.br",
  // Senado Federal — matérias, votações, composição.
  "legis.senado.leg.br",
  // Repositório de dados do Governo Federal (convênios, detru).
  "repositorio.dados.gov.br",
  // Agência Nacional de Mineração — barragens (SIGBM).
  "app.anm.gov.br",
  // TSE — candidaturas e prestação de contas.
  "divulgacandcontas.tse.jus.br",
] as const;

/**
 * Verbos aceitos pela fila. Espelha o CHECK de `fila_coleta.tipo`
 * (migration 0090): nuvem e PC precisam concordar sobre o verbo.
 */
export const TIPOS_FILA = [
  "coletar",
  "resumir",
  "classificar",
  "extrair",
  "triar",
] as const;

export type TipoFila = (typeof TIPOS_FILA)[number];

/** Item de fila já validado — o formato que a rota pode inserir. */
export interface ItemFilaValidado {
  tipo: TipoFila;
  alvo: string;
  payload: Record<string, unknown>;
}

/** Limite de tamanho do alvo: evita payload gigante virar linha de banco. */
const MAX_ALVO = 2048;

/**
 * Valida UM item recebido pela rota.
 *
 * Quando `alvo` é uma URL (começa por `http`), exige `https:` e host exato
 * na allowlist. Quando é um identificador simples (ex.: código IBGE), só
 * o formato é conferido — quem interpreta é o puller, por `tipo`.
 *
 * @returns o item normalizado, ou `null` se for inválido.
 */
export function validarItemFila(bruto: unknown): ItemFilaValidado | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const obj = bruto as Record<string, unknown>;

  if (typeof obj.tipo !== "string") return null;
  if (!(TIPOS_FILA as readonly string[]).includes(obj.tipo)) return null;
  const tipo = obj.tipo as TipoFila;

  if (typeof obj.alvo !== "string") return null;
  const alvo = obj.alvo.trim();
  if (alvo.length < 1 || alvo.length > MAX_ALVO) return null;

  let payload: Record<string, unknown> = {};
  if (obj.payload !== undefined) {
    if (typeof obj.payload !== "object" || obj.payload === null || Array.isArray(obj.payload)) {
      return null;
    }
    payload = obj.payload as Record<string, unknown>;
  }

  // Só valida host quando o alvo é de fato uma URL. Identificador simples
  // (código IBGE, slug de lote) não tem host para conferir.
  if (/^https?:/i.test(alvo)) {
    let url: URL;
    try {
      url = new URL(alvo);
    } catch {
      return null;
    }
    if (url.protocol !== "https:") return null;
    if (!(HOSTS_PERMITIDOS as readonly string[]).includes(url.hostname)) return null;
  }

  return { tipo, alvo, payload };
}
