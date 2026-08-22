/**
 * Cliente da API Pública do DataJud (CNJ) — B8, CONSULTA AO VIVO.
 *
 * ═══ POR QUE ISTO NÃO GRAVA NADA, E POR QUE ISSO NÃO É DETALHE TÉCNICO ═══
 *
 * O Termo de Uso da API Pública do Datajud (cláusulas 3.8/3.9) veda
 * distribuir DERIVADO do acervo sem dar ciência ao CNJ. `docs/FONTES.md` já
 * mede o tamanho do corpus (TJMG: 69.983 ACP, ~6.011 com assunto ambiental) —
 * mas medir para decidir arquitetura é diferente de publicar o dado medido.
 * Um `etl/betim/dados/datajud-tjmg.json` com processos coletados SERIA um
 * derivado republicado, e essa não é a linha que este módulo cruza.
 *
 * O desenho aqui é o oposto de um coletor: cada chamada de `buscarDatajud`
 * consulta o Elasticsearch do CNJ NA HORA da requisição do visitante, devolve
 * o resultado, e não escreve em disco em nenhum ponto do caminho. O cache
 * abaixo (`lib/judiciario/datajud-cache.ts` não existe — é só um Map em
 * memória, ver `cacheConsulta`) existe para poupar a mesma consulta repetida
 * em rajada, e morre com o isolate do Worker. **Nunca vira arquivo.**
 *
 * ═══ A CHAVE ═══
 *
 * `CHAVE_PUBLICA_PADRAO` foi copiada em 21/08/2026 do HTML BRUTO de
 * `https://datajud-wiki.cnj.jus.br/api-publica/acesso` (via `curl`, sem
 * passar por resumo de IA — já houve incidente neste projeto de um resumo
 * corromper esta mesma chave). A própria página do CNJ avisa que a chave
 * "poderá ser alterada... a qualquer momento"; por isso `chaveApi()` aceita
 * sobrescrita por `DATAJUD_API_KEY` sem exigir mudança de código quando isso
 * acontecer.
 *
 * Ela é uma chave PÚBLICA (o próprio CNJ a publica em texto claro na wiki,
 * para uso por qualquer requisitante) — não é segredo deste projeto. Mesmo
 * assim `chaveApi()` só é chamada no servidor (dentro da rota
 * `app/api/datajud/route.din.ts`), e nunca é devolvida ao cliente, inclusive
 * em mensagem de erro: ver `respostaDeErro` na rota.
 *
 * ═══ O QUE A API NÃO DEVOLVE (E POR QUE NÃO HÁ REDAÇÃO DE NOME/CNPJ AQUI) ═══
 *
 * Medido e documentado em `docs/FONTES.md`: a API pública NÃO devolve nome
 * nem CNPJ/CPF de parte (LGPD; a introspecção `_mapping` responde 403). Os
 * campos de texto que ela devolve (`classe.nome`, `assuntos[].nome`,
 * `orgaoJulgador.nome`, `movimentos[].nome`) vêm de tabelas controladas do
 * CNJ (TPU/TUSPJ), não de digitação livre. Mesmo assim `sanitizarProcesso`
 * varre TODO campo de texto do processo por sequência de 11 dígitos válida
 * por mod-11 antes de devolver ao cliente — a mesma régua de
 * `redigirDocumentosSoltos` (Rouanet) e `sem-cpf-no-repo.test.ts`, porque a
 * lição registrada em `AGENTS.md` é "guarda que olha lista de campo
 * suspeito falha": aqui não há lista, é o processo inteiro.
 */

export const DATAJUD_TRIBUNAL = "tjmg";

const DATAJUD_URL = `https://api-publica.datajud.cnj.jus.br/api_publica_${DATAJUD_TRIBUNAL}/_search`;

// Chave PÚBLICA do DataJud, ver o comentário de topo. Sobrescrita opcional
// por `DATAJUD_API_KEY` caso o CNJ rotacione.
const CHAVE_PUBLICA_PADRAO = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

export function chaveApi(): string {
  const doAmbiente = process.env.DATAJUD_API_KEY?.trim();
  return doAmbiente || CHAVE_PUBLICA_PADRAO;
}

export function urlDatajud(): string {
  return DATAJUD_URL;
}

// ═══ FILTRO DE ENTRADA ═══

