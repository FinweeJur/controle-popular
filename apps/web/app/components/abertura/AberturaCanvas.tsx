"use client";

/**
 * AberturaCanvas — a camada WebGL (Vanta.js + three.js) do fundo da
 * abertura viva. Renderiza UM efeito por página (mapa único em
 * `lib/hero-vivo.ts`) e reage ao tema ativo.
 *
 * Decisões técnicas não triviais:
 *
 * 1. IMPORT DINÂMICO POR EFEITO: cada efeito do Vanta é um arquivo
 *    separado (`vanta.globe.min.js`, ...). O mapa `MODULOS` mantém o
 *    import estático para o bundler (webpack exige caminho analisável),
 *    mas como a função só roda no cliente e sob demanda, a página que
 *    não tem a abertura NUNCA baixa o efeito — e cada página baixa só o
 *    SEU efeito (~40-60 KB gzip) mais o three.js compartilhado.
 *
 * 2. THREE DO NPM, NÃO O r134 EMBUTIDO: o pacote vanta (2021) embute uma
 *    cópia antiga do three.js. Passar a instância do npm pela opção
 *    `THREE` faz o efeito rodar com a versão atualizada e auditável —
 *    suporte oficial do Vanta (README, "Using THREE from npm").
 *
 * 3. COR VEM DO TEMA, NUNCA DE HEX CRAVADO: os tokens do portal estão em
 *    OKLCH no globals.css (armadilha do AGENTS: "medir cor em HSL" está
 *    errado aqui). Para virar cor de three.js, o valor resolvido
 *    (`getComputedStyle`) é normalizado por um canvas 2D — o navegador
 *    serializa QUALQUER formato CSS válido para `#rrggbb`/`rgba()`.
 *    Trocou o tema → efeito destruído e recriado com as cores novas.
 *
 * 4. CICLO DE VIDA PRESO AO `ativo`: quem controla é o `AberturaHero`
 *    (IntersectionObserver + media queries). `ativo=false` destrói o
 *    efeito — o canvas não queima GPU fora da tela nem com reduced-motion.
 */

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  COR_TOKEN_POR_PAGINA,
  EFEITO_POR_PAGINA,
  FUNDO_TOKEN,
  opcoesDeCores,
  type PaginaAbertura,
} from "@/lib/hero-vivo";

interface InstanciaVanta {
  destroy: () => void;
  setOptions: (opcoes: Record<string, unknown>) => void;
}

type CriadorVanta = (opcoes?: Record<string, unknown>) => InstanciaVanta;

/** Um arquivo de efeito por página — o bundler gera um chunk por entrada. */
const MODULOS: Record<string, () => Promise<{ default: CriadorVanta }>> = {
  globe: () => import("vanta/dist/vanta.globe.min.js"),
  dots: () => import("vanta/dist/vanta.dots.min.js"),
  birds: () => import("vanta/dist/vanta.birds.min.js"),
  net: () => import("vanta/dist/vanta.net.min.js"),
  cells: () => import("vanta/dist/vanta.cells.min.js"),
};

/** Converte `color(srgb r g b)` (serialização de cores amplas) em hex. */
function deSrgbParaHex(m: RegExpMatchArray): string {
  const canal = (v: string) => {
    const n = Math.round(parseFloat(v) * 255);
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  };
  return `#${canal(m[1])}${canal(m[2])}${canal(m[3])}`;
}

/**
 * Normaliza QUALQUER cor CSS resolvida para um formato que o three.js
 * aceita (`#rrggbb`). O truque do canvas 2D: atribuir a cor a `fillStyle`
 * e reler faz o navegador serializar no formato canônico.
 */
function normalizarCor(valor: string): string | null {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = valor;
  const saida = ctx.fillStyle;
  if (saida.startsWith("#")) return saida;
  // Chrome serializa oklch()/lab() como color(srgb ...) em alguns casos.
  const srgb = saida.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (srgb) return deSrgbParaHex(srgb);
  // rgba()/rgb() o three.js aceita direto (THREE.Color usa setStyle).
  if (saida.startsWith("rgb")) return saida;
  return null;
}

export interface AberturaCanvasProps {
  /** Página onde a abertura vive — define efeito e token de cor. */
  paginaId: PaginaAbertura;
  /** false = destruir o efeito (fora da tela / sem permissão de animar). */
  ativo: boolean;
}

/** Suporte a WebGL, consultado na hora de ligar o efeito (sem estado
 * React: o resultado não muda o render, só se o efeito nasce ou não). */
