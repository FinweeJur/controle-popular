/**
 * @file apps/web/lib/internacional/dados-europa.test.ts
 * @description Suíte de testes unitários do acervo da Europa e Conexões Transnacionais (/europa).
 *
 * Validações obrigatórias:
 * 1. Integridade dos registros (39 itens com campos obrigatórios preenchidos).
 * 2. Presença das fontes canônicas (High Court Londres, Rechtbank Rotterdam, BAFA, Tribunal de Paris, EUDR, CSDDD).
 * 3. Ausência absoluta de CPFs ou dados pessoais sensíveis (AGENTS.md §5.2).
 * 4. Padrão das Seis Qualidades: URLs oficiais canônicas, busca, facetas, ordenação e exportação CSV com BOM UTF-8.
 * 5. Frases curtas de até 13 palavras no contexto cívico do Seu Nonô (AGENTS.md §12).
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_EUROPA,
  obterDadosEuropa,
  obterDadosPorPais,
  obterDadosPorSetor,
  obterDadosPorCategoria,
  obterDadosPorMunicipio,
  obterLitigiosHistoricos,
  obterRegulacoesDueDiligence,
  calcularAgregadosEuropa,
  gerarCsvEuropa,
} from "./dados-europa";

describe("Acervo Europa e Conexões Transnacionais", () => {
  it("carrega todos os 39 registros transnacionais com integridade total", () => {
    const dados = obterDadosEuropa();
    expect(dados).toBeDefined();
    expect(dados.length).toBe(39);

    for (const item of dados) {
      expect(item.id).toBeTruthy();
      expect(item.paisOrigem).toBeTruthy();
      expect(item.codigoIsoPais).toMatch(/^[A-Z]{2}$/);
      expect(item.bandeiraPais).toBeTruthy();
      expect(item.categoria).toBeTruthy();
      expect(item.orgaoJulgadorOuRegulador).toBeTruthy();
      expect(item.processoOuRegistroNumero).toBeTruthy();
      expect(item.dataAto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.empresaEstrangeira).toBeTruthy();
      expect(item.empresaBrasileira).toBeTruthy();
      expect(item.setorEconomico).toBeTruthy();
      expect(item.resumoFato).toBeTruthy();
      expect(item.contextoCivico).toBeTruthy();
      expect(item.marcoLegal).toBeTruthy();
      expect(item.statusProcessual).toBeTruthy();
      expect(item.urlOficialCanonica).toMatch(/^https?:\/\//);
      expect(item.tipoFonte).toBeTruthy();
    }
  });

  it("contém a ação histórica de Mariana contra a BHP no High Court de Londres (£36 bilhões)", () => {
    const dados = obterDadosEuropa();
    const bhp = dados.find((d) => d.id === "uk-bhp-mariana-001");
    expect(bhp).toBeDefined();
    expect(bhp?.paisOrigem).toBe("Reino Unido");
    expect(bhp?.processoOuRegistroNumero).toContain("[2025] EWHC 3001 (TCC)");
    expect(bhp?.valorCausaMoedaOrigem).toBe(36000000000);
    expect(bhp?.moedaOrigem).toBe("GBP");
    expect(bhp?.valorCausaBrl).toBe(260000000000);
    expect(bhp?.urlOficialCanonica).toContain("caselaw.nationalarchives.gov.uk");
  });

  it("contém os precedentes britânicos líderes de jurisdição extraterritorial (Vedanta e Okpabi)", () => {
    const dados = obterDadosEuropa();
    const vedanta = dados.find((d) => d.id === "uk-vedanta-precedente-002");
    const okpabi = dados.find((d) => d.id === "uk-okpabi-shell-precedente-003");

    expect(vedanta).toBeDefined();
    expect(vedanta?.processoOuRegistroNumero).toBe("[2019] UKSC 20");
    expect(vedanta?.categoria).toBe("Precedente Jurisdicional");

    expect(okpabi).toBeDefined();
    expect(okpabi?.processoOuRegistroNumero).toBe("[2021] UKSC 3");
    expect(okpabi?.categoria).toBe("Precedente Jurisdicional");
  });

  it("contém as regulações e procedimentos alemães no BAFA (LkSG) e empresas industriais", () => {
    const dados = obterDadosEuropa();
    const alemanha = dados.filter((d) => d.codigoIsoPais === "DE");
    expect(alemanha.length).toBeGreaterThanOrEqual(6);

    const bafaSoja = alemanha.find((d) => d.id === "de-bafa-lksg-soja-006");
    expect(bafaSoja).toBeDefined();
    expect(bafaSoja?.orgaoJulgadorOuRegulador).toContain("BAFA");

    const basf = alemanha.find((d) => d.id === "de-basf-quimica-010");
    expect(basf).toBeDefined();

    const bayer = alemanha.find((d) => d.id === "de-bayer-monsanto-011");
    expect(bayer).toBeDefined();

    const thyssenkrupp = alemanha.find((d) => d.id === "de-thyssenkrupp-siderurgia-009");
    expect(thyssenkrupp).toBeDefined();
  });

  it("contém a Lei do Dever de Vigilância francesa (Casino, BNP Paribas, TotalEnergies, Aperam)", () => {
    const dados = obterDadosEuropa();
    const franca = dados.filter((d) => d.codigoIsoPais === "FR");
    expect(franca.length).toBeGreaterThanOrEqual(4);

    const casino = franca.find((d) => d.id === "fr-casino-desmatamento-012");
    expect(casino).toBeDefined();
    expect(casino?.orgaoJulgadorOuRegulador).toContain("Tribunal judiciaire de Paris");

    const aperam = franca.find((d) => d.id === "fr-aperam-jequitinhonha-015");
    expect(aperam).toBeDefined();
    expect(aperam?.municipioNome).toBe("Timóteo");
    expect(aperam?.resumoFato).toContain("Vale do Jequitinhonha");
  });

  it("contém os julgamentos do Tribunal de Roterdã (Braskem Maceió e Samarco Rio Doce Claims) e o Porto de Roterdã", () => {
    const dados = obterDadosEuropa();
    const holanda = dados.filter((d) => d.codigoIsoPais === "NL");
    expect(holanda.length).toBeGreaterThanOrEqual(4);

    const braskem = holanda.find((d) => d.id === "nl-braskem-maceio-016");
    expect(braskem).toBeDefined();
    expect(braskem?.orgaoJulgadorOuRegulador).toContain("Rechtbank Rotterdam");
    expect(braskem?.municipioNome).toBe("Maceió");

    const rioDoce = holanda.find((d) => d.id === "nl-riodoce-claims-017");
    expect(rioDoce).toBeDefined();
    expect(rioDoce?.resumoFato).toContain("Stichting Rio Doce Claims");

    const portoEmo = holanda.find((d) => d.id === "nl-porto-roterdam-emo-018");
    expect(portoEmo).toBeDefined();
    expect(portoEmo?.categoria).toBe("Hub Logístico & Comércio");
  });

  it("contém as operações e concessões italianas (Enel SP, Enel Rio, Enel Green Power, TIM)", () => {
    const dados = obterDadosEuropa();
    const italia = dados.filter((d) => d.codigoIsoPais === "IT");
    expect(italia.length).toBeGreaterThanOrEqual(5);

    const enelSp = italia.find((d) => d.id === "it-enel-sp-concessao-020");
    expect(enelSp).toBeDefined();
    expect(enelSp?.empresaBrasileira).toContain("Enel Distribuição São Paulo");

    const enelGreen = italia.find((d) => d.id === "it-enel-greenpower-nordeste-022");
    expect(enelGreen).toBeDefined();
    expect(enelGreen?.municipioNome).toBe("São Gonçalo do Gurguéia");
  });

  it("contém as operações espanholas (Santander, Telefónica/Vivo, Neoenergia Belo Monte, Latibex)", () => {
    const dados = obterDadosEuropa();
    const espanha = dados.filter((d) => d.codigoIsoPais === "ES");
    expect(espanha.length).toBeGreaterThanOrEqual(6);

    const santander = espanha.find((d) => d.id === "es-santander-agro-credito-025");
    expect(santander).toBeDefined();

    const belomonte = espanha.find((d) => d.id === "es-neoenergia-belomonte-027");
    expect(belomonte).toBeDefined();
    expect(belomonte?.municipioNome).toBe("Altamira");
  });

  it("contém as operações portuguesas (EDP Brasil, Galp Pré-Sal e DCIAP Cooperação Judiciária)", () => {
    const dados = obterDadosEuropa();
    const portugal = dados.filter((d) => d.codigoIsoPais === "PT");
    expect(portugal.length).toBeGreaterThanOrEqual(3);

    const edp = portugal.find((d) => d.id === "pt-edp-concessoes-brasil-031");
    expect(edp).toBeDefined();

    const galp = portugal.find((d) => d.id === "pt-galp-petrogal-presal-032");
    expect(galp).toBeDefined();
  });

  it("contém os marcos regulatórios da União Europeia (EUDR e CSDDD)", () => {
    const dados = obterDadosEuropa();
    const eudr = dados.find((d) => d.id === "eu-eudr-regulamento-034");
    const csddd = dados.find((d) => d.id === "eu-csddd-diretiva-035");

    expect(eudr).toBeDefined();
    expect(eudr?.processoOuRegistroNumero).toContain("Regulamento (UE) 2023/1115");

    expect(csddd).toBeDefined();
    expect(csddd?.processoOuRegistroNumero).toContain("Diretiva (UE) 2024/1760");
  });

  it("filtra corretamente por país, setor, categoria e município", () => {
    const reinoUnido = obterDadosPorPais("GB");
    expect(reinoUnido.length).toBe(5);

    const mineracao = obterDadosPorSetor("Mineração");
    expect(mineracao.length).toBeGreaterThanOrEqual(5);

    const litigios = obterDadosPorCategoria("Litígio Transnacional");
    expect(litigios.length).toBe(5);

    const mariana = obterDadosPorMunicipio("3140001");
    expect(mariana.length).toBe(1);
    expect(mariana[0].id).toBe("uk-bhp-mariana-001");

    const litigiosHistoricos = obterLitigiosHistoricos();
    expect(litigiosHistoricos.length).toBe(7); // 5 litígios + 2 precedentes

    const regulacoes = obterRegulacoesDueDiligence();
    expect(regulacoes.length).toBe(5);
  });

  it("calcula agregados medidos consistentes com a constante estática COBERTURA_EUROPA", () => {
    const agregados = calcularAgregadosEuropa();
    expect(agregados.totalRegistros).toBe(COBERTURA_EUROPA.totalRegistros);
    expect(agregados.totalPaises).toBe(COBERTURA_EUROPA.totalPaises);
    expect(agregados.valorTotalPleiteadoGbp).toBe(COBERTURA_EUROPA.valorTotalPleiteadoGbp);
    expect(agregados.municipiosBrasileirosConectados).toBe(
      COBERTURA_EUROPA.municipiosBrasileirosConectados
    );
  });

  it("gera arquivo CSV com BOM UTF-8, separador ponto e vírgula e colunas canônicas", () => {
    const dados = obterDadosEuropa();
    const csv = gerarCsvEuropa(dados);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("id;pais_origem;codigo_iso;bandeira;categoria;");
    expect(csv).toContain("uk-bhp-mariana-001");
    expect(csv).toContain("Reino Unido");
    expect(csv).toContain("High Court of Justice");
    expect(csv.split("\r\n").length).toBe(dados.length + 1);
  });

  it("respeita a regra editorial do Seu Nonô: orações com até 13 palavras (AGENTS.md §12)", () => {
    const dados = obterDadosEuropa();
    for (const item of dados) {
      // Divide por pontuação final (. ! ?) para analisar cada oração
      const oracoes = item.contextoCivico
        .split(/[.!?]+/)
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      for (const oracao of oracoes) {
        const palavras = oracao.split(/\s+/).filter((p) => p.length > 0);
        expect(
          palavras.length,
          `Oração excede 13 palavras (${palavras.length}) em ${item.id}: "${oracao}"`
        ).toBeLessThanOrEqual(13);
      }
    }
  });

  it("garante ausência total de CPFs reais em todos os campos de texto", () => {
    const dados = obterDadosEuropa();
    const jsonStr = JSON.stringify(dados);

    // Regex de busca por padrão de 11 dígitos numéricos
    const matches11Digitos = jsonStr.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g) || [];

    // Função de validação de CPF por módulo 11
    function validaMod11Cpf(cpfLimpo: string): boolean {
      if (cpfLimpo.length !== 11 || /^(\d)\1+$/.test(cpfLimpo)) return false;
      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo[i], 10) * (10 - i);
      let resto = 11 - (soma % 11);
      let dv1 = resto >= 10 ? 0 : resto;
      if (dv1 !== parseInt(cpfLimpo[9], 10)) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo[i], 10) * (11 - i);
      resto = 11 - (soma % 11);
      let dv2 = resto >= 10 ? 0 : resto;
      return dv2 === parseInt(cpfLimpo[10], 10);
    }

    for (const match of matches11Digitos) {
      const digitos = match.replace(/\D/g, "");
      const ehCpfReal = validaMod11Cpf(digitos);
      expect(
        ehCpfReal,
        `CPF detectado no acervo: ${match} (não permitido por AGENTS.md §5.2)`
      ).toBe(false);
    }
  });
});
