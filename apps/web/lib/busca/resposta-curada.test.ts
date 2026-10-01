import { describe, expect, test } from "vitest";
import { PERGUNTAS_ESPECIAIS, buscarRespostaCurada } from "./resposta-curada";

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

describe("buscarRespostaCurada — Fase 3 do plano de correção (01/10/2026)", () => {
  test("zona do contexto descarta resposta de outra fronteira (achado 22.1)", () => {
    // Em zona de Judiciário, a resposta de Congresso não serve.
    expect(
      buscarRespostaCurada("O que a CCJC tem na pauta?", "judiciario")?.linkPrincipal?.href
    ).not.toBe("/congresso/comissoes");

    // Na própria fronteira, segue servindo.
    expect(
      buscarRespostaCurada("O que a CCJC tem na pauta?", "congresso")?.linkPrincipal?.href
    ).toBe("/congresso/comissoes");

    // Município não desambigua fronteira: quem pergunta sobre a CCJC numa
    // página de cidade quer a resposta da CCJC.
    expect(
      buscarRespostaCurada("O que a CCJC tem na pauta?", "betim")?.linkPrincipal?.href
    ).toBe("/congresso/comissoes");
  });

  test("termo solto não recebe resposta curada (achado 22.2)", () => {
    // Os quatro casos medidos na revisão: cada um era pedaço de um padrão.
    for (const solto of ["rio", "vale", "agenda", "processos"]) {
      expect(buscarRespostaCurada(solto, "betim")).toBeNull();
    }
  });

  test("consulta que é só pedaço de um padrão não recebe a resposta dele (achado 22.2)", () => {
    // "restricao de" é fragmento de "restricao de direitos": só a direção
    // "a pergunta contém o padrão" casava — a inversa foi removida.
    expect(buscarRespostaCurada("restricao de", "congresso")?.linkPrincipal?.href).not.toBe(
      "/congresso/alertas"
    );
    // "aposentam ate" é fragmento de "aposentam ate 2030".
    expect(buscarRespostaCurada("aposentam ate", "judiciario")?.linkPrincipal?.href).not.toBe(
      "/judiciario/vagas"
    );
  });

  test("a direção correta segue casando depois da remoção (achado 22.2)", () => {
    expect(buscarRespostaCurada("Quem fiscaliza a Justiça?", "judiciario")?.linkPrincipal?.href).toBe(
      "/judiciario/instituicoes"
    );
    expect(
      buscarRespostaCurada("restricao de direitos", "congresso")?.linkPrincipal?.href
    ).toBe("/congresso/alertas");
  });

  test("nenhuma entrada traz cifra de acervo digitada na mão (achado 22.3)", () => {
    // §8: número na tela vem de constante medida com data. Aqui a constante
    // medida fica na página de destino — a prosa repete o número e envelhece.
    const dinheiro = /R\$\s?\d/;
    const contagem =
      /\b\d[\d.,]*\s*(milh|bilh|conselh|barragen|norma|relat[óo]rio|munic[íi]pio|mineradora|cidade|processo|licen[çc]a|reuni[ãa]o)/i;
    for (const esp of PERGUNTAS_ESPECIAIS) {
      const publicados = [
        esp.resposta,
        esp.linkPrincipal.texto,
        ...(esp.linksAdicionais?.map((l) => l.texto) ?? []),
      ];
      for (const texto of publicados) {
        const onde = `${esp.linkPrincipal.href} :: ${texto}`;
        expect(texto, `dinheiro em ${onde}`).not.toMatch(dinheiro);
        expect(texto, `contagem em ${onde}`).not.toMatch(contagem);
      }
    }
  });
});
