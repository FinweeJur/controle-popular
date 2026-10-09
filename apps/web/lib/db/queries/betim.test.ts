/**
 * Prova de equivalência das queries de `betim.ts` — eixo Cidades.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Em 09/10/2026 o arquivo (3.406 linhas) foi alvo de refatoração de
 * hotspots do CodeScene: a Complex Method `condicoesDeContratos` (cc = 12)
 * e seis pares de funções marcados por Code Duplication. O portal atende
 * gente sob estresse e NÚMERO ERRADO É DANO (AGENTS §1), então "refatorei
 * sem quebrar" não vale: vale o SQL montado, comparado antes e depois.
 *
 * ═══ COMO A PROVA FUNCIONA ═══
 *
 * Nada aqui toca Postgres. O `comBancoReserva` é substituído por um falso
 * (via `vi.mock`) que:
 *
 *   1. grava o SQL e os parâmetros que o Drizzle montou, capturados no
 *      `client.query(cfg, params)` — o mesmo ponto onde o driver real
 *      entregaria a consulta ao banco;
 *   2. devolve LINHAS VAZIAS, para o caso de "banco sem dado";
 *   3. aplica o MESMO predicado `vazio` e o MESMO `padrao` do original, e
 *      grava o valor final.
 *
 * Então cada caso compara cinco coisas: SQL, parâmetros, predicado de
 * vazio (fonte normalizada), padrão e resultado final. Uma query que mude
 * de qualquer jeito derruba o teste.
 *
 * O Drizzle do falso usa o driver `node-postgres` com um Pool de mentira;
 * os dois drivers (Neon HTTP e TCP) compartilham o mesmo `PgDialect`, então
 * o SQL gerado é o mesmo que o de produção.
 *
 * ═══ QUANDO ATUALIZAR O DOURADO ═══
 *
 * Só quando a mudança na query for DELIBERADA e revisada por um humano:
 *
 *     CP_DIFERENCIAL_GRAVAR=1 npm run test:lib -- betim
 *
 * Depois, leia o diff de `betim.dourado.json` linha a linha: é a prova que
 * vai junto com o commit. Divergência sem decisão = bug, não é para
 * "consertar" o dourado.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { DB } from "@/lib/db/client";
import type { OpcoesReserva } from "@/lib/db/reserva";
import { comoIdMunicipio, type IdMunicipio } from "@/lib/db/queries/municipios";
import * as b from "./betim";

/**
 * Caixa de captura compartilhada entre o teste e o módulo falsificado.
 *
 * `vi.hoisted` existe porque `vi.mock` é içado para o topo do arquivo pelo
 * transformador: a fábrica não pode fechar sobre uma `let` declarada abaixo,
 * mas PODE fechar sobre o objeto criado aqui.
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
      caixa.consultas.push({ sql, params: jsonEstavel(params ?? []) });
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
        // A fonte do predicado vem do arquivo; normalizar espaço em branco
        // deixa a troca de ESCORE de quebrar o teste (reflow não é mudança
        // semântica) sem esconder troca de operador.
        vazio: String(opcoes.vazio).replace(/\s+/g, " ").trim(),
        padrao: jsonEstavel(opcoes.padrao),
        rotulo: opcoes.rotulo,
      };
      const bruto = await consulta(caixa.db as unknown as DB);
      const vazio = opcoes.vazio(bruto);
      caixa.vazio = vazio;
      return vazio ? opcoes.padrao : bruto;
    },
  };
});

/** JSON estável: `undefined` vira texto, para diferença não sumir no caminho. */
function jsonEstavel(valor: unknown): string {
  return (
    JSON.stringify(valor, (_chave, v: unknown) =>
      v === undefined ? "__undefined__" : v
    ) ?? "null"
  );
}

/** Um caso = uma chamada pública de `betim.ts` + o que ela produziu. */
type Registro = {
  caso: string;
  consultas: { sql: string; params: string }[];
  opcoes: { vazio: string; padrao: string; rotulo: string } | null;
  vazio: boolean;
  resultado: string;
};

