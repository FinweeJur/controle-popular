"use client";

/**
 * RastroCursor — trilha de LETRAS que desenha palavras seguindo o mouse.
 *
 * O que é: uma corrente de caracteres atrás do ponteiro. Cada caractere é
 * um elo da corrente: o primeiro persegue o mouse, o segundo persegue o
 * primeiro, e assim por diante — o conjunto forma a curva do movimento. As
 * letras saem de um texto fixo (o vocabulário do portal), lidas em ciclo:
 * conforme a cabeça anda, o texto "rola" pela corrente e as palavras vão se
 * alternando (paz, harmonia, saúde, natureza, ayllu, pachamama, abya yala…).
 * De tempos em tempos entra a saudação pelo relógio de quem lê: bom dia,
 * boa tarde ou boa noite.
 *
 * Pedido do dono (30/09/2026), a partir do vídeo "Vibe Coding a Cursor
 * Trail Text Component in Framer" (efeito "TrailCursor"): a referência
 * mostra uma corrente de letras escrevendo a palavra atrás do cursor. O
 * módulo do Framer é asset pago e vem vazio fora do editor, então o efeito
 * foi RECRIADO (não copiado).
 *
 * Decisões técnicas:
 * - corrente de nós com suavização (lerp) em `requestAnimationFrame`, texto
 *   do DOM direto (sem re-render do React a cada quadro);
 * - a cabeça anda mais rápido (0,15) que a cauda (0,13 de perseguição ao
 *   nó anterior): dá o efeito de chicote/rastro da referência. Valores
 *   baixos de propósito — pedido do dono (03/10/2026): perseguição ainda
 *   mais lenta, atrasada atrás do ponteiro, sem colar nele (era 0,26/0,22
 *   desde 02/10/2026);
 * - o índice do texto avança por DISTÂNCIA percorrida (36 px por letra),
 *   não por tempo: parado, o texto não troca sozinho; andando, rola. São
 *   36 px (era 26) para cada letra durar mais tempo na tela — pedido do
 *   dono (03/10/2026);
 * - a opacidade cai ao longo da corrente (`--i`) e a camada some quando o
 *   mouse para (economiza bateria e evita a "bola" de letras sobrepostas).
 *   O desaparecer é lento de propósito. Histórico de OCIOSO_MS + fade:
 *   700 ms/0,7 s até 02/10/2026; 1600 ms/1,6 s em 03/10; 1000 ms/1,6 s
 *   em 05/10 (o dono achou o parado longo demais); 1800 ms/2,4 s em
 *   10/10, quando o dono pediu mais tempo para LER as letras paradas;
 * - o custo por quadro baixou sem empobrecer o efeito (10/10/2026, por
 *   lentidão relatada em PCs de baixa potência e conexões lentas): a
 *   posição vira pixel inteiro antes de ir ao DOM e só se escreve quando
 *   mudou 1 px ou mais. A cauda anda devagar e passa a escrever de vez em
 *   quando em vez de a cada quadro; o `toFixed(1)` saiu do laço (antes
 *   eram 96 formatações e 48 escritas de style por quadro, sempre). A
 *   redução vem da própria física: elo distante anda menos de 1 px por
 *   quadro na maior parte do tempo, então a régua de 1 px o captura;
 * - máquina fraca (poucos núcleos ou pouca memória, ver `maquinaFraca`)
 *   carrega menos elos (28, era 48) e sem o brilho neon — o blur de 9 px
 *   rasterizado em cada elo é o item mais caro da tela em GPU integrada.
 *   Máquina boa continua com os 48 elos e o neon de sempre;
 * - as letras da cabeça (os 4 primeiros elos) ficam um pouco maiores e a
 *   corrente cai de opacidade mais devagar: pedido do dono em 10/10/2026 —
 *   "deixar alguns milissegundos mais visíveis e devagar as letras na hora
 *   de chegar perto do cursor e desaparecer para facilitar leitura". O
 *   ganho de leitura é só CSS barato (tamanho fixo por elo, calculado uma
 *   vez a partir de `--i`, e transition de opacidade que roda no
 *   compositor) — nenhum trabalho novo de JS por quadro;
 * - a trilha agora é OPT-IN (pedido do dono, 19/10/2026): preferência
 *   `cp_rastro_cursor` no `localStorage` (padrão DESLIGADO; só `on` liga),
 *   trocada pelo botão mágico flutuante (`RastroCursorBotao.tsx`), pelo
 *   cartão "Acessibilidade" do Seu Nonô ou por pedido em texto
 *   ("desativar trilha do cursor"). A troca viaja pelo evento
 *   `cp:rastro-cursor` e monta/desmonta a corrente na hora, sem
 *   recarregar a página — desligada, não existe elo nem quadro nenhum
 *   rodando;
 * - é decorativo: `aria-hidden`, `pointer-events: none`, sem captura de
 *   clique; respeita `prefers-reduced-motion` e não liga em tela de toque.
 *
 * Cores: usa `--cp-accent` (acompanha o tema) com um brilho suave, no
 * espírito neon da referência.
 */

