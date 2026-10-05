/**
 * @file leitor.ts
 * @description Estado e player da LEITURA EM VOZ ALTA (com traducao).
 *
 * Papel no portal: a barra superior (`OuvirNavbar`) e o controle flutuante
 * (`OuvirPagina`) precisam compartilhar o MESMO audio — o leitor comeca na
 * navbar e continua enquanto rola a pagina. Um so modulo guarda o estado e o
 * elemento `<audio>`, e os dois componentes so assinam. (Antes cada um tinha
 * a sua copia de `speechSynthesis`.)
 *
 * Fluxo: o texto visivel do `<main>` vai para `/api/ouvir`, que traduz e
 * sintetiza; volta um MP3 que toca aqui. Se o servidor nao tem credencial do
 * Azure (ex.: site oficial antes do deploy), cai na voz do navegador em
 * portugues — degradacao honesta, sem tela quebrada.
 *
 * Decisoes tecnicas:
 * - `useSyncExternalStore` (nao Context): o estado mora FORA do React para
 *   sobreviver a navegacao entre paginas (a casca nao desmonta, §5.13);
 * - o idioma escolhido fica em `localStorage` (`cp_idioma_leitura`);
 * - `Audio` e `URL.createObjectURL` so existem no cliente — nunca no import.
 */
"use client";

import { useSyncExternalStore } from "react";
import { acharIdioma, IDIOMA_PADRAO } from "./idiomas";

export type EstadoLeitura = "idle" | "carregando" | "falando" | "pausado";

export interface EstadoLeitor {
  estado: EstadoLeitura;
  /** Locale BCP-47 do idioma escolhido (ex.: "en-US"). */
  idioma: string;
  /** Mensagem curta quando a traducao falhou e caiu na voz do navegador. */
  aviso: string | null;
}

const CHAVE_IDIOMA = "cp_idioma_leitura";

let estado: EstadoLeitor = { estado: "idle", idioma: IDIOMA_PADRAO, aviso: null };
const ouvintes = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let urlAtual: string | null = null;

function emitir(): void {
  ouvintes.forEach((o) => o());
}

function definir(parcial: Partial<EstadoLeitor>): void {
  estado = { ...estado, ...parcial };
  emitir();
}

function snap(): EstadoLeitor {
  return estado;
}

function assinar(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

/** Assina o estado da leitura (re-renderiza quando muda). */
export function useLeitor(): EstadoLeitor {
  return useSyncExternalStore(assinar, snap, snap);
}

/** Carrega o idioma salvo; chame uma vez ao montar, no cliente. */
export function iniciarIdioma(): void {
  try {
    const salvo = window.localStorage.getItem(CHAVE_IDIOMA);
    if (salvo && acharIdioma(salvo)) definir({ idioma: salvo });
  } catch {
    // localStorage bloqueado: fica no padrao.
  }
}

function persistirIdioma(codigo: string): void {
  try {
    window.localStorage.setItem(CHAVE_IDIOMA, codigo);
  } catch {
    // sem persistencia: vale so nesta visita.
  }
}

/** Troca o idioma escolhido (antes de iniciar a leitura). */
export function definirIdioma(codigo: string): void {
  if (!acharIdioma(codigo)) return;
  persistirIdioma(codigo);
  definir({ idioma: codigo, aviso: null });
}

function limparUrl(): void {
  if (urlAtual) {
    URL.revokeObjectURL(urlAtual);
    urlAtual = null;
  }
}

function pegarAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
    audio.addEventListener("playing", () => definir({ estado: "falando" }));
    audio.addEventListener("pause", () => {
      if (audio && !audio.ended) definir({ estado: "pausado" });
    });
    audio.addEventListener("ended", () => {
      limparUrl();
      definir({ estado: "idle" });
    });
  }
  return audio;
}

/** Fala com a voz do navegador (fallback quando o Azure nao responde). */
function falarComNavegador(texto: string, locale: string): void {
  if (!("speechSynthesis" in window)) {
    definir({ estado: "idle", aviso: "Seu navegador nao le em voz alta." });
    return;
  }
  const prefixo = locale.split("-")[0].toLowerCase();
  const vozes = window.speechSynthesis.getVoices();
  const voz = vozes.find((v) => v.lang?.toLowerCase().startsWith(prefixo));
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = locale;
  if (voz) fala.voice = voz;
  fala.onend = () => definir({ estado: "idle" });
  fala.onerror = () => definir({ estado: "idle" });
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(fala);
  definir({ estado: "falando" });
}

/** Le `texto` no idioma escolhido (traduz e fala). */
export async function ouvir(texto: string, idioma?: string): Promise<void> {
  const conf = acharIdioma(idioma ?? estado.idioma) ?? acharIdioma(IDIOMA_PADRAO)!;
  const limpo = texto.trim();
  if (!limpo) return;

  parar();
  persistirIdioma(conf.codigo);
  definir({ estado: "carregando", idioma: conf.codigo, aviso: null });

  try {
    const r = await fetch("/api/ouvir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: limpo, idioma: conf.codigo }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const blob = await r.blob();
    const a = pegarAudio();
    limparUrl();
    urlAtual = URL.createObjectURL(blob);
    a.src = urlAtual;
    await a.play();
    definir({ estado: "falando" });
  } catch {
    // Azure indisponivel: le o original com a voz do aparelho (sem traducao).
    definir({
      aviso:
        conf.codigo === IDIOMA_PADRAO
          ? null
          : "Traducao indisponivel agora; lendo em portugues.",
    });
    falarComNavegador(limpo, IDIOMA_PADRAO);
  }
}

/** Pausa a leitura. */
export function pausar(): void {
  if (estado.estado === "falando" || estado.estado === "carregando") {
    audio?.pause();
    if (estado.estado === "falando") window.speechSynthesis?.pause();
    definir({ estado: "pausado" });
  }
}

/** Retoma a leitura pausada. */
export function retomar(): void {
  if (estado.estado !== "pausado") return;
  if (audio && audio.src) void audio.play();
  else window.speechSynthesis?.resume();
  definir({ estado: "falando" });
}

/** Para a leitura e volta ao inicio. */
export function parar(): void {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  limparUrl();
  definir({ estado: "idle" });
}

const SELETOR_IGNORAR = "script, style, noscript, [aria-hidden='true']";

/** Texto visivel de um no, pulando script/style e `aria-hidden`. */
function coletarTexto(no: Node): string {
  if (no.nodeType === Node.TEXT_NODE) return no.textContent ?? "";
  if (no.nodeType !== Node.ELEMENT_NODE) return "";
  const el = no as Element;
  if (el.matches?.(SELETOR_IGNORAR)) return "";
  const estilo = window.getComputedStyle(el);
  if (estilo.display === "none" || estilo.visibility === "hidden") return "";
  let texto = "";
  el.childNodes.forEach((filho) => {
    texto += coletarTexto(filho);
  });
  return estilo.display === "inline" || estilo.display === "inline-block"
    ? texto
    : `${texto} `;
}

/**
 * Texto do `<main>` da pagina — sem menu e rodape, que repetem em toda pagina.
 * Le ao vivo (nunca um clone) para respeitar o que esta visivel agora.
 */
export function extrairTextoPrincipal(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  return coletarTexto(main).replace(/\s+/g, " ").trim();
}
