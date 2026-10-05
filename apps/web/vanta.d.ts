/**
 * Tipos do Vanta.js — fundos WebGL animados (https://www.vantajs.com).
 *
 * O pacote `vanta` (MIT) não publica tipos TypeScript. Esta declaração
 * cobre os módulos de efeito de `vanta/dist/` usados pela abertura viva
 * das 5 páginas nobres (home + 4 eixos): globe, dots, birds, net, cells.
 *
 * Decisões:
 * - `THREE?: unknown`: o Vanta aceita receber a instância do three.js do
 *   npm (opção `THREE`) em vez do script global r134 embutido — é assim
 *   que o portal evita carregar uma cópia antiga da biblioteca.
 * - As opções específicas de cada efeito (`color`, `backgroundColor`,
 *   `glowColor`, `color2`...) ficam como índice aberto, porque variam por
 *   efeito e são montadas em `lib/hero-vivo.ts`.
 */
declare module "vanta/dist/*" {
  interface OpcoesVanta {
    /** Elemento que recebe o canvas (o Vanta o preenche como fundo). */
    el?: HTMLElement | null;
    /** Instância do three.js do npm, para NÃO usar o r134 embutido. */
    THREE?: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    [opcao: string]: unknown;
  }

  interface InstanciaVanta {
    /** Encerra o loop de render e remove o canvas — obrigatório no unmount. */
    destroy: () => void;
    /** Troca opções (ex.: cores) sem recriar o efeito. */
    setOptions: (opcoes: Record<string, unknown>) => void;
    /** Redesenha após mudança de tamanho do container. */
    resize?: () => void;
  }

  const criarEfeito: (opcoes?: OpcoesVanta) => InstanciaVanta;
  export default criarEfeito;
}