const CAMINHO_DOURADO = join(dirname(fileURLToPath(import.meta.url)), "betim.dourado.json");

async function rodar(caso: string, chamada: () => Promise<unknown>): Promise<Registro> {
  caixa.consultas = [];
  caixa.opcoes = null;
  caixa.vazio = false;
  const resultado = await chamada();
  return {
    caso,
    consultas: [...caixa.consultas],
    opcoes: caixa.opcoes,
    vazio: caixa.vazio,
    resultado: jsonEstavel(resultado),
  };
}

/** Betim, pela marca forte do IBGE (7 dígitos) — mesma que o app usa. */
const BETIM: IdMunicipio = comoIdMunicipio("3106705");

type Par = [caso: string, chamada: () => Promise<unknown>];

/**
 * Os pares de funções marcados por Code Duplication + o bateria de filtros
 * de `condicoesDeContratos` (a Complex Method). Os filtros cobrem cada
 * ramo, inclusive os falsy (`ano: 0`, `alerta: false`, `q: ""`), que é
 * onde `if (f.x)` e `f.x !== undefined` divergem.
 */
const CASOS: Par[] = [
  // ── os seis pares duplicados ──
  ["listarNoticias", () => b.listarNoticias(BETIM)],
  ["noticiaPorSlug/encontrado", () => b.noticiaPorSlug(BETIM, "obra-da-ponte")],
  ["noticiaPorSlug/sem-cadastro", () => b.noticiaPorSlug(BETIM, "nao-existe")],
  ["iniciativasParaopeba", () => b.iniciativasParaopeba(BETIM)],
  ["anoMaisRecenteDeDespesas", () => b.anoMaisRecenteDeDespesas(BETIM)],
  ["anoMaisRecenteDeMortalidade", () => b.anoMaisRecenteDeMortalidade(BETIM)],
  ["listarVereadores", () => b.listarVereadores(BETIM)],
  ["listarVereadoresForaDeExercicio", () => b.listarVereadoresForaDeExercicio(BETIM)],
  ["vereadorPorSlug", () => b.vereadorPorSlug(BETIM, "maria-silva")],
  ["analisesDeObjetos/sem-objeto", () => b.analisesDeObjetos(BETIM, {})],
  ["analisesDeObjetos/atos", () => b.analisesDeObjetos(BETIM, { atos: ["a1", "a2"] })],
  ["analisesDeObjetos/ambos", () => b.analisesDeObjetos(BETIM, { atos: ["a1"], proposicoes: ["p1"] })],
  ["viciosDeObjetos/sem-objeto", () => b.viciosDeObjetos(BETIM, {})],
  ["viciosDeObjetos/proposicoes", () => b.viciosDeObjetos(BETIM, { proposicoes: ["p1"] })],
  ["situacoesDeLicitacoesDisponiveis", () => b.situacoesDeLicitacoesDisponiveis(BETIM)],
  ["modalidadesDeLicitacoesDisponiveis", () => b.modalidadesDeLicitacoesDisponiveis(BETIM)],

  // ── condicoesDeContratos, ramo a ramo, via os três callers ──
  ["contratosPaginados/sem-filtro", () => b.contratosPaginados(BETIM)],
  ["contratosPaginados/ano", () => b.contratosPaginados(BETIM, { ano: 2024 })],
  ["contratosPaginados/ano-zero", () => b.contratosPaginados(BETIM, { ano: 0 })],
  ["contratosPaginados/status-ativo", () => b.contratosPaginados(BETIM, { status: "ativo" })],
  ["contratosPaginados/status-encerrado", () => b.contratosPaginados(BETIM, { status: "encerrado" })],
  ["contratosPaginados/status-vocabulario-livre", () => b.contratosPaginados(BETIM, { status: "EM EXECUCAO" })],
  ["contratosPaginados/status-vazio", () => b.contratosPaginados(BETIM, { status: "" })],
  ["contratosPaginados/alerta", () => b.contratosPaginados(BETIM, { alerta: true })],
  ["contratosPaginados/alerta-falso", () => b.contratosPaginados(BETIM, { alerta: false })],
  ["contratosPaginados/motivo", () => b.contratosPaginados(BETIM, { motivo: "atraso" })],
  ["contratosPaginados/tema", () => b.contratosPaginados(BETIM, { tema: "agua" })],
  ["contratosPaginados/busca", () => b.contratosPaginados(BETIM, { q: "ponte" })],
  ["contratosPaginados/busca-vazia", () => b.contratosPaginados(BETIM, { q: "" })],
  ["contratosPaginados/valorMin", () => b.contratosPaginados(BETIM, { valorMin: 1000 })],
  ["contratosPaginados/valorMax", () => b.contratosPaginados(BETIM, { valorMax: 50000 })],
  ["contratosPaginados/valorMin-zero", () => b.contratosPaginados(BETIM, { valorMin: 0 })],
  ["contratosPaginados/tudo-junto", () =>
    b.contratosPaginados(BETIM, {
      ano: 2024,
      status: "ativo",
      alerta: true,
      motivo: "atraso",
      tema: "agua",
      q: "obra",
      valorMin: 1,
      valorMax: 999999,
      tipo: "Contrato",
      pagina: 3,
      porPagina: 50,
    })],
  ["totaisDeContratos/sem-filtro", () => b.totaisDeContratos(BETIM)],
  ["totaisDeContratos/status-ativo", () => b.totaisDeContratos(BETIM, { status: "ativo" })],
  ["totaisDeContratos/busca", () => b.totaisDeContratos(BETIM, { q: "escola" })],
  ["contratosParaExport/limitado", () => b.contratosParaExport(BETIM, { ano: 2024, q: "escola" }, 200)],
];

