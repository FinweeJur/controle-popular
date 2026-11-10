import { describe, expect, it } from "vitest";
import type { CasoJurisprudencia } from "./jurisprudencia";
import { linkFonteOficial } from "./jurisprudencia-fonte";

/**
 * A fonte oficial em `/jurisprudencia`.
 *
 * O risco que este teste tranca: transformar busca em link de acórdão. O
 * leitor clica em "Conferir" esperando a decisão e cai num formulário vazio —
 * ou, pior, num processo diferente. Por isso a URL da busca NÃO carrega o
 * número do processo, e a montagem só usa URL constante e verificada.
 */

const caso = (
  processo: string,
  over: Partial<CasoJurisprudencia> = {},
): CasoJurisprudencia => ({
  id: `TJMG:${processo}`,
  processo,
  tribunal: "TJMG",
  tipo: "acordao",
  frente: "brumadinho",
  estado: "MG",
  classe: "Apelação Cível",
  comarca: "Belo Horizonte",
  ano: "2023",
  orgao: "",
  magistrado: "",
  assunto: "",
  polo: "empresa",
  resultado: "negado",
  recorrente: "atingido",
  temas: ["dano moral"],
  ementa: "EMENTA: teste",
  resumo: "resumo de teste",
  danos_pnab: [],
  valor: null,
  link: "",
  status: "aprovado",
  explicacao: "",
  exemplo: "",
  ...over,
});

describe("linkFonteOficial", () => {
  it("usa o link externo do tribunal como link do acórdão", () => {
    const url =
      "https://www5.tjmg.jus.br/jurisprudencia/relatorioEspelhoAcordao.do?ano=26&numero=1";
    const fonte = linkFonteOficial(caso("5010798-50.2022.8.13", { link: url }));
    expect(fonte).toMatchObject({ tipo: "acordao", url, rotulo: "Conferir no TJMG" });
    expect(fonte.tipo === "acordao" && fonte.titulo).toContain("5010798-50.2022.8.13");
  });

  it("cai na busca do TJMG quando o link é a rota interna de inteiro teor", () => {
    const fonte = linkFonteOficial(
      caso("5010798-50.2022.8.13", { link: "/api/inteiro-teor?processo=5010798-50.2022.8.13" }),
    );
    expect(fonte).toMatchObject({
      tipo: "busca",
      url: "https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do",
      rotulo: "Buscar no TJMG",
    });
    // A busca é busca: o número não vai na URL, para não prometer resultado.
    expect(fonte.tipo === "busca" && fonte.url).not.toContain("5010798");
  });

  it("cai na busca quando o link está vazio", () => {
    expect(linkFonteOficial(caso("1", { link: "" }))).toMatchObject({ tipo: "busca" });
    expect(linkFonteOficial(caso("1", { link: "   " }))).toMatchObject({ tipo: "busca" });
  });

  it("usa a consulta oficial do TJES", () => {
    const fonte = linkFonteOficial(
      caso("5053412-44.2024.8.08.0024", { tribunal: "TJES", estado: "ES" }),
    );
    expect(fonte).toMatchObject({
      tipo: "busca",
      url: "https://sistemas.tjes.jus.br/consulta-jurisprudencia/",
      rotulo: "Buscar no TJES",
    });
  });

  it("não transforma esquema perigoso em link e volta para a busca do tribunal", () => {
    expect(linkFonteOficial(caso("1", { link: "javascript:alert(1)" }))).toMatchObject({
      tipo: "busca",
      rotulo: "Buscar no TJMG",
    });
  });

  it("admite que a fonte não existe quando o tribunal não está cadastrado", () => {
    const fonte = linkFonteOficial(caso("1", { tribunal: "TJXX", link: "" }));
    expect(fonte).toEqual({
      tipo: "indisponivel",
      rotulo: "fonte oficial não informada",
      titulo: expect.stringContaining("TJXX"),
    });
    expect("url" in fonte).toBe(false);
  });
});
