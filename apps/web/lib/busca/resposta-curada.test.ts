import { describe, expect, test } from "vitest";
import { buscarRespostaCurada } from "./resposta-curada";

describe("buscarRespostaCurada — respostas determinísticas para busca e sugestões", () => {
  test("encontra resposta para alertas de direitos do Congresso", () => {
    const res = buscarRespostaCurada("Quais projetos restringem direitos agora?", "congresso");
    expect(res).not.toBeNull();
    expect(res?.resposta).toContain("classifica as proposições federais");
    expect(res?.linkPrincipal?.href).toBe("/congresso/alertas");
  });

  test("encontra resposta para pauta da CCJC", () => {
    const res = buscarRespostaCurada("O que a CCJC tem na pauta?", "congresso");
    expect(res).not.toBeNull();
    expect(res?.linkPrincipal?.href).toBe("/congresso/comissoes");
  });

  test("encontra resposta para vacância e aposentadoria no STF", () => {
    const res = buscarRespostaCurada("Quais vagas abrem no STF até 2030?", "judiciario");
    expect(res).not.toBeNull();
    expect(res?.resposta).toContain("aposentadoria compulsória aos 75 anos");
    expect(res?.linkPrincipal?.href).toBe("/judiciario/vagas");
  });

  test("encontra resposta para quem fiscaliza a Justiça", () => {
    const res = buscarRespostaCurada("Quem fiscaliza a Justiça?", "judiciario");
    expect(res).not.toBeNull();
    expect(res?.resposta).toContain("termina no 2º grau");
    expect(res?.linkPrincipal?.href).toBe("/judiciario/instituicoes");
  });

  test("encontra resposta de despesas de saúde com prefixo de município", () => {
    const res = buscarRespostaCurada("Quanto a Prefeitura de Betim gasta em saúde?", "betim");
    expect(res).not.toBeNull();
    expect(res?.linkPrincipal?.href).toBe("/betim/prefeitura/despesas");
  });

  test("encontra resposta de contratos com prefixo de município", () => {
    const res = buscarRespostaCurada("Quais os maiores contratos da Prefeitura?", "bh");
    expect(res).not.toBeNull();
    expect(res?.linkPrincipal?.href).toBe("/bh/prefeitura/contratos");
  });

  test("encontra resposta para o Acordo de Mariana", () => {
    const res = buscarRespostaCurada("Onde ver o Acordo de Mariana?");
    expect(res).not.toBeNull();
    expect(res?.linkPrincipal?.href).toBe("/ambiental/mariana");
  });

  test("devolve null para strings irrelevantes ou muito curtas", () => {
    expect(buscarRespostaCurada("oi")).toBeNull();
    expect(buscarRespostaCurada("xyzabckjashd87213")).toBeNull();
  });
});
