import { describe, expect, it } from "vitest";
import { consolidarEditais } from "./consolidar";
import type { ItemEdital } from "./dados";

/**
 * O defeito que este teste trava: o Diário Oficial publica o mesmo ato em
 * vários trechos/dias e a página /editais listava uma linha por trecho.
 * Medido em 18/11/2026: 7 cópias de "Credenciamento SEE/MG: Publicada
 * inabilitação..." e 5 de "Chamamento Público SEJUSP/MG...".
 */
function item(parcial: Partial<ItemEdital> & { titulo: string; dataPublicacao: string }): ItemEdital {
  return {
    id: `${parcial.dataPublicacao}-${parcial.titulo}`,
    orgao: "SEE/MG",
    modalidade: "Credenciamento",
    numero: null,
    objeto: "Credenciamento e homologação de cursos técnicos para o Projeto Trilhas de Futuro",
    condicoesEPrazos: "Prazo regulamentar do certame.",
    urlOficial: "https://www.jornalminasgerais.mg.gov.br/",
    score: 10,
    ...parcial,
  };
}

describe("consolidarEditais", () => {
  it("junta o mesmo certame e mantém um ato por andamento", () => {
    const credenciamento = Array.from({ length: 5 }, (_, i) =>
      item({
        titulo: "Credenciamento SEE/MG: Credenciamento e homologação de cursos técnicos",
        dataPublicacao: "2026-09-12",
        id: `cred-${i}`,
      })
    );
    const inabilitacao = Array.from({ length: 3 }, (_, i) =>
      item({
        titulo: "Credenciamento SEE/MG: Publicada inabilitação de prestadores de serviços",
        modalidade: "Inabilitação de Credenciamento",
        dataPublicacao: "2026-09-12",
        id: `inab-${i}`,
      })
    );

    const resultado = consolidarEditais([...credenciamento, ...inabilitacao]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].atualizacoes).toHaveLength(2);
    expect(resultado[0].atualizacoes?.map((a) => a.modalidade).sort()).toEqual([
      "Credenciamento",
      "Inabilitação de Credenciamento",
    ]);
  });

  it("não mistura chamamentos de números diferentes do mesmo órgão", () => {
    const resultado = consolidarEditais([
      item({
        titulo: "Chamamento Público SEJUSP/MG: Abertas inscrições",
        orgao: "SEJUSP/MG",
        modalidade: "Chamamento Público",
        numero: "381/2025",
        objeto: "Projetos de segurança cidadã",
        dataPublicacao: "2026-09-12",
      }),
      item({
        titulo: "Chamamento Público SEJUSP/MG: Abertas inscrições",
        orgao: "SEJUSP/MG",
        modalidade: "Chamamento Público",
        numero: "1041/2026",
        objeto: "Projetos de segurança cidadã",
        dataPublicacao: "2026-09-10",
      }),
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("guarda o andamento em ordem decrescente e usa a publicação mais recente", () => {
    const resultado = consolidarEditais([
      item({
        titulo: "Credenciamento SEE/MG: Abertura",
        dataPublicacao: "2026-09-10",
        condicoesEPrazos: "Inscrições até 30/09.",
      }),
      item({
        titulo: "Credenciamento SEE/MG: Resultado",
        modalidade: "Resultado de Credenciamento",
        dataPublicacao: "2026-09-20",
        condicoesEPrazos: "Resultado publicado.",
      }),
    ]);
    expect(resultado[0].dataPublicacao).toBe("2026-09-20");
    expect(resultado[0].modalidade).toBe("Resultado de Credenciamento");
    expect(resultado[0].atualizacoes?.[0].data).toBe("2026-09-20");
  });
});
