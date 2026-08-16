import { describe, expect, test } from "vitest";

import {
  coberturaComunicaBR,
  lacunaDaCategoria,
  lacunasDaUF,
  municipioComunicaBR,
  resumoDosMunicipios,
  serieTemNumero,
  tituloDaCategoria,
} from "./mg";

/**
 * Estes testes rodam sobre o ACERVO REAL (`public/data/comunicabr-31.json`,
 * 853 municípios, versionado no repositório) — de propósito.
 *
 * O que eles travam não é aritmética: é a afirmação editorial da tela. Dizer
 * "este tema não tem valor" é acusar alguém, e de quem é a falta depende de
 * uma contagem que só existe no arquivo inteiro. Uma amostra de cinco cidades
 * já produziu a conclusão errada duas vezes neste projeto (§N4 do plano), e é
 * ela que estes testes existem para não deixar voltar.
 *
 * Se o arquivo sumir, `coberturaComunicaBR()` devolve `null` e os testes
 * FALHAM em vez de passar vazios — teste cego que passa é pior que teste que
 * não roda, mesma regra de `scripts/rotas-reservadas.mts`.
 */

describe("o acervo de Minas é lido pelo codec, não percorrido na mão", () => {
  test("a leitura devolve as 853 cidades e a cobertura medida", async () => {
    const c = await coberturaComunicaBR();
    expect(c).not.toBeNull();
    expect(c!.municipiosComResposta).toBe(853);
    expect(c!.itens).toBe(174012);
    expect(c!.itensComValor).toBe(67566);
    expect(c!.itensVazios).toBe(106446);
    // 21 ministérios declarados como fonte: é a procedência que faz esta fonte
    // valer, e some inteira se alguém ler só o nível do subindicador.
    expect(c!.fontes.length).toBe(21);
  });

  /**
   * Travessia ingênua sobre o arquivo devolve ZERO itens — o formato é
   * compactado com rótulos internados. Este teste é a prova de que a tela
   * entrou pela porta certa: se alguém trocar `expandirArquivo()` por um
   * `municipios[].itens`, a cobertura cai para zero aqui antes de cair na tela.
   */
  test("uma cidade qualquer volta com os itens expandidos", async () => {
    const betim = await municipioComunicaBR("310670");
    expect(betim).not.toBeNull();
    expect(betim!.nomeIbge).toBe("Betim/MG");
    expect(betim!.cobertura.itens).toBe(204);
    expect(betim!.cobertura.itensComValor).toBe(105);
    expect(await municipioComunicaBR("3106200")).toBeNull(); // o IBGE de 7 dígitos não é a chave desta API
  });

  test("o resumo cobre as 853 e sai em ordem alfabética, sem o sufixo da UF", async () => {
    const r = await resumoDosMunicipios();
    expect(r.length).toBe(853);
    expect(r[0].nome).toBe("Abadia dos Dourados");
    expect(r.every((m) => !m.nome.includes("/"))).toBe(true);
  });
});

