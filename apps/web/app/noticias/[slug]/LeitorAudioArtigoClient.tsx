"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Play, Pause, Square, Headphones, FileText, FastForward } from "lucide-react";

interface Props {
  titulo: string;
  resumo: string;
  paragrafos: string[];
}

type ModoLeitura = "resumo" | "completo";
type EstadoAudio = "parado" | "tocando" | "pausado";

/**
 * Remove sintaxe markdown para que a síntese de voz leia com naturalidade,
 * sem soletrar colchetes, parênteses de URLs ou símbolos de formatação.
 */
function limparMarkdownParaAudio(texto: string): string {
  return texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // substitui [rotulo](link) por rotulo
    .replace(/[*_#`~]/g, "") // remove marcadores de negrito/itálico/título
    .replace(/\s+/g, " ")
    .trim();
}

export default function LeitorAudioArtigoClient({ titulo, resumo, paragrafos }: Props) {
  const [suportado, setSuportado] = useState(false);
  const [estado, setEstado] = useState<EstadoAudio>("parado");
  const [modo, setModo] = useState<ModoLeitura>("resumo");
  const [velocidade, setVelocidade] = useState<number>(1.0);
  const [progressoTexto, setProgressoTexto] = useState<string>("");

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSuportado(true);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function obterTextoParaLer(): string {
    const tituloLimpo = limparMarkdownParaAudio(titulo);
    const resumoLimpo = limparMarkdownParaAudio(resumo);

    if (modo === "resumo") {
      return `${tituloLimpo}. Resumo: ${resumoLimpo}.`;
    }

    const corpoLimpo = paragrafos.map(limparMarkdownParaAudio).join(". ");
    return `${tituloLimpo}. Resumo: ${resumoLimpo}. Reportagem: ${corpoLimpo}.`;
  }

  function selecionarVozPtBr(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const vozes = window.speechSynthesis.getVoices();
    const vozPtBr = vozes.find((v) => v.lang.toLowerCase().startsWith("pt-br"));
    if (vozPtBr) return vozPtBr;
    const vozPt = vozes.find((v) => v.lang.toLowerCase().startsWith("pt"));
    return vozPt || null;
  }

  function iniciarLeitura() {
    if (!suportado || typeof window === "undefined") return;

    window.speechSynthesis.cancel();

    const texto = obterTextoParaLer();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.rate = velocidade;

    const voz = selecionarVozPtBr();
    if (voz) {
      utterance.voice = voz;
    }

    utterance.onstart = () => {
      setEstado("tocando");
      setProgressoTexto(
        modo === "resumo"
          ? "Reproduzindo resumo da notícia..."
          : "Reproduzindo reportagem completa..."
      );
    };

    utterance.onend = () => {
      setEstado("parado");
      setProgressoTexto("");
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled") {
        setEstado("parado");
        setProgressoTexto("");
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function pausarLeitura() {
    if (!suportado || typeof window === "undefined") return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setEstado("pausado");
      setProgressoTexto("Leitura em áudio pausada.");
    }
  }

  function retomarLeitura() {
    if (!suportado || typeof window === "undefined") return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setEstado("tocando");
      setProgressoTexto(
        modo === "resumo"
          ? "Continuando resumo da notícia..."
          : "Continuando reportagem completa..."
      );
    } else {
      iniciarLeitura();
    }
  }

  function pararLeitura() {
    if (!suportado || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setEstado("parado");
    setProgressoTexto("");
  }

  function alternarVelocidade() {
    const proximas: Record<number, number> = { 1.0: 1.25, 1.25: 1.5, 1.5: 1.0 };
    const novaVelocidade = proximas[velocidade] || 1.0;
    setVelocidade(novaVelocidade);

    // Se estiver tocando, reinicia com a nova velocidade
    if (estado === "tocando") {
      pararLeitura();
      setTimeout(() => {
        const texto = obterTextoParaLer();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = "pt-BR";
        utterance.rate = novaVelocidade;
        const voz = selecionarVozPtBr();
        if (voz) utterance.voice = voz;
        utterance.onstart = () => setEstado("tocando");
        utterance.onend = () => {
          setEstado("parado");
          setProgressoTexto("");
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  }

  if (!suportado) {
    return null;
  }

  return (
    <section
      aria-label="Leitor de áudio da notícia"
      className="mb-8 rounded-2xl border border-primary/20 bg-surface p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Identificação e Modo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headphones size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Ouvir Notícia em Áudio
              </h2>
              {estado === "tocando" && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/80 font-medium">
              Voz sintetizada acessível para quem prefere escutar
            </p>
          </div>
        </div>

        {/* Alternador de Modo (Resumo vs Completo) */}
        <div className="inline-flex rounded-lg bg-surface-2 p-0.5 border border-border self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              if (estado !== "parado") pararLeitura();
              setModo("resumo");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              modo === "resumo"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={modo === "resumo"}
          >
            <SparklesIcon size={12} />
            <span>Resumo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (estado !== "parado") pararLeitura();
              setModo("completo");
            }}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              modo === "completo"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={modo === "completo"}
          >
            <FileText size={12} />
            <span>Completo</span>
          </button>
        </div>
      </div>

      {/* Controles de Reprodução e Status */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          {estado === "parado" && (
            <button
              type="button"
              onClick={iniciarLeitura}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition-transform hover:scale-102 active:scale-98 shadow-xs"
              aria-label={`Iniciar leitura em áudio (${modo === "resumo" ? "resumo" : "completo"})`}
            >
              <Play size={14} className="fill-current" />
              <span>Ouvir {modo === "resumo" ? "Resumo" : "Artigo"}</span>
            </button>
          )}

          {estado === "tocando" && (
            <button
              type="button"
              onClick={pausarLeitura}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600 shadow-xs"
              aria-label="Pausar leitura em áudio"
            >
              <Pause size={14} className="fill-current" />
              <span>Pausar</span>
            </button>
          )}

          {estado === "pausado" && (
            <button
              type="button"
              onClick={retomarLeitura}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 shadow-xs"
              aria-label="Retomar leitura em áudio"
            >
              <Play size={14} className="fill-current" />
              <span>Retomar</span>
            </button>
          )}

          {estado !== "parado" && (
            <button
              type="button"
              onClick={pararLeitura}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
              aria-label="Parar leitura em áudio"
            >
              <Square size={13} className="fill-current" />
              <span>Parar</span>
            </button>
          )}

          {/* Seletor de Velocidade */}
          <button
            type="button"
            onClick={alternarVelocidade}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            title="Alterar velocidade de leitura"
            aria-label={`Velocidade de leitura: ${velocidade}x. Clique para alterar.`}
          >
            <FastForward size={13} />
            <span>{velocidade}x</span>
          </button>
        </div>

        {/* Mensagem de Estado */}
        {progressoTexto && (
          <p
            className="text-xs text-muted italic flex items-center gap-1.5"
            aria-live="polite"
          >
            <Volume2 size={13} className="text-primary animate-pulse" />
            <span>{progressoTexto}</span>
          </p>
        )}
      </div>
    </section>
  );
}

function SparklesIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
