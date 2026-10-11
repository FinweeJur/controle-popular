/**
 * Prova da query de municípios de `/ambiental/licenciamento` (fila B8,
 * expansão ambiental para 853 cidades, 10/10/2026).
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Em 10/10/2026 `listarMunicipiosComLicenciamento` deixou de ser
 * `INNER JOIN` a partir das licenças (só municípios COM dado — 145 de 853,
 * medido no banco de produção) e passou a ser `LEFT JOIN` a partir de
 * `ref_municipios_mg` (os 853, com `total: 0` para quem não tem dado).
 * Mudança de SQL de lista inteira = tela muda inteira; "número errado é
 * dano" (AGENTS §1), então o SQL vai preso no teste.
 *
 * ═══ COMO A PROVA FUNCIONA ═══
 *
 * Mesmo arnês de `betim.test.ts`, em versão curta: `vi.mock` troca
 * `comBancoReserva` por um falso que grava o SQL e os parâmetros que o
 * Drizzle montou, devolve LINHAS VAZIAS (caso "banco sem dado") e aplica o
 * MESMO predicado `vazio`/`padrao` do original. Sem rede, sem Postgres.
 * O Drizzle do falso usa o driver `node-postgres` de mentira — mesmo
 * `PgDialect` do runtime, logo mesmo SQL de produção.
 *
 * Asserções inline (sem arquivo dourado): o que importa aqui são os
 * pontos de virada da mudança — tabela base, tipo de join, contagem que
 * não mente 0, corte do grandfather SP e ordenação estável.
 */

import { describe, expect, it, vi } from "vitest";
import type { DB } from "@/lib/db/client";
import type { OpcoesReserva } from "@/lib/db/reserva";

/**
 * Caixa de captura compartilhada entre o teste e o módulo falsificado.
 * `vi.hoisted` porque `vi.mock` é içado para o topo do arquivo: a fábrica
 * não pode fechar sobre `let` declarado abaixo, mas PODE sobre isto.
 */
const caixa = vi.hoisted(() => ({
  consultas: [] as { sql: string; params: string }[],
  opcoes: null as null | { vazio: string; padrao: string; rotulo: string },
  vazio: false,
  db: null as unknown,
}));

vi.mock("@/lib/db/reserva", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("@/lib/db/schema");

  /** Cliente falso: grava a consulta e devolve zero linhas, sem rede. */
  const cliente = {
    query: async (configuracao: unknown, params?: unknown[]) => {
      const sql =
        typeof configuracao === "string"
          ? configuracao
          : String((configuracao as { text?: string }).text ?? "");
      caixa.consultas.push({ sql, params: JSON.stringify(params ?? []) });
      return { rows: [], rowCount: 0, command: "SELECT", oid: -1, fields: [] };
    },
  };

  caixa.db = drizzle(cliente as unknown as never, { schema });

  return {
    comBancoReserva: async <T>(
      consulta: (db: DB) => Promise<T>,
      opcoes: OpcoesReserva<T>
    ): Promise<T> => {
      caixa.opcoes = {
        vazio: String(opcoes.vazio).replace(/\s+/g, " ").trim(),
        padrao: JSON.stringify(opcoes.padrao),
        rotulo: opcoes.rotulo,
      };
      const bruto = await consulta(caixa.db as unknown as DB);
      const vazio = opcoes.vazio(bruto);
      caixa.vazio = vazio;
      return vazio ? opcoes.padrao : bruto;
    },
  };
});

import { listarMunicipiosComLicenciamento } from "./ambiental-licenciamento";

describe("listarMunicipiosComLicenciamento — LEFT JOIN dos 853", () => {
  it("parte de ref_municipios_mg, conta id_fonte (nunca count(*)) e corta o grandfather SP", async () => {
    caixa.consultas = [];
    caixa.vazio = false;
    // `caixa.opcoes` NÃO é resetado aqui: atribuir `null` estreitaria a
    // propriedade para `null` no resto da função e o `?.` abaixo cairia em
    // `never`. O mock regrava o campo a cada chamada — o inicial já é null.

    const resultado = await listarMunicipiosComLicenciamento();

    // Uma chamada, SQL capturado.
    expect(caixa.consultas).toHaveLength(1);
    const { sql, params } = caixa.consultas[0];

    // Base = a lista oficial de cidades (lado esquerdo do LEFT JOIN), não a
    // tabela de licenças: é o que faz os 708 sem dado aparecerem.
    expect(sql).toContain(`from "ref_municipios_mg"`);
    expect(sql).toContain(`left join "ambiental_licenciamento"`);
    expect(sql).not.toContain(`inner join`);

    // Contagem por coluna não-nula: com LEFT JOIN, município sem dado é uma
    // linha de NULLs e count(*) devolveria 1 — mentiria "1 licença" para 0.
    expect(sql).toContain(`count("ambiental_licenciamento"."id_fonte")`);
    expect(sql).not.toContain(`count(*)`);

    // Filtro das 853 de MG: ref_municipios_mg tem 854 linhas (grandfather
    // São Paulo 3550308 da migration 0057); '31' é o dígito de estado do IBGE.
    expect(sql).toContain(`like '31%'`);
    expect(params).toBe("[]"); // o corte é literal, não parâmetro

    // groupBy nos dois campos selecionados, para o count ser por município.
    expect(sql).toContain(
      `group by "ref_municipios_mg"."id_ibge", "ref_municipios_mg"."nome"`
    );

    // Ordenação: mais licenciado primeiro e desempate estável por nome —
    // sem o desempate, os 708 zeros "pulam" entre renders.
    expect(sql).toContain(
      `order by count("ambiental_licenciamento"."id_fonte") desc, "ref_municipios_mg"."nome" asc`
    );

    // Banco sem dado (reserva caiu): predicado vazio → [] (padrão), nunca
    // uma lista falsa de 853.
    expect(resultado).toEqual([]);
    expect(caixa.opcoes).not.toBeNull();
    expect(caixa.opcoes?.rotulo).toBe("licenciamento");
    expect(caixa.opcoes?.padrao).toBe("[]");
    expect(caixa.vazio).toBe(true);
  });
});
