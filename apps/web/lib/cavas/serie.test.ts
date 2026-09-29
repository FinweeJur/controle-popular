import { describe, expect, it } from "vitest";
import dados from "../../data/cavas-serie-mineracao-mg.json";
import {
  FASES_EXTRATIVAS,
  cartoesTopo,
  classificarEstadoCava,
  estadoDaSerie,
  picoDeArea,
  type LinhaSerie,
} from "./serie";

const serie = dados.serie as LinhaSerie[];
const HOJE = new Date(dados.gerado_em);

describe("área — unidade e soma (regra 4 do AGENTS § 8)", () => {
  it("soma a série publicada e bate com o total medido na coleta", () => {
    const c = cartoesTopo(serie);
    // 86.694 polígonos, 104.186,8 ha — medido em 29/09/2026 (Fase 3).
    expect(c.poligonos).toBe(86694);
    expect(c.area).toBeCloseTo(104186.77, 1);
    // Unidade conferida com shoelace projetado (razão 0,943) — não km².
    expect(dados.area_unidade).toContain("hectares");
    expect(dados.resolucao_m).toBe(30);
  });

  it("soma por ano fecha no acumulado (área nunca some nem duplica)", () => {
    const soma = serie.reduce((s, l) => s + l.area, 0);
    expect(soma).toBeCloseTo(serie[serie.length - 1].acumulado, 0);
    for (const l of serie) {
      expect(l.delta_area).toBeCloseTo(l.area, 6);
      expect(l.qtd).toBeGreaterThanOrEqual(0);
    }
  });

  it("mantém a metade fora do SIGMINE que o plano já tinha medido (2ª verificação)", () => {
    const c = cartoesTopo(serie);
    expect(c.qtdFora).toBe(3869); // mesmo 3.869 da Fase 1
    expect(c.areaFora).toBeCloseTo(2589.538, 2);
  });
});

describe("as 4 datas da ficha", () => {
  it("1 — ano de início da série", () => {
    expect(cartoesTopo(serie).primeiroAno).toBe(1985);
  });

  it("2 — ano do pico de área nova, sem contar o teto da série", () => {
    // 1985 carrega tudo que existia antes: crescer no primeiro ano não é
    // pico, é o ponto de partida. Sem esta regra o gráfico mente.
    expect(picoDeArea(serie)).toBe(2020);
    expect(serie[0].area).toBeGreaterThan((serie.find((l) => l.ano === 2020) as LinhaSerie).area);
  });

  it("3 — último ano com detecção e Δ daquele ano", () => {
    const c = cartoesTopo(serie);
    expect(c.ultimoAno).toBe(2024);
    expect(c.ultimoDelta).toBeCloseTo(4234.4315, 3);
  });

  it("4 — data da coleta, que é a data que a ficha publica", () => {
    expect(dados.gerado_em).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dados.fonte).toContain("MapBiomas");
    expect(dados.fonte).toContain(new Date(dados.gerado_em).toISOString().slice(0, 10));
  });

  it("cobre 40 anos, 1985→2024", () => {
    const c = cartoesTopo(serie);
    expect(c.qtdAnos).toBe(40);
    expect(c.ultimoAno! - c.primeiroAno! + 1).toBe(40);
  });
});

describe("estadoDaSerie — janela de 24 meses", () => {
  it("ativa: série real, última detecção 2024 com data de publicação 2026", () => {
    const e = estadoDaSerie(serie, HOJE);
    expect(e.estado).toBe("ativa");
    expect(e.ultimoAno).toBe(2024);
    expect(e.explicacao).toContain("24 meses");
  });

  it("estavel: cresceu, mas parou antes da janela", () => {
    const antiga: LinhaSerie[] = [
      { ano: 2010, qtd: 1, area: 10, area_fora_sigmine: 0, qtd_fora: 0, acumulado: 10, delta_area: 10, delta_pct: null },
      { ano: 2011, qtd: 1, area: 5, area_fora_sigmine: 0, qtd_fora: 0, acumulado: 15, delta_area: 5, delta_pct: 50 },
    ];
    const e = estadoDaSerie(antiga, new Date("2020-01-01T00:00:00Z"));
    expect(e.estado).toBe("estavel");
  });

  it("encerrada: nenhum ano com área nova", () => {
    const zerada: LinhaSerie[] = [
      { ano: 2010, qtd: 0, area: 0, area_fora_sigmine: 0, qtd_fora: 0, acumulado: 0, delta_area: 0, delta_pct: null },
    ];
    expect(estadoDaSerie(zerada, new Date("2020-01-01T00:00:00Z")).estado).toBe("encerrada");
  });

  it("sem_dado: série vazia nunca vira 'encerrada' (lacuna é informação)", () => {
    const e = estadoDaSerie([], new Date("2020-01-01T00:00:00Z"));
    expect(e.estado).toBe("sem_dado");
    expect(e.ultimoAno).toBeNull();
  });
});

describe("classificarEstadoCava — os três estados editoriais", () => {
  it("fora de todo polígono → sem cadastro ANM", () => {
    const r = classificarEstadoCava(false, FASES_EXTRATIVAS);
    expect(r.estado).toBe("sem_cadastro_anm");
    expect(r.frase).toContain("cadastro");
  });

  it("dentro de polígono com fase que autoriza → em operação", () => {
    expect(classificarEstadoCava(true, ["CONCESSÃO DE LAVRA"]).estado).toBe("em_operacao");
    expect(classificarEstadoCava(true, ["requisição", "concessão de lavra"]).estado).toBe(
      "em_operacao"
    );
  });

  it("dentro de polígono só com pesquisa → indício processual", () => {
    const r = classificarEstadoCava(true, ["AUTORIZAÇÃO DE PESQUISA"]);
    expect(r.estado).toBe("indicio_processual");
    expect(r.frase).toContain("conferir na ANM");
  });

  it("sem processo ANM nenhum → indício processual, não em operação", () => {
    expect(classificarEstadoCava(true, []).estado).toBe("indicio_processual");
  });
});
