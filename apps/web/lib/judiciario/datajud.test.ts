import { afterEach, describe, expect, test } from "vitest";
import {
  achatarAssuntos,
  buscarDatajud,
  chaveApi,
  chaveDeCache,
  DatajudErro,
  filtroTemCriterio,
  interpretarResposta,
  montarConsulta,
  redigirCpfEmTexto,
  sanitizarProcesso,
  TAMANHO_MAXIMO,
  TAMANHO_PADRAO,
  urlDatajud,
  type DatajudProcesso,
} from "./datajud";

/**
 * A FIXTURE abaixo não é acervo do DataJud — é escrita à mão no FORMATO
 * medido nos exemplos OFICIAIS da wiki do CNJ
 * (`datajud-wiki.cnj.jus.br/api-publica/exemplos/exemplo1` e `exemplo2`,
 * sondados em 21/08/2026): mesma forma de `hits.hits[]._source`, mesmos
 * nomes de campo, números de processo e órgãos INVENTADOS. Isso é o que a
 * tarefa pede — "fixture pequena, só formato" — e não republicação de
 * processo real algum.
 *
 * O segundo hit reproduz de propósito a inconsistência JÁ MEDIDA entre
 * tribunais: `exemplo1` (TRF1) devolve `assuntos` como array PLANO de
 * `{codigo,nome}`; `exemplo2` (TJDFT) devolve array de ARRAYS. O hit 1 usa o
 * formato plano; o hit 2 usa o aninhado — para provar que
 * `achatarAssuntos`/`interpretarResposta` tratam os dois.
 */
const RESPOSTA_FIXTURE = {
  took: 12,
  timed_out: false,
  _shards: { total: 7, successful: 7, skipped: 0, failed: 0 },
  hits: {
    total: { value: 2, relation: "eq" },
    max_score: 2.0,
    hits: [
      {
        _index: "api_publica_tjmg",
        _type: "_doc",
        _id: "TJMG_65_G1_1234_00012345620238130001",
        _score: 2.0,
        _source: {
          numeroProcesso: "00012345620238130001",
          classe: { codigo: 65, nome: "Procedimento Comum Cível" },
          sistema: { codigo: 1, nome: "Pje" },
          formato: { codigo: 1, nome: "Eletrônico" },
          tribunal: "TJMG",
          grau: "G1",
          dataAjuizamento: "2023-03-10T00:00:00.000Z",
          dataHoraUltimaAtualizacao: "2026-08-01T10:00:00.000Z",
          "@timestamp": "2026-08-01T10:00:00.000Z",
          movimentos: [
            { codigo: 26, nome: "Distribuição", dataHora: "2023-03-10T09:00:00.000Z" },
            { codigo: 51, nome: "Audiência designada", dataHora: "2023-06-01T14:00:00.000Z" },
          ],
          id: "TJMG_65_G1_1234_00012345620238130001",
          nivelSigilo: 0,
          orgaoJulgador: {
            codigoMunicipioIBGE: 3106200,
            codigo: 1234,
            nome: "1ª Vara Ambiental de Belo Horizonte",
          },
          // Formato PLANO, como no exemplo1 (TRF1) da wiki.
          assuntos: [{ codigo: 12428, nome: "Diminuição da Reserva Legal" }],
        },
        sort: [1690000000000],
      },
      {
        _index: "api_publica_tjmg",
        _type: "_doc",
        _id: "TJMG_1116_G1_5678_00098765420248130002",
        _score: 1.5,
        _source: {
          numeroProcesso: "00098765420248130002",
          classe: { codigo: 1116, nome: "Execução Fiscal" },
          tribunal: "TJMG",
          // sem "grau" -- campo ausente na fonte, deve virar null, não quebrar.
          dataAjuizamento: "2024-01-05T00:00:00.000Z",
          movimentos: [],
          id: "TJMG_1116_G1_5678_00098765420248130002",
          nivelSigilo: 0,
          orgaoJulgador: {
            codigoMunicipioIBGE: 3118601,
            codigo: 5678,
            // CPF de teste sintético (12345678909, canônico do repositório —
            // ver `SINTETICOS` em `sem-cpf-no-repo.test.ts`) colado ao nome,
            // só para provar que `sanitizarProcesso` redige mesmo aqui, onde
            // a fonte real nunca traz isso (ver o comentário de topo do módulo).
            nome: "1ª Vara Cível de Contagem 12345678909",
          },
          // Formato ANINHADO, como no exemplo2 (TJDFT) da wiki: um array por
          // grupo de classificação.
          assuntos: [
            [{ codigo: 6017, nome: "Dívida Ativa (Execução Fiscal)" }],
            [{ codigo: 10394, nome: "Dívida Ativa não-tributária" }],
          ],
        },
        sort: [1700000000000],
      },
    ],
  },
};