export interface DatajudFiltro {
  /** Número único CNJ, só dígitos, exatamente 20 (NNNNNNNNNNNNNNNNNNNNN é o padrão de 20). */
  numeroProcesso?: string;
  classeCodigo?: number;
  assuntoCodigo?: number;
  orgaoJulgadorCodigo?: number;
  /** `orgaoJulgador.codigoMunicipioIBGE` — código IBGE de 7 dígitos do órgão julgador. */
  municipioIBGE?: number;
  tamanho?: number;
  /** Ponteiro opaco devolvido em `DatajudResultado.searchAfter` da página anterior. */
  searchAfter?: Array<number | string>;
}

export const TAMANHO_PADRAO = 10;

/**
 * Teto PRÓPRIO deste portal, bem abaixo do teto de 10.000 da API. A intenção
 * declarada da rota é consulta pontual ("mostrar este processo", "estes
 * processos deste órgão"), não varredura em massa — um teto de página baixo
 * é o que impede que esta rota vire, na prática, um exportador do acervo
 * inteiro por script batendo em laço. Ver a ressalva de licença no topo do
 * arquivo e a seção nova em `docs/FONTES.md`.
 */
export const TAMANHO_MAXIMO = 20;

/** Verdadeiro quando o filtro tem critério suficiente para não varrer o índice inteiro. */
export function filtroTemCriterio(filtro: DatajudFiltro): boolean {
  return (
    Boolean(filtro.numeroProcesso) ||
    filtro.classeCodigo !== undefined ||
    filtro.assuntoCodigo !== undefined ||
    filtro.orgaoJulgadorCodigo !== undefined ||
    filtro.municipioIBGE !== undefined
  );
}

/**
 * Monta o corpo da Query DSL do Elasticsearch, no formato medido nos
 * exemplos oficiais da wiki (`/api-publica/exemplos/exemplo1` e `exemplo2`):
 * `numeroProcesso` por `match` exato, os demais campos por `bool.must` de
 * `match` em `campo.codigo`. `sort` por `@timestamp` acompanha SEMPRE, porque
 * é pré-requisito do `search_after` (`exemplo3`) — sem ele a paginação por
 * ponteiro não tem o que ordenar.
 */
export function montarConsulta(filtro: DatajudFiltro): Record<string, unknown> {
  const musts: Record<string, unknown>[] = [];

  if (filtro.numeroProcesso) {
    musts.push({ match: { numeroProcesso: filtro.numeroProcesso } });
  }
  if (filtro.classeCodigo !== undefined) {
    musts.push({ match: { "classe.codigo": filtro.classeCodigo } });
  }
  if (filtro.assuntoCodigo !== undefined) {
    musts.push({ match: { "assuntos.codigo": filtro.assuntoCodigo } });
  }
  if (filtro.orgaoJulgadorCodigo !== undefined) {
    musts.push({ match: { "orgaoJulgador.codigo": filtro.orgaoJulgadorCodigo } });
  }
  if (filtro.municipioIBGE !== undefined) {
    musts.push({ match: { "orgaoJulgador.codigoMunicipioIBGE": filtro.municipioIBGE } });
  }

  const tamanho = Math.min(Math.max(1, filtro.tamanho ?? TAMANHO_PADRAO), TAMANHO_MAXIMO);

  const corpo: Record<string, unknown> = {
    size: tamanho,
    // Sem nenhum `must` isto viraria `match_all` — mas `filtroTemCriterio`
    // barra esse caso antes de chegar aqui (ver a rota). `musts.length`
    // sempre positivo neste ponto; o `bool` cobre 1 ou mais critérios.
    query: musts.length ? { bool: { must: musts } } : { match_all: {} },
    sort: [{ "@timestamp": { order: "asc" } }],
  };
  if (filtro.searchAfter && filtro.searchAfter.length > 0) {
    corpo.search_after = filtro.searchAfter;
  }
  return corpo;
}

// ═══ TIPOS DE SAÍDA (o que este portal expõe, não o JSON cru do ES) ═══

export interface DatajudCodigoNome {
  codigo: number;
  nome: string;
}

export interface DatajudOrgaoJulgador {
  codigo: number | null;
  nome: string | null;
  codigoMunicipioIBGE: number | null;
}

export interface DatajudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
}

