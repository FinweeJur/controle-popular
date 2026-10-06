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
import {
  EFEITO_POR_PAGINA,
  FUNDO_TOKEN,
  TOKEN_COR_PRIMARIA,
  TOKEN_COR_SECUNDARIA,
  opcoesDeCores,
  type PaginaAbertura,
} from "@/lib/hero-vivo";
import { useTemaPortal } from "./useTemaPortal";

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

/**
 * Biblioteca three "pronta para o Vanta", carregada UMA vez por sessão.
 *
 * ═══ ORDEM IMPORTA: three PRIMEIRO, depois o efeito do Vanta ═══
 * Os arquivos de efeito do Vanta (dots, birds, net, cells) capturam
 * `window.THREE` na AVALIAÇÃO do módulo — a opção `THREE:` que a base
 * aceita é ignorada por eles (medido 05/10/2026: "Init error ... reading
 * 'PerspectiveCamera'" nos 4 eixos, com o GLOBE funcionando por ler a
 * opção). Publicamos então window.THREE antes do import do efeito.
 *
 * ⚠️ O objeto publicado NÃO pode ser o namespace do módulo: namespace
 * ES/webpack ignora atribuição de propriedade nova (medido: `t.x = 1`
 * não lança erro e o valor continua undefined). Clonamos os exports para
 * um objeto simples e é nele que classes extras são anexadas.
 *
 * A GPGPU (`GPUComputationRenderer`) vai sempre junto: o BIRDS lê a classe
 * do `window.THREE` capturado, e ela NÃO existe no core do three moderno —
 * mora em examples/jsm (medido 05/10/2026: `node -e "import('three')..."`
 * devolve false). Sem anexar, o init do birds quebra a cada frame
 * ("reading 'time'"). São ~10 KB e a classe é inofensiva para os efeitos
 * que não a usam.
 *
 * A promessa memoizada permite PRÉ-AQUECER os chunks (600 KB do three)
 * no mount da abertura, em paralelo com tudo o mais — quem chamar depois
 * recebe a promessa já em andamento/resolvida.
 */
let promessaBiblioteca: Promise<Record<string, unknown>> | null = null;

export function bibliotecaThree(): Promise<Record<string, unknown>> {
  if (!promessaBiblioteca) {
    promessaBiblioteca = (async () => {
      const modulo = await import("three");
      const biblioteca = Object.assign(Object.create(null), modulo) as Record<
        string,
        unknown
      >;
      const gpgpu = await import(
        "three/examples/jsm/misc/GPUComputationRenderer.js"
      );
      biblioteca.GPUComputationRenderer = gpgpu.GPUComputationRenderer;
      // Compatibilidade de API antiga para o Vanta (medido 06/10/2026):
      // o `GPUComputationRenderer` embutido do vanta.birds (vendor escrito
      // para o three r134) DESTRUTURA o THREE recebido exigindo
      // `PlaneBufferGeometry`; no three 0.156 essa classe virou
      // `PlaneGeometry` — o destructuring deixa `v = undefined` e o init
      // quebra com "v is not a constructor", derrubando o efeito inteiro
      // (o erro seguinte "reading 'time'" é consequência). Anexamos o
      // alias no objeto publicado; é o único nome renomeado que o vendor
      // pede (os outros — Camera, DataTexture, FloatType, Mesh,
      // NearestFilter, RGBAFormat, Scene, ShaderMaterial,
      // WebGLRenderTarget — continuam existindo em 0.156).
      if (
        !biblioteca.PlaneBufferGeometry &&
        typeof biblioteca.PlaneGeometry === "function"
      ) {
        biblioteca.PlaneBufferGeometry = biblioteca.PlaneGeometry;
      }
      // Compatibilidade 2 — DataTexture que JÁ NASCE com `needsUpdate`
      // (medido 06/10/2026, bisseção com three 0.156 × vanta.birds puro):
      // o `GPUComputationRenderer` embutido do Vanta cria a textura de
      // posição inicial com `new DataTexture(data, ...)` e NUNCA seta
      // `needsUpdate`. Sem esse sinal, o three moderno não sobe o array
      // pra GPU; o passThru do init copia preto, os render targets ficam
      // zerados e TODOS os pássaros nascem em (0,0,0) — o efeito roda
      // (draw call ok, sem erro de console) mas desenha nada. No three
      // r134 isso passava; em 0.156 derruba o birds inteiro. Só a
      // classe do CLONE publicado é trocada — o three do app não muda.
      const DataTextureOriginal = modulo.DataTexture;
      class DataTextureComUpload extends DataTextureOriginal {
        constructor(
          ...argumentos: ConstructorParameters<typeof DataTextureOriginal>
        ) {
          super(...argumentos);
          this.needsUpdate = true;
        }
      }
      biblioteca.DataTexture = DataTextureComUpload;
      return biblioteca;
    })();
  }
  return promessaBiblioteca;
}

export default function AberturaCanvas({ paginaId, ativo }: AberturaCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const efeitoRef = useRef<InstanciaVanta | null>(null);
  // Tema via atributo `data-theme` (MutationObserver), NÃO via next-themes:
  // a troca de tema do portal escreve o atributo, e o fundo WebGL precisa
  // recriar-se com as cores novas na hora — sem observer, o efeito nascia
  // com a cor do tema do carregamento e nunca mais mudava (dono, 05/10).
  const { tema } = useTemaPortal();

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
      // `null` = página sem canvas (home, decisão do dono 06/10/2026).
      // O AberturaHero já não monta este componente, mas a guarda fica
      // aqui também — a fonte única é o mapa, não o caller.
      if (!efeito) return;

      // Cores do TEMA ATIVO, resolvidas agora: primária e secundária
      // (pedido do dono 06/10/2026 — os dois tokens existem em todos os
      // 8 temas). Fundo continua sendo o `--cp-bg` do tema.
      const corBruta = estilo.getPropertyValue(TOKEN_COR_PRIMARIA).trim();
      const corSecundariaBruta = estilo
        .getPropertyValue(TOKEN_COR_SECUNDARIA)
        .trim();
      const fundoBruto = estilo.getPropertyValue(FUNDO_TOKEN).trim();
      const cor = normalizarCor(corBruta);
      const corSecundaria = normalizarCor(corSecundariaBruta);
      const fundo = normalizarCor(fundoBruto);
      if (!cor || !corSecundaria || !fundo) return;

      // Pega a biblioteca three (pré-aquecida pelo AberturaHero na
      // montagem) e publica em window antes do import do efeito — a
      // razão da ordem está no comentário de `bibliotecaThree`.
      const biblioteca = await bibliotecaThree();
      (window as unknown as { THREE: unknown }).THREE = biblioteca;
      const { default: criar } = await MODULOS[efeito]();
      if (cancelado || !ref.current) return;

      slot = document.createElement("div");
      slot.style.cssText = "position:absolute;inset:0;pointer-events:none;";
      slot.className = "cp-slot-vanta";
      // Marca de verificação: mostra com QUE tema e QUAL efeito este slot
      // foi criado (usado pelos testes Playwright; sem custo de runtime).
      slot.dataset.tema = tema;
      slot.dataset.efeito = efeito;
      ref.current.appendChild(slot);

      efeitoRef.current = criar({
        el: slot,
        THREE: biblioteca, // three.js do npm — NÃO a cópia r134 embutida do vanta
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        ...opcoesDeCores(efeito, { fundo, cor, corSecundaria }),
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
    // `tema` na dependência: troca de tema (observada pelo MutationObserver)
    // destrói e recria o efeito com as cores novas do tema ativo.
  }, [ativo, paginaId, tema]);

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
