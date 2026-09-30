import { describe, expect, it } from "vitest";
import {
  concluir,
  enfileirar,
  idDaTarefa,
  podeRodar,
  proximaTarefa,
  reivindicar,
  resumoFila,
  type Fila,
} from "./fila";

const T = "2026-09-30T12:00:00.000Z";
const vazia = (): Fila => ({ geradoEm: T, tarefas: [] });

describe("fila distribuída", () => {
  it("id é determinístico — a mesma tarefa não vira duas", () => {
    const f = enfileirar(
      enfileirar(vazia(), "dado", "apps/web/data", T),
      "dado",
      "  APPS/WEB/DATA ",
      T
    );
    expect(f.tarefas).toHaveLength(1);
    expect(f.tarefas[0].id).toBe(idDaTarefa("dado", "apps/web/data"));
  });

  it("build/deploy/indice são exclusivos do home-pc", () => {
    expect(podeRodar("build", "home-pc")).toBe(true);
    expect(podeRodar("build", "desktop-fefpddp")).toBe(false);
    expect(podeRodar("indice", "desktop-fefpddp")).toBe(false);
    expect(podeRodar("dado", "desktop-fefpddp")).toBe(true);
  });

  it("a próxima tarefa pula o que a máquina não pode rodar", () => {
    let f = enfileirar(vazia(), "indice", "/busca", T);
    f = enfileirar(f, "dado", "bases", T);
    const prox = proximaTarefa(f, "desktop-fefpddp");
    expect(prox?.tipo).toBe("dado"); // pula "indice"
    expect(proximaTarefa(f, "home-pc")?.tipo).toBe("indice");
  });

  it("reivindicar não muta a original e só pega o que está livre", () => {
    const f = enfileirar(vazia(), "teste", "lib/fila", T);
    const id = f.tarefas[0].id;
    const g = reivindicar(f, id, "desktop-fefpddp", T);
    expect(f.tarefas[0].status).toBe("livre"); // original intacta
    expect(g.tarefas[0].status).toBe("em_curso");
    expect(g.tarefas[0].claimPor).toBe("desktop-fefpddp");
    // Reivindicar de novo não muda nada (já saiu de livre).
    expect(reivindicar(g, id, "home-pc", T).tarefas[0].claimPor).toBe("desktop-fefpddp");
  });

  it("não reivindica tarefa exclusiva do home-pc numa máquina que não é ele", () => {
    const f = enfileirar(vazia(), "deploy", "guara", T);
    const id = f.tarefas[0].id;
    const g = reivindicar(f, id, "desktop-fefpddp", T);
    expect(g.tarefas[0].status).toBe("livre");
  });

  it("concluir marca o resultado e o resumo conta certo", () => {
    let f = enfileirar(vazia(), "fonte", "ibama", T);
    f = enfileirar(f, "link", "tac", T);
    const [a, b] = f.tarefas.map((t) => t.id);
    f = reivindicar(f, a, "home-pc", T);
    f = concluir(f, a, "feita", "ok", T);
    f = reivindicar(f, b, "home-pc", T);
    const r = resumoFila(f);
    expect(r).toMatchObject({ feita: 1, em_curso: 1, livre: 0, total: 2 });
    expect(r.porMaquina["home-pc"]).toBe(1);
  });
});
