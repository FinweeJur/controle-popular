import { describe, expect, test } from "vitest";

import { TEMA_AJRI_ORDEM } from "./auditoria-ajri";
import { bibliotecaAti, temasDaBiblioteca } from "./biblioteca";
import { coberturaTemasAti, MAPA_TEMA_ATI_PARA_AJRI, temasAjriDoItemBiblioteca } from "./temas-ati";

/**
 * Contrato da ponte tema-livre-da-biblioteca → `TemaAjri`.
 *
 * O que estes testes travam não é uma opinião sobre qual mapa é "certo" — é
 * que a tabela (1) cobre todo tema livre que o acervo de verdade usa, (2)
 * nunca aponta para um `TemaAjri` inventado, e (3) a cobertura resultante é
 * um número medido e travado, não uma estimativa. Uma régua nova que muda
 * silenciosamente esse número precisa quebrar este arquivo primeiro.
 */
describe("ponte tema-livre-da-biblioteca -> TemaAjri", () => {
  test("todo tema livre observado no acervo real tem entrada na tabela — mapeada ou não", async () => {
    const itens = await bibliotecaAti();
    const observados = temasDaBiblioteca(itens);
    const semEntrada = observados.filter((t) => !(t in MAPA_TEMA_ATI_PARA_AJRI));
    expect(semEntrada).toEqual([]);
  });

  test("a tabela não tem entrada morta — toda chave corresponde a um tema realmente observado", async () => {
    const itens = await bibliotecaAti();
    const observados = new Set(temasDaBiblioteca(itens));
    const chavesMortas = Object.keys(MAPA_TEMA_ATI_PARA_AJRI).filter((t) => !observados.has(t));
    expect(chavesMortas).toEqual([]);
  });

  test("nenhuma entrada da tabela aponta para um TemaAjri fora do vocabulário controlado", () => {
    const validos = new Set(TEMA_AJRI_ORDEM);
    const invalidos = Object.values(MAPA_TEMA_ATI_PARA_AJRI)
      .flat()
      .filter((t) => !validos.has(t));
    expect(invalidos).toEqual([]);
  });

  test("26 temas livres conhecidos, 11 mapeados e 15 sem mapa por decisão — não por esquecimento", () => {
    const chaves = Object.keys(MAPA_TEMA_ATI_PARA_AJRI);
    expect(chaves.length).toBe(26);
    const mapeados = chaves.filter((t) => MAPA_TEMA_ATI_PARA_AJRI[t].length > 0);
    expect(mapeados.length).toBe(11);
    expect(chaves.length - mapeados.length).toBe(15);
  });

  test("temasAjriDoItemBiblioteca dedup e ignora tema livre sem mapa", () => {
    expect(
      temasAjriDoItemBiblioteca({ temas: ["Participação Informada", "Anexo I.1"] })
    ).toEqual(["comunicacao-e-relacionamento"]);
    // duas entradas livres que caem no MESMO TemaAjri não duplicam
    expect(
      temasAjriDoItemBiblioteca({ temas: ["Participação Informada", "Espaços Participativos"] })
    ).toEqual(["comunicacao-e-relacionamento"]);
    // tema livre desconhecido (fora da tabela) não derruba, só não contribui
    expect(temasAjriDoItemBiblioteca({ temas: ["Um Tema Que Não Existe"] })).toEqual([]);
    expect(temasAjriDoItemBiblioteca({ temas: [] })).toEqual([]);
  });

  /**
   * O número em si (238/645): medido em 2026-08-21 sobre o acervo publicado de
   * verdade (597 AEDAS/Guaicuy com tema livre + 48 NACAB sem tema declarado,
   * que por isso não somam nada ao numerador). Ver o motivo de cada mapa no
   * cabeçalho de `temas-ati.ts`. Se este teste quebrar depois de uma coleta
   * nova, o número mudou porque o ACERVO cresceu (esperado) — revise o valor
   * aqui deliberadamente. Se quebrar sem nenhuma coleta nova, a REGRA de
   * mapeamento mudou, e é isso que este teste existe para pegar.
   */
  test("cobertura travada: 238 dos 597 itens do acervo ganham ao menos um TemaAjri", async () => {
    const cobertura = await coberturaTemasAti();
    // ⟲ 597, não 645: os 48 do NACAB foram REVERTIDOS do acervo publicado em
    // 21/08, porque apontavam direto para o `.pdf` — e a biblioteca aponta
    // para a PÁGINA da fonte, nunca para o arquivo (regra travada em
    // `biblioteca.test.ts`). O mapa de temas segue valendo para quando o
    // NACAB entrar pela via certa; o que muda aqui é só o denominador.
    expect(cobertura.total).toBe(597);
    expect(cobertura.comTemaAjri).toBe(238);
  });

  test("o acervo publicado ainda não tem NACAB — entra quando houver URL de página", async () => {
    const itens = await bibliotecaAti();
    expect(itens.filter((i) => i.ati === "nacab")).toEqual([]);
  });
});
