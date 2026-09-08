"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

type Estado = "idle" | "falando" | "pausado";

const emptySubscribe = () => () => {};

/** Mesmo padrão de hidratação dos outros controles de acessibilidade --
 *  `speechSynthesis` só existe no cliente. */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const SELETOR_IGNORAR = "script, style, noscript, [aria-hidden='true']";

/** Texto visível de um nó, pulando script/style e tudo marcado
 *  `aria-hidden="true"` -- ícone decorativo, seta de RotuloBadge, badge
 *  vazio. Não usa `innerText` porque ele exige o nó estar CONECTADO e
 *  renderizado para calcular visibilidade corretamente; como este código
 *  lê o <main> ao vivo (nunca um clone destacado), anda a árvore à mão com
 *  `getComputedStyle`, que funciona em qualquer nó conectado. */
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
  // Espaço nas quebras de bloco para não grudar frases de elementos
  // diferentes ("...valorNome do fornecedor..."); em linha, concatena direto.
  return estilo.display === "inline" || estilo.display === "inline-block" ? texto : `${texto} `;
}

/** Texto do <main> da página -- sem cabeçalho/menu (repete em toda página)
 *  e sem elemento decorativo. Cada zona já embrulha o conteúdo em <main>
 *  (`app/[municipio]/layout.tsx`, `congresso/layout.tsx`,
 *  `judiciario/layout.tsx`, `ambiental/layout.tsx`); páginas fora de zona
 *  (`/busca`, `/funcaosocialterra`) ganharam a tag como parte desta mudança
 *  -- ver o commit. */
function extrairTextoPrincipal(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  return coletarTexto(main).replace(/\s+/g, " ").trim();
}

/** `getVoices()` carrega de forma assíncrona em alguns navegadores --
 *  primeira chamada na sessão pode devolver lista vazia até o evento
 *  `voiceschanged`. O timeout cobre motor que nunca dispara o evento. */
function obterVozes(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const vozes = window.speechSynthesis.getVoices();
    if (vozes.length > 0) {
      resolve(vozes);
      return;
    }
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

/** pt-BR primeiro, pt-PT como alternativa (pedido do usuário: testar os
 *  dois, motor varia por navegador/SO) -- se nenhuma voz portuguesa está
 *  instalada, pede pt-BR mesmo assim: o motor escolhe a voz mais próxima
 *  em vez de travar. */
function escolherIdioma(vozes: SpeechSynthesisVoice[]): string {
  const tem = (prefixo: string) => vozes.some((v) => v.lang?.toLowerCase().startsWith(prefixo));
  if (tem("pt-br")) return "pt-BR";
  if (tem("pt-pt")) return "pt-PT";
  return "pt-BR";
}

/**
 * Controles flutuantes de leitura — só aparecem DURANTE leitura ativa.
 * O botão de INICIAR foi movido para a TopNav (OuvirNavbar.tsx).
 * Este componente permanece como controle de Pausar/Retomar/Parar flutuante
 * para não perder o controle em páginas longas após rolar para baixo.
 *
 * Sincroniza com o speechSynthesis global: detecta se está falando pelo
 * evento `voiceschanged` e polling de 500 ms.
 */
export default function OuvirPagina() {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const [estado, setEstado] = useState<Estado>("idle");

  // Ao trocar rota, cancela a leitura
  useEffect(() => {
    if (!mounted) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setEstado("idle");
  }, [mounted, pathname]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Polling leve para detectar estado externo (início via OuvirNavbar)
  useEffect(() => {
    if (!mounted || !("speechSynthesis" in window)) return;
    const id = setInterval(() => {
      const ss = window.speechSynthesis;
      if (ss.speaking && !ss.paused) setEstado("falando");
      else if (ss.paused) setEstado("pausado");
      else setEstado("idle");
    }, 500);
    return () => clearInterval(id);
  }, [mounted]);

  // Só mostra durante leitura ativa (não duplica o botão idle da navbar)
  if (!mounted || estado === "idle") return null;

  function pausar() { window.speechSynthesis.pause(); setEstado("pausado"); }
  function retomar() { window.speechSynthesis.resume(); setEstado("falando"); }
  function parar() { window.speechSynthesis.cancel(); setEstado("idle"); }

  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={estado === "falando" ? pausar : retomar}
        aria-pressed={estado === "falando"}
        className="cp-btn-anim flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-lg"
      >
        <span aria-hidden="true">{estado === "falando" ? "⏸" : "▶"}</span>
        {estado === "falando" ? "Pausar" : "Retomar"}
      </button>
      <button
        type="button"
        onClick={parar}
        aria-label="Parar leitura"
        className="cp-btn-anim flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg"
      >
        <span aria-hidden="true">■</span>
      </button>
      <span role="status" className="sr-only">
        {estado === "falando" && "Lendo a página em voz alta."}
        {estado === "pausado" && "Leitura pausada."}
      </span>
    </div>
  );
}
