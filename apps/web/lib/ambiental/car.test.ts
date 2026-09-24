import { describe, expect, it } from "vitest";
import {
  obterUrfbiosCar,
  obterUrfbioPorId,
  obterUrfbioPorNome,
  listarRegistrosCar,
  obterRegistroPorCodigoCar,
  calcularTempoMedioAnaliseGeral,
  calcularTempoMedioAnaliseRegional,
  obterTempoMedioPorRegional,
  obterEstatisticasCar,
  type RegistroCar,
  type ResumoUrfbioCar,
  type EstatisticasCarMg,
} from "./car";

describe("Cadastro Ambiental Rural (CAR) - IEF/MG (apps/web/lib/ambiental/car.ts)", () => {
  describe("14 URFBios do IEF/MG", () => {
    it("deve retornar exatamente as 14 URFBios oficiais do IEF/MG", () => {
      const urfbios: ResumoUrfbioCar[] = obterUrfbiosCar();
      expect(urfbios).toHaveLength(14);

      const nomesEsperados = [
        "Alto Paranaíba",
        "Alto Médio São Francisco",
        "Centro-Norte",
        "Centro-Oeste",
        "Centro-Sul",
        "Jequitinhonha",
        "Mata",
        "Metropolitana",
        "Nordeste",
        "Noroeste",
        "Norte",
        "Rio Doce",
        "Sul",
        "Triângulo",
      ];

      const nomesRetornados = urfbios.map((u) => u.nome);
      expect(nomesRetornados).toEqual(nomesEsperados);
    });

    it("deve conter sedes regionais oficiais para todas as 14 URFBios", () => {
      const sedesEsperadas: Record<string, string> = {
        "Alto Paranaíba": "Patos de Minas",
        "Alto Médio São Francisco": "Januária",
        "Centro-Norte": "Curvelo",
        "Centro-Oeste": "Divinópolis",
        "Centro-Sul": "Barbacena",
        Jequitinhonha: "Diamantina",
        Mata: "Ubá",
        Metropolitana: "Belo Horizonte",
        Nordeste: "Teófilo Otoni",
        Noroeste: "Unaí",
        Norte: "Montes Claros",
        "Rio Doce": "Governador Valadares",
        Sul: "Varginha",
        Triângulo: "Uberlândia",
      };

      const urfbios = obterUrfbiosCar();
      for (const u of urfbios) {
        expect(u.sede).toBe(sedesEsperadas[u.nome]);
      }
    });

    it("soma dos imóveis das 14 URFBios deve bater exatamente 1.164.209 imóveis", () => {
      const urfbios = obterUrfbiosCar();
      const somaTotal = urfbios.reduce((acc, u) => acc + u.totalImoveis, 0);
      expect(somaTotal).toBe(1164209);
    });

    it("cada URFBio deve ter soma de pequeno + médio + grande igual ao total de imóveis", () => {
      const urfbios = obterUrfbiosCar();
      for (const u of urfbios) {
        const somaPortes =
          u.divisaoPorte.pequeno + u.divisaoPorte.medio + u.divisaoPorte.grande;
        expect(somaPortes).toBe(u.totalImoveis);
      }
    });

    it("cada URFBio deve possuir métricas consistentes de área, tempo e percentual", () => {
      const urfbios = obterUrfbiosCar();
      for (const u of urfbios) {
        expect(u.areaTotalHectares).toBeGreaterThan(100000);
        expect(u.tempoMedioAnaliseDias).toBeGreaterThan(1000);
        expect(u.percentualEmAnalise).toBeGreaterThan(60);
        expect(u.percentualEmAnalise).toBeLessThan(100);
        expect(u.principaisSetores.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("permite buscar URFBio por ID slug e por nome com tolerância", () => {
      const metro = obterUrfbioPorId("metropolitana");
      expect(metro).toBeDefined();
      expect(metro?.nome).toBe("Metropolitana");
      expect(metro?.sede).toBe("Belo Horizonte");

      const sul = obterUrfbioPorNome("Sul");
      expect(sul).toBeDefined();
      expect(sul?.sede).toBe("Varginha");

      const centroNorte = obterUrfbioPorNome("Centro Norte");
      expect(centroNorte).toBeDefined();
      expect(centroNorte?.nome).toBe("Centro-Norte");

      const inexistente = obterUrfbioPorId("inexistente");
      expect(inexistente).toBeUndefined();
    });
  });

  describe("Amostragem de Registros do CAR", () => {
    it("deve carregar registros com todos os campos obrigatórios e auditáveis", () => {
      const registros: RegistroCar[] = listarRegistrosCar();
      expect(registros.length).toBeGreaterThanOrEqual(50);

      for (const r of registros) {
        expect(r.codigoCar).toMatch(/^MG-31\d{5}-[A-F0-9]{32}$/);
        expect(r.codigoIbge).toBeGreaterThanOrEqual(3100000);
        expect(r.codigoIbge).toBeLessThan(3200000);
        expect(r.municipio).toBeTruthy();
        expect(r.areaHectares).toBeGreaterThan(0);
        expect(r.modulosFiscais).toBeGreaterThan(0);
        expect(["Pequeno", "Médio", "Grande"]).toContain(r.porte);
        expect([
          "Agropecuária",
          "Silvicultura",
          "Mineração",
          "Energia",
          "Misto",
        ]).toContain(r.setor);
        expect([
          "Em Análise",
          "Analisado com Pendências",
          "Analisado Aprovado",
          "Cancelado",
        ]).toContain(r.status);
        expect(r.dataInscricao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(r.tempoAnaliseDias).toBeGreaterThan(500);
        expect(r.linkOficial).toContain("consultapublica.car.gov.br");
        expect(r.linkOficial).toContain(r.codigoCar);
      }
    });

    it("classificação de porte deve ser rigorosa com base em Módulos Fiscais (MF)", () => {
      const registros = listarRegistrosCar();
      for (const r of registros) {
        if (r.modulosFiscais <= 4) {
          expect(r.porte).toBe("Pequeno");
        } else if (r.modulosFiscais <= 15) {
          expect(r.porte).toBe("Médio");
        } else {
          expect(r.porte).toBe("Grande");
        }
      }
    });

    it("deve cobrir todas as 14 URFBios na amostragem", () => {
      const registros = listarRegistrosCar();
      const urfbiosAmostradas = new Set(registros.map((r) => r.urfbio));
      const todasUrfbios = obterUrfbiosCar().map((u) => u.nome);

      for (const nome of todasUrfbios) {
        expect(urfbiosAmostradas.has(nome)).toBe(true);
      }
    });

    it("deve filtrar registros por URFBio", () => {
      const registrosSul = listarRegistrosCar({ urfbio: "Sul" });
      expect(registrosSul.length).toBeGreaterThan(0);
      for (const r of registrosSul) {
        expect(r.urfbio).toBe("Sul");
      }
    });

    it("deve filtrar registros por status", () => {
      const aprovados = listarRegistrosCar({ status: "Analisado Aprovado" });
      expect(aprovados.length).toBeGreaterThan(0);
      for (const r of aprovados) {
        expect(r.status).toBe("Analisado Aprovado");
      }
    });

    it("deve filtrar registros por setor", () => {
      const mineracao = listarRegistrosCar({ setor: "Mineração" });
      expect(mineracao.length).toBeGreaterThan(0);
      for (const r of mineracao) {
        expect(r.setor).toBe("Mineração");
      }
    });

    it("deve filtrar registros por porte", () => {
      const grandes = listarRegistrosCar({ porte: "Grande" });
      expect(grandes.length).toBeGreaterThan(0);
      for (const r of grandes) {
        expect(r.porte).toBe("Grande");
      }
    });

    it("deve filtrar registros por município e código IBGE", () => {
      const bh = listarRegistrosCar({ municipio: "Belo Horizonte" });
      expect(bh.length).toBeGreaterThan(0);
      expect(bh[0].codigoIbge).toBe(3106200);

      const porIbge = listarRegistrosCar({ codigoIbge: 3106705 });
      expect(porIbge.length).toBeGreaterThan(0);
      expect(porIbge[0].municipio).toBe("Betim");
    });

    it("deve filtrar por faixa de área em hectares", () => {
      const filtrados = listarRegistrosCar({
        areaMinimaHa: 1000,
        areaMaximaHa: 2000,
      });
      expect(filtrados.length).toBeGreaterThan(0);
      for (const r of filtrados) {
        expect(r.areaHectares).toBeGreaterThanOrEqual(1000);
        expect(r.areaHectares).toBeLessThanOrEqual(2000);
      }
    });

    it("permite obter registro específico pelo código CAR", () => {
      const registro = obterRegistroPorCodigoCar(
        "MG-3106200-C68C7261F80A4B4B9AE1C37B47E53B18"
      );
      expect(registro).toBeDefined();
      expect(registro?.municipio).toBe("Belo Horizonte");
      expect(registro?.urfbio).toBe("Metropolitana");
    });
  });

  describe("Cálculos de Tempo Médio de Análise", () => {
    it("deve calcular tempo médio geral ponderado e da amostragem", () => {
      const tempoPonderado = calcularTempoMedioAnaliseGeral("ponderado_estado");
      expect(tempoPonderado).toBeGreaterThan(1400);
      expect(tempoPonderado).toBeLessThan(1700);

      const tempoAmostra = calcularTempoMedioAnaliseGeral("amostragem");
      expect(tempoAmostra).toBeGreaterThan(1200);
      expect(tempoAmostra).toBeLessThan(1700);
    });

    it("deve calcular tempo médio regional oficial e da amostragem", () => {
      const tempoSulOficial = calcularTempoMedioAnaliseRegional(
        "Sul",
        "oficial_urfbio"
      );
      expect(tempoSulOficial).toBe(1780);

      const tempoSulAmostra = calcularTempoMedioAnaliseRegional("Sul", "amostragem");
      expect(tempoSulAmostra).toBeGreaterThan(1700);

      const tempoTriangulo = calcularTempoMedioAnaliseRegional("triangulo");
      expect(tempoTriangulo).toBe(1280);

      const invalido = calcularTempoMedioAnaliseRegional("regional-fantasma");
      expect(invalido).toBeNull();
    });

    it("deve retornar mapa completo com as 14 regionais e seus tempos médios", () => {
      const mapa = obterTempoMedioPorRegional();
      const chaves = Object.keys(mapa);
      expect(chaves).toHaveLength(14);
      for (const k of chaves) {
        expect(mapa[k]).toBeGreaterThan(1000);
      }
    });
  });

  describe("Estatísticas Consolidadas do CAR em MG", () => {
    it("deve compilar estatísticas completas do estado e da amostragem", () => {
      const stats: EstatisticasCarMg = obterEstatisticasCar();

      expect(stats.totalImoveis).toBe(1164209);
      expect(stats.areaTotalHectares).toBeGreaterThan(40000000);
      expect(stats.totalUrfbios).toBe(14);
      expect(stats.totalRegistrosAmostragem).toBeGreaterThanOrEqual(50);
      expect(stats.tempoMedioAnaliseDias).toBeGreaterThan(1400);
      expect(stats.percentualEmAnalise).toBeGreaterThan(70);

      // Distribuição por porte do estado
      expect(stats.distribuicaoPorte.pequeno).toBeGreaterThan(1000000);
      expect(stats.distribuicaoPorte.medio).toBeGreaterThan(50000);
      expect(stats.distribuicaoPorte.grande).toBeGreaterThan(20000);

      // Distribuição de status da amostragem
      expect(stats.distribuicaoStatusAmostragem["Em Análise"]).toBeGreaterThan(0);
      expect(stats.distribuicaoStatusAmostragem["Analisado Aprovado"]).toBeGreaterThan(0);
      expect(stats.distribuicaoStatusAmostragem["Analisado com Pendências"]).toBeGreaterThan(0);

      // Distribuição de setores da amostragem
      expect(stats.distribuicaoSetoresAmostragem["Agropecuária"]).toBeGreaterThan(0);
      expect(stats.distribuicaoSetoresAmostragem["Silvicultura"]).toBeGreaterThan(0);
      expect(stats.distribuicaoSetoresAmostragem["Mineração"]).toBeGreaterThan(0);
      expect(stats.distribuicaoSetoresAmostragem["Energia"]).toBeGreaterThan(0);
      expect(stats.distribuicaoSetoresAmostragem["Misto"]).toBeGreaterThan(0);
    });
  });

  describe("Garantia Editorial e Proteção de Dados Pessoais", () => {
    it("não deve conter CPF de pessoas físicas nos dados (nenhuma sequência de 11 dígitos contínuos)", () => {
      const registros = listarRegistrosCar();
      for (const r of registros) {
        const str = JSON.stringify(r);
        expect(str).not.toMatch(/\d{11}/);
      }
    });
  });
});
