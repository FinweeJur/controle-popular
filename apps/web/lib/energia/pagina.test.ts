/**
 * Testes das funções puras da página `/energia`.
 *
 * O que trava aqui (número errado é dano num portal cívico):
 * - formatação pt-BR: mês, número, percentual, data e potência em GW;
 * - mês parcial: o ONS publica o mês corrente com os dias já apurados;
 * - agregação por fonte: média ponderada por horas e `SIN` sem duplicar os
 *   quatro subsistemas (somar os dois mentiria a geração do país);
 * - busca sem acento, filtro por tipo/fase e ordenação por potência;
 * - CSV: BOM UTF-8, separador `;`, uma linha por usina filtrada e decimal
 *   com vírgula — o formato que abre limpo no Excel brasileiro.
 *
 * Fixtures pequenas e sintéticas: o dado real tem garantias próprias em
 * `lib/ons/ons.test.ts` e `lib/energia/energia.test.ts`.
 */
import { describe, expect, it } from "vitest";

import type {
  RegistroBalanco,
  RegistroCarga,
  UsinaLinha,
} from "./pagina";
import {
  agregarGeracaoPorFonte,
  arredondar,
  cargaDoMes,
  csvDeUsinas,
  diasNoMes,
  filtrarUsinas,
  formatarDataAbnt,
  formatarDataIso,
  formatarMesCurto,
  formatarGeracaoGw,
  formatarMes,
  formatarMesLongo,
  formatarNumero,
  formatarPercentual,
  formatarPotenciaGw,
  mesParcial,
  mesParcialPorHoras,
  mesesDaSerie,
  nomeArquivoUsinas,
  normalizarBusca,
  ordenarUsinasPorPotencia,
  participacaoRenovavel,
  rotuloTipo,
  serieCargaMensal,
  somarPotenciaKw,
  ultimoMes,
} from "./pagina";

function carga(
  subsistema: string,
  mes: string,
  cargaMediaMWmed: number,
  dias = 30,
): RegistroCarga {
  return {
    subsistema,
    nome: subsistema,
    mes,
    cargaMediaMWmed,
    dias,
    fonte: "https://exemplo.invalido/carga.csv",
    coletadoEm: "2026-11-18T00:00:00Z",
  };
}

function balanco(
  mes: string,
  horas: number,
  geracao: { hidraulica: number; termica: number; eolica: number; solar: number },
  subsistema = "SIN",
): RegistroBalanco {
  const total = geracao.hidraulica + geracao.termica + geracao.eolica + geracao.solar;
  return {
    subsistema,
    nome: subsistema,
    mes,
    horas,
    geracaoMediaMW: { ...geracao, total },
    participacaoPercentual: {
      hidraulica: (geracao.hidraulica / total) * 100,
      termica: (geracao.termica / total) * 100,
      eolica: (geracao.eolica / total) * 100,
      solar: (geracao.solar / total) * 100,
    },
    cargaMediaMW: total,
    intercambioMedioMW: 0,
    fonte: "https://exemplo.invalido/balanco.csv",
    coletadoEm: "2026-11-18T00:00:00Z",
  };
}

function usina(
  nome: string,
  potenciaKw: number,
  tipo = "UHE",
  fase = "Operação",
  municipios = ["Belo Horizonte"],
): UsinaLinha {
  return {
    posicao: 1,
    ceg: `${tipo}.PH.MG.000001-0.1`,
    nome,
    tipo,
    fase,
    potenciaKw,
    municipios,
    outorga: "Concessão",
    entradaOperacao: "1980-04-24",
    fimVigencia: "2050-01-01",
    fonte: "https://dadosabertos.aneel.gov.br/dataset/siga",
  };
}

describe("energia/página: formatação pt-BR", () => {
  it("formata mês curto e longo", () => {
    expect(formatarMes("2026-11")).toBe("nov/2026");
    expect(formatarMes("2000-01")).toBe("jan/2000");
    expect(formatarMesCurto("2024-01")).toBe("jan/24");
    expect(formatarMesLongo("2026-03")).toBe("março de 2026");
  });

  it("não inventa mês quando a string está fora do padrão", () => {
    expect(formatarMes("2026-13")).toBe("2026-13");
    expect(formatarMes("")).toBe("");
    expect(formatarMesLongo("novembro")).toBe("novembro");
  });

  it("formata número, percentual e potência em GW", () => {
    expect(formatarNumero(1044)).toBe("1.044");
    expect(formatarNumero(46506.22)).toBe("46.506");
    expect(formatarPercentual(87.39)).toBe("87,4%");
    expect(formatarPercentual(100)).toBe("100,0%");
    expect(formatarPotenciaGw(27_686_905.9)).toBe("27,7 GW");
    expect(formatarGeracaoGw(46_506.22)).toBe("46,5");
  });

  it("arredonda sem ruído de ponto flutuante", () => {
    expect(arredondar(58.269999999, 1)).toBe(58.3);
    expect(arredondar(0.05, 1)).toBe(0.1);
    expect(Number.isNaN(arredondar(Number.NaN))).toBe(false);
  });

  it("formata data ISO e trata ausência como travessão", () => {
    expect(formatarDataIso("1980-04-24")).toBe("24/04/1980");
    expect(formatarDataIso(null)).toBe("—");
    expect(formatarDataIso(undefined)).toBe("—");
    expect(formatarDataAbnt("2026-11-18T22:50:24Z")).toBe("18 nov. 2026");
    expect(formatarDataAbnt(null)).toBe("—");
  });
});