export interface DatajudProcesso {
  id: string;
  numeroProcesso: string;
  tribunal: string;
  grau: string | null;
  classe: DatajudCodigoNome | null;
  assuntos: DatajudCodigoNome[];
  orgaoJulgador: DatajudOrgaoJulgador | null;
  dataAjuizamento: string | null;
  dataHoraUltimaAtualizacao: string | null;
  totalMovimentos: number;
  ultimoMovimento: DatajudMovimento | null;
}

export interface DatajudResultado {
  total: number;
  /** "eq" = total exato; "gte" = o ES parou de contar em 10.000 (ver exemplo2 da wiki). */
  totalRelacao: "eq" | "gte";
  processos: DatajudProcesso[];
  /** Ponteiro para a próxima página via `search_after`; `null` quando não há próxima página conhecida. */
  searchAfter: Array<number | string> | null;
}

// ═══ PARSER (defensivo — ver a nota de "API que mente" em docs/FONTES.md) ═══

function ehCodigoNome(v: unknown): v is { codigo: number; nome: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).codigo === "number" &&
    typeof (v as Record<string, unknown>).nome === "string"
  );
}

/**
 * `assuntos` NÃO tem formato estável entre tribunais. Medido nos próprios
 * exemplos da wiki: TRF1 (`exemplo1`) devolve array PLANO de
 * `{codigo,nome}`; TJDFT (`exemplo2`) devolve array de ARRAYS
 * (`[[{...}], [{...}]]`), um grupo por classificação. Achatar
 * recursivamente é o que evita que o segundo formato vire `[object Object]`
 * ou um `.map` que quebra silenciosamente.
 */
export function achatarAssuntos(bruto: unknown): DatajudCodigoNome[] {
  const saida: DatajudCodigoNome[] = [];
  const pilha: unknown[] = Array.isArray(bruto) ? [...bruto] : bruto ? [bruto] : [];
  while (pilha.length > 0) {
    const item = pilha.shift();
    if (Array.isArray(item)) {
      pilha.unshift(...item);
      continue;
    }
    if (ehCodigoNome(item)) saida.push({ codigo: item.codigo, nome: item.nome });
  }
  return saida;
}

function textoOuNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function numeroOuNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

/** `null` quando o "hit" não tem nem `numeroProcesso` — descartado, não inventado. */
function parseProcesso(hit: unknown): DatajudProcesso | null {
  const h = hit as Record<string, unknown> | null;
  const fonte = (h?._source ?? null) as Record<string, unknown> | null;
  if (!fonte || typeof fonte.numeroProcesso !== "string") return null;

  // Reconstrói cada movimento SÓ com os 3 campos declarados no tipo — não
  // espalha o objeto bruto. Medido ao vivo em 21/08/2026: um movimento real
  // do TJMG trazia um `orgaoJulgador` embutido (grau de recurso) além dos
  // três campos documentados aqui. Um `filter` que só estreita o tipo sem
  // recriar o objeto deixaria esse campo extra atravessar até o cliente
  // por baixo do spread de `sanitizarProcesso` — sem passar pela redação de
  // CPF, porque `sanitizarProcesso` só redige os campos que CONHECE.
  const movimentosBruto = Array.isArray(fonte.movimentos) ? fonte.movimentos : [];
  const movimentosValidos: DatajudMovimento[] = movimentosBruto
    .map((m): DatajudMovimento | null => {
      const b = m as Record<string, unknown> | null;
      if (
        typeof b?.codigo !== "number" ||
        typeof b?.nome !== "string" ||
        typeof b?.dataHora !== "string"
      ) {
        return null;
      }
      return { codigo: b.codigo, nome: b.nome, dataHora: b.dataHora };
    })
    .filter((m): m is DatajudMovimento => m !== null);

  const classeBruta = fonte.classe as Record<string, unknown> | undefined;
  const orgaoBruto = fonte.orgaoJulgador as Record<string, unknown> | undefined;

  return {
    id: typeof h?._id === "string" ? h._id : textoOuNull(fonte.id) ?? fonte.numeroProcesso,
    numeroProcesso: fonte.numeroProcesso,
    tribunal: textoOuNull(fonte.tribunal) ?? DATAJUD_TRIBUNAL.toUpperCase(),
    grau: textoOuNull(fonte.grau),
    classe: ehCodigoNome(classeBruta) ? { codigo: classeBruta.codigo, nome: classeBruta.nome } : null,
    assuntos: achatarAssuntos(fonte.assuntos),
    orgaoJulgador: orgaoBruto
      ? {
          codigo: numeroOuNull(orgaoBruto.codigo),
          nome: textoOuNull(orgaoBruto.nome),
          codigoMunicipioIBGE: numeroOuNull(orgaoBruto.codigoMunicipioIBGE),
        }
      : null,
    dataAjuizamento: textoOuNull(fonte.dataAjuizamento),
    dataHoraUltimaAtualizacao: textoOuNull(fonte.dataHoraUltimaAtualizacao),
    totalMovimentos: movimentosValidos.length,
    ultimoMovimento: movimentosValidos.length > 0 ? movimentosValidos[movimentosValidos.length - 1] : null,
  };
}

