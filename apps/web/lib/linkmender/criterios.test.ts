import { describe, expect, test } from "vitest";

import {
  avaliarCandidato,
  corpoConfere,
  hostAceitavel,
  hostGovernamental,
  hostProprioOuR2,
  similaridadeTitulo,
  tipoConteudoDeUrl,
  tipoDeContentType,
} from "./criterios";

/**
 * Contrato dos critérios de aceitação — a regra "API responde 200 e mente"
 * vira código aqui. Se alguém afrouxar um critério (ex.: aceitar 401 como
 * vivo, ou permitir PDF→HTML), um destes testes fica vermelho.
 */

describe("dominios", () => {
  test("sufixos de poder publico sao governamentais", () => {
    expect(hostGovernamental("www.planalto.gov.br")).toBe(true);
    expect(hostGovernamental("mpmg.mp.br")).toBe(true);
    expect(hostGovernamental("pge.jus.br")).toBe(true);
    expect(hostGovernamental("legis.senado.leg.br")).toBe(true);
    expect(hostGovernamental("sistemas.meioambiente.mg.gov.br")).toBe(true);
  });

  test("dominio comercial ou deusuario NAO e governamental", () => {
    expect(hostGovernamental("github.com")).toBe(false);
    expect(hostGovernamental("drive.google.com")).toBe(false);
    expect(hostGovernamental("notgouv.gov.br.evil.com")).toBe(false);
    expect(hostGovernamental("b3.com.br")).toBe(false);
  });

  test("dominio proprio e buckets R2 publicos sao aceitaveis", () => {
    expect(hostProprioOuR2("controlepopular.com.br")).toBe(true);
    expect(hostProprioOuR2("pub-xyz.r2.dev")).toBe(true);
    expect(hostAceitavel("www.gov.br")).toBe(true);
    expect(hostAceitavel("b3.com.br")).toBe(false);
    expect(hostAceitavel("rua.site")).toBe(false);
  });
});

describe("tipos de conteudo", () => {
  test("URL declara o tipo pela extensao", () => {
    expect(tipoConteudoDeUrl("https://x.gov.br/doc/relatorio.pdf")).toBe("pdf");
    expect(tipoConteudoDeUrl("https://x.gov.br/pagina.html")).toBe("html");
    expect(tipoConteudoDeUrl("https://x.gov.br/pagina")).toBe("desconhecido");
  });

  test("Content-Type declara o tipo da candidata", () => {
    expect(tipoDeContentType("application/pdf")).toBe("pdf");
    expect(tipoDeContentType("text/html; charset=utf-8")).toBe("html");
    expect(tipoDeContentType(null)).toBe("desconhecido");
    expect(tipoDeContentType("application/octet-stream")).toBe("desconhecido");
  });
});

describe("similaridade de titulo", () => {
  test("mesmo titulo com acento/caixa/pontuacao diferentes bate 1.0", () => {
    const a = "RELATÓRIO de Auditoria — TAC IBAMA, 2024";
    const b = "relatorio de auditoria tac ibama 2024";
    expect(similaridadeTitulo(a, b)).toBe(1);
  });

  test("titulo sobre outra coisa da perto de zero", () => {
    expect(
      similaridadeTitulo("Relatorio de auditoria do TAC", "Edital de licitacao numero 3")
    ).toBeLessThan(0.2);
  });

  test("string vazia nao gera similaridade falsa", () => {
    expect(similaridadeTitulo("", "relatorio")).toBe(0);
  });
});

describe("corpoConfere — 200 e mente vira reprovacao", () => {
  test("PDF que comeca com %PDF confere", () => {
    expect(corpoConfere("https://x.gov.br/a.pdf", "%PDF-1.7 ...").confere).toBe(true);
  });

  test("URL de PDF servindo HTML e mentira", () => {
    const r = corpoConfere("https://x.gov.br/a.pdf", "<html><body>404</body></html>");
    expect(r.confere).toBe(false);
  });

  test("HTML com marcador de erro mole e mentira", () => {
    const r = corpoConfere(
      "https://x.gov.br/pagina",
      "<html><title>Erro</title><body>Página não encontrada</body></html>"
    );
    expect(r.confere).toBe(false);
  });

  test("sem corpo amostrado nao reprova (HEAD puro)", () => {
    expect(corpoConfere("https://x.gov.br/a.pdf", null).confere).toBe(true);
  });
});

describe("avaliarCandidato", () => {
  const base: Parameters<typeof avaliarCandidato>[0] = {
    urlVelha: "https://www.gov.br/anp/antigo.pdf",
    urlCandidata: "https://www.gov.br/anp/novo.pdf",
    statusHttp: 200,
    contentType: "application/pdf",
    corpoInicial: "%PDF-1.7",
    tituloItem: "Painel dinamico do abastecimento",
    tituloCandidato: "Painel dinamico do abastecimento 2024",
  };

  test("candidato que bate em tudo e aceito, com os criterios gravados", () => {
    const r = avaliarCandidato(base);
    expect(r.aceito).toBe(true);
    expect(r.criterios).toContain("vivo-2xx");
    expect(r.criterios).toContain("dominio-oficial");
    expect(r.criterios).toContain("tipo-igual-pdf");
    expect(r.criterios).toContain("corpo-confere");
    expect(r.criterios).toContain("titulo-similar");
  });

  test("status 403 NAO e vivo para candidato (protegido nao substitui publico)", () => {
    const r = avaliarCandidato({ ...base, statusHttp: 403 });
    expect(r.aceito).toBe(false);
    expect(r.motivos.some((m) => m.startsWith("vivo:"))).toBe(true);
  });

  test("dominio nao oficial reprova mesmo com tudo mais certo", () => {
    const r = avaliarCandidato({
      ...base,
      urlCandidata: "https://algum-site.com/novo.pdf",
    });
    expect(r.aceito).toBe(false);
    expect(r.motivos.some((m) => m.startsWith("dominio:"))).toBe(true);
  });

  test("PDF servido como HTML reprova (tipo diferente + corpo nao confere)", () => {
    const r = avaliarCandidato({
      ...base,
      contentType: "text/html",
      corpoInicial: "<html>erro</html>",
    });
    expect(r.aceito).toBe(false);
    expect(r.motivos.some((m) => m.startsWith("tipo:"))).toBe(true);
    expect(r.motivos.some((m) => m.startsWith("corpo:"))).toBe(true);
  });

  test("R2 de fontes e dominio aceitavel para candidato", () => {
    const r = avaliarCandidato({
      ...base,
      urlCandidata: "https://pub-abc123.r2.dev/ab/abc123.pdf",
    });
    expect(r.aceito).toBe(true);
    expect(r.criterios).toContain("dominio-r2-ou-proprio");
  });

  test("sem titulo conhecido: critico registrado, outros criterios decidem", () => {
    const r = avaliarCandidato({ ...base, tituloItem: null, tituloCandidato: null });
    expect(r.aceito).toBe(true);
    expect(r.criterios).toContain("titulo-nao-avaliado");
  });

  test("com titulo, candidato sobre outro assunto reprova por similaridade", () => {
    const r = avaliarCandidato({
      ...base,
      tituloCandidato: "Edital de pregao eletronico 42",
    });
    expect(r.aceito).toBe(false);
    expect(r.motivos.some((m) => m.startsWith("titulo:"))).toBe(true);
  });
});
