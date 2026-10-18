/**
 * LinkMender — adaptadores de rede dos degraus D3 e D4 da escada.
 *
 * O núcleo (`escada.ts`) decide a ordem, memoriza e impõe teto. Falta o
 * "braço": abrir o navegador (D3) e tirar print (D4). O braço é o sidecar
 * Python `scripts/agent-tools/escada-pagina.py` (Playwright), que roda fora
 * da CI porque precisa de rede real.
 *
 * Aqui ficam só as partes PURAS e testáveis: montar o comando, ler o JSON de
 * volta e checar a cota da rodada. Quem chama injeta o `spawn` de verdade.
 */

import { podeChamar, tetoDe, type Degrau, type Provedor } from "./escada";

export const ESCADA_PAGINA = "scripts/agent-tools/escada-pagina.py";

export interface ComandoDegrau {
  comando: string;
  args: string[];
}

/** D3 — abre o site e, quando há termo, usa a busca dele. */
export function comandoD3(entrada: { url: string; busca?: string | null }): ComandoDegrau {
  const args = [ESCADA_PAGINA, "--url", entrada.url];
  if (entrada.busca) args.push("--busca", entrada.busca);
  return { comando: "python", args };
}

/** D4 — print da página para o modelo de visão analisar. */
export function comandoD4(entrada: { url: string; png: string }): ComandoDegrau {
  return { comando: "python", args: [ESCADA_PAGINA, "--url", entrada.url, "--print", entrada.png] };
}

export interface SaidaSidecar {
  ok: boolean;
  titulo?: string;
  links: string[];
  erro?: string;
}

/** Interpreta o JSON do sidecar sem lançar: saída torta vira `ok:false`. */
export function parsearSaidaSidecar(saida: string): SaidaSidecar {
  try {
    const dado = JSON.parse(saida) as Record<string, unknown>;
    return {
      ok: Boolean(dado.ok),
      titulo: typeof dado.titulo === "string" ? dado.titulo : undefined,
      links: Array.isArray(dado.links)
        ? dado.links.filter((l): l is string => typeof l === "string")
        : [],
      erro: typeof dado.erro === "string" ? dado.erro : undefined,
    };
  } catch {
    return { ok: false, links: [], erro: "saida do sidecar nao e JSON" };
  }
}

export type Usados = Partial<Record<Provedor, number>>;

/** D4 consome a cota de visão; D3 não consome LLM. */
export function cotaDoDegrau(degrau: Degrau): Provedor | null {
  return degrau === "D4" ? "visao" : null;
}

/** O degrau cabe nas cotas desta rodada? */
export function podeExecutarDegrau(degrau: Degrau, usados: Usados): boolean {
  const cota = cotaDoDegrau(degrau);
  if (!cota) return true;
  return podeChamar(cota, usados[cota] ?? 0);
}

/** Quantas chamadas ainda restam no teto do degrau (Infinity se não usa LLM). */
export function restoDoTeto(degrau: Degrau, usados: Usados): number {
  const cota = cotaDoDegrau(degrau);
  if (!cota) return Number.POSITIVE_INFINITY;
  return Math.max(0, tetoDe(cota) - (usados[cota] ?? 0));
}
