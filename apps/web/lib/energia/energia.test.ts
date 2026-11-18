import { describe, expect, it, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  TIPOS_GERACAO,
  UFS_VALIDAS,
  carregarUsinas,
  listarUsinas,
  outorgasVencidas,
  potenciaTotalMw,
  resumoPorTipo,
  usinasDoMunicipio,
  validarSnapshot,
  type Usina,
} from "./energia";

/**
 * Contrato do recorte de energia — SIGA/ANEEL, Minas Gerais.
 *
 * Este arquivo NÃO testa a página: testa o DADO que o coletor
 * `scripts/coletar-siga-mg.py` publica em `apps/web/data/energia/`.
 *
 * Por que o teste mora aqui e não no coletor: o Python pode baixar um CSV
 * torto, mudar o dicionário de campos ou gravar potência zero, e a página
 * continuaria "passando" — porque NÃO existe teste de página que veja número
 * errado. O que quebra aqui avisa antes do build.
 *
 * O que é cobrado, item por item, e o motivo:
 * - `fonte` e `coletadoEm` em TODA linha: a página tem de poder dizer de onde
 *   veio aquele número e de quando ele é. Sem isso, dado de energia envelhece
 *   em silêncio — e outorga vencida é assunto de prazo, não de opinião.
 * - potência > 0: potência zero no dado real significa campo não preenchido na
 *   origem; publicar "0 MW" numa lista de maiores é erro, não transparência.
 * - UF válida: o recorte é de MG; UF fora da lista de 27 é corrupção de linha.
 * - teto de 300: é o limite de payload combinado para o painel (regra 5.1).
 * - sem CPF por mod-11: este é repositório público e o SIGA traz nome de
 *   titular em campo vizinho. O coletor não copia esse campo; o teste confere.
 */

const CAMINHO_JSON = path.join(process.cwd(), "data/energia/usinas-mg.json");
const BRUTO = readFileSync(CAMINHO_JSON, "utf-8");
const SNAPSHOT = carregarUsinas();

/** Dígitos verificadores de CPF. Mesma régua de `lib/sem-cpf-no-repo.test.ts`. */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

