/**
 * @file sessao.test.ts
 * @description Testes da sessão pareada do companheiro: criação, pareamento
 * único, expiração por TTL e distribuição de eventos (o motor do SSE), tudo
 * sem rede — o relógio é injetado e o estado é limpo entre casos.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  criarSessao,
  parearSessao,
  obterSessao,
  inscreverSessao,
  publicarEvento,
  fecharSessao,
  contarSessoes,
  normalizarCodigo,
  TTL_SESSAO_MS,
  MAX_SESSOES,
  _resetarSessoes,
  type EventoSessao,
} from "./sessao";

beforeEach(() => {
  _resetarSessoes();
});

describe("normalizarCodigo", () => {
  it("aceita o código com minúsculas, espaço e sem hífen", () => {
    expect(normalizarCodigo(" abc-123 ")).toBe("ABC123");
    expect(normalizarCodigo("ABC123")).toBe("ABC123");
  });
});

describe("criarSessao", () => {
  it("devolve id, código e expiração", () => {
    const s = criarSessao({ agora: 1_000 });
    expect(s.id).toBeTruthy();
    expect(s.codigo).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    expect(s.expiraEm).toBe(1_000 + TTL_SESSAO_MS);
    expect(contarSessoes()).toBe(1);
  });

  it("respeita id e código injetados (teste determinístico)", () => {
    const s = criarSessao({ id: "abc", codigo: "ZZZ-999" });
    expect(s.id).toBe("abc");
    expect(s.codigo).toBe("ZZZ-999");
    expect(obterSessao("abc")?.pareada).toBe(false);
  });
});

describe("parearSessao", () => {
  it("pareia pelo código, ignorando caixa e separador", () => {
    const s = criarSessao({ codigo: "ABC-123" });
    const pareada = parearSessao("abc123");
    expect(pareada?.id).toBe(s.id);
    expect(pareada?.pareada).toBe(true);
    expect(pareada?.pareadaEm).toBeTypeOf("number");
  });

  it("recusa código inexistente", () => {
    criarSessao({ codigo: "ABC-123" });
    expect(parearSessao("ZZZ-999")).toBeNull();
  });

  it("recusa a segunda entrada (o companheiro entra uma vez)", () => {
    criarSessao({ codigo: "ABC-123" });
    expect(parearSessao("ABC-123")).not.toBeNull();
    expect(parearSessao("ABC-123")).toBeNull();
  });

  it("não pareia sessão expirada", () => {
    criarSessao({ id: "x", codigo: "ABC-123", agora: 0 });
    expect(parearSessao("ABC-123", TTL_SESSAO_MS + 1)).toBeNull();
    expect(contarSessoes()).toBe(0);
  });

  it("ainda pareia um instante antes do TTL", () => {
    criarSessao({ id: "x", codigo: "ABC-123", agora: 0 });
    expect(parearSessao("ABC-123", TTL_SESSAO_MS)).not.toBeNull();
  });
});

describe("expiração", () => {
  it("obterSessao devolve null e descarta depois do TTL", () => {
    criarSessao({ id: "x", agora: 0 });
    expect(obterSessao("x", TTL_SESSAO_MS)).not.toBeNull();
    expect(obterSessao("x", TTL_SESSAO_MS + 1)).toBeNull();
    expect(contarSessoes()).toBe(0);
  });

  it("cresce sem estourar o teto de sessões", () => {
    for (let i = 0; i < MAX_SESSOES + 20; i++) {
      criarSessao({ id: `s-${i}`, codigo: `A${String(i).padStart(5, "0")}` });
    }
    expect(contarSessoes()).toBeLessThanOrEqual(MAX_SESSOES);
  });
});

describe("eventos", () => {
  it("inscreve e recebe o evento publicado", () => {
    const s = criarSessao({ id: "x" });
    const recebidos: EventoSessao[] = [];
    const cancelar = inscreverSessao("x", (e) => recebidos.push(e));
    expect(cancelar).toBeTypeOf("function");

    publicarEvento("x", { tipo: "turno", em: 5, dados: { oi: true } });
    expect(recebidos).toHaveLength(1);
    expect(recebidos[0].tipo).toBe("turno");
    expect(recebidos[0].dados).toEqual({ oi: true });

    cancelar?.();
    publicarEvento("x", { tipo: "turno", em: 6 });
    expect(recebidos).toHaveLength(1);
    expect(s.id).toBe("x");
  });

  it("distribui o mesmo turno aos dois ouvintes (site e companheiro)", () => {
    criarSessao({ id: "x" });
    const site: EventoSessao[] = [];
    const bichinho: EventoSessao[] = [];
    inscreverSessao("x", (e) => site.push(e));
    inscreverSessao("x", (e) => bichinho.push(e));

    publicarEvento("x", { tipo: "turno", em: 7, dados: { resposta: "oi" } });

    expect(site.map((e) => e.tipo)).toEqual(["turno"]);
    expect(bichinho.map((e) => e.tipo)).toEqual(["turno"]);
    expect(site[0].dados).toEqual(bichinho[0].dados);
  });

  it("um ouvinte que falha não derruba o outro", () => {
    criarSessao({ id: "x" });
    const sobrevivente: EventoSessao[] = [];
    inscreverSessao("x", () => {
      throw new Error("stream morto");
    });
    inscreverSessao("x", (e) => sobrevivente.push(e));

    expect(() => publicarEvento("x", { tipo: "pareada", em: 1 })).not.toThrow();
    expect(sobrevivente).toHaveLength(1);
  });

  it("não inscreve em sessão inexistente", () => {
    expect(inscreverSessao("nao-existe", () => {})).toBeNull();
  });

  it("anuncia fechada e descarta a sessão", () => {
    criarSessao({ id: "x" });
    const recebidos: EventoSessao[] = [];
    inscreverSessao("x", (e) => recebidos.push(e));

    fecharSessao("x", 9);

    expect(recebidos.map((e) => e.tipo)).toEqual(["fechada"]);
    expect(obterSessao("x")).toBeNull();
    expect(contarSessoes()).toBe(0);
  });
});
