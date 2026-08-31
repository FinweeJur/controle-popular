import { describe, expect, test } from "vitest";
import {
  anonimizarCpfs,
  extrairEntidades,
  formatarCnpj,
  SINTETICOS,
  validarCnpj,
  validarCpf,
} from "./extrairEntidades";

describe("ADVERSARIAL SUITE 1 — Extração de Valores Monetários", () => {
  test("Valores decimais pequenos e centavos (< R$ 1,00)", () => {
    const texto = "Valor unitário de R$ 0,50 e taxa de R$ 0,05.";
    const entidades = extrairEntidades(texto);
    expect(entidades.valoresMonetarios).toEqual([0.5, 0.05]);
    expect(entidades.valorPrincipal).toBe(0.5);
  });

  test("Valores de grande escala (Bilhões)", () => {
    const texto = "Orçamento plurianual estimado em R$ 1.000.000.000,00 com aditivo de R$ 2.500.000.000,50.";
    const entidades = extrairEntidades(texto);
    expect(entidades.valoresMonetarios).toEqual([1000000000.0, 2500000000.5]);
    expect(entidades.valorPrincipal).toBe(2500000000.5);
  });

  test("Espaçamento variável e caracteres de espaço em branco", () => {
    // Vários espaços após R$
    const t1 = "Contrato no valor de R$   150.000,00.";
    expect(extrairEntidades(t1).valoresMonetarios).toEqual([150000.0]);

    // Espaço entre a vírgula e os centavos
    const t2 = "Valor de R$ 150.000, 00.";
    expect(extrairEntidades(t2).valoresMonetarios).toEqual([150000.0]);

    // Espaço antes da vírgula (falha no motor atual devido à regex sem \\s* antes da vírgula)
    const t3 = "Valor de R$ 150.000 , 00.";
    const res3 = extrairEntidades(t3);
    // Documentação empírica: regex atual não captura se houver espaço antes da vírgula
    expect(res3.valoresMonetarios.length).toBe(0);

    // Espaço sem quebra (non-breaking space \u00A0)
    const t4 = "Valor de R$\u00A0250.000,00.";
    expect(extrairEntidades(t4).valoresMonetarios).toEqual([250000.0]);
  });

  test("Valores inteiros sem centavos (ex: R$ 150.000)", () => {
    const texto = "Dotação no valor de R$ 150.000 para a obra.";
    const entidades = extrairEntidades(texto);
    // Documentação empírica: a regex atual exige obrigatoriamente vírgula e 2 dígitos decimais
    expect(entidades.valoresMonetarios).toEqual([]);
    expect(entidades.valorPrincipal).toBeNull();
  });

  test("Múltiplos valores no mesmo texto com identificação de Valor Total / Global", () => {
    const texto =
      "Contrato com valor mensal de R$ 5.000,00, taxa de adesão de R$ 1.200,00 e Valor Global de R$ 60.000,00.";
    const entidades = extrairEntidades(texto);
    expect(entidades.valoresMonetarios).toEqual([5000.0, 1200.0, 60000.0]);
    // O valor global deve ser priorizado como valor principal
    expect(entidades.valorPrincipal).toBe(60000.0);
  });

  test("Prioridade semântica de VALOR TOTAL sobre valor maior isolado", () => {
    // Quando o texto declara explicitamente VALOR TOTAL DE R$ X, mesmo que haja outro valor citado
    const texto = "Dotação orçamentária de R$ 500.000,00. VALOR TOTAL DE R$ 120.000,00.";
    const entidades = extrairEntidades(texto);
    expect(entidades.valoresMonetarios).toContain(500000.0);
    expect(entidades.valoresMonetarios).toContain(120000.0);
    expect(entidades.valorPrincipal).toBe(120000.0);
  });

  test("Formatos de prefixo: VALOR GLOBAL:, VALOR TOTAL:, VALOR ESTIMADO:", () => {
    const t1 = "Contrato de prestação de serviços. VALOR GLOBAL: R$ 45.000,00.";
    expect(extrairEntidades(t1).valorPrincipal).toBe(45000.0);

    const t2 = "Pregão Eletrônico. VALOR ESTIMADO: R$ 89.900,00.";
    expect(extrairEntidades(t2).valorPrincipal).toBe(89900.0);

    const t3 = "Convênio. VALOR TOTAL: 150.000,00.";
    expect(extrairEntidades(t3).valorPrincipal).toBe(150000.0);
  });

  test("Deduplicação de valores repetidos no mesmo texto", () => {
    const texto = "Valor de R$ 50.000,00 na 1ª parcela e R$ 50.000,00 na 2ª parcela. Total: R$ 100.000,00.";
    const entidades = extrairEntidades(texto);
    expect(entidades.valoresMonetarios).toEqual([50000.0, 100000.0]);
    expect(entidades.valorPrincipal).toBe(100000.0);
  });

  test("Comportamento sob valor R$ 0,00", () => {
    const texto = "Termo aditivo sem repasse financeiro. Valor: R$ 0,00.";
    const entidades = extrairEntidades(texto);
    // Verificamos se 0.00 é ignorado ou capturado pelo motor atual
    // O motor atual filtra por num > 0
    expect(entidades.valoresMonetarios).toEqual([]);
    expect(entidades.valorPrincipal).toBeNull();
  });
});

