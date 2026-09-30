"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, Mail, Star } from "lucide-react";
import {
  alternarTema,
  contemTema,
  desserializarTemas,
  serializarTemas,
  TEMAS,
  temasSeguidos,
} from "@/lib/temas/temas";

/**
 * "Acompanhar temas" (`/temas`) — atalhos pessoais guardados no navegador.
 *
 * ═══ O QUE É ═══
 *
 * O leitor marca os temas que quer acompanhar; a lista fica no aparelho
 * (localStorage), sem cadastro. Avisos de novidades são gerais, pelo Telegram
 * ou e-mail — a tela diz isso com clareza, sem prometer filtro por tema.
 *
 * ═══ POR QUE `useSyncExternalStore` ═══
 *
 * O `localStorage` é sistema externo ao React. No servidor a lista é vazia
 * (constante estável); o navegador carrega o valor real depois de hidratar,
 * sem `setState` em efeito e sem divergência de hidratação.
 */

const CHAVE = "cp:temas-seguidos";
const VAZIO: string[] = [];

let cache: string[] = VAZIO;
let carregado = false;
const ouvintes = new Set<() => void>();

function pegarStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function obterSnapshot(): string[] {
  return cache;
}
function obterSnapshotServidor(): string[] {
  return VAZIO;
}

function inscrever(ouvinte: () => void): () => void {
  if (!carregado) {
    const storage = pegarStorage();
    cache = desserializarTemas(storage ? storage.getItem(CHAVE) : null);
    carregado = true;
  }
  ouvintes.add(ouvinte);
  const aoMudarStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE) {
      cache = desserializarTemas(evento.newValue);
      ouvintes.forEach((o) => o());
    }
  };
  window.addEventListener("storage", aoMudarStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarStorage);
  };
}

function gravar(lista: string[]): void {
  cache = lista;
  const storage = pegarStorage();
  if (storage) storage.setItem(CHAVE, serializarTemas(lista));
  ouvintes.forEach((o) => o());
}

/** Lista reativa dos temas seguidos (reusada por "Meus dados"). */
export function useTemas(): string[] {
  return useSyncExternalStore(inscrever, obterSnapshot, obterSnapshotServidor);
}

export default function TemasClient() {
  const ids = useTemas();
  const seguidos = temasSeguidos(ids);

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="text-sm text-muted">
        Você acompanha <strong className="text-foreground">{seguidos.length}</strong> tema(s).
        A lista fica no seu aparelho, sem cadastro.
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMAS.map((tema) => {
          const ativo = contemTema(ids, tema.id);
          return (
            <li
              key={tema.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <Link href={tema.href} className="block font-semibold text-foreground hover:text-primary">
                  {tema.titulo}
                </Link>
                <p className="mt-0.5 text-sm text-muted">{tema.descricao}</p>
              </div>
              <button
                type="button"
                onClick={() => gravar(alternarTema(cache, tema.id))}
                aria-pressed={ativo}
                aria-label={ativo ? `Deixar de acompanhar ${tema.titulo}` : `Acompanhar ${tema.titulo}`}
                title={ativo ? "Deixar de acompanhar" : "Acompanhar este tema"}
                className={`shrink-0 rounded-lg border p-2 transition-colors ${
                  ativo
                    ? "border-amber-400/60 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                <Star size={16} className={ativo ? "fill-current" : undefined} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <h2 className="text-sm font-semibold text-foreground">Receber avisos de novidades</h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          Seguir um tema guarda um atalho seu — o aviso de novidade é geral, não
          filtrado por tema. Escolha como quer ser avisado:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://t.me/ControlePopularBOT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            <Bell size={13} aria-hidden="true" /> Telegram
          </a>
          <a
            href="mailto:contato@controlepopular.com.br?subject=Quero%20receber%20novidades%20do%20Controle%20Popular"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            <Mail size={13} aria-hidden="true" /> E-mail
          </a>
        </div>
      </section>
    </div>
  );
}
