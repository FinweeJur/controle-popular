import { describe, it, expect } from "vitest";
import {
  montarAcervo,
  montarAcervoDetalhado,
  frenteDaRota,
  dataBR,
  type AcervoFonte,
} from "./acervo";
import serieCavas from "@/data/cavas-serie-mineracao-mg.json";
import estadosCavas from "@/data/cavas-estados-mg.json";
import catalogoBases from "@/data/catalogo-bases-dados.json";
import basesPortal from "@/data/bases-portal.json";
import { FONTE_ANM_PROCESSOS } from "@/lib/cavas/serie";

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
    const f = achar(acervo, "pergunta:direitos:emprego-caged");
    expect(f.rota).toBe("/direitos-em-movimento/trabalho-e-renda");
    expect(f.frente).toBe("direitos");
    expect(f.texto.toLowerCase()).toContain("caged");
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

describe("bases de cavas no assistente -- regra 5", () => {
  it("as duas bases de mineração viram pedaços com rota e fonte", () => {
    const cavas = montarAcervo().filter((f) => f.id.startsWith("cavas:"));
    expect(cavas.length).toBeGreaterThanOrEqual(6);
    for (const f of cavas) {
      expect(f.rota, `rota errada em ${f.id}`).toBe("/mineracao/cavas");
      expect(f.fonteUrl, `fonteUrl vazia em ${f.id}`).toBeTruthy();
      expect(f.texto.length, `texto curto demais em ${f.id}`).toBeGreaterThan(80);
    }
  });

  it("o número do chat vem do JSON coletado, não digitado à mão", () => {
    const acervo = montarAcervo();
    const estados = acervo.find((f) => f.id === "cavas:tres-estados")!;
    expect(estados.texto).toContain(String(estadosCavas.resumo.em_operacao));
    expect(estados.texto).toContain(String(estadosCavas.resumo.indicio_processual));
    expect(estados.texto).toContain(String(estadosCavas.amostra));
    const cobertura = acervo.find((f) => f.id === "cavas:cobertura")!;
    expect(cobertura.texto).toContain(String(serieCavas.resolucao_m));
    expect(cobertura.texto).toContain(
      serieCavas.gerado_em.slice(0, 10).split("-").reverse().join("/")
    );
  });

  it("pedaço da ANM aponta a fonte oficial, não a home do portal", () => {
    const conferir = montarAcervo().find((f) => f.id === "cavas:conferir-anm")!;
    expect(conferir.fonteUrl).toBe(FONTE_ANM_PROCESSOS);
    expect(conferir.links?.some((l) => l.href === FONTE_ANM_PROCESSOS)).toBe(true);
  });
});

describe("memória no assistente — Fase 6", () => {
  it("os verbetes de memória viram pedaços com rota /memoria e fonte oficial", () => {
    const daMemoria = montarAcervo().filter((f) => f.id.startsWith("memoria:"));
    expect(daMemoria.length).toBeGreaterThanOrEqual(30);
    for (const f of daMemoria) {
      expect(f.rota, `rota errada em ${f.id}`).toBe("/memoria");
      expect(
        f.fonteUrl.startsWith("http"),
        `fonteUrl não oficial em ${f.id}: ${f.fonteUrl}`
      ).toBe(true);
      expect(f.links?.some((l) => l.href === "/memoria")).toBe(true);
    }
  });

  it("inclui a camada municipal (F3), com fonte http", () => {
    const municipais = montarAcervo().filter((f) => f.id.startsWith("memoria:municipio:"));
    expect(municipais.length).toBeGreaterThanOrEqual(9);
    for (const f of municipais) {
      expect(f.rota, `rota errada em ${f.id}`).toBe("/memoria");
      expect(f.fonteUrl.startsWith("http"), `fonteUrl não oficial em ${f.id}`).toBe(true);
    }
  });
});