describe("urlDatajud / chaveApi", () => {
  afterEach(() => {
    delete process.env.DATAJUD_API_KEY;
  });

  test("aponta para o índice público do TJMG", () => {
    expect(urlDatajud()).toBe("https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search");
  });

  test("usa a chave padrão quando não há override no ambiente", () => {
    delete process.env.DATAJUD_API_KEY;
    expect(chaveApi()).toBe("cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==");
  });

  test("aceita sobrescrita por DATAJUD_API_KEY (o CNJ pode rotacionar a chave)", () => {
    process.env.DATAJUD_API_KEY = "chave-nova-de-teste";
    expect(chaveApi()).toBe("chave-nova-de-teste");
  });
});

describe("filtroTemCriterio", () => {
  test("recusa filtro vazio -- vira match_all sobre ~70 mil processos", () => {
    expect(filtroTemCriterio({})).toBe(false);
  });

  test("aceita numeroProcesso sozinho", () => {
    expect(filtroTemCriterio({ numeroProcesso: "00012345620238130001" })).toBe(true);
  });

  test("aceita qualquer um dos códigos sozinho, inclusive 0", () => {
    expect(filtroTemCriterio({ classeCodigo: 0 })).toBe(true);
    expect(filtroTemCriterio({ assuntoCodigo: 1 })).toBe(true);
    expect(filtroTemCriterio({ orgaoJulgadorCodigo: 1 })).toBe(true);
    expect(filtroTemCriterio({ municipioIBGE: 3106200 })).toBe(true);
  });
});

describe("montarConsulta", () => {
  test("numeroProcesso vira match exato, com sort por @timestamp sempre presente", () => {
    const corpo = montarConsulta({ numeroProcesso: "00012345620238130001" });
    expect(corpo).toMatchObject({
      size: TAMANHO_PADRAO,
      query: { bool: { must: [{ match: { numeroProcesso: "00012345620238130001" } }] } },
      sort: [{ "@timestamp": { order: "asc" } }],
    });
  });

  test("combina classe + assunto + orgaoJulgador + municipioIBGE em bool.must", () => {
    const corpo = montarConsulta({
      classeCodigo: 1116,
      assuntoCodigo: 6017,
      orgaoJulgadorCodigo: 13597,
      municipioIBGE: 3106200,
    });
    expect(corpo.query).toEqual({
      bool: {
        must: [
          { match: { "classe.codigo": 1116 } },
          { match: { "assuntos.codigo": 6017 } },
          { match: { "orgaoJulgador.codigo": 13597 } },
          { match: { "orgaoJulgador.codigoMunicipioIBGE": 3106200 } },
        ],
      },
    });
  });

  test("tamanho é sujeito ao teto próprio do portal (TAMANHO_MAXIMO), não ao teto de 10.000 da API", () => {
    expect((montarConsulta({ classeCodigo: 1, tamanho: 999 }) as { size: number }).size).toBe(
      TAMANHO_MAXIMO
    );
    expect((montarConsulta({ classeCodigo: 1, tamanho: 0 }) as { size: number }).size).toBe(1);
  });

  test("search_after só entra no corpo quando informado", () => {
    const sem = montarConsulta({ classeCodigo: 1 });
    expect(sem).not.toHaveProperty("search_after");

    const com = montarConsulta({ classeCodigo: 1, searchAfter: [1690000000000] });
    expect(com.search_after).toEqual([1690000000000]);
  });
});