describe("energia/página: calendário e mês parcial", () => {
  it("conhece o número de dias do mês, inclusive fevereiro bissexto", () => {
    expect(diasNoMes("2024-02")).toBe(29);
    expect(diasNoMes("2026-02")).toBe(28);
    expect(diasNoMes("2026-11")).toBe(30);
    expect(diasNoMes("2026-12")).toBe(31);
    expect(diasNoMes("2026-13")).toBe(0);
  });

  it("marca como parcial o mês com menos dias que o calendário", () => {
    expect(mesParcial({ mes: "2026-11", dias: 17 })).toBe(true);
    expect(mesParcial({ mes: "2026-10", dias: 31 })).toBe(false);
    expect(mesParcial({ mes: "2026-02", dias: 28 })).toBe(false);
  });

  it("detecta mês parcial pelas horas do balanço", () => {
    expect(mesParcialPorHoras({ mes: "2026-11", horas: 408 })).toBe(true);
    expect(mesParcialPorHoras({ mes: "2026-10", horas: 744 })).toBe(false);
    expect(mesParcialPorHoras({ mes: "2026-09", horas: 720 })).toBe(false);
  });
});

describe("energia/página: séries do ONS", () => {
  const registros: RegistroCarga[] = [
    carga("SE", "2026-09", 45000, 30),
    carga("SE", "2026-10", 46000, 31),
    carga("SE", "2026-11", 46506.22, 17),
    carga("S", "2026-11", 14385.86, 17),
  ];

  it("lista meses únicos em ordem e acha o último", () => {
    expect(mesesDaSerie(registros)).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(ultimoMes(registros)).toBe("2026-11");
    expect(ultimoMes([])).toBeNull();
  });

  it("acha a carga de um subsistema num mês e devolve null quando falta", () => {
    expect(cargaDoMes(registros, "2026-11", "SE")?.cargaMediaMWmed).toBe(46506.22);
    expect(cargaDoMes(registros, "2026-08", "SE")).toBeNull();
  });

  it("monta a janela de meses com os quatro subsistemas e null onde falta", () => {
    const { meses, series } = serieCargaMensal(registros, 2);
    expect(meses).toEqual(["2026-10", "2026-11"]);
    expect(series).toHaveLength(4);
    const se = series.find((s) => s.codigo === "SE");
    const sul = series.find((s) => s.codigo === "S");
    expect(se?.pontos).toEqual([46000, 46506.22]);
    expect(sul?.pontos).toEqual([null, 14385.86]);
  });

  it("devolve janela nunca menor que um mês", () => {
    expect(serieCargaMensal(registros, 0).meses).toEqual(["2026-11"]);
  });
});

