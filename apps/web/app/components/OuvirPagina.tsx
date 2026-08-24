"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
 * Botão flutuante "Ouvir esta página" -- lê o `<main>` em voz alta com
 * `window.speechSynthesis` (Web Speech API nativa, sem serviço externo
 * pago). Fica FORA do cabeçalho de zona de propósito: a barra de
 * Header.tsx/*layout.tsx já é apertada o bastante para forçar `flex-wrap`
 * em celular (ver os comentários de congresso/judiciario `layout.tsx`), e
 * um único componente global aqui cobre toda página com `<main>` --
 * inclusive `/busca` e `/funcaosocialterra`, que não usam nenhum dos
 * quatro cabeçalhos de zona e por isso nunca ganhariam o botão se ele
 * vivesse em Header.tsx.
 */
export default function OuvirPagina() {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const [estado, setEstado] = useState<Estado>("idle");
  const [suportado, setSuportado] = useState(false);
  const [temTexto, setTemTexto] = useState(false);

  // Roda no mount E em toda troca de rota client-side (next/link não
  // recarrega a página, então sem isto o botão continuaria "falando" o
  // texto da página ANTERIOR depois de navegar). `cancel()` num motor
  // parado é no-op, então é seguro chamar sempre.
  useEffect(() => {
    if (!mounted) return;
    const ok = "speechSynthesis" in window;
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setSuportado(ok);
    if (!ok) return;
    window.speechSynthesis.cancel();
    setEstado("idle");
    setTemTexto(extrairTextoPrincipal().length > 0);
  }, [mounted, pathname]);

  // Sair da página (fechar aba, hot-reload) -- não deixar o áudio tocando
  // sozinho depois que o componente já saiu da árvore.
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Sem suporte do navegador ou sem texto pra ler: esconde, não quebra --
  // pedido explícito do usuário.
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

  function pausar() {
    window.speechSynthesis.pause();
    setEstado("pausado");
  }

  function retomar() {
    window.speechSynthesis.resume();
    setEstado("falando");
  }

  function parar() {
    window.speechSynthesis.cancel();
    setEstado("idle");
  }

  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-2">
      {estado === "idle" && (
        <button
          type="button"
          onClick={iniciar}
          className="cp-btn-anim flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-lg"
        >
          <span aria-hidden="true">🔊</span>
          Ouvir esta página
        </button>
      )}
      {estado !== "idle" && (
        <>
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
        </>
      )}
      {/* Anunciado por leitor de tela mesmo se o foco não estiver nos
          botões acima (ex.: pessoa disparou a leitura e foi ler a página). */}
      <span role="status" className="sr-only">
        {estado === "falando" && "Lendo a página em voz alta."}
        {estado === "pausado" && "Leitura pausada."}
      </span>
    </div>
  );
}
