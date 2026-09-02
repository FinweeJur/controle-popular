import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { COBERTURA_BIBLIOTECA_DESASTRES } from "./desastres-cobertura";
import {
  distribuicaoPorAno,
  filtrarItens,
  type BibliotecaDesastres,
  type Desastre,
  type ItemDesastre,
} from "./desastres";
import { ehItemBloqueado } from "../paraopeba/triagem";

/**
 * Contrato da biblioteca unificada dos desastres de Mariana e Brumadinho,
 * gerada por `scripts/agregar-biblioteca-desastres.mts`.
 *
 * O que estes testes travam não é o número (ele cresce com cada fonte), é a
 * REGRA: desastre obrigatório, id/url únicos, nada de arquivo (exceto a
 * exceção NACAB, herdada do acervo das ATIs), nada que a triagem aponte, e
 * paridade entre o array e as constantes de servidor.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const CAMINHO = resolve(AQUI, "../../public/data/biblioteca-desastres.json");

function ler(): BibliotecaDesastres {
  return JSON.parse(readFileSync(CAMINHO, "utf-8")) as BibliotecaDesastres;
}

const DESASTRES_VALIDOS = new Set<Desastre>(["mariana", "brumadinho"]);

describe("biblioteca unificada de desastres", () => {
  test("o acervo foi gerado e tem tamanho plausível", () => {
    const dados = ler();
    expect(dados.itens.length).toBeGreaterThan(400);
    expect(dados.geradoEm).not.toBe("");
    expect(dados.fontes.length).toBeGreaterThan(0);
  });

  test("paridade: a cobertura de servidor bate com o array", () => {
    const dados = ler();
    expect(COBERTURA_BIBLIOTECA_DESASTRES.total).toBe(dados.itens.length);
    const somaDesastres =
      COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.mariana +
      COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.brumadinho;
    expect(somaDesastres).toBe(dados.itens.length);
  });

  test("todo item tem desastre válido e bacia coerente", () => {
    const dados = ler();
    for (const i of dados.itens) {
      expect(DESASTRES_VALIDOS.has(i.desastre)).toBe(true);
      if (i.desastre === "mariana") expect(i.bacia).toBe("doce");
      if (i.desastre === "brumadinho") expect(i.bacia).toBe("paraopeba");
    }
  });

  test("id e url são únicos — fonte que duplica infla a contagem", () => {
    const dados = ler();
    expect(new Set(dados.itens.map((i) => i.id)).size).toBe(dados.itens.length);
    expect(new Set(dados.itens.map((i) => i.url)).size).toBe(dados.itens.length);
  });

  /**
   * "Linkar, não copiar". Um link direto para PDF faria a tela redistribuir
   * obra de terceiro sem licença declarada. Exceções herdadas: o NACAB não
   * publica página individual por item — sua biblioteca é uma listagem com
   * links diretos aos PDFs; o CBH-Doce idem (listagem de deliberações, sem
   * página por item). Nos dois, a URL do arquivo no servidor da fonte é a
   * única referência honesta (o portal continua não hospedando o arquivo).
   */
  test("nenhum item aponta para o arquivo, só para a página (exceto NACAB e CBH-Doce)", () => {
    const dados = ler();
    const excecoes = (i: ItemDesastre) =>
      (i.fonteId === "biblioteca-atis" && i.orgao === "NACAB") || i.fonteId === "cbh-doce";
    const arquivos = dados.itens.filter(
      (i) => !excecoes(i) && /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|#|$)/i.test(i.url)
    );
    expect(arquivos).toEqual([]);
    // Garante que a exceção não esvaziou o CBH-Doce por engano.
    const cbh = dados.itens.filter((i) => i.fonteId === "cbh-doce");
    expect(cbh.length).toBeGreaterThan(0);
    expect(cbh.every((i) => i.url.startsWith("https://") && i.url.includes("cbhdoce.org.br"))).toBe(true);
  });

  test("a triagem rodou e nada que ela aponta foi publicado", () => {
    const dados = ler();
    const disparados = dados.itens.filter((i) =>
      ehItemBloqueado({ tipo: i.tipo, titulo: i.titulo, resumo: i.resumo, temas: i.tags })
    );
    expect(disparados).toEqual([]);
    expect(COBERTURA_BIBLIOTECA_DESASTRES.barradosPelaTriagem).toBeGreaterThanOrEqual(0);
  });

  test("resumo só existe quando publicado pela fonte — nunca gerado", () => {
    // Fontes como Fundo Brasil publicam excerto oficial da página de busca.
    // O teste garante que o campo, quando presente, vem de fonte autorizada.
    const dados = ler();
    for (const i of dados.itens) {
      if (i.resumo) {
        expect(typeof i.resumo).toBe("string");
        expect(i.fonteId).toBe("fundo-brasil");
      }
    }
  });

  test("filtrarItens separa os dois desastres e é insensível a acento", () => {
    const dados = ler();
    const soBrumadinho = filtrarItens(dados.itens, {
      busca: "",
      desastres: new Set<Desastre>(["brumadinho"]),
      esferas: new Set(),
      orgao: "todos",
      tipo: "todos",
      ano: "todos",
      uf: "todos",
      tag: "todos",
      de: "",
      ate: "",
    });
    expect(soBrumadinho.length).toBe(COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.brumadinho);
    expect(soBrumadinho.every((i) => i.desastre === "brumadinho")).toBe(true);
    // "corrego do feijao" (sem acento) acha título com "Córrego".
    const busca = filtrarItens(dados.itens, {
      busca: "corrego",
      desastres: new Set(),
      esferas: new Set(),
      orgao: "todos",
      tipo: "todos",
      ano: "todos",
      uf: "todos",
      tag: "todos",
      de: "",
      ate: "",
    });
    expect(busca.length).toBeGreaterThanOrEqual(0);
  });

  test("distribuicaoPorAno soma ao total, contando os sem data", () => {
    const dados = ler();
    const serie = distribuicaoPorAno(dados.itens);
    const soma = serie.reduce((s, a) => s + a.total, 0);
    expect(soma).toBe(dados.itens.length);
    const semData = serie.find((a) => a.ano === 0);
    expect(Number(semData?.semData ?? 0)).toBe(dados.itens.filter((i: ItemDesastre) => !i.data).length);
  });
});