import { useEffect, useRef } from "react";

/**
 * Preferência da trilha — pedido do dono (19/10/2026): a trilha é OPT-IN,
 * ligada pelo botão mágico flutuante (`RastroCursorBotao.tsx`). Antes
 * (10/10/2026) era "ligada por padrão, o visitante podia desativar". Padrão
 * trocado: só o valor `on` liga.
 *
 * O aviso de troca viaja pela janela (evento `cp:rastro-cursor`) porque os
 * dois consumidores são irmãos no DOM: o componente mora no layout raiz e o
 * botão no Seu Nonô — mesma barramento do `cp:companheiro-trocar-pet`.
 */
export const CHAVE_RASTRO_CURSOR = "cp_rastro_cursor";
export const EVENTO_RASTRO_CURSOR = "cp:rastro-cursor";

/**
 * Lê a preferência. Ligada por padrão; só `off` desliga. No servidor (SSR)
 * devolve `true` — a trilha é decoração montada só no cliente, então o
 * valor aqui nunca vaza para o HTML.
 */
export function lerRastroCursor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Padrão DESLIGADO (pedido do dono, 19/10/2026): a trilha só existe se
    // a pessoa ligar pelo botão mágico. Só o valor `on` liga.
    return localStorage.getItem(CHAVE_RASTRO_CURSOR) === "on";
  } catch {
    // localStorage indisponível (modo privado, desabilitado): mantém o
    // padrão desligado — ninguém ganha um efeito que não pediu.
    return false;
  }
}

/**
 * Grava a preferência e avisa a janela inteira. O evento faz o
 * `RastroCursor` montar/desmontar a corrente na hora e o botão de controle
 * se redesenhar, sem estado compartilhado nem contexto React.
 */
export function definirRastroCursor(ativo: boolean): void {
  try {
    localStorage.setItem(CHAVE_RASTRO_CURSOR, ativo ? "on" : "off");
  } catch {
    // Sem localStorage a escolha só não sobrevive à recarga — o efeito
    // continua respondendo ao evento enquanto a aba estiver aberta.
  }
  window.dispatchEvent(new CustomEvent(EVENTO_RASTRO_CURSOR));
}

/**
 * Vocabulário da trilha, na ordem em que as palavras se alternam. Fica aqui
 * (fora do render) para o componente ser só apresentação; acrescentar
 * palavra é editar esta lista.
 */
const PALAVRAS = [
  "paz",
  "harmonia",
  "saúde",
  "vida",
  "natureza",
  "bem viver",
  "ayllu",
  "pachamama",
  "pindorama",
  "abya yala",
  "cultura",
  "lazer",
  "esporte",
  "orçamento",
  "direitos",
  "revolução",
  "povo",
  "latinoamérica",
  "brasilcoms",
  "étempodeavançar",
  "soberania",
  "mística",
  "umdiadecadavez",
  "respire",
  "obrigado",
  "cooperação",
  "solidariedade",
  "tatarana",
  "urutubranco",
  "diadorim",
  "grandesertão",
  "chapada",
  "riosvivos",
  "florestadepé",
  "mulheresvivaselivres",
  "demarcaçãojá",
  "lutarsempre",
] as const;

/** Saudação pelo relógio local de quem lê. */
function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h >= 5 && h < 12) return "bom dia";
  if (h >= 12 && h < 18) return "boa tarde";
  return "boa noite";
}

/**
 * Texto da corrente: as palavras separadas por espaço, com a saudação do
 * horário entrando a cada 6 palavras. O espaço vira um elo "vazio", que
 * separa visualmente uma palavra da outra.
 */
function montarTexto(): string {
  const partes: string[] = [];
  PALAVRAS.forEach((palavra, i) => {
    partes.push(palavra);
    if ((i + 1) % 6 === 0) partes.push(saudacao());
  });
  return partes.join(" ").toUpperCase();
}

/** Quantos elos (letras) a corrente tem, em máquina com fôlego. */
const ELOS = 48;
/**
 * Quantos elos a corrente tem em máquina fraca (10/10/2026). 28 (−42%)
 * ainda forma a curva legível, mas corta 20 nós, 20 camadas de composição
 * e 20 rasters de brilho — o que é o que trava em GPU integrada e em PC
 * de baixa potência. Só cai aqui quem `maquinaFraca()` classificar; a
 * máquina boa continua com os `ELOS`.
 */
