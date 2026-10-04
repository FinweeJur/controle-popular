/**
 * Testes do calendário de datas de referência (`/memoria` e home).
 *
 * Guardam o contrato: toda data tem dia/mês válido, título, descrição, ao
 * menos um tipo de luta e uma fonte com link http(s) — a mesma guarda
 * editorial de todo o acervo (AGENTS.md §7). A citação curta sai no
 * formato do dev `(Instituição, Ano)`.
 *
 * A lista foi GENERALIZADA em 04/10/2026 (dono): passou dos quatro exemplos
 * iniciais para os eixos do portal (meio ambiente, direitos humanos, povos
 * indígenas, saúde, mulheres, trabalho, educação, infância, memória). Os
 * testes abaixo guardam a cobertura, o formato do rótulo e a chave única.
 */

import { describe, expect, it } from "vitest";
import {
  DATAS_REFERENCIA,
  citacaoCurtaData,
  diaMesPorExtenso,
  referenciaDoDia,
  tituloMisticaDoDia,
} from "./datas-referencia";

describe("DATAS_REFERENCIA", () => {
  it("tem um conjunto amplo de datas (meta 40 a 80)", () => {
    expect(DATAS_REFERENCIA.length).toBeGreaterThanOrEqual(45);
    expect(DATAS_REFERENCIA.length).toBeLessThanOrEqual(80);
  });

  it("toda data tem diaMes MM-DD válido", () => {
    for (const d of DATAS_REFERENCIA) {
      expect(d.diaMes, `diaMes inválido em ${d.titulo}`).toMatch(/^\d{2}-\d{2}$/);
      const [mes, dia] = d.diaMes.split("-").map(Number);
      expect(mes).toBeGreaterThanOrEqual(1);
      expect(mes).toBeLessThanOrEqual(12);
      expect(dia).toBeGreaterThanOrEqual(1);
      expect(dia).toBeLessThanOrEqual(31);
    }
  });

  it("todo rótulo começa por 'Dia' (formato consumido pela home)", () => {
    for (const d of DATAS_REFERENCIA) {
      expect(d.titulo, `rótulo fora do padrão: ${d.titulo}`).toMatch(/^Dia\b/);
    }
  });

  it("toda data tem título, descrição, tipo e fonte completa", () => {
    for (const d of DATAS_REFERENCIA) {
      expect(d.titulo.trim().length, `título vazio em ${d.diaMes}`).toBeGreaterThan(0);
      expect(d.descricao.trim().length, `descrição vazia em ${d.titulo}`).toBeGreaterThan(0);
      expect(d.tipo.length, `tipo vazio em ${d.titulo}`).toBeGreaterThan(0);
      expect(d.fonte.orgao.trim().length).toBeGreaterThan(0);
      expect(d.fonte.ano.trim().length).toBeGreaterThan(0);
      expect(/^https?:\/\//i.test(d.fonte.url), `URL inválida em ${d.titulo}`).toBe(true);
    }
  });

  it("não repete a mesma data (diaMes) duas vezes", () => {
    const vistos = new Set<string>();
    for (const d of DATAS_REFERENCIA) {
      expect(vistos.has(d.diaMes), `data duplicada: ${d.diaMes}`).toBe(false);
      vistos.add(d.diaMes);
    }
  });
});

describe("citacaoCurtaData", () => {
  it("sai no formato (Instituição, Ano)", () => {
    const mab = DATAS_REFERENCIA.find((d) => d.fonte.orgao === "MAB");
    expect(mab).toBeDefined();
    if (mab) expect(citacaoCurtaData(mab.fonte)).toBe(`MAB, ${mab.fonte.ano}`);
  });
});

describe("dias marcantes da home", () => {
  it("traz os dias citados pelo dono", () => {
    // 05-06 meio ambiente, 11-20 consciência negra, 09-07 independência,
    // 03-14 luta contra as barragens (dono, 04/10/2026).
    for (const dia of ["05-06", "11-20", "09-07", "03-14"]) {
      expect(referenciaDoDia(dia), `falta o dia ${dia}`).not.toBeNull();
    }
  });

  it("cobre uma amostra representativa dos eixos novos", () => {
    // Meio ambiente/água, direitos humanos, povos originários, saúde,
    // mulheres, trabalho, educação, infância, memória e transparência.
    const amostra: Record<string, string> = {
      "03-22": "Dia Mundial da Água",
      "03-21": "Dia Internacional pela Eliminação da Discriminação Racial",
      "08-09": "Dia Internacional dos Povos Indígenas",
      "04-07": "Dia Mundial da Saúde",
      "11-25": "Dia Internacional pela Eliminação da Violência contra a Mulher",
      "05-13": "Dia da Abolição da Escravatura no Brasil",
      "01-24": "Dia Internacional da Educação",
      "10-01": "Dia Internacional da Pessoa Idosa",
      "09-28": "Dia Internacional do Acesso Universal à Informação",
      "12-09": "Dia Internacional contra a Corrupção",
    };
    for (const [dia, titulo] of Object.entries(amostra)) {
      const ref = referenciaDoDia(dia);
      expect(ref, `falta o dia ${dia}`).not.toBeNull();
      expect(ref?.titulo).toBe(titulo);
    }
  });

  it("referenciaDoDia devolve null em dia comum", () => {
    expect(referenciaDoDia("12-31")).toBeNull();
  });

  it("diaMesPorExtenso sai em português, sem zero à esquerda", () => {
    // Mês em JS é 0-based: 8 = setembro.
    expect(diaMesPorExtenso(new Date(2026, 8, 7))).toBe("7 de setembro");
  });

  it("tituloMisticaDoDia traz a data e, com dia marcante, o nome", () => {
    const semDia = tituloMisticaDoDia(new Date(2026, 9, 4), null);
    expect(semDia).toBe("Mística do Dia 4 de outubro");

    const independencia = referenciaDoDia("09-07");
    const comDia = tituloMisticaDoDia(new Date(2026, 8, 7), independencia);
    expect(comDia).toBe(
      "Mística do Dia 7 de setembro - Dia da Independência do Brasil",
    );
  });

  it("tituloMisticaDoDia usa o rótulo de uma data nova", () => {
    const agua = referenciaDoDia("03-22");
    expect(tituloMisticaDoDia(new Date(2026, 2, 22), agua)).toBe(
      "Mística do Dia 22 de março - Dia Mundial da Água",
    );
  });
});
