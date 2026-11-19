/**
 * Testes dos dados abertos do ONS usados na fase 1 do eixo de energia.
 *
 * O que é
 * -------
 * Confere o que os coletores (`scripts/coletar-ons-catalogo.py` e
 * `scripts/coletar-ons-energia.py`) gravam em `apps/web/data/ons/`: o catálogo
 * dos 88 conjuntos do portal CKAN e as três séries mensais — carga, balanço
 * por fonte e energia armazenada (EAR).
 *
 * Por que existe
 * --------------
 * Número errado é dano num portal cívico. Estes testes travam as garantias
 * mínimas do dado publicado:
 * - o catálogo cobre o portal inteiro e não repete conjunto;
 * - a série está em ordem cronológica (gráfico com mês fora de ordem mente);
 * - EAR fica entre 0 e 100% (percentual fora disso é erro de unidade);
 * - toda linha tem `fonte` e `coletadoEm` (número sem rastro não é auditável);
 * - cada JSON fica abaixo de 1 MB, porque coleção grande como prop de
 *   componente de cliente estoura o payload (regra dura 5.1).
 *
 * Fonte oficial: https://dados.ons.org.br/ (CKAN), licença CC-BY.
 * Os arquivos brutos (CSV/XLSX/PARQUET) não são versionados — só o JSON
 * mensal agregado.
 */
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** Pasta onde os coletores gravam o JSON agregado. */
const DADOS = fileURLToPath(new URL("../../data/ons/", import.meta.url));

/** Teto por arquivo, em bytes: 1 MB. Acima disso, paginação no servidor. */
const TETO_BYTES = 1024 * 1024;

interface ItemCatalogo {
  nome: string;
  titulo: string;
  resumo: string;
  url: string;
  recursos: number;
  formatos: string[];
  atualizadoEm: string;
  licenca: { id: string; titulo: string; url: string };
  grupos: string[];
  tamanhoBytes: number;
  tamanhoCsvBytes: number;
}

interface Catalogo {
  fonte: string;
  coletadoEm: string;
  total: number;
  itens: ItemCatalogo[];
}

interface RegistroBase {
  subsistema: string;
  nome: string;
  mes: string;
  fonte: string;
  coletadoEm: string;
}

interface RegistroCarga extends RegistroBase {
  cargaMediaMWmed: number;
  dias: number;
}

interface RegistroBalanco extends RegistroBase {
  horas: number;
  geracaoMediaMW: {
    hidraulica: number;
    termica: number;
    eolica: number;
    solar: number;
    total: number;
  };
  participacaoPercentual: {
    hidraulica: number;
    termica: number;
    eolica: number;
    solar: number;
  };
  cargaMediaMW: number;
  intercambioMedioMW: number;
}

interface RegistroEar extends RegistroBase {
  earPercentualMedio: number;
  earPercentualMinimo: number;
  earPercentualMaximo: number;
  earMWmesMedio: number;
  dias: number;
}

interface Serie<T> {
  fonte: string;
  coletadoEm: string;
  unidade: string;
  janela: { inicio: string; fim: string };
  totalRegistros: number;
  bruto: { arquivos: number; bytes: number };
  registros: T[];
}

/** Lê e desserializa um JSON de `data/ons/`. */
function lerJson<T>(arquivo: string): T {
  return JSON.parse(readFileSync(`${DADOS}${arquivo}`, "utf-8")) as T;
}

/**
 * Confere o que vale para toda série: arquivo pequeno, não vazio, cronologia
 * crescente dentro de cada subsistema e rastro de origem em toda linha.
 */
