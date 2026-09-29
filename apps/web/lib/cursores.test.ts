/**
 * ═══ CURSORES DO SITE — KORKHON 2.0 XS ═══
 *
 * O ponteiro do mouse do portal é o pacote de domínio público de EfeMaden
 * (https://www.rw-designer.com/cursor-set/korkhon-2-0-sx), copiado para
 * `public/cursor/` e referenciado em dois lugares que mudam juntos:
 *
 *  - `apps/web/app/globals.css`  — todo o portal (Next);
 *  - `apps/web/public/terras/globo/css/hud.css` — o globo 3D, que não
 *    passa pelo CSS do Next e por isso espelha o bloco.
 *
 * Dez arquivos: oito `.cur` (seta, feixe, mão, cruzeta, indisponível,
 * ajuda, localização) e dois `.ani` animados (busy e working).
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Cursores falham em silêncio: se a URL estiver errada, o navegador cai no
 * fallback (`auto`, `pointer`, `text`) e a página continua "funcionando"
 * com o ponteiro nativo do sistema. Ninguém abre o DevTools para descobrir
 * isso. Aqui o arquivo é conferido dos dois lados, como manda o AGENTS:
 *
 *  1. CSS → disco: todo `url("/cursor/...")` aponta para arquivo existente;
 *  2. disco → CSS: nenhum `.cur` nem `.ani` órfão em `public/cursor/`;
 *  3. hotspot: o par `x y` escrito no CSS tem que ser o mesmo que está
 *     gravado no cabeçalho — offset 10/12 do ICONDIRENTRY (os campos
 *     `wPlanes`/`wBitCount` de um cursor, que num `.cur` são o hotspot).
 *     Divergiu, o clique cai fora do desenho. No `.ani` o mesmo campo
 *     mora dentro de cada chunk `icon` do RIFF.
 *  4. CONTRASTE (regra do dono, 29/09/2026, WCAG 1.4.11 — elemento
 *     gráfico precisa de ≥3:1 contra o fundo): mede de verdade os pixels
 *     de cada `.cur` e exige ≥3:1 contra os oito temas do portal E contra
 *     imagem de satélite (floresta e asfalto). Foi este teste que pegaria
 *     de volta o contorno marrom #5c4542, que só llegava a 2,26 em
 *     floresta — o cursor sumia no chão do globo. A troca por preto puro
 *     é feita por `scripts/recolor-contraste-cursor.py`.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do app Next (`apps/web`), derivada deste arquivo, não do cwd. */
const RAIZ = fileURLToPath(new URL("../", import.meta.url));

const CSS = [
  "app/globals.css",
  "public/terras/globo/css/hud.css",
].map((rel) => ({
  rel,
  texto: fs.readFileSync(path.join(RAIZ, rel), "utf-8"),
}));

const DIR_CURSOR = path.join(RAIZ, "public", "cursor");

/** Regex única: captura `nome.ext` e o par de hotspot escrito no CSS. */
const RE_URL = /url\("\/cursor\/([\w-]+\.(?:cur|ani))"\)\s+(\d+)\s+(\d+)/g;

/**
 * Lê o hotspot do primeiro frame (32 px, o que o navegador usa em tela
 * comum) de um arquivo `.cur`, a partir de um buffer que já é um CUR.
 */
function hotspotDoCur(b: Buffer): { x: number; y: number } {
  expect(b.readUInt16LE(2), "não é um arquivo de cursor").toBe(2);
  return { x: b.readInt16LE(10), y: b.readInt16LE(12) };
}

/** Lê o hotspot do `.cur` no disco. */
function hotspotDoArquivo(caminho: string): { x: number; y: number } {
  return hotspotDoCur(fs.readFileSync(caminho));
}

/**
 * Lê o hotspot de um `.ani`: contêiner RIFF('ACON') com uma LIST 'fram'
 * que guarda N chunks `icon`; cada chunk é um `.cur` inteiro. Usa o
 * primeiro chunk — todos têm o mesmo hotspot (conferido por este teste).
 */
