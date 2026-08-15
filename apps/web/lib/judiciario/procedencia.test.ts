import { describe, it, expect } from "vitest";
import { resumoProcedencia, fontesDaComposicao } from "./procedencia";

const comDoc = (url: string | null) => ({ url_fonte: url });

describe("resumoProcedencia", () => {
  it("não declara nada quando não há indicação", () => {
    expect(resumoProcedencia([]).frase).toBeNull();
    expect(resumoProcedencia(null).frase).toBeNull();
    // `listarNomeacoes` devolve `null` — e não `[]` — quando não há banco
    // configurado (`getDb()` nulo). A página passa esse `null` direto para
    // cá, então o caso não é hipotético.
    expect(resumoProcedencia(undefined).total).toBe(0);
  });

  it("conta só quem tem documento e expõe os dois números", () => {
    const r = resumoProcedencia([comDoc("https://legis.senado.leg.br/x"), comDoc(null), comDoc(null)]);
    expect(r.comDocumento).toBe(1);
    expect(r.total).toBe(3);
    expect(r.frase).toContain("1 de 3");
  });

  it("não conta url vazia ou em branco como documento publicado", () => {
    // O ETL grava `url_documento` direto do que a API do Senado devolve. Se
    // vier string vazia, sem este filtro a tela declararia cobertura que a
    // linha não tem — e a linha não mostraria link nenhum, porque o JSX
    // testa o mesmo valor por veracidade.
    const r = resumoProcedencia([comDoc(""), comDoc("   "), comDoc("https://legis.senado.leg.br/y")]);
    expect(r.comDocumento).toBe(1);
    expect(r.cobertura).toBeCloseTo(1 / 3);
  });

  it("diz explicitamente quando NENHUMA tem documento, em vez de calar", () => {
    // O modo de falha que esta entrega existe para não repetir: a página
    // afirmava procedência clicável e não entregava nenhuma. Zero precisa
    // ser declarado, não omitido.
    const r = resumoProcedencia([comDoc(null), comDoc(null)]);
    expect(r.frase).toContain("Nenhuma das 2");
    expect(r.comDocumento).toBe(0);
  });

  it("concorda em singular quando há uma só indicação", () => {
    expect(resumoProcedencia([comDoc("https://legis.senado.leg.br/z")]).frase).toContain(
      "1 de 1 indicação listada"
    );
  });

  it("reproduz a proporção medida no corpus F0 do Senado", () => {
    // 35 de 130 indicações judiciais com `urlDocumento` em
    // `docs/judiciario/f0-corpus-indicacoes.json` (varredura 2003–2026).
    // O teste trava a ORDEM DE GRANDEZA: se algum dia a maioria passar a
    // ter documento, a frase da tela continua correta, mas vale saber que
    // a premissa "o Senado publica na minoria" mudou.
    const corpus = [
      ...Array.from({ length: 35 }, (_, i) => comDoc(`https://legis.senado.leg.br/d?dm=${i}`)),
      ...Array.from({ length: 95 }, () => comDoc(null)),
    ];
    const r = resumoProcedencia(corpus);
    expect(r.total).toBe(130);
    expect(r.comDocumento).toBe(35);
    expect(r.cobertura).toBeLessThan(1 / 3);
    expect(r.frase).toContain("35 de 130");
  });
});

describe("fontesDaComposicao", () => {
  // Strings reais de `etl/judiciario/etl/dados/composicao-*.json`.
  const TST = "https://www.tst.jus.br/ministros";
  const STM =
    "https://www.stm.jus.br/institucional/conheca-o-superior-tribunal-militar/composicao-da-corte";
  const STJ_SEM_URL = "stj.jus.br — Composição do STJ (PDF)";

  it("vira link quando a fonte é URL", () => {
    expect(fontesDaComposicao([{ fonte_curadoria: TST }])).toEqual([{ nome: TST, url: TST }]);
  });

  it("NÃO vira link quando a fonte não é URL", () => {
    // O caso do STJ. `href="stj.jus.br — …"` seria resolvido como caminho
    // relativo ao próprio portal: um link com cara de fonte oficial que
    // aponta para dentro de casa. Fonte sem URL fica texto.
    const [f] = fontesDaComposicao([{ fonte_curadoria: STJ_SEM_URL }]);
    expect(f).toEqual({ nome: STJ_SEM_URL });
    expect(f.url).toBeUndefined();
  });

  it("credita uma vez só, mesmo com 27 integrantes da mesma fonte", () => {
    const tribunal = Array.from({ length: 27 }, () => ({ fonte_curadoria: TST }));
    expect(fontesDaComposicao(tribunal)).toHaveLength(1);
  });

  it("mantém fontes distintas quando a composição veio de mais de um lugar", () => {
    const mistos = [{ fonte_curadoria: TST }, { fonte_curadoria: STM }, { fonte_curadoria: TST }];
    expect(fontesDaComposicao(mistos).map((f) => f.nome)).toEqual([TST, STM]);
  });

  it("ignora integrante sem fonte em vez de creditar vazio", () => {
    const r = fontesDaComposicao([
      { fonte_curadoria: null },
      { fonte_curadoria: "" },
      { fonte_curadoria: "   " },
      { fonte_curadoria: TST },
    ]);
    expect(r).toEqual([{ nome: TST, url: TST }]);
  });
});