/**
 * Interpreta a resposta bruta do Elasticsearch. Lança erro (nunca devolve
 * objeto pela metade) quando `hits.hits` não é array — é a mesma disciplina
 * de "validar o CONTEÚDO, nunca só o status HTTP" das outras fontes deste
 * repositório: um 200 com corpo no formato errado não deve virar tela vazia
 * silenciosa, e sim erro tratado pela rota (ver `route.din.ts`).
 */
export function interpretarResposta(bruto: unknown): DatajudResultado {
  const r = bruto as Record<string, unknown> | null;
  const hitsObj = (r?.hits ?? null) as Record<string, unknown> | null;
  const hits = hitsObj?.hits;
  if (!Array.isArray(hits)) {
    throw new Error("resposta do DataJud sem 'hits.hits' -- formato inesperado");
  }

  const totalObj = (hitsObj?.total ?? null) as Record<string, unknown> | null;
  const total = typeof totalObj?.value === "number" ? totalObj.value : hits.length;
  const totalRelacao: "eq" | "gte" = totalObj?.relation === "gte" ? "gte" : "eq";

  const processos = hits.map(parseProcesso).filter((p): p is DatajudProcesso => p !== null);

  const ultimoHit = hits.length > 0 ? (hits[hits.length - 1] as Record<string, unknown>) : null;
  const sortBruto = ultimoHit?.sort;
  const searchAfter =
    Array.isArray(sortBruto) && sortBruto.every((v) => typeof v === "number" || typeof v === "string")
      ? (sortBruto as Array<number | string>)
      : null;

  return { total, totalRelacao, processos, searchAfter };
}

// ═══ REDAÇÃO DE CPF, EM PROFUNDIDADE — ver o comentário de topo do arquivo ═══

const DOCUMENTO_REDIGIDO = "[documento redigido]";

/** Dígitos verificadores de CPF (mod-11). Gêmeo do de `lib/sem-cpf-no-repo.test.ts` e
 *  `lib/cultura/salic.ts` — mesma convenção documentada lá: cada módulo que precisa
 *  redigir CPF carrega sua própria cópia pequena em vez de importar de um módulo
 *  de outra frente do portal. */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** Troca toda sequência de 11 dígitos que É um CPF válido (mod-11) por um marcador. Preserva o texto ao redor. */
export function redigirCpfEmTexto(texto: string): string {
  return texto.replace(/\d{11}/g, (seq) => (cpfValido(seq) ? DOCUMENTO_REDIGIDO : seq));
}

/**
 * Varre TODO campo de texto de um processo já interpretado — não uma lista
 * de campos suspeitos (a API não deveria trazer CPF nenhum, ver o comentário
 * de topo; isto é rede de segurança, não expectativa).
 */
export function sanitizarProcesso(p: DatajudProcesso): DatajudProcesso {
  return {
    ...p,
    tribunal: redigirCpfEmTexto(p.tribunal),
    grau: p.grau ? redigirCpfEmTexto(p.grau) : p.grau,
    classe: p.classe ? { ...p.classe, nome: redigirCpfEmTexto(p.classe.nome) } : null,
    assuntos: p.assuntos.map((a) => ({ ...a, nome: redigirCpfEmTexto(a.nome) })),
    orgaoJulgador: p.orgaoJulgador
      ? { ...p.orgaoJulgador, nome: p.orgaoJulgador.nome ? redigirCpfEmTexto(p.orgaoJulgador.nome) : null }
      : null,
    ultimoMovimento: p.ultimoMovimento
      ? { ...p.ultimoMovimento, nome: redigirCpfEmTexto(p.ultimoMovimento.nome) }
      : null,
  };
}