describe("betim.ts — prova de equivalência das queries", () => {
  it("cada caso produz o SQL, os parâmetros, o predicado e o resultado dourados", async () => {
    const obtidos: Registro[] = [];
    for (const [caso, chamada] of CASOS) obtidos.push(await rodar(caso, chamada));

    // Sanidade do próprio arnês: nada de caso que não consultou nada sem
    // ser um retorno antecipado (os dois "sem-objeto" são propositalmente
    // vazios — o `if` de id de objeto curto-circuita antes do banco).
    expect(obtidos).toHaveLength(CASOS.length);
    expect(obtidos.filter((r) => r.opcoes === null)).toHaveLength(0);

    if (process.env.CP_DIFERENCIAL_GRAVAR === "1") {
      writeFileSync(CAMINHO_DOURADO, `${JSON.stringify(obtidos, null, 2)}\n`, "utf8");
      expect(obtidos.length).toBeGreaterThan(0);
      return;
    }

    let dourado: Registro[];
    try {
      dourado = JSON.parse(readFileSync(CAMINHO_DOURADO, "utf8")) as Registro[];
    } catch {
      throw new Error(
        `Dourado não encontrado em ${CAMINHO_DOURADO}. Grave com: CP_DIFERENCIAL_GRAVAR=1`
      );
    }

    const divergencias: string[] = [];
    for (let i = 0; i < Math.max(obtidos.length, dourado.length); i++) {
      const esperado = dourado[i];
      const atual = obtidos[i];
      if (!esperado || !atual) {
        divergencias.push(`#${i}: quantidade de casos mudou (${dourado?.length} → ${obtidos?.length})`);
        continue;
      }
      if (JSON.stringify(esperado) !== JSON.stringify(atual)) {
        divergencias.push(`#${i} ${esperado.caso}:\n  esperado ${JSON.stringify(esperado)}\n  atual    ${JSON.stringify(atual)}`);
      }
    }
    expect(divergencias, `${divergencias.length} divergência(s)`).toEqual([]);
  }, 30000);
});
