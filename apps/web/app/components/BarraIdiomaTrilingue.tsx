"use client";

/**
 * @file BarraIdiomaTrilingue.tsx
 * @description Barra de controle trilíngue (PT-BR padrão, EN, ES), leitura em voz alta (TTS)
 * e integração com o assistente Seu Nonô para as páginas internacionais (/eua e /canada).
 *
 * Papel no portal:
 * Permite ao cidadão, pesquisador ou leitor internacional:
 * 1. Alternar o idioma de exibição dos textos principais da página (cabeçalhos, microresumos,
 *    cartões de topo, alertas editoriais e notas metodológicas) entre Português, Inglês e Espanhol.
 * 2. Ouvir o resumo e o conteúdo da página em voz alta (TTS) com seleção automática da voz
 *    sintetizada do navegador para `pt-BR`, `en-US`/`en-CA` ou `es-MX`/`es-ES`.
 * 3. Acionar o chatbot cívico Seu Nonô já contextualizado no idioma escolhido (PT, EN ou ES),
 *    respeitando o padrão de frases diretas de até 13 palavras e links oficiais verificados.
 * 4. Consultar o Glossário Comparado (Brasil ↔ EUA ↔ Canadá) sem sair da página.
 */

import { useEffect, useState } from "react";
import { Globe2, Volume2, Square, Sparkles, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import {
  IDIOMAS_DISPONIVEIS,
  UI_INTERNACIONAL,
  GLOSSARIO_SIGLAS_INTERNACIONAL,
  t,
  type IdiomaExibicao,
  type TextoTrilingue,
} from "@/lib/internacional/idiomas-internacional";

export interface BarraIdiomaTrilingueProps {
  /** Idioma atualmente selecionado na página. */
  idioma: IdiomaExibicao;
  /** Callback acionado quando o leitor clica em PT-BR, EN ou ES. */
  aoTrocarIdioma: (novoIdioma: IdiomaExibicao) => void;
  /** Microresumo trilíngue da página atual (lido primeiro pelo TTS). */
  resumoTrilingue: TextoTrilingue;
  /** Prompt trilíngue específico da página para abrir no Seu Nonô. */
  perguntaSeuNono?: TextoTrilingue;
  /** País em destaque para filtrar ou priorizar o glossário ("EUA" | "Canadá" | "Ambos"). */
  paisDestaque?: "EUA" | "Canadá" | "Ambos";
}

/**
 * Escolhe a melhor voz instalada no navegador para o idioma solicitado (`pt`, `en` ou `es`).
 */
function escolherVozPorIdioma(
  vozes: SpeechSynthesisVoice[],
  idioma: IdiomaExibicao
): { lang: string; voz?: SpeechSynthesisVoice } {
  const prefixos =
    idioma === "en"
      ? ["en-us", "en-ca", "en-gb", "en"]
      : idioma === "es"
      ? ["es-mx", "es-es", "es-419", "es-us", "es"]
      : ["pt-br", "pt-pt", "pt"];

  for (const pref of prefixos) {
    const encontrada = vozes.find((v) => v.lang?.toLowerCase().startsWith(pref));
    if (encontrada) {
      return { lang: encontrada.lang, voz: encontrada };
    }
  }

  const fallbackLang = idioma === "en" ? "en-US" : idioma === "es" ? "es-MX" : "pt-BR";
  return { lang: fallbackLang };
}

export default function BarraIdiomaTrilingue({
  idioma,
  aoTrocarIdioma,
  resumoTrilingue,
  perguntaSeuNono,
  paisDestaque = "Ambos",
}: BarraIdiomaTrilingueProps) {
  const [falando, setFalando] = useState(false);
  const [mostrarGlossario, setMostrarGlossario] = useState(false);

  // Carrega a preferência salva no navegador na montagem inicial
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("cp_lang_int") as IdiomaExibicao | null;
      if (salvo && (salvo === "pt" || salvo === "en" || salvo === "es") && salvo !== idioma) {
        aoTrocarIdioma(salvo);
      }
    } catch {
      // Ignora caso localStorage esteja indisponível
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interrompe qualquer leitura ativa ao desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function selecionarIdioma(novo: IdiomaExibicao) {
    aoTrocarIdioma(novo);
    try {
      localStorage.setItem("cp_lang_int", novo);
    } catch {
      // Ignora erro de escrita no storage
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && falando) {
      window.speechSynthesis.cancel();
      setFalando(false);
    }
  }

  function alternarLeituraVoz() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (falando) {
      window.speechSynthesis.cancel();
      setFalando(false);
      return;
    }

    const textoResumo = t(resumoTrilingue, idioma);
    const mainEl = document.querySelector("main");
    const textoCorpo = mainEl ? (mainEl.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 1800) : "";
    const textoCompleto = idioma === "pt" ? `${textoResumo}. ${textoCorpo}` : textoResumo;

    const vozes = window.speechSynthesis.getVoices();
    const { lang, voz } = escolherVozPorIdioma(vozes, idioma);

    const utterance = new SpeechSynthesisUtterance(textoCompleto);
    utterance.lang = lang;
    if (voz) utterance.voice = voz;
    utterance.onend = () => setFalando(false);
    utterance.onerror = () => setFalando(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setFalando(true);
  }

  function acionarSeuNono() {
    if (typeof window === "undefined") return;
    const padrao: TextoTrilingue = perguntaSeuNono ?? {
      pt: `Explique em português simples os dados de ${paisDestaque} nesta página`,
      en: `Explain in plain English the ${paisDestaque} transparency data on this page`,
      es: `Explica en español sencillo los datos de ${paisDestaque} en esta página`,
    };
    const pergunta = t(padrao, idioma);
    window.dispatchEvent(
      new CustomEvent("abrir-seu-nono", {
        detail: { pergunta },
      })
    );
  }

  const siglasFiltradas = GLOSSARIO_SIGLAS_INTERNACIONAL.filter(
    (s) => paisDestaque === "Ambos" || s.pais === paisDestaque || s.pais === "Global"
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs space-y-3 print:hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Seletor de idioma de exibição (PT-BR | EN | ES) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Globe2 className="h-4 w-4 text-primary" />
            {t(UI_INTERNACIONAL.barraTitulo, idioma)}
          </span>
          <div
            role="group"
            aria-label="Selecionar idioma de exibição das partes principais"
            className="inline-flex rounded-xl border border-border bg-surface-2 p-0.5"
          >
            {IDIOMAS_DISPONIVEIS.map((item) => {
              const ativo = idioma === item.codigo;
              return (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => selecionarIdioma(item.codigo)}
                  aria-pressed={ativo}
                  title={item.rotuloLongo}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    ativo
                      ? "bg-primary text-white shadow-2xs"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  <span>{item.bandeira}</span>
                  <span>{item.rotuloCurto}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botões de Ação: Ouvir TTS Trilíngue + Seu Nonô + Glossário */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={alternarLeituraVoz}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              falando
                ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-border bg-surface-2 text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {falando ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>{t(UI_INTERNACIONAL.botaoParar, idioma)}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <span>{t(UI_INTERNACIONAL.botaoOuvir, idioma)}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={acionarSeuNono}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t(UI_INTERNACIONAL.botaoSeuNono, idioma)}</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarGlossario((v) => !v)}
            aria-expanded={mostrarGlossario}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              {idioma === "en"
                ? "Glossary (BR ↔ US/CA)"
                : idioma === "es"
                ? "Glosario (BR ↔ US/CA)"
                : "Equivalência de Siglas (BR ↔ EUA/CA)"}
            </span>
            {mostrarGlossario ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Glossário Expansível de Siglas e Equivalentes no Brasil */}
      {mostrarGlossario && (
        <div className="border-t border-border pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {siglasFiltradas.map((item) => (
            <div
              key={item.sigla}
              className="rounded-xl border border-border bg-surface-2 p-2.5 text-xs space-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-foreground">{item.sigla}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    ≈ {item.equivalenteBrasil}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  {t(item.explicacao, idioma)}
                </p>
              </div>
              <a
                href={item.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-1"
              >
                {t(UI_INTERNACIONAL.fonteDiretaBotao, idioma)}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
