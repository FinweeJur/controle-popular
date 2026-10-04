/**
 * Guarda do inventário de rotas do sitemap — `rotas-descobertas.ts`.
 *
 * O que protege: o arquivo gerado precisa casar com a árvore real de
 * `apps/web/app/`. Duas falhas distintas, as duas medidas em 04/10/2026:
 *
 *  1. página nova sem regenerar — o sitemap fica velho e o buscador não
 *     descobre a rota (foram 147 páginas assim);
 *  2. arquivo gerado com caminho fantasma — rota anunciada que devolve 404
 *     faz o Google desconfiar do host inteiro.
 *
 * Por que é teste e não revisão humana: a lista manual sobreviveu meses
 * errando porque ninguém lembra de olhar o sitemap ao criar página. Este
 * teste olha toda vez, em milissegundos.
 *
 * Regenerar com: `cd apps/web && npx tsx scripts/gerar-rotas-sitemap.mts`
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  descobrir,
  EXCLUIR,
  EXCLUIR_SUFIXO,
} from "./descoberta";
import { ROTAS_GLOBAIS, SUFIXOS_CIDADE } from "./rotas-descobertas";

/** Diretório `app/` resolvido a partir deste arquivo — vale em qualquer CI. */
const DIR_APP = fileURLToPath(new URL("../../app", import.meta.url));
const GERADO = fileURLToPath(new URL("./rotas-descobertas.ts", import.meta.url));

describe("rotas-descobertas (inventario do sitemap)", () => {
  const esperado = descobrir(DIR_APP);

  it("está atualizado em relação à arvore do app", () => {
    // A mensagem lista as diferenças: sem ela o falha só diz "não bate".
    const faltando = esperado.globais.filter((r) => !ROTAS_GLOBAIS.includes(r));
    const sobrando = ROTAS_GLOBAIS.filter((r) => !esperado.globais.includes(r));
    expect(
      faltando,
      `rote novo fora do inventario: rode \`npx tsx scripts/gerar-rotas-sitemap.mts\` — faltam: ${faltando.join(", ")}`
    ).toEqual([]);
    expect(
      sobrando,
      `rota no inventario sem page.tsx: rode o gerador — sobram: ${sobrando.join(", ")}`
    ).toEqual([]);
  });

  it("está atualizado em relação aos sufixos de [municipio]", () => {
    const faltando = esperado.sufixos.filter((r) => !SUFIXOS_CIDADE.includes(r));
    const sobrando = SUFIXOS_CIDADE.filter((r) => !esperado.sufixos.includes(r));
    expect(
      faltando,
      `sufixo novo fora do inventario: rode \`npx tsx scripts/gerar-rotas-sitemap.mts\` — faltam: ${faltando.join(", ")}`
    ).toEqual([]);
    expect(
      sobrando,
      `sufixo no inventario sem page.tsx: rode o gerador — sobram: ${sobrando.join(", ")}`
    ).toEqual([]);
  });

  it("está ordenado e sem duplicatas", () => {
    for (const [nome, lista] of [
      ["ROTAS_GLOBAIS", ROTAS_GLOBAIS],
      ["SUFIXOS_CIDADE", SUFIXOS_CIDADE],
    ] as const) {
      expect(new Set(lista).size, `${nome} tem duplicata`).toBe(lista.length);
      expect([...lista].sort(), `${nome} não está ordenado`).toEqual([...lista]);
    }
  });

  it("toda rota anunciada aponta para um page.tsx existente", () => {
    const semPagina = ROTAS_GLOBAIS.filter(
      (r) => !existsSync(join(DIR_APP, ...r.split("/").filter(Boolean), "page.tsx"))
    );
    expect(semPagina, `sem page.tsx: ${semPagina.join(", ")}`).toEqual([]);
  });

  it("nenhuma rota excluída vazou para o inventário", () => {
    const proibidas = [
      ...Object.keys(EXCLUIR),
      ...Object.keys(EXCLUIR_SUFIXO),
    ];
    const vazou = proibidas.filter(
      (r) => ROTAS_GLOBAIS.includes(r) || SUFIXOS_CIDADE.includes(r)
    );
    expect(vazou, `excluida no descoberta.ts, mas presente: ${vazou.join(", ")}`).toEqual([]);
  });

  it("cada exclusão tem motivo escrito", () => {
    for (const [mapa, rotulo] of [
      [EXCLUIR, "EXCLUIR"],
      [EXCLUIR_SUFIXO, "EXCLUIR_SUFIXO"],
    ] as const) {
      for (const [rota, motivo] of Object.entries(mapa)) {
        expect(motivo.length, `${rotulo}[${rota}] sem motivo`).toBeGreaterThan(5);
      }
    }
  });

  it("o gerador declarado no cabeçalho é o script que existe", () => {
    const texto = readFileSync(GERADO, "utf-8");
    expect(texto).toContain("scripts/gerar-rotas-sitemap.mts");
    expect(texto).toContain("NÃO edite à mão");
  });
});
