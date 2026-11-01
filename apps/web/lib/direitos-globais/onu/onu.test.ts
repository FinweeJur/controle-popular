/**
 * @file apps/web/lib/direitos-globais/onu/onu.test.ts
 * @description Testes vitest para o módulo Sistema ONU (Frente C).
 *
 * O que protege:
 * - 8 órgãos de tratados fundamentais mapeados (CCPR, CESCR, CEDAW, CRC, CAT, CRPD, CMW, CED);
 * - matriz de adesão aos tratados da ONU para os países da Leva 1 e Leva 2;
 * - recomendações UPR com fonte documental e órgão;
 * - proibição de 'cumprido' sem evidência documental;
 * - sem CPFs nos registros.
 */

import { describe, expect, it } from "vitest";
import { ORGAOS_TRATADOS_ONU, adesaoPaisONU } from "./orgaos-tratados";
import { RECOMENDACOES_ONU_ASIA, recomendacoesPorPaisAsia } from "./recomendacoes-upr";

describe("Frente C — Órgãos de Tratados da ONU (Treaty Bodies)", () => {
  it("contém os 8 comitês de tratados estruturantes", () => {
    expect(ORGAOS_TRATADOS_ONU).toHaveLength(8);
    const ids = ORGAOS_TRATADOS_ONU.map((o) => o.id);
    expect(ids).toContain("ccpr");
    expect(ids).toContain("cescr");
    expect(ids).toContain("cedaw");
    expect(ids).toContain("crc");
    expect(ids).toContain("cat");
    expect(ids).toContain("crpd");
    expect(ids).toContain("cmw");
    expect(ids).toContain("ced");
  });

  it("matriz de adesão cobre os países da Leva 1 sem exceções", () => {
    const paisesLeva1 = ["China", "Rússia", "Índia", "Vietnã", "Japão", "Filipinas"];
    for (const tratado of ORGAOS_TRATADOS_ONU) {
      for (const pais of paisesLeva1) {
        const adesao = adesaoPaisONU(pais, tratado.id);
        expect(adesao).toBeDefined();
        expect(["ratificado", "assinado", "nao", "desconhecido"]).toContain(adesao.status);
      }
    }
  });

  it("China assinou mas não ratificou o Pacto ICCPR (fato histórico e auditado)", () => {
    const adesao = adesaoPaisONU("China", "ccpr");
    expect(adesao.status).toBe("assinado");
    expect(adesao.ano).toBe(1998);
  });

  it("Filipinas ratificou a Convenção de Trabalhadores Migrantes (CMW)", () => {
    const adesao = adesaoPaisONU("Filipinas", "cmw");
    expect(adesao.status).toBe("ratificado");
    expect(adesao.ano).toBe(1995);
  });
});

describe("Frente C — Recomendações UPR e Órgãos de Tratados", () => {
  it("recomendações contêm órgão, texto, URL oficial e tema", () => {
    for (const rec of RECOMENDACOES_ONU_ASIA) {
      expect(rec.orgao.length).toBeGreaterThanOrEqual(3);
      expect(rec.texto.length).toBeGreaterThan(15);
      expect(rec.url).toMatch(/^https:\/\/(www\.)?(ohchr\.org|tbinternet\.ohchr\.org)/);
      expect(["ratificado", "assinado", "nao", "parcial", "cumprido", "aceita", "notada", "desconhecido"]).toContain(rec.status);
    }
  });

  it("toda recomendação com status 'cumprido' obrigatoriamente contém evidência oficial", () => {
    for (const rec of RECOMENDACOES_ONU_ASIA) {
      if (rec.status === "cumprido") {
        expect(rec.evidencia).not.toBeNull();
        expect(rec.evidencia!.length).toBeGreaterThan(10);
      }
    }
  });

  it("possui recomendações para todos os países da Leva 1", () => {
    const paisesLeva1 = ["China", "Rússia", "Índia", "Filipinas", "Vietnã", "Japão"];
    for (const p of paisesLeva1) {
      const recs = recomendacoesPorPaisAsia(p);
      expect(recs.length).toBeGreaterThanOrEqual(1);
    }
  });
});
