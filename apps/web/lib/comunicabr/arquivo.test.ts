import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  type ArquivoComunicaBR,
  Dicionario,
  compactarMunicipio,
  expandirArquivo,
  expandirMunicipio,
  impressaoDoEsqueleto,
  medirCoberturaUF,
  montarEsqueleto,
} from "./arquivo";
import { type MunicipioComunicaBR, lerRespostaComunicaBR } from "./indicadores";

/**
 * Contrato do formato gravado. O que estes testes travam é uma coisa só, e é
 * a que pode estragar dado sem dar erro: **o arquivo tem de devolver
 * exatamente o que a API disse.**
 *
 * O formato é posicional e esparso — guarda só os itens COM valor, e os
 * rótulos uma vez só para a UF inteira. É o que faz Minas caber em ~2,7 MiB
 * em vez de 99 MiB. Também é o que faria o valor da saúde aparecer sob o
 * título da educação se a posição escorregasse, e com toda a cara de dado bom.
 * Daí o teste de ida-e-volta ser o primeiro deste arquivo.
 */

const BETIM_BRUTO = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "betim-310670.json"), "utf-8")
) as unknown;

function betim(): MunicipioComunicaBR {
  const r = lerRespostaComunicaBR(BETIM_BRUTO, 310670);
  if (!r.ok) throw new Error(`fixture de Betim deveria ser legível: ${r.detalhe}`);
  return r.municipio;
}

describe("ida-e-volta — o codec não pode perder nem trocar nada", () => {
  test("compactar e expandir devolve o mesmo município, campo a campo", () => {
    const m = betim();
    const dic = new Dicionario();
    const esq = montarEsqueleto(m, dic);
    const volta = expandirMunicipio(compactarMunicipio(m, 0, dic), esq, dic.rotulos);
    expect(volta).toEqual(m);
  });

  /**
   * Os 99 itens vazios de Betim NÃO são gravados — é justamente a economia do
   * formato. Eles têm de reaparecer na leitura, senão a lacuna some e a
   * cobertura passa a parecer completa, que é o erro que o item N4 existe
   * para não cometer.
   */
  test("o item sem valor não é gravado, e ainda assim volta como vazio", () => {
    const m = betim();
    const dic = new Dicionario();
    const compacto = compactarMunicipio(m, 0, dic);
    expect(compacto.v.length).toBe(105);
    const volta = expandirMunicipio(compacto, montarEsqueleto(m, dic), dic.rotulos);
    expect(volta.cobertura.itens).toBe(204);
    expect(volta.cobertura.itensVazios).toBe(99);
  });

  /**
   * Quatro das 21 siglas de ministério de Betim só existem no nível do item.
   * Se o esqueleto guardasse procedência só no subindicador, elas sumiriam —
   * e o portal atribuiria ao ministério errado um número que declara o seu.
   */
  test("as fontes só do nível do item sobrevivem ao codec", () => {
    const m = betim();
    const dic = new Dicionario();
    const volta = expandirMunicipio(compactarMunicipio(m, 0, dic), montarEsqueleto(m, dic), dic.rotulos);
    expect(volta.cobertura.fontes).toEqual(m.cobertura.fontes);
    expect(volta.cobertura.fontes).toContain("MDIC");
    expect(volta.cobertura.fontes).toContain("MPS");
  });

  test("a série histórica volta com ano e valor emparelhados", () => {
    const m = betim();
    const dic = new Dicionario();
    const volta = expandirMunicipio(compactarMunicipio(m, 0, dic), montarEsqueleto(m, dic), dic.rotulos);
    const serie = volta.categorias
      .find((c) => c.categoria === "saude")
      ?.subindicadores.find((s) => s.titulo === "Mais Médicos")?.series[0];
    expect(serie?.pontos).toEqual([
      { ano: "2023", valor: 40 },
      { ano: "2024", valor: 48 },
      { ano: "2025", valor: 54 },
      { ano: "2026", valor: 52 },
    ]);
  });
});

