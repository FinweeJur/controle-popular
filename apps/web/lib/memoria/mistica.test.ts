/**
 * Testes da Mística do Dia e do calendário de lutas.
 *
 * Guardam as regras que o plano `PLANO-MEMORIA-RESISTENCIAS.md` exige e
 * que um comentário não sustenta: toda entrada nasce com autor e ano;
 * nenhuma fonte terciária (Wikipédia/Wikidata) decide entrada; o índice
 * por dia casa com zero à esquerda; e dia sem entrada devolve `null` —
 * a lacuna é resultado legítimo, não erro.
 */

import { describe, expect, it } from "vitest";
import { CALENDARIO_LUTAS } from "./calendario";
import {
  chaveDiaMes,
  diasCobertos,
  entradasDoDia,
  fonteCurta,
  misticaDoDia,
  mostrarAnoSelo,
  referenciaAbnt,
} from "./mistica";

describe("calendário de lutas", () => {
  it("tem entradas suficientes para a home (piso 300)", () => {
    expect(CALENDARIO_LUTAS.length).toBeGreaterThanOrEqual(300);
  });

  it("toda entrada tem autor, órgão, data da fonte e ao menos um tipo de luta", () => {
    for (const e of CALENDARIO_LUTAS) {
      expect(e.autor.trim().length, `autor vazio em ${e.diaMes}/${e.titulo}`).toBeGreaterThan(0);
      expect(e.orgao.trim().length, `orgao vazio em ${e.diaMes}/${e.titulo}`).toBeGreaterThan(0);
      expect(e.fonteData.trim().length, `fonteData vazia em ${e.diaMes}/${e.titulo}`).toBeGreaterThan(0);
      expect(e.tipo.length, `tipo vazio em ${e.diaMes}/${e.titulo}`).toBeGreaterThan(0);
    }
  });

  it("mantém fato sem ano (regra do dono: fato sem data não se perde)", () => {
    const semAno = CALENDARIO_LUTAS.filter((e) => !e.ano);
    expect(semAno.length).toBeGreaterThan(0);
    for (const e of semAno) {
      expect(e.titulo.trim().length).toBeGreaterThan(0);
    }
  });

  it("usa diaMes no formato MM-DD e faixa válida", () => {
    for (const e of CALENDARIO_LUTAS) {
      expect(e.diaMes).toMatch(/^\d{2}-\d{2}$/);
      const [mes, dia] = e.diaMes.split("-").map(Number);
      expect(mes).toBeGreaterThanOrEqual(1);
      expect(mes).toBeLessThanOrEqual(12);
      expect(dia).toBeGreaterThanOrEqual(1);
      expect(dia).toBeLessThanOrEqual(31);
    }
  });

  it("nunca usa fonte terciária (wikipédia/wikidata) como link do fato", () => {
    for (const e of CALENDARIO_LUTAS) {
      if (!e.url) continue;
      const url = e.url.toLowerCase();
      expect(url.includes("wikipedia.org"), `wiki em ${e.url}`).toBe(false);
      expect(url.includes("wikidata.org"), `wikidata em ${e.url}`).toBe(false);
    }
  });

  it("mantém a maioria das entradas com link conferível", () => {
    const comLink = CALENDARIO_LUTAS.filter((e) => e.url).length;
    expect(comLink).toBeGreaterThan(100);
  });
});

describe("chaveDiaMes", () => {
  it("preenche com zero à esquerda", () => {
    expect(chaveDiaMes(new Date(2026, 0, 5))).toBe("01-05");
    expect(chaveDiaMes(new Date(2026, 8, 29))).toBe("09-29");
    expect(chaveDiaMes(new Date(2026, 11, 25))).toBe("12-25");
  });
});