// ═══ CACHE EM MEMÓRIA, TTL CURTO — NUNCA EM DISCO ═══
//
// `docs/FONTES.md` e o comentário de topo já dizem por quê: gravar em
// arquivo aqui seria distribuir derivado do acervo, vedado pelas cláusulas
// 3.8/3.9. Este `Map` mora só na memória do isolate do Worker, expira
// sozinho e tem teto de entradas — não é mecanismo de persistência, é
// só para não repetir a MESMA consulta duas vezes num mesmo instante
// (ex.: StrictMode do React disparando o efeito duas vezes em dev).

interface EntradaCache {
  expiraEm: number;
  resultado: DatajudResultado;
}

const TTL_CACHE_MS = 30_000;
const TETO_CACHE = 50;

const cacheConsulta = new Map<string, EntradaCache>();

export function chaveDeCache(filtro: DatajudFiltro): string {
  return JSON.stringify({
    numeroProcesso: filtro.numeroProcesso ?? null,
    classeCodigo: filtro.classeCodigo ?? null,
    assuntoCodigo: filtro.assuntoCodigo ?? null,
    orgaoJulgadorCodigo: filtro.orgaoJulgadorCodigo ?? null,
    municipioIBGE: filtro.municipioIBGE ?? null,
    tamanho: filtro.tamanho ?? TAMANHO_PADRAO,
    searchAfter: filtro.searchAfter ?? null,
  });
}

function lerCache(chave: string): DatajudResultado | null {
  const entrada = cacheConsulta.get(chave);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEm) {
    cacheConsulta.delete(chave);
    return null;
  }
  return entrada.resultado;
}

function gravarCache(chave: string, resultado: DatajudResultado): void {
  if (cacheConsulta.size >= TETO_CACHE) {
    // Mapa preserva ordem de inserção — remove a entrada mais antiga (FIFO),
    // sem instalar dependência nenhuma só por um cache de 30s.
    const maisAntiga = cacheConsulta.keys().next().value;
    if (maisAntiga !== undefined) cacheConsulta.delete(maisAntiga);
  }
  cacheConsulta.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, resultado });
}

// ═══ A CHAMADA AO VIVO ═══

const TIMEOUT_MS = 10_000;

export class DatajudErro extends Error {
  constructor(
    message: string,
    public readonly statusSugerido: number
  ) {
    super(message);
    this.name = "DatajudErro";
  }
}

/**
 * Consulta o DataJud AO VIVO e devolve o resultado já interpretado e
 * sanitizado. Nunca grava em disco (ver a seção de cache acima). Erros são
 * sempre `DatajudErro` com mensagem segura para chegar ao cliente — a
 * mensagem NUNCA inclui a chave, o header de autorização ou o corpo bruto
 * de uma resposta de erro do CNJ (que poderia ecoar o header enviado).
 */
export async function buscarDatajud(filtro: DatajudFiltro): Promise<DatajudResultado> {
  const chave = chaveDeCache(filtro);
  const doCache = lerCache(chave);
  if (doCache) return doCache;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let resposta: Response;
  try {
    resposta = await fetch(DATAJUD_URL, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${chaveApi()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(montarConsulta(filtro)),
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      throw new DatajudErro("tempo esgotado consultando o DataJud", 504);
    }
    throw new DatajudErro("DataJud indisponível no momento", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    // Não repassa `resposta.statusText`/corpo ao cliente: em tese poderiam
    // ecoar cabeçalho enviado. Loga só o status, no servidor.
    console.error(`DataJud respondeu HTTP ${resposta.status} para tribunal ${DATAJUD_TRIBUNAL}`);
    throw new DatajudErro("DataJud recusou a consulta", 502);
  }

  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    throw new DatajudErro("resposta do DataJud não é JSON válido", 502);
  }

  let resultado: DatajudResultado;
  try {
    resultado = interpretarResposta(corpo);
  } catch (erro) {
    console.error("DataJud: falha ao interpretar resposta —", erro instanceof Error ? erro.message : erro);
    throw new DatajudErro("resposta do DataJud em formato inesperado", 502);
  }

  resultado = { ...resultado, processos: resultado.processos.map(sanitizarProcesso) };
  gravarCache(chave, resultado);
  return resultado;
}