describe("energia/página: geração por fonte", () => {
  const registros: RegistroBalanco[] = [
    // Dois meses com horas diferentes: a média tem de ponderar.
    balanco("2026-10", 744, { hidraulica: 600, termica: 100, eolica: 150, solar: 150 }),
    balanco("2026-11", 720, { hidraulica: 800, termica: 200, eolica: 400, solar: 600 }),
    // Linha dos subsistemas: se entrar na conta, duplica a geração.
    balanco("2026-10", 744, { hidraulica: 30, termica: 30, eolica: 20, solar: 20 }, "SE"),
  ];

  it("soma hidráulica, eólica e solar como renovável", () => {
    expect(participacaoRenovavel(registros[0])).toBe(90);
  });

  it("pondera a participação pelas horas dos meses", () => {
    const fatias = agregarGeracaoPorFonte(registros, "2026-10", "2026-11");
    const total = fatias.reduce((soma, f) => soma + f.percentual, 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(0.11);
    // Sem ponderação, a hidráulica daria 50% (média simples de 60% e 40%).
    const hidraulica = fatias.find((f) => f.fonte === "hidraulica");
    expect(hidraulica?.percentual).toBe(46.8);
    expect(fatias[0].percentual).toBeGreaterThanOrEqual(fatias[1].percentual);
  });

  it("troca o subsistema sem misturar com o agregado SIN", () => {
    const se = agregarGeracaoPorFonte(registros, "2026-10", "2026-10", "SE");
    expect(se).toHaveLength(4);
    const soma = se.reduce((s, f) => s + f.percentual, 0);
    expect(Math.abs(soma - 100)).toBeLessThanOrEqual(0.11);
  });

  it("devolve lista vazia quando a janela não tem registro", () => {
    expect(agregarGeracaoPorFonte(registros, "1999-01", "1999-12")).toEqual([]);
  });
});

describe("energia/página: tabela de usinas", () => {
  const lista: UsinaLinha[] = [
    usina("Itumbiara", 2_082_000, "UHE", "Operação", ["Araporã", "Itumbiara"]),
    usina("Água Vermelha", 1_396_200, "UHE", "Operação", ["Iturama"]),
    usina("Icém Solar", 30_000, "UFV", "Operação", ["Icém"]),
    usina("Obra Nova", 50_000, "UFV", "Construção não iniciada", ["Uberlândia"]),
  ];

  it("normaliza busca sem acento e sem caixa", () => {
    expect(normalizarBusca("  Água   Vermelha ")).toBe("agua vermelha");
    expect(normalizarBusca("Itumbiara")).toBe("itumbiara");
  });

  it("busca por nome e por município sem acento", () => {
    expect(filtrarUsinas(lista, { busca: "agua vermelha" })).toHaveLength(1);
    expect(filtrarUsinas(lista, { busca: "icem" })[0].nome).toBe("Icém Solar");
    expect(filtrarUsinas(lista, { busca: "ICÉM" })[0].nome).toBe("Icém Solar");
  });

  it("aplica tipo e fase junto com a busca", () => {
    expect(filtrarUsinas(lista, { tipo: "UFV" })).toHaveLength(2);
    expect(filtrarUsinas(lista, { tipo: "UFV", fase: "Operação" })).toHaveLength(1);
    expect(filtrarUsinas(lista, { tipo: "UHE", fase: "Construção não iniciada" })).toHaveLength(0);
  });

  it("busca vazia devolve tudo e busca sem resultado devolve vazio", () => {
    expect(filtrarUsinas(lista)).toHaveLength(4);
    expect(filtrarUsinas(lista, { busca: "   " })).toHaveLength(4);
    expect(filtrarUsinas(lista, { busca: "inexistente" })).toHaveLength(0);
  });

  it("ordena por potência nos dois sentidos, sem mutar a entrada", () => {
    const ordemOriginal = lista.map((u) => u.nome);
    const desc = ordenarUsinasPorPotencia(lista, "desc");
    const asc = ordenarUsinasPorPotencia(lista, "asc");
    expect(desc[0].nome).toBe("Itumbiara");
    expect(asc[0].nome).toBe("Icém Solar");
    expect(lista.map((u) => u.nome)).toEqual(ordemOriginal);
    expect(somarPotenciaKw(lista)).toBe(3_558_200);
  });

  it("dá nome legível ao tipo e nome de arquivo ao filtro", () => {
    expect(rotuloTipo("UHE")).toContain("Hidrelétrica");
    expect(rotuloTipo("XYZ")).toBe("XYZ");
    expect(nomeArquivoUsinas()).toBe("usinas-mg.csv");
    expect(nomeArquivoUsinas({ tipo: "UFV", fase: "Construção não iniciada" })).toBe(
      "usinas-mg-ufv-construcao-nao-iniciada.csv",
    );
  });
});

describe("energia/página: CSV", () => {
  const lista: UsinaLinha[] = [
    usina("Itumbiara", 2_082_000, "UHE", "Operação", ["Araporã", "Itumbiara"]),
    { ...usina('Usina "A"; B', 1_000, "PCH"), municipios: ["São João; Del-Rei"] },
  ];

  it("começa com BOM UTF-8 e usa ';' no cabeçalho", () => {
    const csv = csvDeUsinas(lista);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Posição;Usina;CEG;Tipo;Fase");
  });

  it("tem uma linha por usina mais o cabeçalho, com CRLF", () => {
    const csv = csvDeUsinas(lista);
    const linhas = csv.replace("\uFEFF", "").split("\r\n").filter(Boolean);
    expect(linhas).toHaveLength(lista.length + 1);
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("escreve decimal com vírgula e escapa aspas e ponto e vírgula", () => {
    const csv = csvDeUsinas(lista);
    expect(csv).toContain("2082000;2082,0");
    expect(csv).toContain('"Usina ""A""; B"');
    expect(csv).toContain('"São João; Del-Rei"');
  });

  it("exporta apenas o que recebeu", () => {
    const csv = csvDeUsinas([lista[1]]);
    expect(csv).not.toContain("Itumbiara;");
    expect(csv.replace("\uFEFF", "").split("\r\n").filter(Boolean)).toHaveLength(2);
  });
});
