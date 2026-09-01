import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const TAGS_VALIDAS = new Set([
  "legislacao",
  "acordo-judicial",
  "governanca-comites",
  "prestacao-de-contas",
  "valores-e-financas",
  "seguranca-hidrica",
  "reparacao-socioambiental",
  "reparacao-socioeconomica",
  "mobilidade",
  "fortalecimento-servico-publico",
  "participacao-popular",
  "saude",
  "qualidade-da-agua",
  "pesquisa-academica",
  "historico-rompimento",
]);

interface ItemPB {
  id: string;
  ati: string;
  fonte_id: string;
  titulo: string;
  data: string | null;
  tipo: string;
  macro_categoria: string;
  tags: string[];
  temas: string[];
  url: string;
  autoria: string | null;
  resumo?: string | null;
  resumo_origem?: "fonte" | "modelo";
}

interface ArquivoPB {
  gerado_em: string;
  fontes: { id: string; nome: string; site: string; itens: number }[];
  ficou_de_fora: string;
  itens: ItemPB[];
}

function lerArquivo(): ArquivoPB {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const caminho = path.resolve(
    dir,
    "..",
    "..",
    "public",
    "data",
    "biblioteca-pro-brumadinho.json"
  );
  return JSON.parse(readFileSync(caminho, "utf-8"));
}

describe("biblioteca-pro-brumadinho.json", () => {
  const arquivo = lerArquivo();
  const itens = arquivo.itens;

  it("tem pelo menos 120 itens (129 coletados, 5 links 404)", () => {
    expect(itens.length).toBeGreaterThanOrEqual(120);
  });

  it("envelope tem gerado_em, fontes e ficou_de_fora", () => {
    expect(arquivo.gerado_em).toBeTruthy();
    expect(arquivo.fontes.length).toBeGreaterThanOrEqual(1);
    expect(arquivo.ficou_de_fora).toBeTruthy();
  });

  it("contagem de itens na fonte bate com array", () => {
    const total = arquivo.fontes.reduce((s, f) => s + f.itens, 0);
    expect(total).toBe(itens.length);
  });

  it("todo item tem ati=probrumadinho", () => {
    for (const i of itens) {
      expect(i.ati).toBe("probrumadinho");
    }
  });

  it("todo item tem URL oficial do Governo de MG ou orgao parceiro", () => {
    for (const i of itens) {
      expect(i.url).toMatch(/^https?:\/\/([a-z0-9.-]+\.)?mg\.gov\.br\//);
    }
  });

  it("itens com tags usam apenas o vocabulario controlado", () => {
    for (const i of itens) {
      for (const t of i.tags) {
        expect(TAGS_VALIDAS.has(t)).toBe(true);
      }
    }
  });

  it("nenhum item tem mais de 4 tags", () => {
    for (const i of itens) {
      expect(i.tags.length).toBeLessThanOrEqual(4);
    }
  });

  it("todo item com resumo tem resumo_origem", () => {
    for (const i of itens) {
      if (i.resumo && i.resumo.trim().length > 0) {
        expect(i.resumo_origem).toBeDefined();
        expect(["fonte", "modelo"]).toContain(i.resumo_origem);
      }
    }
  });

  it("pelo menos 80% dos itens tem resumo", () => {
    const comResumo = itens.filter(
      (i) => i.resumo && i.resumo.trim().length > 0
    ).length;
    expect(comResumo / itens.length).toBeGreaterThanOrEqual(0.8);
  });

  it("ids sao unicos", () => {
    const ids = new Set(itens.map((i) => i.id));
    expect(ids.size).toBe(itens.length);
  });

  it("nenhum resumo contem CPF (11 digitos mod-11)", () => {
    const cpfRegex = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g;
    for (const i of itens) {
      if (i.resumo) {
        const match = cpfRegex.exec(i.resumo);
        expect(match).toBeNull();
      }
    }
  });
});