describe("ADVERSARIAL SUITE 2 — Extração e Validação de CNPJs", () => {
  test("CNPJs válidos formatados e não formatados com normalização para XX.XXX.XXX/YYYY-ZZ", () => {
    const tFormatado = "Empresa Alpha CNPJ: 12.345.678/0001-95.";
    expect(extrairEntidades(tFormatado).cnpjs).toEqual(["12.345.678/0001-95"]);

    const tSemFormatacao = "Empresa Beta inscrita no CNPJ 12345678000195.";
    expect(extrairEntidades(tSemFormatacao).cnpjs).toEqual(["12.345.678/0001-95"]);
  });

  test("Rejeição rigorosa de CNPJs com dígitos verificadores inválidos", () => {
    // 12.345.678/0001-00 tem DVs inválidos
    const texto = "Fornecedor irregular CNPJ 12.345.678/0001-00 e outro CNPJ 33000167000199.";
    const entidades = extrairEntidades(texto);
    expect(entidades.cnpjs).toEqual([]);
  });

  test("Rejeição de CNPJs com 14 dígitos idênticos", () => {
    const t1 = "CNPJ 00.000.000/0000-00";
    const t2 = "CNPJ 11111111111111";
    expect(extrairEntidades(t1).cnpjs).toEqual([]);
    expect(extrairEntidades(t2).cnpjs).toEqual([]);
  });

  test("CNPJs adjacentes a pontuações e delimitadores", () => {
    // Dois pontos colados
    const t1 = "CNPJ:12.345.678/0001-95";
    expect(extrairEntidades(t1).cnpjs).toEqual(["12.345.678/0001-95"]);

    // Entre parênteses e ponto final
    const t2 = "(CNPJ nº 33.000.167/0001-01).";
    expect(extrairEntidades(t2).cnpjs).toEqual(["33.000.167/0001-01"]);

    // Entre aspas
    const t3 = 'Contratada "07.526.557/0001-00" habilitada.';
    expect(extrairEntidades(t3).cnpjs).toEqual(["07.526.557/0001-00"]);
  });

  test("Múltiplos CNPJs em consórcio com deduplicação", () => {
    const texto =
      "Consórcio Líder (CNPJ 12.345.678/0001-95) e Consorciada (CNPJ 33.000.167/0001-01). Líder: 12345678000195.";
    const entidades = extrairEntidades(texto);
    expect(entidades.cnpjs).toEqual(["12.345.678/0001-95", "33.000.167/0001-01"]);
  });

  test("Filiais com dígitos verificadores válidos", () => {
    // 00.000.000/0001-91 (matriz Banco do Brasil) vs 00.000.000/0002-72 (filial)
    expect(validarCnpj("00.000.000/0001-91")).toBe(true);
    expect(validarCnpj("00.000.000/0002-72")).toBe(true);
    expect(validarCnpj("00000000000272")).toBe(true);

    const texto = "Agência bancária filial CNPJ 00.000.000/0002-72 contratada.";
    expect(extrairEntidades(texto).cnpjs).toEqual(["00.000.000/0002-72"]);
  });
});

