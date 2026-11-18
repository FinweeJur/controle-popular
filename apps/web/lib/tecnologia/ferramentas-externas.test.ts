import { describe, expect, it } from "vitest";
import dados from "../../data/tecnologia/ferramentas-externas.json";

/**
 * Catraca do radar de ferramentas (`/tecnologia`).
 *
 * O defeito que este teste evita: link quebrado ou "http://" no meio de uma
 * lista curada parece descuido do portal, não da ferramenta. Também trava o
 * contrato de campos que a interface lê (categoria, público, resumo, licença).
 */
const CATEGORIAS = new Set([
  "ia",
  "agentes",
  "design",
  "frontend",
  "infra",
  "privacidade",
  "dados",
  "cultura",
  "dev",
]);
const PUBLICOS = new Set(["dev", "ia", "pesquisa", "cidadao"]);

describe("radar de ferramentas externas", () => {
  it("tem pelo menos 15 ferramentas e nenhum id repetido", () => {
    expect(dados.length).toBeGreaterThanOrEqual(15);
    const ids = dados.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa apenas https em domínio público", () => {
    for (const f of dados) {
      expect(f.url, f.id).toMatch(/^https:\/\//);
      expect(f.url, f.id).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });

  it("não repete a mesma URL em duas fichas", () => {
    const urls = dados.map((f) => f.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("preenche categoria e público do vocabulário", () => {
    for (const f of dados) {
      expect(CATEGORIAS.has(f.categoria), `${f.id}: categoria ${f.categoria}`).toBe(true);
      expect(f.publico.length, f.id).toBeGreaterThan(0);
      for (const p of f.publico) {
        expect(PUBLICOS.has(p), `${f.id}: público ${p}`).toBe(true);
      }
    }
  });

  it("explica o motivo e declara a licença em toda ficha", () => {
    for (const f of dados) {
      expect(f.resumo.length, f.id).toBeGreaterThan(30);
      expect(f.porQue.length, f.id).toBeGreaterThan(30);
      expect(f.licenca.trim().length, f.id).toBeGreaterThan(2);
      expect(typeof f.gratuito, f.id).toBe("boolean");
      expect(f.nome.trim().length, f.id).toBeGreaterThan(1);
    }
  });

  it("não promete gratuito quando a licença é comercial", () => {
    const comercial = dados.filter((f) => /comercial/i.test(f.licenca));
    for (const f of comercial) {
      expect(f.gratuito, f.id).toBe(false);
    }
  });
});
