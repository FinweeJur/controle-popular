import { describe, expect, test } from "vitest";
import {
  COBERTURA_DECISOES_LICENCIAMENTO,
  DECISOES_LICENCIAMENTO_POR_ANO,
  DECISOES_LICENCIAMENTO_POR_TIPO,
  enxugarNegativa,
  negativasParaCsv,
  type DecisaoLicenciamentoBruta,
  type DecisaoLicenciamentoNegativa,
} from "./decisoes-licenciamento";

const BRUTA_EXEMPLO: DecisaoLicenciamentoBruta = {
  id_fonte: 46339,
  regional: "Unidade Regional de Regularização Ambiental Central Metropolitana",
  municipio_nome: "Caeté",
  classe: 2,
  nome_empreendimento: "HERMES MINERACAO LTDA",
  modalidade: "LAC 1 - LP + LI + LO",
  atividade_descricao: "Lavra a céu aberto - Minério de ferro",
  ano: 2026,
  decisao: "Arquivamento",
  numero_processo: "19576/2025/___/____",
  link_ficha: "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/view-externo?id=46339",
};

describe("enxugarNegativa", () => {
  test("mapeia os 11 campos publicados a partir da linha bruta", () => {
    const linha = enxugarNegativa(BRUTA_EXEMPLO);
    expect(linha).toEqual({
      idFonte: 46339,
      ano: 2026,
      decisao: "Arquivamento",
      municipio: "Caeté",
      classe: 2,
      modalidade: "LAC 1 - LP + LI + LO",
      atividade: "Lavra a céu aberto - Minério de ferro",
      regional: "Unidade Regional de Regularização Ambiental Central Metropolitana",
      numeroProcesso: "19576/2025/___/____",
      empreendimento: "HERMES MINERACAO LTDA",
      linkFicha: "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/view-externo?id=46339",
    });
  });

  test("funde 'Licença Suspensa' em 'Suspensa' — mesmo estado, dois rótulos da fonte", () => {
    const linha = enxugarNegativa({ ...BRUTA_EXEMPLO, decisao: "Licença Suspensa" });
    expect(linha.decisao).toBe("Suspensa");
  });

  test("as 4 grafias conhecidas da fonte mapeiam sem lançar", () => {
    for (const decisao of ["Indeferida", "Arquivamento", "Cancelada", "Suspensa", "Licença Suspensa"]) {
      expect(() => enxugarNegativa({ ...BRUTA_EXEMPLO, decisao })).not.toThrow();
    }
  });

  test("decisão fora das 5 grafias conhecidas lança — bug de quem chama, não caso a esconder", () => {
    expect(() => enxugarNegativa({ ...BRUTA_EXEMPLO, decisao: "Deferida" })).toThrow(/decisão desconhecida/);
    expect(() => enxugarNegativa({ ...BRUTA_EXEMPLO, decisao: null })).toThrow(/decisão desconhecida/);
  });

  test("ano fora de 1990–2030 vira null, sem inventar nem descartar a linha", () => {
    const linha = enxugarNegativa({ ...BRUTA_EXEMPLO, ano: "201" });
    expect(linha.ano).toBeNull();
    expect(linha.idFonte).toBe(46339); // a linha continua existindo
  });

  test("'None' e string vazia em campo textual viram null, não literal", () => {
    const linha = enxugarNegativa({
      ...BRUTA_EXEMPLO,
      municipio_nome: "None",
      modalidade: "",
      numero_processo: null,
    });
    expect(linha.municipio).toBeNull();
    expect(linha.modalidade).toBeNull();
    expect(linha.numeroProcesso).toBeNull();
  });

  test("titular pessoa física já vem redigido do ETL — a função não redige de novo, só repassa", () => {
    const linha = enxugarNegativa({ ...BRUTA_EXEMPLO, nome_empreendimento: null });
    expect(linha.empreendimento).toBeNull();
  });

  test("classe ausente ou vazia vira null, não NaN", () => {
    const linha = enxugarNegativa({ ...BRUTA_EXEMPLO, classe: null });
    expect(linha.classe).toBeNull();
    const linha2 = enxugarNegativa({ ...BRUTA_EXEMPLO, classe: "" });
    expect(linha2.classe).toBeNull();
  });
});