describe("a impressão do esqueleto é a trava contra desalinhamento", () => {
  test("mesma estrutura, valores diferentes: mesma impressão", () => {
    const m = betim();
    const outro: MunicipioComunicaBR = JSON.parse(JSON.stringify(m)) as MunicipioComunicaBR;
    outro.codigoIbge = 310620;
    outro.nomeIbge = "Belo Horizonte/MG";
    for (const c of outro.categorias) for (const s of c.subindicadores) for (const i of s.itens) i.valor = "999";
    expect(impressaoDoEsqueleto(outro)).toBe(impressaoDoEsqueleto(m));
  });

  /**
   * Estrutura diferente TEM de gerar impressão diferente — é o que faz o
   * coletor abrir um esqueleto novo em vez de encaixar o valor na posição
   * alheia. Três mudanças que o formato posicional não perdoa: título de
   * item, quantidade de itens e ano de série.
   */
  test("título, contagem e ano da série mudam a impressão", () => {
    const base = impressaoDoEsqueleto(betim());

    const tituloTrocado = betim();
    tituloTrocado.categorias[1].subindicadores[0].itens[0].titulo = "Outro título";
    expect(impressaoDoEsqueleto(tituloTrocado)).not.toBe(base);

    const itemAMenos = betim();
    itemAMenos.categorias[1].subindicadores[0].itens.pop();
    expect(impressaoDoEsqueleto(itemAMenos)).not.toBe(base);

    const anoAMenos = betim();
    const comSerie = anoAMenos.categorias
      .flatMap((c) => c.subindicadores)
      .find((s) => s.series.length > 0);
    comSerie?.series[0].pontos.pop();
    expect(impressaoDoEsqueleto(anoAMenos)).not.toBe(base);
  });
});

describe("arquivo inteiro", () => {
  function arquivoDeTeste(): ArquivoComunicaBR {
    const m = betim();
    const dic = new Dicionario();
    const esq = montarEsqueleto(m, dic);
    return {
      gerado_em: "2026-08-15T00:00:00.000Z",
      uf: 31,
      fonte: "https://comunicabr.presidencia.gov.br/api/v2/indicadores",
      ressalva: "",
      duracao_s: 1,
      rotulos: dic.rotulos,
      esqueletos: [esq],
      municipios: [compactarMunicipio(m, 0, dic)],
      recusados: [{ codigo: 3106200, nome: "Betim (7 dígitos)", motivo: "municipio_inexistente", detalhe: "" }],
    };
  }

  test("expandirArquivo devolve os municípios legíveis", () => {
    const municipios = expandirArquivo(arquivoDeTeste());
    expect(municipios.length).toBe(1);
    expect(municipios[0].nomeIbge).toBe("Betim/MG");
    expect(municipios[0].cobertura.itensComValor).toBe(105);
  });

  /** Esqueleto faltando descarta o município — nunca devolve item sem título. */
  test("município que aponta para esqueleto inexistente não vira lixo", () => {
    const arq = arquivoDeTeste();
    arq.municipios[0].esq = 7;
    expect(expandirArquivo(arq)).toEqual([]);
  });

  test("a cobertura da UF soma o que os municípios têm", () => {
    const municipios = expandirArquivo(arquivoDeTeste());
    const c = medirCoberturaUF(municipios, 853, 1);
    expect(c.municipiosPedidos).toBe(853);
    expect(c.municipiosComResposta).toBe(1);
    expect(c.municipiosRecusados).toBe(1);
    expect(c.itens).toBe(204);
    expect(c.itensComValor).toBe(105);
    expect(c.itensVazios).toBe(99);
    expect(c.vaziosPorCategoria["governo-digital"]).toBe(7);
    expect(c.itensPorCategoria["mulheres"]).toBe(44);
  });
});
