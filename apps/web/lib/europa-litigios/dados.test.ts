/**
 * @file apps/web/lib/europa-litigios/dados.test.ts
 * @description Contrato de dados da subfrente de litígios transnacionais.
 *
 * O que protege:
 * 1. Toda afirmação factual tem fonteUrl e dataAcesso.
 * 2. Processo, citação e fase confirmados aparecem sem `pendente`.
 * 3. Braskem/Maceió não é rotulada como Brumadinho.
 * 4. A ADPF é a 1178, conferida; a 1318 não é afirmada.
 * 5. Clipping tem metadados completos e idioma conhecido.
 */

import { describe, expect, it } from "vitest";
import {
  ADPF,
  CLIPPING,
  CONEXOES,
  DATA_ACESSO,
  LINHA_DO_TEMPO,
  LITIGIOS,
  listarFontes,
  POSICIONAMENTOS,
} from "./index";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function esperaUrl(valor: string) {
  expect(valor).toMatch(/^https?:\/\//);
}

function esperaData(valor: string) {
  expect(valor).toMatch(ISO);
  expect(Number.isNaN(Date.parse(valor))).toBe(false);
}

describe("litígios transnacionais — contrato", () => {
  it("usa uma data de coleta ISO e ids únicos", () => {
    esperaData(DATA_ACESSO);
    const ids = LITIGIOS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preenche os campos obrigatórios e a fonte de cada fato", () => {
    for (const litigio of LITIGIOS) {
      expect(["mariana", "brumadinho"]).toContain(litigio.caso);
      expect(litigio.titulo.length).toBeGreaterThan(10);
      expect(litigio.tribunal.length).toBeGreaterThan(3);
      expect(litigio.numeroProcesso.length).toBeGreaterThan(3);
      expect(litigio.partes.autores.length).toBeGreaterThan(0);
      expect(litigio.partes.reus.length).toBeGreaterThan(0);
      expect(litigio.objeto.length).toBeGreaterThan(10);
      expect(litigio.faseProcessual.length).toBeGreaterThan(10);
      esperaData(litigio.dataAcesso);
      expect(litigio.fontes.length).toBeGreaterThan(0);

      for (const fato of litigio.fatos) {
        expect(fato.descricao.length).toBeGreaterThan(10);
        esperaUrl(fato.fonteUrl);
        esperaData(fato.dataAcesso);
      }
      for (const ato of litigio.atos) {
        esperaData(ato.data);
        esperaUrl(ato.fonteUrl);
        esperaData(ato.dataAcesso);
      }
      for (const fonte of litigio.fontes) {
        esperaUrl(fonte.url);
        esperaData(fonte.dataAcesso);
      }
    }
  });

  it("marca pendência com motivo visível", () => {
    for (const litigio of LITIGIOS) {
      if (litigio.pendente) {
        expect(litigio.observacaoPendencia?.length).toBeGreaterThan(20);
      }
    }
    const holanda = LITIGIOS.find((l) => l.id === "mariana-rio-doce-claims-holanda");
    expect(holanda?.pendente).toBe(true);
    expect(holanda?.observacaoPendencia).toMatch(/não localizado/i);
  });

  it("confirma o processo inglês na fonte oficial e a fase atual", () => {
    const inglaterra = LITIGIOS.find((l) => l.id === "mariana-bhp-inglaterra");
    expect(inglaterra?.pendente).toBe(false);
    expect(inglaterra?.numeroProcesso).toContain("HT-2022-000304");
    expect(inglaterra?.citacaoNeutra).toBe("[2025] EWHC 3001 (TCC)");
    expect(inglaterra?.faseProcessual).toContain("14/11/2025");
    expect(inglaterra?.faseProcessual).toContain("2027");
    expect(
      inglaterra?.fontes.some((f) =>
        f.url.includes("caselaw.nationalarchives.gov.uk"),
      ),
    ).toBe(true);
  });

  it("não inventa litígio europeu de Brumadinho", () => {
    const brumadinhoConfirmado = LITIGIOS.some(
      (l) => l.caso === "brumadinho" && !l.pendente,
    );
    expect(brumadinhoConfirmado).toBe(false);
  });

  it("mantém a Braskem/Maceió como conexão, nunca como Brumadinho", () => {
    expect(CONEXOES.length).toBeGreaterThan(0);
    for (const conexao of CONEXOES) {
      expect(conexao.titulo.toLowerCase()).toContain("braskem");
      expect(conexao.titulo).toContain("distinto de Brumadinho");
      expect(conexao.pendente).toBe(false);
      expect(conexao.numeroProcesso).toContain("ECLI:NL:RBROT:2024:6662");
      esperaData(conexao.dataAcesso);
      expect(conexao.fontes.length).toBeGreaterThan(0);
    }
  });
});

describe("linha do tempo e clipping", () => {
  it("ordena a linha do tempo e exige fonte em cada marco", () => {
    expect(LINHA_DO_TEMPO.length).toBeGreaterThanOrEqual(8);
    const datas = LINHA_DO_TEMPO.map((i) => i.data);
    expect([...datas].sort()).toEqual(datas);
    for (const item of LINHA_DO_TEMPO) {
      esperaData(item.data);
      esperaUrl(item.fonteUrl);
      esperaData(item.dataAcesso);
      if (item.pendente) {
        expect(item.observacaoPendencia?.length).toBeGreaterThan(10);
      }
    }
  });

  it("traz clipping com metadados completos e idioma conhecido", () => {
    expect(CLIPPING.length).toBeGreaterThanOrEqual(6);
    const ids = CLIPPING.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of CLIPPING) {
      expect(item.veiculo.length).toBeGreaterThan(1);
      esperaData(item.data);
      expect(item.titulo.length).toBeGreaterThan(10);
      esperaUrl(item.url);
      expect(["pt", "en", "es", "nl"]).toContain(item.idioma);
      expect(typeof item.paywall).toBe("boolean");
      esperaData(item.dataAcesso);
    }
  });
});

describe("posicionamentos e ADPF", () => {
  it("lista os atores pedidos, todos com link", () => {
    const autores = POSICIONAMENTOS.map((p) => p.autor.toLowerCase()).join(" | ");
    for (const ator of ["bhp", "vale", "samarco", "braskem", "mpf", "polícia federal"]) {
      expect(autores).toContain(ator);
    }
    for (const posicao of POSICIONAMENTOS) {
      esperaUrl(posicao.url);
      esperaData(posicao.dataAcesso);
    }
  });

  it("identifica a ADPF 1178 e explica que a 1318 é outra", () => {
    expect(ADPF.numero).toBe("1178");
    expect(ADPF.relator).toBe("Flávio Dino");
    expect(ADPF.pendente).toBe(false);
    expect(ADPF.observacao).toContain("1318");
    expect(ADPF.links.some((l) => l.url.includes("stf.jus.br"))).toBe(true);
    expect(ADPF.relacaoComLitigios.length).toBeGreaterThan(50);
  });
});

describe("fontes da frente", () => {
  it("deduplica por URL e inclui a sentença inglesa", () => {
    const fontes = listarFontes();
    const urls = fontes.map((f) => f.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(
      "https://caselaw.nationalarchives.gov.uk/ewhc/tcc/2025/3001",
    );
    for (const fonte of fontes) {
      esperaUrl(fonte.url);
      esperaData(fonte.dataAcesso);
    }
  });
});
