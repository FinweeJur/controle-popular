import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { lerBarragens } from "../acervo.js";
import {
  formatarBarragens,
  listarBarragens,
  pesoEmergencia,
} from "../ferramentas/listar-barragens.js";
import { ErroDeEntrada } from "../resultado.js";

const bruto = JSON.parse(readFileSync(new URL("./fixtures/barragens.json", import.meta.url), "utf8"));
const barragens = lerBarragens(bruto);

describe("lerBarragens", () => {
  it("descarta item sem id ou sem nome", () => {
    expect(barragens).toHaveLength(4);
    expect(barragens.map((barragem) => barragem.id)).not.toContain("sem-nome");
  });

  it("normaliza a UF para maiúscula", () => {
    expect(barragens.every((barragem) => barragem.uf === barragem.uf.toUpperCase())).toBe(true);
  });
});

describe("pesoEmergencia", () => {
  it("ordena do risco maior para o menor", () => {
    expect(pesoEmergencia("Emergência Nivel 3")).toBeGreaterThan(pesoEmergencia("Emergência Nivel 2"));
    expect(pesoEmergencia("Emergência Nivel 2")).toBeGreaterThan(pesoEmergencia("Emergência Nivel 1"));
    expect(pesoEmergencia("Emergência Nivel 1")).toBeGreaterThan(pesoEmergencia("Nível de Alerta"));
    expect(pesoEmergencia("Nível de Alerta")).toBeGreaterThan(pesoEmergencia("Sem emergência"));
    expect(pesoEmergencia("valor desconhecido")).toBe(0);
  });
});

describe("listarBarragens", () => {
  it("sem filtro, traz tudo e põe a emergência maior primeiro", () => {
    const resultado = listarBarragens(barragens);
    expect(resultado.total).toBe(4);
    expect(resultado.totalNoAcervo).toBe(4);
    expect(resultado.itens.map((item) => item.id)).toEqual(["8955", "8389", "9000", "9100"]);
    expect(resultado.itens[0]?.nivelEmergencia).toBe("Emergência Nivel 3");
  });

  it("filtra por UF sem exigir caixa alta", () => {
    const resultado = listarBarragens(barragens, { uf: "mg" });
    expect(resultado.filtro.uf).toBe("MG");
    expect(resultado.total).toBe(3);
    expect(resultado.resumo.porUf).toEqual({ MG: 3 });
    expect(resultado.resumo.porNivelEmergencia).toMatchObject({
      "Emergência Nivel 3": 1,
      "Emergência Nivel 2": 1,
      "Nível de Alerta": 1,
    });
  });

  it("pagina e avisa que há mais", () => {
    const resultado = listarBarragens(barragens, { uf: "MG", limite: 2, deslocamento: 2 });
    expect(resultado.mostrando).toBe(1);
    expect(resultado.temMais).toBe(false);
    expect(resultado.itens[0]?.id).toBe("9000");
  });

  it("explica vazio com as UFs do acervo", () => {
    const resultado = listarBarragens(barragens, { uf: "XX" });
    expect(resultado.total).toBe(0);
    expect(resultado.mensagem).toContain("Nenhuma barragem");
    expect(resultado.ufsDisponiveis).toEqual(["MG", "PA"]);
  });

  it("recusa UF com formato errado e limite fora da faixa", () => {
    expect(() => listarBarragens(barragens, { uf: "MGG" })).toThrow(ErroDeEntrada);
    expect(() => listarBarragens(barragens, { limite: 21 })).toThrow(ErroDeEntrada);
  });

  it("usa o limite padrão de 20", () => {
    const resultado = listarBarragens(barragens, {});
    expect(resultado.filtro.limite).toBe(20);
  });

  it("produz texto legível com resumo e id SIGBM", () => {
    const texto = formatarBarragens(listarBarragens(barragens, { limite: 1 }));
    expect(texto).toContain("Nível de emergência —");
    expect(texto).toContain("id SIGBM: 8955");
    expect(texto).toContain("Empreendedor: ARCELORMITTAL BRASIL S.A.");
  });
});