describe("bases de dados no assistente — regra 5", () => {
  it("o catálogo curado de bases vira pedaços com página e fonte", () => {
    const bases = montarAcervo().filter((f) => f.id.startsWith("base:"));
    expect(bases.length).toBeGreaterThanOrEqual(16);
    for (const f of bases) {
      expect(f.rota.startsWith("/"), `rota inválida em ${f.id}: ${f.rota}`).toBe(true);
      expect(
        f.fonteUrl.startsWith("/") || f.fonteUrl.startsWith("http"),
        `fonteUrl inválida em ${f.id}: ${f.fonteUrl}`
      ).toBe(true);
    }
  });

  it("o inventário medido cobre os temas do portal com rota real", () => {
    const acervo = montarAcervo();
    const temas = acervo.filter((f) => f.id.startsWith("bases:tema:"));
    expect(temas.length).toBeGreaterThanOrEqual(15);
    for (const f of temas) {
      expect(f.rota.startsWith("/"), `rota inválida em ${f.id}: ${f.rota}`).toBe(true);
      expect(f.texto.length, `texto curto demais em ${f.id}`).toBeGreaterThan(80);
    }
    const total = acervo.find((f) => f.id === "bases:total");
    expect(total, "pedaço de total ausente").toBeDefined();
    expect(total!.rota).toBe("/api/v1/bases");
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

/**
 * Casos-limite da régua `REGRAS_FRENTES` (tabela de dados que substituiu 11
 * `if` encadeados em 08/10/2026) e as regras que a refatoração tornou
 * declarativas. Aqui o teste cobre a REGRA, não o dado de ontem: se alguém
 * trocar a ordem da tabela ou reaproveitar `dataBR`, quebra aqui.
 */
describe("frenteDaRota -- casos-limite da tabela REGRAS_FRENTES", () => {
  it("rota vazia, rota sem barra e prefixo parcial caem em 'geral'", () => {
    expect(frenteDaRota("")).toBe("geral");
    expect(frenteDaRota("betim/prefeitura/contratos")).toBe("geral");
    expect(frenteDaRota("/beti")).toBe("geral");
    expect(frenteDaRota("/congress")).toBe("geral");
  });

  it("rota com acento ou caractere fora do padrão não quebra a régua", () => {
    expect(frenteDaRota("/olá-mundo")).toBe("geral");
    expect(frenteDaRota("/saúde")).toBe("geral");
  });

  it("cobre as zonas que só uma linha da tabela atende", () => {
    expect(frenteDaRota("/recursos")).toBe("cidades");
    expect(frenteDaRota("/sp/capitais")).toBe("cidades");
    expect(frenteDaRota("/assembleias/mg")).toBe("congresso");
    expect(frenteDaRota("/internacional/eua")).toBe("ambiental");
    expect(frenteDaRota("/america-latina")).toBe("funcaosocialterra");
    expect(frenteDaRota("/internacional")).toBe("ambiental");
  });

  it("casa por prefixo COMPLETO e na ordem da tabela (desempate)", () => {
    // A régua usa `startsWith`, então "/ambi" não é "/ambiental": pedaço de
    // prefixo não vale. E o desempate É a ordem: os prefixos atuais não se
    // sobrepõem, mas se um dia sobreporem, vence o que estiver primeiro na
    // `REGRAS_FRENTES` — reescrever a ordem muda a frente, e este teste pega.
    expect(frenteDaRota("/ambiental")).toBe("ambiental");
    expect(frenteDaRota("/ambi")).toBe("geral");
    expect(frenteDaRota("/recursos/hidricos")).toBe("cidades");
  });
});

describe("dataBR -- data ISO do portal no formato do leitor", () => {
  it("converte AAAA-MM-DD para DD/MM/AAAA preservando o zero à esquerda", () => {
    expect(dataBR("2026-09-30")).toBe("30/09/2026");
    expect(dataBR("2026-01-05")).toBe("05/01/2026");
  });

  it("corta a hora quando a fonte manda timestamp completo", () => {
    expect(dataBR("2026-09-29T03:21:51+00:00")).toBe("29/09/2026");
    expect(dataBR(serieCavas.gerado_em)).toBe("29/09/2026");
    expect(dataBR(basesPortal.gerado_em)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("é a mesma data impressa nos textos de cavas e de inventário", () => {
    const acervo = montarAcervo();
    const cobertura = acervo.find((f) => f.id === "cavas:cobertura")!;
    expect(cobertura.texto).toContain(dataBR(serieCavas.gerado_em));
    const total = acervo.find((f) => f.id === "bases:total")!;
    expect(total.texto).toContain(dataBR(basesPortal.gerado_em));
  });
});

describe("ordem de montagem -- a citação [n] da UI depende dela", () => {
  it("mantém os dez grupos na ordem documentada em montarAcervoDetalhado", () => {
    const acervo = montarAcervo();
    const grupos = [
      "macro:",
      "pergunta:",
      "contexto:",
      "pagina:",
      "blog:",
      "designacao:",
      "cavas:",
      "memoria:",
      "base:",
      "bases:",
    ];
    let anterior = -1;
    for (const grupo of grupos) {
      const primeiro = acervo.findIndex((f) => f.id.startsWith(grupo));
      expect(primeiro, `grupo ${grupo} ausente do acervo`).toBeGreaterThanOrEqual(0);
      expect(primeiro, `grupo ${grupo} saiu da ordem`).toBeGreaterThan(anterior);
      anterior = primeiro;
    }
  });

  it("a soma das frentes da cobertura fecha com o total medido", () => {
    const { fontes, cobertura } = montarAcervoDetalhado();
    const soma = Object.values(cobertura.porFrente).reduce((a, b) => a + b, 0);
    expect(soma).toBe(cobertura.total);
    expect(cobertura.total).toBe(fontes.length);
  });
});

describe("bases do catálogo -- desempate pela primeira página usável", () => {
  it("cada base publicada aponta a primeira página que não é rota dinâmica", () => {
    const acervo = montarAcervo();
    let dinamicaIgnorada = 0;
    for (const b of catalogoBases as {
      id: string;
      paginasConsumidoras?: string[];
    }[]) {
      const usaveis = (b.paginasConsumidoras ?? []).filter(
        (r) => r.startsWith("/") && !r.includes("[")
      );
      if (usaveis.length === 0) continue;
      if ((b.paginasConsumidoras ?? [])[0] !== usaveis[0]) dinamicaIgnorada++;
      const peca = acervo.find((f) => f.id === `base:${b.id}`);
      expect(peca, `base ${b.id} publicada sumiu do acervo`).toBeDefined();
      expect(peca!.rota, `base ${b.id} não aponta a primeira página usável`).toBe(
        usaveis[0]
      );
    }
    // O desempate só é exercitado se existir base cuja 1ª página é dinâmica.
    expect(dinamicaIgnorada, "nenhuma base cobre o desempate de rota").toBeGreaterThan(0);
  });

  it("nenhuma peça de base aponta rota dinâmica '[municipio]'", () => {
    for (const f of montarAcervo().filter((x) => x.id.startsWith("base:"))) {
      expect(f.rota.includes("["), `rota dinâmica em ${f.id}: ${f.rota}`).toBe(false);
    }
  });
});
