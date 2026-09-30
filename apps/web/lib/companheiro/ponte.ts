/**
 * Ponte responsiva do portal para o companheiro local (bichinho-preguiça).
 *
 * PAPEL NO PROJETO
 * ----------------
 * O bichinho fica ao lado do cursor e precisa saber ONDE estão os alvos que a
 * pessoa deve clicar: os chips de citação `[n]` e o botão "Abrir página" do
 * widget do Seu Nonô. Este módulo transforma a geometria desses alvos num
 * pacote pequeno e estável que o portal envia para `http://127.0.0.1:<porta>`
 * do companheiro. O bichinho então caminha até o alvo certo.
 *
 * FONTE / REGRA DE NEGÓCIO
 * ------------------------
 * O alvo é SEMPRE medido na hora (`getBoundingClientRect`), nunca uma posição
 * fixa: a ponte tem que reagir a celular, tablet e meia tela. Coordenadas são
 * de viewport (px CSS), com o `dpr` (densidade da tela) viajando ao lado para o
 * companheiro converter para o pixel físico da tela.
 *
 * DECISÃO TÉCNICA
 * ---------------
 * As funções aqui são puras e trabalham sobre objetos geométricos simples
 * (`{ left, top, width, height }`), não sobre elementos do DOM. Assim a regra é
 * testável no `vitest` em ambiente Node, sem `jsdom`; o componente
 * `PonteCompanheiro.tsx` é a única camada que toca no DOM real.
 *
 * Privacidade (ver AGENTS.md §5.8): só geometria e a URL da página saem do
 * navegador. Nenhuma imagem de tela, nenhum texto digitado.
 */

/** Caixa no formato que `getBoundingClientRect` devolve (px CSS). */
export interface CaixaGeometrica {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Tamanho visível da janela, em px CSS. */
export interface Viewport {
  largura: number;
  altura: number;
}

/** Retângulo já arredondado, no sistema de coordenadas do viewport. */
export interface Retangulo {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/** Alvo bruto medido no DOM, antes de normalizar. */
export interface AlvoGeometrico {
  tipo: "fonte" | "abrir-pagina";
  /** Número do chip `[n]`, quando o alvo é uma citação. */
  indice?: number;
  caixa: CaixaGeometrica;
}

/** Alvo pronto para viajar ao companheiro. */
export interface AlvoPonte {
  tipo: "fonte" | "abrir-pagina";
  indice?: number;
  retangulo: Retangulo;
  visivel: boolean;
}

/** Pacote enviado à ponte local. */
export interface PacotePonte {
  /** Id da sessão pareada, quando já existe — liga a ponte ao turno. */
  sessaoId?: string;
  /** URL da página aberta no navegador. */
  url: string;
  /** Canto superior esquerdo do viewport em coordenadas de tela (px CSS). */
  origem: OrigemTela;
  viewport: Viewport & { dpr: number };
  alvos: AlvoPonte[];
  /** Epoch ms da medição. */
  em: number;
}

/** Canto superior esquerdo do viewport, em px CSS de tela. */
export interface OrigemTela {
  x: number;
  y: number;
}

/**
 * Dados de posição que o navegador expõe via `window`. Em px CSS.
 * `outer` é a janela inteira (com abas e barra de endereço); `inner` é o
 * viewport. A diferença entre eles é o "cromo" do navegador.
 */
export interface JanelaNavegador {
  screenX: number;
  screenY: number;
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
}

/**
 * Calcula onde o viewport começa na TELA a partir dos números do navegador.
 *
 * Por quê assim: o Chrome não entrega ao servidor local a posição da área de
 * conteúdo. Os números de `window` entregam. A barra de ferramentas fica toda
 * em cima, então o viewport começa `outerHeight - innerHeight` abaixo do topo
 * da janela; as bordas laterais são pequenas e o viewport fica centralizado na
 * largura. É uma aproximação honesta — o app documenta o erro de borda.
 */
export function origemNaTela(janela: JanelaNavegador): OrigemTela {
  const bordaLateral = Math.max(0, janela.outerWidth - janela.innerWidth) / 2;
  const cromoSuperior = Math.max(0, janela.outerHeight - janela.innerHeight);
  return {
    x: Math.round(janela.screenX + bordaLateral),
    y: Math.round(janela.screenY + cromoSuperior),
  };
}

/** Arredonda a caixa do DOM para inteiros do viewport. */
export function normalizarRetangulo(caixa: CaixaGeometrica, _viewport: Viewport): Retangulo {
  return {
    x: Math.round(caixa.left),
    y: Math.round(caixa.top),
    largura: Math.round(caixa.width),
    altura: Math.round(caixa.height),
  };
}

/**
 * Diz se o retângulo encosta no viewport. Alvo fora da tela é medido, mas
 * marcado `visivel: false` — o companheiro não aponta para o que não se vê.
 */
export function estaVisivel(retangulo: Retangulo, viewport: Viewport): boolean {
  if (retangulo.largura <= 0 || retangulo.altura <= 0) return false;
  return (
    retangulo.x < viewport.largura &&
    retangulo.y < viewport.altura &&
    retangulo.x + retangulo.largura > 0 &&
    retangulo.y + retangulo.altura > 0
  );
}

/** Normaliza cada alvo medido e calcula a visibilidade. */
export function montarAlvos(itens: AlvoGeometrico[], viewport: Viewport): AlvoPonte[] {
  return itens.map((item) => {
    const retangulo = normalizarRetangulo(item.caixa, viewport);
    return {
      tipo: item.tipo,
      indice: item.indice,
      retangulo,
      visivel: estaVisivel(retangulo, viewport),
    };
  });
}

/**
 * Monta o pacote final. Alvos fora da tela são descartados para o payload ficar
 * pequeno; se não sobrar nenhum, o componente nem envia (degradação silenciosa).
 */
export function montarPacotePonte(args: {
  sessaoId?: string;
  url: string;
  origem: OrigemTela;
  viewport: Viewport;
  dpr?: number;
  alvos: AlvoPonte[];
  em?: number;
}): PacotePonte {
  return {
    sessaoId: args.sessaoId,
    url: args.url,
    origem: args.origem,
    viewport: { largura: args.viewport.largura, altura: args.viewport.altura, dpr: args.dpr ?? 1 },
    alvos: args.alvos.filter((a) => a.visivel),
    em: args.em ?? Date.now(),
  };
}
