import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Testes da gravação do painel.
 *
 * `edicoes-io.ts` resolve o caminho por `process.cwd()`, então cada teste roda
 * numa pasta temporária própria e devolve o `cwd` no fim. Sem isso, um teste
 * escreveria no `data/edicoes.json` de verdade do repositório — e um teste que
 * suja o repositório é pior que um teste que falta.
 *
 * O import é dinâmico e refeito a cada `cwd` porque o módulo calcula o caminho
 * do arquivo na hora da chamada, não no topo — mas manter o `resetModules`
 * documenta a dependência em vez de depender do detalhe.
 */

let cwdOriginal: string;
let pasta: string;

async function io() {
  return await import("./edicoes-io");
}

beforeEach(() => {
  cwdOriginal = process.cwd();
  pasta = mkdtempSync(path.join(tmpdir(), "painel-"));
  mkdirSync(path.join(pasta, "data"), { recursive: true });
  process.chdir(pasta);
});

afterEach(() => {
  process.chdir(cwdOriginal);
  rmSync(pasta, { recursive: true, force: true });
});

describe("normalizarRota", () => {
  test("tira barra final, minúsculas, e garante a barra inicial", async () => {
    const { normalizarRota } = await io();
    expect(normalizarRota("/Paraopeba/Entenda/")).toBe("/paraopeba/entenda");
    expect(normalizarRota("paraopeba/entenda")).toBe("/paraopeba/entenda");
    expect(normalizarRota("  /BH/Saude  ")).toBe("/bh/saude");
  });

  test("a raiz continua sendo uma barra, não vira vazio", async () => {
    const { normalizarRota } = await io();
    expect(normalizarRota("/")).toBe("/");
  });
});

describe("lerEdicoes", () => {
  test("arquivo ausente devolve lista vazia — é o estado de um clone novo", async () => {
    const { lerEdicoes } = await io();
    expect(lerEdicoes()).toEqual([]);
  });

  test("arquivo corrompido devolve vazio em vez de derrubar o painel", async () => {
    writeFileSync(path.join(pasta, "data", "edicoes.json"), "{ isto não é json", "utf-8");
    const { lerEdicoes } = await io();
    expect(lerEdicoes()).toEqual([]);
  });
});

describe("salvarEdicao", () => {
  const base = { rota: "/x", por: "Artur", motivo: "teste", em: "2026-08-15T12:00:00.000Z" };

  test("grava e relê", async () => {
    const { salvarEdicao, lerEdicoes } = await io();
    const r = salvarEdicao({ ...base, titulo: "Novo título" });
    expect(r.ok).toBe(true);
    expect(lerEdicoes()).toHaveLength(1);
    expect(lerEdicoes()[0].titulo).toBe("Novo título");
  });

  test("recusa sem motivo — edição sem motivo é edição que ninguém audita", async () => {
    const { salvarEdicao, lerEdicoes } = await io();
    const r = salvarEdicao({ ...base, motivo: "   ", titulo: "t" });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/motivo/i);
    expect(lerEdicoes()).toHaveLength(0);
  });

  test("recusa sem autor", async () => {
    const { salvarEdicao } = await io();
    expect(salvarEdicao({ ...base, por: "", titulo: "t" }).ok).toBe(false);
  });

  test("título E descrição vazios não é edição — é remoção disfarçada", async () => {
    const { salvarEdicao } = await io();
    const r = salvarEdicao({ ...base, titulo: "  ", descricao: "" });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/remover/i);
  });

  test("gravar a mesma rota duas vezes substitui, não duplica", async () => {
    const { salvarEdicao, lerEdicoes } = await io();
    salvarEdicao({ ...base, titulo: "primeiro" });
    salvarEdicao({ ...base, titulo: "segundo" });
    const todas = lerEdicoes();
    expect(todas).toHaveLength(1);
    expect(todas[0].titulo).toBe("segundo");
  });

  test("rotas que só diferem por barra final ou caixa são a MESMA rota", async () => {
    const { salvarEdicao, lerEdicoes } = await io();
    salvarEdicao({ ...base, rota: "/paraopeba/entenda", titulo: "a" });
    salvarEdicao({ ...base, rota: "/Paraopeba/Entenda/", titulo: "b" });
    expect(lerEdicoes()).toHaveLength(1);
    expect(lerEdicoes()[0].titulo).toBe("b");
  });

  test("grava no mesmo formato do script de linha de comando: 2 espaços e \\n no fim", async () => {
    const { salvarEdicao } = await io();
    salvarEdicao({ ...base, titulo: "t" });
    const bruto = readFileSync(path.join(pasta, "data", "edicoes.json"), "utf-8");
    expect(bruto.endsWith("\n")).toBe(true);
    expect(bruto).toContain('\n  "edicoes": [');
  });

  test("cria o diretório data/ se ele não existir", async () => {
    rmSync(path.join(pasta, "data"), { recursive: true, force: true });
    const { salvarEdicao } = await io();
    expect(salvarEdicao({ ...base, titulo: "t" }).ok).toBe(true);
    expect(existsSync(path.join(pasta, "data", "edicoes.json"))).toBe(true);
  });
});

describe("removerEdicao", () => {
  test("remove o que existe", async () => {
    const { salvarEdicao, removerEdicao, lerEdicoes } = await io();
    salvarEdicao({
      rota: "/x",
      titulo: "t",
      por: "A",
      motivo: "m",
      em: "2026-08-15T12:00:00.000Z",
    });
    expect(removerEdicao("/x").ok).toBe(true);
    expect(lerEdicoes()).toHaveLength(0);
  });

  test("remover o que não existe avisa, em vez de fingir sucesso", async () => {
    const { removerEdicao } = await io();
    const r = removerEdicao("/nao-existe");
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/não havia/i);
  });
});

describe("painelAutorizado", () => {
  const original = process.env.PAINEL_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.PAINEL_TOKEN;
    else process.env.PAINEL_TOKEN = original;
  });

  function req(header?: string) {
    return new Request("http://localhost/api/painel/edicoes", {
      headers: header ? { authorization: header } : {},
    });
  }

  test("SEM token no ambiente nega tudo — fail-closed", async () => {
    delete process.env.PAINEL_TOKEN;
    const { painelAutorizado } = await io();
    expect(painelAutorizado(req("Bearer qualquer"))).toBe(false);
  });

  test("aceita o token certo e recusa o errado", async () => {
    process.env.PAINEL_TOKEN = "segredo-do-painel";
    const { painelAutorizado } = await io();
    expect(painelAutorizado(req("Bearer segredo-do-painel"))).toBe(true);
    expect(painelAutorizado(req("Bearer outro-segredo-aa"))).toBe(false);
  });

  test("recusa esquema errado, header ausente e token de tamanho diferente", async () => {
    process.env.PAINEL_TOKEN = "segredo-do-painel";
    const { painelAutorizado } = await io();
    expect(painelAutorizado(req("Basic segredo-do-painel"))).toBe(false);
    expect(painelAutorizado(req())).toBe(false);
    expect(painelAutorizado(req("Bearer curto"))).toBe(false);
  });
});