const ELOS_FRACOS = 28;
/**
 * Núcleos lógicos ATÉ os quais a máquina é tratada como fraca (10/10/2026).
 * `navigator.hardwareConcurrency` conta threads, não GHz: 4 ou menos
 * costuma ser laptop antigo ou Chromebook — exatamente o hardware em que o
 * dono relatou lentidão.
 */
const NUCLEOS_FRACOS_ATE = 4;
/**
 * Memória (GB) ATÉ a qual a máquina é tratada como fraca (10/10/2026).
 * `navigator.deviceMemory` arredonda e satura em 8, então 4 significa
 * "4 GB ou menos" — beco apertado para o navegador + este portal.
 */
const MEMORIA_FRACA_ATE_GB = 4;
/**
 * Suavização da cabeça (persegue o mouse). Quanto maior, mais rápido ela
 * acompanha e menos o rastro atrasa. NOVA ORDEM do dono (05/10/2026): o
 * rastro estava lento e atrasado demais a pedido anterior (0,15 em 03/10);
 * subiu para 0,32. Era 0,15 (03/10), 0,26 (02/10) e 0,38 antes disso.
 */
const SUAVE_CABECA = 0.32;
/**
 * Suavização da cauda (cada elo persegue o anterior). Mantém ~85% da cabeça
 * para o chicote não ficar duro nem elástico — 0,27 acompanha o 0,32 (05/10).
 */
const SUAVE_CAUDA = 0.27;
/**
 * Quantos pixels a cabeça anda para a corrente rolar UMA letra. 24 px (era
 * 36 em 03/10) para as letras correrem mais rápido, acompanhando a nova
 * velocidade pedida pelo dono (05/10/2026).
 */
const PX_POR_LETRA = 24;
/**
 * Sem mover por este tempo, a corrente começa a sumir. 1800 ms (era 1000
 * em 05/10, quando o dono achou o parado longo demais, e 1600 antes).
 * Em 10/10/2026 o dono pediu o contrário — mais tempo de leitura das
 * letras paradas — então voltou a subir, agora junto com o fade de 2,4 s
 * (era 1,6 s). Some-se ao tempo de vida ocioso da corrente: 1,8 s parado
 * + 2,4 s de fade = 4,2 s de leitura depois que o ponteiro pára.
 */
const OCIOSO_MS = 1800;

/**
 * Detecta máquina fraca ANTES de montar a corrente (10/10/2026).
 *
 * Usa o que o navegador expõe sobre o hardware, sem rede nem medição
 * própria. Dois sinais, qualquer um basta (OR): poucos núcleos lógicos ou
 * pouca memória. Fallbacks, com o porquê de cada um:
 * - `hardwareConcurrency` existe em todo navegador moderno; se faltar
 *   (0/undefined), assume 4 — o caso pior — e a trilha economiza em vez
 *   de arriscar travar;
 * - `deviceMemory` é só Chrome/Edge/Android. Quando ausente (Firefox,
 *   Safari), a memória NÃO entra na conta: senão todo desktop desses
 *   navegadores cairia no caso fraco por um dado que simplesmente não
 *   existe, e aí sim estaríamos empobrecendo para todo mundo.
 *
 * Não há medição de quadros por aqui de propósito: classificar por hardware
 * é determinístico, roda uma vez no mount e não depende de sorte de frame.
 */
function maquinaFraca(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const nucleos = nav.hardwareConcurrency || NUCLEOS_FRACOS_ATE;
  const memoria = nav.deviceMemory;
  const fracaPorNucleos = nucleos <= NUCLEOS_FRACOS_ATE;
  const fracaPorMemoria =
    memoria !== undefined && memoria > 0 && memoria <= MEMORIA_FRACA_ATE_GB;
  return fracaPorNucleos || fracaPorMemoria;
}

