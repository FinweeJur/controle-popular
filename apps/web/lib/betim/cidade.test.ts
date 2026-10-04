/**
 * Guarda de canonical por subrota — `metadataDaCidade()`.
 *
 * O que protege: toda página sob `[municipio]` declara o TERCEIRO argumento
 * (a subrota) da chamada. Sem ele o canonical sai `/${cidade}` e o buscador
 * é informado de que /betim/emendas é duplicata de /betim — medido no ar em
 * 04/10/2026 em ~50 rotas. A subrota também é a chave de sobreposição de
 * `lib/edicoes.ts` (edição do conteúdo sem mexer no código).
 *
 * Por que é teste e não comentário: em 15/08 um comentário errado sobreviveu
 * meses e foi copiado para outra tarefa. Um codemod regenera subrota; este
 * teste barra a próxima página criada sem o argumento.
 *
 * Fonte: `lib/betim/cidade.ts` (`metadataDaCidade`, `BASE_URL`).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/** Diretório `app/` do App Router, resolvido a partir deste arquivo. */
const APP = fileURLToPath(new URL("../../app", import.meta.url));
const MUNICIPIO = join(APP, "[municipio]");

/**
 * Páginas-ponte (URL antiga com `meta refresh` para o destino): o canonical
 * da metadata precisa ser o do DESTINO, não o do arquivo, para casar com o
 * que a `PaginaPonte` declara.
 */
const PONTES: Record<string, string> = {
  "zap-betim": "/zap",
  "nota-betim": "/nota-transparencia",
  "prefeitura/legislacao": "/camara/legislacao",
  convenios: "/emendas",
};

/** Lista recursivamente todos os `page.tsx` sob `[municipio]`. */
function listarPages(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const cheio = join(dir, e.name);
    if (e.isDirectory()) listarPages(cheio, acc);
    else if (e.name === "page.tsx") acc.push(cheio);
  }
  return acc;
}

/**
 * Devolve o texto entre os parênteses de `metadataDaCidade(...)`,
 * casando os parênteses com balanceamento (as descrições têm parênteses
 * dentro de crase, então regex de fim fixo mentiria).
 */
function argumentosDe(fonte: string): string | null {
  const inicio = fonte.indexOf("metadataDaCidade(");
  if (inicio < 0) return null;
  let nivel = 0;
  for (let i = inicio + "metadataDaCidade".length; i < fonte.length; i++) {
    const c = fonte[i];
    if (c === "(") nivel++;
    else if (c === ")") {
      nivel--;
      if (nivel === 0) return fonte.slice(inicio + "metadataDaCidade(".length, i);
    }
  }
  return null;
}

/**
 * Separa os argumentos no nível de topo, ignorando vírgulas dentro de
 * crase, aspas, comentários (`//` e `/*`) e parênteses aninhados. Sem a
 * regra de comentário a descrição do assistente — que tem vírgula dentro
 * de `// ...` — virava um argumento a mais.
 */
function separarArgumentos(trecho: string): string[] {
  const partes: string[] = [];
  let atual = "";
  let nivel = 0;
  let aspas: '"' | "'" | "`" | null = null;
  let comentario: "//" | "/*" | null = null;
  for (let i = 0; i < trecho.length; i++) {
    const c = trecho[i];
    const prox = trecho[i + 1];
    if (comentario) {
      atual += c;
      if (comentario === "//" && c === "\n") comentario = null;
      else if (comentario === "/*" && c === "*" && prox === "/") {
        atual += prox;
        i++;
        comentario = null;
      }
      continue;
    }
    if (aspas) {
      if (c === aspas) aspas = null;
      atual += c;
      continue;
    }
    if (c === "/" && prox === "/") {
      comentario = "//";
      atual += c;
      continue;
    }
    if (c === "/" && prox === "*") {
      comentario = "/*";
      atual += c;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      aspas = c;
      atual += c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") nivel++;
    if (c === ")" || c === "]" || c === "}") nivel--;
    if (c === "," && nivel === 0) {
      partes.push(atual);
      atual = "";
      continue;
    }
    atual += c;
  }
  if (atual.trim()) partes.push(atual);
  return partes;
}

describe("canonical por subrota em [municipio]", () => {
  const pages = listarPages(MUNICIPIO);

  it("encontra as páginas da cidade", () => {
    expect(pages.length).toBeGreaterThan(60);
  });

  for (const arquivo of pages) {
    const rel = arquivo.slice(MUNICIPIO.length + 1).replace(/\\/g, "/");
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";

    it(`${rel} declara a subrota`, () => {
      const fonte = readFileSync(arquivo, "utf-8");
      const trecho = argumentosDe(fonte);
      if (trecho === null) return; // página sem metadataDaCidade (ex.: [slug])
      const args = separarArgumentos(trecho);

      if (dir === "") {
        // home da cidade: canonical `/${cidade}` — sem subrota é o correto
        expect(args.length).toBe(2);
        return;
      }

      expect(
        args.length,
        `falta o 3º argumento (subrota "/${dir}") em ${rel}`
      ).toBe(3);

      const subrota = args[2].trim().replace(/^["']|["']$/g, "");
      const esperada = PONTES[dir] ?? `/${dir}`;
      expect(subrota, `subrota errada em ${rel}`).toBe(esperada);
    });
  }
});
