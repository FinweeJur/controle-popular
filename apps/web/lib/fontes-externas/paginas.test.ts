import { describe, expect, test } from "vitest";

import atosJson from "@/data/querido-diario/atos.json";
import fornecedoresJson from "@/data/fornecedores/enriquecido.json";

import {
  atosDaCidade,
  atosParaCsv,
  diarioDaCidade,
  filtrarAtos,
  filtrarFornecedores,
  fornecedoresParaCsv,
  linhasDeAtos,
  listarSituacoes,
  resumoDiarios,
  resumoFornecedores,
  rotuloTipo,
  type AtoNaLista,
  type DadosDiarios,
  type DadosFornecedores,
} from "./paginas";

/**
 * Teste das regras puras das páginas `/querido-diario` e `/fornecedores`.
 *
 * POR QUE ELE LÊ O JSON REAL
 *
 * Contagem e CSV são o que o leitor vê e o que ele baixa. Testar com fixture
 * inventada provaria que a função soma, não que os cartões da página fecham
 * com o arquivo publicado. Os números 22 / 750 / 6 e 17 são medidos do próprio
 * dado — se o coletor mudar a amostra, este teste avisa em vez de a página
 * mentir um total velho.
 *
 * O que NÃO é testado aqui: se "menção a decreto" é decreto publicado. Essa
 * ressalva é do método (`metodo.classificacao` no JSON) e aparece na tela.
 */

const dadosAtos = atosJson as unknown as DadosDiarios;
const dadosFornecedores = fornecedoresJson as unknown as DadosFornecedores;

const ONZE_DIGITOS = /(?<![\d.])\d{11}(?![\d])/g;

