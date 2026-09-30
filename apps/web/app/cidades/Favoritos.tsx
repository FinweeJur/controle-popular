"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import {
  alternarFavorito,
  contemFavorito,
  desserializar,
  LIMITE_FAVORITOS,
  serializar,
  type CidadeFavorita,
} from "@/lib/favoritos/cidades";

/**
 * "Minhas cidades" — lista de cidades seguidas, guardada no navegador.
 *
 * ═══ O QUE É ═══
 *
 * Um store minúsculo sobre o `localStorage` + dois componentes: o botão de
 * estrela (`BotaoFavoritar`) para seguir/deixar de seguir uma cidade, e a
 * faixa `MinhasCidades` que mostra a lista. A lógica pura mora em
 * `lib/favoritos/cidades.ts`.
 *
 * ═══ POR QUE `useSyncExternalStore` ═══
 *
 * O `localStorage` é um sistema externo ao React. O padrão recomendado para
 * ler e reagir a ele é este: no servidor a lista é vazia (constante estável),
 * e o navegador carrega o valor real depois de hidratar — sem divergência de
 * hidratação e sem `setState` dentro de efeito. O mesmo store atende todos os
 * botões da tabela e a faixa, e escuta o evento `storage` para sincronizar
 * entre abas.
 *
 * ═══ PRIVACIDADE ═══
 *
 * A lista nunca sai do aparelho. Sem cadastro, sem servidor, sem rastro.
 */

const CHAVE = "cp:cidades-favoritas";
const VAZIO: CidadeFavorita[] = [];

let cache: CidadeFavorita[] = VAZIO;
let carregado = false;
const ouvintes = new Set<() => void>();

/** Acesso defensivo ao localStorage (pode faltar em modo restrito). */
function pegarStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function obterSnapshot(): CidadeFavorita[] {
  return cache;
}

function obterSnapshotServidor(): CidadeFavorita[] {
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

/** Grava a lista no cache em memória, no localStorage e avisa os inscritos. */
function gravar(lista: CidadeFavorita[]): void {
  cache = lista;
  const storage = pegarStorage();
  if (storage) storage.setItem(CHAVE, serializar(lista));
  ouvintes.forEach((o) => o());
}

/** Lista reativa das cidades seguidas. */
export function useFavoritas(): CidadeFavorita[] {
  return useSyncExternalStore(inscrever, obterSnapshot, obterSnapshotServidor);
}

/** Segue ou deixa de seguir uma cidade. */
function alternar(cidade: CidadeFavorita): void {
  gravar(alternarFavorito(cache, cidade));
}

/** Esvazia a lista. */
function limpar(): void {
  gravar([]);
}

/** Botão de estrela para seguir/deixar de seguir uma cidade. */
export function BotaoFavoritar({ cidade }: { cidade: CidadeFavorita }) {
  const favoritas = useFavoritas();
  const ativo = contemFavorito(favoritas, cidade.id);

  return (
    <button
      type="button"
      onClick={() => alternar(cidade)}
      aria-pressed={ativo}
      aria-label={ativo ? `Deixar de seguir ${cidade.nome}` : `Seguir ${cidade.nome}`}
      title={ativo ? "Deixar de seguir" : "Seguir esta cidade"}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
        ativo
          ? "border-amber-400/60 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      <Star size={14} className={ativo ? "fill-current" : undefined} />
    </button>
  );
}

/** Faixa com as cidades seguidas; vazia, mostra como seguir. */
export function MinhasCidades() {
  const favoritas = useFavoritas();

  if (favoritas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">Suas cidades</p>
        <p className="mt-1">
          Toque na estrela ao lado de uma cidade para acompanhá-la. A lista fica
          no seu aparelho, sem cadastro e sem enviar nada.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-50/40 p-4 dark:bg-amber-950/20">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Suas cidades ({favoritas.length}/{LIMITE_FAVORITOS})
        </p>
        <button
          type="button"
          onClick={limpar}
          className="text-xs text-muted hover:text-foreground"
        >
          Limpar lista
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {favoritas.map((c) => (
          <li
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs"
          >
            <Link href={c.href} className="font-medium text-foreground hover:text-primary">
              {c.nome}/{c.uf}
            </Link>
            <button
              type="button"
              onClick={() => alternar(c)}
              aria-label={`Remover ${c.nome}`}
              className="rounded-full p-0.5 text-muted hover:text-foreground"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