function conferirSerie<T extends RegistroBase>(arquivo: string, registros: T[]): void {
  const tamanho = statSync(`${DADOS}${arquivo}`).size;
  // §5.1: coleção acima de ~2 mil linhas não vai como prop de cliente. Aqui o
  // teto de 1 MB é a primeira barreira; o recorte mensal é a segunda.
  expect(tamanho, `${arquivo} passou de 1 MB`).toBeLessThan(TETO_BYTES);
  expect(registros.length).toBeGreaterThan(0);

  const porSubsistema = new Map<string, string[]>();
  for (const registro of registros) {
    expect(registro.mes, `${arquivo}: mês fora do formato AAAA-MM`).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(registro.fonte, `${arquivo}: linha sem fonte`).toMatch(/^https:\/\//);
    expect(registro.coletadoEm, `${arquivo}: linha sem coletadoEm`).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const meses = porSubsistema.get(registro.subsistema) ?? [];
    meses.push(registro.mes);
    porSubsistema.set(registro.subsistema, meses);
  }

  // Dentro de cada subsistema, a série tem de subir. Mês repetido também é
  // erro: significa agregação duplicada de uma rodada anterior.
  for (const [subsistema, meses] of porSubsistema) {
    const ordenados = [...meses].sort();
    expect(meses, `série ${subsistema} de ${arquivo} fora de ordem ou duplicada`).toEqual(ordenados);
    expect(new Set(meses).size, `série ${subsistema} de ${arquivo} tem mês repetido`).toBe(meses.length);
  }
}

describe("catálogo do ONS", () => {
  const catalogo = lerJson<Catalogo>("catalogo.json");

  it("cobre os 88 conjuntos publicados no portal", () => {
    expect(catalogo.total).toBe(88);
    expect(catalogo.itens).toHaveLength(88);
    expect(catalogo.fonte).toBe("https://dados.ons.org.br/");
  });

  it("não repete conjunto e todo item tem chave e título", () => {
    const nomes = catalogo.itens.map((i) => i.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const item of catalogo.itens) {
      expect(item.nome).toMatch(/^[a-z0-9][a-z0-9_-]*$/);
      expect(item.titulo.length).toBeGreaterThan(0);
      expect(item.recursos).toBeGreaterThan(0);
    }
  });

  it("declara formato, licença CC-BY e data de atualização em todo item", () => {
    for (const item of catalogo.itens) {
      expect(item.formatos.length, `${item.nome} sem formato`).toBeGreaterThan(0);
      expect(item.licenca.id, `${item.nome} sem licença`).toBe("cc-by");
      expect(item.atualizadoEm, `${item.nome} sem atualizadoEm`).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it("traz os três conjuntos da fase 1", () => {
    const nomes = new Set(catalogo.itens.map((i) => i.nome));
    for (const nome of ["carga-energia", "balanco-energia-subsistema", "ear-diario-por-subsistema"]) {
      expect(nomes.has(nome), `catálogo sem ${nome}`).toBe(true);
    }
  });

  it("mede o peso do CSV de cada conjunto e aponta o link oficial", () => {
    for (const item of catalogo.itens) {
      expect(item.url).toBe(`https://dados.ons.org.br/dataset/${item.nome}`);
      expect(item.tamanhoCsvBytes).toBeGreaterThanOrEqual(0);
      // O CSV nunca é maior que a soma de todas as versões do conjunto.
      expect(item.tamanhoCsvBytes).toBeLessThanOrEqual(item.tamanhoBytes);
    }
  });
});

describe("energia: carga mensal por subsistema", () => {
  const serie = lerJson<Serie<RegistroCarga>>("energia-carga.json");

  it("tem registros e metadado coerente", () => {
    expect(serie.totalRegistros).toBe(serie.registros.length);
    expect(serie.janela.inicio < serie.janela.fim).toBe(true);
    expect(serie.bruto.arquivos).toBeGreaterThan(0);
  });

  it("passa nas regras comuns das séries", () => {
    conferirSerie("energia-carga.json", serie.registros);
  });

  it("cobre os quatro subsistemas com carga positiva", () => {
    const subsistemas = new Set(serie.registros.map((r) => r.subsistema));
    expect([...subsistemas].sort()).toEqual(["N", "NE", "S", "SE"]);
    for (const registro of serie.registros) {
      expect(registro.cargaMediaMWmed).toBeGreaterThan(0);
      expect(registro.dias).toBeGreaterThan(0);
      expect(registro.dias).toBeLessThanOrEqual(31);
    }
  });
});

describe("energia: balanço mensal por fonte", () => {
  const serie = lerJson<Serie<RegistroBalanco>>("energia-balanco.json");

  it("tem registros e metadado coerente", () => {
    expect(serie.totalRegistros).toBe(serie.registros.length);
    expect(serie.janela.inicio < serie.janela.fim).toBe(true);
    expect(serie.bruto.arquivos).toBeGreaterThan(0);
  });

  it("passa nas regras comuns das séries", () => {
    conferirSerie("energia-balanco.json", serie.registros);
  });

  it("a participação das quatro fontes soma 100%", () => {
    for (const registro of serie.registros) {
      const { hidraulica, termica, eolica, solar } = registro.participacaoPercentual;
      // Arredondamento de cada fatia pode custar até 0,02 ponto na soma.
      expect(Math.abs(hidraulica + termica + eolica + solar - 100)).toBeLessThan(0.1);
      for (const fatia of [hidraulica, termica, eolica, solar]) {
        expect(fatia).toBeGreaterThanOrEqual(0);
        expect(fatia).toBeLessThanOrEqual(100);
      }
    }
  });

  it("traz os quatro subsistemas operativos e o agregado SIN", () => {
    // O balanço publica também a linha do Sistema Interligado Nacional, que
    // soma os quatro. Ela não é um quinto subsistema: é conferência.
    const subsistemas = new Set(serie.registros.map((r) => r.subsistema));
    expect([...subsistemas].sort()).toEqual(["N", "NE", "S", "SE", "SIN"]);
  });

  it("geração total é a soma das fontes e não é negativa", () => {
    for (const registro of serie.registros) {
      const g = registro.geracaoMediaMW;
      expect(g.total).toBeGreaterThan(0);
      expect(Math.abs(g.hidraulica + g.termica + g.eolica + g.solar - g.total)).toBeLessThan(0.1);
      expect(registro.horas).toBeGreaterThan(0);
    }
  });
});

describe("energia: EAR mensal por subsistema", () => {
  const serie = lerJson<Serie<RegistroEar>>("energia-ear.json");

  it("tem registros e metadado coerente", () => {
    expect(serie.totalRegistros).toBe(serie.registros.length);
    expect(serie.janela.inicio < serie.janela.fim).toBe(true);
    expect(serie.bruto.arquivos).toBeGreaterThan(0);
  });

  it("passa nas regras comuns das séries", () => {
    conferirSerie("energia-ear.json", serie.registros);
  });

  it("percentual de EAR fica na escala de 0 a 100", () => {
    // O número oficial é % do máximo do subsistema. Ele passa de 100 em
    // alguns meses porque o máximo de referência foi corrigido depois; por
    // isso a régua tem 5 pontos de tolerância. Multiplicar ou dividir por
    // 100 (erro de unidade) cai fora na hora, que é o que o teste quer pegar.
    for (const registro of serie.registros) {
      expect(registro.earPercentualMedio).toBeGreaterThanOrEqual(0);
      expect(registro.earPercentualMedio).toBeLessThanOrEqual(105);
      expect(registro.earPercentualMinimo).toBeGreaterThanOrEqual(0);
      expect(registro.earPercentualMaximo).toBeLessThanOrEqual(105);
      // Min ≤ média ≤ máx: se inverter, a agregação trocou de coluna.
      expect(registro.earPercentualMinimo).toBeLessThanOrEqual(registro.earPercentualMedio);
      expect(registro.earPercentualMedio).toBeLessThanOrEqual(registro.earPercentualMaximo);
    }
  });

  it("acima de 100% é anomalia da fonte, não regra: poucos meses no Norte", () => {
    // Medido em 18/11/2026: 6 registros passam de 100%, todos do Norte, em
    // 2000 e 2010/2011, com teto de 103,66%. Se um dia a série inteira
    // passar de 100, houve troca de unidade ou de base de cálculo.
    const acima = serie.registros.filter((r) => r.earPercentualMaximo > 100);
    expect(acima.length).toBeLessThanOrEqual(12);
    for (const registro of acima) {
      expect(registro.subsistema).toBe("N");
      expect(registro.earPercentualMaximo).toBeLessThan(104);
    }
  });

  it("o SE/CO — subsistema de destaque — está na série", () => {
    const seCo = serie.registros.filter((r) => r.subsistema === "SE");
    expect(seCo.length).toBeGreaterThan(12 * 20);
    expect(seCo.some((r) => r.earPercentualMedio > 0)).toBe(true);
  });
});

describe("todo JSON do ONS fica abaixo de 1 MB", () => {
  it.each([
    "catalogo.json",
    "energia-carga.json",
    "energia-balanco.json",
    "energia-ear.json",
  ])("%s", (arquivo) => {
    expect(statSync(`${DADOS}${arquivo}`).size).toBeLessThan(TETO_BYTES);
  });
});
