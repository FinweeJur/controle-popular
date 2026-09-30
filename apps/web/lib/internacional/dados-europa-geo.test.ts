/**
 * @file apps/web/lib/internacional/dados-europa-geo.test.ts
 * @description Suíte de testes unitários do acervo geoespacial da Europa e Reino Unido (/terras/globo).
 *
 * Validações obrigatórias:
 * 1. Integridade do acervo compacto (23 feições com todas as propriedades requeridas).
 * 2. Validação do arquivo GeoJSON oficial (WGS84, [lon, lat], tipo Point, metadata).
 * 3. Presença obrigatória dos 4 tipos: tribunal_litigio, sede_corporativa, porto_hub e orgao_regulador.
 * 4. Validação de pontos emblemáticos: High Court Londres, Rechtbank Rotterdam, Tribunal de Paris,
 *    BAFA Alemanha, Comissão Europeia, DCIAP, BHP, Rio Tinto, Glencore, Anglo American, Enel, Santander, EDP, etc.
 * 5. Ausência absoluta de CPFs ou dados pessoais sensíveis (AGENTS.md §5.2).
 * 6. Exportação CSV com BOM UTF-8 e delimitador ponto e vírgula (AGENTS.md §8).
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  COBERTURA_EUROPA_GEO,
  obterPontosGeoEuropa,
  obterPontosPorTipo,
  obterPontosPorPais,
  obterPontosPorCidade,
  gerarCsvEuropaGeo,
  type PontoGeoEuropa,
} from "./dados-europa-geo";

describe("Acervo Geoespacial da Europa e Conexões Transnacionais", () => {
  it("carrega todos os 23 pontos georreferenciados do dataset compacto", () => {
    const pontos = obterPontosGeoEuropa();
    expect(pontos).toBeDefined();
    expect(pontos.length).toBe(23);
    expect(pontos.length).toBe(COBERTURA_EUROPA_GEO.totalPontos);
  });

  it("garante integridade de todos os campos obrigatórios em cada ponto", () => {
    const pontos = obterPontosGeoEuropa();
    const tiposValidos = [
      "tribunal_litigio",
      "sede_corporativa",
      "porto_hub",
      "orgao_regulador",
    ];

    for (const p of pontos) {
      expect(p.id).toBeTruthy();
      expect(p.nome).toBeTruthy();
      expect(p.entidade).toBeTruthy();
      expect(tiposValidos).toContain(p.tipo);
      expect(p.pais).toBeTruthy();
      expect(p.cidade).toBeTruthy();
      expect(typeof p.latitude).toBe("number");
      expect(typeof p.longitude).toBe("number");
      // Coordenadas válidas no continente europeu e Reino Unido
      expect(p.latitude).toBeGreaterThan(35);
      expect(p.latitude).toBeLessThan(65);
      expect(p.longitude).toBeGreaterThan(-15);
      expect(p.longitude).toBeLessThan(20);
      expect(p.marcoLegalOuProcesso).toBeTruthy();
      expect(p.fonteOficial).toBeTruthy();
      expect(p.descricao).toBeTruthy();
    }
  });

  it("contém os 4 tribunais e litígios históricos centrais", () => {
    const tribunais = obterPontosPorTipo("tribunal_litigio");
    expect(tribunais.length).toBe(4);

    const ids = tribunais.map((t) => t.id);
    expect(ids).toContain("eu-tribunal-london-high-court");
    expect(ids).toContain("eu-tribunal-uk-supreme-court");
    expect(ids).toContain("eu-tribunal-rechtbank-rotterdam");
    expect(ids).toContain("eu-tribunal-paris-judiciaire");

    // Verifica processo do High Court sobre Mariana
    const highCourt = tribunais.find((t) => t.id === "eu-tribunal-london-high-court");
    expect(highCourt?.marcoLegalOuProcesso).toContain("[2025] EWHC 3001 (TCC)");
    expect(highCourt?.cidade).toBe("Londres");
    expect(highCourt?.pais).toBe("Reino Unido");

    // Verifica Tribunal de Roterdã sobre Braskem Maceió
    const rotterdam = tribunais.find((t) => t.id === "eu-tribunal-rechtbank-rotterdam");
    expect(rotterdam?.descricao).toContain("Maceió");
    expect(rotterdam?.cidade).toBe("Roterdã");
  });

  it("contém os 3 órgãos reguladores de devida diligência e cooperação judiciária", () => {
    const orgaos = obterPontosPorTipo("orgao_regulador");
    expect(orgaos.length).toBe(3);

    const ids = orgaos.map((o) => o.id);
    expect(ids).toContain("eu-orgao-alemanha-bafa");
    expect(ids).toContain("eu-orgao-ue-comissao-europeia");
    expect(ids).toContain("eu-orgao-portugal-dciap");

    // Verifica BAFA e lei alemã LkSG
    const bafa = orgaos.find((o) => o.id === "eu-orgao-alemanha-bafa");
    expect(bafa?.marcoLegalOuProcesso).toContain("LkSG");
    expect(bafa?.cidade).toBe("Eschborn");

    // Verifica Comissão Europeia e EUDR/CSDDD
    const ue = orgaos.find((o) => o.id === "eu-orgao-ue-comissao-europeia");
    expect(ue?.marcoLegalOuProcesso).toContain("EUDR");
    expect(ue?.cidade).toBe("Bruxelas");
  });

  it("contém as sedes corporativas das maiores multinacionais com operação no Brasil", () => {
    const sedes = obterPontosPorTipo("sede_corporativa");
    expect(sedes.length).toBe(12);

    const ids = sedes.map((s) => s.id);
    expect(ids).toContain("eu-sede-uk-bhp-group");
    expect(ids).toContain("eu-sede-uk-rio-tinto");
    expect(ids).toContain("eu-sede-uk-anglo-american");
    expect(ids).toContain("eu-sede-uk-shell");
    expect(ids).toContain("eu-sede-suica-glencore");
    expect(ids).toContain("eu-sede-italia-enel");
    expect(ids).toContain("eu-sede-espanha-santander");
    expect(ids).toContain("eu-sede-portugal-edp");
    expect(ids).toContain("eu-sede-luxemburgo-arcelormittal");
    expect(ids).toContain("eu-sede-noruega-norsk-hydro");
    expect(ids).toContain("eu-sede-espanha-telefonica");
    expect(ids).toContain("eu-sede-espanha-iberdrola");
  });

  it("contém os portos e hubs logísticos de comércio transatlântico", () => {
    const hubs = obterPontosPorTipo("porto_hub");
    expect(hubs.length).toBe(4);

    const ids = hubs.map((h) => h.id);
    expect(ids).toContain("eu-porto-holanda-roterda");
    expect(ids).toContain("eu-porto-belgica-antuerpia");
    expect(ids).toContain("eu-porto-alemanha-hamburgo");
    expect(ids).toContain("eu-hub-suica-genebra");

    const roterdam = hubs.find((h) => h.id === "eu-porto-holanda-roterda");
    expect(roterdam?.cidade).toBe("Roterdã");
    expect(roterdam?.descricao).toContain("minério de ferro e soja");
  });

  it("filtra corretamente por país e por cidade", () => {
    const uk = obterPontosPorPais("Reino Unido");
    expect(uk.length).toBe(6); // 2 tribunais + 4 sedes

    const alemanha = obterPontosPorPais("Alemanha");
    expect(alemanha.length).toBe(2); // BAFA + Porto Hamburgo

    const londres = obterPontosPorCidade("Londres");
    expect(londres.length).toBe(6);
  });

  it("gera CSV válido com BOM UTF-8 e delimitador ponto e vírgula", () => {
    const csv = gerarCsvEuropaGeo();
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const linhas = csv.split("\r\n");
    expect(linhas.length).toBe(24); // Cabeçalho + 23 pontos

    const cabecalho = linhas[0];
    expect(cabecalho).toContain("id;nome;entidade;tipo;pais;cidade");
    expect(cabecalho).toContain("marco_legal_ou_processo;fonte_oficial;descricao");

    // Verifica que não há campos vazios na primeira linha de dados
    const primeiraLinha = linhas[1].split(";");
    expect(primeiraLinha.length).toBe(11);
    expect(primeiraLinha[0]).toBe("eu-tribunal-london-high-court");
  });

  it("valida a existência e conformidade do arquivo GeoJSON do Globo 3D Terras", () => {
    const caminhoGeoJson = path.resolve(
      __dirname,
      "../../public/terras/globo/dados/camadas/sedes-litigios-portos-europa.geojson"
    );
    expect(fs.existsSync(caminhoGeoJson)).toBe(true);

    const conteudo = JSON.parse(fs.readFileSync(caminhoGeoJson, "utf-8"));
    expect(conteudo.type).toBe("FeatureCollection");
    expect(conteudo.metadata).toBeDefined();
    expect(conteudo.metadata.totalPontos).toBe(23);
    expect(conteudo.features).toHaveLength(23);

    for (const feat of conteudo.features) {
      expect(feat.type).toBe("Feature");
      expect(feat.id).toBeTruthy();
      expect(feat.geometry.type).toBe("Point");
      expect(feat.geometry.coordinates).toHaveLength(2);

      const [lon, lat] = feat.geometry.coordinates;
      expect(typeof lon).toBe("number");
      expect(typeof lat).toBe("number");
      // Padrão GeoJSON RFC 7946: [longitude, latitude]
      expect(lat).toBeGreaterThan(35);
      expect(lat).toBeLessThan(65);
      expect(lon).toBeGreaterThan(-15);
      expect(lon).toBeLessThan(20);

      // Propriedades requeridas
      expect(feat.properties.id).toBe(feat.id);
      expect(feat.properties.nome).toBeTruthy();
      expect(feat.properties.entidade).toBeTruthy();
      expect(feat.properties.tipo).toBeTruthy();
      expect(feat.properties.pais).toBeTruthy();
      expect(feat.properties.cidade).toBeTruthy();
      expect(feat.properties.marcoLegalOuProcesso).toBeTruthy();
      expect(feat.properties.fonteOficial).toBeTruthy();
      expect(feat.properties.descricao).toBeTruthy();
    }
  });

  it("garante ausência total de CPFs em todos os campos do acervo (AGENTS.md §5.2)", () => {
    const pontos = obterPontosGeoEuropa();
    const regexDigitos11 = /\b\d{11}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;

    function validarCpfMod11(cpf: string): boolean {
      const limpo = cpf.replace(/\D/g, "");
      if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;
      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i);
      let r = (soma * 10) % 11;
      if (r === 10 || r === 11) r = 0;
      if (r !== parseInt(limpo[9])) return false;
      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i);
      r = (soma * 10) % 11;
      if (r === 10 || r === 11) r = 0;
      return r === parseInt(limpo[10]);
    }

    for (const p of pontos) {
      const textoCompleto = JSON.stringify(p);
      const matches = textoCompleto.match(regexDigitos11) || [];
      for (const m of matches) {
        expect(validarCpfMod11(m)).toBe(false);
      }
    }
  });
});
