import { describe, expect, test } from "vitest";

import {
  classificarAto,
  normalizarTituloAto,
  type TipoAto,
  TIPOS_ATO,
} from "./classificarAto";
import { extrairEntidades } from "./extrairEntidades";

describe("ADVERSARIAL SUITE — classificarAto & extrairEntidades", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. SUBSTRING COLLISION & FALSE POSITIVES IN LICITAÇÃO
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Falsos positivos por substring em PALAVRAS_DE_LICITACAO ('LICIT')", () => {
    test("SOLICITAÇÃO de diárias/férias/compras NÃO deve ser classificada como edital de licitação", () => {
      // Títulos administrativos de RH e rotina que contêm a substring 'LICIT' dentro de 'SOLICITAÇÃO'
      const titulo1 = "SOLICITAÇÃO DE DIÁRIAS Nº 12/2026";
      const titulo2 = "SOLICITAÇÃO DE FÉRIAS PRÊMIO DO SERVIDOR";
      const titulo3 = "SOLICITAÇÃO DE PAGAMENTO DE PESSOAL";
      const titulo4 = "SOLICITAÇÃO DE MATERIAIS DE ESCRITÓRIO";

      expect(classificarAto(titulo1)).not.toBe("edital");
      expect(classificarAto(titulo2)).not.toBe("edital");
      expect(classificarAto(titulo3)).not.toBe("edital");
      expect(classificarAto(titulo4)).not.toBe("edital");
    });

    test("PUBLICITÁRIO / PUBLICIDADE NÃO deve ser classificado como edital por conter 'LICIT'", () => {
      const titulo = "CAMPANHA DE MATERIAL PUBLICITÁRIO EDUCATIVO";
      expect(classificarAto(titulo)).not.toBe("edital");
    });

    test("ILÍCITO / EXPLÍCITO / FELICITAÇÕES NÃO deve ser classificado como edital", () => {
      expect(classificarAto("PROCESSO DISCIPLINAR POR ILÍCITO ADMINISTRATIVO")).not.toBe("edital");
      expect(classificarAto("VOTO DE FELICITAÇÕES À COMUNIDADE")).not.toBe("edital");
    });

    test("DISPENSA de servidor (RH) vs DISPENSA de licitação", () => {
      // Sem 'PORTARIA' no título, ato de dispensa de servidor público
      const titulo = "ATO DE DISPENSA DE CARGO EM COMISSÃO";
      // Se casar como edital de compras públicas, é um falso positivo semântico
      expect(classificarAto(titulo)).not.toBe("edital");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PRECEDÊNCIA DETERMINÍSTICA E CITAÇÃO DE NORMAS (LEI / DECRETO)
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Precedência e títulos de editais que citam Leis ou Decretos regulamentadores", () => {
    test("Aviso de licitação que cita a Lei Federal 14.133/2021 deve ser EDITAL, não LEI", () => {
      const titulo = "AVISO DE LICITAÇÃO - PREGÃO ELETRÔNICO Nº 10/2026 - LEI 14.133/2021";
      expect(classificarAto(titulo)).toBe("edital");
    });

    test("Dispensa de licitação com base na Lei 14.133 deve ser EDITAL, não LEI", () => {
      const titulo = "DISPENSA DE LICITAÇÃO Nº 05/2026 - ART. 75, II DA LEI FEDERAL 14.133/2021";
      expect(classificarAto(titulo)).toBe("edital");
    });

    test("Edital de Pregão regulamentado por Decreto deve ser EDITAL, não DECRETO", () => {
      const titulo = "EDITAL DE PREGÃO ELETRÔNICO Nº 02/2026 REGULADO PELO DECRETO MUNICIPAL Nº 1.500";
      expect(classificarAto(titulo)).toBe("edital");
    });

    test("Termo de Homologação de Contrato deve ser CONTRATO (precedência contrato > edital)", () => {
      const titulo = "HOMOLOGAÇÃO DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS Nº 50/2026";
      expect(classificarAto(titulo)).toBe("contrato");
    });

    test("Termo Aditivo de Convênio deve ser CONVENIO (precedência convenio > contrato)", () => {
      const titulo = "1º TERMO ADITIVO AO CONTRATO DE CONVÊNIO Nº 01/2026";
      expect(classificarAto(titulo)).toBe("convenio");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PALAVRAS COMPOSTAS, PREFIXOS E FRONTEIRAS DE PALAVRAS (\b)
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Palavras compostas, prefixos e limites de palavras", () => {
    test("Palavras com 'CONTRATO' como substring não devem casar contrato se não forem contrato", () => {
      expect(classificarAto("DECLARAÇÃO DE INCONTRATABILIDADE")).toBe("outro");
      expect(classificarAto("DESCONTRATAÇÃO DE PESSOAL")).toBe("outro");
    });

    test("Palavras com 'CONVENIO' com prefixo", () => {
      expect(classificarAto("ANÁLISE DE INCONVENIÊNCIA")).toBe("outro");
      expect(classificarAto("DESCONVÊNIO OPERACIONAL")).toBe("outro");
    });

    test("Plurais canônicos de todos os tipos devem ser classificados corretamente", () => {
      expect(classificarAto("RELAÇÃO DE DECRETOS MUNICIPAIS DE MAIO")).toBe("decreto");
      expect(classificarAto("PORTARIAS DA SECRETARIA DE EDUCAÇÃO")).toBe("portaria");
      expect(classificarAto("EXTRATO DE CONVÊNIOS FIRMADOS")).toBe("convenio");
      expect(classificarAto("TERMOS DE PARCERIAS CELEBRADAS")).toBe("convenio");
      expect(classificarAto("TERMOS DE COLABORAÇÕES APROVADAS")).toBe("convenio");
      expect(classificarAto("EXTRATO DE DISTRATOS DE 2026")).toBe("contrato");
      expect(classificarAto("LEIS SANCIONADAS PELO PREFEITO")).toBe("lei");
    });

    test("Underscore como separador de identificador (ex: DECRETO_01, PORTARIA_2026)", () => {
      expect(classificarAto("DECRETO_01_2026_REGULAMENTO")).toBe("decreto");
      expect(classificarAto("PORTARIA_2026_NOMEACAO")).toBe("portaria");
      expect(classificarAto("CONTRATO_05_2026")).toBe("contrato");
      expect(classificarAto("CONVENIO_02_2026")).toBe("convenio");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ROBUSTEZ A FORMATOS BIZARROS, HTML ENTITIES E RUÍDOS
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Entidades HTML, pontuação exótica e ruídos de formatação", () => {
    test("HTML entities no título", () => {
      expect(classificarAto("EXTRATO DE CONTRATO &amp; ADITIVOS")).toBe("contrato");
      expect(classificarAto("&quot;DECRETO Nº 1.234/2026&quot;")).toBe("decreto");
      expect(classificarAto("AVISO DE LICITA&#199;&#195;O")).toBe("edital");
    });

    test("Caracteres de controle, quebras de linha e tabulações", () => {
      expect(classificarAto("\n\r\t DECRETO Nº 100 \n\t")).toBe("decreto");
      expect(classificarAto("PORTARIA\nNº 50/2026")).toBe("portaria");
    });

    test("Entradas vazias, nulas e caracteres especiais isolados", () => {
      expect(classificarAto("")).toBe("outro");
      expect(classificarAto("   ")).toBe("outro");
      expect(classificarAto("!@#$%¨&*()_+{}[]:;?/.,<>")).toBe("outro");
      expect(classificarAto(null)).toBe("outro");
      expect(classificarAto(undefined)).toBe("outro");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. EXTRAÇÃO DE ENTIDADES (CASOS DE BORDA)
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Extração de Entidades — Inexigibilidade, CNPJs e Moeda", () => {
    test("Inexigibilidade de licitação com número '07/2025'", () => {
      const texto = "AVISO DE INEXIGIBILIDADE DE LICITAÇÃO Nº 07/2025. Processo Licitatório nº 14/2025.";
      const res = extrairEntidades(texto);
      expect(res.numeroEdital).toBe("07/2025");
      expect(res.numeroProcesso).toBe("14/2025");
    });

    test("Ata de registro de preços com múltiplos números no texto seleciona a ata como edital principal", () => {
      const texto = "EXTRATO: ATA DE REGISTRO DE PREÇOS N° 043/2026 referente ao Pregão Presencial 015/2026.";
      const res = extrairEntidades(texto);
      expect(res.numeroEdital).toBe("043/2026");
    });
  });
});
