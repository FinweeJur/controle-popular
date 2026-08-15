import { describe, expect, test } from "vitest";
import {
  MUNICIPIOS_EXECUCAO_FGV,
  PROJETOS_EXECUCAO_FGV,
  PROJETOS_ESPECIAIS_FGV,
  STATUS_PROJETOS_FGV,
  REFERENCIA_EXECUCAO_FGV,
  TOTAL_EXECUCAO_FGV,
} from "./execucao-fgv";

/**
 * `execucao-fgv.ts` é GERADO por `scripts/coletar-execucao-fgv.mts` a partir
 * de dois JSON da auditoria da FGV. O que este arquivo trava é o CONTRATO
 * entre o parsing e o que `docs/FONTES-PRO-BRUMADINHO-E-FGV.md` mediu em
 * 15/08/2026 — cada uma das quatro armadilhas daquela fonte tem um teste
 * aqui, porque as quatro falham em silêncio.
 */
describe("execucao-fgv.ts — as contagens medidas em 15/08/2026", () => {
  test("são 26 municípios, os da Bacia do Paraopeba cobertos pelo Anexo I.3/I.4", () => {
    expect(MUNICIPIOS_EXECUCAO_FGV.length).toBe(26);
  });

  test("são 450 linhas (município × projeto), não as 483 do arquivo bruto", () => {
    // A diferença são 26 subtotais de bloco, 1 "Total Geral" e 6 notas de
    // rodapé que a fonte grava no MESMO campo `Município`. Contar `length`
    // publicaria 483 projetos e 33 municípios que não existem.
    expect(PROJETOS_EXECUCAO_FGV.length).toBe(450);
  });

  test("são 3 projetos especiais — TAC Bombeiros, TAC Defesa Civil e Cláusula 4.4.9", () => {
    expect(PROJETOS_ESPECIAIS_FGV.length).toBe(3);
    expect(PROJETOS_ESPECIAIS_FGV.map((p) => p.projeto)).toEqual([
      "TAC Bombeiros",
      "TAC Defesa Civil",
      "Claúsula 4.4.9",
    ]);
  });

  test("455 linhas de status descrevem 234 projetos, não 455", () => {
    // A armadilha de contagem mais cara desta fonte: um projeto que alcança
    // 25 cidades aparece 25 vezes. Publicar `length` como "projetos" quase
    // dobraria o número real.
    expect(STATUS_PROJETOS_FGV.length).toBe(455);
    expect(new Set(STATUS_PROJETOS_FGV.map((s) => s.idFdi)).size).toBe(234);
  });
});

describe("execucao-fgv.ts — a célula mesclada não pode ter deixado projeto órfão", () => {
  test("toda linha de projeto tem município, e ele é um dos 26 da síntese", () => {
    const cidades = new Set(MUNICIPIOS_EXECUCAO_FGV.map((m) => m.municipio));
    for (const p of PROJETOS_EXECUCAO_FGV) {
      expect(p.municipio, `projeto "${p.projeto}" sem município`).toBeTruthy();
      expect(cidades.has(p.municipio), `município fora da síntese: ${p.municipio}`).toBe(true);
    }
  });

  test("os 26 municípios aparecem todos nas linhas de projeto — nenhum bloco se perdeu", () => {
    const comProjeto = new Set(PROJETOS_EXECUCAO_FGV.map((p) => p.municipio));
    expect(comProjeto.size).toBe(26);
  });

  test("nenhuma linha de rodapé virou município ou projeto", () => {
    const suspeito = (s: string) =>
      s === "Total Geral" || s === "Observações:" || s.endsWith(" Total") || /^\d\)/.test(s);
    for (const m of MUNICIPIOS_EXECUCAO_FGV) expect(suspeito(m.municipio)).toBe(false);
    for (const p of PROJETOS_EXECUCAO_FGV) {
      expect(suspeito(p.municipio)).toBe(false);
      expect(suspeito(p.projeto)).toBe(false);
    }
    for (const e of PROJETOS_ESPECIAIS_FGV) expect(suspeito(e.projeto)).toBe(false);
  });
});

