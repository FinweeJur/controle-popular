import { describe, it, expect } from "vitest";
import {
  montarAcervo,
  montarAcervoDetalhado,
  frenteDaRota,
  type AcervoFonte,
} from "./acervo";

/**
 * Testes do acervo do chatbot (degrau 3).
 *
 * O acervo é a memória do RAG com a fonte colada em cada pedaço. As
 * invariantes aqui são estruturais — a mesma disciplina de
 * `demonstracao.test.ts` ("teste sobre dado real FALHA se o dado sumir,
 * nunca passa vazio calado"): se alguém apagar uma frente ou um link das
 * fontes TS, estes testes quebram, não passam calados.
 */

describe("montarAcervo -- invariantes estruturais", () => {
  it("produz um corpus não trivial (mais de 80 pedaços)", () => {
    const acervo = montarAcervo();
    expect(acervo.length).toBeGreaterThan(80);
  });

  it("todo pedaço tem rota, fonteUrl, titulo e texto não vazios", () => {
    for (const f of montarAcervo()) {
      expect(f.rota, `rota vazia em ${f.id}`).toBeTruthy();
      expect(f.fonteUrl, `fonteUrl vazia em ${f.id}`).toBeTruthy();
      expect(f.titulo, `titulo vazio em ${f.id}`).toBeTruthy();
      expect(f.texto, `texto vazio em ${f.id}`).toBeTruthy();
    }
  });

  it("rota e fonteUrl começam com / ou http(s) — nada de href quebrado", () => {
    for (const f of montarAcervo()) {
      expect(
        f.rota.startsWith("/") || f.rota.startsWith("http"),
        `rota inválida em ${f.id}: ${f.rota}`
      ).toBe(true);
      expect(
        f.fonteUrl.startsWith("/") || f.fonteUrl.startsWith("http"),
        `fonteUrl inválida em ${f.id}: ${f.fonteUrl}`
      ).toBe(true);
    }
  });

  it("cobre as frentes principais do portal (≥ 6 distintas)", () => {
    const { cobertura } = montarAcervoDetalhado();
    const frentes = Object.keys(cobertura.porFrente);
    expect(frentes.length).toBeGreaterThanOrEqual(6);
    for (const esperada of ["cidades", "congresso", "judiciario", "ambiental", "paraopeba"]) {
      expect(cobertura.porFrente[esperada], `frente ${esperada} sem pedaços`).toBeGreaterThan(0);
    }
  });

  it("é determinístico: duas montagens produzem a mesma lista", () => {
    expect(montarAcervo()).toEqual(montarAcervo());
  });

  it("não tem id duplicado (a citação [n] da UI depende disso)", () => {
    const vistos = new Set<string>();
    for (const f of montarAcervo()) {
      expect(vistos.has(f.id), `id duplicado ${f.id}`).toBe(false);
      vistos.add(f.id);
    }
  });

  it("registra as respostas pré-curadas puladas por falta de link", () => {
    const { cobertura } = montarAcervoDetalhado();
    expect(cobertura.puladasSemRota).toBeGreaterThanOrEqual(0);
    expect(cobertura.total).toBeGreaterThan(0);
  });
});

describe("montarAcervo -- pedaços conhecidos das três fontes", () => {
  function achar(acervo: AcervoFonte[], id: string): AcervoFonte {
    const f = acervo.find((x) => x.id === id);
    expect(f, `pedaço ${id} não encontrado — a fonte TS mudou?`).toBeDefined();
    return f!;
  }

  it("resposta pré-curada de SeuNonoData com link vira pedaço com a rota", () => {
    const acervo = montarAcervo();
    const f = achar(acervo, "pergunta:cidades:maiores-contratos");
    expect(f.rota).toBe("/betim/prefeitura/contratos");
    expect(f.frente).toBe("cidades");
    expect(f.texto.toLowerCase()).toContain("contratos");
  });

  it("sugestão contextual vira pedaço com a frente derivada da rota", () => {
    const acervo = montarAcervo();
    const f = acervo.find((x) => x.id.startsWith("contexto:") && x.rota.startsWith("/congresso"));
    expect(f, "nenhum pedaço de contexto do congresso").toBeDefined();
    expect(f!.frente).toBe("congresso");
  });

  it("resumo de dados de página vira pedaço com links extras", () => {
    const acervo = montarAcervo();
    const f = achar(acervo, "pagina:betim-prefeitura");
    expect(f.rota).toBe("/betim/prefeitura/contratos");
    expect(f.texto.toLowerCase()).toContain("contratos");
    expect(f.links && f.links.length).toBeGreaterThan(1);
  });
});

describe("frenteDaRota -- régua de derivação", () => {
  it("mapeia as rotas das seis zonas", () => {
    expect(frenteDaRota("/betim/prefeitura/contratos")).toBe("cidades");
    expect(frenteDaRota("/bh/saude")).toBe("cidades");
    expect(frenteDaRota("/diamantina/indice")).toBe("cidades");
    expect(frenteDaRota("/congresso/proposicoes")).toBe("congresso");
    expect(frenteDaRota("/judiciario/sirenejud")).toBe("judiciario");
    expect(frenteDaRota("/ambiental/licenciamento")).toBe("ambiental");
    expect(frenteDaRota("/paraopeba/execucao")).toBe("paraopeba");
    expect(frenteDaRota("/funcaosocialterra/mapa")).toBe("funcaosocialterra");
    expect(frenteDaRota("/direitos-em-movimento/denuncia")).toBe("direitos-em-movimento");
  });

  it("cai em 'geral' para rota desconhecida", () => {
    expect(frenteDaRota("/nao-existe")).toBe("geral");
    expect(frenteDaRota("/")).toBe("geral");
  });
});
