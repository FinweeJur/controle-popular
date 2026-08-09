import { describe, expect, it } from "vitest";
import {
  PRESENCA_MIN_OPORTUNIDADES,
  COERENCIA_MIN_VOTOS,
  aplicarFatores,
  calcularCoerencia,
  calcularPresenca,
  calcularPresencaDias,
  type LinhaVoto,
  type LinhaVotoRotulo,
  type LinhaPresencaDia,
} from "./atuacao-parlamentar";

// Betim declara ausência no vocabulario.json (`ausencia_declarada_por_cidade`);
// usar o id real em vez de mock evita testar contra um vocabulário que não é
// o que roda em produção.
const BETIM = "3106705";
const CIDADE_SEM_DECLARACAO = "9999999";

function votos(qtd: number, voto: string, origem: string | null = null): LinhaVoto[] {
  return [{ vereador_id: "v1", voto, origem, qtd }];
}

describe("calcularPresenca", () => {
  it("não mede cidade cuja fonte não declara ausência (São Paulo)", () => {
    const r = calcularPresenca(CIDADE_SEM_DECLARACAO, votos(100, "Sim"));
    expect(r.medido).toBe(false);
    expect(r.taxa).toBeNull();
    expect(r.fator).toBe(1); // NAO_MEDIDO nunca desconta.
  });

  it("não mede abaixo do piso de oportunidades, mesmo com 100% de presença", () => {
    const linhas = votos(PRESENCA_MIN_OPORTUNIDADES - 1, "Sim");
    const r = calcularPresenca(BETIM, linhas);
    expect(r.medido).toBe(false);
    expect(r.base).toBe(PRESENCA_MIN_OPORTUNIDADES - 1);
  });

  it("mede exatamente no piso de oportunidades", () => {
    const linhas = votos(PRESENCA_MIN_OPORTUNIDADES, "Sim");
    const r = calcularPresenca(BETIM, linhas);
    expect(r.medido).toBe(true);
    expect(r.taxa).toBe(1);
  });

  it("presidência (Artigo 17) não entra no numerador nem no denominador", () => {
    const linhas: LinhaVoto[] = [
      ...votos(PRESENCA_MIN_OPORTUNIDADES, "Sim"),
      { vereador_id: "v1", voto: "Presidência", origem: null, qtd: 50 },
    ];
    const r = calcularPresenca(BETIM, linhas);
    expect(r.base).toBe(PRESENCA_MIN_OPORTUNIDADES); // os 50 de presidência somem.
    expect(r.taxa).toBe(1);
  });

  it("voto_contrario de SP não conta como comparecimento", () => {
    const linhas: LinhaVoto[] = [
      ...votos(PRESENCA_MIN_OPORTUNIDADES, "Sim"),
      { vereador_id: "v1", voto: "Sim", origem: "voto_contrario", qtd: 999 },
    ];
    const r = calcularPresenca(BETIM, linhas);
    expect(r.base).toBe(PRESENCA_MIN_OPORTUNIDADES);
  });

  it("presente sem votar conta como comparecimento, mas fica marcado separado", () => {
    const linhas: LinhaVoto[] = [
      ...votos(PRESENCA_MIN_OPORTUNIDADES - 1, "Sim"),
      { vereador_id: "v1", voto: "Não votou", origem: null, qtd: 1 },
    ];
    const r = calcularPresenca(BETIM, linhas);
    expect(r.medido).toBe(true);
    expect(r.compareceu).toBe(PRESENCA_MIN_OPORTUNIDADES);
    expect(r.semVotar).toBe(1);
    expect(r.taxa).toBe(1); // presente sem votar não é falta.
  });

  it("fator nunca cai abaixo de PRESENCA_FATOR_MIN mesmo com presença zero", () => {
    const linhas = votos(PRESENCA_MIN_OPORTUNIDADES, "Ausente");
    const r = calcularPresenca(BETIM, linhas);
    expect(r.taxa).toBe(0);
    expect(r.fator).toBe(0.5); // PRESENCA_FATOR_MIN — metade do construído continua valendo.
  });

  it("rampa é monotônica: taxa maior nunca produz fator menor", () => {
    const baixa = calcularPresenca(BETIM, [
      ...votos(60, "Sim"),
      ...votos(40, "Ausente"),
    ]);
    const alta = calcularPresenca(BETIM, [
      ...votos(90, "Sim"),
      ...votos(10, "Ausente"),
    ]);
    expect(alta.fator).toBeGreaterThan(baixa.fator);
  });
});

describe("calcularPresencaDias (Congresso)", () => {
  function dia(situacao: string, total = 1, presente = 1): LinhaPresencaDia {
    return { situacao_dia: situacao, sessoes_total: total, sessoes_presente: presente };
  }

  it("licença e missão autorizada NÃO entram no denominador", () => {
    const linhas: LinhaPresencaDia[] = [
      ...Array(PRESENCA_MIN_OPORTUNIDADES).fill(dia("Presença")),
      ...Array(50).fill(dia("Licença Saúde - art. 235")),
    ];
    const r = calcularPresencaDias(linhas);
    expect(r.diasJustificada).toBe(50);
    expect(r.base).toBe(PRESENCA_MIN_OPORTUNIDADES); // as 50 licenças não contam.
    expect(r.taxa).toBe(1);
  });

  it("'Decisão da Mesa' é justificada, não falta (registrado em vocabulario.json v1.0.0)", () => {
    const linhas: LinhaPresencaDia[] = [
      ...Array(PRESENCA_MIN_OPORTUNIDADES).fill(dia("Presença")),
      dia("Decisão da Mesa"),
    ];
    const r = calcularPresencaDias(linhas);
    expect(r.diasJustificada).toBe(1);
    expect(r.diasFalta).toBe(0);
  });

  it("rótulo desconhecido não vira falta", () => {
    const linhas: LinhaPresencaDia[] = [
      ...Array(PRESENCA_MIN_OPORTUNIDADES).fill(dia("Presença")),
      dia("Rótulo Que A Câmara Inventou Amanhã"),
    ];
    const r = calcularPresencaDias(linhas);
    expect(r.diasFalta).toBe(0);
    expect(r.base).toBe(PRESENCA_MIN_OPORTUNIDADES);
  });
});