function hotspotDoAni(caminho: string): { x: number; y: number } {
  const b = fs.readFileSync(caminho);
  expect(b.toString("latin1", 0, 4), `${caminho} sem cabeçalho RIFF`).toBe("RIFF");
  expect(b.toString("latin1", 8, 12), `${caminho} não é ACON`).toBe("ACON");

  let pos = 12;
  while (pos + 8 <= b.length) {
    const tipo = b.toString("latin1", pos, pos + 4);
    const tamanho = b.readUInt32LE(pos + 4);
    const corpo = b.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === "LIST" && corpo.toString("latin1", 0, 4) === "fram") {
      let p = 4;
      while (p + 8 <= corpo.length) {
        const sub = corpo.toString("latin1", p, p + 4);
        const subTam = corpo.readUInt32LE(p + 4);
        if (sub === "icon") return hotspotDoCur(corpo.subarray(p + 8, p + 8 + subTam));
        p += 8 + subTam + (subTam & 1);
      }
    }
    pos += 8 + tamanho + (tamanho & 1);
  }
  throw new Error(`${caminho}: nenhum chunk icon dentro do ANI`);
}

/**
 * Cores opacas (alpha 255) dos frames BMP de um `.cur`.
 *
 * Os frames PNG (64/128 px) não são decodificados aqui de propósito:
 * são o mesmo desenho em outra escala e a paleta é idêntica — e parser
 * de PNG significaria puxar dependência só para isto.
 */
function coresOpacasDoCur(caminho: string): string[] {
  const b = fs.readFileSync(caminho);
  const frames = b.readUInt16LE(4);
  const cores = new Set<string>();
  for (let k = 0; k < frames; k++) {
    const e = 6 + 16 * k;
    const tam = b.readUInt32LE(e + 8);
    const off = b.readUInt32LE(e + 12);
    const p = b.subarray(off, off + tam);
    if (p.length < 40 || p.readUInt32LE(0) !== 40 || p.readUInt16LE(14) !== 32) continue;
    const largura = p.readInt32LE(4);
    const altura = p.readInt32LE(8);
    // Ícone quadrado com altura dobrada traz a máscara AND junto: só o
    // plano XOR tem cor, e ele ocupa a primeira metade das linhas.
    const xor = Math.abs(altura) === 2 * largura ? Math.abs(altura) / 2 : Math.abs(altura);
    const passo = Math.floor((largura * 32 + 31) / 32) * 4;
    for (let linha = 0; linha < xor; linha++) {
      const base = 40 + linha * passo;
      for (let col = 0; col < largura; col++) {
        const i = base + col * 4;
        if (i + 3 >= p.length) break;
        if (p[i + 3] !== 255) continue; // transparente não precisa de contraste
        const r = p[i + 2],
          g = p[i + 1],
          bl = p[i];
        cores.add(`#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`);
      }
    }
  }
  return [...cores];
}