describe("ADVERSARIAL SUITE 3 — Anonimização de CPF (LGPD) e Prevenção de Falsos Positivos", () => {
  // CPFs matematicamente válidos para teste de anonimização (gerados por Mod-11):
  // 843.512.606-45: DV1=4, DV2=5
  // 059.824.136-15: DV1=1, DV2=5
  const CPF_VALIDO_1 = "84351260645";
  const CPF_VALIDO_1_FMT = "843.512.606-45";
  const CPF_VALIDO_2 = "05982413615";
  const CPF_VALIDO_2_FMT = "059.824.136-15";

  test("Validação Mod-11 de CPFs matematicamente válidos", () => {
    expect(validarCpf(CPF_VALIDO_1)).toBe(true);
    expect(validarCpf(CPF_VALIDO_1_FMT)).toBe(true);
    expect(validarCpf(CPF_VALIDO_2)).toBe(true);
    expect(validarCpf(CPF_VALIDO_2_FMT)).toBe(true);
  });

  test("Anonimiza CPFs válidos reais em formato formatado e desformatado", () => {
    const tFormatado = `Fiscal de contrato nomeado: Fulano de Tal, CPF ${CPF_VALIDO_1_FMT}, portador do RG 123.`;
    const anonFormatado = anonimizarCpfs(tFormatado);
    expect(anonFormatado).not.toContain(CPF_VALIDO_1_FMT);
    expect(anonFormatado).toContain("***.***.***-**");

    const tDesformatado = `Servidor CPF ${CPF_VALIDO_2} exonerado a pedido.`;
    const anonDesformatado = anonimizarCpfs(tDesformatado);
    expect(anonDesformatado).not.toContain(CPF_VALIDO_2);
    expect(anonDesformatado).toContain("***.***.***-**");
  });

  test("Preserva rigorosamente a lista de CPFs SINTÉTICOS autorizados", () => {
    for (const sint of SINTETICOS) {
      const texto = `Exemplo de teste com CPF sintético ${sint} para verificação.`;
      const resultado = anonimizarCpfs(texto);
      expect(resultado).toBe(texto);
    }
  });

  test("NÃO anonimiza números de protocolo administrativo (11 dígitos que não são Mod-11)", () => {
    // Protocolo 20260831001 (11 dígitos, DV não fecha Mod-11)
    expect(validarCpf("20260831001")).toBe(false);
    const texto = "Processo sob Protocolo nº 20260831001 protocolado na recepção.";
    expect(anonimizarCpfs(texto)).toBe(texto);
  });

  test("NÃO anonimiza números de telefone, CEPs e datas", () => {
    const texto =
      "Contatos: Tel (31) 3531-1234 ou celular 31987654321. CEP 39100-000. Data 31/08/2026.";
    const resultado = anonimizarCpfs(texto);
    expect(resultado).toContain("(31) 3531-1234");
    expect(resultado).toContain("39100-000");
    expect(resultado).toContain("31/08/2026");
  });

  test("NÃO anonimiza sequências de 11 dígitos idênticos", () => {
    const t1 = "Código de barras 111.111.111-11";
    const t2 = "Numeração 99999999999";
    expect(anonimizarCpfs(t1)).toBe(t1);
    expect(anonimizarCpfs(t2)).toBe(t2);
  });

  test("NÃO quebra quando texto contém CPFs já parcialmente mascarados da fonte", () => {
    const t1 = "Contratado: Beltrano, CPF ***.123.456-**.";
    const t2 = "Servidora: Maria, CPF 123.***.***-09.";
    const t3 = "Estagiário: João, CPF XXX.456.789-XX.";
    expect(anonimizarCpfs(t1)).toBe(t1);
    expect(anonimizarCpfs(t2)).toBe(t2);
    expect(anonimizarCpfs(t3)).toBe(t3);
  });

  test("extrairEntidades executa anonimização prévia sem vazar CPF no objeto ou texto interno", () => {
    const texto = `CONTRATO Nº 05/2026. Contratado: João da Silva, CPF ${CPF_VALIDO_1_FMT}. Objeto: Serviços de consultoria. Valor: R$ 25.000,00.`;
    const entidades = extrairEntidades(texto);
    expect(entidades.numeroContrato).toBe("05/2026");
    expect(entidades.valorPrincipal).toBe(25000.0);
    // Objeto extraído não pode conter o CPF
    expect(entidades.objeto).toBe("Serviços de consultoria");
  });
});

