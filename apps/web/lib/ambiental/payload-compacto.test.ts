import { describe, expect, it } from "vitest";
import { compactar, expandir, _ORDEM_PARA_TESTE } from "./payload-compacto";
import type { LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";

/**
 * A tupla troca ~1,9 MiB de nomes de campo por uma ordem posicional — e
 * introduz, em troca, um modo de falha novo: trocar duas posições grava campo
 * errado sem erro de tipo nem de runtime. `ementa` e `data` são ambos
 * `string | null`; invertê-las passaria por `tsc` e publicaria a data no lugar
 * do texto da norma.
 *
 * Por isso o teste central aqui é ida-e-volta com igualdade PROFUNDA, e não
 * uma amostragem de campos: só ela pega troca de posição entre campos do mesmo
 * tipo.
 */

function linha(over: Partial<LegislacaoAmbientalRow> = {}): LegislacaoAmbientalRow {
  return {
    fonte: "siam",
    esfera: "estadual",
    situacao: "VIGENTE",
    tipo: "PORTARIA",
    numero: "1874",
    ano: 2012,
    ementa: "Dispõe sobre o licenciamento ambiental.",
    data: "2012-05-14",
    orgao: "SEMAD",
    linkPdf: "https://www.siam.mg.gov.br/sla/download.pdf?idNorma=1874",
    chaveDedup: "PORTARIA:1874:2012",
    temas: ["Recursos Hídricos"],
    tags: ["Licenciamento Ambiental"],
    ...over,
  } as LegislacaoAmbientalRow;
}

describe("payload compacto da legislação ambiental", () => {
  it("ida e volta preserva a linha inteira, campo a campo", () => {
    const original = [
      linha(),
      linha({ fonte: "mma", esfera: "nacional", tipo: "RESOLUÇÃO CONAMA", ano: 1997 }),
      linha({ fonte: "cndh", esfera: "nacional", tipo: "Recomendação", chaveDedup: null }),
    ];
    // `chaveDedup` é o único campo que muda de natureza de propósito (vira id
    // de grupo), então é comparado à parte, logo abaixo.
    const semChave = (l: LegislacaoAmbientalRow[]) => l.map(({ chaveDedup, ...r }) => r);
    expect(semChave(expandir(compactar(original)))).toEqual(semChave(original));
  });

  it("nulo continua nulo — e não vira string vazia nem sobra do dicionário", () => {
    const original = [
      // `tipo` fica de fora: é o único não-anulável do tipo da linha.
      linha({
        situacao: null, numero: null, ano: null, ementa: null,
        data: null, orgao: null, linkPdf: null, chaveDedup: null,
        temas: [], tags: [],
      }),
    ];
    const volta = expandir(compactar(original))[0];
    expect(volta.situacao).toBeNull();
    expect(volta.numero).toBeNull();
    expect(volta.ano).toBeNull();
    expect(volta.ementa).toBeNull();
    expect(volta.data).toBeNull();
    expect(volta.linkPdf).toBeNull();
    expect(volta.chaveDedup).toBeNull();
    expect(volta.temas).toEqual([]);
    expect(volta.tags).toEqual([]);
  });

  it("link sem prefixo http reconstrói igual", () => {
    const original = [linha({ linkPdf: "/arquivo/local.pdf" })];
    expect(expandir(compactar(original))[0].linkPdf).toBe("/arquivo/local.pdf");
  });

  it("dedup: mesma chave em DUAS fontes vira grupo; sozinha não vira", () => {
    const original = [
      linha({ fonte: "siam", chaveDedup: "PORTARIA:1:2020" }),
      linha({ fonte: "semad", chaveDedup: "PORTARIA:1:2020" }),
      linha({ fonte: "almg", chaveDedup: "LEI:99:2020" }),
    ];
    const volta = expandir(compactar(original));
    // As duas que compartilham a chave continuam agrupando juntas...
    expect(volta[0].chaveDedup).not.toBeNull();
    expect(volta[0].chaveDedup).toBe(volta[1].chaveDedup);
    // ...e a solitária não gera dica nenhuma, então não paga id.
    expect(volta[2].chaveDedup).toBeNull();
  });

  it("dedup NÃO cruza esferas, mesmo com chave textual idêntica", () => {
    const original = [
      linha({ fonte: "siam", esfera: "estadual", chaveDedup: "LEI:1:2020" }),
      linha({ fonte: "mma", esfera: "nacional", chaveDedup: "LEI:1:2020" }),
    ];
    const volta = expandir(compactar(original));
    // Cada uma ficou sozinha na sua esfera: nenhuma vira grupo.
    expect(volta[0].chaveDedup).toBeNull();
    expect(volta[1].chaveDedup).toBeNull();
  });

  it("o dicionário não repete valor — é isso que paga o formato", () => {
    const c = compactar([linha(), linha(), linha({ numero: "2" })]);
    expect(c.d.situacao).toEqual(["VIGENTE"]);
    expect(c.d.tipo).toEqual(["PORTARIA"]);
    expect(c.d.link).toEqual(["https://www.siam.mg.gov.br/"]);
    expect(c.n).toBe(3);
  });

  it("a ordem da tupla tem o tamanho que `expandir` lê", () => {
    // Sentinela contra acrescentar campo em `ORDEM` e esquecer de `expandir`.
    expect(_ORDEM_PARA_TESTE.length).toBe(compactar([linha()]).l[0].length);
  });
});
