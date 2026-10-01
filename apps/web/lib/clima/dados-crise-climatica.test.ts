/**
 * @file apps/web/lib/clima/dados-crise-climatica.test.ts
 * @description Suíte de testes unitários para o módulo de dados da Crise Climática Global.
 *
 * Papel no portal:
 * Assegura a integridade das consultas aos dados compactados (G20, instalações industriais,
 * anomalias Copernicus/WMO e NDCs setoriais), verificando os cálculos de equivalência,
 * os filtros de texto e faceta, as exportações CSV e as constantes agregadas de topo.
 *
 * Fontes oficiais testadas:
 * - Climate TRACE, IPCC AR6, Copernicus ECMWF, WMO e UNFCCC.
 */

import { describe, it, expect } from "vitest";
import {
  obterEmissoesG20,
  obterInstalacoesPoluidoras,
  obterAnomaliasEventosExtremos,
  obterNdcsESetores,
  filtrarEmissoesG20,
  filtrarInstalacoes,
  filtrarAnomalias,
  filtrarNdcsSetores,
  calcularEquivalenciaCarrosPasseio,
  exportarCsvEmissoesG20,
  exportarCsvInstalacoes,
  exportarCsvAnomalias,
  exportarCsvNdcsSetores,
  COBERTURA_CRISE_CLIMATICA,
} from "./dados-crise-climatica";

