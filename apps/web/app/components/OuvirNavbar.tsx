"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Volume2, Pause, Play, Square } from "lucide-react";

type Estado = "idle" | "falando" | "pausado";

const emptySubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const SELETOR_IGNORAR = "script, style, noscript, [aria-hidden='true']";

function coletarTexto(no: Node): string {
  if (no.nodeType === Node.TEXT_NODE) return no.textContent ?? "";
  if (no.nodeType !== Node.ELEMENT_NODE) return "";
  const el = no as Element;
  if (el.matches?.(SELETOR_IGNORAR)) return "";
  const estilo = window.getComputedStyle(el);
  if (estilo.display === "none" || estilo.visibility === "hidden") return "";
  let texto = "";
  el.childNodes.forEach((filho) => { texto += coletarTexto(filho); });
  return estilo.display === "inline" || estilo.display === "inline-block" ? texto : `${texto} `;
}

function extrairTextoPrincipal(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  return coletarTexto(main).replace(/\s+/g, " ").trim();
}

function obterVozes(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const vozes = window.speechSynthesis.getVoices();
    if (vozes.length > 0) { resolve(vozes); return; }
    const aoCarregar = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", aoCarregar);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", aoCarregar);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", aoCarregar);
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

function escolherIdioma(vozes: SpeechSynthesisVoice[]): string {
  const tem = (p: string) => vozes.some((v) => v.lang?.toLowerCase().startsWith(p));
  if (tem("pt-br")) return "pt-BR";
  if (tem("pt-pt")) return "pt-PT";
  return "pt-BR";
}

/**
 * Botao "Ouvir" compacto para a TopNav.
 * Icone de amplificador + texto "Ouvir" no idle.
 * Durante leitura: Pausar/Retomar + Parar (icones, inline na navbar).
 */
export default function OuvirNavbar() {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const [estado, setEstado] = useState<Estado>("idle");
  const [suportado, setSuportado] = useState(false);
  const [temTexto, setTemTexto] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const ok = "speechSynthesis" in window;
    setSuportado(ok);
    if (!ok) return;
    window.speechSynthesis.cancel();
    setEstado("idle");
    setTemTexto(extrairTextoPrincipal().length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pathname]);

  useEffect(() => {
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);

  if (!mounted || !suportado || !temTexto) return null;

  async function iniciar() {
    const texto = extrairTextoPrincipal();
    if (!texto) return;
    const vozes = await obterVozes();
    const idioma = escolherIdioma(vozes);
    const voz = vozes.find((v) => v.lang?.toLowerCase() === idioma.toLowerCase());
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = idioma;
    if (voz) utterance.voice = voz;
    utterance.onend = () => setEstado("idle");
    utterance.onerror = () => setEstado("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setEstado("falando");
  }

  function pausar() { window.speechSynthesis.pause(); setEstado("pausado"); }
  function retomar() { window.speechSynthesis.resume(); setEstado("falando"); }
  function parar() { window.speechSynthesis.cancel(); setEstado("idle"); }

  if (estado === "idle") {
    return (
      <button
        type="button"
        onClick={iniciar}
        aria-label="Ouvir esta pagina em voz alta"
        className="cp-btn-anim flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
      >
        <Volume2 size={13} aria-hidden="true" className="shrink-0" />
        <span className="hidden sm:inline">Ouvir</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={estado === "falando" ? pausar : retomar}
        aria-pressed={estado === "falando"}
        aria-label={estado === "falando" ? "Pausar leitura" : "Retomar leitura"}
        className="cp-btn-anim flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[.8em] font-medium text-primary transition-colors duration-150 hover:bg-primary/20"
      >
        {estado === "falando" ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
        <span className="hidden sm:inline">{estado === "falando" ? "Pausar" : "Retomar"}</span>
      </button>
      <button
        type="button"
        onClick={parar}
        aria-label="Parar leitura"
        className="cp-btn-anim flex items-center justify-center rounded-md border border-border px-2 py-1 text-[.8em] text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
      >
        <Square size={12} aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {estado === "falando" && "Lendo a pagina em voz alta."}
        {estado === "pausado" && "Leitura pausada."}
      </span>
    </div>
  );
}