describe("achatarAssuntos", () => {
  test("mantém array já plano (formato do exemplo1/TRF1)", () => {
    expect(achatarAssuntos([{ codigo: 6177, nome: "Concessão" }])).toEqual([
      { codigo: 6177, nome: "Concessão" },
    ]);
  });

  test("achata array de arrays (formato do exemplo2/TJDFT) sem perder nenhum item", () => {
    const bruto = [[{ codigo: 6017, nome: "A" }], [{ codigo: 10394, nome: "B" }]];
    expect(achatarAssuntos(bruto)).toEqual([
      { codigo: 6017, nome: "A" },
      { codigo: 10394, nome: "B" },
    ]);
  });

  test("ignora entradas sem o formato {codigo,nome} em vez de quebrar", () => {
    expect(achatarAssuntos([{ codigo: 1 }, "lixo", null, { nome: "sem código" }])).toEqual([]);
  });

  test("null/undefined viram lista vazia", () => {
    expect(achatarAssuntos(null)).toEqual([]);
    expect(achatarAssuntos(undefined)).toEqual([]);
  });
});

describe("interpretarResposta", () => {
  test("lê os dois hits da fixture, nos dois formatos de assuntos", () => {
    const r = interpretarResposta(RESPOSTA_FIXTURE);
    expect(r.total).toBe(2);
    expect(r.totalRelacao).toBe("eq");
    expect(r.processos).toHaveLength(2);

    const [p1, p2] = r.processos;
    expect(p1.numeroProcesso).toBe("00012345620238130001");
    expect(p1.classe).toEqual({ codigo: 65, nome: "Procedimento Comum Cível" });
    expect(p1.assuntos).toEqual([{ codigo: 12428, nome: "Diminuição da Reserva Legal" }]);
    expect(p1.orgaoJulgador?.codigoMunicipioIBGE).toBe(3106200);
    expect(p1.totalMovimentos).toBe(2);
    expect(p1.ultimoMovimento).toEqual({
      codigo: 51,
      nome: "Audiência designada",
      dataHora: "2023-06-01T14:00:00.000Z",
    });

    expect(p2.grau).toBeNull(); // campo ausente na fonte -> null, não undefined nem quebra
    expect(p2.assuntos).toEqual([
      { codigo: 6017, nome: "Dívida Ativa (Execução Fiscal)" },
      { codigo: 10394, nome: "Dívida Ativa não-tributária" },
    ]);
  });

  test("total.relation 'gte' é preservado -- '10.000' às vezes é 'pelo menos 10.000', não exato", () => {
    const r = interpretarResposta({
      hits: { total: { value: 10000, relation: "gte" }, hits: [] },
    });
    expect(r.totalRelacao).toBe("gte");
    expect(r.total).toBe(10000);
  });

  test("searchAfter vem do campo 'sort' do último hit", () => {
    const r = interpretarResposta(RESPOSTA_FIXTURE);
    expect(r.searchAfter).toEqual([1700000000000]);
  });

  test("searchAfter é null quando não há hits", () => {
    const r = interpretarResposta({ hits: { total: { value: 0, relation: "eq" }, hits: [] } });
    expect(r.searchAfter).toBeNull();
  });

  test("lança erro em vez de devolver objeto pela metade quando 'hits.hits' não é array", () => {
    // Validar o CONTEÚDO, nunca só o status HTTP -- a mesma disciplina das
    // outras fontes deste repositório (ver AGENTS.md).
    expect(() => interpretarResposta({ hits: {} })).toThrow(/hits\.hits/);
    expect(() => interpretarResposta(null)).toThrow(/hits\.hits/);
    expect(() => interpretarResposta("string qualquer")).toThrow(/hits\.hits/);
  });

  test("hit sem numeroProcesso é descartado, não vira processo inventado", () => {
    const r = interpretarResposta({
      hits: {
        total: { value: 1, relation: "eq" },
        hits: [{ _id: "x", _source: { classe: { codigo: 1, nome: "Sem número" } } }],
      },
    });
    expect(r.processos).toHaveLength(0);
  });
});

