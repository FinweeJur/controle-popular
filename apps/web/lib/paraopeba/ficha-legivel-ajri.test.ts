import { describe, expect, test } from "vitest";

import {
  INSTRUMENTO_AJRI_ORDEM,
  TEMA_AJRI_LABEL,
  TEMA_AJRI_ORDEM,
  TIPO_DOCUMENTO_AJRI_ORDEM,
} from "./auditoria-ajri";
import { lerAuditoriaAjri } from "./auditoria-ajri-dados";
import {
  GLOSA_DISCIPLINA_AJRI,
  GLOSA_INSTRUMENTO_AJRI,
  GLOSA_TEMA_AJRI,
  GLOSA_TIPO_AJRI,
  PROCEDENCIA_AJRI,
  dataPorExtensoBR,
  fichaLegivelAjri,
  numeroDoRelatorioAjri,
  periodoExaminadoAjri,
} from "./ficha-legivel-ajri";

const AUDITORIA_AJRI = lerAuditoriaAjri();

/**
 * Contrato da ficha legível dos 467 documentos da auditoria (AJRI).
 *
 * O que estes testes travam não é o texto bonito, é a **regra**: a ficha sai
 * inteira de metadado, não afirma nada que o metadado não sustenta, e não
 * imprime intervalo impossível. Um acervo futuro que quebre qualquer uma
 * dessas coisas vira erro aqui e não vira página.
 */
