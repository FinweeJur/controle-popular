import { describe, expect, test } from "vitest";
import { comoIdMunicipio, type Cidade } from "@/lib/db/queries/municipios";
import {
  montarItensPainel,
  LAI_ESTADUAL,
  LAI_FEDERAL,
  REDE_ITENS,
  NECESSIDADE_ORDEM,
} from "./redeProtecao";

/**
 * `montarItensPainel` decide, por cidade, quais dos ~40 itens curados
 * aparecem — a regra real do painel (São Paulo não pode ganhar Defensoria de
 * MG; Itinga não pode ganhar a unidade da Defensoria de Diamantina) vive só
 * em código, sem tabela pra conferir. Sem este teste, trocar a ordem de um
 * `if` em `montarItensPainel` vazaria um órgão do estado errado para o
 * leitor sem gerar nenhum erro visível — o mesmo modo de falha que
 * `PedidoLAI.tsx` documenta para o nome da Prefeitura.
 */

function cidade(overrides: Partial<Cidade>): Cidade {
  return {
    id_municipio: comoIdMunicipio("0000000"),
    slug: "teste",
    nome: "Cidade Teste",
    uf: "MG",
    cnpj_prefeitura: null,
    dominio: null,
    lat: null,
    lng: null,
    branding: null,
    fontes: null,
    ...overrides,
  };
}

describe("montarItensPainel", () => {
  test("cidade de MG com e-SIC completo ganha LAI municipal, estadual e federal", () => {
    const c = cidade({
      slug: "itinga",
      nome: "Itinga",
      fontes: {
        links_uteis_mg: true,
        sic_prefeitura: "https://www.itinga.mg.gov.br/esic",
        sic_camara: "https://www.camaraitinga.mg.gov.br/esic",
      },
    });
    const itens = montarItensPainel(c);
    expect(itens.some((i) => i.id === "lai-municipal-prefeitura")).toBe(true);
    expect(itens.some((i) => i.id === "lai-municipal-camara")).toBe(true);
    expect(itens.some((i) => i.id === "lai-mg-executivo")).toBe(true);
    expect(itens.some((i) => i.id === "lai-falabr")).toBe(true);
    // A unidade da Defensoria de Araçuaí também atende Itinga.
    expect(itens.some((i) => i.id === "rede-defensoria-aracuai")).toBe(true);
    // A de Diamantina, não — é outra comarca.
    expect(itens.some((i) => i.id === "rede-defensoria-diamantina")).toBe(false);
  });

  test("cidade sem sic_camara não ganha o card da Câmara (Araçuaí)", () => {
    const c = cidade({
      slug: "aracuai",
      nome: "Araçuaí",
      fontes: { links_uteis_mg: true, sic_prefeitura: "https://www.aracuai.mg.gov.br/transparencia/e-sic" },
    });
    const itens = montarItensPainel(c);
    expect(itens.some((i) => i.id === "lai-municipal-prefeitura")).toBe(true);
    expect(itens.some((i) => i.id === "lai-municipal-camara")).toBe(false);
  });

  test("São Paulo não ganha nenhum item estadual de MG, só municipal e federal", () => {
    const c = cidade({
      slug: "sp",
      nome: "São Paulo",
      uf: "SP",
      fontes: {
        links_uteis_mg: false,
        sic_prefeitura: "https://esic.prefeitura.sp.gov.br/",
        sic_camara: "https://www.saopaulo.sp.leg.br/transparencia/lei-de-acesso-informacao/",
      },
    });
    const itens = montarItensPainel(c);
    expect(itens.some((i) => i.id === "lai-municipal-prefeitura")).toBe(true);
    expect(itens.some((i) => i.id === "lai-mg-executivo")).toBe(false);
    expect(itens.some((i) => i.id === "rede-defensoria-mg")).toBe(false);
    expect(itens.some((i) => i.id === "rede-deam-bh")).toBe(false);
    // Federal continua igual em qualquer estado.
    expect(itens.some((i) => i.id === "lai-falabr")).toBe(true);
    expect(itens.some((i) => i.id === "rede-cndh")).toBe(true);
  });

  test("cidade sem fontes nenhuma não quebra e não ganha LAI municipal", () => {
    const c = cidade({ fontes: null });
    const itens = montarItensPainel(c);
    expect(itens.some((i) => i.id.startsWith("lai-municipal"))).toBe(false);
    // `temFonte` trata ausência de `fontes` como "tem" (ver municipios.ts) —
    // então uma cidade sem config nenhuma é tratada como mineira.
    expect(itens.some((i) => i.id === "lai-mg-executivo")).toBe(true);
  });
});

describe("integridade dos dados curados", () => {
  const todos = [...LAI_ESTADUAL, ...LAI_FEDERAL, ...REDE_ITENS];

  test("todo item tem ao menos uma necessidade válida", () => {
    for (const it of todos) {
      expect(it.necessidades.length, `${it.id} sem necessidade`).toBeGreaterThan(0);
      for (const n of it.necessidades) {
        expect(NECESSIDADE_ORDEM, `${it.id} usa necessidade fora da régua: ${n}`).toContain(n);
      }
    }
  });

  test("ids são únicos", () => {
    const ids = todos.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("todo item marca verificadoEm no formato AAAA-MM-DD", () => {
    for (const it of todos) {
      expect(it.verificadoEm, it.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
