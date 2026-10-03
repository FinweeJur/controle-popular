/**
 * processar-pets-petdex.mts — prepara os pets do Petdex para o companheiro
 * flutuante do portal Controle Popular.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O companheiro web (`app/components/CompanheiroFlutuante.tsx`) mostra os
 * bichinhos de 42 px de altura escolhidos pelo leitor — podem ser VÁRIOS na
 * tela ao mesmo tempo (pedido do dono, 02/10/2026). A galinha
 * (`dingdong-chicken`) já era usada; este script processa os 22 pets
 * baixados com `npx petdex install <slug>` (estoque em
 * `~/.codex/pets/<slug>/spritesheet.webp`) e gera, por pet:
 *
 *   1. `apps/web/public/companheiro/petdex/<slug>/estados.webp`
 *      — só as 9 linhas de estado, reduzida a 0,4 (mesma receita da
 *      galinha: 1,8 MB viram dezenas de KB);
 *   2. `apps/web/public/companheiro/petdex/<slug>/meta.json`
 *      — procedência e medidas, para auditoria sem abrir o script;
 *   3. `apps/web/app/components/companheiroPets.ts`
 *      — registro (nome, autor, bbox, quadros por linha) que o site lê.
 *
 * FONTE E PADRÃO DA ARTE
 * ----------------------
 * Petdex (https://petdex.dev) — folha padrão ChatGPT/Petdex de 8 colunas
 * × 9 linhas de 192×208 px, mesma grade para todos os pets
 * ("same nine state rows, same frame counts" — docs do Petdex).
 * Medido em 02/10/2026 nos 14 arquivos: todos 1536×1872.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - bbox e quadros são MEDIDOS no pixel (alfa > 0), nunca digitados à
 *   mão: arte de terceiros varia, e número errado corta o bicho;
 * - o bbox é global (todas as 9 linhas): se um quadro de "pulo" é mais
 *   alto, a janela de desenho comporta sem cortar;
 * - quadros por linha = última coluna com conteúdo + 1 — o atlas é
 *   preenchido da esquerda pra direita, com colunas vazias no fim;
 * - a folha original NÃO é versionada (fica em ~/.codex); só a versão
 *   reduzida entra no repositório.
 *
 * USO (da raiz do monorepo):
 *   npx tsx apps/web/scripts/processar-pets-petdex.mts
 *
 * LICENÇA: ver `public/companheiro/petdex/PROVENIENCIA.md` — arte de
 * terceiros, sem licença por asset; mesma pendência da galinha.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const CEL_W = 192;
const CEL_H = 208;
const COLS = 8;
const LINHAS_USO = 9;
const ESCALA_CORTE = 0.4;
const ALFA_MINIMO = 16; // ignora ruído de compressão quase invisível

const DIR_SAIDA = path.join(
  process.cwd(),
  "apps",
  "web",
  "public",
  "companheiro",
  "petdex",
);
const REGISTRO = path.join(
  process.cwd(),
  "apps",
  "web",
  "app",
  "components",
  "companheiroPets.ts",
);
const DIR_PETS = path.join(os.homedir(), ".codex", "pets");

/** Os 23 pets: a galinha primeiro, os 22 do Petdex na sequência. */
const PETS = [
  // A galinha não é processada aqui: a arte dela já está reduzida e
  // documentada em `dingdong-chicken/PROVENIENCIA.md`. As medidas abaixo
  // foram feitas na sessão de 02/10/2026 que instalou o bicho.
  { slug: "dingdong-chicken", autor: "hydrogen2o" },
  { slug: "capvolt", autor: "zlss g." },
  { slug: "daodun", autor: "vinjn" },
  { slug: "nightleaf", autor: "国东 闵." },
  { slug: "bubu-3", autor: "je1zzz" },
  { slug: "theveller", autor: "theveller" },
  { slug: "clippy", autor: "victorpfreitas" },
  { slug: "capy", autor: "yjcys" },
  { slug: "totoro", autor: "vincentngo" },
  { slug: "gabumon", autor: "Weizhong J." },
  { slug: "maodie-2", autor: "zonglin-he" },
  { slug: "chedarini", autor: "railly" },
  { slug: "round-maodie-c63864e8", autor: "Ne1ther" },
  { slug: "wangcai", autor: "boxu-openai" },
  // Leva de 02/10/2026 (pedido do dono): 9 novos, com o qiaowei
  // (shamador, "Oriental Magpie-Robin") virando o padrão da tela.
  { slug: "meiqiu", autor: "diao j." },
  { slug: "sprig", autor: "magitekapps" },
  { slug: "saga", autor: "katymyk" },
  { slug: "bolt", autor: "flmalte" },
  { slug: "casey-cassette", autor: "Apipa169" },
  { slug: "chompers", autor: "James D." },
  { slug: "kyle-kun", autor: "成美 如." },
  { slug: "whaledou", autor: "isdou" },
  { slug: "qiaowei", autor: "摸 鱼." },
] as const;