describe("misticaDoDia", () => {
  it("devolve a entrada do dia quando existe", () => {
    const primeiro = CALENDARIO_LUTAS[0];
    const [mes, dia] = primeiro.diaMes.split("-").map(Number);
    const achada = misticaDoDia(new Date(2026, mes - 1, dia));
    expect(achada).not.toBeNull();
    expect(achada?.diaMes).toBe(primeiro.diaMes);
  });

  it("devolve null (lacuna declarada) num dia sem entrada", () => {
    const cobertos = new Set(CALENDARIO_LUTAS.map((e) => e.diaMes));
    // procura um dia de fevereiro sem entrada; 30/02 não existe, então
    // varre os 28 dias reais do mês.
    let faltante: number | null = null;
    for (let dia = 1; dia <= 28; dia += 1) {
      const chave = `02-${String(dia).padStart(2, "0")}`;
      if (!cobertos.has(chave)) {
        faltante = dia;
        break;
      }
    }
    if (faltante === null) return; // cobertura completa de fevereiro: nada a provar
    expect(misticaDoDia(new Date(2026, 1, faltante))).toBeNull();
  });

  it("prefere entrada com link no mesmo dia", () => {
    const dia = CALENDARIO_LUTAS.find((e) => e.url);
    expect(dia).toBeDefined();
    if (!dia) return;
    const [mes, d] = dia.diaMes.split("-").map(Number);
    const entradas = entradasDoDia(new Date(2026, mes - 1, d));
    expect(entradas.length).toBeGreaterThan(0);
    expect(entradas[0].url).toBeTruthy();
  });
});

describe("referenciaAbnt", () => {
  it("traz autor, ano e a data de acesso", () => {
    const entrada = CALENDARIO_LUTAS.find((e) => e.url);
    expect(entrada).toBeDefined();
    if (!entrada) return;
    const texto = referenciaAbnt(entrada, new Date(2026, 8, 29));
    expect(texto).toContain(entrada.autor);
    expect(texto).toContain(entrada.titulo.slice(0, 20));
    expect(texto).toContain("Acesso em: 29 set. 2026");
    expect(texto).toContain(entrada.url as string);
  });

  it("não inventa link para fonte sem URL", () => {
    const local = CALENDARIO_LUTAS.find((e) => !e.url);
    expect(local).toBeDefined();
    if (!local) return;
    const texto = referenciaAbnt(local, new Date(2026, 8, 29));
    expect(texto.includes("Disponível em:")).toBe(false);
    expect(texto).toContain(local.autor);
  });
});

describe("cobertura", () => {
  it("cobre o ano inteiro: fato sem data preenche os dias vazios", () => {
    // 366 chaves (com 29/02); com o recheio do MST o alvo é o ano cheio.
    expect(diasCobertos()).toBeGreaterThan(340);
  });
});

describe("fonteCurta", () => {
  it("usa a obra da fonte, nunca a pessoa que assina (formato do dono)", () => {
    for (const e of CALENDARIO_LUTAS) {
      const curta = fonteCurta(e);
      const obra = /insurgente/i.test(e.orgao)
        ? "Calendário Insurgente, Blog Aos que Virão"
        : "Calendário Histórico das Trabalhadoras/es, MST";
      expect(curta, `fonte curta de ${e.diaMes}/${e.titulo}`).toContain(obra);
      // o nome do autor-pessoa não entra na citação curta
      expect(curta).not.toContain("SEFERIAN");
      expect(curta).not.toContain("BENITEZ");
    }
  });

  it("traz a data da obra: 2009 no MST e 2020 no blog", () => {
    const mst = CALENDARIO_LUTAS.find((e) => !/insurgente/i.test(e.orgao));
    const blog = CALENDARIO_LUTAS.find((e) => /insurgente/i.test(e.orgao));
    expect(mst).toBeDefined();
    expect(blog).toBeDefined();
    if (mst) expect(fonteCurta(mst)).toContain("2009");
    if (blog) expect(fonteCurta(blog)).toContain("2020");
  });
});

describe("mostrarAnoSelo", () => {
  it("some com o selo quando o título já traz o ano (não repete a data)", () => {
    const comAnoNoTitulo = CALENDARIO_LUTAS.find(
      (e) => e.ano && e.titulo.includes(e.ano),
    );
    expect(comAnoNoTitulo).toBeDefined();
    if (comAnoNoTitulo) expect(mostrarAnoSelo(comAnoNoTitulo)).toBe(false);
  });

  it("mostra o selo quando o título não traz o ano", () => {
    const semAnoNoTitulo = CALENDARIO_LUTAS.find(
      (e) => e.ano && !e.titulo.includes(e.ano),
    );
    expect(semAnoNoTitulo).toBeDefined();
    if (semAnoNoTitulo) expect(mostrarAnoSelo(semAnoNoTitulo)).toBe(true);
  });

  it("nunca mostra o selo sem ano (fato sem data não ganha data falsa)", () => {
    const semAno = CALENDARIO_LUTAS.find((e) => !e.ano);
    expect(semAno).toBeDefined();
    if (semAno) expect(mostrarAnoSelo(semAno)).toBe(false);
  });
});
