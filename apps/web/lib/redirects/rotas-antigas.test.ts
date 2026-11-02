/**
 * @file Guarda do registro de rotas antigas (`rotas-antigas.ts`).
 *
 * O QUE PROTEGE: toda rota absorvida por painel precisa continuar respondendo
 * em algum lugar. Três falhas são barradas aqui:
 *
 *  1. rota registrada sem `page.tsx` de ponte — o link antigo daria 404 no alvo
 *     estático, onde `redirects()` nem é aplicado;
 *  2. ponte que não usa o registro (`destinoAntigo`) — a ponte apontaria para
 *     um destino e o registro para outro, e ninguém perceberia;
 *  3. destino externo ou fonte duplicada — o canonical precisa ser caminho do
 *     próprio site, e duas entradas para a mesma origem são ambíguas.
 *
 * FONTE: a própria árvore `app/` deste checkout, lida no teste.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ROTAS_ANTIGAS, destinoAntigo } from "./rotas-antigas";

const DIR_APP = fileURLToPath(new URL("../../app", import.meta.url));

describe("registro de rotas antigas", () => {
  it("não repete a mesma origem", () => {
    const origens = ROTAS_ANTIGAS.map((r) => r.source);
    expect(new Set(origens).size).toBe(origens.length);
  });

  it("destino é caminho interno e não é a própria origem", () => {
    for (const rota of ROTAS_ANTIGAS) {
      expect(rota.destination.startsWith("/"), `${rota.source} → destino externo`).toBe(true);
      expect(rota.destination).not.toBe(rota.source);
      expect(rota.permanent).toBe(true);
    }
  });

  it("toda rota registrada tem page.tsx de ponte no disco", () => {
    const semPonte = ROTAS_ANTIGAS.filter(
      (r) => !existsSync(join(DIR_APP, ...r.source.split("/").filter(Boolean), "page.tsx"))
    ).map((r) => r.source);
    expect(semPonte, `sem ponte: ${semPonte.join(", ")}`).toEqual([]);
  });

  it("a ponte usa o registro, em vez de repetir o destino à mão", () => {
    const foraDoRegistro: string[] = [];
    for (const rota of ROTAS_ANTIGAS) {
      const arquivo = join(DIR_APP, ...rota.source.split("/").filter(Boolean), "page.tsx");
      const texto = readFileSync(arquivo, "utf-8");
      if (!texto.includes("PaginaPonte") || !texto.includes("destinoAntigo")) {
        foraDoRegistro.push(rota.source);
      }
    }
    expect(foraDoRegistro, `ponte fora do padrão: ${foraDoRegistro.join(", ")}`).toEqual([]);
  });

  it("destinoAntigo devolve o destino registrado e recusa rota desconhecida", () => {
    expect(destinoAntigo("/congresso/alertas")).toBe("/congresso/analises?recorte=restringem");
    expect(() => destinoAntigo("/rota/que-nao-existe")).toThrow(/sem destino registrado/);
  });
});