describe("Módulo de Dados da Crise Climática Global", () => {
  describe("1. Emissões dos Países do G20", () => {
    it("deve carregar exatamente 20 países/blocos econômicos do G20", () => {
      const paises = obterEmissoesG20();
      expect(paises).toHaveLength(20);
    });

    it("deve conter a China como maior emissor e os EUA como segundo", () => {
      const paises = obterEmissoesG20();
      const china = paises.find((p) => p.codigoIso3 === "CHN");
      const eua = paises.find((p) => p.codigoIso3 === "USA");

      expect(china).toBeDefined();
      expect(china?.emissoesTotaisMtCo2e).toBeGreaterThan(10000);
      expect(eua).toBeDefined();
      expect(eua?.emissoesTotaisMtCo2e).toBeGreaterThan(5000);
      expect(china!.emissoesTotaisMtCo2e).toBeGreaterThan(eua!.emissoesTotaisMtCo2e);
    });

    it("deve incluir o Brasil com emissões acima de 2.000 Mt CO₂e e setor líder de desmatamento", () => {
      const paises = obterEmissoesG20();
      const brasil = paises.find((p) => p.codigoIso3 === "BRA");

      expect(brasil).toBeDefined();
      expect(brasil?.pais).toBe("Brasil");
      expect(brasil?.emissoesTotaisMtCo2e).toBe(2320);
      expect(brasil?.setorLiderEmissao).toContain("Desmatamento");
      expect(brasil?.urlFonteOficial).toMatch(/^https?:\/\//);
    });

    it("deve filtrar países por termo de busca tolerante a acentos", () => {
      const resultado = filtrarEmissoesG20({ busca: "japao" });
      expect(resultado.length).toBeGreaterThanOrEqual(1);
      expect(resultado.some((p) => p.codigoIso3 === "JPN")).toBe(true);
    });

    it("deve filtrar países por continente", () => {
      const amSul = filtrarEmissoesG20({ continente: "América do Sul" });
      expect(amSul.map((p) => p.codigoIso3)).toEqual(
        expect.arrayContaining(["BRA", "ARG"])
      );
    });
  });

  describe("2. Maiores Instalações Poluidoras Globais", () => {
    it("deve carregar 20 instalações industriais pontuais com coordenadas válidas", () => {
      const instalacoes = obterInstalacoesPoluidoras();
      expect(instalacoes).toHaveLength(20);

      for (const inst of instalacoes) {
        expect(inst.latitude).toBeGreaterThanOrEqual(-90);
        expect(inst.latitude).toBeLessThanOrEqual(90);
        expect(inst.longitude).toBeGreaterThanOrEqual(-180);
        expect(inst.longitude).toBeLessThanOrEqual(180);
        expect(inst.emissoesAnuaisMtCo2e).toBeGreaterThan(0);
        expect(inst.urlFonteOficial).toMatch(/^https?:\/\//);
      }
    });

    it("deve conter o complexo Secunda Synfuels (Sasol) como a maior instalação pontual", () => {
      const instalacoes = obterInstalacoesPoluidoras();
      const secunda = instalacoes.find((i) => i.id === "inst-01");

      expect(secunda).toBeDefined();
      expect(secunda?.operadorControlador).toContain("Sasol");
      expect(secunda?.emissoesAnuaisMtCo2e).toBeGreaterThan(50);
      expect(secunda?.equivalenciaCarrosPasseioMilhoes).toBeGreaterThan(10);
    });

    it("deve incluir instalações brasileiras de referência (Carajás, Replan e Jorge Lacerda)", () => {
      const instalacoes = obterInstalacoesPoluidoras();
      const brasilInst = instalacoes.filter((i) => i.codigoIso3 === "BRA");

      expect(brasilInst.length).toBeGreaterThanOrEqual(3);
      expect(brasilInst.some((i) => i.nomeInstalacao.includes("Carajás"))).toBe(true);
      expect(brasilInst.some((i) => i.nomeInstalacao.includes("Paulínia"))).toBe(true);
      expect(brasilInst.some((i) => i.nomeInstalacao.includes("Jorge Lacerda"))).toBe(true);
    });

    it("deve filtrar instalações por tipo de atividade", () => {
      const termoeletricas = filtrarInstalacoes({ tipoAtividade: "Termelétrica a Carvão" });
      expect(termoeletricas.length).toBeGreaterThanOrEqual(5);
      expect(termoeletricas.every((i) => i.tipoAtividade === "Termelétrica a Carvão")).toBe(true);
    });
  });

  describe("3. Anomalias Térmicas e Eventos Extremos (Copernicus + WMO)", () => {
    it("deve carregar 12 eventos climáticos e anomalias de referência", () => {
      const anomalias = obterAnomaliasEventosExtremos();
      expect(anomalias).toHaveLength(12);
    });

    it("deve registrar o recorde térmico global de 2024 (+1,64°C)", () => {
      const anomalias = obterAnomaliasEventosExtremos();
      const recorde2024 = anomalias.find((a) => a.id === "evt-01");

      expect(recorde2024).toBeDefined();
      expect(recorde2024?.anomaliaOuMagnitude).toContain("+1,64°C");
      expect(recorde2024?.orgaoMonitoramento).toContain("Copernicus");
      expect(recorde2024?.urlBoletimOficial).toMatch(/^https?:\/\//);
    });

    it("deve registrar a seca extrema na Amazônia e as enchentes no RS", () => {
      const anomalias = obterAnomaliasEventosExtremos();
      const amazonia = anomalias.find((a) => a.id === "evt-04");
      const rs = anomalias.find((a) => a.id === "evt-05");

      expect(amazonia).toBeDefined();
      expect(amazonia?.anomaliaOuMagnitude).toContain("12,70 m");
      expect(rs).toBeDefined();
      expect(rs?.anomaliaOuMagnitude).toContain("5,35 m");
      expect(rs?.danosEconomicosUsdBilhoes).toBeGreaterThan(10);
    });

    it("deve filtrar eventos por categoria", () => {
      const secas = filtrarAnomalias({ categoria: "Seca & Crise Hídrica" });
      expect(secas.length).toBeGreaterThanOrEqual(2);
      expect(secas.every((s) => s.categoria === "Seca & Crise Hídrica")).toBe(true);
    });
  });

  describe("4. Metas das NDCs e Intensidade de Carbono por Setor", () => {
    it("deve carregar 10 setores econômicos de mitigação", () => {
      const setores = obterNdcsESetores();
      expect(setores).toHaveLength(10);
    });

    it("deve identificar a geração elétrica como o maior emissor setorial", () => {
      const setores = obterNdcsESetores();
      const energia = setores.find((s) => s.id === "setor-01");

      expect(energia).toBeDefined();
      expect(energia?.emissaoGlobalAnualGtCo2e).toBeGreaterThan(14);
      expect(energia?.potencialReducaoPct).toBeGreaterThan(90);
    });

    it("deve filtrar setores por texto de tecnologia", () => {
      const hidrogenio = filtrarNdcsSetores({ busca: "hidrogênio" });
      expect(hidrogenio.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("5. Funções de Cálculo e Conversão", () => {
    it("deve calcular a equivalência veicular corretamente com fator EPA", () => {
      // 4,6 Mt CO₂e = 1 milhão de veículos
      expect(calcularEquivalenciaCarrosPasseio(4.6)).toBe(1.0);
      expect(calcularEquivalenciaCarrosPasseio(9.2)).toBe(2.0);
      expect(calcularEquivalenciaCarrosPasseio(0)).toBe(0);
    });
  });

  describe("6. Exportações CSV no Padrão Brasileiro (BOM UTF-8 e ;)", () => {
    it("deve exportar CSV de países do G20 com BOM UTF-8 e cabeçalho adequado", () => {
      const csv = exportarCsvEmissoesG20(obterEmissoesG20().slice(0, 3));
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("País;Código ISO-3;Continente;Emissões Totais");
      expect(csv).toContain('"China";"CHN";"Ásia"');
    });

    it("deve exportar CSV de instalações com coordenadas e equivalência", () => {
      const csv = exportarCsvInstalacoes(obterInstalacoesPoluidoras().slice(0, 3));
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Instalação / Complexo;Operador / Controlador");
      expect(csv).toContain("Secunda Synfuels");
    });

    it("deve exportar CSV de anomalias com danos econômicos", () => {
      const csv = exportarCsvAnomalias(obterAnomaliasEventosExtremos().slice(0, 3));
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Título do Evento;Categoria;Região Afetada");
      expect(csv).toContain("Prejuízos Econômicos");
    });

    it("deve exportar CSV de NDCs e intensidades setoriais", () => {
      const csv = exportarCsvNdcsSetores(obterNdcsESetores().slice(0, 3));
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Setor Econômico;Subsetor;Unidade de Intensidade");
    });
  });

  describe("7. Constante Agregada COBERTURA_CRISE_CLIMATICA", () => {
    it("deve expor agregados pré-calculados medidos e consistentes", () => {
      expect(COBERTURA_CRISE_CLIMATICA.totalPaisesG20).toBe(20);
      expect(COBERTURA_CRISE_CLIMATICA.totalInstalacoesPoluidoras).toBe(20);
      expect(COBERTURA_CRISE_CLIMATICA.totalEventosAnomalias).toBe(12);
      expect(COBERTURA_CRISE_CLIMATICA.totalSetoresNdc).toBe(10);
      expect(COBERTURA_CRISE_CLIMATICA.somaEmissoesG20MtCo2e).toBeGreaterThan(40000);
      expect(COBERTURA_CRISE_CLIMATICA.participacaoG20GlobalPct).toBeGreaterThan(70);
      expect(COBERTURA_CRISE_CLIMATICA.emissaoBrasilMtCo2e).toBe(2320);
      expect(COBERTURA_CRISE_CLIMATICA.dataMedicao).toBe("2026-10-01");
    });
  });
});
