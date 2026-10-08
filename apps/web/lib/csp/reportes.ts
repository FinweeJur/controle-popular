/**
 * @file reportes.ts
 * @description Interpretação dos relatórios de violação de Content-Security-Policy
 * (CSP) enviados pelo navegador ao endpoint `POST /api/csp-report`.
 *
 * Papel no portal: a CSP do Controle Popular está em `Report-Only` de propósito
 * (ver o bloco `CSP_REPORT_ONLY` em `apps/web/next.config.ts`). Sem um coletor,
 * "Report-Only" é só um rótulo bonito: as violações existem mas ninguém as vê.
 * Este módulo é a etapa de LEITURA — transforma o corpo que o navegador manda em
 * pares (diretiva, origem) que a rota grava na tabela `contadores`. Medir 24 h
 * com isto ligado é o que autoriza promover a CSP para bloqueante.
 *
 * Fonte das regras de formato (formatos oficiais dos navegadores):
 * - `application/csp-report` (legado, ainda o que a maioria envia):
 *   {"csp-report": {"violated-directive": "...", "blocked-uri": "...", ...}}
 * - Reporting API (`application/reports+json`, array):
 *   [{"type":"csp-violation","body":{"effectiveDirective":"...","blockedURL":"..."}}]
 *
 * Decisões técnicas não triviais:
 * - PRIVACIDADE (AGENTS §5.8): a `document-uri` (URL da página do visitante,
 *   que pode trazer `?q=` com termo de busca pessoal) é DESCARTADA. Gravamos só
 *   diretiva + host bloqueado — o suficiente para achar a violação sem tocar em
 *   dado de quem denuncia ou busca.
 * - A diretiva efetiva vira a BASE: `script-src-elem` conta como `script-src`,
 *   porque é a diretiva que o dono edita em `next.config.ts`. Contar por sufixo
 *   dobraria as linhas sem dizer nada novo.
 * - Origem vira HOST (não a URL inteira): mesma página pode bloquear 50 caminhos
 *   do mesmo host; o host é a unidade que faz sentido para decidir se uma origem
 *   entra ou sai da política.
 * - Teto de tamanho (64/200 caracteres) e de violações por requisição: um corpo
 *   malicioso não pode inflar a tabela de contadores.
 */

/** Uma violação já normalizada: o par que vira chave de contador. */
export interface ViolacaoCsp {
  /** Diretiva da CSP violada, na forma base (ex.: `script-src`). */
  diretiva: string;
  /** Origem bloqueada, normalizada (host, `inline`, `data:`, ...). */
  origem: string;
  /**
   * Disposição da política no momento da violação: `report` (CSP em
   * Report-Only) ou `enforce` (CSP bloqueante). Depois da virada, esta
   * chave é o que separa "avisou" de "bloqueou de verdade".
   */
  disposicao: "report" | "enforce" | "desconhecida";
}

const MAX_DIRETIVA = 64;
const MAX_ORIGEM = 200;

/**
 * Normaliza a diretiva violada para a forma base que se edita na política.
 *
 * @param bruta Diretiva como veio do navegador (pode ser `script-src-elem`).
 * @returns Diretiva em minúsculas, sem sufixo `-elem`/`-attr`, cortada em
 * `MAX_DIRETIVA`. Vazio vira `desconhecida`.
 */
export function normalizarDiretiva(bruta: string): string {
  const limpa = bruta.trim().toLowerCase().slice(0, MAX_DIRETIVA);
  if (!limpa) return "desconhecida";
  return limpa.replace(/-(elem|attr)$/, "");
}

/**
 * Normaliza a origem bloqueada para o host (ou um token fixo).
 *
 * @param bruta Origem como veio do navegador (`blocked-uri`/`blockedURL`).
 * @returns Host em minúsculas, um token fixo (`inline`, `data:`, `eval`,
 * `mesmo-site`, `vazia`, ...) ou a cadeia crua truncada em `MAX_ORIGEM`.
 */
