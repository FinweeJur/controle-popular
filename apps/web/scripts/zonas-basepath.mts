/**
 * Confere que o `BASE_PATH` de cada zona casa com a PASTA da zona.
 *
 * npx tsx scripts/zonas-basepath.mts
 *
 * POR QUE ISTO EXISTE: `lib/judiciario/basePath.ts` nasceu copiado do
 * /congresso e ficou com `"/congresso"` dentro. Não disparou nada por
 * meses — `withBasePath()` não era chamado em lugar nenhum até a Auth
 * precisar montar um `emailRedirectTo`. O comentário no próprio arquivo
 * registra o caso. É o trap nº 1 de scaffold de zona nova, e a leitura
 * humana não pega: as duas strings são plausíveis no mesmo arquivo.
 *
 * O plano previa um `paridade-ambiental.mts` só da zona nova. Ficou
 * GENÉRICO de propósito: uma trava que só olha a zona que acabou de nascer
 * não teria pego o bug que ela existe para prevenir, porque aquele bug
 * nasceu numa zona que também era nova na época. Zona nova entra aqui
 * sozinha, sem ninguém lembrar de editar este arquivo.
 *
 * Confere três coisas por zona:
 *   1. `lib/<zona>/basePath.ts` exporta `BASE_PATH === "/<zona>"`;
 *   2. `withBasePath()` devolve caminho começando por esse prefixo;
 *   3. o `href` da zona em `lib/zonas.ts` é coerente com ele.
 */
import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ZONAS } from "../lib/zonas.js";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Exceção DECLARADA, por pasta de `lib/`: a zona de cidades tem prefixo
 * VARIÁVEL (`/betim`, `/belo-horizonte`, ...), então `lib/betim/basePath.ts`
 * exporta o hook `useCaminhoDaCidade()` e não uma constante.
 *
 * A exceção é uma allowlist explícita, e não "se não exportar BASE_PATH,
 * pula": senão o dia em que alguém apagasse o export de uma zona de prefixo
 * fixo, esta trava passaria a ignorá-la em silêncio — que é exatamente o
 * modo de falha que ela existe para impedir.
 */
const PREFIXO_VARIAVEL = new Set(["betim"]);
const ZONAS_SEM_BASE_PATH_FIXO = new Set(["cidades"]);

let conferidas = 0;
let falhas = 0;

function falhar(msg: string) {
  console.error(`  FALHA  ${msg}`);
  falhas++;
}

const pastasDeZona = readdirSync(join(raiz, "lib"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(raiz, "lib", d.name, "basePath.ts")))
  .map((d) => d.name);

console.log(`Zonas com basePath.ts: ${pastasDeZona.join(", ")}\n`);

for (const pasta of pastasDeZona) {
  const esperado = `/${pasta}`;
  const mod = await import(`../lib/${pasta}/basePath.js`);
  conferidas++;

  if (PREFIXO_VARIAVEL.has(pasta)) {
    // A exceção tem de continuar sendo exceção: se um dia ganhar um
    // BASE_PATH fixo, alguém mudou o desenho e a allowlist mente.
    if (mod.BASE_PATH !== undefined) {
      falhar(
        `lib/${pasta}/ está na allowlist de prefixo variável, mas passou a ` +
          `exportar BASE_PATH="${mod.BASE_PATH}" — tirar da allowlist ou desfazer.`
      );
    } else {
      console.log(`  N/A    ${pasta} (prefixo variável por cidade, exceção declarada)`);
    }
    continue;
  }

  if (mod.BASE_PATH !== esperado) {
    falhar(
      `lib/${pasta}/basePath.ts exporta BASE_PATH="${mod.BASE_PATH}", ` +
        `mas a pasta é "${pasta}" (esperado "${esperado}") — ` +
        `cheiro de arquivo copiado de outra zona.`
    );
    continue;
  }

  const saida = mod.withBasePath("/uma/rota");
  if (saida !== `${esperado}/uma/rota`) {
    falhar(`lib/${pasta}: withBasePath("/uma/rota") devolveu "${saida}"`);
    continue;
  }

  // A rota tem de existir como pasta estática em `app/`, senão o prefixo
  // aponta para lugar nenhum.
  if (!existsSync(join(raiz, "app", pasta))) {
    falhar(`lib/${pasta}/basePath.ts aponta para "${esperado}", mas app/${pasta}/ não existe`);
    continue;
  }

  console.log(`  OK     ${pasta} -> ${mod.BASE_PATH}`);
}

// O `href` em lib/zonas.ts é o que a home e a remissão cruzada usam com <a>
// cru. Divergir dele é 404 na navegação entre zonas.
for (const zona of ZONAS) {
  if (ZONAS_SEM_BASE_PATH_FIXO.has(zona.id)) continue;
  conferidas++;
  if (zona.href !== `/${zona.id}`) {
    falhar(`lib/zonas.ts: zona "${zona.id}" tem href="${zona.href}"`);
  } else {
    console.log(`  OK     zonas.ts ${zona.id} -> ${zona.href}`);
  }
}

console.log(`\n${conferidas} conferências, ${falhas} falha(s).`);
if (falhas > 0) process.exit(1);