describe("ADVERSARIAL SUITE 4 — Extração de Processos, Editais, Contratos e Objetos", () => {
  test("Variações de número de processo (PL, PA, Processo Administrativo)", () => {
    const t1 = "Processo Licitatório nº 014/2025 homologado.";
    expect(extrairEntidades(t1).numeroProcesso).toBe("014/2025");

    const t2 = "Proc. Adm. 088/2024 autuado.";
    expect(extrairEntidades(t2).numeroProcesso).toBe("088/2024");

    const t3 = "PL 05/2026 referente à contratação.";
    expect(extrairEntidades(t3).numeroProcesso).toBe("05/2026");

    const t4 = "Processo nº 12345/2026 aberto.";
    expect(extrairEntidades(t4).numeroProcesso).toBe("12345/2026");
  });

  test("Variações de número de edital / pregão / dispensa", () => {
    const t1 = "Aviso de Pregão Presencial nº 03/2026.";
    expect(extrairEntidades(t1).numeroEdital).toBe("03/2026");

    const t2 = "Dispensa de Licitação nº 12/2026.";
    expect(extrairEntidades(t2).numeroEdital).toBe("12/2026");

    const t3 = "Chamamento Público nº 001/2026.";
    expect(extrairEntidades(t3).numeroEdital).toBe("001/2026");

    const t4 = "Ata de Registro de Preços nº 015/2026.";
    expect(extrairEntidades(t4).numeroEdital).toBe("015/2026");

    const t5 = "AVISO DE INEXIGIBILIDADE DE LICITAÇÃO Nº 07/2025. Processo Licitatório nº 14/2025.";
    expect(extrairEntidades(t5).numeroEdital).toBe("07/2025");
  });

  test("Variações de número de contrato, termo aditivo e convênio", () => {
    const t1 = "Contrato nº 100/2026 firmado com a Secretaria.";
    expect(extrairEntidades(t1).numeroContrato).toBe("100/2026");

    const t2 = "3º Termo Aditivo ao Contrato nº 019/2025.";
    expect(extrairEntidades(t2).numeroContrato).toBe("019/2025");

    const t3 = "Termo de Fomento nº 004/2026 celebrado.";
    expect(extrairEntidades(t3).numeroContrato).toBe("004/2026");

    const t4 = "Termo de Colaboração nº 002/2025 celebrado.";
    expect(extrairEntidades(t4).numeroContrato).toBe("002/2025");

    const t5 = "Acordo de Cooperação Técnica nº 003/2026.";
    expect(extrairEntidades(t5).numeroContrato).toBe("003/2026");
  });

  test("Variações de extração de objeto com diferentes pontuações de término", () => {
    const t1 = "Objeto: Aquisição de merenda escolar para a rede municipal. Valor Total: R$ 50.000,00.";
    expect(extrairEntidades(t1).objeto).toBe("Aquisição de merenda escolar para a rede municipal");

    const t2 = "Cujo objeto é a construção de quadra poliesportiva; Valor Global de R$ 120.000,00.";
    expect(extrairEntidades(t2).objeto).toBe("a construção de quadra poliesportiva");

    const t3 = "Tendo por objeto a prestação de serviços de transporte.\nValor: R$ 30.000,00.";
    expect(extrairEntidades(t3).objeto).toBe("a prestação de serviços de transporte");
  });

  test("Valores monetários negativos ou decréscimos em aditivos", () => {
    const t1 = "Supressão contratual no valor de -R$ 15.000,00.";
    const e1 = extrairEntidades(t1);
    // Documentação empírica: a regex atual não aceita sinal negativo no valor monetário
    expect(e1.valoresMonetarios).toEqual([15000.0]); // Capturado sem o sinal negativo
  });

  test("Comportamento de tokens colados sem espaço (glued tokens)", () => {
    // CPF sem formatação colado na palavra "CPF" sem espaço
    const tGluedCpf = "Identificação do fiscal CPF84351260645.";
    // Com \\b, a fronteira de palavra falha entre F e 8
    expect(anonimizarCpfs(tGluedCpf)).toBe(tGluedCpf);

    // CNPJ sem formatação colado na palavra "CNPJ" sem espaço
    const tGluedCnpj = "Fornecedor CNPJ12345678000195 contratado.";
    expect(extrairEntidades(tGluedCnpj).cnpjs).toEqual([]);
  });
});