describe("calcularCoerencia", () => {
  function voto(rotulo: string, v: string, qtd = 1): LinhaVotoRotulo {
    return { vereador_id: "v1", rotulo, voto: v, autor_id: null, qtd };
  }

  it("SIM em garantista é coerente; NÃO em garantista é incoerente", () => {
    const linhas: LinhaVotoRotulo[] = [
      ...Array(COERENCIA_MIN_VOTOS).fill(voto("garantista", "Sim")),
    ];
    const r = calcularCoerencia("v1", linhas);
    expect(r.medido).toBe(true);
    expect(r.coerentes).toBe(COERENCIA_MIN_VOTOS);
    expect(r.taxa).toBe(1);
  });

  it("NÃO em reducionista é coerente (a régua se inverte)", () => {
    const linhas: LinhaVotoRotulo[] = Array(COERENCIA_MIN_VOTOS).fill(
      voto("reducionista", "Não")
    );
    const r = calcularCoerencia("v1", linhas);
    expect(r.coerentes).toBe(COERENCIA_MIN_VOTOS);
  });

  it("'não votou' não conta como voto contrário — é ausência de posição", () => {
    const linhas: LinhaVotoRotulo[] = [
      ...Array(COERENCIA_MIN_VOTOS).fill(voto("garantista", "Sim")),
      voto("garantista", "Não votou", 999),
    ];
    const r = calcularCoerencia("v1", linhas);
    expect(r.base).toBe(COERENCIA_MIN_VOTOS); // os 999 "não votou" não entram.
  });

  it("matéria 'misto' fica fora dos dois lados", () => {
    const linhas: LinhaVotoRotulo[] = [
      ...Array(COERENCIA_MIN_VOTOS).fill(voto("garantista", "Sim")),
      voto("misto", "Sim", 500),
    ];
    const r = calcularCoerencia("v1", linhas);
    expect(r.semDirecao).toBe(500);
    expect(r.base).toBe(COERENCIA_MIN_VOTOS);
  });

  it("abaixo do piso de votos com direção, não mede", () => {
    const linhas: LinhaVotoRotulo[] = Array(COERENCIA_MIN_VOTOS - 1).fill(
      voto("garantista", "Sim")
    );
    const r = calcularCoerencia("v1", linhas);
    expect(r.medido).toBe(false);
  });

  it("contradiz a própria autoria só dispara com amostra dos dois lados (autoria.base >= 3)", () => {
    const linhas: LinhaVotoRotulo[] = Array(COERENCIA_MIN_VOTOS).fill(
      voto("reducionista", "Não") // perfil de voto: coerente (+)
    );
    const semAmostra = calcularCoerencia("v1", linhas, { saldo: -5, base: 1 });
    expect(semAmostra.contradizPropriaAutoria).toBe(false);

    const comAmostra = calcularCoerencia("v1", linhas, { saldo: -5, base: 3 });
    expect(comAmostra.contradizPropriaAutoria).toBe(true);
    // O agravante desconta o fator, mas nunca abaixo do piso.
    expect(comAmostra.fator).toBeLessThan(semAmostra.fator);
  });
});

describe("aplicarFatores", () => {
  const MEDIDO_TOTAL = { fator: 1, medido: true, taxa: 1, base: 30, motivo: null };
  const NAO_MEDIDO = { fator: 1, medido: false, taxa: null, base: 0, motivo: "x" };

  it("sem desconto (fatores 1), pontuação bate exata e arredondada", () => {
    expect(aplicarFatores(100, -10, MEDIDO_TOTAL, MEDIDO_TOTAL)).toBe(90);
  });

  it("negativo nunca é descontado pelos fatores — só o positivo é", () => {
    // Se o negativo fosse multiplicado junto, um fator 0.5 reduziria a
    // penalidade de quem tem saldo ruim. A separação impede isso.
    const metade = { fator: 0.5, medido: true, taxa: 0.5, base: 30, motivo: null };
    const semDesconto = aplicarFatores(0, -100, metade, metade);
    expect(semDesconto).toBe(-100); // não veio a -50.
  });

  it("resultado é sempre inteiro", () => {
    const fator = { fator: 0.777, medido: true, taxa: 0.7, base: 30, motivo: null };
    const r = aplicarFatores(233, 0, fator, MEDIDO_TOTAL);
    expect(Number.isInteger(r)).toBe(true);
  });

  it("não medido não desconta (fator 1 por definição)", () => {
    expect(aplicarFatores(100, 0, NAO_MEDIDO, NAO_MEDIDO)).toBe(100);
  });
});
