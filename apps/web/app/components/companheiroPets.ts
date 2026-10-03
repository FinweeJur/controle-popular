/**
 * companheiroPets.ts — registro dos bichinhos do companheiro flutuante.
 *
 * GERADO por `scripts/processar-pets-petdex.mts` em 02/10/2026 — NÃO
 * edite à mão: rode o script de novo. Cada entrada traz o bbox medido no
 * pixel (a janela de desenho dentro da célula de 192×208) e os quadros
 * medidos por linha do atlas (linha 0 = idle … linha 8 = review — mesma
 * grade para todos os pets, docs do Petdex).
 *
 * A galinha (`dingdong-chicken`) já vivia no portal; o padrão da tela
 * passou a ser o `qiaowei` (shamador — "Oriental Magpie-Robin"), decisão
 * do dono em 02/10/2026.
 *
 * Procedência, autor e licença de todos: `public/companheiro/petdex/PROVENIENCIA.md`.
 */

/** Um bichinho selecionável: arte, medidas e crédito do autor. */
export interface PetCompanheiro {
  /** Slug do Petdex — também é a chave salva no localStorage. */
  slug: string;
  /** Nome de exibição no menu (vem do pet.json do Petdex). */
  nome: string;
  /** Autor da arte, creditado na procedência. */
  autor: string;
  /** URL da folha de estados reduzida (9 linhas × 0,4). */
  caminho: string;
  /** Janela de desenho dentro da célula 192×208, medida no pixel. */
  bbox: { x: number; y: number; w: number; h: number };
  /** Quadros de cada uma das 9 linhas: [idle, running-right, running-left, waving, jumping, failed, waiting, running, review]. */
  quadros: number[];
}

/** Ordem das linhas do atlas — é o que liga `quadros[i]` ao estado. */
export const LINHAS_ATLAS = [
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review",
] as const;

export const PETS_COMPANHEIRO: PetCompanheiro[] = [
  {
    slug: "dingdong-chicken",
    nome: "Galinha",
    autor: "hydrogen2o",
    caminho: "/companheiro/dingdong-chicken/estados.webp",
    bbox: { x: 44, y: 5, w: 103, h: 198 },
    quadros: [7, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "capvolt",
    nome: "Pikachu‌",
    autor: "zlss g.",
    caminho: "/companheiro/petdex/capvolt/estados.webp",
    bbox: { x: 5, y: 9, w: 182, h: 189 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "daodun",
    nome: "DaoDun",
    autor: "vinjn",
    caminho: "/companheiro/petdex/daodun/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "nightleaf",
    nome: "Xiao Hei",
    autor: "国东 闵.",
    caminho: "/companheiro/petdex/nightleaf/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "bubu-3",
    nome: "Bubu",
    autor: "je1zzz",
    caminho: "/companheiro/petdex/bubu-3/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "theveller",
    nome: "TheVeller",
    autor: "theveller",
    caminho: "/companheiro/petdex/theveller/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "clippy",
    nome: "Clippy",
    autor: "victorpfreitas",
    caminho: "/companheiro/petdex/clippy/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "capy",
    nome: "Capy",
    autor: "yjcys",
    caminho: "/companheiro/petdex/capy/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "totoro",
    nome: "Totoro",
    autor: "vincentngo",
    caminho: "/companheiro/petdex/totoro/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "gabumon",
    nome: "Gabumon",
    autor: "Weizhong J.",
    caminho: "/companheiro/petdex/gabumon/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "maodie-2",
    nome: "耄耋",
    autor: "zonglin-he",
    caminho: "/companheiro/petdex/maodie-2/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "chedarini",
    nome: "Chedarini",
    autor: "railly",
    caminho: "/companheiro/petdex/chedarini/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "round-maodie-c63864e8",
    nome: "圆头耄耋",
    autor: "Ne1ther",
    caminho: "/companheiro/petdex/round-maodie-c63864e8/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "wangcai",
    nome: "Wangcai",
    autor: "boxu-openai",
    caminho: "/companheiro/petdex/wangcai/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "meiqiu",
    nome: "煤球",
    autor: "diao j.",
    caminho: "/companheiro/petdex/meiqiu/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "sprig",
    nome: "Sprig",
    autor: "magitekapps",
    caminho: "/companheiro/petdex/sprig/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "saga",
    nome: "Saga",
    autor: "katymyk",
    caminho: "/companheiro/petdex/saga/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [7, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "bolt",
    nome: "Bolt",
    autor: "flmalte",
    caminho: "/companheiro/petdex/bolt/estados.webp",
    bbox: { x: 8, y: 5, w: 176, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "casey-cassette",
    nome: "Casey Cassette",
    autor: "Apipa169",
    caminho: "/companheiro/petdex/casey-cassette/estados.webp",
    bbox: { x: 5, y: 14, w: 182, h: 179 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "chompers",
    nome: "Chompers",
    autor: "James D.",
    caminho: "/companheiro/petdex/chompers/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "kyle-kun",
    nome: "カイルくん",
    autor: "成美 如.",
    caminho: "/companheiro/petdex/kyle-kun/estados.webp",
    bbox: { x: 5, y: 14, w: 182, h: 180 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "whaledou",
    nome: "whaledou",
    autor: "isdou",
    caminho: "/companheiro/petdex/whaledou/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
  {
    slug: "qiaowei",
    nome: "Qiaowei",
    autor: "摸 鱼.",
    caminho: "/companheiro/petdex/qiaowei/estados.webp",
    bbox: { x: 5, y: 5, w: 182, h: 198 },
    quadros: [6, 8, 8, 4, 5, 8, 6, 6, 6],
  },
];

/** Chave no localStorage — quem nunca escolheu fica com o qiaowei. */
export const PET_PADRAO = "qiaowei";

/** Chave no localStorage onde a escolha do leitor é lembrada. */
export const CHAVE_PET = "cp_pet";
