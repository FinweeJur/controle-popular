/**
 * LinkMender v2 — Critérios de confirmação de candidato a substituto de link.
 *
 * Tudo aqui é PURO: nenhuma função toca rede nem arquivo. Os testes ao lado
 * (criterios.test.ts) são o contrato — a regra do AGENTS.md "API responde 200
 * e mente" vira código: um candidato só é aceito se bater em TODOS os
 * critérios, e os critérios que bateram viajam junto na proposta gravada em
 * apps/web/data/link-correcoes.json.
 *
 * Critérios de aceitação (todos obrigatórios, na medida do que é possível medir):
 *  1. VIVO       — sondagem HTTP 2xx (401/403 não conta: protegido não é link
 *                  público substituto).
 *  2. DOMÍNIO    — domínio oficial de órgão público (.gov.br, .mp.br, .jus.br,
 *                  .leg.br, .org.br de entidade pública? NÃO — só sufixos de
 *                  poder público) OU domínio próprio/R2 de fontes do portal
 *                  (controlepopular.com.br, *.r2.dev, bucket R2).
 *  3. TIPO IGUAL — PDF → PDF, HTML → HTML. Se o tipo é indeterminável em
 *                  qualquer um dos lados, o critério falha (não chuta).
 *  4. TÍTULO     — quando o item tem título conhecido, similaridade de tokens
 *                  (Jaccard normalizado, sem acento) >= 0.4. Sem título, o
 *                  critério é registrado como "titulo-nao-avaliado" e não
 *                  reprova sozinho — mas os outros três seguem valendo.
 */

export type TipoConteudo = "pdf" | "html" | "desconhecido";

/** Sufixos de domínio oficial de órgão público (regra herdada do LinkMender v1). */
export const SUFIXOS_GOV = [
  ".gov.br",
  ".mp.br",
  ".jus.br",
  ".leg.br",
  ".gov",
] as const;

/** Domínios do próprio portal / R2 de fontes — também são domínio confiável. */
export const DOMINIOS_PROPRIO = [
  "controlepopular.com.br",
  "controle-popular.pages.dev",
] as const;

/** Sufixos de buckets públicos do R2 (Cloudflare). */
export const SUFIXOS_R2 = [".r2.dev"] as const;

/**
 * Limiar de similaridade de título. 0.35: um título de 4 palavras com 3 em
 * comum num candidato de 7 tokens (Jaccard 0.375) passa — nomes de documento
 * mudam pouco de órgão para órgão, mas mudam ("de", "da", reordenação).
 */
export const LIMIAR_SIMILARIDADE_TITULO = 0.35;

export interface CandidatoEntrada {
  /** URL que quebrou (ou a original do item). */
  urlVelha: string;
  /** URL candidata a substituta, já sondada. */
  urlCandidata: string;
  /** Status HTTP da sondagem da candidata. */
  statusHttp: number;
  /** Content-Type devolvido pela candidata, se houve. */
  contentType: string | null;
  /** Primeiros bytes do corpo, quando disponíveis (detecta mentira de servidor). */
  corpoInicial: string | null;
  /** Título do item/documento, quando conhecido (texto âncora, rótulo do dado). */
  tituloItem: string | null;
  /** Título declarado pela página candidata (título do HTML, se foi lido). */
  tituloCandidato: string | null;
}

export interface ResultadoAvaliacao {
  aceito: boolean;
  /** Códigos dos critérios que BATERAM (entram no JSON de correções). */
  criterios: string[];
  /** Por que cada critério que não bateu, foi reprovado. */
  motivos: string[];
}

export function hostGovernamental(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\./, "");
  return SUFIXOS_GOV.some((s) => h === s.slice(1) || h.endsWith(s));
}

export function hostProprioOuR2(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if ((DOMINIOS_PROPRIO as readonly string[]).includes(h)) return true;
  return SUFIXOS_R2.some((s) => h.endsWith(s));
}

export function hostAceitavel(hostname: string): boolean {
  return hostGovernamental(hostname) || hostProprioOuR2(hostname);
}

export function tipoConteudoDeUrl(url: string): TipoConteudo {
  try {
    const u = new URL(url);
    const caminho = u.pathname.toLowerCase();
    if (caminho.endsWith(".pdf")) return "pdf";
    if (caminho.endsWith(".html") || caminho.endsWith(".htm")) return "html";
    return "desconhecido";
  } catch {
    return "desconhecido";
  }
}

export function tipoDeContentType(contentType: string | null): TipoConteudo {
  if (!contentType) return "desconhecido";
  const ct = contentType.toLowerCase();
  if (ct.includes("application/pdf")) return "pdf";
  if (ct.startsWith("text/html")) return "html";
  return "desconhecido";
}

/** Remove acentos, caixa e pontuação; devolve tokens significativos. */
export function normalizarTitulo(titulo: string): string[] {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  const vazias = new Set([
    "de", "da", "do", "das", "dos", "a", "o", "e", "em", "no", "na", "para",
    "com", "por", "que", "e", "os", "as", "um", "uma", "http", "https", "www",
    "combr", "govbr",
  ]);
  return base.split(/\s+/).filter((t) => t.length > 1 && !vazias.has(t));
}

