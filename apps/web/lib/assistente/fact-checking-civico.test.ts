/**
 * @file apps/web/lib/assistente/fact-checking-civico.test.ts
 * @description Suíte de testes unitários para a metodologia de fact-checking cívico.
 */

import { describe, it, expect } from "vitest";
import {
  checarFatoCivico,
  validarUrlOficial,
  calcularAderenciaTextual,
  checarNumerosAfirmacao,
  type FontePrimariaChecagem,
} from "./fact-checking-civico";

describe("Metodologia de Fact-Checking Cívico (IFCN / Lupa / Aos Fatos)", () => {
  const fonteLicenca: FontePrimariaChecagem = {
    url: "https://siam.meioambiente.mg.gov.br/licencas/processo-1024-2024",
    orgaoOuAutor: "SEMAD / COPAM",
    tituloOuEmenta: "Parecer Único SEMAD nº 1024/2024 sobre Licença de Operação",
    textoCompleto:
      "O Conselho Estadual de Política Ambiental deferiu a Licença de Operação Corretiva (LOC) com 18 condicionantes ambientais e compensação de R$ 4.500.000 para o empreendimento de mineração.",
    dataDocumento: "2024-05-15",
  };

  it("1. Classifica como FATO COMPROVADO afirmação que coincide com a fonte e números", () => {
    const afirmacao =
      "A SEMAD aprovou a licença de operação corretiva com 18 condicionantes e compensação de R$ 4.500.000.";
    const parecer = checarFatoCivico(afirmacao, [fonteLicenca]);

    expect(parecer.grau).toBe("FATO_COMPROVADO");
    expect(parecer.aprovadoParaPublicacao).toBe(true);
    expect(parecer.divergenciasNumericas).toHaveLength(0);
    expect(parecer.confiancaPercentual).toBeGreaterThanOrEqual(60);
  });

  it("2. Classifica como IMPRECISO quando há número divergente da fonte oficial", () => {
    const afirmacao =
      "A SEMAD aprovou a licença com 25 condicionantes e valor de R$ 9.800.000.";
    const parecer = checarFatoCivico(afirmacao, [fonteLicenca]);

    expect(parecer.grau).toBe("IMPRECISO");
    expect(parecer.aprovadoParaPublicacao).toBe(false);
    expect(parecer.divergenciasNumericas).toContain("9800000");
  });

  it("3. Classifica como NÃO VERIFICÁVEL se faltar link ou se URL for inválida", () => {
    const parecerSemFonte = checarFatoCivico("Qualquer afirmação sem anexo", []);
    expect(parecerSemFonte.grau).toBe("NAO_VERIFICAVEL");

    const fonteUrlQuebrada: FontePrimariaChecagem = {
      url: "ftp://servidor-invalido.br",
      orgaoOuAutor: "Desconhecido",
      tituloOuEmenta: "Documento",
      textoCompleto: "Texto qualquer",
    };
    const parecerUrlRuim = checarFatoCivico("Afirmação com link ruim", [fonteUrlQuebrada]);
    expect(parecerUrlRuim.grau).toBe("NAO_VERIFICAVEL");
  });

  it("4. Classifica como FALSO se a afirmação for frontalmente estranha ao texto oficial", () => {
    const afirmacaoFalsa =
      "A prefeitura comprou 500 ônibus elétricos para o transporte escolar com verba do FNDE.";
    const parecer = checarFatoCivico(afirmacaoFalsa, [fonteLicenca]);

    expect(parecer.grau).toBe("FALSO");
    expect(parecer.aprovadoParaPublicacao).toBe(false);
  });

  it("5. Validador de URL oficial rejeita domínios fictícios e aceita HTTPS governamentais", () => {
    expect(validarUrlOficial("https://www.tce.mg.gov.br/processos/123").valida).toBe(true);
    expect(validarUrlOficial("http://localhost:3000/teste").valida).toBe(false);
    expect(validarUrlOficial("não é url").valida).toBe(false);
  });
});
