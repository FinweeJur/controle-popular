/**
 * Guarda dos hiperlinks internos do blog — `data/noticias-portal.json`.
 *
 * O portal republica post com link sobre o texto apontando para a fonte
 * oficial e para as próprias subfrentes. Medido em 04/10/2026: varrendo os
 * 193 posts, ACHOU link interno morto — `/diamantina/diario-oficial` não
 * existe (a rota é `/diamantina/prefeitura/diario`) e `/terras` devolvia
 * 200 com a HOME e canonical da home, que é o pior tipo de link quebrado:
 * o leitor acha que chegou e não chegou.
 *
 * Por que teste e não revisão: o JSON cresce a toda postagem e ninguém
 * clica em 60 links à mão. O casamento entende rota dinâmica (`[municipio]`,
 * `[uf]`): `/betim/prefeitura/contratos` casa com o segmento `[municipio]`.
 *
 * Limite honesto: só valida link INTERNO (começa com `/`). Externo depende
 * de rede e de terceiro, que não é estável o bastante para suíte.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const DIR_APP = fileURLToPath(new URL("../../app", import.meta.url));
const NOTICIAS = fileURLToPath(
  new URL("../../data/noticias-portal.json", import.meta.url)
);

/**
 * Lista todos os diretórios de `app/` que têm `page.tsx` — ou seja, as
 * rotas reais. Segmentos dinâmicos (`[municipio]`) ficam como estão e casam
 * com qualquer valor na hora de comparar.
 */
function rotasDoApp(dir: string, relativa = ""): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (!statSync(cheio).isDirectory()) continue;
    const proxima = relativa ? `${relativa}/${nome}` : nome;
    if (existsSync(join(cheio, "page.tsx"))) saida.push(proxima);
    // `components`, `_lib` e afins não têm page.tsx: a recursão descarta.
    saida.push(...rotasDoApp(cheio, proxima));
  }
  return saida;
}

/** Uma rota casa com um padrão se cada segmento idêntico ou dinâmico. */
function casaRota(rota: string, padrao: string): boolean {
  const a = rota.split("/").filter(Boolean);
  const b = padrao.split("/").filter(Boolean);
  if (a.length !== b.length) return false;
  return b.every((seg, i) => seg.startsWith("[") || seg === a[i]);
}

/** Extrai todos os links internos de um texto em sintaxe `[rotulo](url)`. */
function linksInternos(texto: string): string[] {
  const urls: string[] = [];
  for (const [, url] of texto.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (!url.startsWith("/")) continue; // externo, mailto, âncora: fora
    urls.push(url.split("#")[0].split("?")[0].replace(/\/$/, ""));
  }
  return urls;
}

describe("hiperlinks internos do blog", () => {
  const rotas = rotasDoApp(DIR_APP);
  const posts: Array<{
    slug: string;
    paragrafos?: string[];
    recomendacaoVerificar?: string;
  }> = JSON.parse(readFileSync(NOTICIAS, "utf-8"));

  it("acha rotas no app (sanidade do varredor)", () => {
    // Sem isso um varredor quebrado devolveria vazio e o teste passaria.
    expect(rotas.length).toBeGreaterThan(100);
    expect(rotas).toContain("noticias/[slug]");
  });

  it("todo link interno dos posts aponta para uma rota existente", () => {
    const quebrados: string[] = [];
    for (const post of posts) {
      const texto = [
        ...(post.paragrafos ?? []),
        post.recomendacaoVerificar ?? "",
      ].join(" ");
      for (const url of linksInternos(texto)) {
        const existe = rotas.some((r) => casaRota(url, r));
        if (!existe) quebrados.push(`${post.slug} -> ${url}`);
      }
    }
    expect(
      quebrados,
      `link interno morto (corrija o JSON ou restaure a rota): ${quebrados.join(" | ")}`
    ).toEqual([]);
  });
});