describe("redigirCpfEmTexto", () => {
  test("redige o CPF sintético canônico (mod-11 válido)", () => {
    expect(redigirCpfEmTexto("Vara de Contagem 12345678909")).toBe(
      "Vara de Contagem [documento redigido]"
    );
  });

  test("preserva sequência de 11 dígitos que NÃO é CPF válido por mod-11", () => {
    // Dígito verificador errado de propósito -- não é CPF, é só um número de
    // 11 dígitos (ex.: um protocolo hipotético), e não deve ser tocado.
    expect(redigirCpfEmTexto("Protocolo 12345678901")).toBe("Protocolo 12345678901");
  });

  test("preserva texto sem sequência de 11 dígitos", () => {
    expect(redigirCpfEmTexto("1ª Vara Ambiental de Belo Horizonte")).toBe(
      "1ª Vara Ambiental de Belo Horizonte"
    );
  });
});

describe("sanitizarProcesso", () => {
  test("redige CPF válido em QUALQUER campo de texto do processo, não só numa lista de campos suspeitos", () => {
    const r = interpretarResposta(RESPOSTA_FIXTURE);
    const p2 = r.processos[1];
    expect(p2.orgaoJulgador?.nome).toContain("12345678909"); // ainda cru aqui

    const limpo: DatajudProcesso = sanitizarProcesso(p2);
    expect(limpo.orgaoJulgador?.nome).toBe("1ª Vara Cível de Contagem [documento redigido]");
  });

  test("não mexe em processo sem CPF nenhum no texto", () => {
    const r = interpretarResposta(RESPOSTA_FIXTURE);
    const p1 = r.processos[0];
    expect(sanitizarProcesso(p1)).toEqual(p1);
  });
});

describe("chaveDeCache", () => {
  test("filtros equivalentes (mesmos campos, mesma ordem lógica) produzem a mesma chave", () => {
    const a = chaveDeCache({ classeCodigo: 1, tamanho: 10 });
    const b = chaveDeCache({ classeCodigo: 1, tamanho: 10 });
    expect(a).toBe(b);
  });

  test("filtros diferentes produzem chaves diferentes", () => {
    expect(chaveDeCache({ classeCodigo: 1 })).not.toBe(chaveDeCache({ classeCodigo: 2 }));
  });
});

describe("buscarDatajud -- erros tratados sem vazar a chave", () => {
  test("timeout vira DatajudErro 504, sem a chave na mensagem", async () => {
    const originalFetch = global.fetch;
    global.fetch = () => {
      const erro = new Error("The operation was aborted");
      erro.name = "AbortError";
      return Promise.reject(erro);
    };
    try {
      await expect(buscarDatajud({ classeCodigo: 999999 })).rejects.toBeInstanceOf(DatajudErro);
      await expect(buscarDatajud({ classeCodigo: 999998 })).rejects.toMatchObject({
        statusSugerido: 504,
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("resposta não-ok vira DatajudErro 502 com mensagem genérica, sem repassar corpo/status do CNJ", async () => {
    const originalFetch = global.fetch;
    global.fetch = () =>
      Promise.resolve({ ok: false, status: 401, json: async () => ({}) } as Response);
    try {
      let erro: unknown;
      try {
        await buscarDatajud({ classeCodigo: 777777 });
      } catch (e) {
        erro = e;
      }
      expect(erro).toBeInstanceOf(DatajudErro);
      expect((erro as DatajudErro).message).not.toMatch(/APIKey|Authorization/i);
      expect((erro as DatajudErro).statusSugerido).toBe(502);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