interface Medida {
  slug: string;
  nome: string;
  autor: string;
  bbox: { x: number; y: number; w: number; h: number };
  quadros: number[];
}

/** Nome de exibição do pet.json (UTF-8), com reserva para a galinha. */
function lerNome(slug: string): string {
  if (slug === "dingdong-chicken") return "Galinha";
  try {
    const bruto = fs.readFileSync(path.join(DIR_PETS, slug, "pet.json"), "utf8");
    const j = JSON.parse(bruto) as { displayName?: string };
    return (j.displayName || slug).replace(/\s+/g, " ").trim();
  } catch {
    return slug;
  }
}

/** Mede bbox global e quadros por linha direto nos pixels da folha. */
async function medir(slug: string): Promise<Medida> {
  const arquivo = path.join(DIR_PETS, slug, "spritesheet.webp");
  const { data, info } = await sharp(arquivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width % CEL_W !== 0 || info.height % CEL_H !== 0) {
    throw new Error(`${slug}: folha ${info.width}x${info.height} fora da grade`);
  }
  const linhas = info.height / CEL_H;
  if (linhas < LINHAS_USO) {
    throw new Error(`${slug}: só ${linhas} linhas, preciso de ${LINHAS_USO}`);
  }

  const px = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];

  // Passe 1 — bbox exato DENTRO da célula: união, em coordenadas locais
  // (x % 192, y % 208), de todo pixel visível das 9 linhas. É a janela
  // que o site abre sobre CADA quadro — um "pulo" mais alto alarga o
  // topo, um braço estendido alarga os lados, e nenhum quadro corta.
  let minX = CEL_W;
  let minY = CEL_H;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < LINHAS_USO * CEL_H; y += 1) {
    const baseY = Math.floor(y / CEL_H) * CEL_H;
    for (let x = 0; x < info.width; x += 1) {
      if (px(x, y) >= ALFA_MINIMO) {
        const lx = x % CEL_W;
        const ly = y - baseY;
        if (lx < minX) minX = lx;
        if (lx > maxX) maxX = lx;
        if (ly < minY) minY = ly;
        if (ly > maxY) maxY = ly;
      }
    }
  }
  if (maxX < 0) throw new Error(`${slug}: folha sem nenhum pixel visível`);

  // Passe 2 — quadros por linha: última coluna com conteúdo + 1 (o atlas
  // é preenchido da esquerda pra direita, com colunas vazias no fim).
  const quadros: number[] = [];
  for (let r = 0; r < LINHAS_USO; r += 1) {
    let ultimo = -1;
    for (let c = 0; c < COLS; c += 1) {
      let temAlgo = false;
      for (let y = r * CEL_H; y < (r + 1) * CEL_H && !temAlgo; y += 1) {
        for (let x = c * CEL_W; x < (c + 1) * CEL_W; x += 1) {
          if (px(x, y) >= ALFA_MINIMO) {
            temAlgo = true;
            break;
          }
        }
      }
      if (temAlgo) ultimo = c;
    }
    if (ultimo < 0) throw new Error(`${slug}: linha ${r} toda vazia`);
    quadros.push(ultimo + 1);
  }

  return {
    slug,
    nome: lerNome(slug),
    autor: PETS.find((p) => p.slug === slug)?.autor ?? "desconhecido",
    bbox: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
    quadros,
  };
}

