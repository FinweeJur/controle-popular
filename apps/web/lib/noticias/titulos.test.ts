/**
 * Guarda de caixa dos títulos do blog — `data/noticias-portal.json`.
 *
 * Regra do dono (04/10/2026): o título usa caixa de frase, ou seja, só a
 * primeira palavra e os nomes próprios e siglas ficam com maiúscula. O erro
 * que motivou o teste: os posts nasceram em "Title Case" (estilo inglês),
 * com comuns como "Contratos Públicos ... Somam Bilhões" em maiúscula.
 *
 * Por que teste e não revisão: o blog cresce a cada post e ninguém relê 69
 * títulos à mão. Aqui o teste varre os posts analíticos (os editais do
 * Diário Oficial ficam de fora — não são blog e têm rótulo próprio de
 * certame) e reprova qualquer palavra interna em maiúscula que não seja
 * sigla nem esteja na lista de nomes próprios abaixo.
 *
 * Limite honesto: a lista de nomes próprios precisa crescer junto com o
 * conteúdo. Se um nome legítimo novo aparecer, o teste acusa e a correção
 * é acrescentá-lo aqui — o atrito é intencional, é o que documenta a regra.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const NOTICIAS = fileURLToPath(
  new URL("../../data/noticias-portal.json", import.meta.url)
);

/** Nomes próprios, empresas e partes de nomes de instituição aceitos no título. */
const NOMES_PROPIOS = new Set([
  "Amazônia", "Anatel", "Banco", "Betim", "Brasil", "Brumadinho", "Canadá",
  "Central", "Contratações", "Defensoria", "Diário", "Doce", "Gerais",
  "Goiás", "Horizonte", "Jequitinhonha", "Justiça", "Lithium", "Mariana",
  "Minas", "Mount", "Médio", "Nacional", "Oficial", "Polley", "Portal",
  "Públicas", "Rio", "S.A", "Selic", "Sino-Brasileiro", "TACs", "Toronto",
  "USAspending", "União", "Vale", "R$",
]);

/** Sigla: tudo maiúsculo, com dígito, barra ou ponto (CNES, DETRAN-MG, S.A). */
function ehSigla(token: string): boolean {
  if (/[0-9]/.test(token)) return true;
  if (token.includes("/") || token.includes(".")) return true;
  if (token.includes("-") && token === token.toUpperCase()) return true;
  const letras = [...token].filter((c) => /[A-Za-zÀ-ÿ]/.test(c));
  return letras.length >= 2 && letras.every((c) => c === c.toUpperCase());
}

interface Post {
  slug: string;
  titulo: string;
}

describe("caixa dos títulos do blog", () => {
  const posts: Post[] = JSON.parse(readFileSync(NOTICIAS, "utf-8"));

  it("os posts analíticos usam caixa de frase (sem Title Case)", () => {
    const problemas: string[] = [];
    for (const post of posts) {
      if (post.slug.startsWith("radar-editais")) continue;
      const palavras = post.titulo.split(/\s+/);
      for (let i = 1; i < palavras.length; i++) {
        const token = palavras[i].replace(/[.,;:!?()]+$/, "");
        const comecaMaiuscula = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(token);
        if (!comecaMaiuscula) continue;
        if (NOMES_PROPIOS.has(token) || ehSigla(token)) continue;
        problemas.push(`${post.slug}: "${token}" em "${post.titulo}"`);
      }
    }
    expect(
      problemas,
      `maiúscula indevida no título (use caixa de frase ou some o nome à lista): ${problemas.join(" | ")}`
    ).toEqual([]);
  });
});
