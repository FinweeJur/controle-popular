/**
 * Testes da cadeia de reserva de banco (`lib/db/reserva.ts`).
 *
 * Só o que é puro e determinístico: a ORDEM e o FILTRO dos bancos de
 * reserva a partir das envs. A execução de `comBancoReserva` toca rede
 * (Neon/Guara) e não entra em teste unitário.
 */

import { afterEach, describe, expect, it } from "vitest";
import { bancosReserva } from "./reserva";

const ENVS = ["DATABASE_URL", "DATABASE_URL_NEON", "DATABASE_URL_HOMEPC", "DATABASE_URL_RESERVA"];
const original: Record<string, string | undefined> = {};
for (const k of ENVS) original[k] = process.env[k];

afterEach(() => {
  for (const k of ENVS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

describe("bancosReserva", () => {
  it("sem reservas configuradas, devolve lista vazia", () => {
    delete process.env.DATABASE_URL_NEON;
    delete process.env.DATABASE_URL_HOMEPC;
    delete process.env.DATABASE_URL_RESERVA;
    expect(bancosReserva()).toEqual([]);
  });

  it("ordena Neon (plano B) antes do home-pc (plano D)", () => {
    process.env.DATABASE_URL = "postgres://guara";
    process.env.DATABASE_URL_NEON = "postgres://neon";
    process.env.DATABASE_URL_HOMEPC = "postgres://homepc";
    const nomes = bancosReserva().map((b) => b.nome);
    expect(nomes).toEqual(["neon", "home-pc"]);
  });

  it("não repete o banco principal como reserva", () => {
    process.env.DATABASE_URL = "postgres://neon";
    process.env.DATABASE_URL_NEON = "postgres://neon";
    delete process.env.DATABASE_URL_HOMEPC;
    delete process.env.DATABASE_URL_RESERVA;
    expect(bancosReserva()).toEqual([]);
  });

  it("aceita DATABASE_URL_RESERVA como apelido do home-pc", () => {
    process.env.DATABASE_URL = "postgres://guara";
    delete process.env.DATABASE_URL_NEON;
    delete process.env.DATABASE_URL_HOMEPC;
    process.env.DATABASE_URL_RESERVA = "postgres://reserva";
    const nomes = bancosReserva().map((b) => b.nome);
    expect(nomes).toEqual(["home-pc"]);
  });
});