describe("as duas espécies de vazio — de quem é a lacuna", () => {
  /**
   * `governo-digital` vem com 7 itens por cidade e NENHUM valor nas 853. É
   * afirmação sobre o portal federal; escrevê-la como lacuna municipal
   * acusaria 853 prefeituras de algo que não é delas.
   */
  test("governo digital é lacuna da fonte na UF inteira", async () => {
    const l = await lacunaDaCategoria("governo-digital");
    expect(l).not.toBeNull();
    expect(l!.cidadesZeradas).toBe(853);
    expect(l!.cidades).toBe(853);
    expect(l!.especie).toBe("fonte-em-toda-uf");
  });

  /**
   * O espelho, e o mais importante: `mulheres` é a categoria com mais itens
   * vazios de Minas depois de educação (26.952) e MESMO ASSIM não zera em
   * cidade nenhuma — os valores estão nos `sub_items[]`. O docs da coleta
   * registra "mulheres zerada em todos os municípios testados" a partir de uma
   * amostra de 5 cidades lida só no primeiro nível; se alguém reintroduzir
   * aquela conclusão na tela, este teste cai.
   */
  test("mulheres tem muito item vazio e nenhuma cidade zerada", async () => {
    const l = await lacunaDaCategoria("mulheres");
    expect(l).not.toBeNull();
    expect(l!.itensVazios).toBeGreaterThan(20000);
    expect(l!.cidadesZeradas).toBe(0);
    expect(l!.especie).toBe("poucas-cidades");
  });

  test("categoria que a fonte lista sem nenhum item fica na espécie própria", async () => {
    const l = await lacunaDaCategoria("igualdade-racial");
    expect(l!.itens).toBe(0);
    expect(l!.especie).toBe("sem-item");
  });

  /**
   * A ordem é editorial, não estética: a primeira frase que o leitor lê é a
   * que ele leva, e a lacuna que é do governo federal precisa vir antes da que
   * é de uma cidade só. Todas as 17 categorias da fonte entram na lista —
   * nenhuma some por não ter buraco.
   */
  test("a lista traz todas as categorias, da lacuna mais estrutural para a mais local", async () => {
    const lacunas = await lacunasDaUF();
    expect(lacunas.length).toBe(17);
    const ordem = lacunas.map((l) => l.especie);
    expect(ordem[0]).toBe("sem-item");
    expect(ordem.lastIndexOf("fonte-em-toda-uf")).toBeLessThan(ordem.indexOf("fonte-na-maioria"));
    expect(ordem.lastIndexOf("fonte-na-maioria")).toBeLessThan(ordem.indexOf("poucas-cidades"));
  });
});

/**
 * A trava que impede o pior erro possível desta tela: republicar o
 * `valorBruto: 0` da API como se fosse uma medida de zero. `parDeValor()` anula
 * esse zero na leitura; aqui se confere que ele não voltou em NENHUM dos
 * 174.012 itens do acervo — porque basta um para a página dizer "R$ 0,00
 * repassado" onde o governo disse "não se aplica".
 */
test("nenhum item vazio do acervo carrega um número por baixo", async () => {
  const resumo = await resumoDosMunicipios();
  const municipios = await Promise.all(resumo.map((r) => municipioComunicaBR(r.codigo)));
  const vazioComNumero = municipios
    .flatMap((m) => m?.categorias.flatMap((c) => c.itens) ?? [])
    .filter((i) => i.valor === null && i.valorBruto !== null);
  expect(vazioComNumero).toEqual([]);
});

/**
 * O zero de preenchimento vaza por DOIS canos, e o segundo é a série.
 *
 * Em "Transferências aos entes federados", o item *Estados* vem sem valor e o
 * gráfico da mesma linha vem `2023: 0 · 2024: 0 · 2025: 0 · 2026: 0` — nas 853
 * cidades. Desenhar aquela linha seria afirmar "R$ 0,00 aos Estados" quatro
 * anos seguidos, com aparência de medição, exatamente onde a fonte se calou.
 */
describe("a série histórica não pode inventar zero", () => {
  test("a série de Estados de Betim é zero de ponta a ponta e não passa no filtro", async () => {
    const betim = (await municipioComunicaBR("310670"))!;
    const sub = betim.categorias
      .flatMap((c) => c.subindicadores)
      .find((s) => s.titulo.includes("entes federados"))!;
    const estados = sub.series.find((s) => s.nome === "Estados")!;

    expect(estados.pontos.length).toBe(4);
    expect(estados.pontos.every((p) => p.valor === 0)).toBe(true);
    expect(serieTemNumero(estados)).toBe(false);
    // A linha vizinha, essa sim, tem número — o filtro não pode derrubá-la.
    expect(serieTemNumero(sub.series.find((s) => s.nome === "Municípios")!)).toBe(true);
  });

  test("série com um único ponto não-zero continua valendo", () => {
    expect(
      serieTemNumero({
        nome: "t",
        monetario: false,
        pontos: [
          { ano: "2023", valor: 0 },
          { ano: "2024", valor: 3 },
        ],
      })
    ).toBe(true);
    expect(serieTemNumero({ nome: "t", monetario: false, pontos: [] })).toBe(false);
  });
});

test("categoria desconhecida ganha título legível em vez de sumir", () => {
  expect(tituloDaCategoria("saude")).toBe("Saúde");
  expect(tituloDaCategoria("tema-novo-do-governo")).toBe("Tema novo do governo");
});
