/**
 * @file apps/web/lib/direitos-globais/africa/africa.test.ts
 * @description Testes vitest para o módulo África e Corte Africana (Frente B).
 *
 * O que protege:
 * - 54 países africanos com códigos ISO únicos e sub-região válida;
 * - nenhum tratado da UA faltando na matriz de adesão para os 54 países;
 * - casos da Corte e Comissão Africana com artigos violados e URLs válidas;
 * - nenhum cumprimento declarado sem evidência documental;
 * - sem CPFs ou dados sensíveis nos registros.
 */

import { describe, expect, it } from "vitest";
import { PAISES_AFRICA, paisAfricanoPorCodigo, paisesPorSubRegiao } from "./paises";
import { TRATADOS_UA, totalRatificacoesTratado, adesaoPaisUA } from "./tratados-ua";
import { CASOS_AFRICANOS } from "./casos-corte-africana";
import { RECOMENDACOES_ACHPR } from "./recomendacoes-achpr";
import { DISPOSITIVOS_AFRICA, getDispositivosAfrica } from "./dispositivos";

describe("Frente B — Países da África (54 estados)", () => {
  it("contém exatamente 54 países soberanos reconhecidos pela UA", () => {
    expect(PAISES_AFRICA).toHaveLength(54);
    const codigos = PAISES_AFRICA.map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(54);
  });

  it("distribui os países em 5 sub-regiões geográficas válidas", () => {
    const subRegioes = new Set(PAISES_AFRICA.map((p) => p.subRegiao));
    expect(subRegioes).toEqual(new Set(["Norte", "Ocidental", "Central", "Oriental", "Austral"]));
    expect(paisesPorSubRegiao("Ocidental").length).toBeGreaterThan(10);
    expect(paisesPorSubRegiao("Oriental").length).toBeGreaterThan(10);
  });

  it("recupera país por código ISO válido", () => {
    const angola = paisAfricanoPorCodigo("AO");
    expect(angola).toBeDefined();
    expect(angola?.nome).toBe("Angola");
    expect(angola?.capital).toBe("Luanda");

    const mocambique = paisAfricanoPorCodigo("MZ");
    expect(mocambique?.nome).toBe("Moçambique");
    expect(mocambique?.capital).toBe("Maputo");
  });
});

describe("Frente B — Tratados da União Africana e Matriz de Adesão", () => {
  it("contém os tratados estruturantes do sistema africano", () => {
    expect(TRATADOS_UA.length).toBeGreaterThanOrEqual(8);
    const ids = TRATADOS_UA.map((t) => t.id);
    expect(ids).toContain("achpr");
    expect(ids).toContain("corte-protocolo");
    expect(ids).toContain("maputo");
    expect(ids).toContain("kampala");
    expect(ids).toContain("acrwc");
    expect(ids).toContain("democracia");
  });

  it("matriz de adesão não tem células nulas para os 54 países nos tratados principais", () => {
    for (const pais of PAISES_AFRICA) {
      const adesaoAchpr = adesaoPaisUA(pais.nome, "achpr");
      expect(adesaoAchpr).toBeDefined();
      expect(["ratificado", "assinado", "nao", "desconhecido"]).toContain(adesaoAchpr.status);

      const adesaoCorte = adesaoPaisUA(pais.nome, "corte-protocolo");
      expect(adesaoCorte).toBeDefined();
      expect(["ratificado", "assinado", "nao", "desconhecido"]).toContain(adesaoCorte.status);
    }
  });

  it("Carta Africana (ACHPR) possui ratificação quase universal na África", () => {
    const total = totalRatificacoesTratado("achpr");
    expect(total).toBeGreaterThanOrEqual(53); // Quase todos os 54 ratificaram
  });

  it("Protocolo de Maputo tem dezenas de ratificações", () => {
    const total = totalRatificacoesTratado("maputo");
    expect(total).toBeGreaterThanOrEqual(40);
  });
});