describe("recorte de usinas — metadados do snapshot", () => {
  it("declara fonte, licença, data de coleta e UF", () => {
    expect(SNAPSHOT.fonte).toMatch(/ANEEL/);
    expect(SNAPSHOT.datasetUrl).toContain("dadosabertos.aneel.gov.br");
    expect(SNAPSHOT.licenca).toMatch(/ODbL/);
    expect(SNAPSHOT.uf).toBe("MG");
    expect(SNAPSHOT.coletadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("publica no máximo 300 usinas e diz quantas ficaram de fora", () => {
    expect(SNAPSHOT.usinas.length).toBeGreaterThan(0);
    expect(SNAPSHOT.usinas.length).toBeLessThanOrEqual(300);
    expect(SNAPSHOT.totalIncluido).toBe(SNAPSHOT.usinas.length);
    expect(SNAPSHOT.totalNoRecorte).toBeGreaterThanOrEqual(SNAPSHOT.totalIncluido);
  });

  it("não tem problema de integridade pelo validador de produção", () => {
    expect(validarSnapshot(SNAPSHOT)).toEqual([]);
  });
});

describe("recorte de usinas — linha a linha", () => {
  const usinas: Usina[] = listarUsinas();

  test("todo campo obrigatório existe e não vem vazio", () => {
    for (const u of usinas) {
      expect(u.ceg, `ceg em ${u.nome}`).toBeTruthy();
      expect(u.nome, `nome em ${u.ceg}`).toBeTruthy();
      expect(u.tipo, `tipo em ${u.ceg}`).toBeTruthy();
      expect(Array.isArray(u.municipios), `municipios em ${u.ceg}`).toBe(true);
      expect(u.municipios.length, `município em ${u.ceg}`).toBeGreaterThan(0);
      expect(u.uf, `uf em ${u.ceg}`).toBe("MG");
    }
  });

  test("potência outorgada é número positivo", () => {
    for (const u of usinas) {
      expect(Number.isFinite(u.potenciaKw), `potência em ${u.ceg}`).toBe(true);
      expect(u.potenciaKw, `potência em ${u.ceg}`).toBeGreaterThan(0);
      expect(u.potenciaFiscalizadaKw).toBeGreaterThanOrEqual(0);
      expect(u.garantiaFisicaKw).toBeGreaterThanOrEqual(0);
    }
  });

  test("UF é uma das 27 e o tipo é um dos seis do SIGA", () => {
    for (const u of usinas) {
      expect(UFS_VALIDAS, `uf em ${u.ceg}`).toContain(u.uf);
      expect(TIPOS_GERACAO, `tipo em ${u.ceg}`).toContain(u.tipo);
    }
  });

  test("toda linha carrega fonte e coletadoEm", () => {
    for (const u of usinas) {
      expect(u.fonte, `fonte em ${u.ceg}`).toMatch(/^https?:\/\//);
      expect(u.coletadoEm, `coletadoEm em ${u.ceg}`).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    }
  });

  test("datas opcionais, quando existem, são ISO de calendário real", () => {
    for (const u of usinas) {
      for (const campo of ["entradaOperacao", "inicioVigencia", "fimVigencia"] as const) {
        const valor = u[campo];
        if (valor === null) continue;
        expect(valor, `${campo} em ${u.ceg}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const [ano, mes, dia] = valor.split("-").map(Number);
        const data = new Date(Date.UTC(ano, mes - 1, dia));
        expect(data.toISOString().slice(0, 10), `${campo} em ${u.ceg}`).toBe(valor);
      }
    }
  });

  test("ranking é decrescente por potência e a posição é sequencial", () => {
    usinas.forEach((u, i) => {
      expect(u.posicao).toBe(i + 1);
      if (i > 0) expect(usinas[i - 1].potenciaKw).toBeGreaterThanOrEqual(u.potenciaKw);
    });
  });

  test("todas as fontes do SIGA aparecem no recorte publicado", () => {
    // O piso de 10 por tipo existe para isto: sem ele, o corte por potência
    // publicaria só solar e hidrelétrica grande. Se este teste quebrar, o
    // coletor perdeu a regra de reserva — e a página volta a mentir por omissão.
    const tipos = new Set(usinas.map((u) => u.tipo));
    for (const tipo of TIPOS_GERACAO) expect(tipos, `tipo ${tipo}`).toContain(tipo);
  });
});

describe("dado pessoal", () => {
  it("nenhum CPF válido por mod-11 no arquivo publicado", () => {
    // Varre o texto cru: pega CPF com máscara e sem máscara, em qualquer campo.
    const candidatos = BRUTO.match(/\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}/g) ?? [];
    const vazados = candidatos.filter((c) => cpfValido(c.replace(/\D/g, "")));
    expect(vazados).toEqual([]);
  });

  it("não guarda nome de titular do empreendimento", () => {
    // O SIGA tem `DscPropriRegimePariticipacao` com o nome do dono da usina
    // (às vezes pessoa física). O coletor extrai só REG/PIE; o nome fica na
    // fonte. Se alguém copiar o campo inteiro, este teste acusa.
    expect(BRUTO).not.toContain("100% para");
    for (const u of listarUsinas()) {
      expect([u.regime === null || ["REG", "PIE"].includes(u.regime), u.regime]).toEqual([
        true,
        u.regime,
      ]);
    }
  });
});

describe("funções de leitura", () => {
  it("soma a potência do recorte em MW", () => {
    const total = potenciaTotalMw();
    expect(total).toBeGreaterThan(1000);
    expect(total).toBe(Math.round(listarUsinas().reduce((s, u) => s + u.potenciaKw, 0) / 1000));
  });

  it("resume por tipo em ordem decrescente de potência", () => {
    const resumo = resumoPorTipo();
    expect(resumo.length).toBeGreaterThanOrEqual(6);
    expect(resumo.reduce((s, r) => s + r.quantidade, 0)).toBe(listarUsinas().length);
    for (let i = 1; i < resumo.length; i++) {
      expect(resumo[i - 1].potenciaMw).toBeGreaterThanOrEqual(resumo[i].potenciaMw);
    }
  });

  it("acha usina por município, ignorando acento e caixa", () => {
    const itumbiara = usinasDoMunicipio("araporã");
    expect(itumbiara.map((u) => u.nome)).toContain("Itumbiara");
    expect(usinasDoMunicipio("Arapora")).toHaveLength(itumbiara.length);
    expect(usinasDoMunicipio("Município Que Não Existe")).toEqual([]);
    expect(usinasDoMunicipio("")).toEqual([]);
  });

  it("lista outorgas vencidas por ano de referência, sem inventar prazo", () => {
    const vencidas = outorgasVencidas(2026);
    for (const u of vencidas) {
      expect(u.fimVigencia).not.toBeNull();
      expect(Number(u.fimVigencia?.slice(0, 4))).toBeLessThan(2026);
    }
    // Nenhuma data ausente pode virar "vencida".
    const semPrazo = listarUsinas().filter((u) => u.fimVigencia === null);
    for (const u of semPrazo) expect(vencidas).not.toContain(u);
    expect(outorgasVencidas(0)).toEqual([]);
  });
});

describe("validador recusa dado torto", () => {
  const base = carregarUsinas();

  const comUsina = (mudanca: Partial<Usina>) => ({
    ...base,
    usinas: [{ ...base.usinas[0], ...mudanca }],
    totalIncluido: 1,
  });

  it("acusa potência zero ou negativa", () => {
    expect(validarSnapshot(comUsina({ potenciaKw: 0 })).join()).toMatch(/potência/);
    expect(validarSnapshot(comUsina({ potenciaKw: -5 })).join()).toMatch(/potência/);
  });

  it("acusa UF fora das 27", () => {
    expect(validarSnapshot(comUsina({ uf: "XX" })).join()).toMatch(/UF inválida/);
  });

  it("acusa linha sem fonte ou sem coletadoEm", () => {
    expect(validarSnapshot(comUsina({ fonte: "" })).join()).toMatch(/fonte/);
    expect(validarSnapshot(comUsina({ coletadoEm: "" })).join()).toMatch(/coletadoEm/);
  });

  it("acusa tipo desconhecido e data impossível", () => {
    expect(
      validarSnapshot(comUsina({ tipo: "SOLAR" as unknown as Usina["tipo"] })).join(),
    ).toMatch(/tipo inválido/);
    expect(validarSnapshot(comUsina({ fimVigencia: "2026-02-30" })).join()).toMatch(
      /fimVigencia/,
    );
  });

  it("acusa recorte acima de 300 usinas e snapshot vazio", () => {
    const grande = {
      ...base,
      usinas: Array.from({ length: 301 }, (_, i) => ({ ...base.usinas[0], posicao: i + 1 })),
    };
    expect(validarSnapshot(grande).join()).toMatch(/teto de 300/);
    expect(validarSnapshot({ ...base, usinas: [] }).join()).toMatch(/sem usinas/);
    expect(validarSnapshot(null)).toEqual(["snapshot não é objeto"]);
  });
});