describe("diários municipais — contagem e lista", () => {
  test("o resumo bate com o arquivo: 3 cidades, 6 diários, 22 linhas, 750 menções", () => {
    const resumo = resumoDiarios(dadosAtos);
    expect(resumo.cidades).toBe(3);
    expect(resumo.diarios).toBe(6);
    expect(resumo.atos).toBe(22);
    expect(resumo.ocorrencias).toBe(750);
    expect(resumo.semCobertura).toBe(2);
    expect(resumo.janela).toEqual({ de: "2026-11-10", ate: "2026-11-16" });
    expect(resumo.tipos).toEqual(["decreto", "portaria", "licitacao", "nomeacao"]);
  });

  test("a lista achatada traz cidade, UF e ordem de data decrescente", () => {
    const linhas = linhasDeAtos(dadosAtos);
    expect(linhas).toHaveLength(22);
    expect(new Set(linhas.map((l) => l.cidade))).toEqual(
      new Set(["Betim", "Contagem", "Uberaba"])
    );
    for (const linha of linhas) {
      expect(linha.uf).toBe("MG");
      expect(linha.ibge).toMatch(/^\d{7}$/);
      expect(linha.link).toMatch(/^https:\/\//);
    }
    for (let i = 1; i < linhas.length; i++) {
      expect(linhas[i - 1].data >= linhas[i].data).toBe(true);
    }
  });

  test("filtra por cidade e por tipo sem perder linha", () => {
    const linhas = linhasDeAtos(dadosAtos);
    expect(filtrarAtos(linhas, { cidade: "Betim" })).toHaveLength(6);
    expect(filtrarAtos(linhas, { tipo: "decreto" })).toHaveLength(6);
    expect(filtrarAtos(linhas, { tipo: "licitacao" })).toHaveLength(5);
    expect(filtrarAtos(linhas, { cidade: "Betim", tipo: "portaria" })).toHaveLength(2);
    expect(filtrarAtos(linhas, { cidade: "Mariana" })).toHaveLength(0);
  });

  test("a busca ignora acento e caixa e varre o trecho", () => {
    const linhas = linhasDeAtos(dadosAtos);
    const achadas = filtrarAtos(linhas, { busca: "licitacao" });
    expect(achadas.length).toBeGreaterThanOrEqual(5);
    for (const linha of achadas) {
      const texto = [linha.tipo, rotuloTipo(linha.tipo), linha.trecho]
        .join(" ")
        .normalize("NFD");
      expect(texto.toLowerCase()).toContain("licita");
    }
    expect(filtrarAtos(linhas, { busca: "  " })).toHaveLength(22);
    expect(filtrarAtos(linhas, { busca: "termo que não existe" })).toHaveLength(0);
  });

  test("rótulo do termo não inventa categoria", () => {
    expect(rotuloTipo("decreto")).toBe("Decreto");
    expect(rotuloTipo("nomeacao")).toBe("Nomeação");
    expect(rotuloTipo("despacho")).toBe("Despacho");
  });

  test("a cidade do hub é encontrada por IBGE, não por nome", () => {
    expect(diarioDaCidade(dadosAtos, "3106705")?.nome).toBe("Betim");
    expect(diarioDaCidade(dadosAtos, "3118601")?.nome).toBe("Contagem");
    expect(diarioDaCidade(dadosAtos, "3170107")?.nome).toBe("Uberaba");
    expect(diarioDaCidade(dadosAtos, "3140001")).toBeUndefined(); // Mariana
    expect(diarioDaCidade(dadosAtos, "betim")).toBeUndefined();
  });

  test("os últimos atos da cidade vêm em data decrescente e respeitam o limite", () => {
    const betim = diarioDaCidade(dadosAtos, "3106705");
    expect(betim).toBeDefined();
    const atos = atosDaCidade(betim!, 4);
    expect(atos).toHaveLength(4);
    for (let i = 1; i < atos.length; i++) {
      expect(atos[i - 1].data >= atos[i].data).toBe(true);
    }
    expect(atosDaCidade(betim!)).toHaveLength(6);
  });
});

describe("diários municipais — CSV", () => {
  test("sai com BOM, separador `;` e uma linha por ato filtrado", () => {
    const linhas = filtrarAtos(linhasDeAtos(dadosAtos), { tipo: "licitacao" });
    const csv = atosParaCsv(linhas);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const corpo = csv.slice(1).split("\n");
    expect(corpo).toHaveLength(linhas.length + 1);
    expect(corpo[0]).toBe(
      "cidade;uf;data;tipo;ocorrencias;edicao;trecho;link_diario"
    );
    for (const linha of corpo.slice(1)) {
      // O trecho é a única coluna que pode conter `;`; por isso a contagem de
      // campos crus não é confiável — o link e o tipo nunca têm separador.
      expect(linha).toContain("Licitação;");
      expect(linha).toContain(";MG;");
    }
  });

  test("campo com `;`, aspas e quebra de linha é cercado e escapado", () => {
    const linha: AtoNaLista = {
      tipo: "decreto",
      termo: "decreto",
      data: "2026-11-10",
      edicao: "1",
      extra: false,
      ocorrencias: 1,
      trecho: 'texto; com "aspas"\ne linha',
      link: "https://exemplo.test/diario.pdf",
      fonte: "Querido Diário",
      coletadoEm: "2026-11-18T00:00:00+00:00",
      cidade: "Betim",
      uf: "MG",
      ibge: "3106705",
    };
    const csv = atosParaCsv([linha]);
    expect(csv).toContain('"texto; com ""aspas""\ne linha"');
  });

  test("não vaza sequência de 11 dígitos", () => {
    const csv = atosParaCsv(linhasDeAtos(dadosAtos));
    expect(csv.match(ONZE_DIGITOS) ?? []).toEqual([]);
  });
});

describe("fornecedores — contagem e filtro", () => {
  test("o resumo bate com o arquivo: 17 versionados de 20 consultados", () => {
    const resumo = resumoFornecedores(dadosFornecedores);
    expect(resumo.total).toBe(17);
    expect(resumo.consultados).toBe(20);
    expect(resumo.descartados).toBe(3);
    expect(resumo.situacoes).toEqual([{ situacao: "ATIVA", total: 17 }]);
    expect(resumo.ufs.reduce((t, u) => t + u.total, 0)).toBe(17);
    expect(resumo.cnaesDistintos).toBeGreaterThan(0);
    expect(resumo.cnaesDistintos).toBeLessThanOrEqual(17);
    expect(resumo.coletadoEm).toMatch(/^2026-11-18T/);
    expect(listarSituacoes(dadosFornecedores.fornecedores)).toEqual(["ATIVA"]);
  });

  test("filtra por situação e busca por nome, município e CNPJ", () => {
    const lista = dadosFornecedores.fornecedores;
    expect(filtrarFornecedores(lista, { situacao: "ATIVA" })).toHaveLength(17);
    expect(filtrarFornecedores(lista, { situacao: "BAIXADA" })).toHaveLength(0);

    const graficas = filtrarFornecedores(lista, { busca: "grafica" });
    expect(graficas.map((f) => f.razaoSocial)).toContain("GRAFICA SAO MARTINHO LTDA");
    expect(graficas.length).toBeGreaterThanOrEqual(2);

    expect(filtrarFornecedores(lista, { busca: "florianopolis" })).toHaveLength(1);
    expect(filtrarFornecedores(lista, { busca: "00.729.393/0001-79" })).toHaveLength(1);
    expect(filtrarFornecedores(lista, { busca: "00729393000179" })).toHaveLength(1);
    expect(filtrarFornecedores(lista, { busca: "grafica", situacao: "BAIXADA" })).toHaveLength(0);
  });
});

describe("fornecedores — CSV", () => {
  test("sai com BOM, cabeçalho sem campo pessoal e CNPJ mascarado", () => {
    const csv = fornecedoresParaCsv(dadosFornecedores.fornecedores);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const corpo = csv.slice(1).split("\n");
    expect(corpo).toHaveLength(18);
    expect(corpo[0]).toBe(
      [
        "cnpj",
        "razao_social",
        "situacao_cadastral",
        "data_situacao",
        "inicio_atividade",
        "cnae_codigo",
        "cnae_descricao",
        "natureza_juridica",
        "municipio",
        "uf",
        "consulta_em",
      ].join(";")
    );
    expect(corpo[0]).not.toMatch(/qsa|socio|sócio|telefone|email/i);
    expect(csv).toContain("00.729.393/0001-79");
    expect(csv.match(ONZE_DIGITOS) ?? []).toEqual([]);
  });

  test("CSV reflete o filtro da tela", () => {
    const filtrados = filtrarFornecedores(dadosFornecedores.fornecedores, {
      busca: "brasilia",
    });
    const csv = fornecedoresParaCsv(filtrados);
    expect(csv.slice(1).split("\n")).toHaveLength(filtrados.length + 1);
    expect(filtrados.length).toBeGreaterThan(0);
  });
});
