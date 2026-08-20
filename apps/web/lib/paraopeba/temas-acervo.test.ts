import { describe, expect, it } from "vitest";
import dataset from "../../../../etl/betim/dados/pericia-ufmg.json";
import {
  COBERTURA_TEMATICA_PERICIA,
  temasDoDocumentoPericia,
  type DocumentoPericiaUfmg,
  type SecaoPericia,
} from "./temas-acervo";

const DOCUMENTOS: DocumentoPericiaUfmg[] = (dataset.documentos as Array<{
  url: string;
  nome_arquivo: string;
  secao: string;
  citado_em: string[];
  ano_mes_do_caminho: string | null;
}>).map((d) => ({
  url: d.url,
  nomeArquivo: d.nome_arquivo,
  secao: d.secao as SecaoPericia,
  citadoEm: d.citado_em,
  anoMes: d.ano_mes_do_caminho,
}));

describe("temas do acervo da perícia", () => {
  it("o dataset é o acervo completo que a varredura mediu", () => {
    expect(DOCUMENTOS).toHaveLength(COBERTURA_TEMATICA_PERICIA.total);
    expect(dataset.paginas_na_fila_ao_parar).toBe(0);
  });

  it("classifica pouco de propósito — a cobertura declarada é a real", () => {
    const comTema = DOCUMENTOS.filter((d) => temasDoDocumentoPericia(d).length > 0);
    expect(comTema).toHaveLength(COBERTURA_TEMATICA_PERICIA.comTema);
  });

  it("nenhum edital nem papelada de chamada recebe tema", () => {
    const indevidos = DOCUMENTOS.filter(
      (d) =>
        (d.secao === "chamada" || d.secao === "processo") &&
        temasDoDocumentoPericia(d).length > 0,
    );
    expect(indevidos).toEqual([]);
  });

  it("os 7 documentos de resultado do node/582 têm todos tema", () => {
    const resultados = DOCUMENTOS.filter((d) => d.secao === "apresentacao_de_resultados");
    expect(resultados).toHaveLength(7);
    for (const doc of resultados) {
      expect(temasDoDocumentoPericia(doc).length).toBeGreaterThan(0);
    }
  });

  it("todo tema atribuído é um slug real de TemaAjri, nunca vocabulário paralelo", () => {
    // A ponte de `relacionados.ts` só liga por slug conhecido: inventar um
    // rótulo aqui produziria link que não resolve em lugar nenhum.
    const conhecidos = new Set([
      "qualidade-da-agua", "plano-de-reparacao", "licenciamento-ambiental",
      "sistemas-de-contencao", "solos-e-sedimentos", "manejo-de-rejeitos",
      "fauna", "dragagem", "comunicacao-e-relacionamento", "flora",
      "frentes-emergenciais", "patrimonio-cultural", "qualidade-do-ar",
      "seguranca-das-estruturas-remanescentes", "sistema-de-abastecimento-de-agua",
      "seguranca-hidrica", "risco-saude-publica", "agua-subterranea",
      "risco-ecologico", "risco-meio-ambiente", "agua-potavel",
      "programas-de-compensacao", "peabp", "seguranca-do-alimento", "cronograma",
    ]);
    for (const doc of DOCUMENTOS) {
      for (const tema of temasDoDocumentoPericia(doc)) {
        expect(conhecidos.has(tema), `${tema} não é TemaAjri`).toBe(true);
      }
    }
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    const alvo = DOCUMENTOS.find((d) => d.secao === "apresentacao_de_resultados")!;
    expect(temasDoDocumentoPericia(alvo)).toEqual(temasDoDocumentoPericia(alvo));
  });

  it("nome com percent-encoding inválido não derruba a classificação", () => {
    const quebrado: DocumentoPericiaUfmg = {
      url: "http://exemplo/%E0%A4%A.pdf",
      nomeArquivo: "%E0%A4%A.pdf",
      secao: "material_didatico",
      citadoEm: ["/escola"],
      anoMes: null,
    };
    expect(() => temasDoDocumentoPericia(quebrado)).not.toThrow();
    expect(temasDoDocumentoPericia(quebrado)).toEqual([]);
  });
});
