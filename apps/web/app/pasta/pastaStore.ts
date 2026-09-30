"use client";

import { useSyncExternalStore } from "react";
import {
  adicionarItem,
  contemItem,
  desserializar,
  removerItem,
  serializar,
  type ItemPasta,
} from "@/lib/pasta/itens";

/**
 * Store da pasta de dossiê — a lista de páginas guardadas no navegador.
 *
 * ═══ O QUE É ═══
 *
 * Um store minúsculo sobre o `localStorage`, exposto ao React por
 * `useSyncExternalStore` (o padrão recomendado para ler sistemas externos).
 * Vários pontos da tela — a paleta de comandos e a página `/pasta` — leem e
 * escrevem a mesma lista.
 *
 * ═══ POR QUE ASSIM ═══
 *
 * No servidor a lista é vazia (constante estável); o navegador carrega o
 * valor real depois de hidratar, sem divergência e sem `setState` em efeito.
 * O evento `storage` sincroniza entre abas. A pasta nunca sai do aparelho.
 *
 * ═══ O QUE GUARDA ═══
 *
 * Só o título e o endereço da página — a fonte continua na página oficial.
 * A pasta junta, não copia.
 */

const CHAVE = "cp:pasta-dossie";
const VAZIO: ItemPasta[] = [];

let cache: ItemPasta[] = VAZIO;
let carregado = false;
const ouvintes = new Set<() => void>();

function pegarStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function obterSnapshot(): ItemPasta[] {
  return cache;
}

function obterSnapshotServidor(): ItemPasta[] {
  return VAZIO;
}

function inscrever(ouvinte: () => void): () => void {
  if (!carregado) {
    const storage = pegarStorage();
    cache = desserializar(storage ? storage.getItem(CHAVE) : null);
    carregado = true;
  }
  ouvintes.add(ouvinte);

  const aoMudarStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE) {
      cache = desserializar(evento.newValue);
      ouvintes.forEach((o) => o());
    }
  };
  window.addEventListener("storage", aoMudarStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarStorage);
  };
}

function gravar(lista: ItemPasta[]): void {
  cache = lista;
  const storage = pegarStorage();
  if (storage) storage.setItem(CHAVE, serializar(lista));
  ouvintes.forEach((o) => o());
}

/** Lista reativa dos itens da pasta. */
export function useItensPasta(): ItemPasta[] {
  return useSyncExternalStore(inscrever, obterSnapshot, obterSnapshotServidor);
}

/** Remove o prefixo do portal do título da aba. */
function tituloLimpo(): string {
  if (typeof document === "undefined") return "";
  return document.title.replace(/\s*[|—-]\s*(Controle Popular|ControlePopular).*$/i, "").trim();
}

/**
 * Adiciona a página aberta à pasta.
 * Devolve `true` se entrou agora; `false` se já estava (ou fora do navegador).
 */
export function adicionarPaginaAtual(): boolean {
  if (typeof window === "undefined") return false;
  const href = `${window.location.pathname}${window.location.search}`;
  const item: ItemPasta = {
    id: href,
    titulo: tituloLimpo() || href,
    href,
    tipo: "pagina",
    adicionadoEm: new Date().toISOString(),
  };
  const antes = cache.length;
  gravar(adicionarItem(cache, item));
  return cache.length > antes;
}

/** Diz se a página aberta já está na pasta. */
export function paginaAtualNaPasta(): boolean {
  if (typeof window === "undefined") return false;
  return contemItem(cache, `${window.location.pathname}${window.location.search}`);
}

/** Remove um item pelo endereço. */
export function removerDaPasta(id: string): void {
  gravar(removerItem(cache, id));
}

/** Esvazia a pasta. */
export function limparPasta(): void {
  gravar([]);
}
