/**
 * @file Teste de guarda do registro de rotas antigas.
 *
 * O QUE PROTEGE: que todo link antigo indexado continue chegando à URL nova.
 * O defeito que estes casos impedem é silencioso — ponte que aponta para o
 * vazio, rota antiga sem ponte nenhuma, ou dois destinos para a mesma origem.
 *
 * COMO LÊ O DISCO: o teste roda no vitest (node), então varre `app/` de
 * verdade. Um `page.tsx` que use `PaginaPonte` e não esteja em `ROTAS_ANTIGAS`
 * derruba o teste; uma entrada do registro sem `page.tsx` também.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROTAS_ANTIGAS, destinoAntigo } from "./rotas-antigas";

const RAIZ_APP = join(__dirname, "..", "..", "app");

/** page.tsx de todas as rotas, em caminho absoluto de site. */
function paginasDoApp(): string[] {
  const rotas: string[] = [];
  const varrer = (dir: string, prefixo: string) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const segmento = /^[(@]/.test(entrada.name) ? "" : `/${entrada.name}`;
      if (entrada.isDirectory()) {
        varrer(join(dir, entrada.name), `${prefixo}${segmento}`);
        continue;
      }
      if (entrada.name === "page.tsx") rotas.push(prefixo || "/");
    }
  };
  varrer(RAIZ_APP, "");
  return rotas;
}

/** Rotas cujo page.tsx monta a ponte genérica `app/components/PaginaPonte`. */
function pontesNoCodigo(): string[] {
  return paginasDoApp().filter((rota) => {
    if (rota.includes("[")) return false;
    const arquivo = join(RAIZ_APP, ...rota.split("/").filter(Boolean), "page.tsx");
    if (!existsSync(arquivo)) return false;
    // Import explícito, não a palavra solta: a ponte antiga de
    // `/ambiental/direito-critico` cita o componente no comentário, mas tem
    // destino e metadata próprios e não passa por este registro.
    return readFileSync(arquivo, "utf-8").includes('from "@/app/components/PaginaPonte"');
  });
}

describe("registro de rotas antigas", () => {
  it("tem ao menos uma rota, para o teste não passar vazio", () => {
    expect(ROTAS_ANTIGAS.length).toBeGreaterThan(0);
  });

  it("cada destino é caminho absoluto, diferente da origem e sem espaço", () => {
    for (const rota of ROTAS_ANTIGAS) {
      expect(rota.para.startsWith("/")).toBe(true);
      expect(rota.para).not.toBe(rota.de);
      expect(rota.para).not.toContain(" ");
      expect(rota.motivo.length).toBeGreaterThan(10);
    }
  });

  it("não repete origem nem destino", () => {
    const origens = ROTAS_ANTIGAS.map((r) => r.de);
    const destinos = ROTAS_ANTIGAS.map((r) => r.para);
    expect(new Set(origens).size).toBe(origens.length);
    expect(new Set(destinos).size).toBe(destinos.length);
  });

  it("toda rota do registro tem page.tsx no disco", () => {
    for (const rota of ROTAS_ANTIGAS) {
      const arquivo = join(RAIZ_APP, ...rota.de.split("/").filter(Boolean), "page.tsx");
      expect(existsSync(arquivo), `sem page.tsx: ${rota.de}`).toBe(true);
    }
  });

  it("toda página-ponte do código está no registro", () => {
    const registradas = new Set(ROTAS_ANTIGAS.map((r) => r.de));
    const semRegistro = pontesNoCodigo().filter((rota) => !registradas.has(rota));
    expect(semRegistro, `ponte sem destino registrado: ${semRegistro.join(", ")}`).toEqual([]);
  });

  it("destinoAntigo devolve o destino e ignora rota desconhecida", () => {
    const primeira = ROTAS_ANTIGAS[0];
    expect(destinoAntigo(primeira.de)).toBe(primeira.para);
    expect(destinoAntigo("/rota-que-nao-existe")).toBeUndefined();
  });
});