describe("ficha legível da auditoria (AJRI)", () => {
  test("todo documento do acervo produz ficha completa — 467/467", () => {
    const semFicha = AUDITORIA_AJRI.filter((d) => {
      const f = fichaLegivelAjri(d);
      return !f.oQueE || !f.quando || f.quando === "—" || !f.deOndeVem || f.sobreOQue.length === 0;
    });
    expect(semFicha).toEqual([]);
    expect(AUDITORIA_AJRI.length).toBe(467);
  });

  test("a frase começa por Relatório ou Nota técnica e termina em ponto", () => {
    const fora = AUDITORIA_AJRI.filter((d) => {
      const { oQueE } = fichaLegivelAjri(d);
      return !/^(Relatório|Nota técnica)/.test(oQueE) || !oQueE.endsWith(".");
    });
    expect(fora).toEqual([]);
  });

  /**
   * A regra que dá razão de ser ao arquivo. Se um dia alguém acrescentar uma
   * frase de veredito ("a auditoria apontou…", "recomendou…"), este teste
   * quebra — e tem que quebrar: conclusão de auditor não está em metadado
   * nenhum, está dentro do PDF, e nenhum PDF foi baixado.
   */
  test("nenhuma ficha afirma conclusão, recomendação ou juízo do auditor", () => {
    const proibido =
      /\b(conclui|concluiu|conclus[ãa]o|recomend|apont(ou|amento)|n[ãa]o\s*conformidade|irregularidade|descumpr|aprovou|reprovou)/i;
    const acusadas = AUDITORIA_AJRI.filter((d) => {
      const f = fichaLegivelAjri(d);
      return proibido.test(`${f.oQueE} ${f.sobreOQue.join(" ")} ${f.deOndeVem}`);
    });
    expect(acusadas).toEqual([]);
  });

  test("toda ficha credita a AECOM, e o crédito é o mesmo nos 467", () => {
    const distintos = new Set(AUDITORIA_AJRI.map((d) => fichaLegivelAjri(d).deOndeVem));
    expect([...distintos]).toEqual([PROCEDENCIA_AJRI]);
    expect(PROCEDENCIA_AJRI).toContain("AECOM");
  });

  test("os temas da ficha são os do documento, na mesma ordem", () => {
    for (const d of AUDITORIA_AJRI.slice(0, 40)) {
      const esperado = d.temas.map((t) => GLOSA_TEMA_AJRI[t] ?? TEMA_AJRI_LABEL[t]);
      expect(fichaLegivelAjri(d).sobreOQue).toEqual(esperado);
    }
  });

  /**
   * A ficha não pode inventar rótulo: todo tema do acervo tem que ter rótulo
   * humano, e toda glosa tem que apontar para um tema que existe.
   */
  test("o vocabulário cobre o acervo inteiro, e nada além dele", () => {
    for (const i of INSTRUMENTO_AJRI_ORDEM) expect(GLOSA_INSTRUMENTO_AJRI[i]).toBeTruthy();
    for (const t of TIPO_DOCUMENTO_AJRI_ORDEM) expect(GLOSA_TIPO_AJRI[t].oQueE).toBeTruthy();
    for (const t of Object.keys(GLOSA_TEMA_AJRI)) {
      expect(TEMA_AJRI_ORDEM).toContain(t);
    }
    const disciplinasDoAcervo = new Set(AUDITORIA_AJRI.map((d) => d.disciplina));
    for (const d of Object.keys(GLOSA_DISCIPLINA_AJRI)) {
      expect(disciplinasDoAcervo).toContain(d);
    }
  });

  /**
   * `SH` é Saúde Humana, não Segurança Hídrica — 82/82 dos documentos `SH`
   * dizem "Saúde Humana" na descrição. Duas siglas parecidas para coisas
   * diferentes, e a errada seria invisível na tela.
   */
  test("a glosa de disciplina bate com o texto da própria AECOM", () => {
    const evidencia: [string, RegExp][] = [
      ["CO", /copasa/i],
      ["SH", /sa[uú]de\s+humana/i],
      ["A2", /anexo\s*II\.?2/i],
    ];
    for (const [disciplina, re] of evidencia) {
      const docs = AUDITORIA_AJRI.filter((d) => d.disciplina === disciplina);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.filter((d) => re.test(d.descricao)).length).toBe(docs.length);
    }
  });

  /**
   * A disciplina só entra na frase quando esclarece. Medido: ela é redundante
   * com o instrumento em 449 dos 467 — sobram os 18 do Anexo II.2.
   */
  test("só os 18 documentos do Anexo II.2 ganham complemento de disciplina", () => {
    const comComplemento = AUDITORIA_AJRI.filter((d) =>
      fichaLegivelAjri(d).oQueE.includes("na parte que trata")
    );
    expect(comComplemento.length).toBe(18);
    expect(new Set(comComplemento.map((d) => d.disciplina))).toEqual(new Set(["A2"]));
  });

  describe("quando — a data por extenso", () => {
    test("formata sem cair no bug de fuso do new Date", () => {
      expect(dataPorExtensoBR("2026-07-31")).toBe("31 de julho de 2026");
      expect(dataPorExtensoBR("2019-02-28")).toBe("28 de fevereiro de 2019");
      expect(dataPorExtensoBR("2021-01-01")).toBe("1 de janeiro de 2021");
      expect(dataPorExtensoBR("2020-03-09")).toBe("9 de março de 2020");
    });

    test("entrada inválida vira travessão, nunca uma data inventada", () => {
      expect(dataPorExtensoBR("")).toBe("—");
      expect(dataPorExtensoBR(null)).toBe("—");
      expect(dataPorExtensoBR("31/07/2026")).toBe("—");
      expect(dataPorExtensoBR("2026-13-01")).toBe("—");
    });
  });

  describe("período examinado — o que a `data` de publicação NÃO diz", () => {
    test("lê as formas que a AECOM realmente escreve", () => {
      const casos: [string, string, string][] = [
        [
          "no período compreendido entre 23 de junho a 21 de julho de 2026.",
          "2026-06-23",
          "2026-07-21",
        ],
        ["no período compreendido entre 01 e 30 de junho de 2026.", "2026-06-01", "2026-06-30"],
        [
          "no período compreendido entre 16 de junho de 2026 e 15 de julho de 2026.",
          "2026-06-16",
          "2026-07-15",
        ],
        [
          "no período compreendido entre 11 de agosto à 10 de setembro de 2021.",
          "2021-08-11",
          "2021-09-10",
        ],
        ["no período compreendido entre 14/04/2020 à 15/05/2020.", "2020-04-14", "2020-05-15"],
        [
          "no período compreendido entre 16 de outubro de 2025 15 de novembro de 2025.",
          "2025-10-16",
          "2025-11-15",
        ],
        [
          "no período compreendido entre 08 de dezembro de 2020 à 15 de janeiro de 2021.",
          "2020-12-08",
          "2021-01-15",
        ],
      ];
      for (const [texto, de, ate] of casos) {
        expect(periodoExaminadoAjri(texto)).toMatchObject({ de, ate });
      }
    });

    /** O começo herda o ano do fim, e vira o ano anterior quando o mês recua. */
    test("o ano omitido no começo é herdado, inclusive virando o ano", () => {
      expect(periodoExaminadoAjri("no período compreendido entre 16 de dezembro a 15 de janeiro de 2026")).toMatchObject({
        de: "2025-12-16",
        ate: "2026-01-15",
      });
    });

    /**
     * A guarda que impede publicar intervalo impossível. Um documento do
     * acervo traz "13 de dezembro de 2020 e 24 de janeiro de 2020" — erro de
     * digitação da fonte. Este portal não conserta o texto da AECOM nem
     * imprime a bobagem: omite o período.
     */
    test("intervalo invertido é descartado, não consertado", () => {
      expect(
        periodoExaminadoAjri(
          "no período compreendido entre 13 de dezembro de 2020 e 24 de janeiro de 2020."
        )
      ).toBeNull();
    });

    test("descrição sem a frase não inventa período", () => {
      expect(periodoExaminadoAjri("Nota Técnica referente à análise do Adendo do Remanso 3.")).toBeNull();
      expect(periodoExaminadoAjri("")).toBeNull();
    });

    /**
     * Cobertura medida em 15/08/2026 e travada aqui: 386 documentos trazem a
     * frase, 385 viram período (o 386º é o invertido). Se uma coleta futura
     * mudar a redação da fonte e a extração despencar, quebra aqui.
     */
    test("cobertura no acervo real: 386 com a frase, 385 com período", () => {
      const comFrase = AUDITORIA_AJRI.filter((d) =>
        /per[ií]odo\s+compreendido\s+entre/i.test(d.descricao)
      );
      const comPeriodo = AUDITORIA_AJRI.filter((d) => fichaLegivelAjri(d).periodoExaminado !== null);
      expect(comFrase.length).toBe(386);
      expect(comPeriodo.length).toBe(385);
    });

    test("nenhuma Nota Técnica tem período, e é assim na fonte", () => {
      const notas = AUDITORIA_AJRI.filter((d) => d.tipo === "nota-tecnica");
      expect(notas.length).toBe(76);
      expect(notas.filter((d) => fichaLegivelAjri(d).periodoExaminado !== null)).toEqual([]);
    });

    test("nenhum período começa antes de existir barragem rompida", () => {
      const fora = AUDITORIA_AJRI.filter((d) => {
        const p = fichaLegivelAjri(d).periodoExaminado;
        return p !== null && p.de < "2018-01-01";
      });
      expect(fora).toEqual([]);
    });

    /**
     * ⚠️ **A fonte tem 3 documentos em que o período examinado termina DEPOIS
     * da data de publicação** — entre 9 e 41 dias depois, todos de 2022, todos
     * do mesmo projeto `60612553`. Não é erro da extração: está escrito assim
     * na descrição da AECOM (um deles, o `…-RP-PM-0042-2022`, publica em
     * 26/05/2022 um relatório "no período compreendido entre 11 de junho e 06
     * de julho de 2022").
     *
     * Este teste não conserta nada — trava o NÚMERO. Se uma coleta futura
     * fizer esse total crescer, ou a data de publicação do portal mudou de
     * significado, ou a extração passou a ler o período errado, e nos dois
     * casos alguém tem que olhar antes de publicar.
     */
    test("só 3 documentos têm período posterior à publicação, e é da fonte", () => {
      const posteriores = AUDITORIA_AJRI.filter((d) => {
        const p = fichaLegivelAjri(d).periodoExaminado;
        return p !== null && p.ate > d.data;
      });
      expect(posteriores.length).toBe(3);
      expect(new Set(posteriores.map((d) => d.data.slice(0, 4)))).toEqual(new Set(["2022"]));
    });
  });

  describe("numeração — do código, e só nos Relatórios", () => {
    test("o sequencial sai do 7º segmento do código", () => {
      const doc = AUDITORIA_AJRI.find(
        (d) => d.codigo === "60612553-ACM-DM-CO-RP-PM-0084-2026"
      );
      expect(doc).toBeDefined();
      expect(numeroDoRelatorioAjri(doc!)).toBe(84);
      expect(fichaLegivelAjri(doc!).oQueE).toContain("Relatório nº 84");
    });

    test("Nota Técnica não recebe número — o sequencial dela repete na fonte", () => {
      const notas = AUDITORIA_AJRI.filter((d) => d.tipo === "nota-tecnica");
      expect(notas.filter((d) => numeroDoRelatorioAjri(d) !== null)).toEqual([]);
      expect(notas.filter((d) => /nº/.test(fichaLegivelAjri(d).oQueE))).toEqual([]);
    });

    test("todo Relatório do acervo tem número — 391/391", () => {
      const relatorios = AUDITORIA_AJRI.filter((d) => d.tipo === "relatorio");
      expect(relatorios.length).toBe(391);
      expect(relatorios.filter((d) => numeroDoRelatorioAjri(d) === null)).toEqual([]);
    });
  });

  describe("sobre o quê — os temas com rótulo humano", () => {
    test("nenhum rótulo da ficha é slug de máquina", () => {
      const comSlug = AUDITORIA_AJRI.filter((d) =>
        fichaLegivelAjri(d).sobreOQue.some((r) => /^[a-z0-9-]+$/.test(r))
      );
      expect(comSlug).toEqual([]);
    });

    test("a sigla PEABP aparece expandida, como a própria AECOM a expande", () => {
      const doc = AUDITORIA_AJRI.find((d) => d.temas.includes("peabp"))!;
      expect(fichaLegivelAjri(doc).sobreOQue.join(" | ")).toContain(
        "Programa de Educação Ambiental de Brumadinho"
      );
    });
  });

  test("a função é pura — duas chamadas devolvem o mesmo", () => {
    for (const d of AUDITORIA_AJRI.slice(0, 30)) {
      expect(fichaLegivelAjri(d)).toEqual(fichaLegivelAjri(d));
    }
  });
});