/** Escreve a versão reduzida (9 linhas × 0,4) e o meta.json do pet. */
async function reduzir(slug: string, medida: Medida): Promise<number> {
  const dir = path.join(DIR_SAIDA, slug);
  fs.mkdirSync(dir, { recursive: true });
  const saida = path.join(dir, "estados.webp");
  await sharp(path.join(DIR_PETS, slug, "spritesheet.webp"))
    .extract({ left: 0, top: 0, width: COLS * CEL_W, height: LINHAS_USO * CEL_H })
    .resize({ width: Math.round(COLS * CEL_W * ESCALA_CORTE) })
    .webp({ quality: 80 })
    .toFile(saida);

  const meta = {
    slug,
    nome: medida.nome,
    autor: medida.autor,
    fonte: `https://petdex.dev/pets/${slug}`,
    licenca: "sem licenca por asset (arte de usuario Petdex) — ver PROVENIENCIA.md",
    medidoEm: "2026-10-02",
    celula: { w: CEL_W, h: CEL_H, cols: COLS, linhas: LINHAS_USO },
    bbox: medida.bbox,
    quadros: medida.quadros,
    reducao: ESCALA_CORTE,
  };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  return fs.statSync(saida).size;
}

/** Registro que o site importa (gerado — não editar à mão). */
function gravarRegistro(medidas: Medida[]): void {
  const linhas = medidas
    .map(
      (m) => `  {
    slug: ${JSON.stringify(m.slug)},
    nome: ${JSON.stringify(m.nome)},
    autor: ${JSON.stringify(m.autor)},
    caminho: ${JSON.stringify(
        m.slug === "dingdong-chicken"
          ? "/companheiro/dingdong-chicken/estados.webp"
          : `/companheiro/petdex/${m.slug}/estados.webp`,
      )},
    bbox: { x: ${m.bbox.x}, y: ${m.bbox.y}, w: ${m.bbox.w}, h: ${m.bbox.h} },
    quadros: [${m.quadros.join(", ")}],
  },`,
    )
    .join("\n");

  const conteudo = `/**
 * companheiroPets.ts — registro dos bichinhos do companheiro flutuante.
 *
 * GERADO por \`scripts/processar-pets-petdex.mts\` em 02/10/2026 — NÃO
 * edite à mão: rode o script de novo. Cada entrada traz o bbox medido no
 * pixel (a janela de desenho dentro da célula de 192×208) e os quadros
 * medidos por linha do atlas (linha 0 = idle … linha 8 = review — mesma
 * grade para todos os pets, docs do Petdex).
 *
 * A galinha (\`dingdong-chicken\`) já vivia no portal; o padrão da tela
 * passou a ser o \`qiaowei\` (shamador — "Oriental Magpie-Robin"), decisão
 * do dono em 02/10/2026.
 *
 * Procedência, autor e licença de todos: \`public/companheiro/petdex/PROVENIENCIA.md\`.
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

/** Ordem das linhas do atlas — é o que liga \`quadros[i]\` ao estado. */
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
${linhas}
];

/** Chave no localStorage — quem nunca escolheu fica com o qiaowei. */
export const PET_PADRAO = "qiaowei";

/** Chave no localStorage onde a escolha do leitor é lembrada. */
export const CHAVE_PET = "cp_pet";
`;
  fs.writeFileSync(REGISTRO, conteudo, "utf8");
}

async function main(): Promise<void> {
  let total = 0;
  const medidas: Medida[] = [];
  for (const { slug } of PETS) {
    if (slug === "dingdong-chicken") {
      // Arte própria já reduzida; só entra no registro.
      medidas.push({
        slug,
        nome: "Galinha",
        autor: "hydrogen2o",
        bbox: { x: 44, y: 5, w: 103, h: 198 },
        quadros: [7, 8, 8, 4, 5, 8, 6, 6, 6],
      });
      continue;
    }
    const medida = await medir(slug);
    const bytes = await reduzir(slug, medida);
    total += bytes;
    medidas.push(medida);
    process.stdout.write(
      `ok ${slug} bbox=${medida.bbox.x},${medida.bbox.y},${medida.bbox.w},${medida.bbox.h} quadros=[${medida.quadros}] ${(bytes / 1024).toFixed(0)}KB\n`,
    );
  }
  gravarRegistro(medidas);
  process.stdout.write(`total ${(total / 1024 / 1024).toFixed(2)} MB em ${DIR_SAIDA}\n`);
  process.stdout.write(`registro ${REGISTRO}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
