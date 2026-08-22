import { describe, expect, test } from "vitest";
import { COBERTURA_TAC_PROJETOS, TAC_POR_ANO, TAC_POR_PROJETO } from "./tac-projetos";
import {
  COBERTURA_TAC_ACORDOS,
  STATUS_ORDEM,
  TAC_ACORDOS_PROJETOS,
  TAC_ANO_ACORDOS,
  TAC_STATUS_POR_ORGAO,
  contratosParaCsv,
  type AcordoTacContrato,
} from "./tac-agregados";

/**
 * `tac-agregados.ts` cruza `tac-projetos.ts` (entidade `projetos`) com a
 * entidade `empresas` do mesmo JSON bruto. O que este arquivo trava:
 *
 * 1. Os quatro números conferidos contra o painel público oficial da SEMAD
 *    em 21/08/2026 (`COBERTURA_TAC_ACORDOS`) — se algum mudar, ou a captura
 *    mudou (regenerar), ou alguém editou o literal à mão (não fazer isso).
 * 2. Que o join `TAC_EXECUCAO_TRANSFERIDO` × `TAC_POR_PROJETO` continua 1:1
 *    sem órfã — testado indiretamente pela soma de `transferido` bater
 *    exatamente com o total medido, porque o valor-padrão silencioso
 *    (`transferido: 0` para chave sem match) reduziria essa soma se algum
 *    dia um contrato ficasse órfão.
 * 3. Que a diferença dos cancelados (R$ 891.896,45) é a MESMA em Previsto e
 *    em Transferido — a coincidência que confirma que vem do mesmo contrato.
 */