export default function RastroCursor() {
  const camadaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    // Classificação de hardware, uma única vez no mount. O resultado vai
    // para uma classe na camada (o CSS tira o brilho) e para a contagem
    // de elos — nada disto muda durante a vida do componente.
    const fraca = maquinaFraca();
    if (fraca) camada.classList.add("cp-rastro-fraca");

    const texto = montarTexto();
    const totalElos = fraca ? ELOS_FRACOS : ELOS;

    /** Um elo: nó do DOM + posição física + a última face escrita no DOM. */
    type Elo = {
      el: HTMLSpanElement;
      x: number;
      y: number;
      /** Última posição (inteira) escrita no DOM; NaN = "nunca escrito". */
      px: number;
      py: number;
      /** Último caractere escrito, para não reescrever o mesmo de novo. */
      ch: string;
    };

    // Estado da corrente. Os elos só existem com a trilha LIGADA —
    // desligada, não há nó nem quadro na tela (preferência do dono,
    // 10/10/2026, via cartão de acessibilidade do Seu Nonô).
    let elos: Elo[] = [];
    let ativo = lerRastroCursor();
    let alvoX = window.innerWidth / 2;
    let alvoY = window.innerHeight / 2;
    let ultimoMovimento = 0;
    let distancia = 0;
    let deslocamento = 0;
    let quadro = 0;
    let visivel = false;

    /**
     * Cria os elos no centro da tela — no mount (se ligada) e ao religar.
     * `const` arrow e não `function`: o TS só mantém o narrowing de
     * `camada` (que passou pelo `if (!camada) return`) dentro de closures
     * criadas DEPOIS da checagem — função declarada é içada (hoisted) e o
     * compilador a analisa como se pudesse rodar antes da guarda.
     */
    const montar = () => {
      for (let i = 0; i < totalElos; i += 1) {
        const el = document.createElement("span");
        el.className = "cp-rastro-elo";
        el.style.setProperty("--i", String(i));
        const ch = texto[i % texto.length];
        el.textContent = ch;
        camada.appendChild(el);
        elos.push({
          el,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          px: Number.NaN,
          py: Number.NaN,
          ch,
        });
      }
    };

    /** Remove todos os elos do DOM — ao desligar e no unmount. */
    const desmontar = () => {
      for (const elo of elos) elo.el.remove();
      elos = [];
    };

    /** Encerra o quadro corrente e esconde a camada (o fade é do CSS). */
    const parar = () => {
      if (quadro) cancelAnimationFrame(quadro);
      quadro = 0;
      visivel = false;
      camada.style.opacity = "0";
    };

    const acordar = () => {
      if (!ativo || elos.length === 0) return;
      if (!visivel) {
        camada.style.opacity = "1";
        visivel = true;
      }
      if (!quadro) quadro = requestAnimationFrame(rodar);
    };

    const aoMover = (e: PointerEvent) => {
      if (!ativo) return;
      if (e.pointerType === "touch") return;
      alvoX = e.clientX;
      alvoY = e.clientY;
      ultimoMovimento = performance.now();
      acordar();
    };

    /** Cada elo segue o anterior — a física de "cadeia" da trilha. */
    const puxarCauda = () => {
      for (let i = 1; i < elos.length; i += 1) {
        elos[i].x += (elos[i - 1].x - elos[i].x) * SUAVE_CAUDA;
        elos[i].y += (elos[i - 1].y - elos[i].y) * SUAVE_CAUDA;
      }
    };

    /**
     * Roda a frase da trilha um caractere e só toca o DOM no elo cujo
     * caractere mudou de fato: cada `textContent` novo obriga o navegador
     * a repintar aquele elo (10/10/2026).
     */
    const girarLetras = () => {
      for (let i = 0; i < elos.length; i += 1) {
        const elo = elos[i];
        const ch =
          texto[(((deslocamento + i) % texto.length) + texto.length) % texto.length];
        if (elo.ch !== ch) {
          elo.ch = ch;
          elo.el.textContent = ch;
        }
      }
    };

    /**
     * Escreve o transform só no que mudou. A posição interna segue em
     * ponto flutuante (a física continua lisa), mas o DOM recebe inteiro
     * e só quando o inteiro mudou — 1 px é o menor passo que o olho
     * percebe. Corta o `toFixed(1)` (duas formatações numéricas por elo,
     * antes por quadro) e transforma a cauda, que anda devagar, de
     * "escreve sempre" em "escreve de vez em quando" (10/10/2026).
     */
    const posicionarElos = () => {
      for (let i = 0; i < elos.length; i += 1) {
        const elo = elos[i];
        const ix = Math.round(elo.x);
        const iy = Math.round(elo.y);
        // NaN !== qualquer número: o primeiro quadro desenha todos os elos,
        // mesmo começando todos empilhados no centro da tela.
        if (ix !== elo.px || iy !== elo.py) {
          elo.px = ix;
          elo.py = iy;
          elo.el.style.transform = `translate3d(${ix}px,${iy}px,0) translate(-50%,-50%)`;
        }
      }
    };

    // Helpers extraídos de `rodar` para manter a complexidade ciclomática
    // dele no limite do CodeScene (§9: cc ≤ 10, profundidade ≤ 3).
    const rodar = () => {
      // Cinto de segurança: trilha desligada no meio do caminho mata o
      // quadro aqui (o cancelamento explícito é do `parar`).
      if (!ativo || elos.length === 0) {
        quadro = 0;
        return;
      }
      const cabecaX = elos[0].x;
      const cabecaY = elos[0].y;
      elos[0].x += (alvoX - elos[0].x) * SUAVE_CABECA;
      elos[0].y += (alvoY - elos[0].y) * SUAVE_CABECA;
      puxarCauda();

      const andou = Math.hypot(elos[0].x - cabecaX, elos[0].y - cabecaY);
      if (andou > 0.01) {
        distancia += andou;
        const novo = Math.floor(distancia / PX_POR_LETRA);
        if (novo !== deslocamento) {
          deslocamento = novo;
          girarLetras();
        }
      }

      posicionarElos();

      if (performance.now() - ultimoMovimento > OCIOSO_MS && andou < 0.15) {
        camada.style.opacity = "0";
        visivel = false;
        quadro = 0;
        return;
      }
      quadro = requestAnimationFrame(rodar);
    };

    /**
     * Responde ao botão/comando de acessibilidade: monta a corrente ao
     * ligar, derruba tudo ao desligar. O `ultimoMovimento` zerado aqui
     * evita a trilha NASCER VELHA: sem reiniciar o relógio, o tempo parado
     * acumulado dispararia o OCIOSO_MS no primeiro quadro e a trilha
     * sumiria logo depois de aparecer.
     */
    const aoMudarPreferencia = () => {
      const novo = lerRastroCursor();
      if (novo === ativo) return;
      ativo = novo;
      if (novo) {
        montar();
        ultimoMovimento = performance.now();
        acordar();
      } else {
        parar();
        desmontar();
      }
    };

    window.addEventListener(EVENTO_RASTRO_CURSOR, aoMudarPreferencia);
    window.addEventListener("pointermove", aoMover, { passive: true });
    if (ativo) montar();
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener(EVENTO_RASTRO_CURSOR, aoMudarPreferencia);
      parar();
      desmontar();
      camada.classList.remove("cp-rastro-fraca");
    };
  }, []);

  return (
    <>
      <style>{`
        .cp-rastro-camada {
          position: fixed;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          overflow: hidden;
          opacity: 0;
          /* Desaparecimento lento: 2,4 s (pedido do dono, 10/10/2026, para
             dar tempo de ler as letras depois que o ponteiro pára; era
             1,6 s desde 03/10/2026 e 0,7 s desde 02/10/2026). Junto com
             OCIOSO_MS = 1800, dá 4,2 s de leitura ociosa. */
          transition: opacity 2.4s ease;
          contain: strict;
        }
        .cp-rastro-elo {
          position: fixed;
          left: 0;
          top: 0;
          font-family: var(--font-tabular-raw, var(--font-general-sans, monospace));
          /* Cabeça maior só nos 4 primeiros elos (10/10/2026, leitura). O
             acréscimo é FIXO por elo, calculado uma única vez no CSS a
             partir de --i — nunca por quadro. --i = 0 ganha 0,14rem e a
             rampa zera no --i = 4; acima disso, o tamanho de sempre. Um
             navegador muito antigo, sem max(), derruba só esta declaração e
             o elo volta ao tamanho herdado — degradação mansa, a trilha
             continua de pé. */
          font-size: calc(0.95rem + 0.14rem * max(0, 4 - var(--i)) / 4);
          font-weight: 600;
          text-transform: uppercase;
          white-space: pre;
          color: var(--cp-primary, var(--primary, #f2701d));
          /* Queda de opacidade mais devagar: 0,010 por elo (era 0,012 até
             10/10/2026) — a cauda inteira lê melhor, mesmo pedido do dono
             de facilitar a leitura. */
          opacity: calc(1 - var(--i) * 0.010);
          text-shadow: 0 0 9px color-mix(in srgb, var(--cp-primary, var(--primary, #f2701d)) 60%, transparent);
          will-change: transform;
          user-select: none;
        }
        /* Máquina fraca (10/10/2026, ver maquinaFraca): o brilho neon é o
           item mais caro da tela — blur de 9 px rasterizado em cada elo,
           em GPU integrada. A cor de destaque fica, então a trilha segue
           legível; só o halo some. */
        .cp-rastro-camada.cp-rastro-fraca .cp-rastro-elo {
          text-shadow: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-rastro-camada { display: none; }
        }
      `}</style>
      <div ref={camadaRef} aria-hidden="true" className="cp-rastro-camada" />
    </>
  );
}