export function normalizarOrigem(bruta: string): string {
  const limpa = bruta.trim().toLowerCase().slice(0, MAX_ORIGEM);
  if (!limpa) return "vazia";
  if (limpa === "inline") return "inline";
  if (limpa === "eval" || limpa === "unsafe-eval") return "eval";
  if (limpa.startsWith("data:")) return "data:";
  if (limpa.startsWith("blob:")) return "blob:";
  if (limpa === "'self'" || limpa === "self") return "mesmo-site";
  try {
    const url = new URL(limpa);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname || "sem-host";
    }
    // Ex.: `filesystem:`, `ws:` — devolve o esquema sem dois-pontos finais.
    return url.protocol.replace(/:$/, "") || "esquema";
  } catch {
    // Não é URL absoluta: pode ser caminho relativo (`/arquivo.js`), que é
    // do próprio site, ou um curinga de esquema (`https:`).
  }
  if (/^[a-z][a-z0-9+.-]*:$/.test(limpa)) return limpa;
  return "mesmo-site";
}

/**
 * Interpreta o corpo de um relatório de violação de CSP.
 *
 * Aceita os dois formatos oficiais e é tolerante a corpo inválido: devolve
 * lista vazia em vez de lançar — relatório nunca pode derrubar a rota.
 *
 * @param corpo Corpo já desserializado da requisição (pode ser `null`).
 * @returns Lista de violações normalizadas (vazia se nada reconhecível).
 */
export function interpretarRelatorioCsp(corpo: unknown): ViolacaoCsp[] {
  if (Array.isArray(corpo)) {
    return corpo.flatMap((item) => violacaoReportingApi(item));
  }
  if (corpo && typeof corpo === "object") {
    const registro = corpo as Record<string, unknown>;
    const legado = registro["csp-report"];
    if (legado && typeof legado === "object") {
      return [violacaoLegado(legado as Record<string, unknown>)].filter(
        (v): v is ViolacaoCsp => v !== null
      );
    }
    return violacaoReportingApi(corpo);
  }
  return [];
}

/**
 * Converte uma entrada do formato legado `application/csp-report`.
 * @param registro O objeto interno de `"csp-report"`.
 * @returns A violação, ou `null` se não houver diretiva nenhuma.
 */
function violacaoLegado(registro: Record<string, unknown>): ViolacaoCsp | null {
  const diretiva = texto(registro["violated-directive"]) || texto(registro["effective-directive"]);
  if (!diretiva) return null;
  return montar(diretiva, texto(registro["blocked-uri"]), texto(registro["disposition"]));
}

/**
 * Converte uma entrada do Reporting API (`type: "csp-violation"`), ou um corpo
 * solto já no formato moderno. Entradas de outro tipo são ignoradas.
 * @param item Elemento do array (ou objeto único).
 * @returns Lista com no máximo uma violação.
 */
function violacaoReportingApi(item: unknown): ViolacaoCsp[] {
  if (!item || typeof item !== "object") return [];
  const entrada = item as Record<string, unknown>;
  const tipo = texto(entrada["type"]);
  if (tipo && tipo !== "csp-violation") return [];

  const corpo = (entrada["body"] && typeof entrada["body"] === "object"
    ? entrada["body"]
    : entrada) as Record<string, unknown>;

  const diretiva =
    texto(corpo["effectiveDirective"]) ||
    texto(corpo["violated-directive"]) ||
    texto(corpo["directive"]);
  if (!diretiva) return [];

  const origem = texto(corpo["blockedURL"]) || texto(corpo["blocked-uri"]) || texto(corpo["sourceFile"]);
  return [montar(diretiva, origem, texto(corpo["disposition"]))];
}

function montar(diretiva: string, origem: string, disposicaoBruta: string): ViolacaoCsp {
  const disposicao = disposicaoBruta.toLowerCase();
  return {
    diretiva: normalizarDiretiva(diretiva),
    origem: normalizarOrigem(origem),
    disposicao: disposicao === "report" || disposicao === "enforce" ? disposicao : "desconhecida",
  };
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}
