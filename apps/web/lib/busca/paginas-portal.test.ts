import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { buscarPaginasPortal, PAGINAS_PORTAL } from "./paginas-portal";

/**
 * Diretório `app/` do App Router, resolvido a partir deste arquivo — não a
 * partir do cwd, para o teste valer em qualquer executor da CI.
 */
const APP = fileURLToPath(new URL("../../app", import.meta.url));

/** Lista recursivamente os diretórios que têm `page.tsx` (uma rota cada). */
function diretoriosDeRota(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) {
      diretoriosDeRota(cheio, acc);
    } else if (nome === "page.tsx" || nome === "page.ts" || nome === "page.jsx") {
      acc.push(dir.slice(APP.length).replace(/\\/g, "/"));
    }
  }
  return acc;
}

/**
 * Confere se um href do catálogo bate com uma rota real.
 *
 * Regras do App Router: segmento literal tem que casar igual; `[x]` casa um
 * segmento qualquer; `[...x]` casa o resto; `(grupo)` e `@slot` não entram
 * na URL e são ignorados.
 */
function hrefBateComRota(rota: string, href: string): boolean {
  const alvos = rota.split("/").filter(Boolean);
  const pedidos = href.split("/").filter(Boolean);
  let i = 0;
  for (const seg of alvos) {
    if (seg.startsWith("(") || seg.startsWith("@")) continue;
    if (seg.startsWith("[...") || seg.startsWith("[[")) return pedidos.length >= i;
    if (seg.startsWith("[")) {
      if (i >= pedidos.length) return false;
      i++;
      continue;
    }
    if (pedidos[i] !== seg) return false;
    i++;
  }
  return i === pedidos.length;
}

describe("buscarPaginasPortal", () => {
  it("encontra páginas por termos de grande relevância cívica", () => {
    const resMariana = buscarPaginasPortal("mariana");
    expect(resMariana.length).toBeGreaterThan(0);
    expect(resMariana[0].href).toBe("/ambiental/mariana");

    const resBrumadinho = buscarPaginasPortal("brumadinho");
    expect(resBrumadinho.length).toBeGreaterThan(0);
    expect(resBrumadinho.some((p) => p.href.startsWith("/paraopeba"))).toBe(true);

    const resTjmg = buscarPaginasPortal("tjmg");
    expect(resTjmg.length).toBeGreaterThan(0);
    expect(resTjmg[0].href).toBe("/judiciario/instituicoes/tjmg");

    const resBarragens = buscarPaginasPortal("barragens");
    expect(resBarragens.length).toBeGreaterThan(0);
    expect(resBarragens.some((p) => p.href.includes("barragens"))).toBe(true);

    const resTecnologia = buscarPaginasPortal("ia livre");
    expect(resTecnologia.length).toBeGreaterThan(0);
    expect(resTecnologia[0].href).toBe("/tecnologia");
  });

  it("tolera acentos e caixa alta", () => {
    const res = buscarPaginasPortal("ORÇAMENTO");
    expect(res.length).toBeGreaterThan(0);
    expect(res.some((p) => p.href.includes("orcamento") || p.descricao.toLowerCase().includes("orcamento"))).toBe(true);
  });

  it("retorna vazio para consultas curtas ou sem sentido", () => {
    expect(buscarPaginasPortal("")).toEqual([]);
    expect(buscarPaginasPortal("x")).toEqual([]);
    expect(buscarPaginasPortal("zzzzzzzzzzz")).toEqual([]);
  });

  it("garante integridade de todas as páginas catalogadas", () => {
    for (const p of PAGINAS_PORTAL) {
      expect(p.id).toBeTruthy();
      expect(p.titulo).toBeTruthy();
      expect(p.descricao).toBeTruthy();
      expect(p.href.startsWith("/")).toBe(true);
      expect(p.palavrasChave.length).toBeGreaterThan(0);
    }
  });

  it("todo href do catálogo corresponde a uma rota real do App Router (achado 22.4)", () => {
    // O teste acima confere a FORMA do href, não a existência da rota. Lista
    // hardcoded de rotas envelhece em silêncio: foi assim que
    // /noticias/direitos-em-movimento-guia foi publicado apontando para 404.
    // Aqui a lista sai da árvore `app/` a cada execução.
    const rotas = diretoriosDeRota(APP);
    expect(rotas.length).toBeGreaterThan(0);

    const semRota = PAGINAS_PORTAL.filter((p) => !rotas.some((r) => hrefBateComRota(r, p.href)));
    expect(
      semRota.map((p) => `${p.id} -> ${p.href}`)
    ).toEqual([]);
  });

  it("normaliza a consulta inteira, sem pontuação sobrando (dívida 22.5)", () => {
    // "licitações;" virava o termo `licitacoes;` e não casava com
    // `licitacoes`. As duas pontuações têm que dar o mesmo resultado.
    const comPonto = buscarPaginasPortal("licitações;");
    const semPonto = buscarPaginasPortal("licitacoes");
    expect(comPonto.length).toBeGreaterThan(0);
    expect(comPonto).toEqual(semPonto);

    // Pontuação no meio e hífen também entram limpos.
    expect(buscarPaginasPortal("licitações públicas:")).toEqual(
      buscarPaginasPortal("licitacoes publicas")
    );
  });
});
