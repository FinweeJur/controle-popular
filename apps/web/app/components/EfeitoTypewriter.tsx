"use client";

/**
 * @file EfeitoTypewriter.tsx
 * @description Componente e hook de digitação progressiva (Typewriter) suave para o assistente.
 * 
 * Papel no portal:
 * Exibe as respostas do assistente (IA, curadas ou determinísticas) com efeito
 * de digitação progressiva (~15-20ms), cursor pulsante ▋, indicadores de status
 * e botão de acessibilidade 'Pular animação' para exibição instantânea.
 * 
 * Regras e decisões:
 * - Acessibilidade: botão visível 'Pular animação' e suporte a clique no cartão.
 * - Suporta callback ao concluir e controle de velocidade.
 * - Não quebra a renderização de elementos interativos ou fontes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { FastForward, Sparkles, Database, FileText } from "lucide-react";

export type StatusTypewriter =
  | "consultando"
  | "estruturando"
  | "digitando"
  | "pronto";

export interface UseTypewriterOptions {
  texto: string;
  velocidadeMs?: number;
  aoConcluir?: () => void;
  autoIniciar?: boolean;
}

/**
 * Hook para digitação progressiva palavra/caractere por caractere.
 */
export function useTypewriter({
  texto,
  velocidadeMs = 16,
  aoConcluir,
  autoIniciar = true,
}: UseTypewriterOptions) {
  const [indice, setIndice] = useState(autoIniciar ? 0 : texto.length);
  const [concluido, setConcluido] = useState(!autoIniciar || texto.length === 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pular = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIndice(texto.length);
    setConcluido(true);
    aoConcluir?.();
  }, [texto.length, aoConcluir]);

  useEffect(() => {
    if (!autoIniciar) {
      setIndice(texto.length);
      setConcluido(true);
      return;
    }

    setIndice(0);
    setConcluido(false);

    if (!texto) {
      setConcluido(true);
      return;
    }

    // Avanço dinâmico para garantir fluidez constante sem arrastar textos longos
    const step = texto.length > 600 ? 3 : texto.length > 250 ? 2 : 1;

    timerRef.current = setInterval(() => {
      setIndice((prev) => {
        const next = Math.min(prev + step, texto.length);
        if (next >= texto.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setConcluido(true);
          aoConcluir?.();
        }
        return next;
      });
    }, velocidadeMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [texto, velocidadeMs, autoIniciar, aoConcluir]);

  const textoExibido = texto.slice(0, indice);

  return {
    textoExibido,
    concluido,
    pular,
    progresso: texto.length > 0 ? indice / texto.length : 1,
  };
}

/**
 * Indicador de status em fases para a geração de resposta.
 */
export function IndicadorStatusChat({
  status,
}: {
  status: StatusTypewriter;
}) {
  if (status === "pronto") return null;

  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 animate-pulse">
      {status === "consultando" && (
        <>
          <Database size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Consultando acervo público oficial...</span>
        </>
      )}
      {status === "estruturando" && (
        <>
          <Sparkles size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Estruturando resposta com dados auditáveis...</span>
        </>
      )}
      {status === "digitando" && (
        <>
          <FileText size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Digitando resposta...</span>
        </>
      )}
    </div>
  );
}

/**
 * Cursor pulsante característico de terminal/assistente.
 */
export function CursorPulsante() {
  return (
    <span
      className="inline-block animate-pulse font-mono text-amber-600 dark:text-amber-400 ml-0.5 select-none"
      aria-hidden="true"
    >
      ▋
    </span>
  );
}

/**
 * Botão para pular a animação de digitação e exibir o texto completo.
 */
export function BotaoPularAnimacao({
  aoPular,
  concluido,
}: {
  aoPular: () => void;
  concluido: boolean;
}) {
  if (concluido) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        aoPular();
      }}
      title="Exibir todo o texto de imediato (atalho de acessibilidade)"
      className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[0.7rem] font-medium text-text-soft hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
    >
      <FastForward size={11} />
      <span>Pular animação</span>
    </button>
  );
}
