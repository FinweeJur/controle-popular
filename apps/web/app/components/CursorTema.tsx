"use client";

import { useEffect } from "react";

/**
 * Pinta o PREENCHIMENTO dos cursores Korkhon com a cor primaria do tema.
 *
 * POR QUE EM RUNTIME, E NAO NO CSS. O cursor e um arquivo binario `.cur`
 * (contorno preto + gradiente de areia #cea67b) servido de `public/cursor/`.
 * `cursor: url(...)` nao le `var(--cp-primary)`: arquivo binario nao herda
 * custom property, e o data URI nao aceita `var()` no meio. Entao cada `.cur`
 * e desenhado num canvas, os tons de areia sao remapeados para a primaria
 * (proporcional a luminancia, para nao achatar o sombreamento) e o resultado
 * vira um data URI guardado numa variavel CSS. O `globals.css` usa a variavel
 * com o arquivo original como fallback — sem JS, o cursor continua o de antes.
 *
 * O CONTORNO PRETO NAO MUDA. Ele e o que garante contraste do ponteiro em
 * qualquer fundo (WCAG 1.4.11 — ver `scripts/recolor-contraste-cursor.py`).
 * O que segue o tema e so o miolo (a areia).
 *
 * OS `.ani` (busy/working) FICAM DE FORA: canvas nao preserva animacao, e sao
 * estados transitorios de espera — mudam de cor a cada tema nao paga o custo.
 *
 * A cor e lida a cada troca de tema (`data-theme`) ou de paleta daltonica
 * (`data-cvd`), porque as duas mexem em `--cp-primary`.
 */

/** Areia mais clara do pacote Korkhon 2.0 XS — a ancora do gradiente. */
const AREIA = { r: 206, g: 166, b: 123 } as const;
const SOMA_AREIA = AREIA.r + AREIA.g + AREIA.b;

/** arquivo `.cur` -> variavel CSS que guarda o data URI recolorido. */
const CURSOES: ReadonlyArray<readonly [string, string]> = [
  ["/cursor/pointer.cur", "--cp-cursor-pointer"],
  ["/cursor/link.cur", "--cp-cursor-link"],
  ["/cursor/beam.cur", "--cp-cursor-beam"],
  ["/cursor/location.cur", "--cp-cursor-location"],
  ["/cursor/unavailable.cur", "--cp-cursor-unavailable"],
  ["/cursor/precision.cur", "--cp-cursor-precision"],
  ["/cursor/openhand.cur", "--cp-cursor-openhand"],
  ["/cursor/question.cur", "--cp-cursor-question"],
];

/** Data URIs ja gerados, por "primaria|arquivo" — trocar de tema e voltar e instantaneo. */
const cache = new Map<string, string>();

/** Le `--cp-primary` e normaliza para RGB usando o proprio canvas (aceita hex, rgb, oklch). */
function corPrimaria(): { r: number; g: number; b: number } | null {
  const bruto = getComputedStyle(document.documentElement)
    .getPropertyValue("--cp-primary")
    .trim();
  if (!bruto) return null;
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = bruto;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

/** Recolore um `.cur`: preto continua preto; areia vira a primaria com o sombreamento. */
function pintarCur(
  src: string,
  prim: { r: number; g: number; b: number }
): Promise<string | null> {
  const chave = `${prim.r},${prim.g},${prim.b}|${src}`;
  const salvo = cache.get(chave);
  if (salvo) return Promise.resolve(salvo);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const dados = ctx.getImageData(0, 0, c.width, c.height);
      const px = dados.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] === 0) continue;
        // A soma dos canais separa contorno (0 → preto) de areia (495 → primaria)
        // e escala os tons do meio na mesma proporcao.
        const f = (px[i] + px[i + 1] + px[i + 2]) / SOMA_AREIA;
        px[i] = Math.min(255, Math.round(prim.r * f));
        px[i + 1] = Math.min(255, Math.round(prim.g * f));
        px[i + 2] = Math.min(255, Math.round(prim.b * f));
      }
      ctx.putImageData(dados, 0, 0);
      const url = `url("${c.toDataURL("image/png")}")`;
      cache.set(chave, url);
      resolve(url);
    };
    // .cur nao carrega (navegador sem suporte): mantem o arquivo original.
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function aplicar(): Promise<void> {
  const prim = corPrimaria();
  if (!prim) return;
  await Promise.all(
    CURSOES.map(async ([src, varCss]) => {
      const url = await pintarCur(src, prim);
      if (url) document.documentElement.style.setProperty(varCss, url);
    })
  );
}

export default function CursorTema() {
  useEffect(() => {
    void aplicar();
    // data-theme (next-themes) e data-cvd (CvdToggle) mudam `--cp-primary`.
    const obs = new MutationObserver(() => void aplicar());
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-cvd"],
    });
    return () => obs.disconnect();
  }, []);

  return null;
}
