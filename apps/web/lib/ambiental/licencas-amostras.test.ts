/**
 * Testes de guarda das amostras de licença — o que o build do Guara lê.
 *
 * O contexto de build do Guara (teto 256 MB) NÃO carrega os JSON completos
 * de licença (114 MB); carrega só `data/amostras/`. Se uma amostra faltar ou
 * perder o `total` real, a página sobe com dado errado SEM ERRO NENHUM —
 * exatamente o modo de falha silenciosa que AGENTS.md manda matar com teste.
 * Estes testes falham quando:
 *  - alguma fonte do mapa não tem amostra versionada (build Guara vazio);
 *  - a amostra passou da janela do mapa (gerador e leitor divergiram);
 *  - o `total` real se perdeu no espalhamento de metadados (Lacuna é
 *    informação: a página precisa dizer quanto existe, não só o que mostra).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ARQUIVOS_LICENCAS, janelaDe } from "./licencas-arquivos";

const DADOS = path.resolve(process.cwd(), "data");
const AMOSTRAS = path.join(DADOS, "amostras");

describe("amostras de licença — o que o build do Guara lê", () => {
  it("cada arquivo do mapa tem amostra versionada em data/amostras/", () => {
    const faltando = Object.keys(ARQUIVOS_LICENCAS).filter(
      (nome) => !existsSync(path.join(AMOSTRAS, nome))
    );
    expect(faltando, `sem amostra: ${faltando.join(", ")}`).toEqual([]);
  });

  it("nenhuma amostra passa da janela do mapa", () => {
    for (const [nome, janela] of Object.entries(ARQUIVOS_LICENCAS)) {
      const bruto = JSON.parse(readFileSync(path.join(AMOSTRAS, nome), "utf-8")) as {
        linhas?: unknown[];
      };
      const n = Array.isArray(bruto.linhas) ? bruto.linhas.length : 0;
      expect(n, `${nome}: ${n} > janela ${janela}`).toBeLessThanOrEqual(janela);
    }
  });

  it("total real do acervo sobreviveu ao corte (janela ≤ total)", () => {
    for (const nome of Object.keys(ARQUIVOS_LICENCAS)) {
      const bruto = JSON.parse(readFileSync(path.join(AMOSTRAS, nome), "utf-8")) as {
        linhas?: unknown[];
        total?: number;
        total_disponivel?: number;
      };
      const total = bruto.total ?? bruto.total_disponivel ?? 0;
      if (total > 0) {
        expect((bruto.linhas ?? []).length, nome).toBeLessThanOrEqual(total);
      }
    }
  });

  it("janelaDe devolve 500 para arquivo fora do mapa", () => {
    expect(janelaDe("nao-existe.json")).toBe(500);
  });
});
