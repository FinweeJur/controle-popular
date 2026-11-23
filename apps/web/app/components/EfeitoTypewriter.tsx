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

/** Estado da digitação; `texto` identifica a qual conteúdo ele pertence. */
interface AnimacaoTypewriter {
  texto: string;
  indice: number;
  concluido: boolean;
}

/** Estado em que `texto` já aparece inteiro (sem animação pendente). */
function animacaoParada(texto: string): AnimacaoTypewriter {
  return { texto, indice: texto.length, concluido: true };
}

/**
 * Estado de partida para `texto`. Sem `autoIniciar`, o texto já sai inteiro;
 * com texto vazio, não há o que digitar.
 */
function animacaoDePartida(
  texto: string,
  autoIniciar: boolean
): AnimacaoTypewriter {
  if (!autoIniciar) return animacaoParada(texto);
  return { texto, indice: 0, concluido: texto.length === 0 };
}

/**
 * Caracteres por tique: textos longos avançam mais rápido para a digitação
 * terminar no mesmo tempo percebido de um texto curto.
 */
function passoDaDigitacao(texto: string): number {
  if (texto.length > 600) return 3;
  if (texto.length > 250) return 2;
  return 1;
}

/** Um tique do timer: avança `passo` e diz se a digitação acabou neste tique. */
function avancarAnimacao(
  anim: AnimacaoTypewriter,
  texto: string,
  passo: number
): { proxima: AnimacaoTypewriter; terminou: boolean } {
  const base = anim.texto === texto ? anim : animacaoDePartida(texto, true);
  const indice = Math.min(base.indice + passo, texto.length);
  return {
    proxima: { texto, indice, concluido: indice >= texto.length },
    terminou: indice >= texto.length,
  };
}

function pararTimer(ref: { current: NodeJS.Timeout | null }) {
  if (ref.current) clearInterval(ref.current);
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
  const [anim, setAnim] = useState(() => animacaoDePartida(texto, autoIniciar));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Troca de texto reinicia a digitação por derivação, sem setState em efeito.
  const atual = anim.texto === texto ? anim : animacaoDePartida(texto, autoIniciar);

  const pular = useCallback(() => {
    pararTimer(timerRef);
    setAnim(animacaoParada(texto));
    aoConcluir?.();
  }, [texto, aoConcluir]);

  useEffect(() => {
    if (!autoIniciar || !texto) return;

    const passo = passoDaDigitacao(texto);
    timerRef.current = setInterval(() => {
      setAnim((prev) => {
        const { proxima, terminou } = avancarAnimacao(prev, texto, passo);
        if (terminou) {
          pararTimer(timerRef);
          aoConcluir?.();
        }
        return proxima;
      });
    }, velocidadeMs);

    return () => pararTimer(timerRef);
  }, [texto, velocidadeMs, autoIniciar, aoConcluir]);

  const textoExibido = texto.slice(0, atual.indice);

  return {
    textoExibido,
    concluido: atual.concluido,
    pular,
    progresso: texto.length > 0 ? atual.indice / texto.length : 1,
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
      className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[0.75rem] font-medium text-text-soft hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
    >
      <FastForward size={11} />
      <span>Pular animação</span>
    </button>
  );
}