function temWebgl(): boolean {
  try {
    const teste = document.createElement("canvas");
    return !!(teste.getContext("webgl") || teste.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export default function AberturaCanvas({ paginaId, ativo }: AberturaCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const efeitoRef = useRef<InstanciaVanta | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelado = false;
    // Slot IMPERATIVO: o Vanta recebe um <div> que NÓS criamos e removemos,
    // nunca um nó renderizado pelo React. Motivo medido em 05/10/2026 (bisseção
    // Playwright, diag v6): o canvas filho direto de um nó do React quebrava a
    // desmontagem da rota com "Failed to execute 'removeChild' on 'Node'" —
    // o React quebrava a árvore, a navegação caía em reload completo e o
    // áudio do rádio (casca persistente, §5.13) morria em todo salto a partir
    // de uma página com abertura. Com o slot, o React só remove um wrapper
    // VAZIO e o slot morre no cleanup, antes de qualquer conflito.
    let slot: HTMLDivElement | null = null;

    async function ligar() {
      if (!ativo || !ref.current) return;

      // Sem WebGL (navegador travado, GPU bloqueada): fica em silêncio —
      // o fundo estático do tema continua lá, e o nome da página nunca
      // dependeu do canvas.
      if (!temWebgl()) return;

      // Alto contraste: trava dupla (a primeira é o AberturaHero). O
      // token --cp-glow vira "transparent" nesse tema — se for assim,
      // não há canvas nem aqui.
      const estilo = getComputedStyle(ref.current);
      if (estilo.getPropertyValue("--cp-glow").trim() === "transparent") return;

      const efeito = EFEITO_POR_PAGINA[paginaId];
      const corToken = COR_TOKEN_POR_PAGINA[paginaId];

      // Cores do TEMA ATIVO, resolvidas agora. O elemento da seção herda
      // --eixo-ativo-cor do EixoLayout (eixos) e --cp-primary do :root (home).
      const corBruta = estilo.getPropertyValue(corToken).trim();
      const fundoBruto = estilo.getPropertyValue(FUNDO_TOKEN).trim();
      const cor = normalizarCor(corBruta);
      const fundo = normalizarCor(fundoBruto);
      if (!cor || !fundo) return;

      const [{ default: criar }, THREE] = await Promise.all([
        MODULOS[efeito](),
        import("three"),
      ]);
      if (cancelado || !ref.current) return;

      slot = document.createElement("div");
      slot.style.cssText = "position:absolute;inset:0;pointer-events:none;";
      slot.className = "cp-slot-vanta";
      ref.current.appendChild(slot);

      efeitoRef.current = criar({
        el: slot,
        THREE, // three.js do npm — NÃO a cópia r134 embutida do vanta
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        ...opcoesDeCores(efeito, { fundo, cor }),
      });
    }

    ligar();

    return () => {
      cancelado = true;
      if (efeitoRef.current) {
        // ⚠️ BLINDAGEM OBRIGATÓRIA (medido 05/10/2026, diag v5-v7): o
        // destroy do Vanta chama `el.removeChild(canvas)` e o erro
        // NotFoundError que ele solta quando o canvas já não é filho
        // direto (o Vanta mexe no próprio DOM durante a vida do efeito)
        // era engolido por NINGUÉM — o React tratava como erro de árvore,
        // abortava a navegação client-side e caía em RELOAD COMPLETO,
        // matando o áudio do rádio (casca persistente, §5.13). O cleanup
        // NUNCA pode lançar: o pior caso aqui é um canvas órfão que o
        // coletor de lixo do navegador recolhe junto com a árvore solta.
        try {
          efeitoRef.current.destroy();
        } catch (erro) {
          console.warn("[abertura] destroy do Vanta falhou (ignorado):", erro);
        }
        efeitoRef.current = null;
      }
      // O slot sai em seguida: com o destroy blindado, remover o slot
      // garante que o wrapper do React volte VAZIO para a desmontagem.
      if (slot && slot.parentElement) {
        try {
          slot.parentElement.removeChild(slot);
        } catch {
          // árvore já destacada — nada a fazer, e tudo bem.
        }
      }
    };
    // `resolvedTheme` na dependência: troca de tema destrói e recria o
    // efeito com as cores novas (mais confiável que setOptions parcial).
  }, [ativo, paginaId, resolvedTheme]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 z-0"
      // Fundo do tema atrás do canvas: enquanto o efeito carrega (e para
      // sempre, se o canvas não existir) a abertura já tem a cor certa.
      style={{ backgroundColor: "var(--cp-bg)" }}
    />
  );
}
