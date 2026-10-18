/**
 * LinkMender — escada de reparo (D0–D5) e roteiro de LLM.
 *
 * Núcleo PURO e testável do plano
 * (docs/planos/PLANO-LINKMENDER-E-ESCADA-18-10.md, Fase 3): a ordem dos
 * degraus, as variações determinísticas de URL, a memória de reparos e os
 * tetos de cada modelo. Nada aqui toca rede nem disco — os adaptadores
 * (Playwright para D3, visão para D4, HTTP para os LLMs) ficam de fora e
 * são injetados por quem chama.
 *
 * Princípio: barato primeiro. D0 (memória) → D1 (truques de URL) → D2
 * (busca por chave única) → D3 (robô na busca do site) → D4 (print + visão)
 * → D5 (humano). Cada degrau só roda se o anterior falhar, e o LLM nunca
 * decide sozinho: ele propõe, o portão determinístico (vivo + domínio +
 * tipo + título + caminho) decide.
 */

export type Degrau = "D0" | "D1" | "D2" | "D3" | "D4" | "D5";

/** Ordem da escada, do mais barato ao mais caro. */
export const ORDEM_DEGRAUS: Degrau[] = ["D0", "D1", "D2", "D3", "D4", "D5"];

/** Próximo degrau da escada (null no fim). */
export function proximoDegrau(atual: Degrau): Degrau | null {
  const i = ORDEM_DEGRAUS.indexOf(atual);
  if (i < 0 || i >= ORDEM_DEGRAUS.length - 1) return null;
  return ORDEM_DEGRAUS[i + 1];
}

export type Provedor = "ollama" | "maritaca" | "ling" | "visao";

export interface TetoModelo {
  provedor: Provedor;
  modelo: string;
  /** Chamadas permitidas por madrugada. Teto pequeno de propósito. */
  tetoPorRodada: number;
}

/**
 * Roteiro barato-primeiro com teto pequeno por provedor. O Ollama local roda
 * de graça (e nada sai da máquina, §5.8); Maritaca e Ling entram quando o
 * local não resolve; a visão (D4) é o mais caro e o mais limitado.
 */
export const TETOS_LLM: TetoModelo[] = [
  { provedor: "ollama", modelo: "qwen2.5:7b-instruct", tetoPorRodada: 20 },
  { provedor: "maritaca", modelo: "sabia-3", tetoPorRodada: 10 },
  { provedor: "ling", modelo: "ling-flash", tetoPorRodada: 10 },
  { provedor: "visao", modelo: "visao-local", tetoPorRodada: 5 },
];

export function tetoDe(provedor: Provedor): number {
  return TETOS_LLM.find((t) => t.provedor === provedor)?.tetoPorRodada ?? 0;
}

/** Ainda cabe chamada neste provedor? `usado` = chamadas já feitas na rodada. */
export function podeChamar(provedor: Provedor, usado: number): boolean {
  return usado < tetoDe(provedor);
}

/**
 * Ordem de tentativa dos provedores de texto (sem a visão, que é degrau 4).
 * O orquestrador percorre até achar um que responda e ainda tenha cota.
 */
export function provedoresDeTexto(): Provedor[] {
  return ["ollama", "maritaca", "ling"];
}

/**
 * D1 — variações determinísticas da URL quebrada, na ordem de aposta. São os
 * "truques" que resolvem a maioria sem usar LLM: https, sem www, sem barra
 * final, sem query de rastreio e a cópia no Wayback Machine.
 */
export function variacoesUrl(url: string): string[] {
  const saidas = new Set<string>();
  try {
    const u = new URL(url);
    if (u.protocol === "http:") {
      const https = new URL(u.toString());
      https.protocol = "https:";
      saidas.add(https.toString());
    }
    flutuar(u, saidas);
    const semQuery = new URL(u.toString());
    semQuery.search = "";
    semQuery.hash = "";
    saidas.add(semQuery.toString());
  } catch {
    return [];
  }
  saidas.delete(url);
  return [...saidas];
}

/** Variações de host e barra final (helpers para manter `variacoesUrl` curta). */
function flutuar(u: URL, saidas: Set<string>): void {
  const comBarra = new URL(u.toString());
  if (!comBarra.pathname.endsWith("/")) {
    comBarra.pathname += "/";
    saidas.add(comBarra.toString());
  }
  const semBarra = new URL(u.toString());
  if (semBarra.pathname.length > 1 && semBarra.pathname.endsWith("/")) {
    semBarra.pathname = semBarra.pathname.replace(/\/+$/, "");
    saidas.add(semBarra.toString());
  }
  if (u.hostname.startsWith("www.")) {
    const semWww = new URL(u.toString());
    semWww.hostname = u.hostname.replace(/^www\./, "");
    saidas.add(semWww.toString());
  }
}

/** Cópia histórica no Wayback (o próprio serviço responde 200 quando há). */
export function urlWayback(url: string): string {
  return `https://web.archive.org/web/2/${url}`;
}

export interface ReparoMemorizado {
  urlNova: string;
  degrau: Degrau;
  data: string;
}

export type MemoriaReparos = Record<string, ReparoMemorizado>;

/**
 * D0 — consulta a memória: se este domínio+padrão já foi resolvido antes,
 * devolve o reparo. A chave é a urlVelha exata (simples e previsível).
 */
export function consultarMemoria(
  memoria: MemoriaReparos,
  urlVelha: string
): ReparoMemorizado | null {
  return memoria[urlVelha] ?? null;
}

/** Grava um reparo bem-sucedido na memória (imutável). */
export function lembrar(
  memoria: MemoriaReparos,
  urlVelha: string,
  reparo: ReparoMemorizado
): MemoriaReparos {
  return { ...memoria, [urlVelha]: reparo };
}

/** Todos os reparos aprendidos por um degrau (para o relatório de auditoria). */
export function reparosPorDegrau(memoria: MemoriaReparos, degrau: Degrau): string[] {
  return Object.entries(memoria)
    .filter(([, r]) => r.degrau === degrau)
    .map(([urlVelha]) => urlVelha)
    .sort();
}