describe('execucao-fgv.ts — "Todos os Municípios de Minas Gerais" nunca vira cidade', () => {
  test("o rótulo estadual não aparece em nenhuma lista de município", () => {
    const rotulo = "Todos os Municípios de Minas Gerais";
    for (const m of MUNICIPIOS_EXECUCAO_FGV) expect(m.municipio).not.toBe(rotulo);
    for (const p of PROJETOS_EXECUCAO_FGV) expect(p.municipio).not.toBe(rotulo);
    for (const s of STATUS_PROJETOS_FGV) expect(s.municipios).not.toContain(rotulo);
  });

  test("os 3 projetos de alcance estadual estão marcados em `estadual`, não apagados", () => {
    // Filtrá-los fora apagaria projeto real; deixá-los como cidade
    // inventaria um município de 853 habitantes chamado "Todos os
    // Municípios de Minas Gerais". Por isso o campo próprio.
    expect(STATUS_PROJETOS_FGV.filter((s) => s.estadual).length).toBe(3);
  });

  test("toda linha de status alcança alguma coisa — município ou o estado", () => {
    for (const s of STATUS_PROJETOS_FGV) {
      expect(s.estadual || s.municipios.length > 0, `status ${s.idFdi} sem alcance`).toBe(true);
    }
  });
});

describe("execucao-fgv.ts — os números têm que ser números", () => {
  test("nenhum valor é NaN — a fonte mistura número JS e string americana na mesma coluna", () => {
    const finito = (n: number, onde: string) => expect(Number.isFinite(n), onde).toBe(true);
    for (const m of MUNICIPIOS_EXECUCAO_FGV) {
      finito(m.acordoInicial, `${m.municipio}/inicial`);
      finito(m.acordoAtual, `${m.municipio}/atual`);
      finito(m.empenhosAutorizados, `${m.municipio}/empenhos`);
      finito(m.saldoTeto, `${m.municipio}/saldo`);
    }
    for (const p of PROJETOS_EXECUCAO_FGV) {
      finito(p.empenhoNominal, `${p.projeto}/nominal`);
      finito(p.empenhoAtualizado, `${p.projeto}/atualizado`);
      finito(p.executado, `${p.projeto}/executado`);
      finito(p.saldo, `${p.projeto}/saldo`);
      finito(p.nivelExecucao, `${p.projeto}/nivel`);
    }
  });

  test("o nível de execução fica entre 0 e 100 — acima disso seria erro de parsing de '%'", () => {
    for (const p of PROJETOS_EXECUCAO_FGV) {
      expect(p.nivelExecucao).toBeGreaterThanOrEqual(0);
      expect(p.nivelExecucao).toBeLessThanOrEqual(100);
    }
  });

  test("a soma do acordo atualizado bate, ao centavo, com o Total Geral da própria FGV", () => {
    const soma = MUNICIPIOS_EXECUCAO_FGV.reduce((s, m) => s + m.acordoAtual, 0);
    expect(Math.abs(soma - TOTAL_EXECUCAO_FGV.acordoAtual)).toBeLessThan(0.01);
  });

  /**
   * E o contrário, medido: a soma do acordo INICIAL dá R$ 4.000.000.000,01
   * contra os R$ 3.999.999.999,10 que a FGV declara — 91 centavos de
   * diferença, que é arredondamento da própria fonte, não erro nosso.
   * O teste trava a ORDEM DE GRANDEZA da divergência: se ela passar de um
   * real, alguma linha entrou ou saiu do arquivo.
   */
  test("a soma do acordo inicial diverge do total declarado em menos de R$ 1 (arredondamento da fonte)", () => {
    const soma = MUNICIPIOS_EXECUCAO_FGV.reduce((s, m) => s + m.acordoInicial, 0);
    const dif = Math.abs(soma - TOTAL_EXECUCAO_FGV.acordoInicial);
    expect(dif).toBeGreaterThan(0);
    expect(dif).toBeLessThan(1);
  });
});

describe("execucao-fgv.ts — proveniência declarada, nunca 'hoje'", () => {
  test("as três datas existem e têm formato", () => {
    expect(REFERENCIA_EXECUCAO_FGV.relatorio).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(REFERENCIA_EXECUCAO_FGV.financeiro).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(REFERENCIA_EXECUCAO_FGV.coletadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("a URL da fonte continua apontando para a página financeira da FGV", () => {
    expect(REFERENCIA_EXECUCAO_FGV.url).toContain("www18.fgv.br/projetorioparaopeba");
  });
});