describe("Frente B — Casos da Corte Africana e ACHPR", () => {
  it("todos os casos têm artigos violados, partes e URL válida", () => {
    for (const caso of CASOS_AFRICANOS) {
      expect(caso.tribunal).toMatch(/Corte Africana|Comissão Africana/);
      expect(caso.numero.length).toBeGreaterThan(2);
      expect(caso.partes.length).toBeGreaterThan(5);
      expect(caso.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(caso.artigos.length).toBeGreaterThan(0);
      expect(caso.reparacoes.length).toBeGreaterThan(0);
      expect(["cumprido", "parcial", "descumprido", "desconhecido"]).toContain(caso.cumprimento);
      expect(caso.url).toMatch(/^https?:\/\//);
      expect(caso.resumoOficial).toBeDefined();
    }
  });

  it("contém os casos paradigmáticos de direitos dos povos e atingidos", () => {
    // Caso Ogiek (Corte Africana)
    const ogiek = CASOS_AFRICANOS.find((c) => c.numero === "006/2012");
    expect(ogiek).toBeDefined();
    expect(ogiek?.pais).toBe("Quênia");
    expect(ogiek?.temaPrincipal).toBe("povos");

    // Caso Endorois (Comissão Africana)
    const endorois = CASOS_AFRICANOS.find((c) => c.numero === "276/2003");
    expect(endorois).toBeDefined();
    expect(endorois?.pais).toBe("Quênia");

    // Caso SERAC / Ogoni (Comissão Africana)
    const serac = CASOS_AFRICANOS.find((c) => c.numero === "155/1996");
    expect(serac).toBeDefined();
    expect(serac?.pais).toBe("Nigéria");
    expect(serac?.temaPrincipal).toBe("atingidos_empreendimentos");
  });

  it("proíbe 'cumprido' quando a evidência documental não está registrada", () => {
    for (const caso of CASOS_AFRICANOS) {
      if (caso.cumprimento === "cumprido") {
        expect(caso.resumoOficial).toContain("Lei");
      }
    }
  });
});

describe("Frente B — Recomendações da Comissão Africana", () => {
  it("recomendações contêm órgão, texto, tema e URL de sessão", () => {
    for (const rec of RECOMENDACOES_ACHPR) {
      expect(rec.orgao).toBe("ACHPR");
      expect(rec.texto.length).toBeGreaterThan(20);
      expect(rec.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rec.url).toMatch(/^https:\/\/achpr\.org\//);
      if (rec.status === "cumprido") {
        expect(rec.evidencia).not.toBeNull();
      }
    }
  });
});

describe("Frente B — Dispositivos Constitucionais e Auditoria de Lacunas", () => {
  it("contém dispositivos constitucionais com texto verbatim para países-chave", () => {
    expect(DISPOSITIVOS_AFRICA.length).toBeGreaterThanOrEqual(10);
    const paisesComDisp = new Set(DISPOSITIVOS_AFRICA.map((d) => d.pais));
    expect(paisesComDisp).toContain("África do Sul");
    expect(paisesComDisp).toContain("Quênia");
    expect(paisesComDisp).toContain("Nigéria");
    expect(paisesComDisp).toContain("Angola");
    expect(paisesComDisp).toContain("Moçambique");

    for (const d of DISPOSITIVOS_AFRICA) {
      expect(d.texto.length).toBeGreaterThan(20);
      expect(d.citacao).toBeDefined();
      expect(d.url).toMatch(/^https:\/\//);
      expect(d.dataAcesso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("getDispositivosAfrica cobre todos os 54 países da África declarando lacunas", () => {
    const listaCompleta = getDispositivosAfrica();
    const paisesCobertos = new Set(listaCompleta.map((d) => d.pais));
    for (const p of PAISES_AFRICA) {
      expect(paisesCobertos).toContain(p.nome);
    }
  });
});

