/**
 * @file apps/web/lib/ambiente/dados-ameacas-americas.test.ts
 * @description Suíte de testes unitários para o acervo de Ameaças Ambientais nas Américas.
 *
 * Papel no portal:
 * Garante a integridade referencial, metodológica, geográfica e de privacidade
 * dos dados de Espécies, Rios, Serras e Comunidades Tradicionais decodificados
 * a partir do acervo compacto.
 *
 * Regras verificadas:
 * - Quantidades mínimas estipuladas: 30+ espécies, 15+ rios, 15+ serras, 25+ comunidades (AGENTS.md).
 * - Coerência matemática dos agregados de COBERTURA_AMEACAS_AMERICAS.
 * - Hiperlinks oficiais diretos verificáveis (começando com https://).
 * - Busca tolerante a acentos e filtragem multifacetada.
 * - Formato e integridade do arquivo CSV gerado (BOM UTF-8 e separador ';').
 * - Zero dados pessoais / sem CPFs no acervo (AGENTS.md §5.2).
 */

import { describe, it, expect } from "vitest";
import {
  obterTodasAmeacas,
  obterEspeciesAmeacadas,
  obterRiosAmeacados,
  obterSerrasAmeacadas,
  obterComunidadesTradicionais,
  obterAmeacaPorId,
  obterAmeacasPorGrauRisco,
  obterAmeacasPorPais,
  filtrarAmeacas,
  calcularEstatisticasAmeacas,
  gerarCsvAmeacas,
  COBERTURA_AMEACAS_AMERICAS,
} from "./dados-ameacas-americas";

