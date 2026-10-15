/**
 * Guarda dos blocos de dado direto na pergunta (15/10/2026): repasse do
 * Acordo de Brumadinho por município e PTAX do dia.
 *
 * Papel: provar que os blocos devolvem o VALOR REAL dos arquivos —
 * `public/data/repasse-brumadinho-mg.json` (Pró-Brumadinho, dados até
 * 11/08/2026) e `data/cambio-dia.json` (PTAX do Banco Central) — e `null` /
 * pergunta pura fora deles. O número do câmbio é calculado no teste via
 * `tabelaMoeda(cotacoes do arquivo)`, nunca digitado à mão: a coleta troca a
 * cotação e o teste continua verde porque compara as duas pontas do MESMO
 * dado (a disciplina do guarda de repasses, `repasses-municipio.test.ts`).
 */
import { describe, expect, it } from "vitest";
import { blocoRepasseBrumadinho } from "./dado-acordo-brumadinho";
import { blocoCambioSePedir } from "./dado-cambio";
import { perguntaComRepasses } from "./acervo";
import { tabelaMoeda } from "@/lib/transformacao/unidades";
import cambioDia from "@/data/cambio-dia.json";

/** Mesma régua de `dado-cambio.ts` — o teste não formata nada na mão. */
const FMT_COTACAO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

describe("repasse do Acordo de Brumadinho na pergunta", () => {
  it("Brumadinho: R$ 2.500.000,00 de rateio, medidos no arquivo", async () => {
    const bloco = await blocoRepasseBrumadinho("Quanto Brumadinho recebeu do acordo de reparação?");
    expect(bloco).toContain("Brumadinho/MG");
    expect(bloco).toContain("R$ 2.500.000,00 (rateio");
    expect(bloco).toContain("23.830/2021");
    expect(bloco).toContain("dados até 11/08/2026");
    expect(bloco).toContain("/paraopeba/execucao");
  }, 60_000);

  it("Betim: só rateio (R$ 15.000.000,00), sem complementares inventados", async () => {
    const bloco = await blocoRepasseBrumadinho("Betim recebeu quanto do acordo de reparação?");
    expect(bloco).toContain("Betim/MG");
    expect(bloco).toContain("R$ 15.000.000,00 (rateio");
    expect(bloco).not.toContain("complementares");
  }, 60_000);

  it("Contagem: rateio + complementares anunciados separados", async () => {
    const bloco = await blocoRepasseBrumadinho("Quanto Contagem recebeu do acordo?");
    expect(bloco).toContain("R$ 30.000.000,00 (rateio");
    expect(bloco).toContain("+ R$ 1.000.000,00 complementares");
  }, 60_000);

  it("cidade fora dos 853 de MG: null — nenhum número prometido", async () => {
    expect(await blocoRepasseBrumadinho("Curitiba recebeu quanto do acordo?")).toBeNull();
  }, 60_000);
});

describe("PTAX do dia na pergunta", () => {
  it("dólar: a linha traz o MESMO número que tabelaMoeda() devolve hoje", () => {
    const usd = tabelaMoeda(cambioDia.cotacoes).dolar.real;
    const eur = tabelaMoeda(cambioDia.cotacoes).euro.real;
    const bloco = blocoCambioSePedir("Qual é a cotação do dólar hoje?");
    expect(bloco).toContain("PTAX");
    expect(bloco).toContain(`1 dólar = R$ ${FMT_COTACAO.format(usd)}`);
    expect(bloco).toContain(`1 euro = R$ ${FMT_COTACAO.format(eur)}`);
  });

  it("pergunta sem vocabulário de câmbio: null", () => {
    expect(blocoCambioSePedir("Quantos contratos tem a prefeitura de Betim?")).toBeNull();
  });
});

describe("composição em perguntaComRepasses", () => {
  it("pergunta sem dado algum permanece exatamente igual", async () => {
    expect(await perguntaComRepasses("O que é o PNCP?")).toBe("O que é o PNCP?");
  }, 60_000);

  it("cidade + câmbio na mesma pergunta: UM cabeçalho só, nunca lança", async () => {
    const rica = await perguntaComRepasses(
      "Quanto Betim recebeu do acordo de reparação e qual a cotação do dólar?"
    );
    expect(rica).toContain("Betim/MG");
    expect(rica).toContain("Acordo de Reparação de Brumadinho");
    expect(rica).toContain("PTAX");
    expect(rica.match(/DADO DIRETO DO PORTAL/g)).toHaveLength(1);
  }, 60_000);
});