describe("Agregados TAC (cruzamento projetos × empresas, SEMAD/MG)", () => {
  test("TAC_ACORDOS_PROJETOS tem uma linha por contrato de TAC_POR_PROJETO, nem mais nem menos", () => {
    expect(TAC_ACORDOS_PROJETOS.length).toBe(TAC_POR_PROJETO.length);
    expect(TAC_ACORDOS_PROJETOS.length).toBe(COBERTURA_TAC_PROJETOS.combinacoesProjetoMineradora);
  });

  test("execucao é sempre 'Mineradora' ou 'Estado', transferido é number finito ≥ 0", () => {
    for (const c of TAC_ACORDOS_PROJETOS) {
      expect(["Mineradora", "Estado"], `${c.projeto} / ${c.mineradora}`).toContain(c.execucao);
      expect(typeof c.transferido).toBe("number");
      expect(Number.isFinite(c.transferido)).toBe(true);
      expect(c.transferido).toBeGreaterThanOrEqual(0);
    }
  });

  test("a soma de transferido bate com o total medido — prova indireta de que o join não tem órfã", () => {
    // Se uma chave de TAC_POR_PROJETO não achasse par no complemento, ela
    // cairia no valor-padrão `transferido: 0` e esta soma ficaria MENOR do
    // que o total medido no cruzamento com as 848 linhas ano-a-ano.
    const soma = TAC_ACORDOS_PROJETOS.reduce((t, c) => t + c.transferido, 0);
    expect(soma).toBeCloseTo(COBERTURA_TAC_ACORDOS.transferidoComCancelados, 2);
  });

  test("execucao e órgão continuam constantes por contrato (mesma invariante medida na extração)", () => {
    const porChave = new Map<string, Set<string>>();
    for (const c of TAC_ACORDOS_PROJETOS) {
      const k = `${c.projeto}|${c.mineradora}`;
      if (!porChave.has(k)) porChave.set(k, new Set());
      porChave.get(k)!.add(c.execucao);
    }
    for (const [k, valores] of porChave) {
      expect(valores.size, `execução variou dentro do contrato ${k}`).toBe(1);
    }
  });

  test("TAC_STATUS_POR_ORGAO soma 106 contratos, ordenado do maior para o menor órgão", () => {
    const total = TAC_STATUS_POR_ORGAO.reduce((t, o) => t + o.total, 0);
    expect(total).toBe(TAC_ACORDOS_PROJETOS.length);
    for (let i = 1; i < TAC_STATUS_POR_ORGAO.length; i++) {
      expect(TAC_STATUS_POR_ORGAO[i - 1].total).toBeGreaterThanOrEqual(TAC_STATUS_POR_ORGAO[i].total);
    }
    // Cada linha soma exatamente o total do órgão, nos 4 status conhecidos.
    for (const o of TAC_STATUS_POR_ORGAO) {
      const somaStatus = STATUS_ORDEM.reduce((t, s) => t + o.porStatus[s], 0);
      expect(somaStatus, o.orgao).toBe(o.total);
    }
  });

  test("TAC_STATUS_POR_ORGAO (literal) reconcilia com TAC_ACORDOS_PROJETOS (array) — só aqui no teste", () => {
    // `TAC_STATUS_POR_ORGAO` é fotografia LITERAL (ver docstring de
    // tac-agregados.ts: página de servidor não pode arrastar os 106
    // contratos para somar 9 linhas). Este teste é o único lugar do
    // código que soma `TAC_ACORDOS_PROJETOS` por fora para conferir que a
    // fotografia não desalinhou da base — se `tac-projetos.ts` for
    // recapturado, é aqui que a divergência aparece.
    const esperado = new Map<string, Record<string, number>>();
    for (const c of TAC_ACORDOS_PROJETOS) {
      const linha = esperado.get(c.orgao) ?? {};
      linha[c.status] = (linha[c.status] ?? 0) + 1;
      esperado.set(c.orgao, linha);
    }
    expect(new Set(TAC_STATUS_POR_ORGAO.map((o) => o.orgao))).toEqual(new Set(esperado.keys()));
    for (const o of TAC_STATUS_POR_ORGAO) {
      const linhaEsperada = esperado.get(o.orgao)!;
      for (const s of STATUS_ORDEM) {
        expect(o.porStatus[s], `${o.orgao} / ${s}`).toBe(linhaEsperada[s] ?? 0);
      }
    }
  });

  test("distribuição por órgão × status medida em 21/08/2026 — trava de regressão", () => {
    const porOrgao = Object.fromEntries(TAC_STATUS_POR_ORGAO.map((o) => [o.orgao, o]));
    expect(porOrgao["URAS"]).toMatchObject({
      total: 23,
      porStatus: { "Não Iniciado": 1, "Em execução": 19, Concluído: 3, Cancelado: 0 },
    });
    expect(porOrgao["SUTAF"]).toMatchObject({
      total: 14,
      porStatus: { "Não Iniciado": 6, "Em execução": 6, Concluído: 1, Cancelado: 1 },
    });
    expect(porOrgao["SEINFRA"]).toMatchObject({
      total: 1,
      porStatus: { "Não Iniciado": 0, "Em execução": 0, Concluído: 0, Cancelado: 1 },
    });
    // As 3 linhas "Cancelado" da fonte inteira (TAC_POR_STATUS) têm que
    // aparecer em algum órgão aqui — SUTAF (1) + SUGA (1) + SEINFRA (1).
    const totalCancelado = TAC_STATUS_POR_ORGAO.reduce((t, o) => t + o.porStatus["Cancelado"], 0);
    expect(totalCancelado).toBe(3);
  });

  test("TAC_ANO_ACORDOS reusa previsto/executado de TAC_POR_ANO sem alterar, só adiciona transferido", () => {
    expect(TAC_ANO_ACORDOS.length).toBe(TAC_POR_ANO.length);
    for (let i = 0; i < TAC_POR_ANO.length; i++) {
      expect(TAC_ANO_ACORDOS[i].ano).toBe(TAC_POR_ANO[i].ano);
      expect(TAC_ANO_ACORDOS[i].previsto).toBe(TAC_POR_ANO[i].previsto);
      expect(TAC_ANO_ACORDOS[i].executado).toBe(TAC_POR_ANO[i].executado);
      expect(typeof TAC_ANO_ACORDOS[i].transferido).toBe("number");
    }
    const anos = TAC_ANO_ACORDOS.map((a) => a.ano);
    expect(anos).toEqual([2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029]);
    const somaTransferido = TAC_ANO_ACORDOS.reduce((t, a) => t + a.transferido, 0);
    expect(somaTransferido).toBeCloseTo(COBERTURA_TAC_ACORDOS.transferidoComCancelados, 2);
  });

  test("anos posteriores a 2025 não têm transferido reportado — mesma regra editorial do executado", () => {
    for (const a of TAC_ANO_ACORDOS) {
      if (a.ano > COBERTURA_TAC_PROJETOS.ultimoAnoComExecucao) {
        expect(a.transferido, `${a.ano} deveria estar sem transferência reportada`).toBe(0);
      }
    }
  });

  test("os quatro números batem com o painel oficial da SEMAD, conferidos em 21/08/2026", () => {
    expect(COBERTURA_TAC_ACORDOS.valorTotalTermos).toBeCloseTo(426602622.79, 2);
    expect(COBERTURA_TAC_ACORDOS.valorTotalEstado).toBeCloseTo(341282098.23, 2);
    expect(COBERTURA_TAC_ACORDOS.valorTotalMp).toBeCloseTo(85320524.56, 2);
    expect(COBERTURA_TAC_ACORDOS.mineradoras).toBe(15);
    expect(COBERTURA_TAC_ACORDOS.executadoTotal).toBeCloseTo(125304594.47, 2);
    // Estado + MP fecha com o total do termo — mesma entidade, dois eixos.
    expect(COBERTURA_TAC_ACORDOS.valorTotalEstado + COBERTURA_TAC_ACORDOS.valorTotalMp).toBeCloseTo(
      COBERTURA_TAC_ACORDOS.valorTotalTermos,
      2,
    );
  });

  test("executadoTotal não é um literal duplicado — vem do mesmo campo de tac-projetos.ts", () => {
    expect(COBERTURA_TAC_ACORDOS.executadoTotal).toBe(COBERTURA_TAC_PROJETOS.executadoTotal);
    expect(COBERTURA_TAC_ACORDOS.previstoComCancelados).toBe(COBERTURA_TAC_PROJETOS.previstoTotal);
  });

  test("a diferença dos cancelados é IDÊNTICA em Previsto e em Transferido — R$ 891.896,45", () => {
    const diffPrevisto = COBERTURA_TAC_ACORDOS.previstoComCancelados - COBERTURA_TAC_ACORDOS.previstoSemCancelados;
    const diffTransferido =
      COBERTURA_TAC_ACORDOS.transferidoComCancelados - COBERTURA_TAC_ACORDOS.transferidoSemCancelados;
    expect(diffPrevisto).toBeCloseTo(891896.45, 2);
    expect(diffTransferido).toBeCloseTo(891896.45, 2);
    expect(diffPrevisto).toBeCloseTo(diffTransferido, 2);
    expect(COBERTURA_TAC_ACORDOS.diferencaCancelados).toBeCloseTo(891896.45, 2);
  });

  test("o contrato 'Projeto Marilac - Nacip Raydan' sozinho explica a diferença dos cancelados", () => {
    const marilac = TAC_ACORDOS_PROJETOS.find(
      (c) => c.projeto === "Projeto Marilac - Nacip Raydan" && c.mineradora === "Mosaic Fertilizantes P&K Ltda.",
    );
    expect(marilac).toBeDefined();
    expect(marilac!.status).toBe("Cancelado");
    expect(marilac!.previsto).toBeCloseTo(891896.45, 2);
    expect(marilac!.transferido).toBeCloseTo(891896.45, 2);
    // Os outros 2 contratos cancelados não contribuem nada em R$.
    const outrosCancelados = TAC_ACORDOS_PROJETOS.filter(
      (c) => c.status === "Cancelado" && c.projeto !== "Projeto Marilac - Nacip Raydan",
    );
    expect(outrosCancelados.length).toBe(2);
    for (const c of outrosCancelados) {
      expect(c.previsto, c.projeto).toBe(0);
      expect(c.transferido, c.projeto).toBe(0);
    }
  });

  test("as três ressalvas do painel viajam coladas ao dado, não só no comentário", () => {
    expect(COBERTURA_TAC_ACORDOS.dadoCongeladoEm).toBe("2026-05-05");
    expect(COBERTURA_TAC_ACORDOS.ressalvaCongelamento).toMatch(/congelado/i);
    expect(COBERTURA_TAC_ACORDOS.workspaceDeOrigem).toBe("My workspace");
    expect(COBERTURA_TAC_ACORDOS.ressalvaWorkspace).toMatch(/institucional/i);
    expect(COBERTURA_TAC_ACORDOS.ressalvaCancelados).toMatch(/891\.896,45/);
    expect(COBERTURA_TAC_ACORDOS.ressalvaCancelados).toMatch(/Cancelado/);
  });

  describe("contratosParaCsv", () => {
    const exemplo: AcordoTacContrato = {
      projeto: 'Projeto "Teste"; com ponto e vírgula',
      mineradora: "Mineradora Exemplo S.A.",
      orgao: "IEF",
      status: "Em execução",
      execucao: "Estado",
      previsto: 1234567.891,
      executado: 0,
      anoInicial: 2023,
      anoFinal: 2025,
      relato: "Linha 1\nLinha 2 com \"aspas\"",
      transferido: 1000,
    };

    test("uma linha por contrato + 1 de cabeçalho, separador ';'", () => {
      const csv = contratosParaCsv(TAC_ACORDOS_PROJETOS);
      const linhas = csv.split("\r\n");
      expect(linhas.length).toBe(TAC_ACORDOS_PROJETOS.length + 1);
      expect(linhas[0].split(";").length).toBe(11);
    });

    test("campo com ';', aspas ou quebra de linha vem entre aspas, com aspas internas dobradas", () => {
      const csv = contratosParaCsv([exemplo]);
      const linhas = csv.split("\r\n");
      expect(linhas[1]).toContain('"Projeto ""Teste""; com ponto e vírgula"');
      expect(linhas[1]).toContain('"Linha 1\nLinha 2 com ""aspas"""');
    });

    test("número usa vírgula decimal, sem separador de milhar", () => {
      const csv = contratosParaCsv([exemplo]);
      const linhas = csv.split("\r\n");
      expect(linhas[1]).toContain("1234567,89");
      expect(linhas[1]).not.toContain("1.234.567");
    });

    test("ano nulo e relato nulo viram campo vazio, não 'null'", () => {
      const semAno: AcordoTacContrato = { ...exemplo, anoInicial: null, anoFinal: null, relato: null };
      const csv = contratosParaCsv([semAno]);
      expect(csv).not.toMatch(/null/i);
    });

    test("função não prefixa BOM — isso é responsabilidade de quem monta o Blob", () => {
      const csv = contratosParaCsv([exemplo]);
      expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    });
  });
});