describe("COBERTURA_DECISOES_LICENCIAMENTO", () => {
  test("negativas + deferidas fecha o total", () => {
    expect(
      COBERTURA_DECISOES_LICENCIAMENTO.totalDeferidas + COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas,
    ).toBe(COBERTURA_DECISOES_LICENCIAMENTO.total);
  });

  test("percentual de negativas bate com o total, arredondado", () => {
    const exato =
      (COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas / COBERTURA_DECISOES_LICENCIAMENTO.total) * 100;
    expect(Math.round(exato)).toBe(COBERTURA_DECISOES_LICENCIAMENTO.percentualNegativas);
  });

  test("as três ressalvas obrigatórias viajam com o dado, não só no comentário", () => {
    expect(COBERTURA_DECISOES_LICENCIAMENTO.avisoIndeferimento).toMatch(/não é irregularidade/i);
    expect(COBERTURA_DECISOES_LICENCIAMENTO.avisoPessoaFisica).toMatch(/não aparece nominalmente/i);
    expect(COBERTURA_DECISOES_LICENCIAMENTO.avisoAgregado).toMatch(/agregadas/i);
  });

  test("pessoaFisicaNasNegativas é menor que o total de negativas", () => {
    expect(COBERTURA_DECISOES_LICENCIAMENTO.pessoaFisicaNasNegativas).toBeLessThan(
      COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas,
    );
    expect(COBERTURA_DECISOES_LICENCIAMENTO.pessoaFisicaNasNegativas).toBeGreaterThan(0);
  });
});

describe("DECISOES_LICENCIAMENTO_POR_ANO", () => {
  test("cobre anoInicial a anoFinal de COBERTURA, sem lacuna", () => {
    const anos = DECISOES_LICENCIAMENTO_POR_ANO.map((a) => a.ano);
    expect(Math.min(...anos)).toBe(COBERTURA_DECISOES_LICENCIAMENTO.anoInicial);
    expect(Math.max(...anos)).toBe(COBERTURA_DECISOES_LICENCIAMENTO.anoFinal);
    expect(anos).toEqual([...anos].sort((a, b) => a - b));
    // Sequência contígua, sem ano faltando no meio.
    for (let i = 1; i < anos.length; i++) expect(anos[i]).toBe(anos[i - 1] + 1);
  });

  test("soma de negativas por ano = total - as com ano inconsistente (fora do gráfico)", () => {
    const soma = DECISOES_LICENCIAMENTO_POR_ANO.reduce((t, a) => t + a.negativas, 0);
    expect(soma).toBe(
      COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas - COBERTURA_DECISOES_LICENCIAMENTO.negativasComAnoInconsistente,
    );
  });

  test("soma de deferidas por ano fecha exatamente com o total", () => {
    const soma = DECISOES_LICENCIAMENTO_POR_ANO.reduce((t, a) => t + a.deferidas, 0);
    expect(soma).toBe(COBERTURA_DECISOES_LICENCIAMENTO.totalDeferidas);
  });
});

describe("DECISOES_LICENCIAMENTO_POR_TIPO", () => {
  test("as 4 categorias somam o total de negativas", () => {
    const soma = DECISOES_LICENCIAMENTO_POR_TIPO.reduce((t, d) => t + d.total, 0);
    expect(soma).toBe(COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas);
  });

  test("ordenado do maior para o menor", () => {
    for (let i = 1; i < DECISOES_LICENCIAMENTO_POR_TIPO.length; i++) {
      expect(DECISOES_LICENCIAMENTO_POR_TIPO[i - 1].total).toBeGreaterThanOrEqual(
        DECISOES_LICENCIAMENTO_POR_TIPO[i].total,
      );
    }
  });

  test("'Suspensa' aparece uma vez só (fundida) — não há 'Licença Suspensa' separada", () => {
    const rotulos = DECISOES_LICENCIAMENTO_POR_TIPO.map((d) => d.decisao);
    expect(rotulos.filter((r) => r === "Suspensa").length).toBe(1);
    expect(rotulos).not.toContain("Licença Suspensa");
  });
});

describe("negativasParaCsv", () => {
  const exemplo: DecisaoLicenciamentoNegativa = {
    idFonte: 1,
    ano: 2024,
    decisao: "Indeferida",
    municipio: "Belo Horizonte",
    classe: 3,
    modalidade: "LAS Cadastro",
    atividade: 'Extração; com ponto e vírgula "citado"',
    regional: "Unidade Regional Central Metropolitana",
    numeroProcesso: "123/2024",
    empreendimento: null,
    linkFicha: "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/view-externo?id=1",
  };

  test("uma linha por registro + 1 de cabeçalho, separador ';'", () => {
    const csv = negativasParaCsv([exemplo, { ...exemplo, idFonte: 2 }]);
    const linhas = csv.split("\r\n");
    expect(linhas.length).toBe(3);
    expect(linhas[0].split(";").length).toBe(10);
  });

  test("campo com ';' ou aspas vem entre aspas, com aspas internas dobradas", () => {
    const csv = negativasParaCsv([exemplo]);
    expect(csv).toContain('"Extração; com ponto e vírgula ""citado"""');
  });

  test("campo nulo vira string vazia, nunca a palavra 'null'", () => {
    const csv = negativasParaCsv([exemplo]);
    expect(csv).not.toMatch(/null/i);
  });

  test("não prefixa BOM — isso é responsabilidade de quem monta o Blob no cliente", () => {
    const csv = negativasParaCsv([exemplo]);
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
  });
});