/** Luminância relativa WCAG 2.x de uma cor `#rrggbb`. */
function luminancia(hex: string): number {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = v.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Contraste de duas luminâncias (WCAG). */
function contraste(a: number, b: number): number {
  const [hi, lo] = [Math.max(a, b), Math.min(a, b)];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Fundos de tema lidos do próprio `globals.css` — número vem do token,
 * não é digitado à mão. Pega `--cp-bg` e `--cp-surface` do `:root`
 * (tema claro) e de cada bloco `[data-theme="..."]`.
 */
function fundosDeTema(): { nome: string; cor: string }[] {
  const texto = CSS[0].texto;
  // `m` + ancora de linha: sem ele `^:root` só casa no primeiro byte do
  // arquivo, que é um `@import`, e o tema claro some da medição.
  const blocos = [
    ...texto.matchAll(/(?:^|\n)[ \t]*(:root|\[data-theme="([\w-]+)"\])[ \t]*\{([^}]*)\}/gm),
  ];
  const fundos: { nome: string; cor: string }[] = [];
  for (const [, _seletor, tema, corpo] of blocos) {
    const nomeTema = tema ?? "claro";
    for (const propriedade of ["--cp-bg", "--cp-surface"]) {
      const m = corpo.match(new RegExp(`${propriedade}\\s*:\\s*(#[0-9a-fA-F]{6})`));
      if (m) fundos.push({ nome: `${nomeTema} (${propriedade})`, cor: m[1].toLowerCase() });
    }
  }
  return fundos;
}

describe("cursores do site -- CSS e disco batem", () => {
  it("todo url('/cursor/...') do CSS existe em public/cursor e o hotspot bate", () => {
    for (const { rel, texto } of CSS) {
      const achados = [...texto.matchAll(RE_URL)];
      expect(achados.length, `${rel} sem url de cursor`).toBeGreaterThan(0);
      for (const [, nome, x, y] of achados) {
        const arquivo = path.join(DIR_CURSOR, nome);
        expect(
          fs.existsSync(arquivo),
          `${rel} aponta /cursor/${nome}, que não existe`
        ).toBe(true);
        expect(fs.statSync(arquivo).size, `${nome} vazio`).toBeGreaterThan(0);
        const hotspot = nome.endsWith(".ani") ? hotspotDoAni(arquivo) : hotspotDoArquivo(arquivo);
        expect(
          { x: Number(x), y: Number(y) },
          `hotspot do CSS difere de ${nome} (${rel})`
        ).toEqual(hotspot);
      }
    }
  });

  it("nenhum cursor órfão: tudo que está em public/cursor é referenciado", () => {
    const referenciados = new Set(
      CSS.flatMap(({ texto }) => [...texto.matchAll(RE_URL)].map((m) => m[1]))
    );
    for (const arquivo of fs.readdirSync(DIR_CURSOR)) {
      expect(
        referenciados.has(arquivo),
        `${arquivo} está em public/cursor e ninguém o usa`
      ).toBe(true);
    }
  });

  it("os quatro estados essenciais estão ligados no portal", () => {
    const { texto } = CSS[0];
    expect(texto, "seta padrão sem arquivo").toMatch(
      /\*\s*\{\s*cursor: url\("\/cursor\/pointer\.cur"\)/
    );
    expect(texto).toMatch(/url\("\/cursor\/link\.cur"\)/);
    expect(texto).toMatch(/url\("\/cursor\/beam\.cur"\)/);
    expect(texto).toMatch(/url\("\/cursor\/unavailable\.cur"\)/);
    expect(texto, "sem !important o Tailwind vence").toMatch(/!important/);
  });

  it("localização e os dois .ani de carregamento estão ligados nos dois CSS", () => {
    for (const { rel, texto } of CSS) {
      expect(texto, `${rel} sem cursor de localização`).toMatch(
        /url\("\/cursor\/location\.cur"\)\s+6\s+22/
      );
      expect(texto, `${rel} sem busy.ani`).toMatch(
        /url\("\/cursor\/busy\.ani"\)\s+11\s+11/
      );
      expect(texto, `${rel} sem working.ani`).toMatch(
        /url\("\/cursor\/working\.ani"\)\s+0\s+1/
      );
    }
    // Quem liga o atributo que dispara o busy na tela inteira.
    expect(
      fs.readFileSync(path.join(RAIZ, "app/components/LoadingOverlay.tsx"), "utf-8"),
      "LoadingOverlay não liga data-carregando no body"
    ).toMatch(/setAttribute\("data-carregando"/);
  });
});

describe("cursores do site -- contraste (WCAG 1.4.11, ≥3:1)", () => {
  const arcur = fs
    .readdirSync(DIR_CURSOR)
    .filter((a) => a.endsWith(".cur"))
    .sort();
  const fundos = [
    ...fundosDeTema(),
    // Imagem de satélite do globo: os dois fundos que motivaram a troca
    // do contorno marrom por preto (medidos: 2,26 e 2,38 com o marrom).
    { nome: "satelite: floresta", cor: "#4a7a3a" },
    { nome: "satelite: asfalto", cor: "#6b6b6b" },
    { nome: "satelite: areia", cor: "#cbb187" },
    { nome: "globo void", cor: "#060910" },
  ];

  it("o CSS tem fundos de tema para medir (senão a medição é vazia)", () => {
    expect(fundosDeTema().length, "nenhum --cp-bg/--cp-surface encontrado").toBeGreaterThanOrEqual(16);
  });

  it.each(arcur)("%s passa em ≥3:1 contra todos os fundos", (nome) => {
    const cores = coresOpacasDoCur(path.join(DIR_CURSOR, nome));
    expect(cores.length, `${nome} sem pixels opacos para medir`).toBeGreaterThan(10);
    const lumCores = cores.map(luminancia);
    for (const fundo of fundos) {
      const melhor = Math.max(...lumCores.map((lc) => contraste(lc, luminancia(fundo.cor))));
      expect(
        melhor,
        `${nome} sobre ${fundo.nome} (${fundo.cor}) só chega a ${melhor.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("o contorno preto está lá: sem ele a falha de satélite volta", () => {
    for (const nome of arcur) {
      expect(
        coresOpacasDoCur(path.join(DIR_CURSOR, nome)),
        `${nome} perdeu o contorno preto (recolor refeito? scripts/recolor-contraste-cursor.py)`
      ).toContain("#000000");
    }
  });
});