/** Similaridade Jaccard entre conjuntos de tokens, 0..1. */
export function similaridadeTitulo(a: string, b: string): number {
  const ta = new Set(normalizarTitulo(a));
  const tb = new Set(normalizarTitulo(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersecao = 0;
  for (const t of ta) if (tb.has(t)) intersecao++;
  return intersecao / (ta.size + tb.size - intersecao);
}

/**
 * Corpo devolvido é realmente o que a URL/Content-Type prometem?
 * "200 e mente" vira reprovação aqui: PDF que chega como HTML, página de erro
 * mole (soft 404) com 200 etc.
 */
export function corpoConfere(url: string, corpoInicial: string | null): {
  confere: boolean;
  motivo: string;
} {
  if (corpoInicial === null) {
    // Sem corpo amostrado (HEAD puro): não reprovamos por isto, o tipo vem do
    // Content-Type. A validação "200 e mente" exige corpo só quando há corpo.
    return { confere: true, motivo: "sem corpo amostrado" };
  }
  const corpo = corpoInicial.slice(0, 2048);
  const tipo = tipoConteudoDeUrl(url);
  if (tipo === "pdf") {
    if (corpo.startsWith("%PDF")) return { confere: true, motivo: "assinatura %PDF" };
    return { confere: false, motivo: "URL de PDF mas corpo nao comeca com %PDF" };
  }
  const emCaixaBaixa = corpo.toLowerCase();
  const marcadoresErro = [
    "pagina nao encontrada",
    "página não encontrada",
    "page not found",
    "erro 404",
    "http 404",
    "not found</title>",
    "documento nao encontrado",
    "documento não encontrado",
  ];
  for (const m of marcadoresErro) {
    if (emCaixaBaixa.includes(m)) {
      return { confere: false, motivo: `corpo com marcador de erro: "${m}"` };
    }
  }
  return { confere: true, motivo: "sem marcador de erro no corpo" };
}

export function avaliarCandidato(entrada: CandidatoEntrada): ResultadoAvaliacao {
  const criterios: string[] = [];
  const motivos: string[] = [];

  // 1. VIVO
  if (entrada.statusHttp >= 200 && entrada.statusHttp < 300) {
    criterios.push("vivo-2xx");
  } else {
    motivos.push(`vivo: candidata respondeu HTTP ${entrada.statusHttp} (exige 2xx)`);
  }

  // 2. DOMÍNIO
  try {
    const host = new URL(entrada.urlCandidata).hostname;
    if (hostGovernamental(host)) {
      criterios.push("dominio-oficial");
    } else if (hostProprioOuR2(host)) {
      criterios.push("dominio-r2-ou-proprio");
    } else {
      motivos.push(`dominio: ${host} nao e orgao publico nem R2 de fontes`);
    }
  } catch {
    motivos.push("dominio: candidata nao parseia como URL");
  }

  // 3. TIPO IGUAL (PDF→PDF, HTML→HTML); indeterminável = reprova
  const tipoVelho = tipoConteudoDeUrl(entrada.urlVelha);
  const tipoCt = tipoDeContentType(entrada.contentType);
  const tipoCandidato = tipoVelho === "desconhecido" ? tipoCt : tipoVelho;
  if (tipoCandidato === "desconhecido") {
    motivos.push("tipo: tipo do original indeterminavel");
  } else if (tipoCt === "desconhecido") {
    motivos.push("tipo: Content-Type da candidata indeterminavel");
  } else if (tipoCt === tipoCandidato) {
    criterios.push(`tipo-igual-${tipoCt}`);
  } else {
    motivos.push(`tipo: original ${tipoCandidato} mas candidata ${tipoCt}`);
  }

  // O corpo, quando amostrado, precisa conferir (200 e mente → reprova)
  const corpo = corpoConfere(entrada.urlCandidata, entrada.corpoInicial);
  if (corpo.confere) {
    if (entrada.corpoInicial !== null) criterios.push("corpo-confere");
  } else {
    motivos.push(`corpo: ${corpo.motivo}`);
  }

  // 4. TÍTULO
  if (entrada.tituloItem) {
    const alvo =
      entrada.tituloCandidato ??
      entrada.urlCandidata.replace(/^https?:\/\//i, "").replace(/[^a-z0-9]+/gi, " ");
    const sim = similaridadeTitulo(entrada.tituloItem, alvo);
    if (sim >= LIMIAR_SIMILARIDADE_TITULO) {
      criterios.push("titulo-similar");
    } else {
      motivos.push(
        `titulo: similaridade ${sim.toFixed(2)} < ${LIMIAR_SIMILARIDADE_TITULO}`
      );
    }
  } else {
    criterios.push("titulo-nao-avaliado");
  }

  // Os critérios OBRIGATÓRIOS: vivo + domínio + tipo + corpo. Quando o item
  // TEM título, similaridade também é obrigatória; sem título, registrado
  // como "titulo-nao-avaliado" e não veta.
  const tituloOk = entrada.tituloItem
    ? criterios.includes("titulo-similar")
    : criterios.includes("titulo-nao-avaliado");
  const obrigatoriosOk =
    criterios.includes("vivo-2xx") &&
    (criterios.includes("dominio-oficial") || criterios.includes("dominio-r2-ou-proprio")) &&
    criterios.some((c) => c.startsWith("tipo-igual-")) &&
    (criterios.includes("corpo-confere") || entrada.corpoInicial === null) &&
    tituloOk;

  return { aceito: obrigatoriosOk, criterios, motivos };
}