describe("Acervo de Ameaças Ambientais nas Américas (lib/ambiente/dados-ameacas-americas)", () => {
  it("deve carregar todos os 90 registros catalogados nas Américas", () => {
    const ameacas = obterTodasAmeacas();
    expect(ameacas.length).toBe(90);
    expect(ameacas.length).toBe(COBERTURA_AMEACAS_AMERICAS.totalAmeacas);
  });

  it("deve cumprir as cotas mínimas obrigatórias por categoria", () => {
    const especies = obterEspeciesAmeacadas();
    const rios = obterRiosAmeacados();
    const serras = obterSerrasAmeacadas();
    const comunidades = obterComunidadesTradicionais();

    expect(especies.length).toBeGreaterThanOrEqual(30);
    expect(especies.length).toBe(32);
    expect(rios.length).toBeGreaterThanOrEqual(15);
    expect(rios.length).toBe(16);
    expect(serras.length).toBeGreaterThanOrEqual(15);
    expect(serras.length).toBe(16);
    expect(comunidades.length).toBeGreaterThanOrEqual(25);
    expect(comunidades.length).toBe(26);

    expect(especies.length).toBe(COBERTURA_AMEACAS_AMERICAS.contagemPorCategoria.especie);
    expect(rios.length).toBe(COBERTURA_AMEACAS_AMERICAS.contagemPorCategoria.rio);
    expect(serras.length).toBe(COBERTURA_AMEACAS_AMERICAS.contagemPorCategoria.serra);
    expect(comunidades.length).toBe(COBERTURA_AMEACAS_AMERICAS.contagemPorCategoria.comunidade);
  });

  it("deve conter todos os campos obrigatórios preenchidos e válidos em todos os registros", () => {
    const ameacas = obterTodasAmeacas();

    for (const a of ameacas) {
      expect(a.id).toBeDefined();
      expect(a.id.trim().length).toBeGreaterThan(0);
      expect(a.nome).toBeDefined();
      expect(a.nome.trim().length).toBeGreaterThan(0);
      expect(a.subtitulo).toBeDefined();
      expect(a.subtitulo.trim().length).toBeGreaterThan(0);
      expect(a.categoria).toMatch(/^(especie|rio|serra|comunidade)$/);
      expect(a.pais).toBeDefined();
      expect(a.pais.trim().length).toBeGreaterThan(0);
      expect(a.regiao).toBeDefined();
      expect(a.regiao.trim().length).toBeGreaterThan(0);
      expect(a.bioma).toBeDefined();
      expect(a.bioma.trim().length).toBeGreaterThan(0);
      expect(a.statusConservacao).toBeDefined();
      expect(a.statusConservacao.trim().length).toBeGreaterThan(0);
      expect(a.grauRisco).toMatch(/^(Crítico|Alto|Moderado)$/);
      expect(a.vetoresPressao).toBeDefined();
      expect(a.vetoresPressao.trim().length).toBeGreaterThan(10);
      expect(a.extensaoOuPopulacao).toBeDefined();
      expect(a.extensaoOuPopulacao.trim().length).toBeGreaterThan(0);
      expect(typeof a.anoReferencia).toBe("number");
      expect(a.anoReferencia).toBeGreaterThanOrEqual(2020);
      expect(a.orgaoResponsavel).toBeDefined();
      expect(a.orgaoResponsavel.trim().length).toBeGreaterThan(0);
      expect(a.fonteOficial).toBeDefined();
      expect(a.fonteOficial.trim().length).toBeGreaterThan(0);
      expect(a.urlFonte).toMatch(/^https?:\/\//);
      expect(a.descricaoImpacto).toBeDefined();
      expect(a.descricaoImpacto.trim().length).toBeGreaterThan(20);
    }
  });

  it("deve encontrar registros emblemáticos específicos por id", () => {
    const onca = obterAmeacaPorId("esp-onca-pintada");
    expect(onca).toBeDefined();
    expect(onca?.nome).toBe("Onça-pintada");
    expect(onca?.subtitulo).toBe("Panthera onca");

    const doce = obterAmeacaPorId("rio-doce");
    expect(doce).toBeDefined();
    expect(doce?.nome).toBe("Rio Doce");
    expect(doce?.grauRisco).toBe("Crítico");

    const curral = obterAmeacaPorId("ser-curral");
    expect(curral).toBeDefined();
    expect(curral?.nome).toBe("Serra do Curral");

    const yanomami = obterAmeacaPorId("com-yanomami");
    expect(yanomami).toBeDefined();
    expect(yanomami?.nome).toBe("Terra Indígena Yanomami");
  });

  it("deve filtrar corretamente por grau de risco e por país", () => {
    const criticos = obterAmeacasPorGrauRisco("Crítico");
    expect(criticos.length).toBeGreaterThan(0);
    expect(criticos.every((c) => c.grauRisco === "Crítico")).toBe(true);

    const brasil = obterAmeacasPorPais("Brasil");
    expect(brasil.length).toBeGreaterThan(30);
    expect(brasil.every((b) => b.pais.includes("Brasil"))).toBe(true);

    const eua = obterAmeacasPorPais("Estados Unidos");
    expect(eua.length).toBeGreaterThan(5);
  });

  it("deve realizar busca textual multirrelevante e tolerante a acentos", () => {
    // Busca sem acento para encontrar 'Brumadinho' ou 'Paraopeba'
    const buscaParaopeba = filtrarAmeacas({ busca: "paraopeba" });
    expect(buscaParaopeba.length).toBeGreaterThan(0);
    expect(buscaParaopeba.some((i) => i.id === "rio-paraopeba")).toBe(true);

    // Busca com acento
    const buscaOnca = filtrarAmeacas({ busca: "Onça" });
    expect(buscaOnca.length).toBeGreaterThan(0);
    expect(buscaOnca.some((i) => i.id === "esp-onca-pintada")).toBe(true);

    // Busca combinada por categoria e busca textual
    const buscaRiosBrasil = filtrarAmeacas({
      categoria: "rio",
      pais: "Brasil",
    });
    expect(buscaRiosBrasil.length).toBeGreaterThan(5);
    expect(buscaRiosBrasil.every((r) => r.categoria === "rio")).toBe(true);
  });

  it("deve calcular estatísticas coerentes com o total do acervo", () => {
    const stats = calcularEstatisticasAmeacas();
    expect(stats.totalRegistros).toBe(90);
    expect(stats.totalEspecies).toBe(32);
    expect(stats.totalRios).toBe(16);
    expect(stats.totalSerras).toBe(16);
    expect(stats.totalComunidades).toBe(26);
    expect(stats.totalPaises).toBeGreaterThanOrEqual(10);
    expect(
      stats.contagemPorRisco["Crítico"] +
        stats.contagemPorRisco["Alto"] +
        stats.contagemPorRisco["Moderado"]
    ).toBe(90);
  });

  it("deve gerar CSV válido com BOM UTF-8 e separador ';'", () => {
    const ameacas = obterTodasAmeacas().slice(0, 10);
    const csv = gerarCsvAmeacas(ameacas);

    // Deve começar com BOM UTF-8
    expect(csv.startsWith("\uFEFF")).toBe(true);

    // Cabeçalho deve usar ponto e vírgula
    const linhas = csv.replace("\uFEFF", "").trim().split("\r\n");
    expect(linhas.length).toBe(11); // 1 cabeçalho + 10 dados
    expect(linhas[0]).toContain("Categoria;Nome;Subtítulo");
    expect(linhas[1]).toContain(";");
  });

  it("não deve conter dados pessoais sensíveis ou números de CPF no acervo", () => {
    const ameacas = obterTodasAmeacas();
    const padraoCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const a of ameacas) {
      const serializado = JSON.stringify(a);
      const match = serializado.match(padraoCpf);
      if (match) {
        // Se encontrou algo no formato de CPF, valida se é CPF válido por mod-11
        const digitos = match[0].replace(/\D/g, "");
        if (digitos.length === 11) {
          // Checagem mod-11
          let soma = 0;
          for (let i = 0; i < 9; i++) soma += parseInt(digitos[i]) * (10 - i);
          let resto = 11 - (soma % 11);
          const dv1 = resto >= 10 ? 0 : resto;

          soma = 0;
          for (let i = 0; i < 10; i++) soma += parseInt(digitos[i]) * (11 - i);
          resto = 11 - (soma % 11);
          const dv2 = resto >= 10 ? 0 : resto;

          const ehCpfValido =
            parseInt(digitos[9]) === dv1 && parseInt(digitos[10]) === dv2;
          expect(ehCpfValido).toBe(false);
        }
      }
    }
  });
});
